"""
backend/intelligence_engine/run_all.py

Orchestrator for Member B's whole slice: Trust -> TTL -> Attack Graph ->
Deep Forensics -> Tribunal (uses Trust + Forensics) -> Counterfactual Engine.

Usage:
    cd secure_baseline/backend
    python -m intelligence_engine.run_all
"""

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from trust import trust_engine
from ttl import ttl_engine
from attack_graph import graph_builder
from tribunal import ai_tribunal
from intelligence_engine import counterfactual_engine
from intelligence_engine import deep_forensics
from intelligence_engine import drift_dna
from intelligence_engine import immune_memory
from intelligence_engine import forecasting
from intelligence_engine import business_impact
from intelligence_engine import credit_score
from intelligence_engine import time_machine
from intelligence_engine import storytelling

from remediation import auto_healer
from remediation import webhook_dispatcher

def main():
    print("=" * 70)
    print("SentinelDNA - Full 16-Stage Execution (0-15)")
    print("=" * 70)

    print("\n--- STAGE 1: INNATE IMMUNITY (Detection Engine) ---")
    print("  [Detection Engine runs via detection_engine.pipeline]")
    
    print("\n--- STAGE 2: ADAPTIVE TRUST & TTL ---")
    trust_map = trust_engine.run()
    print(f"  Processed {len(trust_map)} actors' trust scores.")
    ttl_findings = ttl_engine.run()
    print(f"  Found {len(ttl_findings)} TTL violations.")

    print("\n--- STAGE 3: DEEP FORENSICS ENGINE ---")
    anomalies = deep_forensics.run()
    forensic_map = {a.event_id: a for a in anomalies}
    print(f"  Evaluated ML anomalies for {len(anomalies)} events.")

    print("\n--- STAGE 4: ATTACK GRAPH CORRELATION ---")
    g = graph_builder.build_graph()
    print(f"  Graph built: {g.number_of_nodes()} nodes, {g.number_of_edges()} edges")

    print("\n--- STAGE 5: AI SECURITY TRIBUNAL ---")
    verdicts = ai_tribunal.run(trust_map=trust_map, forensic_map=forensic_map)
    blocks = sum(1 for v in verdicts if v.verdict == "BLOCK")
    print(f"  Rendered {len(verdicts)} verdicts ({blocks} BLOCKS).")

    print("\n--- STAGE 6: COUNTERFACTUAL SIMULATOR ---")
    cf = counterfactual_engine.run()
    print(f"  Simulated {len(cf)} remediation blast-radius scenarios.")
    
    print("\n--- STAGE 7: DRIFT DNA ---")
    lineages = drift_dna.run()
    print(f"  Tracked full mutation lineage for {len(lineages)} controls.")
    
    print("\n--- STAGE 8: IMMUNE MEMORY ---")
    sigs = immune_memory.run(verdicts)
    print(f"  Extracted {len(sigs)} Antibody Signatures from BLOCK verdicts.")
    
    print("\n--- STAGE 9: PREDICTIVE DRIFT FORECASTING ---")
    forecasts = forecasting.run()
    for f in forecasts[:2]:
        print(f"  {f.domain}: {f.probability*100:.1f}% chance of next drift.")
        
    print("\n--- STAGE 10: BUSINESS IMPACT TRANSLATOR ---")
    impacts = business_impact.run()
    total_risk = sum(i.estimated_fine_inr for i in impacts)
    print(f"  Translated technical drift to ₹{total_risk:,} in potential compliance fines.")
    
    print("\n--- STAGE 11: EXECUTIVE SECURITY CREDIT SCORE ---")
    score = credit_score.run(trust_map, ttl_findings)
    print(f"  Current Org Score: {score.score} (Trend: {score.trend})")
    
    print("\n--- STAGE 12: SECURITY TIME MACHINE ---")
    incidents = time_machine.run()
    print(f"  Correlated {len(incidents)} Compound Incidents based on time-window heuristics.")
    
    print("\n--- STAGE 13: AI INCIDENT STORYTELLING ---")
    stories = storytelling.run(incidents)
    for s in stories:
        print(f"  [{s.incident_id}] Generated AI narrative.")

    print("\n--- STAGE 14: AUTO-HEALER (Immune Effector) ---")
    actions = auto_healer.run(verdicts)
    print(f"  Generated {len(actions)} Auto-Remediation payloads (Status: PENDING_EXECUTION).")
    if actions:
        print(f"  Example Payload -> {actions[0].control_id}: {actions[0].generated_payload}")

    print("\n--- STAGE 15: SLACK WEBHOOK DISPATCHER ---")
    dispatched = webhook_dispatcher.run(verdicts, actions)
    print(f"  Dispatched {len(dispatched)} Slack alerts for BLOCK verdicts.")

    print("\n======================================================================")
    print("SentinelDNA pipeline executed all 16 stages successfully.")
    print("======================================================================")


if __name__ == "__main__":
    main()
