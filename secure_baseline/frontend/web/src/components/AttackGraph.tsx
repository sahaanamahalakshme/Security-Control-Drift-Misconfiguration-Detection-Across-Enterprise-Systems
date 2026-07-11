import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';

type Node = {
  id: string;
  name: string;
  group: number; // 1: exploit, 2: compromised asset, 3: control, 4: protected asset, etc.
  val?: number;
};

type Link = {
  source: string;
  target: string;
  label?: string;
};

const AttackGraph = ({ graphData }: { graphData: { nodes: Node[], links: Link[] } }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height: height - 60 }); // subtract header height
    }
  }, []);

  const getNodeColor = (group: number) => {
    switch (group) {
      case 1: return '#E74C3C'; // Exploit / Compromised
      case 2: return '#F39C12'; // Control / Asset at risk
      case 3: return '#2ECC71'; // Protected
      default: return '#7F8C8D';
    }
  };

  return (
    <div className="bg-card rounded-xl border border-borderLight shadow-sm flex flex-col h-full" ref={containerRef}>
      <div className="p-4 border-b border-borderLight flex justify-between items-center shrink-0">
        <h2 className="font-semibold text-lg text-textPrimary">
          <Link to="/attack-graph" className="hover:text-primary transition-colors flex items-center gap-1">
            Blast Radius Attack Graph <span className="text-xs text-primary font-normal bg-primary/10 px-2 py-0.5 rounded-full ml-2">View Full</span>
          </Link>
        </h2>
        <div className="text-xs text-textSecondary font-mono">Radius: 7 Hops</div>
      </div>
      
      <div className="flex-1 w-full bg-background/50 rounded-b-xl overflow-hidden relative">
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="name"
          nodeColor={(node: any) => getNodeColor(node.group)}
          nodeRelSize={6}
          linkColor={() => '#ECF0F1'}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          d3VelocityDecay={0.3}
        />
        
        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur border border-borderLight p-3 rounded-lg shadow-sm text-xs space-y-2">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-critical"></div> Exploit/Compromised</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-warning"></div> At Risk / Control</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success"></div> Protected</div>
        </div>
      </div>
    </div>
  );
};

export default AttackGraph;
