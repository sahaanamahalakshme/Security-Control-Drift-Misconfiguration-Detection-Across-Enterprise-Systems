import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from collections import defaultdict
from typing import Dict, List

from shared import constants, schemas
from shared.schemas import ChangeEvent, TrustResult


def _band_for(score: float) -> str:
    for threshold, band in constants.TRUST_BANDS:
        if score >= threshold:
            return band
    return "UNTRUSTED"


def _score_single_event(event: ChangeEvent, reasons: List[str]) -> float:
    delta = 0.0

    sev_key = f"severity_{event.severity}"
    p = constants.TRUST_PENALTY.get(sev_key, 0.0)
    if p:
        delta -= p
        reasons.append(f"{event.event_id}: severity {event.severity} (-{p})")

    if not event.maintenance_window_active and event.severity in ("HIGH", "CRITICAL"):
        p = constants.TRUST_PENALTY["outside_maintenance_window"]
        delta -= p
        reasons.append(f"{event.event_id}: outside maintenance window (-{p})")
    elif event.maintenance_window_active and event.severity == "INFO":
        r = constants.TRUST_REWARD["inside_maintenance_window_info"]
        delta += r
        reasons.append(f"{event.event_id}: routine change inside window (+{r})")

    if event.mitre_technique:
        p = constants.TRUST_PENALTY["has_mitre_technique"]
        delta -= p
        reasons.append(f"{event.event_id}: MITRE {event.mitre_technique} observed (-{p})")

    if event.actor.type == "unknown":
        p = constants.TRUST_PENALTY["actor_type_unknown"]
        delta -= p
        reasons.append(f"{event.event_id}: unattributed actor (-{p})")

    return delta


def compute_actor_trust(events: List[ChangeEvent]) -> Dict[str, TrustResult]:
    by_actor: Dict[str, List[ChangeEvent]] = defaultdict(list)
    for e in events:
        by_actor[e.actor.id].append(e)

    results: Dict[str, TrustResult] = {}
    for actor_id, actor_events in by_actor.items():
        score = constants.TRUST_SCORE_DEFAULT
        reasons: List[str] = []
        for event in actor_events:
            score += _score_single_event(event, reasons)
        score = max(constants.TRUST_SCORE_MIN, min(constants.TRUST_SCORE_MAX, score))
        results[actor_id] = TrustResult(
            actor=actor_id,
            trust_score=round(score, 2),
            trust_band=_band_for(score),
            reasons=reasons,
        )
    return results


def run() -> Dict[str, TrustResult]:
    raw_events = schemas.load_events()
    events = [ChangeEvent.from_dict(e) for e in raw_events]
    return compute_actor_trust(events)


if __name__ == "__main__":
    for actor, result in run().items():
        print(f"{actor:22s} score={result.trust_score:6.2f}  band={result.trust_band}")
        for r in result.reasons:
            print(f"    - {r}")
