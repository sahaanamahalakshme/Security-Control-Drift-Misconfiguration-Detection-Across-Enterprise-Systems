import sys
import os
from collections import Counter
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from typing import List

from shared import schemas
from shared.schemas import DriftForecast

def run() -> List[DriftForecast]:
    """
    Predicts which domains are most likely to experience drift based on historical event volumes.
    """
    raw_events = schemas.load_events()
    
    # Calculate domain frequencies based on universal_category (proxy for domain)
    domain_counts = Counter([e.get("universal_category", "UNKNOWN") for e in raw_events])
    
    total = sum(domain_counts.values())
    if total == 0:
        return []
        
    forecasts = []
    for domain, count in domain_counts.most_common():
        prob = count / total
        # Mock trend logic based on volume
        if count > total * 0.3:
            trend = "accelerating"
        elif count > total * 0.1:
            trend = "stable"
        else:
            trend = "decelerating"
            
        forecasts.append(DriftForecast(
            domain=domain,
            probability=round(prob, 3),
            predicted_volume=int(count * 1.5), # naive extrapolation
            velocity_trend=trend
        ))
        
    return forecasts

if __name__ == "__main__":
    print("Predictive Drift Forecasting:")
    for f in run():
        print(f"  {f.domain:28s}: {f.probability*100:5.1f}% chance of next drift ({f.velocity_trend})")
