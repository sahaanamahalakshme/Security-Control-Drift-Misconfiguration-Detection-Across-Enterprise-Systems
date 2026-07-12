---
name: SentinelDNA data normalizers
description: Field mapping rules between FastAPI backend schemas and frontend normalizeDrift/normalizeControl/stringifyKV.
---

## normalizeDrift — backend field names differ from frontend expectations
Backend `DriftEvent` uses these non-obvious field names:
- `narrative` → maps to both `title` (first sentence) and `description`
- `baseline_value` → maps to `expected`
- `current_value` → maps to `actual` (can be bool/number, not just string/object)
- `resource_id` → maps to `affected_resources` (wraps in array)
- `domain` → maps to `category`
- `changed_by` → maps to `detected_by`

**stringifyKV must handle booleans and numbers** — backend sends `current_value: true` or `current_value: 1.5`. Without the boolean/number guard, ACTUAL box shows blank.

## normalizeControl — baseline.json uses `universal_category`
Backend controls have `universal_category` (e.g., "AUDIT_LOGGING"), not `domain` or `category`. The fallback chain must be: `c.category ?? c.domain ?? c.universal_category ?? '—'`.

## IncidentsPage tribunal rationale
Backend `TribunalVerdict` uses field `rationale`, not `reason`. Display: `v.rationale ?? v.reason ?? fallback`.

## RiskAnalyticsPage trust data shape
`/intelligence/trust` returns `{actor: {actor, trust_score, trust_band, reasons}}` dict. The value is NOT a number — must extract `data.trust_score` and map `trust_band` string to risk_band.

## RiskAnalyticsPage duplicate keys
Counterfactual analysis can return multiple entries with the same `control_id` (one per drift per control). Use `${control_id}-${i}` as React key.
