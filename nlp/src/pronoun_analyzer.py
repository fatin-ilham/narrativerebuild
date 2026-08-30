"""NarrativeRebuild — Pronoun Shift Analyzer.

A linguistic-analysis microservice that measures the ratio of first-person
pronouns ("I", "me", "my", "mine", "we", "us", ...) to third-person pronouns
("he", "she", "they", "them", "his", "her", "their", ...) within a piece of
expressive writing.

This drives the "Pronoun Shift Tracker": across a 4-day narrative sequence,
growth in first-person (ownership/agency) relative to third-person
(distancing) is a clinically-relevant signal in Pennebaker-style expressive
writing.

Implementation notes:
  - Tokenizes with NLTK's word_tokenize when available and falls back to a
    pure regular expression, so the service runs even without NLTK corpora.
  - Only PORNOUN tokens are classified into first/third person; unclassifiable
    words (nouns, verbs, etc.) are ignored, so ratios reflect pronoun usage
    specifically.
"""

import json
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

try:
    from nltk.tokenize import word_tokenize

    _TOKENIZER = "nltk"
except ImportError:  # pragma: no cover
    _TOKENIZER = "regex"

# ---------------------------------------------------------------------------
# Pronoun lexicons
# ---------------------------------------------------------------------------

FIRST_PERSON = {
    # subject / object / possessive
    "i", "me", "my", "mine", "myself",
    "we", "us", "our", "ours", "ourselves",
}

THIRD_PERSON = {
    # singular
    "he", "him", "his", "himself",
    "she", "her", "hers", "herself",
    "it", "its", "itself",
    # singular they
    "they", "them", "their", "theirs", "themself",
    # plural
    "themselves",
}

_NL_PATTERN = re.compile(r"[a-zA-Z']+")


def _tokenize(text: str):
    """Tokenize raw text into lowercase word tokens."""
    if _TOKENIZER == "nltk":
        try:
            return [t.lower() for t in word_tokenize(text)]
        except Exception:  # pragma: no cover - fall back on any tokenizer failure
            return _NL_PATTERN.findall(text.lower())
    return _NL_PATTERN.findall(text.lower())


def analyze_pronouns(text: str):
    """Compute first- vs third-person pronoun percentages for `text`.

    Returns a dict with raw counts and the relative share (0-100) that each
    person class makes up of detected personal pronouns. When no pronouns are
    present, both percentages are 0.
    """
    if not text or not text.strip():
        return {
            "firstCount": 0,
            "thirdCount": 0,
            "firstPercent": 0.0,
            "thirdPercent": 0.0,
            "subjectiveRatio": None,
            "message": "empty",
            "tokenizer": _TOKENIZER,
        }

    first = 0
    third = 0
    for token in _tokenize(text):
        if token in FIRST_PERSON:
            first += 1
        elif token in THIRD_PERSON:
            third += 1

    total = first + third
    if total == 0:
        return {
            "firstCount": 0,
            "thirdCount": 0,
            "firstPercent": 0.0,
            "thirdPercent": 0.0,
            "subjectiveRatio": None,
            "message": "no-pronouns",
            "tokenizer": _TOKENIZER,
        }

    first_percent = (first / total) * 100.0
    third_percent = (third / total) * 100.0

    return {
        "firstCount": first,
        "thirdCount": third,
        "firstPercent": round(first_percent, 2),
        "thirdPercent": round(third_percent, 2),
        # Ratio > 1 indicates ownership/self-focus; < 1 indicates distancing.
        "subjectiveRatio": round(first / third, 4) if third else None,
        "tokenizer": _TOKENIZER,
    }


# ---------------------------------------------------------------------------
from coherence_analyzer import analyze_coherence

# ---------------------------------------------------------------------------
# HTTP layer
# ---------------------------------------------------------------------------

class Handler(BaseHTTPRequestHandler):
    def _send(self, status: int, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        if path not in ("/analyze", "/analyze/pronouns", "/analyze/coherence"):
            self._send(404, {"error": "not found"})
            return

        length = self.headers.get("Content-Length")
        try:
            raw = self.rfile.read(int(length)) if length else b""
        except Exception:
            self._send(400, {"error": "invalid body"})
            return

        try:
            payload = json.loads(raw.decode("utf-8")) if raw else {}
        except json.JSONDecodeError:
            self._send(400, {"error": "invalid JSON"})
            return

        text = payload.get("text", "")
        if not isinstance(text, str):
            self._send(400, {"error": "text must be a string"})
            return

        if path == "/analyze/coherence":
            result = analyze_coherence(text)
            result["analyzer"] = "coherence-parser"
            self._send(200, result)
            return

        # Default /analyze and /analyze/pronouns
        result = analyze_pronouns(text)
        result["analyzer"] = "pronoun-shift"
        # Also include coherence analysis if requested or on general /analyze
        coherence = analyze_coherence(text)
        result["coherence"] = coherence
        self._send(200, result)

    def log_message(self, *args):  # silence default logging noise
        pass


def main():
    import sys
    import os
    # Ensure local directory is on python path for importing coherence_analyzer
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    port = int(os.environ.get("PORT", "5000"))
    httpd = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"[nlp] Linguistic Analysis Microservice on :{port} (Pronoun Shift & Coherence Parser, tokenizer={_TOKENIZER})")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
