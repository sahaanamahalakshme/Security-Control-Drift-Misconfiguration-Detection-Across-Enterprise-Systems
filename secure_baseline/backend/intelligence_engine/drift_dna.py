import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from typing import Dict, List
from collections import defaultdict

from shared import schemas
from shared.schemas import DriftLineage


def run() -> List[DriftLineage]:
    raw_events = schemas.load_events()
    
    # Group raw events by control_id, ordered by time
    by_control: Dict[str, List[dict]] = defaultdict(list)
    for e in raw_events:
        c_id = e.get("control_id")
        if c_id:
            by_control[c_id].append(e)

    lineages = []
    for c_id, events in by_control.items():
        events.sort(key=lambda x: x["timestamp"])
        mutations = []
        for ev in events:
            mutations.append({
                "timestamp": ev["timestamp"],
                "action": ev.get("action", "unknown"),
                "actor": ev.get("actor", {}).get("id", "unknown"),
                "field": ev.get("field_changed", "unknown"),
                "old": ev.get("old_value"),
                "new": ev.get("new_value"),
                "maintenance": ev.get("maintenance_window_active", False)
            })
        lineages.append(DriftLineage(control_id=c_id, mutations=mutations))
        
    return lineages

if __name__ == "__main__":
    for l in run():
        print(f"Control: {l.control_id} ({len(l.mutations)} mutations)")
        for m in l.mutations:
            print(f"  [{m['timestamp']}] {m['actor']} -> {m['action']} ({m['field']}: {m['old']} -> {m['new']})")
