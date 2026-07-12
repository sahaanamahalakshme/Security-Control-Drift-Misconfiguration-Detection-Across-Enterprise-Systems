"""
shared/enums.py

All enumerations used across SentinelDNA engines.
"""

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


class TrustBand(str, Enum):
    HIGH_TRUST = "HIGH_TRUST"
    MODERATE_TRUST = "MODERATE_TRUST"
    LOW_TRUST = "LOW_TRUST"
    UNTRUSTED = "UNTRUSTED"


class TribunalVerdictType(str, Enum):
    ALLOW = "ALLOW"
    ESCALATE = "ESCALATE"
    BLOCK = "BLOCK"
