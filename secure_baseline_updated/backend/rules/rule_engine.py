from __future__ import annotations
from typing import Any, Optional
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from shared.constants import RULE_WEIGHTS, PATTERN_BASE_SEVERITY

PROTECTIVE_BOOL_FIELDS = {
    "enabled", "mfa_required", "flow_logs_enabled", "agent_active",
    "storage_encrypted", "signed_commits_required", "step_up_required",
    "block_public_access", "secure_transfer_required", "rotation_enabled",
    "log_file_validation", "kms_encrypted", "force_push_blocked",
    "hardware_mfa_for_root",
}

EXPOSURE_BOOL_FIELDS = {
    "port_8080_open_to_world", "port_22_open_to_world", "port_3389_open_to_world",
    "port_4444_allow_any", "publicly_accessible", "static_prod_creds_present",
    "allow_blob_public_access", "port_8080_allow_any",
}

ENCRYPTION_STRENGTH_ORDER = {"AES128": 1, "AES-128": 1, "SSE-S3": 1,
                              "AES256": 2, "AES-256": 2, "SSE-KMS": 2}


def classify_pattern(universal_category: str, field_changed: str,
                      old_value: Any, new_value: Any) -> str:

    field = (field_changed or "").lower()

    # --- Logging disabled ---
    if universal_category in ("AUDIT_LOGGING", "NETWORK_TRAFFIC_VISIBILITY"):
        if field in PROTECTIVE_BOOL_FIELDS and old_value is True and new_value is False:
            return "LOGGING_DISABLED"
        if old_value is False and new_value is True:
            return "CONTROL_STRENGTHENED"

    # --- Encryption downgraded ---
    if universal_category == "DATA_ENCRYPTION_AT_REST":
        if field == "storage_encrypted" and old_value is True and new_value is False:
            return "ENCRYPTION_DOWNGRADED"
        if field == "encryption" and isinstance(old_value, str) and isinstance(new_value, str):
            old_rank = ENCRYPTION_STRENGTH_ORDER.get(old_value.upper())
            new_rank = ENCRYPTION_STRENGTH_ORDER.get(new_value.upper())
            if old_rank and new_rank:
                if new_rank < old_rank:
                    return "ENCRYPTION_DOWNGRADED"
                if new_rank > old_rank:
                    return "CONTROL_STRENGTHENED"
        if field == "public_access_prevention":
            if old_value == "enforced" and new_value != "enforced":
                return "ACCESS_CONTROL_WEAKENED"
            if new_value == "enforced" and old_value != "enforced":
                return "CONTROL_STRENGTHENED"
        if field in EXPOSURE_BOOL_FIELDS and old_value is False and new_value is True:
            return "ACCESS_CONTROL_WEAKENED"
        if field in EXPOSURE_BOOL_FIELDS and old_value is True and new_value is False:
            return "CONTROL_STRENGTHENED"

    # --- Firewall rule broadened ---
    if universal_category == "NETWORK_PERIMETER_CONTROL":
        if field in EXPOSURE_BOOL_FIELDS and old_value is False and new_value is True:
            return "FIREWALL_RULE_BROADENED"
        if field in EXPOSURE_BOOL_FIELDS and old_value is True and new_value is False:
            return "CONTROL_STRENGTHENED"
        if field in PROTECTIVE_BOOL_FIELDS and old_value is True and new_value is False:
            return "FIREWALL_RULE_BROADENED"

    # --- MFA / auth weakened ---
    if universal_category == "IDENTITY_ASSURANCE":
        if field in PROTECTIVE_BOOL_FIELDS and old_value is True and new_value is False:
            return "MFA_OR_AUTH_WEAKENED"
        if field == "session_lifetime_minutes" and isinstance(old_value, (int, float)) and isinstance(new_value, (int, float)):
            if new_value > old_value:
                return "MFA_OR_AUTH_WEAKENED" if (new_value - old_value) >= 30 else "TIMEOUT_OR_MINOR_PARAM_CHANGED"
            return "CONTROL_STRENGTHENED"
        if old_value is False and new_value is True:
            return "CONTROL_STRENGTHENED"

    # --- Endpoint protection disabled ---
    if universal_category == "ENDPOINT_HEALTH":
        if field == "agent_active" and old_value is True and new_value is False:
            return "ENDPOINT_PROTECTION_DISABLED"
        if field == "max_heartbeat_gap_minutes" and isinstance(old_value, (int, float)) and isinstance(new_value, (int, float)):
            return "TIMEOUT_OR_MINOR_PARAM_CHANGED" if new_value > old_value else "CONTROL_STRENGTHENED"
        if old_value is False and new_value is True:
            return "CONTROL_STRENGTHENED"

    # --- Key management weakened ---
    if universal_category == "KEY_MANAGEMENT":
        if field == "rotation_enabled" and old_value is True and new_value is False:
            return "KEY_MANAGEMENT_WEAKENED"
        if old_value is False and new_value is True:
            return "CONTROL_STRENGTHENED"

    # --- Credential hygiene: rotation is always good (new age resets to 0) ---
    if universal_category == "CREDENTIAL_HYGIENE":
        if field == "key_age_days":
            return "CONTROL_STRENGTHENED" if new_value == 0 else "TIMEOUT_OR_MINOR_PARAM_CHANGED"

    # --- Supply chain integrity weakened ---
    if universal_category == "SUPPLY_CHAIN_INTEGRITY":
        if field in PROTECTIVE_BOOL_FIELDS and old_value is True and new_value is False:
            return "SUPPLY_CHAIN_CONTROL_WEAKENED"
        if field in EXPOSURE_BOOL_FIELDS and old_value is False and new_value is True:
            return "SUPPLY_CHAIN_CONTROL_WEAKENED"
        if field == "credential_type" and new_value == "short_lived_oidc":
            return "CONTROL_STRENGTHENED"

    return "UNKNOWN_PATTERN"


def score_pattern(pattern: str) -> tuple[int, str]:
    """Returns (rule_weight, base_severity) for a classified pattern."""
    weight = RULE_WEIGHTS.get(pattern, RULE_WEIGHTS["UNKNOWN_PATTERN"])
    severity = PATTERN_BASE_SEVERITY.get(pattern, PATTERN_BASE_SEVERITY["UNKNOWN_PATTERN"])
    return weight, severity


def evaluate(universal_category: str, field_changed: str, old_value: Any, new_value: Any) -> dict:
    pattern = classify_pattern(universal_category, field_changed, old_value, new_value)
    weight, base_severity = score_pattern(pattern)
    return {"pattern": pattern, "rule_weight": weight, "base_severity": base_severity}


if __name__ == "__main__":
    print(evaluate("AUDIT_LOGGING", "enabled", True, False))
    print(evaluate("NETWORK_PERIMETER_CONTROL", "port_8080_open_to_world", False, True))
    print(evaluate("DATA_ENCRYPTION_AT_REST", "storage_encrypted", True, False))