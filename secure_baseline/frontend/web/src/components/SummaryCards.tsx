

type SummaryData = {
  total: number;
  healthy: number;
  drifting: number;
  critical: number;
  avgHealth: number;
};

const SummaryCards = ({ data }: { data: SummaryData }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-card p-5 rounded-xl border border-borderLight shadow-sm flex flex-col justify-center">
        <div className="text-textSecondary text-sm font-medium uppercase tracking-wider mb-1">Total Controls</div>
        <div className="text-3xl font-bold text-textPrimary font-mono">{data.total}</div>
      </div>
      
      <div className="bg-card p-5 rounded-xl border border-borderLight shadow-sm flex flex-col justify-center border-b-4 border-b-success">
        <div className="text-textSecondary text-sm font-medium uppercase tracking-wider mb-1">Healthy</div>
        <div className="text-3xl font-bold text-success font-mono">{data.healthy}</div>
      </div>
      
      <div className="bg-card p-5 rounded-xl border border-borderLight shadow-sm flex flex-col justify-center border-b-4 border-b-warning">
        <div className="text-textSecondary text-sm font-medium uppercase tracking-wider mb-1">Drifting</div>
        <div className="text-3xl font-bold text-warning font-mono">{data.drifting}</div>
      </div>
      
      <div className="bg-card p-5 rounded-xl border border-borderLight shadow-sm flex flex-col justify-center border-b-4 border-b-critical">
        <div className="text-textSecondary text-sm font-medium uppercase tracking-wider mb-1">Critical</div>
        <div className="text-3xl font-bold text-critical font-mono">{data.critical}</div>
      </div>
      
      <div className="bg-card p-5 rounded-xl border border-borderLight shadow-sm flex flex-col justify-center">
        <div className="text-textSecondary text-sm font-medium uppercase tracking-wider mb-1">Avg Health</div>
        <div className="text-3xl font-bold text-primary font-mono">{data.avgHealth}%</div>
      </div>
    </div>
  );
};

export default SummaryCards;
