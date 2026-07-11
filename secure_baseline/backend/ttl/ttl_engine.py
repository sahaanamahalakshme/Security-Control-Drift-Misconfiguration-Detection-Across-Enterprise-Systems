"""
backend/ttl/ttl_engine.py

TTL Engine.

Input : maintenance.json (via shared.schemas.load_maintenance_windows).
        status is one of: closed, active, expired_unreverted,
        invalid_retroactive. approved_by may be null.

Output: a TTLFinding for every window that is a problem:
        - status already flagged as expired_unreverted / invalid_retroactive
          by the simulator -> reported as-is
        - status == "active" but now is past expiry_time -> "overdue"
        - any window with approved_by == null is additionally flagged
          as unapproved=True, regardless of status

No dependency on any other Member B module. Runs standalone.
"""

from datetime import datetime, timezone, timedelta
from typing import List

from shared import constants, schemas
from shared.models import MaintenanceWindow, TTLFinding


def _now() -> datetime:
    return datetime.now(timezone.utc)


def find_ttl_findings(
    windows: List[MaintenanceWindow], now: datetime = None
) -> List[TTLFinding]:
    now = now or _now()
    grace = timedelta(minutes=constants.TTL_GRACE_PERIOD_MINUTES)
    findings: List[TTLFinding] = []

    for w in windows:
        unapproved = w.approved_by is None
        reason = None

        if w.status in constants.TTL_BAD_STATUSES:
            reason = w.status
        elif w.status in constants.TTL_OPEN_STATUSES and now > (w.expiry_time + grace):
            reason = "overdue"

        if reason or unapproved:
            overdue_minutes = max(0.0, (now - w.expiry_time).total_seconds() / 60.0)
            findings.append(
                TTLFinding(
                    control_id=w.control_id,
                    resource_id=w.resource_id,
                    maintenance_id=w.maintenance_id,
                    reason=reason or "unapproved_only",
                    expiry_time=w.expiry_time,
                    minutes_overdue=round(overdue_minutes, 1),
                    status=w.status,
                    unapproved=unapproved,
                )
            )
    return findings


def run(now: datetime = None) -> List[TTLFinding]:
    raw_windows = schemas.load_maintenance_windows()
    windows = [MaintenanceWindow.from_dict(w) for w in raw_windows]
    return find_ttl_findings(windows, now=now)


if __name__ == "__main__":
    findings = run()
    if not findings:
        print("No TTL findings.")
    for f in findings:
        flag = " [UNAPPROVED]" if f.unapproved else ""
        print(
            f"[{f.reason.upper():20s}] {f.control_id} on {f.resource_id} "
            f"(maintenance {f.maintenance_id}, overdue {f.minutes_overdue} min){flag}"
        )
