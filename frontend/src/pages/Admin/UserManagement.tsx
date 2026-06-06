import React, { useEffect, useState, useCallback } from 'react';
import { getUsers, updateUserStatus, deleteUser, loginAsBroker } from '../../services/adminApi';
import {
  Search, ChevronLeft, ChevronRight, UserCheck, UserX, Shield,
  Trash2, LogIn, Eye, X, AlertTriangle,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  blocked: 'bg-red-100 text-red-700',
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionUser, setActionUser] = useState<any>(null);
  const [actionType, setActionType] = useState('');
  const [toast, setToast] = useState('');
  const limit = 20;

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setFetchError('');
    getUsers({ search, status: statusFilter, page, limit })
      .then(res => {
        setUsers(res.data?.users ?? []);
        setTotal(res.data?.total ?? 0);
      })
      .catch(e => setFetchError(e.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  }, [search, statusFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleStatusChange = async (user: any, status: 'activate' | 'deactivate' | 'block') => {
    try {
      await updateUserStatus(user.id, status);
      showToast(`User ${status}d successfully`);
      fetchUsers();
    } catch (e: any) {
      showToast(e.message);
    }
    setActionUser(null);
  };

  const handleDelete = async (user: any) => {
    try {
      await deleteUser(user.id);
      showToast('User deleted successfully');
      fetchUsers();
    } catch (e: any) {
      showToast(e.message);
    }
    setActionUser(null);
  };

  const handleLoginAs = async (user: any) => {
    try {
      const res = await loginAsBroker(user.id);
      const token = res.data?.token;
      if (token) {
        localStorage.setItem('admin_original_token', localStorage.getItem('enfor_token') || '');
        localStorage.setItem('enfor_token', token);
        window.open('/dashboard', '_blank');
      }
    } catch (e: any) {
      showToast(e.message);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getUserStatus = (user: any) => {
    if (user.is_blocked) return 'blocked';
    if (!user.is_active) return 'inactive';
    return 'active';
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Header + filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">User Management</h2>
          <p className="text-sm text-gray-500">{total} total brokers</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              placeholder="Search by name, email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Error banner */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <span className="font-medium">Error:</span> {fetchError}
          <span className="ml-1 text-red-500">— Make sure the backend is restarted so admin migrations run.</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-100">
                <th className="px-4 py-3 font-semibold text-gray-600">Broker</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Contact</th>
                <th className="px-4 py-3 font-semibold text-gray-600">City</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Package</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Registered</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">No users found</td></tr>
              ) : (
                users.map(user => {
                  const status = getUserStatus(user);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800">{user.first_name} {user.last_name}</p>
                          <p className="text-xs text-gray-500">{user.firm_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{user.email}</p>
                        <p className="text-xs text-gray-500">{user.whatsapp_number}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.city}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{user.package_name}</span>
                        {user.package_expiry && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Exp: {new Date(user.package_expiry).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[status]}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {status !== 'active' && (
                            <button
                              onClick={() => handleStatusChange(user, 'activate')}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Activate"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          {status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(user, 'deactivate')}
                              className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Deactivate"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
                          {status !== 'blocked' && (
                            <button
                              onClick={() => handleStatusChange(user, 'block')}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Block"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleLoginAs(user)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Login As Broker"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setActionUser(user); setActionType('delete'); }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-800">Broker Details</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              {[
                ['Name', `${selectedUser.first_name} ${selectedUser.last_name}`],
                ['Firm', selectedUser.firm_name],
                ['Email', selectedUser.email],
                ['Phone', selectedUser.whatsapp_number],
                ['City', selectedUser.city],
                ['Package', selectedUser.package_name],
                ['Package Expiry', selectedUser.package_expiry ? new Date(selectedUser.package_expiry).toLocaleDateString() : 'N/A'],
                ['Registered', new Date(selectedUser.created_at).toLocaleDateString()],
                ['Last Login', selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleDateString() : 'Never'],
                ['Login Count', selectedUser.login_count ?? 0],
                ['Properties', selectedUser.properties_count ?? 0],
                ['Clients', selectedUser.clients_count ?? 0],
                ['Agreements', selectedUser.agreements_count ?? 0],
                ['SMS Used', selectedUser.sms_used ?? 0],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {actionUser && actionType === 'delete' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="font-bold text-gray-800">Confirm Delete</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to delete <strong>{actionUser.first_name} {actionUser.last_name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setActionUser(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(actionUser)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
