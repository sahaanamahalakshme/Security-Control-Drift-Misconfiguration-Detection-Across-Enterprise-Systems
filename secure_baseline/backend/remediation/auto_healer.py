import sys
import os
import itertools
import json
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from typing import List
from shared import schemas
from shared.schemas import RemediationAction, TribunalVerdict

_action_counter = itertools.count(1)

def _generate_payload(domain: str, control_id: str, baseline_value: any) -> str:
    """Mock generator for rollback payloads."""
    if domain.lower() == "aws":
        if "logging" in control_id.lower() or "cloudtrail" in control_id.lower():
            return f"aws cloudtrail start-logging --name {control_id}"
        elif "encryption" in control_id.lower():
            return f"aws kms enable-key-rotation --key-id {control_id}"
        else:
            return f"aws ssm put-parameter --name {control_id} --value {baseline_value} --overwrite"
            
    elif domain.lower() == "azure":
        return f"az network nsg rule update --name {control_id} --access Deny"
        
    elif domain.lower() == "firewall" or domain.lower() == "network":
        return f"pfsense-api -X POST /firewall/rule/revert -d '{{\"id\": \"{control_id}\"}}'"
        
    else:
        # Fallback to generic webhook payload
        return json.dumps({"action": "REVERT", "target": control_id, "safe_state": baseline_value})


def run(verdicts: List[TribunalVerdict] = None) -> List[RemediationAction]:
    """
    Acts as the Immune System's effector cells. Listens for BLOCK verdicts
    and generates the automated rollback sequences to heal the configuration.
    """
    if not verdicts:
        return []

    drifts = {d.get("control_id"): d for d in schemas.load_drifts()}
    baselines = {b.get("control_id"): b for b in schemas.load_baseline()}
    
    actions = []
    
    for v in verdicts:
        if v.verdict == "BLOCK":
            control_id = v.control
            drift = drifts.get(control_id) # Using control_id as key for simplicity since drift_id isn't always standard
            baseline = baselines.get(control_id)
            
            if not drift or not baseline:
                continue
                
            expected = baseline.get("baseline_value")
            domain = drift.get("domain", "Unknown")
            
            payload = _generate_payload(domain, control_id, expected)
            
            actions.append(RemediationAction(
                action_id=f"REM-{next(_action_counter):04d}",
                drift_id=drift.get("drift_id", "unknown"),
                control_id=control_id,
                domain=domain,
                rollback_value=expected,
                generated_payload=payload,
                status="PENDING_EXECUTION"
            ))
            
    return actions


if __name__ == "__main__":
    from tribunal import ai_tribunal
    from trust import trust_engine
    from intelligence_engine import deep_forensics
    
    trust_map = trust_engine.run()
    anoms = deep_forensics.run()
    forensic_map = {a.event_id: a for a in anoms}
    verdicts = ai_tribunal.run(trust_map, forensic_map)
    
    actions = run(verdicts)
    print(f"Auto-Healer generated {len(actions)} remediation payloads:")
    for a in actions:
        print(f"\n[{a.action_id}] Healing {a.control_id} ({a.domain})")
        print(f"  Target Baseline: {a.rollback_value}")
        print(f"  Payload: {a.generated_payload}")
        print(f"  Status: {a.status}")
