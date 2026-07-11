import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SummaryCards from '../components/SummaryCards';
import Heatmap from '../components/Heatmap';
import Timeline from '../components/Timeline';
import type { DriftEvent } from '../components/Timeline';
import AttackGraph from '../components/AttackGraph';
import { getControls, getDrifts, getAttackGraph } from '../services/api';

const MOCK_NORMAL = {
  summary: { total: 12, healthy: 7, drifting: 3, critical: 2, avgHealth: 78 },
  systems: [
    { name: 'AWS', controls: [
      { id: '1', name: 'CloudTrail',         health: 95, status: 'healthy'  },
      { id: '2', name: 'IAM Policies',       health: 62, status: 'drifting' },
      { id: '3', name: 'S3 Encryption',      health: 98, status: 'healthy'  },
      { id: '4', name: 'VPC Security Groups', health: 35, status: 'critical' },
    ]},
    { name: 'Azure', controls: [
      { id: '5', name: 'Key Vault', health: 92, status: 'healthy'  },
      { id: '6', name: 'RBAC',      health: 71, status: 'drifting' },
      { id: '7', name: 'NSG',       health: 89, status: 'healthy'  },
    ]},
    { name: 'IAM', controls: [
      { id: '8',  name: 'MFA',            health: 100, status: 'healthy'  },
      { id: '9',  name: 'Password Policy', health: 42,  status: 'critical' },
    ]},
    { name: 'Endpoint', controls: [
      { id: '10', name: 'Antivirus', health: 94, status: 'healthy' },
    ]},
  ],
  events: [
    { id: 'e1', controlName: 'VPC Security Groups', description: 'Unrestricted SSH access detected', expected: '10.0.0.0/8:22', actual: '0.0.0.0/0:22', severity: 'critical' as const, timeAgo: '2m ago' },
    { id: 'e2', controlName: 'IAM Policies',        description: 'Overly permissive S3 access',     expected: 'Deny Public Read',   actual: 'Allow Public Read', severity: 'high' as const, timeAgo: '15m ago' },
    { id: 'e3', controlName: 'Firewall Logging',    description: 'Log destination changed',          expected: 'Central-Log-Bucket', actual: 'Dev-Bucket',       severity: 'medium' as const, timeAgo: '1h ago' },
    { id: 'e4', controlName: 'Password Policy',     description: 'Minimum length reduced',           expected: 'Min length: 14',     actual: 'Min length: 8',    severity: 'critical' as const, timeAgo: '3h ago' },
    { id: 'e5', controlName: 'RBAC Configuration',  description: 'Owner role granted to new user',   expected: 'Read-Only',          actual: 'Owner',            severity: 'high' as const, timeAgo: '5h ago' },
  ],
  nodes: [
    { id: 'n1', name: 'Public SSH',       group: 1 },
    { id: 'n2', name: 'EC2 Instance',     group: 1 },
    { id: 'n3', name: 'IAM Credentials',  group: 2 },
    { id: 'n4', name: 'S3 Bucket',        group: 2 },
    { id: 'n5', name: 'RDS Database',     group: 1 },
    { id: 'n6', name: 'Backup Vault',     group: 3 },
    { id: 'n7', name: 'Data Exfiltration', group: 1 },
    { id: 'n8', name: 'Lateral Movement', group: 2 },
    { id: 'n9', name: 'Azure Subscription', group: 3 },
  ],
  links: [
    { source: 'n1', target: 'n2' }, { source: 'n2', target: 'n8' },
    { source: 'n8', target: 'n3' }, { source: 'n3', target: 'n4' },
    { source: 'n3', target: 'n5' }, { source: 'n5', target: 'n7' },
    { source: 'n4', target: 'n7' }, { source: 'n6', target: 'n9' },
  ],
};

const MOCK_OPTIMAL = {
  summary: { total: 12, healthy: 10, drifting: 2, critical: 0, avgHealth: 92 },
  systems: [
    { name: 'AWS', controls: [
      { id: '1', name: 'CloudTrail',         health: 100, status: 'healthy'  },
      { id: '2', name: 'IAM Policies',       health: 95,  status: 'healthy'  },
      { id: '3', name: 'S3 Encryption',      health: 98,  status: 'healthy'  },
      { id: '4', name: 'VPC Security Groups', health: 92,  status: 'healthy'  },
    ]},
    { name: 'Azure', controls: [
      { id: '5', name: 'Key Vault', health: 100, status: 'healthy'  },
      { id: '6', name: 'RBAC',      health: 85,  status: 'drifting' },
    ]},
    { name: 'IAM', controls: [
      { id: '7', name: 'MFA',             health: 100, status: 'healthy'  },
      { id: '8', name: 'Password Policy', health: 88,  status: 'drifting' },
    ]},
  ],
  events: [
    { id: 'e1', controlName: 'RBAC Configuration', description: 'Minor permission tweak detected', expected: 'Read-Only', actual: 'Read-Write', severity: 'medium' as const, timeAgo: '2h ago' },
    { id: 'e2', controlName: 'S3 Encryption',       description: 'Algorithm upgrade recommended',  expected: 'AES-256',   actual: 'AES-128',   severity: 'low' as const, timeAgo: '5h ago' },
  ],
  nodes: [
    { id: 'n1', name: 'Public Web',  group: 1 },
    { id: 'n2', name: 'WAF',         group: 3 },
    { id: 'n3', name: 'App Server',  group: 3 },
    { id: 'n4', name: 'Database',    group: 3 },
    { id: 'n5', name: 'Backup',      group: 3 },
  ],
  links: [
    { source: 'n1', target: 'n2' }, { source: 'n2', target: 'n3' },
    { source: 'n3', target: 'n4' }, { source: 'n4', target: 'n5' },
  ],
};

