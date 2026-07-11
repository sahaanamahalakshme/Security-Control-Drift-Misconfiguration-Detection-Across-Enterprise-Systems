"""
shared/models.py

Dataclasses matching the ACTUAL SentinelDNA dataset schema:
- events.json:      nested "actor" object, "rule_engine_severity",
                     "old_value"/"new_value", "maintenance_window_active",
                     optional "mitre_technique"/"notes".
- maintenance.json:  "status" can be closed/active/expired_unreverted/
                     invalid_retroactive; "approved_by" may be null.
- topology.json:     edges use "from"/"to"/"relationship", plus
                     "exploit_probability"/"mitre_technique"/etc.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any, List


def parse_ts(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


@dataclass
class Actor:
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
class DriftEvent:
    event_id: str
    timestamp: datetime
    provider: str
    service: str
    control_id: str
    action: str
    field_changed: str
    old_value: Any
    new_value: Any
    actor: Actor
    resource_id: str
    region: str
    maintenance_window_active: bool
    severity: str                       # normalized from rule_engine_severity
    mitre_technique: Optional[str] = None
    notes: Optional[str] = None

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "DriftEvent":
        from shared.constants import normalize_severity
        return cls(
            event_id=d.get("event_id", "unknown"),
            timestamp=parse_ts(d["timestamp"]),
            provider=d.get("provider", "unknown"),
            service=d.get("service", "unknown"),
            control_id=d.get("control_id", "unknown"),
            action=d.get("action", "unknown"),
            field_changed=d.get("field_changed", "unknown"),
            old_value=d.get("old_value"),
            new_value=d.get("new_value"),
            actor=Actor.from_dict(d.get("actor", {})),
            resource_id=d.get("resource_id", "unknown"),
            region=d.get("region", "unknown"),
            maintenance_window_active=bool(d.get("maintenance_window_active", False)),
            severity=normalize_severity(d.get("rule_engine_severity")),
            mitre_technique=d.get("mitre_technique"),
            notes=d.get("notes"),
        )


@dataclass
class MaintenanceWindow:
    maintenance_id: str
    control_id: str
    resource_id: str
    requested_by: str
    approved_by: Optional[str]
    start_time: datetime
    expiry_time: datetime
    reason: str
    status: str
    ticket_ref: Optional[str]
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
class TrustResult:
    actor: str
    trust_score: float
    trust_band: str
    reasons: List[str] = field(default_factory=list)


@dataclass
class TTLFinding:
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
    id: str
    type: str
    provider: Optional[str] = None
    environment: Optional[str] = None
    criticality: Optional[str] = None
    exposed_to_internet: bool = False
    business_tag: Optional[str] = None


@dataclass
class GraphEdge:
    source: str
    target: str
    relation: str
    mitre_technique: Optional[str] = None
    exploit_probability: Optional[float] = None
    compliance_impact: Optional[str] = None
    business_impact: Optional[str] = None


@dataclass
class TribunalVerdict:
    control: str
    severity: str
    verdict: str
    confidence: float
    rationale: str


@dataclass
class CounterfactualResult:
    drift_control: str
    resource_id: Optional[str]
    reachable_without_drift: bool
    blast_radius_with_drift: List[str]
    blast_radius_without_drift: List[str]
    risk_reduction: int
