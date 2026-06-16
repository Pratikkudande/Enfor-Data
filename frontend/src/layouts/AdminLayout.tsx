import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, DollarSign, MessageSquare, Download,
  Megaphone, MessageCircle, Activity, RefreshCw, ClipboardList,
  HardDrive, Settings, Menu, X, LogOut, ChevronRight, Shield, Mail,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../routes/routePaths';

const menuItems = [
  { id: 'admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'admin/users', label: 'User Management', icon: Users },
  { id: 'admin/revenue', label: 'Revenue & Subscriptions', icon: DollarSign },
  { id: 'admin/sms', label: 'SMS Management', icon: MessageSquare },
  { id: 'admin/download', label: 'Data Download', icon: Download },
  { id: 'admin/announcements', label: 'Announcement Center', icon: Megaphone },
  { id: 'admin/feedback', label: 'Feedback & Suggestions', icon: MessageCircle },
  { id: 'admin/contact-messages', label: 'Contact Messages', icon: Mail },
  { id: 'admin/activity', label: 'Activity Monitoring', icon: Activity },
  { id: 'admin/renewals', label: 'Renewal Monitoring', icon: RefreshCw },
  { id: 'admin/audit-logs', label: 'Audit Logs', icon: ClipboardList },
  { id: 'admin/storage', label: 'Storage Monitoring', icon: HardDrive },
  { id: 'admin/config', label: 'System Configuration', icon: Settings },
];

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const currentPath = location.pathname.replace(/^\//, '');

  const handleNav = (id: string) => {
    navigate(`/${id}`);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-50 flex flex-col transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-700">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">EnforData</p>
            <p className="text-gray-400 text-xs">Admin Panel</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin info */}
        <div className="px-5 py-3 border-b border-gray-700 bg-gray-800">
          <p className="text-xs text-gray-400">Signed in as</p>
          <p className="text-sm font-medium text-white truncate">{user?.email}</p>
          <span className="inline-block mt-1 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
            {user?.role === 'admin' ? 'Super Admin' : 'Admin'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.id || currentPath.startsWith(item.id + '/');
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3" />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:text-red-400 hover:bg-gray-700 rounded-lg text-sm transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white shadow-sm sticky top-0 z-30 flex items-center gap-4 px-4 sm:px-6 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-gray-800">
              {menuItems.find(m => currentPath === m.id || currentPath.startsWith(m.id + '/'))?.label ?? 'Admin Panel'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.first_name?.[0]?.toUpperCase() ?? 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
