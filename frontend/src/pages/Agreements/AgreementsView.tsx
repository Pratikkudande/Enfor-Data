import React, { useEffect, useState } from 'react';
import { Plus, FileText, Calendar, Building2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Agreement } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import AgreementFormModal from './AgreementFormModal';

const statusConfig = {
  active: {
    label: 'Active',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700',
  },
  expired: {
    label: 'Expired',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-700',
  },
  terminated: {
    label: 'Terminated',
    icon: XCircle,
    className: 'bg-red-100 text-red-700',
  },
};

const AgreementsView: React.FC = () => {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load agreements from localStorage (frontend-only storage until backend is ready)
  useEffect(() => {
    loadAgreements();
  }, [user?.id]);

  const loadAgreements = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(`agreements_${user?.id}`);
      const parsed: Agreement[] = stored ? JSON.parse(stored) : [];
      // Auto-compute status based on dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const withStatus = parsed.map((a) => {
        if (a.status === 'terminated') return a;
        const end = new Date(a.end_date);
        end.setHours(0, 0, 0, 0);
        return { ...a, status: end < today ? 'expired' : 'active' } as Agreement;
      });
      setAgreements(withStatus);
    } catch {
      setError('Failed to load agreements.');
    } finally {
      setLoading(false);
    }
  };

  const saveAgreements = (updated: Agreement[]) => {
    localStorage.setItem(`agreements_${user?.id}`, JSON.stringify(updated));
    setAgreements(updated);
  };

  const handleCreate = (newAgreement: Agreement) => {
    const updated = [newAgreement, ...agreements];
    saveAgreements(updated);
    showTimedSuccess('Agreement created successfully!');
    setShowFormModal(false);
  };

  const handleTerminate = (id: string) => {
    const updated = agreements.map((a) =>
      a.id === id ? { ...a, status: 'terminated' as const, updated_at: new Date().toISOString() } : a
    );
    saveAgreements(updated);
    showTimedSuccess('Agreement terminated.');
  };

  const showTimedSuccess = (msg: string) => {
    setSuccessMessage(msg);
    window.setTimeout(() => setSuccessMessage(null), 3000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDurationDays = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agreements</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {agreements.length} agreement{agreements.length !== 1 ? 's' : ''} total
            {' · '}
            <span className="text-green-600 font-medium">
              {agreements.filter((a) => a.status === 'active').length} active
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowFormModal(true)}
          className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Create Agreement
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Empty state */}
      {!loading && agreements.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No agreements yet</h3>
          <p className="text-gray-500 text-sm mb-6">
            Create your first agreement by linking a property with a date range.
          </p>
          <button
            onClick={() => setShowFormModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Create Agreement
          </button>
        </div>
      )}

      {/* Agreements grid */}
      {!loading && agreements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {agreements.map((agreement) => {
            const cfg = statusConfig[agreement.status];
            const StatusIcon = cfg.icon;
            const duration = getDurationDays(agreement.start_date, agreement.end_date);

            return (
              <div
                key={agreement.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4"
              >
                {/* Top row: status badge */}
                <div className="flex items-start justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.className}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(agreement.created_at)}
                  </span>
                </div>

                {/* Property */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">Property</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {agreement.property_title || 'Unknown Property'}
                    </p>
                    {agreement.property_address && (
                      <p className="text-xs text-gray-500 truncate">{agreement.property_address}</p>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="font-medium">{formatDate(agreement.start_date)}</span>
                      <span className="text-gray-300">→</span>
                      <span className="font-medium">{formatDate(agreement.end_date)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{duration} day{duration !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Actions */}
                {agreement.status === 'active' && (
                  <button
                    onClick={() => handleTerminate(agreement.id)}
                    className="w-full text-xs text-red-600 border border-red-200 rounded-lg py-2 hover:bg-red-50 transition-colors font-medium"
                  >
                    Terminate Agreement
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showFormModal && (
        <AgreementFormModal
          onClose={() => setShowFormModal(false)}
          onCreate={handleCreate}
          userId={user?.id ?? ''}
        />
      )}

      {/* Success toast */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 text-sm">
          <CheckCircle className="h-4 w-4" />
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default AgreementsView;
