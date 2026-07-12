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

RULE_WEIGHTS = {
    "LOGGING_DISABLED": 10,
    "ENCRYPTION_DOWNGRADED": 8,
    "MFA_OR_AUTH_WEAKENED": 8,
    "FIREWALL_RULE_BROADENED": 5,
    "ACCESS_CONTROL_WEAKENED": 7,
    "ENDPOINT_PROTECTION_DISABLED": 8,
    "KEY_MANAGEMENT_WEAKENED": 6,
    "SUPPLY_CHAIN_CONTROL_WEAKENED": 5,
    "TIMEOUT_OR_MINOR_PARAM_CHANGED": 2,
    "CONTROL_STRENGTHENED": 0,     # e.g. re-enabling logging -> not drift risk
    "UNKNOWN_PATTERN": 3,          # conservative default for unmapped changes
}

# Base severity a pattern implies before scoring/suppression is applied.
PATTERN_BASE_SEVERITY = {
    "LOGGING_DISABLED": "CRITICAL",
    "ENCRYPTION_DOWNGRADED": "HIGH",
    "MFA_OR_AUTH_WEAKENED": "HIGH",
    "FIREWALL_RULE_BROADENED": "MEDIUM",
    "ACCESS_CONTROL_WEAKENED": "HIGH",
    "ENDPOINT_PROTECTION_DISABLED": "HIGH",
    "KEY_MANAGEMENT_WEAKENED": "HIGH",
    "SUPPLY_CHAIN_CONTROL_WEAKENED": "MEDIUM",
    "TIMEOUT_OR_MINOR_PARAM_CHANGED": "LOW",
    "CONTROL_STRENGTHENED": "INFO",
    "UNKNOWN_PATTERN": "MEDIUM",
}

# Environment criticality multiplier (prod is where drift actually matters most).
ENVIRONMENT_CRITICALITY = {
    "prod": 1.5,
    "staging": 1.0,
    "dev": 0.5,
}
# Our current datasets don't carry an explicit "environment" per-event, so we
# derive it from control criticality as a proxy (documented in drift_detector.py).
CRITICALITY_TO_ENV_PROXY = {
    "CRITICAL": "prod",
    "HIGH": "prod",
    "MEDIUM": "staging",
    "LOW": "dev",
}

# --- Suppression discounts (benign-change filtering) ---
# Applied per problem statement: "Suppress benign changes using context
# signals: approved change tickets, maintenance window overlap, CI/CD
# pipeline source, autoscaler actor."
SUPPRESSION_DISCOUNTS = {
    "VALID_MAINTENANCE_WINDOW": 6,     # approved, currently active, ticketed
    "CI_CD_KNOWN_SAFE_ACTOR": 4,       # pipeline/automation actor, high trust
    "APPROVED_CHANGE_TICKET": 3,
    "AUTOSCALER_ACTOR": 5,
}

# Score -> final severity band, after weight*criticality - suppression.
SCORE_SEVERITY_BANDS = [
    (12, "CRITICAL"),
    (8, "HIGH"),
    (4, "MEDIUM"),
    (1, "LOW"),
    (float("-inf"), "INFO"),
]

# Actor types treated as "known safe automation" for suppression purposes.
AUTOMATION_ACTOR_TYPES = {"pipeline", "automation"}
AUTOSCALER_KEYWORDS = ("autoscal", "asg-", "scale-")

# False-positive-rate target from the problem statement's Success Criteria,
# exposed here so the pipeline summary can report against it.
TARGET_FALSE_POSITIVE_RATE = 0.15
TARGET_CONTROL_COVERAGE = 0.95

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
