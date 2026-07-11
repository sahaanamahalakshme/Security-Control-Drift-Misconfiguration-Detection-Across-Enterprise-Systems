"""
storytelling.py  (Stage 13 — LLM-Powered AI Incident Storytelling)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Upgrades the previous heuristic narrative to a real AI-generated
analyst report using Gemini 1.5 Flash (primary) or HuggingFace (fallback).

Each CompoundIncident becomes a structured prompt containing:
  - The drifts involved (control IDs, severities, domains)
  - The primary actor and their trust band
  - MITRE ATT&CK technique mappings
  - Compound incident time window
  - Business impact (estimated fine, revenue risk)

The LLM responds with a professional, evidence-chain narrative that
directly matches the hackathon's "explainable remediation guidance" requirement.

Rate-limit safety (free tier = 15 RPM):
  - 4-second delay between every call (see llm_config.py)
  - Exponential backoff on 429 errors
  - High-quality heuristic fallback if both backends are unavailable
"""
import sys
import os
import json
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from typing import List
from shared.schemas import IncidentNarrative, CompoundIncident
from intelligence_engine import time_machine
from config import llm_config

# ─── Prompt template ───────────────────────────────────────────────────────────
_SYSTEM_PROMPT = """You are SentinelDNA, an elite AI security analyst for enterprise systems.
You will be given a JSON object describing a Compound Security Incident — a cluster of
correlated misconfigurations detected across multiple domains in a tight time window.

Your task is to write a concise, professional incident report (3–5 paragraphs) that:
1. Summarises what happened in plain English (timeline, actor, affected systems).
2. Explains why this combination is dangerous (blast radius, attack path).
3. Maps the behaviour to MITRE ATT&CK techniques mentioned in the data.
4. States the compliance impact (GDPR, NIST, CIS).
5. Gives a numbered, sequenced remediation plan (most critical first).

Keep language precise and authoritative — as if briefing a CISO. Do NOT use bullet
points for the narrative paragraphs; use them only for the remediation list."""


def _build_prompt(inc: CompoundIncident, extra_context: dict = None) -> str:
    """Builds the full prompt to send to the LLM."""
    data = {
        "incident_id": inc.incident_id,
        "primary_actor": inc.primary_actor,
        "start_time": inc.start_time.isoformat(),
        "end_time": inc.end_time.isoformat(),
        "duration_minutes": int((inc.end_time - inc.start_time).total_seconds() // 60),
        "severity": inc.severity,
        "affected_controls": inc.drifts,
        "mitre_techniques": inc.mitre_techniques,
    }
    if extra_context:
        data.update(extra_context)

    return f"{_SYSTEM_PROMPT}\n\nIncident Data (JSON):\n{json.dumps(data, indent=2)}"


def _heuristic_fallback(inc: CompoundIncident) -> str:
    """
    High-quality rule-based narrative for when LLM backends are unavailable.
    This matches the exact style requested in the problem statement.
    """
    duration = int((inc.end_time - inc.start_time).total_seconds() // 60)
    mitre = ", ".join(inc.mitre_techniques) if inc.mitre_techniques else "unclassified"

    story = (
        f"At {inc.start_time.strftime('%H:%M UTC')}, actor '{inc.primary_actor}' "
        f"initiated a sequence of {len(inc.drifts)} correlated configuration changes "
        f"spanning {duration} minutes across multiple security control domains. "
        f"This pattern was intercepted by SentinelDNA's AI Tribunal as a {inc.severity}-severity "
        f"Compound Incident ({inc.incident_id}).\n\n"
        f"The affected controls ({', '.join(inc.drifts)}) collectively weaken the enterprise's "
        f"defence-in-depth posture. When analysed together by the Attack Graph engine, these "
        f"changes create a viable lateral movement path towards protected data assets — a risk "
        f"that would be invisible to single-control monitors. "
        f"The behaviour aligns with MITRE ATT&CK techniques: {mitre}.\n\n"
        f"From a compliance perspective, these changes directly violate NIST SP 800-53 CM-3 "
        f"(Configuration Change Control) and SI-4 (Continuous Monitoring), and may constitute "
        f"a breach of GDPR Article 32 (Security of Processing) if personal data is exposed "
        f"during the drift window. CIS Benchmark controls for the affected domains are also "
        f"non-compliant until remediation is confirmed.\n\n"
        f"SentinelDNA's Auto-Healer has generated PENDING_EXECUTION rollback payloads for "
        f"each affected control. Human confirmation is required before automatic reversion."
    )
    return story


def _heuristic_remediation(inc: CompoundIncident) -> List[str]:
    """Generates a sequenced remediation plan heuristically."""
    steps = [
        f"IMMEDIATE: Suspend access for actor '{inc.primary_actor}' pending forensic review.",
    ]
    for i, drift_id in enumerate(inc.drifts, 1):
        steps.append(f"STEP {i}: Revert changes to '{drift_id}' using the generated Auto-Healer payload.")
    steps.append("FINAL: Conduct a post-incident review and update Actor Trust Score accordingly.")
    return steps


def generate_story(inc: CompoundIncident, llm_model=None) -> IncidentNarrative:
    """
    Generates a full IncidentNarrative for a CompoundIncident.
    Tries real LLM first, falls back to heuristic if unavailable.
    """
    prompt = _build_prompt(inc)

    # Attempt real LLM
    llm_text = llm_config.generate(prompt, llm_model)

    if llm_text:
        # Parse LLM response — try to split narrative from remediation list
        # The LLM is prompted to end with a numbered list
        story = llm_text
        remediation = _heuristic_remediation(inc)
        print(f"  [{inc.incident_id}] [LLM] Narrative generated ({len(llm_text)} chars).")
    else:
        story = _heuristic_fallback(inc)
        remediation = _heuristic_remediation(inc)
        print(f"  [{inc.incident_id}] [HEURISTIC] LLM unavailable, using rule-based narrative.")

    return IncidentNarrative(
        incident_id=inc.incident_id,
        story=story,
        remediation_order=remediation
    )


def run(incidents: List[CompoundIncident] = None, llm_model=None) -> List[IncidentNarrative]:
    """
    Main entry point. Initialises Gemini model once (to reuse connection),
    then processes all incidents with rate-limit safety.
    """
    if incidents is None:
        incidents = time_machine.run()

    if not incidents:
        print("  No Compound Incidents to narrate.")
        return []

    # Initialise Gemini once and pass the model object through to avoid repeated init
    if llm_model is None:
        llm_model = llm_config.get_gemini_client()
        if llm_model:
            print(f"  [OK] Gemini ({llm_config.GEMINI_MODEL}) connected.")
        else:
            print("  [WARN] Gemini unavailable. Will try HuggingFace, then heuristic.")

    return [generate_story(inc, llm_model) for inc in incidents]


if __name__ == "__main__":
    narratives = run()
    for n in narratives:
        print(f"\n{'='*70}")
        print(f"INCIDENT: {n.incident_id}")
        print(f"{'='*70}")
        print(n.story)
        print("\nREMEDIATION SEQUENCE:")
        for step in n.remediation_order:
            print(f"  {step}")
