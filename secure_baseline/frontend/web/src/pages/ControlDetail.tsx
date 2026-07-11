import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getControlById, getDrifts } from '../services/api';
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import Heatmap from '../components/Heatmap';

const ControlDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [control, setControl] = useState<any>(null);
  const [drifts, setDrifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [heatmapSystems, setHeatmapSystems] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const c = await getControlById(id!).catch(() => null);
        let mockControl = c;
        if (!c) {
          // Fallback mock
          mockControl = {
            control_id: id,
            name: id === '1' ? 'CloudTrail' : id === '2' ? 'IAM Policies' : 'Unknown Control',
            system: id === '1' ? 'AWS' : id === '2' ? 'AWS' : 'Unknown',
            status: id === '2' ? 'DRIFTING' : 'HEALTHY',
            health_score: id === '2' ? 62 : 100,
            description: 'Ensures proper IAM policy configuration and minimizes overly permissive access.'
          };
        }
        setControl(mockControl);

        const dRes = await getDrifts(undefined, id).catch(() => ({ drifts: [] }));
        let relatedDrifts = dRes.drifts || [];
        if (relatedDrifts.length === 0 && id === '2') {
          relatedDrifts = [
            { drift_id: 'd1', description: 'Overly permissive S3 access', severity: 'HIGH', timestamp: new Date(Date.now() - 3600000).toISOString() },
            { drift_id: 'd2', description: 'Service principal granted Owner role', severity: 'CRITICAL', timestamp: new Date(Date.now() - 7200000).toISOString() },
            { drift_id: 'd3', description: 'IAM policy modification detected', severity: 'MEDIUM', timestamp: new Date(Date.now() - 86400000).toISOString() }
          ];
        }
        setDrifts(relatedDrifts);

        // Mock heatmap context for the left panel
        setHeatmapSystems([
          {
            name: mockControl.system || 'AWS',
            controls: [
              { id: mockControl.control_id, name: mockControl.name, health: mockControl.health_score || 100, status: (mockControl.status || 'HEALTHY').toLowerCase() === 'blocked' ? 'critical' : (mockControl.status || 'HEALTHY').toLowerCase() }
            ]
          }
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-full">Loading...</div>;
  if (!control) return <div>Control not found</div>;

  const statusColor = control.status === 'CRITICAL' || control.status === 'BLOCKED' ? 'text-critical' : control.status === 'DRIFTING' || control.status === 'WARNING' ? 'text-warning' : 'text-success';
  const bgStatusColor = control.status === 'CRITICAL' || control.status === 'BLOCKED' ? 'bg-critical/10' : control.status === 'DRIFTING' || control.status === 'WARNING' ? 'bg-warning/10' : 'bg-success/10';

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      <div className="w-full md:w-1/3 h-full flex flex-col">
        <Link to="/" className="flex items-center gap-2 text-textSecondary hover:text-primary mb-4 w-fit">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <Heatmap systems={heatmapSystems} />
      </div>

      <div className="w-full md:w-2/3 bg-card border border-borderLight rounded-xl shadow-sm p-6 overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-textPrimary mb-1">{control.name}</h1>
            <p className="text-textSecondary text-sm">System: {control.system || 'N/A'}</p>
          </div>
          <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-medium ${bgStatusColor} ${statusColor}`}>
            {control.status === 'CRITICAL' ? <XCircle size={18} /> : control.status === 'DRIFTING' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            {control.status}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 border border-borderLight rounded-lg bg-background">
            <p className="text-textSecondary text-sm mb-1 uppercase tracking-wider font-medium">Health Score</p>
            <p className={`text-3xl font-mono font-bold ${statusColor}`}>{control.health_score || 100}%</p>
          </div>
          <div className="p-4 border border-borderLight rounded-lg bg-background">
            <p className="text-textSecondary text-sm mb-1 uppercase tracking-wider font-medium">Drift Count</p>
            <p className="text-3xl font-mono font-bold text-textPrimary">{drifts.length}</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-textPrimary mb-4">Related Drifts</h2>
          {drifts.length === 0 ? (
            <p className="text-textSecondary">No drifts currently associated with this control.</p>
          ) : (
            <div className="space-y-4">
              {drifts.map((drift, idx) => (
                <Link to={`/drifts/${drift.drift_id}`} key={idx} className="block p-4 border border-borderLight rounded-lg hover:bg-black/5 transition-colors">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-textPrimary">{drift.description}</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${drift.severity === 'CRITICAL' ? 'bg-critical/10 text-critical' : drift.severity === 'HIGH' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}`}>
                      {drift.severity || 'MEDIUM'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-textSecondary">
                    <Clock size={14} />
                    <span>{new Date(drift.timestamp).toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlDetail;
