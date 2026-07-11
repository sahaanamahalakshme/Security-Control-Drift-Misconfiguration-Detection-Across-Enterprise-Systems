from __future__ import annotations
import json
import sys
from pathlib import Path
 
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
 
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
 
from detection_engine.pipeline import run_pipeline
 
DATASETS_DIR = Path(__file__).resolve().parent.parent.parent / "datasets"
SAMPLE_DRIFTS_PATH = DATASETS_DIR / "sample_drifts.json"
 
app = FastAPI(
    title="SentinelDNA Detection Engine API",
    description="Member A's Detection Engine: baseline, drift, and compliance endpoints.",
    version="1.0.0",
)
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)
 
 
def _load_drifts() -> dict:
    if not SAMPLE_DRIFTS_PATH.exists():
        raise HTTPException(status_code=503, detail="sample_drifts.json not generated yet. POST /pipeline/run first.")
    with open(SAMPLE_DRIFTS_PATH) as f:
        return json.load(f)
 
 
@app.get("/health")
def health():
    return {"status": "ok", "service": "detection-engine"}
 
 
@app.get("/drifts")
def get_drifts(
    severity: Optional[str] = Query(None, description="Filter by CRITICAL/HIGH/MEDIUM/LOW/INFO"),
    control_id: Optional[str] = Query(None),
    suppressed: Optional[bool] = Query(None, description="Filter suppressed vs active findings"),
):
    """
    Primary hand-off endpoint for Member B's Intelligence Engine
    (trust engine, attack graph, tribunal, remediation simulator all read from here).
    """
    data = _load_drifts()
    results = data["drifts"]
 
    if severity:
        results = [d for d in results if d["severity"].upper() == severity.upper()]
    if control_id:
        results = [d for d in results if d["control_id"] == control_id]
    if suppressed is not None:
        results = [d for d in results if d["suppressed"] == suppressed]
 
    return {"drift_count": len(results), "drifts": results}
 
 
@app.get("/drifts/{drift_id}")
def get_drift_by_id(drift_id: str):
    data = _load_drifts()
    for d in data["drifts"]:
        if d["drift_id"] == drift_id:
            return d
    raise HTTPException(status_code=404, detail=f"Drift {drift_id} not found")
 
 
@app.get("/controls")
def get_controls():
    with open(DATASETS_DIR / "baseline.json") as f:
        return json.load(f)
 
 
@app.get("/controls/{control_id}")
def get_control_by_id(control_id: str):
    with open(DATASETS_DIR / "baseline.json") as f:
        controls = json.load(f)["controls"]
    for c in controls:
        if c["control_id"] == control_id:
            return c
    raise HTTPException(status_code=404, detail=f"Control {control_id} not found")
 
 
@app.post("/pipeline/run")
def trigger_pipeline_run():
    """Re-runs the full Detection Engine pipeline and regenerates sample_drifts.json."""
    summary = run_pipeline(datasets_dir=str(DATASETS_DIR), output_path=str(SAMPLE_DRIFTS_PATH))
    return {"status": "completed", "summary": summary}