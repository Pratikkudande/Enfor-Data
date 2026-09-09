import React, { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, Menu, User, Settings, HelpCircle } from 'lucide-react';
import HelpDrawer from '../components/help/HelpDrawer';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/routePaths';
import NotificationDropdown from '../components/notifications/NotificationDropdown';
import logo from '../assets/logo.png';
import { ENV } from '../config/env';

// Resolves a stored profile image path to a full URL (same logic as the Profile page).
const resolvePhoto = (path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return `${ENV.API_URL}${path}`;
};

interface NavbarProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuToggle, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  const handleProfileClick = () => {
    navigate(ROUTES.PROFILE);
    setShowProfileMenu(false);
  };

  const handleSettingsClick = () => {
    navigate(ROUTES.SETTINGS);
    setShowProfileMenu(false);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'broker':
        return 'Real Estate Broker';
      case 'channel_partner':
        return 'Channel Partner';
      case 'admin':
        return 'Administrator';
      default:
        return role;
    }
  };

  return (
    <>
    <HelpDrawer isOpen={showHelp} onClose={() => setShowHelp(false)} />
    <nav
      className="fixed w-full top-0 z-50 h-20"
      style={{
        background: 'rgba(3,11,36,0.97)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center justify-between h-full px-3 sm:px-4 lg:px-6">
        <div className="flex items-center min-w-0">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors lg:hidden mr-2"
          >
            <Menu className="h-5 w-5 text-gray-300" />
          </button>
          <div className="min-w-0">
            <img src={logo} alt="Enfor Data" className="h-28 w-auto object-contain" />
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Help */}
          <button
            onClick={() => setShowHelp(true)}
            title="Help & Guide"
            className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <HelpCircle className="h-5 w-5 text-gray-300" />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Bell className="h-5 w-5 text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <NotificationDropdown
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              notificationCount={unreadCount}
              onNotificationCountChange={() => {}}
            />
          </div>

          {/* Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}
              >
                {resolvePhoto(user?.profile_image) ? (
                  <img
                    src={resolvePhoto(user?.profile_image) as string}
                    alt={user?.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{getRoleDisplayName(user?.role || '')}</p>
              </div>
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-56 sm:w-64 rounded-xl shadow-2xl border py-1"
                style={{ background: '#050F2E', borderColor: 'rgba(255,255,255,0.10)' }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#93C5FD' }}>{getRoleDisplayName(user?.role || '')}</p>
                </div>

                <button
                  onClick={handleProfileClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/8 hover:text-white flex items-center transition-colors"
                >
                  <User className="h-4 w-4 mr-3 text-gray-400" />
                  View Profile
                </button>

                <button
                  onClick={handleSettingsClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/8 hover:text-white flex items-center transition-colors"
                >
                  <Settings className="h-4 w-4 mr-3 text-gray-400" />
                  Settings
                </button>

                <div className="border-t mt-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
    </>
  );
};

export default Navbar;