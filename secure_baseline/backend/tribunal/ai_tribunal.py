"""
backend/tribunal/ai_tribunal.py

AI Tribunal.

Input : drifts (via shared.schemas.load_drifts) — sample_drifts.json
        today, real_drifts.json later via SENTINELDNA_DRIFTS_PATH.
        Expected shape per drift: {"control", "control_id",
        "resource_id", "severity", "changed_by", "timestamp"}.

Output: a TribunalVerdict per drift: ALLOW / ESCALATE / BLOCK.

Optional dependency: pass a TrustResult map (from
backend/trust/trust_engine.py) to factor actor trust into the verdict.
Falls back to severity-only judging if omitted, so this still runs
100% standalone.
"""

from typing import Dict, List, Optional

from shared import constants, schemas
from shared.models import TribunalVerdict, TrustResult


def _judge_one(drift: Dict, trust_map: Optional[Dict[str, TrustResult]]) -> TribunalVerdict:
    severity = constants.normalize_severity(drift.get("severity", "MEDIUM"))
    control = drift.get("control", drift.get("control_id", "UNKNOWN"))
    actor = drift.get("changed_by")

    base_confidence = {"CRITICAL": 0.95, "HIGH": 0.85, "MEDIUM": 0.65, "LOW": 0.4}.get(severity, 0.5)

    verdict = "ESCALATE"
    rationale_parts = [f"severity={severity}"]

    if severity == "CRITICAL":
        verdict = "BLOCK"
    elif severity == "LOW":
        verdict = "ALLOW"

    if trust_map and actor and actor in trust_map:
        trust = trust_map[actor]
        rationale_parts.append(f"actor '{actor}' trust_band={trust.trust_band}")
        if trust.trust_band == "UNTRUSTED" and verdict != "BLOCK":
            verdict = "BLOCK"
            base_confidence = max(base_confidence, 0.9)
        elif trust.trust_band == "HIGH_TRUST" and verdict == "ESCALATE":
            verdict = "ALLOW"
            base_confidence = max(base_confidence, 0.7)

    return TribunalVerdict(
        control=control,
        severity=severity,
        verdict=verdict,
        confidence=round(base_confidence, 2),
        rationale="; ".join(rationale_parts),
    )


def judge_drifts(drifts: List[Dict], trust_map: Optional[Dict[str, TrustResult]] = None) -> List[TribunalVerdict]:
    return [_judge_one(d, trust_map) for d in drifts]


def run(trust_map: Optional[Dict[str, TrustResult]] = None) -> List[TribunalVerdict]:
    drifts = schemas.load_drifts()
    return judge_drifts(drifts, trust_map=trust_map)


if __name__ == "__main__":
    for v in run():
        print(f"[{v.verdict:8s}] {v.control:12s} severity={v.severity:8s} confidence={v.confidence}  ({v.rationale})")
