"""
shared/schemas.py

Single source of truth for ALL data models in SentinelDNA.

  ChangeEvent       → raw input event from events.json (parsed)
  DriftEvent        → detected drift output from Detection Engine
  ForensicAnomaly   → ML anomaly output from Deep Forensics
  TrustResult       → actor trust score output
  TTLFinding        → TTL violation output
  TribunalVerdict   → AI Tribunal final decision
  CounterfactualResult → remediation priority output

Data loaders live here too — thin I/O layer (the "Data Simulator" step).
"""

from __future__ import annotations
import json
from pathlib import Path
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Any, Dict, List, Optional

from .enums import Severity, DriftStatus
from . import constants


# ---------------------------------------------------------------------------
# Timestamp parsing
# ---------------------------------------------------------------------------

def parse_ts(ts: str) -> datetime:
    """Parse ISO-8601 timestamps (handles both 'Z' suffix and +00:00)."""
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


# ---------------------------------------------------------------------------
# Input Models (raw dataset parsing for Intelligence Engine)
# ---------------------------------------------------------------------------

@dataclass
class Actor:
    """Nested actor object within an event."""
    id: str
    name: str = ""
    type: str = "unknown"
    role: str = ""
    trust_score_at_event: Optional[float] = None

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Actor":
        return cls(
            id=d.get("id", "unknown"),
            name=d.get("name", ""),
            type=d.get("type", "unknown"),
            role=d.get("role", ""),
            trust_score_at_event=d.get("trust_score_at_event"),
        )


@dataclass
class ChangeEvent:
    """One parsed row from datasets/events.json.
    Used by Trust Engine, Deep Forensics, and anywhere raw events are consumed.
    """
    event_id: str
    timestamp: datetime
    provider: str
    service: str
    control_id: str
    universal_category: str
    action: str
    field_changed: str
    old_value: Any
    new_value: Any
    actor: Actor
    source_ip: str
    region: str
    resource_id: str
    maintenance_window_active: bool
    severity: str                       # normalized from rule_engine_severity
    mitre_technique: Optional[str] = None
    notes: Optional[str] = None

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "ChangeEvent":
        return cls(
            event_id=d.get("event_id", "unknown"),
            timestamp=parse_ts(d["timestamp"]),
            provider=d.get("provider", "unknown"),
            service=d.get("service", "unknown"),
            control_id=d.get("control_id", "unknown"),
            universal_category=d.get("universal_category", "UNCATEGORIZED"),
            action=d.get("action", "unknown"),
            field_changed=d.get("field_changed", "unknown"),
            old_value=d.get("old_value"),
            new_value=d.get("new_value"),
            actor=Actor.from_dict(d.get("actor", {})),
            source_ip=d.get("source_ip", "unknown"),
            region=d.get("region", "unknown"),
            resource_id=d.get("resource_id", "unknown"),
            maintenance_window_active=bool(d.get("maintenance_window_active", False)),
            severity=constants.normalize_severity(d.get("rule_engine_severity")),
            mitre_technique=d.get("mitre_technique"),
            notes=d.get("notes"),
        )


@dataclass
class MaintenanceWindow:
    """One parsed row from datasets/maintenance.json (TTL contract)."""
    maintenance_id: str
    control_id: str
    resource_id: str
    requested_by: str
    approved_by: Optional[str]
    start_time: datetime
    expiry_time: datetime
    reason: str
    status: str
    ticket_ref: Optional[str] = None
    escalation_note: Optional[str] = None

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "MaintenanceWindow":
        return cls(
            maintenance_id=d["maintenance_id"],
            control_id=d["control_id"],
            resource_id=d.get("resource_id", "unknown"),
            requested_by=d.get("requested_by", "unknown"),
            approved_by=d.get("approved_by"),
            start_time=parse_ts(d["start_time"]),
            expiry_time=parse_ts(d["expiry_time"]),
            reason=d.get("reason", ""),
            status=d.get("status", "unknown"),
            ticket_ref=d.get("ticket_ref"),
            escalation_note=d.get("escalation_note"),
        )


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


# ---------------------------------------------------------------------------
# Detection Engine Output
# ---------------------------------------------------------------------------

@dataclass
class DriftEvent:
    """Output drift finding from the Detection Engine.
    Written to sample_drifts.json, consumed by Intelligence Engine.
    """
    drift_id: str
    type: str  # "standalone"; correlator may relabel to "compound"
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


# ---------------------------------------------------------------------------
# Intelligence Engine Results
# ---------------------------------------------------------------------------

@dataclass
class TrustResult:
    """Per-actor trust score from the Trust Engine."""
    actor: str
    trust_score: float
    trust_band: str
    reasons: List[str] = field(default_factory=list)


@dataclass
class TTLFinding:
    """TTL violation from the TTL Engine."""
    control_id: str
    resource_id: str
    maintenance_id: str
    reason: str              # e.g. "expired_unreverted", "invalid_retroactive", "overdue"
    expiry_time: datetime
    minutes_overdue: float
    status: str
    unapproved: bool = False


