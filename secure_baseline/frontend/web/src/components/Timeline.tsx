import { Link } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type DriftEvent = {
  id: string;
  controlName: string;
  description: string;
  expected: string;
  actual: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timeAgo: string;
};

const Timeline = ({ events }: { events: DriftEvent[] }) => {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical': return { color: 'text-critical', bg: 'bg-critical/10', border: 'border-critical', icon: AlertCircle };
      case 'high': return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning', icon: AlertTriangle };
      case 'medium': return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning', icon: Info };
      default: return { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary', icon: Info };
    }
  };

  return (
    <div className="bg-card rounded-xl border border-borderLight shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-borderLight flex justify-between items-center">
        <h2 className="font-semibold text-lg text-textPrimary">
          <Link to="/timeline" className="hover:text-primary transition-colors flex items-center gap-1">
            Drift Timeline <span className="text-xs text-primary font-normal bg-primary/10 px-2 py-0.5 rounded-full ml-2">View Full</span>
          </Link>
        </h2>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="relative border-l-2 border-borderLight ml-4 space-y-6 pb-4">
          {events.map((event) => {
            const config = getSeverityConfig(event.severity);
            const Icon = config.icon;
            
            return (
              <div key={event.id} className="relative pl-6">
                <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full ${config.bg} ${config.color} flex items-center justify-center border-4 border-card`}>
                  <Icon size={14} />
                </div>
                
                <Link to={`/drifts/${event.id}`} className="bg-background rounded-lg border border-borderLight p-4 hover:shadow-md transition-shadow cursor-pointer block">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                        {event.severity}
                      </span>
                      <h4 className="font-semibold text-sm text-textPrimary">{event.controlName}</h4>
                    </div>
                    <span className="text-xs text-textSecondary">{event.timeAgo}</span>
                  </div>
                  
                  <p className="text-sm text-textPrimary mb-3">{event.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-card rounded border border-borderLight p-2">
                    <div>
                      <div className="text-[10px] text-textSecondary uppercase mb-1">Expected</div>
                      <div className="text-success break-words">{event.expected}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-textSecondary uppercase mb-1">Actual</div>
                      <div className="text-critical break-words">{event.actual}</div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
