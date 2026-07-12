---
name: SentinelDNA backend setup
description: How the Python FastAPI backend is installed and started in this Replit environment.
---

## Python runtime
Installed via `installProgrammingLanguage({ language: "python-3.11" })`.

## Backend workflow
- Name: "Start backend"
- Command: `cd /home/runner/workspace && python3 -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload`
- outputType: "console", waitForPort: 8000

## Python packages
Core packages installed via `installLanguagePackages`: fastapi, uvicorn[standard], pydantic, networkx, scikit-learn, numpy, requests, python-dotenv.

**Why:** `python-dotenv` is missing from original requirements.txt but imported at module level in `backend/config/llm_config.py` — backend crashes without it.

## google-genai blocked
`google-genai` package is blocked by Replit package firewall. The backend handles this gracefully:
- `llm_config.get_gemini_client()` returns `None` if GEMINI_API_KEY is unset (before importing google.genai)
- `storytelling.py` falls back to heuristic rule-based narratives
- No crash — all endpoints return 200 OK

## Path setup
`backend/api/main.py` adds both `backend/` and project root to sys.path. `shared/` is at project root (not inside `backend/`). DATASETS_DIR = `/home/runner/workspace/datasets` (all 6 JSON files pre-exist).
