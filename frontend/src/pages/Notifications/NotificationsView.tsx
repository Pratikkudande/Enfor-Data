import React, { useState, useEffect } from 'react';
import {
  Bell,
  Filter,
  Search,
  CheckCheck,
  Trash2,
  Calendar,
  Home,
  Briefcase,
  Users,
  CreditCard,
  Settings,
  Megaphone,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import { notificationApi, Notification } from '../../services/notificationApi';

const NotificationsView: React.FC = () => {
  const { stats, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | Notification['type']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    loadNotifications();
  }, [currentPage, selectedFilter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      let response;
      if (selectedFilter === 'unread') {
        response = await notificationApi.getUnreadNotifications();
        if (response.success && response.data) {
          setNotifications(response.data);
          setTotalPages(1);
        }
      } else {
        response = await notificationApi.getNotifications(currentPage, 20);
        if (response.success && response.data) {
          let filteredNotifications = response.data.notifications;
          
          if (selectedFilter !== 'all') {
            filteredNotifications = filteredNotifications.filter(n => n.type === selectedFilter);
          }
          
          setNotifications(filteredNotifications);
          setTotalPages(response.data.pagination.total_pages);
        }
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      showToast({
        type: 'error',
        title: 'Failed to Load',
        message: 'Could not load notifications. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await notificationApi.getNotificationStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    }
  };

  const handleMarkAsRead = async (notificationIds: string[]) => {
    try {
      await Promise.all(notificationIds.map(id => markAsRead(id)));
      setNotifications(prev => 
        prev.map(n => notificationIds.includes(n.id) ? { ...n, read: true } : n)
      );
      setSelectedNotifications([]);
      showToast({
        type: 'success',
        title: 'Marked as Read',
        message: `${notificationIds.length} notification(s) marked as read.`
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
      showToast({
        type: 'error',
        title: 'Failed to Update',
        message: 'Could not mark notifications as read.'
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setSelectedNotifications([]);
      showToast({
        type: 'success',
        title: 'All Read',
        message: 'All notifications marked as read.'
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      showToast({
        type: 'error',
        title: 'Failed to Update',
        message: 'Could not mark all notifications as read.'
      });
    }
  };

  const handleDeleteNotifications = async (notificationIds: string[]) => {
    try {
      await Promise.all(notificationIds.map(id => deleteNotification(id)));
      setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
      setSelectedNotifications([]);
      showToast({
        type: 'success',
        title: 'Deleted',
        message: `${notificationIds.length} notification(s) deleted.`
      });
    } catch (error) {
      console.error('Failed to delete notifications:', error);
      showToast({
        type: 'error',
        title: 'Failed to Delete',
        message: 'Could not delete notifications.'
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead([notification.id]);
    }

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'property':
        return <Home className="w-5 h-5 text-green-500" />;
      case 'project':
        return <Briefcase className="w-5 h-5 text-indigo-500" />;
      case 'client':
        return <Users className="w-5 h-5 text-purple-500" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-yellow-500" />;
      case 'system':
        return <Settings className="w-5 h-5 text-gray-500" />;
      case 'marketing':
        return <Megaphone className="w-5 h-5 text-pink-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filterOptions = [
    { value: 'all', label: 'All', count: stats?.total || 0 },
    { value: 'unread', label: 'Unread', count: stats?.unread || 0 },
    { value: 'appointment', label: 'Appointments', count: stats?.by_type.appointment || 0 },
    { value: 'property', label: 'Properties', count: stats?.by_type.property || 0 },
    { value: 'project', label: 'Projects', count: stats?.by_type.project || 0 },
    { value: 'client', label: 'Clients', count: stats?.by_type.client || 0 },
    { value: 'payment', label: 'Payments', count: stats?.by_type.payment || 0 },
    { value: 'system', label: 'System', count: stats?.by_type.system || 0 },
    { value: 'marketing', label: 'Marketing', count: stats?.by_type.marketing || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            {stats && `${stats.unread} unread of ${stats.total} total notifications`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedNotifications.length > 0 && (
            <>
              <button
                onClick={() => handleMarkAsRead(selectedNotifications)}
                className="flex items-center gap-2 px-3 py-2 btn-primary text-sm"
              >
                <CheckCheck className="w-4 h-4" />
                Mark Read ({selectedNotifications.length})
              </button>
              <button
                onClick={() => handleDeleteNotifications(selectedNotifications)}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedNotifications.length})
              </button>
            </>
          )}
          {stats && stats.unread > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSelectedFilter(option.value as any);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedFilter === option.value
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
                <span className="bg-white px-1.5 py-0.5 rounded text-xs">
                  {option.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* List Header */}
        {filteredNotifications.length > 0 && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedNotifications.length === filteredNotifications.length}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Select all ({filteredNotifications.length})
              </span>
            </label>
            <span className="text-sm text-gray-500">
              {selectedNotifications.length} selected
            </span>
          </div>
        )}

        {/* Notifications */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-sm">
              {searchQuery ? 'Try adjusting your search terms.' : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNotifications(prev => [...prev, notification.id]);
                      } else {
                        setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                      }
                    }}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-sm font-medium truncate ${
                        !notification.read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                      {notification.action_url && (
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(notification.created_at)}</span>
                      </div>
                      <span className="capitalize">{notification.type}</span>
                      <span className="capitalize">{notification.priority} priority</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsView;