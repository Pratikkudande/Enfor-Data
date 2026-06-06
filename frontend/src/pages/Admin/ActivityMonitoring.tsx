import React, { useEffect, useState } from 'react';
import { getActivity } from '../../services/adminApi';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  USER_STATUS_CHANGE: 'bg-yellow-100 text-yellow-700',
  USER_DELETED: 'bg-red-100 text-red-700',
  ANNOUNCEMENT_SENT: 'bg-blue-100 text-blue-700',
  LOGIN_AS_BROKER: 'bg-purple-100 text-purple-700',
  CONFIG_UPDATED: 'bg-gray-100 text-gray-700',
  DEFAULT: 'bg-green-100 text-green-700',
};

const ActivityMonitoring: React.FC = () => {
  const [activity, setActivity] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getActivity({ page, limit: 50 })
      .then(res => { setActivity(res.data?.activity ?? []); setTotal(res.data?.total ?? 0); })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Activity Monitoring</h2>
        <p className="text-sm text-gray-500">{total} total activity records</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : activity.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <Activity className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>No activity records yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activity.map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50">
                <div className="mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[a.action] ?? ACTION_COLORS.DEFAULT}`}>
                    {a.action?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{a.user_name || 'System'}</p>
                  <p className="text-sm text-gray-600 truncate">{a.details || '—'}</p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">{new Date(a.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityMonitoring;
