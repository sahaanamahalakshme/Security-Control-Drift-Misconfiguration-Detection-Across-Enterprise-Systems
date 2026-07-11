from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Any, Optional
from enum import Enum


class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class DriftStatus(str, Enum):
    PASS = "Pass"          # current state matches baseline
    FAIL = "Fail"          # drifted — risky
    DEGRADED = "Degraded"  # partially compliant / ambiguous


@dataclass
class Control:
    """One row from datasets/baseline.json (expected state)."""
    control_id: str
    provider: str
    service: str
    control_name: str
    universal_category: str
    resource_id: str
    expected_state: dict
    compliance_mapping: list
    owner_team: str
    criticality: str


@dataclass
class ChangeEvent:
    """One row from datasets/events.json (raw observed change)."""
    event_id: str
    timestamp: str
    provider: str
    service: str
    control_id: str
    universal_category: str
    action: str
    field_changed: str
    old_value: Any
    new_value: Any
    actor: dict
    source_ip: str
    region: str
    resource_id: str
    maintenance_window_active: bool
    rule_engine_severity: Optional[str] = None
    mitre_technique: Optional[str] = None
    notes: Optional[str] = None


@dataclass
class MaintenanceWindow:
    """One row from datasets/maintenance.json (TTL contract)."""
    maintenance_id: str
    control_id: str
    resource_id: str
    requested_by: str
    approved_by: Optional[str]
    start_time: str
    expiry_time: str
    reason: str
    status: str
    ticket_ref: Optional[str] = None
    escalation_note: Optional[str] = None


@dataclass
class ComplianceMapping:
    """One row from datasets/compliance.json."""
    control_id: str
    domain: str
    system: str
    parameter: str
    severity_if_drifted: str
    nist_800_53: str
    nist_800_53_title: str
    cis_benchmark: str
    mitre_technique: str
    mitre_technique_name: str
    gdpr_article: str


@dataclass
class DriftEvent:
    drift_id: str
    type: str  # "standalone" here; Member B's correlator may later relabel to "compound"
    timestamp: str
    control_id: str
    system: str
    domain: str
    parameter: str
    baseline_value: Any
    current_value: Any
    changed_by: str
    change_source: str            # human | ci_cd | automation | unknown
    approval_status: str          # approved | pending | none
    status: str                   # Pass | Fail | Degraded
    severity: str                 # CRITICAL | HIGH | MEDIUM | LOW | INFO
    drift_score: float
    suppressed: bool
    suppression_reason: Optional[str]
    compliance_mappings: dict
    narrative: str
    remediation_steps: list
    source_event_id: str
    resource_id: str
    actor_trust_score: Optional[float] = None

    def to_dict(self) -> dict:
        return asdict(self)