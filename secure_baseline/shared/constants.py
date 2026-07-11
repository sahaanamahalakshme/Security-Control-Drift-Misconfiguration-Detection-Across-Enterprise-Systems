"""
shared/constants.py

Single source of truth for constants used by every engine
(trust, ttl, attack_graph, tribunal, intelligence_engine).
"""

import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths (relative to backend/ root, i.e. secure_baseline/)
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parent.parent
DATASETS_DIR = ROOT_DIR / "datasets"

BASELINE_PATH = DATASETS_DIR / "baseline.json"
EVENTS_PATH = DATASETS_DIR / "events.json"
MAINTENANCE_PATH = DATASETS_DIR / "maintenance.json"
TOPOLOGY_PATH = DATASETS_DIR / "topology.json"
COMPLIANCE_PATH = DATASETS_DIR / "compliance.json"

# "The secret": Member B always imports DRIFTS_PATH from here. Today it
# points at sample_drifts.json. Once Member A's detection_engine ships
# real_drifts.json, set the env var below (or edit the default) — no
# downstream code changes.
DRIFTS_PATH = Path(
    os.environ.get("SENTINELDNA_DRIFTS_PATH", str(DATASETS_DIR / "sample_drifts.json"))
)

# ---------------------------------------------------------------------------
# Severity handling — events.json uses "rule_engine_severity" in
# UPPERCASE (INFO/MEDIUM/HIGH/CRITICAL); sample_drifts.json uses
# "severity" in Title Case (Critical/High). Normalize both to UPPERCASE.
# ---------------------------------------------------------------------------
SEVERITY_ORDER = {"INFO": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}

def normalize_severity(value: str) -> str:
    return (value or "MEDIUM").strip().upper()


# ---------------------------------------------------------------------------
# Trust Engine tunables
# ---------------------------------------------------------------------------
TRUST_SCORE_MIN = 0.0
TRUST_SCORE_MAX = 100.0
TRUST_SCORE_DEFAULT = 70.0  # starting trust for an actor never seen before

TRUST_PENALTY = {
    "severity_CRITICAL": 20.0,
    "severity_HIGH": 10.0,
    "severity_MEDIUM": 4.0,
    "severity_LOW": 1.0,
    "severity_INFO": 0.0,
    "outside_maintenance_window": 15.0,   # maintenance_window_active == False
    "has_mitre_technique": 8.0,           # event carries an ATT&CK technique id
    "actor_type_unknown": 15.0,           # actor.type == "unknown"
}

TRUST_REWARD = {
    "inside_maintenance_window_info": 1.0,   # benign, approved-context change
}

TRUST_BANDS = [
    (85.0, "HIGH_TRUST"),
    (60.0, "MODERATE_TRUST"),
    (35.0, "LOW_TRUST"),
    (0.0, "UNTRUSTED"),
]

# ---------------------------------------------------------------------------
# TTL Engine
# ---------------------------------------------------------------------------
# Statuses that are immediately a finding, regardless of current time.
TTL_BAD_STATUSES = {"expired_unreverted", "invalid_retroactive"}
# Status meaning "still open" — gets checked against expiry_time.
TTL_OPEN_STATUSES = {"active", "open"}
TTL_GRACE_PERIOD_MINUTES = 0

# ---------------------------------------------------------------------------
# Tribunal
# ---------------------------------------------------------------------------
TRIBUNAL_VERDICTS = ("ALLOW", "ESCALATE", "BLOCK")
