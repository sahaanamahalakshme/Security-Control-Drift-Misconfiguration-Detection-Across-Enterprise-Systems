from __future__ import annotations
from typing import Optional
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from baseline.baseline_engine import BaselineEngine
from rules.rule_engine import classify_pattern, score_pattern
from rules.suppression import compute_suppression
from shared.constants import (
    ENVIRONMENT_CRITICALITY, CRITICALITY_TO_ENV_PROXY, SCORE_SEVERITY_BANDS
)
from shared.enums import DriftStatus


def _score_to_severity(score: float) -> str:
    for threshold, severity in SCORE_SEVERITY_BANDS:
        if score >= threshold:
            return severity
    return "INFO"


class DriftDetectionEngine:
    def __init__(self, baseline_engine: BaselineEngine, maintenance_windows: list):
        self.baseline_engine = baseline_engine
        self.maintenance_windows = maintenance_windows

    def evaluate_event(self, event: dict) -> Optional[dict]:
        """
        Returns a fully-scored drift assessment dict, or None if the control
        referenced by the event isn't in the baseline (control coverage gap
        — logged by the pipeline, not silently dropped).
        """
        control = self.baseline_engine.get_by_control_id(event["control_id"])
        if control is None:
            return None

        field = event["field_changed"]
        expected_value = control.get("expected_state", {}).get(field)
        current_value = event["new_value"]

        # --- Pass / Fail / Degraded classification ---
        if expected_value is None:
            status = DriftStatus.DEGRADED.value  # field not explicitly modeled in baseline
        elif current_value == expected_value:
            status = DriftStatus.PASS.value
        else:
            status = DriftStatus.FAIL.value

        # --- Rule Engine: what kind of drift, and how heavy is it ---
        pattern = classify_pattern(event["universal_category"], field,
                                    event["old_value"], event["new_value"])
        rule_weight, base_severity = score_pattern(pattern)

        # --- Suppression: is this actually benign noise? ---
        suppression = compute_suppression(event, self.maintenance_windows)

        # --- Environment criticality proxy ---
        env_proxy = CRITICALITY_TO_ENV_PROXY.get(control.get("criticality", "MEDIUM"), "staging")
        env_multiplier = ENVIRONMENT_CRITICALITY[env_proxy]

        # --- Suppression discount scaling ---
        # CRITICAL severity: approval reduces risk but never eliminates it.
        # "What if a malicious actor creates an approved change ticket?"
        # Answer: "Approval reduces risk but never eliminates critical drift."
        effective_discount = suppression["discount"]
        if base_severity == "CRITICAL" and effective_discount > 0:
            effective_discount = round(effective_discount * 0.3, 2)

        raw_score = (rule_weight * env_multiplier) - effective_discount
        raw_score = max(raw_score, 0)
        final_severity = _score_to_severity(raw_score)

        # A pattern that strengthens a control (or Pass status) is never a
        # risk finding, regardless of score noise.
        is_drift_finding = status != DriftStatus.PASS.value and pattern != "CONTROL_STRENGTHENED"

        # Suppression logic: suppress if score drops below threshold OR if
        # a valid discount >= 3 exists (approved maintenance) — but NEVER
        # suppress CRITICAL severity findings.
        suppressed = is_drift_finding and (
            (raw_score <= 1 and effective_discount > 0)
            or (suppression["discount"] >= 3 and base_severity != "CRITICAL")
        )

        return {
            "event": event,
            "control": control,
            "status": status,
            "pattern": pattern,
            "rule_weight": rule_weight,
            "base_severity": base_severity,
            "final_severity": final_severity if is_drift_finding else "INFO",
            "drift_score": round(raw_score, 2),
            "environment_proxy": env_proxy,
            "is_drift_finding": is_drift_finding,
            "suppressed": suppressed,
            "suppression": suppression,
        }

    def evaluate_all(self, events: list) -> list[dict]:
        results = []
        for event in events:
            result = self.evaluate_event(event)
            if result is not None:
                results.append(result)
        return results