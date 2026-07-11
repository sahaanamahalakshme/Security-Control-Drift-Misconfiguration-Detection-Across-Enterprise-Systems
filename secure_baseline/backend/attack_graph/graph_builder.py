import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from typing import Dict, List, Optional

import networkx as nx

from shared import schemas
from shared.schemas import GraphNode, GraphEdge


def build_graph() -> nx.DiGraph:
    topo = schemas.load_topology()
    baseline = {b["resource_id"]: b for b in schemas.load_baseline() if "resource_id" in b}

    g = nx.DiGraph()

    for n in topo.get("nodes", []):
        node = GraphNode(
            id=n["id"],
            type=n.get("type", "unknown"),
            provider=n.get("provider"),
            environment=n.get("environment"),
            criticality=n.get("criticality"),
            exposed_to_internet=bool(n.get("exposed_to_internet", False)),
            business_tag=n.get("business_tag"),
        )
        g.add_node(
            node.id,
            type=node.type,
            provider=node.provider,
            environment=node.environment,
            criticality=node.criticality,
            exposed_to_internet=node.exposed_to_internet,
            business_tag=node.business_tag,
            control_id=baseline.get(node.id, {}).get("control_id"),
        )

    for e in topo.get("edges", []):
        edge = GraphEdge(
            source=e["from"],
            target=e["to"],
            relation=e.get("relationship", "connects_to"),
            mitre_technique=e.get("mitre_technique"),
            exploit_probability=e.get("exploit_probability"),
            compliance_impact=e.get("compliance_impact"),
            business_impact=e.get("business_impact"),
        )
        g.add_edge(
            edge.source,
            edge.target,
            relation=edge.relation,
            mitre_technique=edge.mitre_technique,
            exploit_probability=edge.exploit_probability,
            compliance_impact=edge.compliance_impact,
            business_impact=edge.business_impact,
        )

    return g


def find_paths(g: nx.DiGraph, source: str, target: str) -> List[List[str]]:
    if source not in g or target not in g:
        return []
    try:
        return list(nx.all_simple_paths(g, source=source, target=target))
    except nx.NetworkXNoPath:
        return []


def highest_risk_path(g: nx.DiGraph, source: str, target: str) -> Optional[List[str]]:
    """Among all simple paths, return the one with the highest product of
    exploit_probability along its edges (the most likely attack chain)."""
    paths = find_paths(g, source, target)
    if not paths:
        return None

    def path_risk(path: List[str]) -> float:
        risk = 1.0
        for a, b in zip(path, path[1:]):
            risk *= g.edges[a, b].get("exploit_probability") or 0.05
        return risk

    return max(paths, key=path_risk)


def blast_radius(g: nx.DiGraph, start: str) -> List[str]:
    if start not in g:
        return []
    return sorted(nx.descendants(g, start))


def run() -> Dict:
    g = build_graph()
    return {
        "node_count": g.number_of_nodes(),
        "edge_count": g.number_of_edges(),
        "nodes": list(g.nodes(data=True)),
        "edges": list(g.edges(data=True)),
    }


if __name__ == "__main__":
    g = build_graph()
    print(f"Graph built: {g.number_of_nodes()} nodes, {g.number_of_edges()} edges")
    target = "arn:aws:s3:::sentineldna-prod-payments"
    path = highest_risk_path(g, "INTERNET", target)
    print(f"Highest-risk path INTERNET -> {target}:")
    print("   ", " -> ".join(path) if path else "no path found")
