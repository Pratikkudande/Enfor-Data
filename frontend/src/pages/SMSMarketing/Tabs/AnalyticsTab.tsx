import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Eye, RefreshCw, XCircle } from 'lucide-react';
import { getSMSMessageLogs, refreshSMSDeliveryStatus, SMSMessageLog } from '../../../services/smsMarketingApi';
import { formatDistanceToNow } from '../../../utils/dateUtils';

type LogBatch = { id: string; message: string; category: string; sentAt: string; logs: SMSMessageLog[] };

const formatLogTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown time' : formatDistanceToNow(date, { addSuffix: true });
};

const AnalyticsTab: React.FC = () => {
  const [logs, setLogs] = useState<SMSMessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getSMSMessageLogs();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load SMS logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const batches = useMemo<LogBatch[]>(() => {
    const grouped = new Map<string, LogBatch>();
    logs.forEach((log) => {
      const id = log.batch_id || log.id;
      const batch = grouped.get(id) || {
        id,
        message: log.message_text,
        category: log.category || log.message_type || 'SMS',
        sentAt: log.sent_at,
        logs: [],
      };
      batch.logs.push(log);
      grouped.set(id, batch);
    });
    return [...grouped.values()];
  }, [logs]);

  const refreshBatch = async (batch: LogBatch) => {
    setRefreshing(true);
    try {
      // Each Fast2SMS request_id is refreshed independently, because DLR is per request.
      const refreshed = await Promise.all(batch.logs
        .filter((log) => log.provider_message_id)
        .map(async (log) => {
          try { return (await refreshSMSDeliveryStatus(log.id)).log; }
          catch { return log; }
        }));
      const updated = new Map(refreshed.map((log) => [log.id, log]));
      setLogs((current) => current.map((log) => updated.get(log.id) || log));
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-xl font-semibold text-gray-900">Message Logs</h2><p className="text-sm text-gray-500 mt-1">Delivery status is refreshed from Fast2SMS when you open a send log.</p></div>
          <button onClick={loadLogs} className="text-sm text-blue-600 hover:text-blue-700">Refresh logs</button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200"><tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">SMS Content</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">SMS Category</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">Successfully received</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">Failed</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">View</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200">
                {batches.map((batch) => {
                  const success = batch.logs.filter((log) => log.status === 'sent' || log.status === 'delivered').length;
                  const failed = batch.logs.length - success;
                  const open = selectedBatch === batch.id;
                  return <React.Fragment key={batch.id}>
                    <tr className="hover:bg-gray-50">
					  <td className="px-5 py-4 text-sm text-gray-800 max-w-md"><div className="truncate" title={batch.message}>{batch.message}</div><div className="text-xs text-gray-400 mt-1">{formatLogTime(batch.sentAt)}</div></td>
                      <td className="px-5 py-4"><span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs">{batch.category.replaceAll('_', ' ')}</span></td>
                      <td className="px-5 py-4 text-center text-sm font-medium text-green-600">{success}</td>
                      <td className="px-5 py-4 text-center text-sm font-medium text-red-600">{failed}</td>
                      <td className="px-5 py-4 text-right"><button onClick={() => { setSelectedBatch(open ? null : batch.id); if (!open) refreshBatch(batch); }} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4" /> {open ? 'Hide' : 'View'} {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button></td>
                    </tr>
                    {open && <tr><td colSpan={5} className="bg-gray-50 px-5 py-4"><div className="flex justify-between items-center mb-3"><h3 className="font-medium text-gray-800">Recipient delivery details</h3><button disabled={refreshing} onClick={() => refreshBatch(batch)} className="inline-flex gap-1 items-center text-xs text-blue-600 disabled:opacity-50"><RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh Fast2SMS status</button></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase text-gray-500"><th className="pb-2">Phone number</th><th className="pb-2">Status</th><th className="pb-2">Status description</th><th className="pb-2">Request ID</th></tr></thead><tbody>{batch.logs.map((log) => <tr key={log.id} className="border-t border-gray-200"><td className="py-2">{log.recipient_phone}</td><td className="py-2">{log.status === 'sent' || log.status === 'delivered' ? <span className="inline-flex gap-1 text-green-600"><CheckCircle className="w-4 h-4" />{log.status}</span> : <span className="inline-flex gap-1 text-red-600"><XCircle className="w-4 h-4" />{log.status}</span>}</td><td className="py-2 text-gray-600">{log.status_description || log.error_message || 'Awaiting delivery report'}</td><td className="py-2 font-mono text-xs text-gray-500">{log.provider_message_id || '—'}</td></tr>)}</tbody></table></div></td></tr>}
                  </React.Fragment>;
                })}
              </tbody>
            </table>
          </div>
          {batches.length === 0 && <div className="text-center py-12 text-gray-500">No message logs yet. Send your first SMS to see analytics.</div>}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
