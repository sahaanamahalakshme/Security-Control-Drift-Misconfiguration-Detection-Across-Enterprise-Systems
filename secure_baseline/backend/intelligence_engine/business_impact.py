import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from typing import List

from shared import schemas
from shared.schemas import BusinessImpact

def run() -> List[BusinessImpact]:
    """
    Translates technical drift severities and compliance mappings into business risk language.
    """
    drifts = schemas.load_drifts()
    
    impacts = []
    for d in drifts:
        if d.get("severity") == "INFO" or d.get("suppressed"):
            continue
            
        severity = d.get("severity", "LOW")
        mappings = d.get("compliance_mappings", {})
        
        frameworks = []
        if mappings.get("gdpr_article"): frameworks.append("GDPR")
        if mappings.get("nist_800_53"): frameworks.append("NIST 800-53")
        if mappings.get("cis_benchmark"): frameworks.append("CIS")
        
        fine = 0
        revenue_risk = "Negligible"
        brand_damage = "None"
        
        if severity == "CRITICAL":
            fine = 5000000 if "GDPR" in frameworks else 1000000
            revenue_risk = "Severe (Service Outage or Data Breach)"
            brand_damage = "High (Public Disclosure Required)"
            nar = f"Critical vulnerability exposing {d.get('domain')} data. Direct violation of {', '.join(frameworks)}."
        elif severity == "HIGH":
            fine = 500000 if "GDPR" in frameworks else 100000
            revenue_risk = "Moderate (Compliance Fine)"
            brand_damage = "Medium (B2B Trust Impact)"
            nar = f"High risk drift in {d.get('system')}. Potential audit failure for {', '.join(frameworks)}."
        elif severity == "MEDIUM":
            fine = 50000
            revenue_risk = "Low"
            brand_damage = "Low"
            nar = f"Medium risk misconfiguration. Requires remediation before next audit cycle."
        else:
            continue
            
        impacts.append(BusinessImpact(
            drift_id=d["drift_id"],
            compliance_frameworks_at_risk=frameworks,
            estimated_fine_usd=fine,
            revenue_risk=revenue_risk,
            brand_damage=brand_damage,
            narrative=nar
        ))
        
    return impacts

if __name__ == "__main__":
    for i in run():
        print(f"{i.drift_id}: ${i.estimated_fine_usd:,} Risk | Revenue: {i.revenue_risk} | Brand: {i.brand_damage}")
