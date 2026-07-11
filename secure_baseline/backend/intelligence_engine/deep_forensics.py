"""
backend/intelligence_engine/deep_forensics.py

Deep Forensics Engine (Stage 3).

Input : events.json  (raw change events)
        drifts       (sample_drifts.json — detected drift findings)

Processing:
  1. Isolation Forest — multivariate anomaly detection on feature vectors
     (hour_of_day, actor_change_frequency, control_change_frequency,
      severity, approval_status, trust_score, environment, change_source).
  2. Statistical Change-Point Detection — tracks event frequency per
     actor/control to flag sudden behavioral shifts.

Output: ForensicAnomaly per event — isolation_score, changepoint_score,
        combined_confidence, and human-readable reasons.

The output feeds directly into the AI Tribunal as forensic evidence.
"""

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import itertools
from collections import defaultdict
from typing import Dict, List, Optional

import numpy as np
from sklearn.ensemble import IsolationForest

from shared import schemas, constants
from shared.schemas import ChangeEvent, ForensicAnomaly

_anomaly_counter = itertools.count(1)

# --- Feature extraction -------------------------------------------------

SEVERITY_MAP = {"INFO": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
ACTOR_TYPE_MAP = {"automation": 0, "pipeline": 1, "human": 2, "unknown": 3}
CHANGE_SOURCE_MAP = {"ci_cd": 0, "automation": 0, "pipeline": 1, "human": 2, "unknown": 3}


def _extract_features(event: ChangeEvent) -> List[float]:
    """Build a numeric feature vector from one parsed event."""
    hour = event.timestamp.hour + event.timestamp.minute / 60.0
    severity = SEVERITY_MAP.get(event.severity, 2)
    actor_type = ACTOR_TYPE_MAP.get(event.actor.type, 3)
    trust = event.actor.trust_score_at_event if event.actor.trust_score_at_event is not None else 0.5
    maintenance = 1.0 if event.maintenance_window_active else 0.0
    has_mitre = 1.0 if event.mitre_technique else 0.0

    return [
        hour,                       # 0: hour of day (0-24)
        severity,                   # 1: severity ordinal (0-4)
        actor_type,                 # 2: actor type ordinal (0-3)
        trust,                      # 3: trust score at event time (0-1)
        maintenance,                # 4: inside maintenance window (0/1)
        has_mitre,                  # 5: has MITRE technique (0/1)
    ]


# --- Isolation Forest (multivariate anomaly detection) -------------------

def _run_isolation_forest(events: List[ChangeEvent]) -> Dict[str, float]:
    """Returns event_id -> anomaly_score (0.0 = normal, 1.0 = highly anomalous)."""
    if len(events) < 5:
        return {e.event_id: 0.0 for e in events}

    X = np.array([_extract_features(e) for e in events])

    clf = IsolationForest(
        n_estimators=100,
        contamination=0.15,      # expect ~15% anomalous
        random_state=42,
    )
    clf.fit(X)

    # decision_function returns negative values for anomalies
    raw_scores = clf.decision_function(X)

    # Normalize to 0-1 range (lower raw_score = more anomalous = higher output)
    min_s, max_s = raw_scores.min(), raw_scores.max()
    if max_s - min_s < 1e-9:
        normalized = np.zeros_like(raw_scores)
    else:
        normalized = (max_s - raw_scores) / (max_s - min_s)

    return {events[i].event_id: round(float(normalized[i]), 4) for i in range(len(events))}


# --- Change-Point Detection (behavioral frequency shifts) ----------------

def _run_changepoint_detection(events: List[ChangeEvent]) -> Dict[str, float]:
    """Detects behavioral shifts per actor by comparing recent activity
    rate against their historical baseline.

    Returns event_id -> changepoint_score (0.0 = normal, 1.0 = major shift).
    """
    # Sort by timestamp
    sorted_events = sorted(events, key=lambda e: e.timestamp)

    # Build per-actor event history (cumulative count over time)
    actor_history: Dict[str, List[ChangeEvent]] = defaultdict(list)
    for e in sorted_events:
        actor_history[e.actor.id].append(e)

    scores: Dict[str, float] = {}

    for actor_id, actor_events in actor_history.items():
        n = len(actor_events)
        for i, event in enumerate(actor_events):
            if n < 3:
                scores[event.event_id] = 0.0
                continue

            # Split: historical (everything before this event) vs recent window
            historical = actor_events[:i]
            if len(historical) < 2:
                scores[event.event_id] = 0.0
                continue

            # Calculate time intervals between consecutive events
            hist_intervals = []
            for j in range(1, len(historical)):
                delta = (historical[j].timestamp - historical[j - 1].timestamp).total_seconds()
                hist_intervals.append(max(delta, 60.0))  # floor at 1 minute

            avg_interval = np.mean(hist_intervals) if hist_intervals else 86400.0
            std_interval = np.std(hist_intervals) if len(hist_intervals) > 1 else avg_interval

            # Current event's interval
            current_interval = (event.timestamp - historical[-1].timestamp).total_seconds()
            current_interval = max(current_interval, 60.0)

            # Z-score-like deviation: how many standard deviations is current
            # interval from the mean? Short interval = high frequency = suspicious.
            if std_interval < 1e-3:
                deviation = 0.0
            else:
                deviation = max(0.0, (avg_interval - current_interval) / std_interval)

            # Sigmoid to 0-1
            changepoint_score = 1.0 / (1.0 + np.exp(-deviation + 2.0))
            scores[event.event_id] = round(float(changepoint_score), 4)

    return scores


# --- Reason generation ---------------------------------------------------

def _generate_reasons(
    event: ChangeEvent,
    isolation_score: float,
    changepoint_score: float,
) -> List[str]:
    """Human-readable forensic reasons for the anomaly."""
    reasons = []

    hour = event.timestamp.hour
    if hour < 6 or hour >= 22:
        reasons.append(f"outside working hours ({hour:02d}:00)")

    if event.actor.type == "unknown":
        reasons.append("unattributed actor")

    if event.actor.trust_score_at_event is not None and event.actor.trust_score_at_event < 0.6:
        reasons.append(f"low trust score ({event.actor.trust_score_at_event:.2f})")

    if not event.maintenance_window_active and event.severity in ("HIGH", "CRITICAL"):
        reasons.append("high-severity change outside maintenance window")

    if event.mitre_technique:
        reasons.append(f"MITRE ATT&CK technique {event.mitre_technique}")

    if isolation_score >= 0.7:
        reasons.append("multivariate anomaly detected by Isolation Forest")

    if changepoint_score >= 0.6:
        reasons.append("unusual actor activity frequency (behavioral shift)")

    if not reasons:
        reasons.append("within normal behavioral range")

    return reasons


# --- Main orchestrator ---------------------------------------------------

def analyze_events(events: List[ChangeEvent]) -> List[ForensicAnomaly]:
    """Run full Deep Forensics pipeline on parsed events."""
    isolation_scores = _run_isolation_forest(events)
    changepoint_scores = _run_changepoint_detection(events)

    anomalies: List[ForensicAnomaly] = []
    for event in events:
        iso = isolation_scores.get(event.event_id, 0.0)
        cp = changepoint_scores.get(event.event_id, 0.0)

        # Weighted consensus: Isolation Forest 60%, Change-Point 40%
        combined = round(0.6 * iso + 0.4 * cp, 4)

        reasons = _generate_reasons(event, iso, cp)

        anomalies.append(ForensicAnomaly(
            anomaly_id=f"FA-{next(_anomaly_counter):05d}",
            event_id=event.event_id,
            control_id=event.control_id,
            actor_id=event.actor.id,
            isolation_score=iso,
            changepoint_score=cp,
            combined_confidence=combined,
            reasons=reasons,
        ))

    return anomalies


def run() -> List[ForensicAnomaly]:
    """Load events.json, parse, and run Deep Forensics."""
    raw_events = schemas.load_events()
    events = [ChangeEvent.from_dict(e) for e in raw_events]
    return analyze_events(events)


if __name__ == "__main__":
    anomalies = run()
    # Sort by combined confidence descending for readability
    anomalies.sort(key=lambda a: a.combined_confidence, reverse=True)
    print(f"Deep Forensics: {len(anomalies)} events analyzed\n")
    for a in anomalies[:15]:  # show top 15
        print(f"  [{a.combined_confidence:.2f}] {a.event_id:8s} actor={a.actor_id:22s} "
              f"iso={a.isolation_score:.2f} cp={a.changepoint_score:.2f}")
        for r in a.reasons:
            print(f"         - {r}")
