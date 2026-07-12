import sys
import os
import itertools
from datetime import datetime, timedelta
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from typing import List, Dict
from collections import defaultdict

from shared import schemas
from shared.schemas import CompoundIncident

_incident_counter = itertools.count(1)

def _parse_ts(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))

def run() -> List[CompoundIncident]:
    """
    Time Machine / Correlator:
    Groups drifts across domains that occurred within a tight time window (e.g. 2 hours)
    by the same actor, upgrading them to a Compound Incident.
    """
    drifts = schemas.load_drifts()
    
    # Filter out INFO / suppressed
    active_drifts = [d for d in drifts if d.get("severity") != "INFO" and not d.get("suppressed")]
    active_drifts.sort(key=lambda x: _parse_ts(x["timestamp"]))
    
    # Group by actor
    by_actor = defaultdict(list)
    for d in active_drifts:
        actor = d.get("changed_by", "unknown")
        by_actor[actor].append(d)
        
    incidents = []
    
    for actor, actor_drifts in by_actor.items():
        if len(actor_drifts) < 2:
            continue
            
        # Time-window clustering (2 hours)
        clusters = []
        current_cluster = [actor_drifts[0]]
        
        for i in range(1, len(actor_drifts)):
            prev_ts = _parse_ts(current_cluster[-1]["timestamp"])
            curr_ts = _parse_ts(actor_drifts[i]["timestamp"])
            
            if (curr_ts - prev_ts) <= timedelta(hours=2):
                current_cluster.append(actor_drifts[i])
            else:
                clusters.append(current_cluster)
                current_cluster = [actor_drifts[i]]
        clusters.append(current_cluster)
        
        for cluster in clusters:
            if len(cluster) > 1:
                # We have a compound incident!
                severities = [d.get("severity") for d in cluster]
                if "CRITICAL" in severities:
                    overall = "CRITICAL"
                elif "HIGH" in severities:
                    overall = "HIGH"
                else:
                    overall = "MEDIUM"
                    
                mitre = list(set([d.get("compliance_mappings", {}).get("mitre_technique") for d in cluster if d.get("compliance_mappings", {}).get("mitre_technique")]))
                
                incidents.append(CompoundIncident(
                    incident_id=f"INC-{next(_incident_counter):05d}",
                    drifts=[d["drift_id"] for d in cluster],
                    primary_actor=actor,
                    start_time=_parse_ts(cluster[0]["timestamp"]),
                    end_time=_parse_ts(cluster[-1]["timestamp"]),
                    severity=overall,
                    mitre_techniques=mitre
                ))
                
    return incidents

if __name__ == "__main__":
    incs = run()
    print(f"Time Machine found {len(incs)} Compound Incidents:")
    for inc in incs:
        print(f"  {inc.incident_id} [{inc.severity}] | Actor: {inc.primary_actor} | Duration: {inc.end_time - inc.start_time}")
        print(f"      Drifts grouped: {', '.join(inc.drifts)}")
        print(f"      MITRE TTPs: {', '.join(inc.mitre_techniques)}")
