
import os
import time
import logging
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

logger = logging.getLogger("llm_config")

# ─── Model selection ───────────────────────────────────────────────────────────
GEMINI_MODEL    = "gemini-1.5-flash"         # Best free-tier Gemini model
HF_MODEL        = "mistralai/Mistral-7B-Instruct-v0.3"  # HuggingFace fallback

# ─── Rate-limit guard (free tier = 15 RPM) ────────────────────────────────────
INTER_REQUEST_DELAY_SEC = 4  # wait 4s between every LLM call
MAX_RETRIES             = 3
RETRY_BASE_DELAY_SEC    = 8  # exponential backoff base

# ─── Credentials from environment ─────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
HF_API_TOKEN   = os.getenv("HF_API_TOKEN", "")


def get_gemini_client():
    """Returns a configured Gemini client, or None if no key present."""
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set — Gemini unavailable.")
        return None
    try:
        from google import genai
        # Explicitly remove GOOGLE_API_KEY if present so we use the user's key
        if "GOOGLE_API_KEY" in os.environ:
            del os.environ["GOOGLE_API_KEY"]
        return genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        logger.error(f"Gemini init failed: {e}")
        return None


def call_gemini(prompt: str, client=None) -> str | None:
    """Call Gemini with retry + rate-limit logic. Returns text or None."""
    if client is None:
        client = get_gemini_client()
    if client is None:
        return None

    for attempt in range(MAX_RETRIES):
        try:
            time.sleep(INTER_REQUEST_DELAY_SEC)
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            err = str(e).lower()
            if "429" in err or "quota" in err or "resource_exhausted" in err:
                wait = RETRY_BASE_DELAY_SEC * (2 ** attempt)
                logger.warning(f"Rate limited (attempt {attempt+1}/{MAX_RETRIES}). Waiting {wait}s...")
                time.sleep(wait)
            else:
                logger.error(f"Gemini call failed: {e}")
                return None
    return None


def call_huggingface(prompt: str) -> str | None:
    """Call HuggingFace Inference API as a fallback. Returns text or None."""
    if not HF_API_TOKEN:
        logger.warning("HF_API_TOKEN not set — HuggingFace fallback unavailable.")
        return None
    try:
        import requests
        headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
        payload = {
            "inputs": prompt,
            "parameters": {"max_new_tokens": 400, "temperature": 0.7}
        }
        url = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
        time.sleep(INTER_REQUEST_DELAY_SEC)
        r = requests.post(url, headers=headers, json=payload, timeout=30)
        r.raise_for_status()
        result = r.json()
        if isinstance(result, list) and result:
            text = result[0].get("generated_text", "")
            # Strip the prompt prefix that HF echoes back
            return text.replace(prompt, "").strip()
        return None
    except Exception as e:
        logger.error(f"HuggingFace call failed: {e}")
        return None


def generate(prompt: str, model=None) -> str:
    """
    Main entry point. Tries Gemini first, then HuggingFace, then returns a
    high-quality heuristic fallback so the pipeline never crashes.
    """
    result = call_gemini(prompt, model)
    if result:
        return result

    result = call_huggingface(prompt)
    if result:
        return result

    logger.warning("Both LLM backends unavailable — using heuristic fallback.")
    return ""  # Caller handles empty string gracefully
