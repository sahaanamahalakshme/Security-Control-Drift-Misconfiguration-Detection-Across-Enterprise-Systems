import { Link } from 'react-router-dom';

type Control = {
  id: string;
  name: string;
  health: number;
  status: 'healthy' | 'drifting' | 'critical';
};

type SystemGroup = {
  name: string;
  controls: Control[];
};

const Heatmap = ({ systems }: { systems: SystemGroup[] }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-success';
      case 'drifting': return 'bg-warning';
      case 'critical': return 'bg-critical';
      default: return 'bg-textSecondary';
    }
  };

  return (
    <div className="bg-card rounded-xl border border-borderLight shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-borderLight flex justify-between items-center">
        <h2 className="font-semibold text-lg text-textPrimary">
          <Link to="/heatmap" className="hover:text-primary transition-colors flex items-center gap-1">
            Control Health Heatmap <span className="text-xs text-primary font-normal bg-primary/10 px-2 py-0.5 rounded-full ml-2">View Full</span>
          </Link>
        </h2>
        <div className="flex gap-3 text-xs text-textSecondary">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success"></div> Healthy</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-warning"></div> Drifting</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-critical"></div> Critical</span>
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        {systems.map((system, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="text-sm font-semibold text-textSecondary uppercase tracking-wider">{system.name}</h3>
            <div className="grid grid-cols-1 gap-2">
              {system.controls.map((control) => (
                <Link to={`/controls/${control.id}`} key={control.id} className="flex items-center justify-between p-3 rounded-lg border border-borderLight hover:bg-black/5 cursor-pointer transition-colors block">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(control.status)} shadow-sm`}></div>
                    <span className="font-medium text-sm text-textPrimary">{control.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-borderLight rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full ${getStatusColor(control.status)}`} 
                        style={{ width: `${control.health}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-mono text-textSecondary w-8 text-right">{control.health}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Heatmap;
