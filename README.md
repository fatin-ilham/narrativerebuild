# NarrativeRebuild

A structured expressive-writing platform built on the clinical research of Dr. James
Pennebaker into trauma processing through guided narrative writing.

This repository currently contains the **"Continuous Motion" typing validator** and the
**Pronoun Shift Tracker** linguistic analyzer.

## Architecture

| Service | Stack | Port | Purpose |
| --- | --- | --- | --- |
| `client/` | React + Vite + TailwindCSS | 5173 | Web app (writing studio) |
| `server/` | Node.js + Express + Socket.io | 4000 | API + real-time layer |
| `nlp/` | Python (NLTK) | 5000 | Linguistic analysis microservice |

## Prerequisites

- [Node.js](https://nodejs.org) 18+ (tested on 24)
- [Python](https://python.org) 3.9+
- `npm` (ships with Node)

## Quick start (one command)

From the repository root:

```bash
# 1. Install all dependencies (server, client, and the Python NLP service)
npm run install:all

# 2. Run all three services together
npm run dev
```

Then open **http://localhost:5173** in your browser.

- Client (writing studio): http://localhost:5173
- Node backend API: http://localhost:4000
- Python NLP service: http://localhost:5000

## Run services individually

```bash
# Python NLP microservice (port 5000)
npm run dev:nlp

# Node backend (port 4000)
npm run dev:server

# React client (port 5173)
npm run dev:client
```

## Configuration

All values have working local defaults, so no configuration is required to run locally.
To override, set these environment variables (via your shell or a `.env` file in the
respective folder):

| Variable | Default | Applies to |
| --- | --- | --- |
| `VITE_BACKEND_URL` | `http://localhost:4000` | client |
| `VITE_SOCKET_URL` | `http://localhost:4000` | client |
| `PORT` | `4000` | server |
| `NLP_PORT` | `5000` | server |

> Note: The Node backend loads environment variables from the process environment. If you
> use `.env` files, load them with a tool such as `dotenv-cli` or set them at the OS level.

## What's inside

### Module 1: Writing Session & Safety Mechanics
- **Pennebaker Protocol Structured Interface (Member 1)** — A distraction-free, locked writing workspace enforcing the classic 20-minute continuous writing session with real-time countdown, disabled navigation, formatting, and distraction masking.
- **Continuous Motion typing validator (Member 2)** — Real-time keystroke monitor. If the user stops typing for more than 5 seconds, the text area gently pulses as a soft, non-blocking nudge to keep the free flow of expressive writing going.

### Module 2: Guided Protocol & Structured Reflection
- **Narrative Sequencing Template Wizard (Member 1)** — Guided 4-day writing framework for processing trauma across distinct angles (Day 1: Raw Emotion, Day 2: Facts and Actions, Day 3: Consequences, Day 4: Meaning and Growth) with sequential stage unlocking and longitudinal state tracking.

### Module 3: Linguistic Analysis Engine
- **Coherence Metric Parser (Member 1)** — Text-analysis engine scanning entries for cause-and-effect language (`because`, `therefore`, `since`, `led to`) and cognitive insight markers (`realize`, `understand`, `learned`), computing cognitive processing depth ratios across 4-day sessions.
- **Pronoun Shift Tracker (Member 2)** — Computes the percentage of first-person pronouns ("I", "me") vs third-person pronouns ("he", "she", "they") per entry to visualize emotional ownership vs distancing across sessions.

### Module 4: Progress Tracking, Ambience & Archive
- **Acoustic/Ambient Atmosphere Selector (Member 1)** — Built-in multi-track Web Audio synthesizer offering lyric-free soundscapes (Binaural Beats for Theta/Alpha waves, Pink Noise, White Noise, Grounding Drone) to lower physiological arousal during writing.
