import sys
import os
import itertools
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from typing import List

from shared import schemas
from shared.schemas import AntibodySignature, TribunalVerdict

_sig_counter = itertools.count(1)

def run(verdicts: List[TribunalVerdict] = None) -> List[AntibodySignature]:
    """
    Extracts signatures from past Tribunal 'BLOCK' verdicts to recognize them instantly
    next time. (Simulated memory bank).
    """
    if verdicts is None:
        # In a real system, we'd fetch from a database. For now, we mock.
        return []

    signatures = []
    drifts = {d.get("control_id"): d for d in schemas.load_drifts()}

    for v in verdicts:
        if v.verdict == "BLOCK":
            d = drifts.get(v.control)
            if not d:
                continue
            
            sig = AntibodySignature(
                signature_id=f"SIG-AB-{next(_sig_counter):04d}",
                actor_type=d.get("change_source", "unknown"),
                control_domain=d.get("domain", "unknown"),
                action_type="drift",  # Abstracted
                mitre_technique=d.get("compliance_mappings", {}).get("mitre_technique"),
                confidence_weight=v.confidence
            )
            signatures.append(sig)
            
    # Deduplicate by domain + mitre
    unique = {}
    for s in signatures:
        key = f"{s.control_domain}-{s.mitre_technique}-{s.actor_type}"
        if key not in unique or unique[key].confidence_weight < s.confidence_weight:
            unique[key] = s
            
    return list(unique.values())

if __name__ == "__main__":
    from tribunal import ai_tribunal
    from trust import trust_engine
    from intelligence_engine import deep_forensics
    
    trust_map = trust_engine.run()
    anoms = deep_forensics.run()
    forensic_map = {a.event_id: a for a in anoms}
    verdicts = ai_tribunal.run(trust_map, forensic_map)
    
    sigs = run(verdicts)
    print(f"Generated {len(sigs)} Antibody Signatures from recent BLOCK verdicts:")
    for s in sigs:
        print(f"  {s.signature_id}: Actor={s.actor_type} Domain={s.control_domain} MITRE={s.mitre_technique} (Confidence={s.confidence_weight})")
