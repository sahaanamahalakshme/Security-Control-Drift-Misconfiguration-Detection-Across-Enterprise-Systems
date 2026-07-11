import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getControls } from '../services/api';
import Heatmap from '../components/Heatmap';
import { ArrowLeft } from 'lucide-react';

const HeatmapDetail = () => {
  const [systems, setSystems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const controlsRes = await getControls().catch(() => []);
        const sysMap: any = {};
        let total = 0;
        
        const controlsList = Array.isArray(controlsRes) ? controlsRes : [];
        
        controlsList.forEach((c: any) => {
          total++;
          let status = 'healthy';
          if (c.status === 'CRITICAL' || c.status === 'BLOCKED') status = 'critical';
          else if (c.status === 'DRIFTING' || c.status === 'WARNING') status = 'drifting';

          const sysName = c.system || c.group || 'Other';
          if (!sysMap[sysName]) sysMap[sysName] = { name: sysName, controls: [] };
          sysMap[sysName].controls.push({
            id: c.control_id,
            name: c.name || c.control_id,
            health: c.health_score || 100,
            status: status
          });
        });

        if (total === 0) {
          // Fallback mock data
          sysMap['AWS'] = { name: 'AWS', controls: [
            { id: '1', name: 'CloudTrail', health: 95, status: 'healthy' },
            { id: '2', name: 'IAM Policies', health: 62, status: 'drifting' },
            { id: '3', name: 'S3 Encryption', health: 98, status: 'healthy' },
            { id: '4', name: 'VPC Security Groups', health: 35, status: 'critical' },
          ]};
          sysMap['Azure'] = { name: 'Azure', controls: [
            { id: '5', name: 'Key Vault', health: 92, status: 'healthy' },
            { id: '6', name: 'RBAC', health: 71, status: 'drifting' },
            { id: '7', name: 'NSG', health: 89, status: 'healthy' }
          ]};
          sysMap['Firewall'] = { name: 'Firewall', controls: [
            { id: '8', name: 'Rules', health: 96, status: 'healthy' },
            { id: '9', name: 'Logging', health: 58, status: 'drifting' }
          ]};
          sysMap['IAM'] = { name: 'IAM', controls: [
            { id: '10', name: 'MFA', health: 100, status: 'healthy' },
            { id: '11', name: 'Password Policy', health: 42, status: 'critical' }
          ]};
          sysMap['Endpoint'] = { name: 'Endpoint', controls: [
            { id: '12', name: 'Antivirus', health: 94, status: 'healthy' }
          ]};
        }

        setSystems(Object.values(sysMap));
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
        <Heatmap systems={systems} />
      </div>
    </div>
  );
};

export default HeatmapDetail;
