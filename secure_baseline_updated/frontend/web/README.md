# SentinelDNA — Frontend

React + Vite dashboard for the SentinelDNA security drift intelligence platform.
Displays the Control Health Heatmap, Drift Timeline, Attack Graph, Reports (₹ INR fines), Incidents, and Remediation views.

## Quick Start

```bash
cd frontend/web
npm install
# .env already has VITE_API_BASE_URL=http://localhost:8000
npm run dev       # → http://localhost:5173
```

## Backend Integration

The dashboard talks to the FastAPI service at `backend/api/main.py` via `src/api/client.js`.

To run the backend so the frontend has live data:

```bash
cd backend
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000

# First time: seed the drift data
curl -X POST http://localhost:8000/pipeline/run
```

**Offline / Demo mode**: If the backend is unreachable, the app automatically falls back to realistic demo data in `src/data/mockData.js` and shows a "Demo data" badge — no blank screens or crashes.

## Structure

```
src/
  api/client.js              Fetch wrapper for every backend endpoint
  context/AppContext.jsx     Data fetch + normalize + demo-data fallback
  data/mockData.js           Demo datasets (all monetary values in ₹ INR)
  hooks/useEndpoint.js       SWR-style polling hook
  components/
    Sidebar.jsx              Navigation sidebar
    Header.jsx               Page header with live/demo badge
    MobileNav.jsx            Bottom tab bar (mobile)
    SummaryCards.jsx         5 metric cards
    ControlHeatmap.jsx       Grouped-by-system heatmap + detail panel
    DriftTimeline.jsx        Vertical drift event feed
    AttackGraph.jsx          SVG force-layout attack path map
    Badges.jsx               Severity/status badges, health bar
  pages/
    Dashboard.jsx            Overview: summary + heatmap + timeline + graph
    ControlsPage.jsx         Full Control Health Heatmap
    TimelinePage.jsx         Full Drift Timeline
    AttackGraphPage.jsx      Full-size Attack Graph
    DriftDetailPage.jsx      Expected vs actual, remediation steps
    IncidentsPage.jsx        Compound incident stories (AI narratives)
    RemediationPage.jsx      Auto-heal actions + webhook status
    ReportsPage.jsx          Business impact (₹ INR) + security credit score
    RiskAnalyticsPage.jsx    Forecasting + drift DNA + immune memory
    SettingsPage.jsx         API key status + configuration
```

## Currency

All compliance fine estimates show **₹ INR** (1 USD = ₹85). Numbers use `en-IN` locale formatting (e.g. ₹42,50,000 = ₹42.5 Lakh).

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | FastAPI backend URL |

## Responsive Design

Sidebar collapses to a bottom tab bar (`MobileNav.jsx`) under the `md` breakpoint. All grids stack to a single column on mobile.
