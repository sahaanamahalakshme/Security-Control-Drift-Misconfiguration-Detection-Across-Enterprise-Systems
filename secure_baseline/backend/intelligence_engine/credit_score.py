import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from shared import schemas
from shared.schemas import SecurityCreditScore

def run(trust_map: dict = None, ttl_findings: list = None) -> SecurityCreditScore:
    """
    Calculates a FICO-style credit score for the organization's security posture.
    """
    drifts = schemas.load_drifts()
    
    score = 850
    factors = []
    
    # 1. Deduct for active unsuppressed drifts
    critical_count = sum(1 for d in drifts if d.get("severity") == "CRITICAL" and not d.get("suppressed"))
    high_count = sum(1 for d in drifts if d.get("severity") == "HIGH" and not d.get("suppressed"))
    
    if critical_count > 0:
        score -= (critical_count * 50)
        factors.append(f"{critical_count} active CRITICAL misconfigurations")
        
    if high_count > 0:
        score -= (high_count * 20)
        factors.append(f"{high_count} active HIGH misconfigurations")
        
    # 2. Deduct for poor trust actors
    if trust_map:
        untrusted = sum(1 for v in trust_map.values() if v.trust_band == "UNTRUSTED")
        if untrusted > 0:
            score -= (untrusted * 15)
            factors.append(f"{untrusted} actors are currently UNTRUSTED")
            
    # 3. Deduct for TTL violations
    if ttl_findings:
        score -= (len(ttl_findings) * 5)
        factors.append(f"{len(ttl_findings)} maintenance window TTL violations")
        
    score = max(300, min(850, score))
    
    # Mock trend
    trend = -1 * (850 - score) // 2
    
    return SecurityCreditScore(
        score=score,
        trend=trend,
        top_negative_factors=factors[:3]
    )

if __name__ == "__main__":
    from trust import trust_engine
    from ttl import ttl_engine
    
    tm = trust_engine.run()
    ttl = ttl_engine.run()
    
    sc = run(trust_map=tm, ttl_findings=ttl)
    print(f"Executive Security Credit Score: {sc.score} (Trend: {sc.trend})")
    for f in sc.top_negative_factors:
        print(f"  - {f}")
