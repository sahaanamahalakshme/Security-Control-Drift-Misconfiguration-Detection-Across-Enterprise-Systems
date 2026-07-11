import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAttackGraph } from '../services/api';
import AttackGraph from '../components/AttackGraph';
import { ArrowLeft } from 'lucide-react';

const AttackGraphDetail = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const graphRes = await getAttackGraph().catch(() => ({ nodes: [], links: [] }));
        
        let nodes = graphRes.nodes || [];
        let links = graphRes.links || graphRes.edges || [];
        
        if (nodes.length === 0) {
          // Fallback mock data
          nodes = [
            { id: 'n1', name: 'Public SSH', group: 1 },
            { id: 'n2', name: 'EC2 Instance', group: 1 },
            { id: 'n3', name: 'IAM Credentials', group: 2 },
            { id: 'n4', name: 'S3 Bucket', group: 2 },
            { id: 'n5', name: 'RDS Database', group: 3 },
            { id: 'n6', name: 'Backup Vault', group: 3 },
            { id: 'n7', name: 'Data Exfiltration', group: 4 },
            { id: 'n8', name: 'Lateral Movement', group: 2 },
            { id: 'n9', name: 'Azure Subscription', group: 3 }
          ];
          links = [
            { source: 'n1', target: 'n2' },
            { source: 'n2', target: 'n8' },
            { source: 'n8', target: 'n3' },
            { source: 'n3', target: 'n4' },
            { source: 'n3', target: 'n5' },
            { source: 'n5', target: 'n7' },
            { source: 'n4', target: 'n7' },
            { source: 'n6', target: 'n9' }
          ];
        }
        setGraphData({ nodes, links });
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
      <div className="flex-1 min-h-0">
        <AttackGraph graphData={graphData} />
      </div>
    </div>
  );
};

export default AttackGraphDetail;
