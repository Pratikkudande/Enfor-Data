import React, { useEffect, useState } from 'react';
import { getFeedback, updateFeedback } from '../../services/adminApi';
import { MessageCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  planned: 'bg-purple-100 text-purple-700',
  implemented: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const TYPE_COLORS: Record<string, string> = {
  feedback: 'bg-gray-100 text-gray-700',
  suggestion: 'bg-blue-50 text-blue-700',
  bug_report: 'bg-red-50 text-red-700',
  feature_request: 'bg-purple-50 text-purple-700',
};

const FeedbackManagement: React.FC = () => {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [toast, setToast] = useState('');

  const fetchFeedback = () => {
    setLoading(true);
    getFeedback({ status: statusFilter, page, limit: 20 })
      .then(res => { setFeedback(res.data?.feedback ?? []); setTotal(res.data?.total ?? 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFeedback(); }, [statusFilter, page]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      await updateFeedback(selected.id, editStatus, editNotes);
      showToast('Feedback updated');
      setSelected(null);
      fetchFeedback();
    } catch (e: any) {
      showToast(e.message);
    }
  };

  const openEdit = (fb: any) => {
    setSelected(fb);
    setEditStatus(fb.status);
    setEditNotes(fb.admin_notes ?? '');
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">{toast}</div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Feedback & Suggestions</h2>
          <p className="text-sm text-gray-500">{total} total items</p>
        </div>
        <select
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="under_review">Under Review</option>
          <option value="planned">Planned</option>
          <option value="implemented">Implemented</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : feedback.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-500 border border-gray-100">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>No feedback found</p>
          </div>
        ) : feedback.map((fb: any) => (
          <div key={fb.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(fb)}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[fb.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {fb.status?.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[fb.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {fb.type?.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800">{fb.title}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{fb.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>By: {fb.user_name}</span>
                  <span>·</span>
                  <span>{new Date(fb.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {fb.admin_notes && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-1 text-xs text-yellow-700 max-w-32 text-right">
                  Has notes
                </div>
              )}
            </div>
          </div>
        ))}
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

      {/* Edit Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-800">Manage Feedback</h3>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="flex gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[selected.type]}`}>{selected.type?.replace('_', ' ')}</span>
                </div>
                <h4 className="font-semibold text-gray-800">{selected.title}</h4>
                <p className="text-sm text-gray-600 mt-2">{selected.description}</p>
                <p className="text-xs text-gray-400 mt-2">Submitted by: {selected.user_name} · {new Date(selected.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                >
                  <option value="new">New</option>
                  <option value="under_review">Under Review</option>
                  <option value="planned">Planned</option>
                  <option value="implemented">Implemented</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Admin Notes</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Add internal notes..."
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelected(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={handleUpdate} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;
