"""
webhook_dispatcher.py  (Remediation — Slack Alert Dispatcher)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fires a beautifully formatted Slack Block Kit alert whenever the
AI Tribunal issues a BLOCK verdict.

Setup (one time):
  1. Go to https://api.slack.com/apps → "Create New App"
  2. Enable "Incoming Webhooks" and generate a URL for your channel
  3. Set your webhook URL:
       Windows PowerShell:
         $env:SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/..."

If SLACK_WEBHOOK_URL is not set (mock mode), the dispatcher will
pretty-print the full Slack payload to the console instead — perfect
for demos and local testing with zero configuration needed.

The Block Kit message includes:
  🚨 Severity badge + incident ID
  🛡️  Affected control + domain
  👤 Actor identity + trust band
  🔍 AI Tribunal rationale
  ⚡ Auto-Healer payload status
  🔗 Quick-action buttons (Approve / Escalate / Dismiss)
"""
import sys
import os
import json
import logging
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
load_dotenv(os.path.join(os.path.dirname(__file__), '../../../.env'))

from typing import List
from shared.schemas import TribunalVerdict, RemediationAction

logger = logging.getLogger("webhook_dispatcher")

# ─── Configuration ─────────────────────────────────────────────────────────────
# Swap this with your real Slack webhook URL:
#   $env:SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/XXX/YYY/ZZZ"
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "")

_SEVERITY_EMOJI = {
    "CRITICAL": "🔴",
    "HIGH":     "🟠",
    "MEDIUM":   "🟡",
    "LOW":      "🟢",
    "INFO":     "⚪",
}


def _build_slack_payload(verdict: TribunalVerdict, heal_action: RemediationAction = None) -> dict:
    """Builds a rich Slack Block Kit payload for a single BLOCK verdict."""
    emoji = _SEVERITY_EMOJI.get(verdict.severity, "🔵")
    title = f"{emoji} *SentinelDNA BLOCK* — `{verdict.control}` [{verdict.severity}]"

    healer_text = (
        f"✅ Auto-Healer payload ready\n```{heal_action.generated_payload}```"
        if heal_action else
        "⚠️ No baseline match found — manual review required."
    )

    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"🚨 Security Drift BLOCKED  |  {verdict.control}",
                "emoji": True
            }
        },
        {"type": "divider"},
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": f"*Control:*\n`{verdict.control}`"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Severity:*\n{emoji} {verdict.severity}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Verdict:*\n🛑 {verdict.verdict}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Confidence:*\n{int(verdict.confidence * 100)}%"
                }
            ]
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*🔍 Tribunal Rationale:*\n>{verdict.rationale}"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*⚡ Auto-Healer Status:*\n{healer_text}"
            }
        },
        {"type": "divider"},
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": "✅ Approve Rollback", "emoji": True},
                    "style": "primary",
                    "value": f"approve_{verdict.control}"
                },
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": "⬆️ Escalate to CISO", "emoji": True},
                    "value": f"escalate_{verdict.control}"
                },
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": "🗑️ Dismiss", "emoji": True},
                    "style": "danger",
                    "value": f"dismiss_{verdict.control}"
                }
            ]
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"_Powered by SentinelDNA · Stage 5 (AI Tribunal) · Control: {verdict.control}_"
                }
            ]
        }
    ]

    return {
        "text": title,   # fallback for notifications
        "blocks": blocks
    }


def _dispatch(payload: dict, control_id: str):
    """
    Sends the Slack Block Kit payload.
    - Real mode: HTTP POST to SLACK_WEBHOOK_URL
    - Mock mode: Pretty-prints to console (green banner)
    """
    if SLACK_WEBHOOK_URL:
        try:
            import requests
            resp = requests.post(
                SLACK_WEBHOOK_URL,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            if resp.status_code == 200:
                print(f"  [SENT] Slack alert dispatched for {control_id} (HTTP 200)")
            else:
                print(f"  [ERROR] Slack returned HTTP {resp.status_code} for {control_id}")
        except Exception as e:
            print(f"  [ERROR] Slack dispatch failed for {control_id}: {e}")
    else:
        # Mock mode — pretty-print the payload (safe ASCII for Windows terminals)
        def _safe(s: str) -> str:
            return s.encode("ascii", errors="replace").decode("ascii")

        print(f"\n  {'-'*60}")
        print(f"  [MOCK SLACK ALERT] -> #{control_id}")
        print(f"  {'-'*60}")
        print(f"  Text : {_safe(payload['text'])}")
        print(f"  Blocks: {len(payload['blocks'])} Block Kit sections")
        for block in payload["blocks"]:
            if block["type"] == "section" and "fields" in block:
                for field in block["fields"]:
                    print(f"    {_safe(field['text'])}")
            elif block["type"] == "section" and "text" in block:
                print(f"    {_safe(block['text']['text'][:120])}")
            elif block["type"] == "actions":
                btns = " | ".join(_safe(e["text"]["text"]) for e in block["elements"])
                print(f"    Buttons: [{btns}]")
        print(f"  {'-'*60}")


def run(
    verdicts: List[TribunalVerdict],
    heal_actions: List[RemediationAction] = None
) -> List[dict]:
    """
    Processes all BLOCK verdicts and fires Slack alerts.
    Returns a list of the raw payloads dispatched (useful for the API endpoint).
    """
    if not verdicts:
        return []

    # Build a lookup from control_id → RemediationAction
    heal_map = {}
    if heal_actions:
        for action in heal_actions:
            heal_map[action.control_id] = action

    dispatched = []
    for v in verdicts:
        if v.verdict == "BLOCK":
            heal = heal_map.get(v.control)
            payload = _build_slack_payload(v, heal)
            _dispatch(payload, v.control)
            dispatched.append({"control": v.control, "payload": payload})

    return dispatched


if __name__ == "__main__":
    from tribunal import ai_tribunal
    from trust import trust_engine
    from intelligence_engine import deep_forensics
    from remediation import auto_healer

    print("Testing Slack Webhook Dispatcher...")
    trust_map = trust_engine.run()
    anoms = deep_forensics.run()
    forensic_map = {a.event_id: a for a in anoms}
    verdicts = ai_tribunal.run(trust_map, forensic_map)
    actions = auto_healer.run(verdicts)

    dispatched = run(verdicts, actions)
    print(f"\nDispatched {len(dispatched)} Slack alerts.")
    if not SLACK_WEBHOOK_URL:
        print("(Running in MOCK MODE — set $env:SLACK_WEBHOOK_URL to enable real Slack delivery)")
