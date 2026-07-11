from __future__ import annotations
from typing import Optional
import itertools
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from shared.schemas import DriftEvent

_drift_id_counter = itertools.count(1)


REMEDIATION_TEMPLATES = {
    "LOGGING_DISABLED": [
        "Re-enable the logging control immediately and verify continuous delivery to the log store.",
        "Review the gap window for any activity that occurred while logging was off.",
        "Confirm whether a valid change ticket/maintenance window covered this action; escalate if none exists.",
    ],
    "ENCRYPTION_DOWNGRADED": [
        "Restore encryption to the baseline standard (e.g. AES-256 / SSE-KMS) immediately.",
        "Identify what data was exposed at the weaker encryption level and for how long.",
        "Audit the change pipeline/actor that introduced the downgrade to prevent recurrence.",
    ],
    "FIREWALL_RULE_BROADENED": [
        "Revert the firewall/security-group rule to its baseline scope.",
        "Check external exposure (e.g. scan the opened port) to confirm no active exploitation.",
        "If the rule is genuinely required, route it through change approval with an explicit TTL.",
    ],
    "MFA_OR_AUTH_WEAKENED": [
        "Re-enforce MFA / step-up authentication on the affected identity or policy immediately.",
        "Review recent authentication events for the affected account for signs of misuse.",
        "Rotate credentials for the affected identity as a precaution.",
    ],
    "ACCESS_CONTROL_WEAKENED": [
        "Restore restrictive access settings (block public access / least privilege) immediately.",
        "Audit who/what accessed the resource while access controls were weakened.",
        "Add automated drift-prevention (SCP/Policy-as-Code) to block recurrence.",
    ],
    "ENDPOINT_PROTECTION_DISABLED": [
        "Verify the EDR/endpoint agent is running (not just 'installed') and restore protection.",
        "Isolate the affected host if compromise indicators are present.",
        "Investigate the tamper event's process tree and origin.",
    ],
    "KEY_MANAGEMENT_WEAKENED": [
        "Re-enable key rotation and verify the current key's age against policy.",
        "Confirm no data was re-encrypted or exported under a weaker key policy.",
    ],
    "SUPPLY_CHAIN_CONTROL_WEAKENED": [
        "Restore branch protection / credential controls on the affected pipeline.",
        "Audit recent builds/deploys that ran while the control was weakened.",
    ],
    "TIMEOUT_OR_MINOR_PARAM_CHANGED": [
        "Confirm the new parameter value is within acceptable policy range.",
        "No urgent action required; monitor for repeat pattern.",
    ],
    "UNKNOWN_PATTERN": [
        "Manually review this change — it does not match a known drift pattern.",
        "Consider adding a new rule to the Rule Engine if this recurs.",
    ],
}


def generate_narrative(assessment: dict, compliance: Optional[dict]) -> str:
    """
    Template-based analyst narrative (matches the style of the problem
    statement's own sample: "At <time>, <parameter> on <system> was changed
    from <baseline> to <current> by <actor> via <source>...").
    """
    event = assessment["event"]
    control = assessment["control"]
    actor = event.get("actor", {})
    mitre = compliance.get("mitre_technique") if compliance else event.get("mitre_technique")
    mitre_name = compliance.get("mitre_technique_name") if compliance else None
    nist = compliance.get("nist_800_53") if compliance else None

    approval_phrase = "within an approved maintenance window" if assessment["suppression"]["valid_maintenance_window"] \
        else "outside any approved maintenance window"

    parts = [
        f"At {event['timestamp']}, {event['field_changed']} on {control['service']} "
        f"({control['provider']}) was changed from {event['old_value']} to {event['new_value']} "
        f"by {actor.get('name', actor.get('id', 'an unknown actor'))} "
        f"({actor.get('type', 'unknown')}) via {event['action']}, {approval_phrase}."
    ]
    if mitre:
        parts.append(f"This aligns with MITRE ATT&CK technique {mitre}"
                      f"{f' ({mitre_name})' if mitre_name else ''}.")
    if nist:
        parts.append(f"Maps to NIST 800-53 {nist}.")
    parts.append(f"Classified as {assessment['final_severity']} severity "
                  f"(pattern: {assessment['pattern']}, score: {assessment['drift_score']}).")
    if assessment["suppressed"]:
        parts.append("Suppressed as likely benign based on contextual signals: "
                      + "; ".join(assessment["suppression"]["reasons"]) + ".")
    return " ".join(parts)


def build_drift_event(assessment: dict, compliance_by_control: dict) -> DriftEvent:
    event = assessment["event"]
    control = assessment["control"]
    actor = event.get("actor", {})
    compliance = compliance_by_control.get(control["control_id"])

    compliance_block = {}
    if compliance:
        compliance_block = {
            "nist_800_53": compliance["nist_800_53"],
            "nist_800_53_title": compliance["nist_800_53_title"],
            "cis_benchmark": compliance["cis_benchmark"],
            "mitre_technique": compliance["mitre_technique"],
            "mitre_technique_name": compliance["mitre_technique_name"],
            "gdpr_article": compliance["gdpr_article"],
        }

    change_source = actor.get("type", "unknown")
    if change_source == "pipeline":
        change_source = "ci_cd"

    approval_status = "approved" if assessment["suppression"]["valid_maintenance_window"] else (
        "pending" if event.get("maintenance_window_active") else "none"
    )

    drift = DriftEvent(
        drift_id=f"drift-evt-{next(_drift_id_counter):05d}",
        type="standalone",
        timestamp=event["timestamp"],
        control_id=control["control_id"],
        system=control["service"],
        domain=compliance["domain"] if compliance else control["universal_category"].lower(),
        parameter=event["field_changed"],
        baseline_value=control.get("expected_state", {}).get(event["field_changed"]),
        current_value=event["new_value"],
        changed_by=actor.get("id", "unknown"),
        change_source=change_source,
        approval_status=approval_status,
        status=assessment["status"],
        severity=assessment["final_severity"],
        drift_score=assessment["drift_score"],
        suppressed=assessment["suppressed"],
        suppression_reason="; ".join(assessment["suppression"]["reasons"]) or None,
        compliance_mappings=compliance_block,
        narrative=generate_narrative(assessment, compliance),
        remediation_steps=REMEDIATION_TEMPLATES.get(assessment["pattern"], REMEDIATION_TEMPLATES["UNKNOWN_PATTERN"]),
        source_event_id=event["event_id"],
        resource_id=event["resource_id"],
        actor_trust_score=actor.get("trust_score_at_event"),
    )
    return drift