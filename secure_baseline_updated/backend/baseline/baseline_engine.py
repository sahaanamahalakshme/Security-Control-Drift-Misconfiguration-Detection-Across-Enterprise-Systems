
from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Optional


class BaselineEngine:
    def __init__(self, controls: list):
        self._by_control_id: dict[str, dict] = {c["control_id"]: c for c in controls}
        self._by_resource_id: dict[str, dict] = {c["resource_id"]: c for c in controls}
        self._controls = controls

    @classmethod
    def from_file(cls, path: str) -> "BaselineEngine":
        with open(path) as f:
            data = json.load(f)
        return cls(data["controls"])

    def get_by_control_id(self, control_id: str) -> Optional[dict]:
        return self._by_control_id.get(control_id)

    def get_by_resource_id(self, resource_id: str) -> Optional[dict]:
        return self._by_resource_id.get(resource_id)

    def get_expected_value(self, control_id: str, field: str) -> Any:
        """Expected value for a specific field within a control's expected_state."""
        control = self._by_control_id.get(control_id)
        if not control:
            return None
        return control.get("expected_state", {}).get(field)

    def all_control_ids(self) -> list[str]:
        return list(self._by_control_id.keys())

    def coverage_check(self, observed_control_ids: set[str]) -> dict:
        """
        Success-criteria metric: '>=95% controls continuously evaluated'.
        Returns how many baseline controls actually had at least one event
        observed against them in this run.
        """
        total = len(self._by_control_id)
        covered = len(observed_control_ids & set(self._by_control_id.keys()))
        coverage_pct = round((covered / total) * 100, 1) if total else 0.0
        return {
            "total_controls": total,
            "controls_with_events": covered,
            "coverage_pct": coverage_pct,
            "uncovered_control_ids": sorted(set(self._by_control_id.keys()) - observed_control_ids),
        }

    def __len__(self) -> int:
        return len(self._controls)


if __name__ == "__main__":
    engine = BaselineEngine.from_file("../../datasets/baseline.json")
    print("Loaded controls:", len(engine))
    print("CTRL-AWS-001 expected 'enabled':", engine.get_expected_value("CTRL-AWS-001", "enabled"))