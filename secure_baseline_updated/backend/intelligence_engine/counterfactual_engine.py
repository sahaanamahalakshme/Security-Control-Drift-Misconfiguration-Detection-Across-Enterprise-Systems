import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from typing import Dict, List

import networkx as nx

from shared import schemas
from shared.schemas import CounterfactualResult
from attack_graph import graph_builder


def _graph_without_resource(g: nx.DiGraph, resource_id: str) -> nx.DiGraph:
    g2 = g.copy()
    if resource_id in g2:
        g2.remove_edges_from(list(g2.out_edges(resource_id)))
    return g2


def analyze_drift(g: nx.DiGraph, drift: Dict) -> CounterfactualResult:
    resource_id = drift.get("resource_id")
    control = drift.get("control", drift.get("control_id", "UNKNOWN"))

    if not resource_id or resource_id not in g:
        return CounterfactualResult(
            drift_control=control,
            resource_id=resource_id,
            reachable_without_drift=False,
            blast_radius_with_drift=[],
            blast_radius_without_drift=[],
            risk_reduction=0,
        )

    with_drift = graph_builder.blast_radius(g, resource_id)
    g_hypothetical = _graph_without_resource(g, resource_id)
    without_drift = graph_builder.blast_radius(g_hypothetical, resource_id)

    return CounterfactualResult(
        drift_control=control,
        resource_id=resource_id,
        reachable_without_drift=len(without_drift) > 0,
        blast_radius_with_drift=with_drift,
        blast_radius_without_drift=without_drift,
        risk_reduction=len(with_drift) - len(without_drift),
    )


def run() -> List[CounterfactualResult]:
    g = graph_builder.build_graph()
    drifts = schemas.load_drifts()
    return [analyze_drift(g, d) for d in drifts]


if __name__ == "__main__":
    for r in run():
        print(f"Drift on control '{r.drift_control}' (resource={r.resource_id})")
        print(f"    blast radius WITH drift   : {r.blast_radius_with_drift}")
        print(f"    blast radius WITHOUT drift: {r.blast_radius_without_drift}")
        print(f"    risk reduction if fixed   : {r.risk_reduction} node(s) no longer reachable")
