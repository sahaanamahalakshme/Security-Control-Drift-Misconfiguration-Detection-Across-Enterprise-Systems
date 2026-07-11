from __future__ import annotations
from datetime import datetime
from typing import Optional
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
 
from shared.constants import SUPPRESSION_DISCOUNTS, AUTOMATION_ACTOR_TYPES, AUTOSCALER_KEYWORDS
 
 
def _parse_ts(ts: str) -> datetime:
    return datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ")
 
 
def find_valid_maintenance_window(event: dict, maintenance_windows: list) -> Optional[dict]:
    invalid_statuses = {"invalid_retroactive", "expired_unreverted"}
    try:
        event_ts = _parse_ts(event["timestamp"])
    except (KeyError, ValueError):
        return None
 
    for mw in maintenance_windows:
        if mw.get("status") in invalid_statuses:
            continue
        if mw.get("approved_by") is None:
            continue
        if mw.get("control_id") != event.get("control_id") and mw.get("resource_id") != event.get("resource_id"):
            continue
        try:
            start, expiry = _parse_ts(mw["start_time"]), _parse_ts(mw["expiry_time"])
        except (KeyError, ValueError):
            continue
        if start <= event_ts <= expiry:
            return mw
    return None
 
 
def is_autoscaler_actor(actor: dict) -> bool:
    actor_id = (actor.get("id") or "").lower()
    actor_name = (actor.get("name") or "").lower()
    return any(kw in actor_id or kw in actor_name for kw in AUTOSCALER_KEYWORDS)
 
 
def compute_suppression(event: dict, maintenance_windows: list) -> dict:
    discount = 0
    reasons = []
 
    valid_mw = find_valid_maintenance_window(event, maintenance_windows)
    if valid_mw:
        discount += SUPPRESSION_DISCOUNTS["VALID_MAINTENANCE_WINDOW"]
        reasons.append(f"Covered by approved maintenance window {valid_mw['maintenance_id']} "
                        f"(ticket {valid_mw.get('ticket_ref') or 'n/a'})")
    elif event.get("maintenance_window_active"):
        # Event claims a maintenance window was active, but we couldn't verify
        # a VALID one — this is a signal to escalate trust scrutiny, not suppress.
        reasons.append("Event flagged maintenance_window_active=True but no valid, "
                        "approved maintenance window was found — treated as unsuppressed.")
 
    actor = event.get("actor", {})
    if actor.get("type") in AUTOMATION_ACTOR_TYPES and actor.get("trust_score_at_event", 0) >= 0.85:
        discount += SUPPRESSION_DISCOUNTS["CI_CD_KNOWN_SAFE_ACTOR"]
        reasons.append(f"High-trust automation/pipeline actor ({actor.get('id')}, "
                        f"trust={actor.get('trust_score_at_event')})")
 
    if is_autoscaler_actor(actor):
        discount += SUPPRESSION_DISCOUNTS["AUTOSCALER_ACTOR"]
        reasons.append("Autoscaler-attributed change")
 
    return {
        "discount": discount,
        "reasons": reasons,
        "valid_maintenance_window": valid_mw["maintenance_id"] if valid_mw else None,
    }
 