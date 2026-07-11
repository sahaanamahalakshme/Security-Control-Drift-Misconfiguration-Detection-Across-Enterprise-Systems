import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDriftById } from '../services/api';
import { ArrowLeft, AlertOctagon, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

const DriftDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [drift, setDrift] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const d = await getDriftById(id!).catch(() => null);
        let mockDrift = d;
        if (!d) {
          mockDrift = {
            drift_id: id,
            control_id: '4',
            control_name: 'VPC Security Groups',
            description: 'Unrestricted SSH access detected from 0.0.0.0/0 on port 22',
            severity: 'CRITICAL',
            expected_value: 'SSH restricted to corporate IPs 10.0.0.0/8',
            actual_value: '0.0.0.0/0:22',
            timestamp: new Date().toISOString(),
            resources: ['sg-0123456789abcdef0'],
            remediation: [
              'Navigate to AWS VPC console',
              'Select Security Groups and find sg-0123456789abcdef0',
              'Edit inbound rules',
              'Remove the rule allowing port 22 from 0.0.0.0/0',
              'Add rule allowing port 22 from 10.0.0.0/8'
            ]
          };
        }
        setDrift(mockDrift);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-full">Loading...</div>;
  if (!drift) return <div>Drift not found</div>;

  const severityColor = drift.severity === 'CRITICAL' ? 'bg-critical text-white' : drift.severity === 'HIGH' ? 'bg-warning text-white' : 'bg-primary text-white';

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      <Link to="/" className="flex items-center gap-2 text-textSecondary hover:text-primary mb-6 w-fit">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="bg-card border border-borderLight rounded-xl shadow-sm p-8 flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4 border-b border-borderLight pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="text-critical" size={28} />
              <h1 className="text-2xl md:text-3xl font-bold text-textPrimary">{drift.control_name || 'Control'} - Drift Event</h1>
            </div>
            <p className="text-textSecondary text-lg">{drift.description}</p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm ${severityColor}`}>
            <AlertOctagon size={20} />
            {drift.severity} SEVERITY
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-success/5 border border-success/20 rounded-lg p-6">
            <h3 className="flex items-center gap-2 text-success font-semibold mb-4">
              <CheckCircle2 size={20} /> Expected Configuration
            </h3>
            <div className="bg-white p-4 rounded border border-success/20 font-mono text-sm text-textPrimary overflow-x-auto">
              {drift.expected_value}
            </div>
          </div>
          <div className="bg-critical/5 border border-critical/20 rounded-lg p-6">
            <h3 className="flex items-center gap-2 text-critical font-semibold mb-4">
              <XCircle size={20} /> Actual Configuration
            </h3>
            <div className="bg-white p-4 rounded border border-critical/20 font-mono text-sm text-critical overflow-x-auto">
              {drift.actual_value}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Metadata</h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-borderLight pb-2">
                <span className="text-textSecondary">Detected by</span>
                <span className="font-medium">SentinelDNA Detection Engine</span>
              </div>
              <div className="flex justify-between border-b border-borderLight pb-2">
                <span className="text-textSecondary">Timestamp</span>
                <span className="font-medium">{new Date(drift.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex flex-col pt-2">
                <span className="text-textSecondary mb-2">Affected Resources</span>
                <div className="flex flex-wrap gap-2">
                  {(drift.resources || ['Resource Unknown']).map((r: string, i: number) => (
                    <span key={i} className="bg-black/5 px-2 py-1 rounded text-sm font-mono">{r}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Remediation Steps</h3>
            <ol className="list-decimal list-inside space-y-3 text-textPrimary">
              {(drift.remediation || ['Investigate resource manually', 'Restore to baseline configuration']).map((step: string, i: number) => (
                <li key={i} className="pl-2 bg-background p-3 rounded border border-borderLight">{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriftDetail;
