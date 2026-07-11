import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from typing import Dict, List, Optional

from shared import constants, schemas
from shared.schemas import TribunalVerdict, TrustResult, ForensicAnomaly


def _judge_one(
    drift: Dict,
    trust_map: Optional[Dict[str, TrustResult]],
    forensic_map: Optional[Dict[str, ForensicAnomaly]],
) -> TribunalVerdict:
    severity = constants.normalize_severity(drift.get("severity", "MEDIUM"))
    control = drift.get("control", drift.get("control_id", "UNKNOWN"))
    actor = drift.get("changed_by")
    event_id = drift.get("source_event_id", drift.get("event_id"))

    base_confidence = {"CRITICAL": 0.95, "HIGH": 0.85, "MEDIUM": 0.65, "LOW": 0.4}.get(severity, 0.5)

    verdict = "ESCALATE"
    rationale_parts = [f"severity={severity}"]

    if severity == "CRITICAL":
        verdict = "BLOCK"
    elif severity == "LOW":
        verdict = "ALLOW"

    # --- Factor in actor trust ---
    if trust_map and actor and actor in trust_map:
        trust = trust_map[actor]
        rationale_parts.append(f"actor '{actor}' trust_band={trust.trust_band}")
        if trust.trust_band == "UNTRUSTED" and verdict != "BLOCK":
            verdict = "BLOCK"
            base_confidence = max(base_confidence, 0.9)
        elif trust.trust_band == "HIGH_TRUST" and verdict == "ESCALATE":
            verdict = "ALLOW"
            base_confidence = max(base_confidence, 0.7)

    # --- Factor in forensic anomaly evidence ---
    if forensic_map and event_id and event_id in forensic_map:
        anomaly = forensic_map[event_id]
        rationale_parts.append(
            f"forensic_confidence={anomaly.combined_confidence:.2f} "
            f"({'; '.join(anomaly.reasons[:2])})"
        )
        if anomaly.combined_confidence >= 0.8 and verdict != "BLOCK":
            verdict = "BLOCK"
            base_confidence = max(base_confidence, anomaly.combined_confidence)
            rationale_parts.append("deep forensics escalated to BLOCK")
        elif anomaly.combined_confidence >= 0.5 and verdict == "ALLOW":
            verdict = "ESCALATE"
            rationale_parts.append("deep forensics prevented auto-ALLOW")

    return TribunalVerdict(
        control=control,
        severity=severity,
        verdict=verdict,
        confidence=round(base_confidence, 2),
        rationale="; ".join(rationale_parts),
    )


def judge_drifts(
    drifts: List[Dict],
    trust_map: Optional[Dict[str, TrustResult]] = None,
    forensic_map: Optional[Dict[str, ForensicAnomaly]] = None,
) -> List[TribunalVerdict]:
    return [_judge_one(d, trust_map, forensic_map) for d in drifts]


def run(
    trust_map: Optional[Dict[str, TrustResult]] = None,
    forensic_map: Optional[Dict[str, ForensicAnomaly]] = None,
) -> List[TribunalVerdict]:
    drifts = schemas.load_drifts()
    return judge_drifts(drifts, trust_map=trust_map, forensic_map=forensic_map)


if __name__ == "__main__":
    for v in run():
        print(f"[{v.verdict:8s}] {v.control:12s} severity={v.severity:8s} confidence={v.confidence}  ({v.rationale})")
