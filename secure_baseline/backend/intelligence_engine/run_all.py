"""
backend/intelligence_engine/run_all.py

Orchestrator for Member B's whole slice: Trust -> TTL -> Attack Graph ->
Tribunal (uses Trust output) -> Counterfactual Engine.

Usage:
    python -m backend.intelligence_engine.run_all
"""

from backend.trust import trust_engine
from backend.ttl import ttl_engine
from backend.attack_graph import graph_builder
from backend.tribunal import ai_tribunal
from backend.intelligence_engine import counterfactual_engine


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
    print("4) AI TRIBUNAL  (reads sample_drifts.json, uses trust_map)")
    print("=" * 70)
    verdicts = ai_tribunal.run(trust_map=trust_map)
    for v in verdicts:
        print(f"  [{v.verdict:8s}] {v.control:12s} severity={v.severity:8s} confidence={v.confidence}")

    print()
    print("=" * 70)
    print("5) COUNTERFACTUAL ENGINE  (attack graph + sample_drifts.json)")
    print("=" * 70)
    for r in counterfactual_engine.run():
        print(f"  {r.drift_control:12s} risk_reduction_if_fixed={r.risk_reduction} node(s)")

    print()
    print("Member B pipeline ran end-to-end with zero dependency on Member A.")


if __name__ == "__main__":
    main()
