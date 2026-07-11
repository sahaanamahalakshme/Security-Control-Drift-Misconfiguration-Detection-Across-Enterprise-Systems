import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDrifts } from '../services/api';
import type { DriftEvent } from '../components/Timeline';
import { ArrowLeft } from 'lucide-react';

const TimelineDetail = () => {
  const [events, setEvents] = useState<DriftEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const driftsRes = await getDrifts().catch(() => ({ drifts: [] }));
        const driftList = driftsRes.drifts || [];
        let processedEvents = driftList.map((d: any) => ({
          id: d.drift_id,
          controlName: d.control_id || 'Unknown Control',
          description: d.description || 'Configuration drift detected',
          expected: JSON.stringify(d.expected_value || 'Secure State'),
          actual: JSON.stringify(d.actual_value || 'Drifted State'),
          severity: (d.severity || 'medium').toLowerCase(),
          timeAgo: d.timestamp ? new Date(d.timestamp).toLocaleString() : 'Recent'
        }));

        if (processedEvents.length === 0) {
          // Fallback mock data
          processedEvents = [
            { id: 'e1', controlName: 'IAM Policies', description: 'Overly permissive S3 access', expected: 'Deny Public Read', actual: 'Allow Public Read', severity: 'high', timeAgo: '2m ago' },
            { id: 'e2', controlName: 'VPC Security Groups', description: 'Unrestricted SSH detected', expected: '10.0.0.0/8:22', actual: '0.0.0.0/0:22', severity: 'critical', timeAgo: '15m ago' },
            { id: 'e3', controlName: 'Firewall Logging', description: 'Log destination changed', expected: 'Central-Log-Bucket', actual: 'Dev-Bucket', severity: 'medium', timeAgo: '1h ago' },
            { id: 'e4', controlName: 'Password Policy', description: 'Length reduced', expected: 'Min length: 14', actual: 'Min length: 8', severity: 'critical', timeAgo: '3h ago' },
            { id: 'e5', controlName: 'RBAC Configuration', description: 'Owner role granted', expected: 'Read-Only', actual: 'Owner', severity: 'high', timeAgo: '5h ago' },
            { id: 'e6', controlName: 'VPC Security Groups', description: 'Database access open', expected: 'Internal Only', actual: 'Public 0.0.0.0/0', severity: 'high', timeAgo: '1d ago' },
          ];
        }

        setEvents(processedEvents);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-full">Loading...</div>;

  return (
    <div className="flex flex-col h-full">
      <Link to="/" className="flex items-center gap-2 text-textSecondary hover:text-primary mb-4 w-fit">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      <div className="flex-1 min-h-0 bg-card rounded-xl border border-borderLight shadow-sm p-4 overflow-hidden flex flex-col">
        <h2 className="font-semibold text-xl text-textPrimary mb-4">Drift Timeline</h2>
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="relative border-l-2 border-borderLight ml-4 space-y-6 pb-4">
            {events.map((event) => {
              const severityColor = 
                event.severity === 'critical' ? 'bg-critical' : 
                event.severity === 'high' ? 'bg-warning' : 'bg-primary';
              const badgeColor = 
                event.severity === 'critical' ? 'bg-critical/10 text-critical' : 
                event.severity === 'high' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary';

              return (
                <div key={event.id} className="relative pl-6">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full ${severityColor} border-4 border-card`}></div>
                  
                  {/* Event card */}
                  <Link to={`/drifts/${event.id}`} className="block bg-background border border-borderLight rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${badgeColor}`}>
                          {event.severity}
                        </span>
                        <span className="font-medium text-sm text-textPrimary">{event.controlName}</span>
                      </div>
                      <span className="text-xs text-textSecondary">{event.timeAgo}</span>
                    </div>
                    
                    <p className="text-sm text-textPrimary mb-3">{event.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-card p-2 rounded border border-borderLight/50">
                      <div>
                        <span className="text-textSecondary block mb-0.5">Expected:</span>
                        <span className="text-success truncate block">{event.expected}</span>
                      </div>
                      <div>
                        <span className="text-textSecondary block mb-0.5">Actual:</span>
                        <span className="text-critical truncate block">{event.actual}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineDetail;
