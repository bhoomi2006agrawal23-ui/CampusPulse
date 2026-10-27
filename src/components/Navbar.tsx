import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { apiClient } from '../api/client.js';
import { VerifyCertificateModal } from '../features/certificates/VerifyCertificateModal.js';
import {
  LogOut,
  User,
  Activity,
  Menu,
  X,
  Bell,
  CheckCheck,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onOpenCreateEvent?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await apiClient('/notifications');
      if (res.success && res.data?.notifications) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.notifications.filter((n: any) => !n.isRead).length);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-[#FFF8E7] text-[#5A1E2D] border-[#D8C3A5] font-bold';
      case 'Organizer':
        return 'bg-[#FFF8E7] text-[#5A1E2D] border-[#D8C3A5]';
      case 'Judge':
        return 'bg-[#3D6A4E]/10 text-[#3D6A4E] border-[#3D6A4E]/30';
      case 'Volunteer':
        return 'bg-[#FFF8E7] text-[#857568] border-[#D8C3A5]';
      default:
        return 'bg-[#FFF8E7] text-[#5A1E2D] border-[#D8C3A5]';
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#FFF8E7]/95 backdrop-blur-md border-b border-[#D8C3A5] text-[#2B211D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Brand Wordmark */}
            <div
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#5A1E2D] text-[#FFF8E7] flex items-center justify-center shadow-xs group-hover:bg-[#742A3D] transition-colors">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-[#2B211D]">
                  Campus<span className="text-[#5A1E2D]">Pulse</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase text-[#857568] font-medium hidden sm:block -mt-1">
                  College Events
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#857568]">
              <button
                onClick={() => setCurrentView('home')}
                className={`transition-colors cursor-pointer py-1.5 ${
                  currentView === 'home'
                    ? 'text-[#5A1E2D] font-bold border-b-2 border-[#5A1E2D]'
                    : 'hover:text-[#2B211D]'
                }`}
              >
                Discover Events
              </button>
              <button
                onClick={() => setCurrentView('categories')}
                className={`transition-colors cursor-pointer py-1.5 ${
                  currentView === 'categories'
                    ? 'text-[#5A1E2D] font-bold border-b-2 border-[#5A1E2D]'
                    : 'hover:text-[#2B211D]'
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setCurrentView('venues')}
                className={`transition-colors cursor-pointer py-1.5 ${
                  currentView === 'venues'
                    ? 'text-[#5A1E2D] font-bold border-b-2 border-[#5A1E2D]'
                    : 'hover:text-[#2B211D]'
                }`}
              >
                Venues
              </button>

              <button
                onClick={() => setVerifyModalOpen(true)}
                className="hover:text-[#2B211D] transition-colors flex items-center gap-1.5 cursor-pointer text-[#857568]"
              >
                <ShieldCheck className="w-4 h-4 text-[#3D6A4E]" />
                <span>Verify Credential</span>
              </button>
            </div>

            {/* Right User Area */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  {/* Notifications Bell */}
                  <div className="relative">
                    <button
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                      className="relative p-2.5 rounded-xl bg-[#FFFCF5] hover:bg-[#FFF8E7] border border-[#D8C3A5] text-[#857568] hover:text-[#2B211D] transition-colors cursor-pointer shadow-2xs"
                      aria-label="Notifications"
                    >
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#5A1E2D] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications Panel */}
                    {notificationsOpen && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FFFCF5] border border-[#D8C3A5] rounded-2xl shadow-xl overflow-hidden z-50">
                        <div className="p-3.5 px-4 bg-[#FFF8E7] border-b border-[#D8C3A5] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#2B211D]">Notifications</span>
                            {unreadCount > 0 && (
                              <span className="px-2 py-0.5 bg-[#5A1E2D]/10 text-[#5A1E2D] text-[10px] font-semibold rounded-full">
                                {unreadCount} unread
                              </span>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-[11px] text-[#5A1E2D] hover:text-[#742A3D] font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                            </button>
                          )}
                        </div>

                        <div className="max-h-72 overflow-y-auto divide-y divide-[#D8C3A5]/60">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-xs text-[#857568]">
                              <Bell className="w-6 h-6 text-[#D8C3A5] mx-auto mb-2" />
                              No notifications yet
                            </div>
                          ) : (
                            notifications.map((n) => {
                              const nId = n._id || n.id;
                              return (
                                <div
                                  key={nId}
                                  onClick={() => !n.isRead && handleMarkAsRead(nId)}
                                  className={`p-3.5 px-4 transition-colors cursor-pointer hover:bg-[#FFF8E7] ${
                                    !n.isRead ? 'bg-[#D8C3A5]/20 font-medium' : 'opacity-80'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="text-xs font-semibold text-[#2B211D]">{n.title}</div>
                                    {!n.isRead && (
                                      <span className="w-2 h-2 rounded-full bg-[#5A1E2D] shrink-0 mt-1" />
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#857568] mt-1 leading-snug">
                                    {n.message}
                                  </div>
                                  <div className="text-[9px] text-[#857568]/70 mt-1.5 font-mono">
                                    {new Date(n.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Role Dashboard Button */}
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border ${getRoleBadgeStyle(
                      user.role
                    )} hover:opacity-95 transition-all shadow-2xs cursor-pointer`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{user.role} Dashboard</span>
                  </button>

                  <div className="text-right">
                    <div className="text-xs font-semibold text-[#2B211D]">{user.name}</div>
                    <div className="text-[11px] text-[#857568]">{user.loginId ? `@${user.loginId}` : user.email}</div>
                  </div>

                  <button
                    onClick={() => logout()}
                    title="Sign Out"
                    className="p-2 rounded-xl bg-[#FFFCF5] hover:bg-[#FFF8E7] text-[#857568] hover:text-[#8B2635] transition-colors border border-[#D8C3A5] cursor-pointer shadow-2xs"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setCurrentView('login')}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-[#857568] hover:text-[#2B211D] hover:bg-[#FFFCF5] transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setCurrentView('register')}
                    className="px-4.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#5A1E2D] hover:bg-[#742A3D] text-[#FFF8E7] shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    Join CampusPulse
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setVerifyModalOpen(true)}
                className="p-2 rounded-xl text-[#857568] hover:text-[#2B211D] hover:bg-[#FFFCF5]"
                aria-label="Verify Certificate"
              >
                <ShieldCheck className="w-5 h-5 text-[#3D6A4E]" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-[#857568] hover:text-[#2B211D] hover:bg-[#FFFCF5]"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-5 space-y-2.5 bg-[#FFFCF5] border-b border-[#D8C3A5] text-sm shadow-md animate-in fade-in">
            <button
              onClick={() => {
                setCurrentView('home');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FFF8E7] text-[#2B211D] font-medium"
            >
              Discover Events
            </button>
            <button
              onClick={() => {
                setCurrentView('categories');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FFF8E7] text-[#2B211D] font-medium"
            >
              Categories
            </button>
            <button
              onClick={() => {
                setCurrentView('venues');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FFF8E7] text-[#2B211D] font-medium"
            >
              Venues
            </button>
            <button
              onClick={() => {
                setVerifyModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FFF8E7] text-[#3D6A4E] font-medium flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" /> Verify Credential
            </button>

            {user ? (
              <div className="pt-3 border-t border-[#D8C3A5]/60 space-y-2">
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl bg-[#5A1E2D] text-[#FFF8E7] font-semibold"
                >
                  Go to {user.role} Dashboard
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-[#8B2635] font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-[#D8C3A5]/60 flex gap-2">
                <button
                  onClick={() => {
                    setCurrentView('login');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-[#FFF8E7] border border-[#D8C3A5]"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setCurrentView('register');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-[#5A1E2D] text-[#FFF8E7]"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Verify Certificate Modal */}
      {verifyModalOpen && (
        <VerifyCertificateModal
          isOpen={verifyModalOpen}
          onClose={() => setVerifyModalOpen(false)}
        />
      )}
    </>
  );
};
