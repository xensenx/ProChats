# ProChat

ProChat is a browser-first anime character chat app with two runtime modes:

1. **User API Key Mode** (client-only): users provide their own Google API key and the browser calls Gemma directly.
2. **Admin Mode** (hybrid): the browser authenticates with a password and then sends prompts to serverless endpoints that proxy NVIDIA or Google models.

The project is intentionally lightweight (vanilla HTML/CSS/JS + 2 serverless endpoints), with persistent local chat history and PWA support.

## Table of Contents

- [What the App Does](#what-the-app-does)
- [Architecture Overview](#architecture-overview)
- [Model Guide](#model-guide)
- [Prompting and Character Design](#prompting-and-character-design)
- [State, Persistence, and Navigation](#state-persistence-and-navigation)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [PWA / Offline Behavior](#pwa--offline-behavior)
- [Setup](#setup)
- [Run and Deploy](#run-and-deploy)
- [Privacy and Security Notes](#privacy-and-security-notes)
- [Known Limitations](#known-limitations)
- [License](#license)

## What the App Does

- Provides chat experiences with three predefined characters:
  - **Frieren**
  - **Nao Tomori**
  - **Thorfinn**
- Uses character-specific system prompts to enforce roleplay style and concise response behavior.
- Supports:
  - **Per-character persistent conversation history** in `localStorage`
  - **Export conversations** as JSON files
  - **Admin-only model switching** from a visual model selection screen

## Architecture Overview

### Frontend

- **`index.html`** contains a multi-screen single-page UI:
  - landing
  - access method selection
  - admin model selection
  - character selection
  - chat view
- **`app.js`** manages:
  - app state
  - screen transitions
  - authentication flow (API key/admin password)
  - chat orchestration
  - AI request routing
  - local storage persistence
- **`styles.css`** implements all visual styling, responsive layout, and interaction states.

### Backend (Serverless)

- **`api/validate.js`** validates admin password against `ADMIN_PASSWORD` and returns a deterministic password-derived version hash.
- **`api/chat.js`** routes chat requests to either:
  - NVIDIA Chat Completions API for most admin models, or
  - Google Generative Language API for admin Gemma mode.

### Request flow by mode

- **User API Key Mode**
  - Browser validates key directly against Google.
  - Browser sends subsequent chat requests directly to Google Gemma endpoint.
  - No backend required for model inference in this mode.

- **Admin Mode**
  - Browser submits password to `/api/validate`.
  - Browser sends model + prompt payload to `/api/chat`.
  - Serverless endpoint calls NVIDIA or Google based on selected admin model.

## Model Guide

Admin model labels shown in the UI map to concrete provider model IDs in `api/chat.js`:

| UI Label | Internal Key | Provider | Model ID | Notes |
|---|---|---|---|---|
| Fast | `fast` | NVIDIA | `meta/llama-3.1-8b-instruct` | Lowest latency profile in UI. |
| Balanced | `balanced` | NVIDIA | `meta/llama-3.1-70b-instruct` | Default fallback if key is unknown. |
| Smart | `smart` | NVIDIA | `mistralai/mixtral-8x22b-instruct` | Reasoning-oriented option. |
| Pro | `pro` | NVIDIA | `meta/llama-3.1-405b-instruct` | Highest-capacity option in list. |
| Experimental | `experimental` | NVIDIA | `deepseek-ai/deepseek-v3.2` | Tagged as experimental in UI. |
| Gemma | `gemma` | Google | `gemma-3-27b-it` | Uses Google endpoint, not NVIDIA. |

### Mode-specific model behavior

- **User mode always uses Google Gemma (`gemma-3-27b-it`)**, authenticated with the user-provided API key.
- **Admin mode uses selected model key** and server-side API keys from environment variables.
- For NVIDIA requests, prompts are structured in chat format with:
  - `system` message from selected character prompt
  - recent chat history (up to 30 messages at backend level)
  - current user message
- For Gemma requests (both frontend direct and backend helper), history is flattened into a single text prompt with sections:
  - SYSTEM INSTRUCTION
  - CONVERSATION HISTORY
  - USER MESSAGE

## Prompting and Character Design

Each character in `app.js` defines:

- display metadata (name, image, role)
- a **long-form system prompt** encoding:
  - identity/background
  - personality
  - speech style
  - strict rules (response length, emotional expression constraints, and in-character behavior)

The app sends a synthetic first message (`"Greet the user warmly in character. Be welcoming."`) when a character conversation starts with no history, so new sessions begin in-character immediately.

## State, Persistence, and Navigation

### App state object

`app.js` maintains a single state tree including:

- current screen
- access mode (`user` or `admin`)
- user API key (user mode)
- admin password version hash (admin mode)
- selected model
- selected character
- per-character message arrays

### Persistence

- Entire state persists to `localStorage` key: **`prochat_state`**.
- On load, state is merged into defaults.
- Reset clears this key and reloads the page.

### Admin password version locking

To prevent stale admin sessions after password rotation:

- `/api/validate` returns a simple hash-derived `version` from `ADMIN_PASSWORD`.
- Frontend stores this `adminVersion` after login.
- On re-entry, frontend checks current version via `/api/validate` and forces re-auth if changed.

### Context windows

- Frontend sends only the most recent **15** messages to generation calls (`CONFIG.contextLimit`).
- Backend may include up to **30** history items when forwarding to providers.

## Project Structure

```text
ProChats/
├── api/
│   ├── chat.js              # Model routing + provider API calls
│   └── validate.js          # Admin password validation + version hash
├── assets/
│   ├── Frieren.png
│   ├── Nao-Tomori.png
│   └── Thorfinn.png
├── app.js                   # Core app logic and state machine
├── index.html               # Multi-screen SPA markup
├── manifest.webmanifest     # PWA manifest
├── styles.css               # Full UI styling
├── sw.js                    # Service worker (cache-first fallback behavior)
├── package.json
├── LICENSE.md
└── README.md
```

## API Endpoints

### `POST /api/validate`

Validates the submitted admin password.

**Request body**

```json
{ "password": "..." }
```

**Response body**

```json
{ "valid": true, "version": 123456789 }
```

- `version` is a deterministic numeric hash of `ADMIN_PASSWORD`, used by the client to detect password changes.

### `POST /api/chat`

Routes admin chat calls to model providers.

**Request body**

```json
{
  "message": "user text",
  "character": "frieren",
  "model": "balanced",
  "systemPrompt": "...",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response body**

```json
{
  "response": "model output",
  "metadata": {
    "model": "meta/llama-3.1-70b-instruct",
    "mode": "balanced"
  }
}
```

## PWA / Offline Behavior

- Service worker caches app shell assets on install (`index.html`, CSS, JS, manifest, character images).
- On fetch:
  - tries network first,
  - updates cache with fresh responses,
  - falls back to cached responses,
  - and finally falls back to cached `/index.html`.

This gives installable PWA behavior and resilient reloads in degraded network conditions.

## Setup

### Prerequisites

- A static hosting setup that can serve the frontend.
- Serverless function hosting (e.g., Vercel) for `api/` endpoints if using admin mode.
- API keys:
  - NVIDIA key for NVIDIA models
  - Google key for backend Gemma (admin gemma mode)
  - Optional user-provided Google keys in user mode

### Environment variables

Set these for serverless runtime:

- `ADMIN_PASSWORD` — required for admin login.
- `NVIDIA_API_KEY` — required for `fast`, `balanced`, `smart`, `pro`, `experimental`.
- `GEMMA_API_KEY` — required for admin `gemma` model path.

## Run and Deploy

This repo is mostly static frontend + serverless endpoints. Typical options:

1. **Deploy to Vercel** (recommended):
   - root static files served directly
   - `api/*.js` exposed as serverless functions
   - configure environment variables in project settings
2. **Alternative hosts**:
   - Any platform that supports static files + Node-style serverless handlers.

For local frontend-only inspection, opening `index.html` works for UI browsing, but admin endpoints and production-like routing require a local server/runtime.

## Privacy and Security Notes

- Chat content is stored in browser `localStorage` (per browser profile/device).
- In user mode, your browser sends prompts directly to Google API with your key.
- In admin mode, prompts are sent to your hosted `/api/chat` endpoint and then forwarded to providers.
- `Access-Control-Allow-Origin` is currently set to `*` in endpoints; tighten this in production if needed.
- Password comparison in `/api/validate` is plain equality against environment variable and is not a full auth/session system.

## Known Limitations

- Export feature downloads multiple `.json` files individually (not a true zip archive).
- No streaming token output in UI.
- Error handling is user-friendly but minimal (generic error messages on provider failures).
- No automated tests are currently configured in `package.json`.

## License

This project is **not open-source**. See `LICENSE.md` for the full terms.