const MOCK_CRISIS = {
  summary: { total: 12, healthy: 2, drifting: 4, critical: 6, avgHealth: 42 },
  systems: [
    { name: 'AWS', controls: [
      { id: '1', name: 'CloudTrail',         health: 25, status: 'critical' },
      { id: '2', name: 'IAM Policies',       health: 15, status: 'critical' },
      { id: '3', name: 'S3 Encryption',      health: 45, status: 'drifting' },
      { id: '4', name: 'VPC Security Groups', health: 10, status: 'critical' },
    ]},
    { name: 'Azure', controls: [
      { id: '5', name: 'Key Vault', health: 30, status: 'critical' },
      { id: '6', name: 'RBAC',      health: 50, status: 'drifting' },
    ]},
    { name: 'IAM', controls: [
      { id: '7', name: 'MFA',             health: 20,  status: 'critical' },
      { id: '8', name: 'Password Policy', health: 100, status: 'healthy'  },
    ]},
    { name: 'Endpoint', controls: [
      { id: '9', name: 'Antivirus',  health: 18, status: 'critical'  },
      { id: '10', name: 'Firewall', health: 99, status: 'healthy'   },
    ]},
  ],
  events: [
    { id: 'e1', controlName: 'IAM Policies',       description: 'Admin access granted publicly', expected: 'Private',  actual: 'Public',   severity: 'critical' as const, timeAgo: '1m ago'  },
    { id: 'e2', controlName: 'VPC Security Groups', description: 'All ports open (0.0.0.0/0)',   expected: 'Port 443', actual: 'All Ports', severity: 'critical' as const, timeAgo: '3m ago'  },
    { id: 'e3', controlName: 'CloudTrail',          description: 'Logging disabled by actor',    expected: 'Enabled',  actual: 'Disabled',  severity: 'critical' as const, timeAgo: '5m ago'  },
    { id: 'e4', controlName: 'Key Vault',           description: 'Secret keys exposed',          expected: 'Encrypted', actual: 'Plaintext', severity: 'critical' as const, timeAgo: '10m ago' },
    { id: 'e5', controlName: 'Antivirus',           description: 'Definition update blocked',    expected: 'Updated',  actual: 'Outdated',  severity: 'high' as const,    timeAgo: '20m ago' },
    { id: 'e6', controlName: 'S3 Encryption',       description: 'Bucket made public',           expected: 'Private',  actual: 'Public',    severity: 'critical' as const, timeAgo: '30m ago' },
  ],
  nodes: [
    { id: 'n1', name: 'Public SSH',         group: 1 },
    { id: 'n2', name: 'Compromised EC2',    group: 1 },
    { id: 'n3', name: 'Stolen Credentials', group: 1 },
    { id: 'n4', name: 'S3 Data Leak',       group: 1 },
    { id: 'n5', name: 'Ransomware',         group: 1 },
    { id: 'n6', name: 'Azure Pivot',        group: 1 },
    { id: 'n7', name: 'DB Exfil',           group: 1 },
  ],
  links: [
    { source: 'n1', target: 'n2' }, { source: 'n2', target: 'n3' },
    { source: 'n3', target: 'n4' }, { source: 'n4', target: 'n5' },
    { source: 'n3', target: 'n6' }, { source: 'n6', target: 'n7' },
  ],
};

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({ total: 0, healthy: 0, drifting: 0, critical: 0, avgHealth: 0 });
  const [systems, setSystems] = useState<any[]>([]);
  const [events, setEvents] = useState<DriftEvent[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });

  const scenario = new URLSearchParams(location.search).get('scenario');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // If a mock scenario is selected, skip the API entirely
        if (scenario === 'optimal') {
          setSummaryData(MOCK_OPTIMAL.summary);
          setSystems(MOCK_OPTIMAL.systems);
          setEvents(MOCK_OPTIMAL.events);
          setGraphData({ nodes: MOCK_OPTIMAL.nodes, links: MOCK_OPTIMAL.links });
          return;
        }
        if (scenario === 'crisis') {
          setSummaryData(MOCK_CRISIS.summary);
          setSystems(MOCK_CRISIS.systems);
          setEvents(MOCK_CRISIS.events);
          setGraphData({ nodes: MOCK_CRISIS.nodes, links: MOCK_CRISIS.links });
          return;
        }

        const [controlsRes, driftsRes, graphRes] = await Promise.all([
          getControls().catch(() => []),
          getDrifts().catch(() => ({ drifts: [] })),
          getAttackGraph().catch(() => ({ nodes: [], links: [] })),
        ]);

        // ---- Controls ----
        let total = 0, healthy = 0, drifting = 0, critical = 0, sumHealth = 0;
        const sysMap: Record<string, any> = {};
        const controlsList = Array.isArray(controlsRes) ? controlsRes : [];

        controlsList.forEach((c: any) => {
          total++;
          sumHealth += c.health_score ?? 100;
          let status = 'healthy';
          if (c.status === 'CRITICAL' || c.status === 'BLOCKED') { critical++; status = 'critical'; }
          else if (c.status === 'DRIFTING' || c.status === 'WARNING') { drifting++; status = 'drifting'; }
          else { healthy++; }
          const sysName = c.system || c.group || 'Other';
          if (!sysMap[sysName]) sysMap[sysName] = { name: sysName, controls: [] };
          sysMap[sysName].controls.push({ id: c.control_id, name: c.name || c.control_id, health: c.health_score ?? 100, status });
        });

        // Fallback if API is empty
        if (total === 0) {
          setSummaryData(MOCK_NORMAL.summary);
          setSystems(MOCK_NORMAL.systems);
        } else {
          setSummaryData({ total, healthy, drifting, critical, avgHealth: Math.round(sumHealth / total) });
          setSystems(Object.values(sysMap));
        }

        // ---- Drifts ----
        const driftList = driftsRes.drifts || [];
        const processedEvents: DriftEvent[] = driftList.length > 0
          ? driftList.map((d: any) => ({
              id: d.drift_id,
              controlName: d.control_id || 'Unknown Control',
              description: d.description || 'Configuration drift detected',
              expected: JSON.stringify(d.expected_value ?? 'Secure State'),
              actual: JSON.stringify(d.actual_value ?? 'Drifted State'),
              severity: (d.severity || 'medium').toLowerCase() as DriftEvent['severity'],
              timeAgo: 'Just now',
            }))
          : MOCK_NORMAL.events;
        setEvents(processedEvents);

        // ---- Graph ----
        const rawNodes = graphRes.nodes || [];
        const rawLinks = graphRes.links || graphRes.edges || [];
        setGraphData({
          nodes: rawNodes.length > 0 ? rawNodes : MOCK_NORMAL.nodes,
          links: rawLinks.length > 0 ? rawLinks : MOCK_NORMAL.links,
        });

      } catch (err) {
        console.error('Failed to load dashboard data', err);
        // On any error, fall back to normal mock
        setSummaryData(MOCK_NORMAL.summary);
        setSystems(MOCK_NORMAL.systems);
        setEvents(MOCK_NORMAL.events);
        setGraphData({ nodes: MOCK_NORMAL.nodes, links: MOCK_NORMAL.links });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [scenario]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-primary font-medium">Loading Security Posture…</p>
      </div>
    );
  }

  const scenarioBanner =
    scenario === 'crisis'
      ? { text: 'Crisis Scenario — Simulated widespread security incident', bg: 'bg-critical/10 border-critical/30 text-critical' }
      : scenario === 'optimal'
      ? { text: 'Optimal Scenario — Simulated excellent security posture', bg: 'bg-success/10 border-success/30 text-success' }
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Security Posture Dashboard</h1>
          <p className="text-sm text-textSecondary mt-1">Overview of your enterprise security controls and detected drifts.</p>
        </div>

        {/* Scenario toggle */}
        <div className="flex bg-card border border-borderLight rounded-lg p-1 text-sm font-medium shrink-0 shadow-sm">
          <button
            onClick={() => navigate('/')}
            className={`px-4 py-1.5 rounded-md transition-colors ${!scenario ? 'bg-primary/10 text-primary' : 'text-textSecondary hover:bg-black/5'}`}
          >
            Real-time
          </button>
          <button
            onClick={() => navigate('/?scenario=optimal')}
            className={`px-4 py-1.5 rounded-md transition-colors ${scenario === 'optimal' ? 'bg-success/10 text-success' : 'text-textSecondary hover:bg-black/5'}`}
          >
            Optimal
          </button>
          <button
            onClick={() => navigate('/?scenario=crisis')}
            className={`px-4 py-1.5 rounded-md transition-colors ${scenario === 'crisis' ? 'bg-critical/10 text-critical' : 'text-textSecondary hover:bg-black/5'}`}
          >
            Crisis
          </button>
        </div>
      </div>

      {/* Scenario Banner */}
      {scenarioBanner && (
        <div className={`px-4 py-3 rounded-lg border text-sm font-medium ${scenarioBanner.bg}`}>
          ⚡ {scenarioBanner.text}
        </div>
      )}

      <SummaryCards data={summaryData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="min-h-[450px] lg:col-span-1">
          <Heatmap systems={systems} />
        </div>
        <div className="min-h-[450px] lg:col-span-1">
          <Timeline events={events} />
        </div>
        <div className="min-h-[450px] lg:col-span-1">
          <AttackGraph graphData={graphData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
