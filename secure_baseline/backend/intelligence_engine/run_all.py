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


def main():
    print("=" * 70)
    print("1) TRUST ENGINE  (reads events.json)")
    print("=" * 70)
    trust_map = trust_engine.run()
    for actor, r in trust_map.items():
        print(f"  {actor:22s} score={r.trust_score:6.2f}  band={r.trust_band}")

    print()
    print("=" * 70)
    print("2) TTL ENGINE  (reads maintenance.json)")
    print("=" * 70)
    ttl_findings = ttl_engine.run()
    if not ttl_findings:
        print("  No TTL findings.")
    for f in ttl_findings:
        flag = " [UNAPPROVED]" if f.unapproved else ""
        print(f"  [{f.reason.upper():18s}] {f.control_id} on {f.resource_id}{flag}")

    print()
    print("=" * 70)
    print("3) ATTACK GRAPH BUILDER  (reads baseline.json + topology.json)")
    print("=" * 70)
    g = graph_builder.build_graph()
    print(f"  {g.number_of_nodes()} nodes, {g.number_of_edges()} edges")

    print()
    print("=" * 70)
    print("4) DEEP FORENSICS ENGINE  (reads events.json + ML Isolation Forest)")
    print("=" * 70)
    anomalies = deep_forensics.run()
    # Build map by event_id for the Tribunal
    forensic_map = {a.event_id: a for a in anomalies}
    anomalies_sorted = sorted(anomalies, key=lambda x: x.combined_confidence, reverse=True)
    for a in anomalies_sorted[:5]:  # show top 5 anomalous events
        print(f"  [{a.combined_confidence:.2f}] {a.event_id:8s} actor={a.actor_id:22s} iso={a.isolation_score:.2f} cp={a.changepoint_score:.2f}")

    print()
    print("=" * 70)
    print("5) AI TRIBUNAL  (reads sample_drifts.json, uses trust_map + forensic_map)")
    print("=" * 70)
    verdicts = ai_tribunal.run(trust_map=trust_map, forensic_map=forensic_map)
    for v in verdicts:
        print(f"  [{v.verdict:8s}] {v.control:12s} severity={v.severity:8s} confidence={v.confidence}")
        print(f"             rationale: {v.rationale}")

    print()
    print("=" * 70)
    print("6) COUNTERFACTUAL ENGINE  (attack graph + sample_drifts.json)")
    print("=" * 70)
    for r in counterfactual_engine.run():
        print(f"  {r.drift_control:12s} risk_reduction_if_fixed={r.risk_reduction} node(s)")

    print()
    print("Member B pipeline ran end-to-end with zero dependency on Member A.")


if __name__ == "__main__":
    main()
