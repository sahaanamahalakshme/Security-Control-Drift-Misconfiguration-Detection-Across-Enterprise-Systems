
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