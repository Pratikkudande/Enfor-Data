import React, { useEffect, useState } from 'react';
import { getStorage } from '../../services/adminApi';
import { HardDrive } from 'lucide-react';

const StorageMonitoring: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStorage().then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  const brokerWise = data?.broker_wise ?? [];
  const maxUsage = Math.max(...brokerWise.map((b: any) => b.usage_mb), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Storage Monitoring</h2>
        <p className="text-sm text-gray-500">Platform storage usage overview</p>
      </div>

      {/* Total */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-5">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
          <HardDrive className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Platform Storage Used</p>
          <p className="text-4xl font-bold text-gray-800">{(data?.total_usage_mb ?? 0).toFixed(1)} <span className="text-lg text-gray-500">MB</span></p>
          <p className="text-sm text-gray-500 mt-1">Estimated from property photos (approx. 0.5 MB per photo)</p>
        </div>
      </div>

      {/* Broker-wise breakdown */}
      {brokerWise.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Broker-wise Storage Usage</h3>
            <p className="text-sm text-gray-500">Property photo storage breakdown</p>
          </div>
          <div className="p-5 space-y-4">
            {brokerWise.map((b: any, i: number) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">{b.broker_name}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-800">{b.usage_mb.toFixed(1)} MB</span>
                    <span className="text-xs text-gray-400 ml-2">({b.photo_count} photos)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${(b.usage_mb / maxUsage) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {brokerWise.length === 0 && (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500 border border-gray-100">
          <HardDrive className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>No storage data available yet</p>
        </div>
      )}
    </div>
  );
};

export default StorageMonitoring;
