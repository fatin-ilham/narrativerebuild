"""NarrativeRebuild — Coherence Metric Parser (Module 3, Member 1).

A text-analysis engine that scans each writing entry for cause-and-effect
language ("because", "therefore", "since", "consequently", "led to" ...) and
cognitive insight / realization markers ("realize", "understand", "comprehend",
"insight", "learned" ...). It computes causal density, insight density, and an
overall cognitive processing depth ratio, serving as a proxy measure of how
deeply a trauma narrative is being integrated and resolved over time.
"""

import re
from typing import Any, Dict, List

try:
    from nltk.tokenize import word_tokenize
    _TOKENIZER = "nltk"
except ImportError:
    _TOKENIZER = "regex"

# ---------------------------------------------------------------------------
# Causal & Cognitive Insight Lexicons
# ---------------------------------------------------------------------------

CAUSAL_WORDS = {
    "because", "since", "therefore", "thus", "consequently", "hence",
    "cause", "caused", "causes", "causing",
    "reason", "reasons", "why", "wherefore", "inasmuch",
    "result", "results", "resulted", "resulting",
    "effect", "effects", "affect", "affects", "affected", "affecting",
    "leads", "led", "leading",
    "depends", "depended", "depending",
    "outcome", "outcomes", "origin", "originated",
    "driven", "drives", "whereby"
}

# Multi-word causal phrases
CAUSAL_PHRASES = [
    "as a result", "because of", "due to", "in order to", "led to",
    "leading to", "so that", "thanks to", "for this reason"
]

INSIGHT_WORDS = {
    "realize", "realizes", "realized", "realizing", "realization",
    "understand", "understands", "understood", "understanding",
    "comprehend", "comprehends", "comprehended", "comprehending", "comprehension",
    "know", "knows", "knew", "knowing", "known", "knowledge",
    "think", "thinks", "thought", "thinking",
    "conclude", "concludes", "concluded", "concluding", "conclusion",
    "meaning", "meanings", "mean", "means", "meant",
    "insight", "insights", "insightful",
    "clarify", "clarifies", "clarified", "clarifying", "clarity",
    "figure", "figured", "figuring",
    "discern", "discerned", "discerning",
    "learn", "learns", "learned", "learning",
    "discover", "discovers", "discovered", "discovering", "discovery",
    "recognize", "recognizes", "recognized", "recognizing", "recognition",
    "perceive", "perceived", "perceiving", "perception",
    "ponder", "pondered", "pondering",
    "reflect", "reflected", "reflecting", "reflection",
    "acknowledge", "acknowledged", "acknowledging",
    "admit", "admitted", "admitting",
    "accept", "accepted", "accepting", "acceptance",
    "resolve", "resolved", "resolving", "resolution",
    "synthesize", "synthesized", "synthesizing", "synthesis"
}

_WORD_PATTERN = re.compile(r"[a-zA-Z']+")


def _tokenize(text: str) -> List[str]:
    """Tokenize raw text into lowercase word tokens."""
    if _TOKENIZER == "nltk":
        try:
            return [t.lower() for t in word_tokenize(text)]
        except Exception:
            return _WORD_PATTERN.findall(text.lower())
    return _WORD_PATTERN.findall(text.lower())


def analyze_coherence(text: str) -> Dict[str, Any]:
    """Compute cause-and-effect language and cognitive insight density metrics.

    Returns detailed counts, densities (% of total words), coherence depth ratio,
    qualitative classification, and matched keywords for UI highlighting.
    """
    if not text or not text.strip():
        return {
            "totalWords": 0,
            "causalCount": 0,
            "causalDensity": 0.0,
            "insightCount": 0,
            "insightDensity": 0.0,
            "totalCoherenceCount": 0,
            "coherenceRatio": 0.0,
            "causalToInsightRatio": None,
            "depthLevel": "Raw / Descriptive Stance",
            "depthScore": 0,
            "detectedCausalWords": [],
            "detectedInsightWords": [],
            "message": "empty",
            "tokenizer": _TOKENIZER,
        }

    lower_text = text.lower()
    tokens = _tokenize(text)
    total_words = max(len([t for t in tokens if t.isalpha() or "'" in t]), 1)

    # 1. Multi-word phrase matching
    detected_causal: Dict[str, int] = {}
    phrase_causal_count = 0
    for phrase in CAUSAL_PHRASES:
        occurrences = len(re.findall(r"\b" + re.escape(phrase) + r"\b", lower_text))
        if occurrences > 0:
            detected_causal[phrase] = occurrences
            phrase_causal_count += occurrences

    # 2. Token-level matching
    detected_insight: Dict[str, int] = {}
    token_causal_count = 0
    token_insight_count = 0

    for token in tokens:
        if token in CAUSAL_WORDS:
            detected_causal[token] = detected_causal.get(token, 0) + 1
            token_causal_count += 1
        elif token in INSIGHT_WORDS:
            detected_insight[token] = detected_insight.get(token, 0) + 1
            token_insight_count += 1

    total_causal = phrase_causal_count + token_causal_count
    total_insight = token_insight_count
    total_coherence = total_causal + total_insight

    causal_density = round((total_causal / total_words) * 100.0, 2)
    insight_density = round((total_insight / total_words) * 100.0, 2)
    coherence_ratio = round((total_coherence / total_words) * 100.0, 2)

    # Cognitive Processing Depth Level classification
    if coherence_ratio >= 6.0:
        depth_level = "High Cognitive Integration"
        depth_score = min(100, int(coherence_ratio * 12))
    elif coherence_ratio >= 3.0:
        depth_level = "Moderate Cognitive Processing"
        depth_score = int(coherence_ratio * 12)
    elif coherence_ratio > 0.0:
        depth_level = "Emerging Causal Reflection"
        depth_score = max(15, int(coherence_ratio * 12))
    else:
        depth_level = "Raw / Descriptive Stance"
        depth_score = 0

    causal_to_insight = (
        round(total_causal / total_insight, 2) if total_insight > 0 else None
    )

    return {
        "totalWords": total_words,
        "causalCount": total_causal,
        "causalDensity": causal_density,
        "insightCount": total_insight,
        "insightDensity": insight_density,
        "totalCoherenceCount": total_coherence,
        "coherenceRatio": coherence_ratio,
        "causalToInsightRatio": causal_to_insight,
        "depthLevel": depth_level,
        "depthScore": depth_score,
        "detectedCausalWords": [
            {"word": k, "count": v} for k, v in sorted(detected_causal.items(), key=lambda x: -x[1])
        ],
        "detectedInsightWords": [
            {"word": k, "count": v} for k, v in sorted(detected_insight.items(), key=lambda x: -x[1])
        ],
        "tokenizer": _TOKENIZER,
    }
