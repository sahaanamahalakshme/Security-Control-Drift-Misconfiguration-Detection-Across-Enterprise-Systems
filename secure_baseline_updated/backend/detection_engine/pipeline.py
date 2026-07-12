from __future__ import annotations
import json
import sys
from pathlib import Path
from collections import Counter

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))  # allow `backend.*` absolute imports

from ontology.semantic_ontology import SemanticOntology
from baseline.baseline_engine import BaselineEngine
from detection_engine.drift_detector import DriftDetectionEngine
from detection_engine.drift_object_generator import build_drift_event
from shared.constants import TARGET_CONTROL_COVERAGE, TARGET_FALSE_POSITIVE_RATE


def load_datasets(datasets_dir: Path) -> dict:
    with open(datasets_dir / "baseline.json") as f:
        baseline = json.load(f)["controls"]
    with open(datasets_dir / "events.json") as f:
        events = json.load(f)["events"]
    with open(datasets_dir / "maintenance.json") as f:
        maintenance = json.load(f)["windows"]
    with open(datasets_dir / "compliance.json") as f:
        compliance = json.load(f)["mappings"]
    return {"baseline": baseline, "events": events, "maintenance": maintenance, "compliance": compliance}


def run_pipeline(datasets_dir: str = "../datasets", output_path: str = None) -> dict:
    datasets_dir = Path(datasets_dir)
    output_path = Path(output_path) if output_path else datasets_dir / "sample_drifts.json"

    data = load_datasets(datasets_dir)

    # --- Stage 0: Semantic Ontology (verify/re-normalize event categories) ---
    ontology = SemanticOntology(baseline_controls=data["baseline"])
    ontology_mismatches = []
    for e in data["events"]:
        derived_category = ontology.classify(e["provider"], e["service"])
        if derived_category != e["universal_category"] and derived_category != "UNCATEGORIZED":
            ontology_mismatches.append({
                "event_id": e["event_id"], "declared": e["universal_category"], "derived": derived_category
            })

    # --- Stage 0.5: Baseline Engine ---
    baseline_engine = BaselineEngine(data["baseline"])

    # --- Stage 4-5: Drift Detection + Rule Engine ---
    detector = DriftDetectionEngine(baseline_engine, data["maintenance"])
    assessments = detector.evaluate_all(data["events"])

    # --- Coverage metric (Success Criteria: >=95% controls evaluated) ---
    observed_control_ids = {e["control_id"] for e in data["events"]}
    coverage = baseline_engine.coverage_check(observed_control_ids)

    # --- Stage 6: Drift Object Generator ---
    compliance_by_control = {c["control_id"]: c for c in data["compliance"]}
    drift_events = []
    for assessment in assessments:
        if not assessment["is_drift_finding"]:
            continue  # Pass / CONTROL_STRENGTHENED -> not a finding, don't emit noise
        drift = build_drift_event(assessment, compliance_by_control)
        drift_events.append(drift.to_dict())

    drift_events.sort(key=lambda d: d["timestamp"])

    # --- Write output ---
    output = {
        "schema_version": "1.0",
        "generated_by": "SentinelDNA Detection Engine (Member A) - pipeline.py",
        "description": "Validated drift events produced by the Detection Engine. Consumed by Member B's Intelligence Engine and served via GET /drifts.",
        "drift_count": len(drift_events),
        "drifts": drift_events,
    }
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    # --- Metrics summary vs Success Criteria ---
    severity_counts = Counter(d["severity"] for d in drift_events)
    suppressed_count = sum(1 for d in drift_events if d["suppressed"])
    suppression_rate = round(suppressed_count / len(drift_events), 3) if drift_events else 0.0

    summary = {
        "total_events_processed": len(data["events"]),
        "events_with_unmapped_control": len(data["events"]) - len(assessments),
        "ontology_category_mismatches": len(ontology_mismatches),
        "control_coverage": coverage,
        "control_coverage_meets_target": coverage["coverage_pct"] >= TARGET_CONTROL_COVERAGE * 100,
        "total_drift_findings": len(drift_events),
        "severity_breakdown": dict(severity_counts),
        "suppressed_findings": suppressed_count,
        "suppression_rate": suppression_rate,
        "false_positive_rate_target": TARGET_FALSE_POSITIVE_RATE,
        "output_file": str(output_path),
    }
    return summary


if __name__ == "__main__":
    summary = run_pipeline()
    print(json.dumps(summary, indent=2))