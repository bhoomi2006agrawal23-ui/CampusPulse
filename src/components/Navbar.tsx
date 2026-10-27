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
        return 'bg-[#FBF7EF] text-[#B58A3A] border-[#E6D8C3]';
      case 'Organizer':
        return 'bg-[#FBF7EF] text-[#C6A15B] border-[#E6D8C3]';
      case 'Judge':
        return 'bg-[#71866F]/10 text-[#71866F] border-[#71866F]/30';
      case 'Volunteer':
        return 'bg-[#FBF7EF] text-[#5A463B] border-[#E6D8C3]';
      default:
        return 'bg-[#FBF7EF] text-[#786B61] border-[#E6D8C3]';
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#F7F0E3]/90 backdrop-blur-md border-b border-[#E6D8C3] text-[#2B211C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Brand Wordmark */}
            <div
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#C6A15B] text-[#FFFDF8] flex items-center justify-center shadow-xs group-hover:bg-[#B58A3A] transition-colors">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-[#1F1713]">
                  Campus<span className="text-[#C6A15B]">Pulse</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase text-[#786B61] font-medium hidden sm:block -mt-1">
                  College Events
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#786B61]">
              <button
                onClick={() => setCurrentView('home')}
                className={`transition-colors cursor-pointer py-1.5 ${
                  currentView === 'home'
                    ? 'text-[#1F1713] font-semibold border-b-2 border-[#C6A15B]'
                    : 'hover:text-[#1F1713]'
                }`}
              >
                Discover Events
              </button>
              <button
                onClick={() => setCurrentView('categories')}
                className={`transition-colors cursor-pointer py-1.5 ${
                  currentView === 'categories'
                    ? 'text-[#1F1713] font-semibold border-b-2 border-[#C6A15B]'
                    : 'hover:text-[#1F1713]'
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setCurrentView('venues')}
                className={`transition-colors cursor-pointer py-1.5 ${
                  currentView === 'venues'
                    ? 'text-[#1F1713] font-semibold border-b-2 border-[#C6A15B]'
                    : 'hover:text-[#1F1713]'
                }`}
              >
                Venues
              </button>

              <button
                onClick={() => setVerifyModalOpen(true)}
                className="hover:text-[#1F1713] transition-colors flex items-center gap-1.5 cursor-pointer text-[#786B61]"
              >
                <ShieldCheck className="w-4 h-4 text-[#71866F]" />
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
                      className="relative p-2.5 rounded-xl bg-[#FFFDF8] hover:bg-[#FBF7EF] border border-[#E6D8C3] text-[#786B61] hover:text-[#1F1713] transition-colors cursor-pointer shadow-2xs"
                      aria-label="Notifications"
                    >
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C6A15B] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications Panel */}
                    {notificationsOpen && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FFFDF8] border border-[#E6D8C3] rounded-2xl shadow-xl overflow-hidden z-50">
                        <div className="p-3.5 px-4 bg-[#FBF7EF] border-b border-[#E6D8C3] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1713]">Notifications</span>
                            {unreadCount > 0 && (
                              <span className="px-2 py-0.5 bg-[#C6A15B]/15 text-[#B58A3A] text-[10px] font-semibold rounded-full">
                                {unreadCount} unread
                              </span>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-[11px] text-[#B58A3A] hover:text-[#C6A15B] font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                            </button>
                          )}
                        </div>

                        <div className="max-h-72 overflow-y-auto divide-y divide-[#E6D8C3]/60">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-xs text-[#786B61]">
                              <Bell className="w-6 h-6 text-[#E6D8C3] mx-auto mb-2" />
                              No notifications yet
                            </div>
                          ) : (
                            notifications.map((n) => {
                              const nId = n._id || n.id;
                              return (
                                <div
                                  key={nId}
                                  onClick={() => !n.isRead && handleMarkAsRead(nId)}
                                  className={`p-3.5 px-4 transition-colors cursor-pointer hover:bg-[#FBF7EF] ${
                                    !n.isRead ? 'bg-[#E2CF9F]/15 font-medium' : 'opacity-80'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="text-xs font-semibold text-[#1F1713]">{n.title}</div>
                                    {!n.isRead && (
                                      <span className="w-2 h-2 rounded-full bg-[#C6A15B] shrink-0 mt-1" />
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#786B61] mt-1 leading-snug">
                                    {n.message}
                                  </div>
                                  <div className="text-[9px] text-[#786B61]/70 mt-1.5 font-mono">
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
                    <div className="text-xs font-semibold text-[#1F1713]">{user.name}</div>
                    <div className="text-[11px] text-[#786B61]">{user.email}</div>
                  </div>

                  <button
                    onClick={() => logout()}
                    title="Sign Out"
                    className="p-2 rounded-xl bg-[#FFFDF8] hover:bg-[#FBF7EF] text-[#786B61] hover:text-[#A9675D] transition-colors border border-[#E6D8C3] cursor-pointer shadow-2xs"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setCurrentView('login')}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-[#786B61] hover:text-[#1F1713] hover:bg-[#FBF7EF] transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setCurrentView('register')}
                    className="px-4.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] shadow-xs hover:shadow-md transition-all cursor-pointer"
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
                className="p-2 rounded-xl text-[#786B61] hover:text-[#1F1713] hover:bg-[#FBF7EF]"
                aria-label="Verify Certificate"
              >
                <ShieldCheck className="w-5 h-5 text-[#71866F]" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-[#786B61] hover:text-[#1F1713] hover:bg-[#FBF7EF]"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-5 space-y-2.5 bg-[#FFFDF8] border-b border-[#E6D8C3] text-sm shadow-md animate-in fade-in">
            <button
              onClick={() => {
                setCurrentView('home');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FBF7EF] text-[#1F1713] font-medium"
            >
              Discover Events
            </button>
            <button
              onClick={() => {
                setCurrentView('categories');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FBF7EF] text-[#1F1713] font-medium"
            >
              Categories
            </button>
            <button
              onClick={() => {
                setCurrentView('venues');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FBF7EF] text-[#1F1713] font-medium"
            >
              Venues
            </button>
            <button
              onClick={() => {
                setVerifyModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FBF7EF] text-[#71866F] font-medium flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Credential</span>
            </button>

            {user ? (
              <div className="pt-3 border-t border-[#E6D8C3] space-y-2">
                <div className="px-3 py-2 rounded-xl bg-[#FBF7EF]">
                  <div className="text-xs font-bold text-[#1F1713]">{user.name}</div>
                  <div className="text-[11px] text-[#786B61]">{user.email} • {user.role}</div>
                </div>

                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#C6A15B] text-[#FFFDF8] text-xs font-bold shadow-xs text-center"
                >
                  Access {user.role} Dashboard
                </button>

                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 rounded-xl border border-[#E6D8C3] text-[#A9675D] text-xs font-medium hover:bg-[#FBF7EF] text-center"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-[#E6D8C3] flex gap-2">
                <button
                  onClick={() => {
                    setCurrentView('login');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 rounded-xl border border-[#E6D8C3] text-xs font-semibold text-[#1F1713] text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setCurrentView('register');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#C6A15B] text-[#FFFDF8] text-xs font-bold text-center"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Verify Credential Modal */}
      <VerifyCertificateModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
      />
    </>
  );
};
