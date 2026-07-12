from __future__ import annotations
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any

from shared.schemas import load_drifts, load_baseline, load_events, load_maintenance_windows
from shared import constants

# Member A imports
from detection_engine.pipeline import run_pipeline

# Member B imports
from trust import trust_engine
from ttl import ttl_engine
from attack_graph import graph_builder
from tribunal import ai_tribunal
from intelligence_engine import counterfactual_engine, deep_forensics
from intelligence_engine import drift_dna, immune_memory, forecasting
from intelligence_engine import business_impact, credit_score, time_machine, storytelling
from remediation import auto_healer, webhook_dispatcher

DATASETS_DIR = Path(__file__).resolve().parent.parent.parent / "datasets"
SAMPLE_DRIFTS_PATH = DATASETS_DIR / "sample_drifts.json"

app = FastAPI(
    title="SentinelDNA API",
    description="Unified API exposing Detection Engine (Member A) and Intelligence Engine (Member B) endpoints.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)


def _safe_load_drifts() -> List[Dict[str, Any]]:
    if not SAMPLE_DRIFTS_PATH.exists():
        raise HTTPException(status_code=503, detail="sample_drifts.json not generated yet. POST /pipeline/run first.")
    return load_drifts()


# =====================================================================
# SYSTEM ENDPOINTS
# =====================================================================

@app.get("/health")
def health():
    return {"status": "ok", "service": "sentineldna-unified-api"}


@app.post("/pipeline/run")
def trigger_pipeline_run():
    """Re-runs the full Detection Engine pipeline and regenerates sample_drifts.json."""
    summary = run_pipeline(datasets_dir=str(DATASETS_DIR), output_path=str(SAMPLE_DRIFTS_PATH))
    return {"status": "completed", "detection_summary": summary}


@app.post("/intelligence/run")
def trigger_intelligence_run():
    """Runs the full Intelligence Engine pipeline and returns aggregated verdicts and forensics."""
    # 1. Trust
    trust_map = trust_engine.run()
    # 2. Forensics
    anomalies = deep_forensics.run()
    forensic_map = {a.event_id: a for a in anomalies}
    # 3. Tribunal
    verdicts = ai_tribunal.run(trust_map=trust_map, forensic_map=forensic_map)
    # 4. Counterfactuals
    counterfactuals = counterfactual_engine.run()
    # 5. TTL Findings
    ttl_findings = ttl_engine.run()

    return {
        "status": "completed",
        "verdicts": verdicts,
        "forensic_anomalies_count": len(anomalies),
        "counterfactuals_count": len(counterfactuals),
        "ttl_violations_count": len(ttl_findings)
    }


# =====================================================================
# DETECTION ENGINE ENDPOINTS (Member A)
# =====================================================================

@app.get("/drifts")
def get_drifts(
    severity: Optional[str] = Query(None, description="Filter by CRITICAL/HIGH/MEDIUM/LOW/INFO"),
    control_id: Optional[str] = Query(None),
    suppressed: Optional[bool] = Query(None, description="Filter suppressed vs active findings"),
):
    """Primary hand-off endpoint: fetches detected drift events."""
    results = _safe_load_drifts()

    if severity:
        results = [d for d in results if d.get("severity", "").upper() == severity.upper()]
    if control_id:
        results = [d for d in results if d.get("control_id") == control_id]
    if suppressed is not None:
        results = [d for d in results if d.get("suppressed") == suppressed]

    return {"drift_count": len(results), "drifts": results}


@app.get("/drifts/{drift_id}")
def get_drift_by_id(drift_id: str):
    drifts = _safe_load_drifts()
    for d in drifts:
        if d.get("drift_id") == drift_id:
            return d
    raise HTTPException(status_code=404, detail=f"Drift {drift_id} not found")


@app.get("/controls")
def get_controls():
    return load_baseline()


@app.get("/controls/{control_id}")
def get_control_by_id(control_id: str):
    controls = load_baseline()
    for c in controls:
        if c.get("control_id") == control_id:
            return c
    raise HTTPException(status_code=404, detail=f"Control {control_id} not found")


# =====================================================================
# INTELLIGENCE ENGINE ENDPOINTS (Member B)
# =====================================================================

@app.get("/intelligence/trust")
def get_actor_trust():
    """Returns actor trust scores based on behavioral history."""
    return trust_engine.run()


@app.get("/intelligence/ttl")
def get_ttl_findings():
    """Returns maintenance window expiration and approval violations."""
    return ttl_engine.run()


@app.get("/intelligence/attack-graph")
def get_attack_graph():
    """Returns the full nodes and edges of the attack graph."""
    return graph_builder.run()


@app.get("/intelligence/forensics")
def get_deep_forensics():
    """Returns Isolation Forest and Change-Point anomaly scores for all events."""
    return deep_forensics.run()


@app.get("/intelligence/tribunal")
def get_tribunal_verdicts():
    """Returns AI Tribunal final decisions (ALLOW, ESCALATE, BLOCK) for drifts."""
    trust_map = trust_engine.run()
    anomalies = deep_forensics.run()
    forensic_map = {a.event_id: a for a in anomalies}
    return ai_tribunal.run(trust_map=trust_map, forensic_map=forensic_map)


@app.get("/intelligence/counterfactual")
def get_counterfactual_analysis():
    """Returns blast-radius risk reduction metrics for prioritizing remediation."""
    return counterfactual_engine.run()


@app.get("/intelligence/drift-dna")
def get_drift_dna():
    """Returns drift lineage (Stage 7)."""
    return drift_dna.run()


@app.get("/intelligence/immune-memory")
def get_immune_memory():
    """Returns antibody signatures extracted from recent blocks (Stage 8)."""
    trust_map = trust_engine.run()
    anomalies = deep_forensics.run()
    forensic_map = {a.event_id: a for a in anomalies}
    verdicts = ai_tribunal.run(trust_map=trust_map, forensic_map=forensic_map)
    return immune_memory.run(verdicts)


@app.get("/intelligence/forecasting")
def get_forecasting():
    """Returns predictive drift likelihood by domain (Stage 9)."""
    return forecasting.run()


@app.get("/intelligence/business-impact")
def get_business_impact():
    """Returns estimated fines and business risk mappings (Stage 10)."""
    return business_impact.run()


@app.get("/intelligence/credit-score")
def get_credit_score():
    """Returns executive security credit score (Stage 11)."""
    trust_map = trust_engine.run()
    ttl_findings = ttl_engine.run()
    return credit_score.run(trust_map, ttl_findings)


@app.get("/intelligence/time-machine")
def get_time_machine():
    """Returns compound incidents correlated across time (Stage 12)."""
    return time_machine.run()


@app.get("/intelligence/storytelling")
def get_incident_stories():
    """Returns AI-generated incident narratives (Stage 13)."""
    return storytelling.run()


@app.get("/remediation/auto-heal")
def get_auto_heal_actions():
    """Returns pending Auto-Remediation actions generated from BLOCKED verdicts (Stage 14)."""
    trust_map = trust_engine.run()
    anomalies = deep_forensics.run()
    forensic_map = {a.event_id: a for a in anomalies}
    verdicts = ai_tribunal.run(trust_map=trust_map, forensic_map=forensic_map)
    return auto_healer.run(verdicts)


@app.get("/remediation/webhook-status")
def get_webhook_status():
    """Shows which controls had Slack alerts dispatched in the last run (Stage 15)."""
    trust_map = trust_engine.run()
    anomalies = deep_forensics.run()
    forensic_map = {a.event_id: a for a in anomalies}
    verdicts = ai_tribunal.run(trust_map=trust_map, forensic_map=forensic_map)
    actions = auto_healer.run(verdicts)
    dispatched = webhook_dispatcher.run(verdicts, actions)
    return {"total_dispatched": len(dispatched), "alerts": [{"control": d["control"]} for d in dispatched]}


@app.get("/remediation/webhook-payload/{control_id}")
def get_webhook_payload(control_id: str):
    """Returns the full Slack Block Kit payload for a specific control (for dashboard preview)."""
    trust_map = trust_engine.run()
    anomalies = deep_forensics.run()
    forensic_map = {a.event_id: a for a in anomalies}
    verdicts = ai_tribunal.run(trust_map=trust_map, forensic_map=forensic_map)
    actions = auto_healer.run(verdicts)
    dispatched = webhook_dispatcher.run(verdicts, actions)
    for d in dispatched:
        if d["control"] == control_id:
            return d["payload"]
    raise HTTPException(status_code=404, detail=f"No BLOCK verdict found for control '{control_id}'")