@dataclass
class GraphNode:
    """Node in the attack graph."""
    id: str
    type: str
    provider: Optional[str] = None
    environment: Optional[str] = None
    criticality: Optional[str] = None
    exposed_to_internet: bool = False
    business_tag: Optional[str] = None


@dataclass
class GraphEdge:
    """Edge in the attack graph."""
    source: str
    target: str
    relation: str
    mitre_technique: Optional[str] = None
    exploit_probability: Optional[float] = None
    compliance_impact: Optional[str] = None
    business_impact: Optional[str] = None


@dataclass
class TribunalVerdict:
    """Final verdict from the AI Security Tribunal."""
    control: str
    severity: str
    verdict: str
    confidence: float
    rationale: str


@dataclass
class CounterfactualResult:
    """Counterfactual "what-if" analysis for remediation prioritization."""
    drift_control: str
    resource_id: Optional[str]
    reachable_without_drift: bool
    blast_radius_with_drift: List[str]
    blast_radius_without_drift: List[str]
    risk_reduction: int


@dataclass
class ForensicAnomaly:
    """Output from the Deep Forensics Engine (Stage 3)."""
    anomaly_id: str
    event_id: str
    control_id: str
    actor_id: str
    isolation_score: float
    changepoint_score: float
    combined_confidence: float
    reasons: List[str] = field(default_factory=list)


@dataclass
class DriftLineage:
    """Output from Drift DNA (Stage 7). Tracks a control's mutation history."""
    control_id: str
    mutations: List[Dict[str, Any]]  # Sequential list of changes


@dataclass
class AntibodySignature:
    """Output from Immune Memory (Stage 8). A fingerprint of known malicious behavior."""
    signature_id: str
    actor_type: str
    control_domain: str
    action_type: str
    mitre_technique: Optional[str]
    confidence_weight: float


@dataclass
class DriftForecast:
    """Output from Predictive Drift Forecasting (Stage 9)."""
    domain: str
    probability: float
    predicted_volume: int
    velocity_trend: str  # "accelerating", "stable", "decelerating"


@dataclass
class BusinessImpact:
    """Output from Business Impact Translator (Stage 10)."""
    drift_id: str
    compliance_frameworks_at_risk: List[str]
    estimated_fine_usd: int
    revenue_risk: str
    brand_damage: str
    narrative: str


@dataclass
class SecurityCreditScore:
    """Output from Executive Security Credit Score (Stage 11)."""
    score: int          # 300 - 850
    trend: int          # e.g., -15 or +5
    top_negative_factors: List[str]


@dataclass
class CompoundIncident:
    """Output from Security Time Machine (Stage 12). Groups drifts."""
    incident_id: str
    drifts: List[str]       # list of drift_ids
    primary_actor: str
    start_time: datetime
    end_time: datetime
    severity: str
    mitre_techniques: List[str]


@dataclass
class IncidentNarrative:
    """Output from AI Incident Storytelling (Stage 13)."""
    incident_id: str
    story: str
    remediation_order: List[str]


@dataclass
class RemediationAction:
    """Output from Auto-Healer (Stage 14)."""
    action_id: str
    drift_id: str
    control_id: str
    domain: str
    rollback_value: Any
    generated_payload: str
    status: str = "PENDING_EXECUTION"


# ---------------------------------------------------------------------------
# Data Loaders (thin I/O — the "Data Simulator" step)
# ---------------------------------------------------------------------------

def _load_json(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(
            f"Expected dataset at {path}. Did you clone the datasets/ folder?"
        )
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_baseline() -> List[Dict[str, Any]]:
    if not constants.BASELINE_PATH.exists():
        return []
    data = _load_json(constants.BASELINE_PATH)
    return data.get("controls", data.get("baselines", data if isinstance(data, list) else []))


def load_events() -> List[Dict[str, Any]]:
    data = _load_json(constants.EVENTS_PATH)
    return data.get("events", data if isinstance(data, list) else [])


def load_maintenance_windows() -> List[Dict[str, Any]]:
    data = _load_json(constants.MAINTENANCE_PATH)
    return data.get("windows", data if isinstance(data, list) else [])


def load_topology() -> Dict[str, Any]:
    return _load_json(constants.TOPOLOGY_PATH)


def load_compliance() -> List[Dict[str, Any]]:
    data = _load_json(constants.COMPLIANCE_PATH)
    return data.get("mappings", data if isinstance(data, list) else [])


def load_drifts() -> List[Dict[str, Any]]:
    """Reads from constants.DRIFTS_PATH — sample_drifts.json today,
    real_drifts.json once Member A's detection_engine ships. Callers
    never need to change."""
    data = _load_json(constants.DRIFTS_PATH)
    return data if isinstance(data, list) else data.get("drifts", [])