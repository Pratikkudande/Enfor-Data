import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '../../services/adminApi';
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';

const ACTION_BADGES: Record<string, string> = {
  USER_STATUS_CHANGE: 'bg-yellow-100 text-yellow-700',
  USER_DELETED: 'bg-red-100 text-red-700',
  ANNOUNCEMENT_SENT: 'bg-blue-100 text-blue-700',
  LOGIN_AS_BROKER: 'bg-purple-100 text-purple-700',
  CONFIG_UPDATED: 'bg-gray-100 text-gray-700',
};

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAuditLogs({ page, limit: 50 })
      .then(res => { setLogs(res.data?.logs ?? []); setTotal(res.data?.total ?? 0); })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Audit Logs</h2>
        <p className="text-sm text-gray-500">{total} total audit records</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Admin</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Action</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Entity</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Description</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">IP</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>No audit logs yet</p>
                  </td>
                </tr>
              ) : logs.map((log: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{log.admin_name || log.admin_id?.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_BADGES[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                      {log.action?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="text-xs">{log.entity_type}</span>
                    <p className="text-xs text-gray-400 font-mono">{log.entity_id?.slice(0, 12)}...</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{log.description}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.ip_address}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
