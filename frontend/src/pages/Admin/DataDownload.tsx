import React, { useState } from 'react';
import { downloadData } from '../../services/adminApi';
import { Download, Users, Building, Network, Loader } from 'lucide-react';

interface DownloadOption {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const options: DownloadOption[] = [
  { id: 'properties', label: 'All Properties', description: 'Export all property listings from all brokers', icon: Building, color: 'text-orange-600' },
  { id: 'clients', label: 'All Clients', description: 'All client records (buyers, sellers, tenants)', icon: Users, color: 'text-blue-600' },
  { id: 'buyers', label: 'Buyers', description: 'Export all buyer client records', icon: Users, color: 'text-green-600' },
  { id: 'sellers', label: 'Sellers', description: 'Export all seller client records', icon: Users, color: 'text-purple-600' },
  { id: 'rent_clients', label: 'Rent Clients', description: 'Export all rental/tenant records', icon: Users, color: 'text-cyan-600' },
  { id: 'brokers', label: 'EnforData Brokers', description: 'All registered broker accounts', icon: Network, color: 'text-indigo-600' },
];

const DataDownload: React.FC = () => {
  const [brokerID, setBrokerID] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleDownload = async (type: string) => {
    setDownloading(type);
    try {
      await downloadData(type, brokerID || undefined, 'csv');
      showToast(`${type} data exported successfully`);
    } catch (e: any) {
      showToast(e.message || 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-gray-800">Data Download Center</h2>
        <p className="text-sm text-gray-500 mt-1">Export platform data as CSV</p>
      </div>

      {/* Broker filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Download Scope</h3>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1">
            <label className="text-sm text-gray-600 block mb-1">Broker ID (optional — leave blank for all brokers)</label>
            <input
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter broker ID for broker-specific download"
              value={brokerID}
              onChange={e => setBrokerID(e.target.value)}
            />
          </div>
          {brokerID && (
            <button
              onClick={() => setBrokerID('')}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-200 rounded-lg"
            >
              Clear (Download All)
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {brokerID ? `Will download data for broker: ${brokerID}` : 'Will download data for all brokers'}
        </p>
      </div>

      {/* Download options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {options.map(opt => {
          const Icon = opt.icon;
          const isDownloading = downloading === opt.id;
          return (
            <div key={opt.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-5 h-5 ${opt.color}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">{opt.label}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(opt.id)}
                disabled={!!downloading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isDownloading ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Exporting...</>
                ) : (
                  <><Download className="w-4 h-4" /> Download CSV</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-sm text-yellow-800">
        <strong>Note:</strong> Property photos are not included in exports. All exports are in CSV format.
      </div>
    </div>
  );
};

export default DataDownload;
