"""
shared/schemas.py

Thin I/O layer — the "Data Simulator" step. Both members clone the same
repo, both already have datasets/ locally, so this just reads JSON off
disk. No network calls, no waiting on anyone.
"""

import json
from pathlib import Path
from typing import Any, Dict, List

from shared import constants


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
    return data.get("baselines", data if isinstance(data, list) else [])


def load_events() -> List[Dict[str, Any]]:
    data = _load_json(constants.EVENTS_PATH)
    return data.get("events", data if isinstance(data, list) else [])


def load_maintenance_windows() -> List[Dict[str, Any]]:
    data = _load_json(constants.MAINTENANCE_PATH)
    return data.get("windows", data if isinstance(data, list) else [])


def load_topology() -> Dict[str, Any]:
    return _load_json(constants.TOPOLOGY_PATH)


def load_drifts() -> List[Dict[str, Any]]:
    """Reads from constants.DRIFTS_PATH — sample_drifts.json today,
    real_drifts.json once Member A's detection_engine ships. Callers
    never need to change."""
    data = _load_json(constants.DRIFTS_PATH)
    return data if isinstance(data, list) else data.get("drifts", [])
