import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../api/client.js';
import { EventItem } from '../events/EventCard.js';
import { EventFormModal } from '../events/EventFormModal.js';
import {
  RefreshCw,
  ShieldAlert,
  AlertCircle,
  Filter,
  CheckCircle2,
  Send,
  UserPlus,
  Trash2,
  Edit,
  Calendar,
  Building,
  Users,
  Search,
  Plus,
  Shield,
  X,
} from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  loginId?: string;
  role: string;
  collegeName?: string;
  phoneNumber?: string;
  status: string;
  createdAt: string;
}

interface AdminDashboardProps {
  activeTab?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab = 'overview' }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User Filter
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // Modals for User Management
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Form state for creating user
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserLoginId, setNewUserLoginId] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<string>('Student');
  const [newUserCollege, setNewUserCollege] = useState('CampusPulse Institute of Technology');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [createUserLoading, setCreateUserLoading] = useState(false);

  // Form state for editing user
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Suspended' | 'Pending'>('Active');
  const [editPhone, setEditPhone] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editUserLoading, setEditUserLoading] = useState(false);

  // Event Management Modals
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [eventSearch, setEventSearch] = useState('');

  // Global Announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [annLoading, setAnnLoading] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditPagination, setAuditPagination] = useState<any>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const res = await apiClient<{ users: AdminUser[] }>('/api/users');
    if (res.success && res.data) {
      setUsers(res.data.users);
    }
    setLoadingUsers(false);
  };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    const res = await apiClient<{ events: EventItem[] }>('/api/events');
    if (res.success && res.data) {
      setEvents(res.data.events);
    }
    setLoadingEvents(false);
  };

  const fetchVenuesAndCategories = async () => {
    const venRes = await apiClient<{ venues: any[] }>('/api/venues');
    if (venRes.success && venRes.data) setVenues(venRes.data.venues);

    const catRes = await apiClient<{ categories: any[] }>('/api/categories');
    if (catRes.success && catRes.data) setCategories(catRes.data.categories);
  };

  const fetchMetrics = async () => {
    try {
      const res = await apiClient<{ metrics: any }>('/reports/system-overview');
      if (res.success && res.data) {
        setMetrics(res.data.metrics);
      }
    } catch {
      // ignore
    }
  };

  const fetchAuditLogs = async (page = 1, action = '') => {
    setLoadingAudit(true);
    try {
      let url = `/api/audit-logs?page=${page}&limit=10`;
      if (action) url += `&action=${encodeURIComponent(action)}`;
      const res = await apiClient<{ logs: any[]; pagination: any }>(url);
      if (res.success && res.data) {
        setAuditLogs(res.data.logs || []);
        setAuditPagination(res.data.pagination);
      }
    } catch {
      // ignore
    }
    setLoadingAudit(false);
  };

  useEffect(() => {
    fetchUsers();
    fetchEvents();
    fetchVenuesAndCategories();
    fetchMetrics();
    fetchAuditLogs();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    setNotification(null);
    setError(null);

    const res = await apiClient<{ user: AdminUser }>(`/api/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole }),
    });

    setUpdatingId(null);

    if (res.success && res.data) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setNotification(`Role updated to ${newRole}`);
      setTimeout(() => setNotification(null), 3000);
      fetchAuditLogs(auditPage, auditActionFilter);
    } else {
      setError(res.error?.message || 'Failed to update user role');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserLoading(true);
    setError(null);

    const res = await apiClient<{ user: AdminUser }>('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
        loginId: newUserLoginId.trim() || undefined,
        password: newUserPassword,
        role: newUserRole,
        collegeName: newUserCollege.trim() || undefined,
        phoneNumber: newUserPhone.trim() || undefined,
      }),
    });

    setCreateUserLoading(false);

    if (res.success && res.data?.user) {
      setUsers((prev) => [res.data!.user, ...prev]);
      setNotification(`Account for ${res.data.user.name} (${res.data.user.role}) created successfully.`);
      setCreateUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserLoginId('');
      setNewUserPassword('');
      setNewUserPhone('');
      fetchAuditLogs(auditPage, auditActionFilter);
      setTimeout(() => setNotification(null), 3500);
    } else {
      setError(res.error?.message || 'Failed to create user account');
    }
  };

  const handleOpenEditUser = (u: AdminUser) => {
    setSelectedUser(u);
    setEditName(u.name);
    setEditRole(u.role);
    setEditStatus((u.status as any) || 'Active');
    setEditPhone(u.phoneNumber || '');
    setEditCollege(u.collegeName || '');
    setEditUserModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setEditUserLoading(true);
    setError(null);

    const res = await apiClient<{ user: AdminUser }>(`/api/users/${selectedUser.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: editName.trim(),
        role: editRole,
        status: editStatus,
        phoneNumber: editPhone.trim() || undefined,
        collegeName: editCollege.trim() || undefined,
      }),
    });

    setEditUserLoading(false);

    if (res.success && res.data?.user) {
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? res.data!.user : u))
      );
      setNotification(`User ${res.data.user.name} updated successfully.`);
      setEditUserModalOpen(false);
      fetchAuditLogs(auditPage, auditActionFilter);
      setTimeout(() => setNotification(null), 3500);
    } else {
      setError(res.error?.message || 'Failed to update user profile');
    }
  };

  const handleDeleteUser = async (u: AdminUser) => {
    if (u.id === user?.id) {
      setError('You cannot delete your own administrator account while logged in.');
      return;
    }

    const confirm = window.confirm(
      `Are you sure you want to delete user account "${u.name}" (${u.email})?\n\nNote: Deletion will be rejected if the user has active events or registrations to safeguard integrity.`
    );
    if (!confirm) return;

    setError(null);
    const res = await apiClient(`/api/users/${u.id}`, { method: 'DELETE' });

    if (res.success) {
      setUsers((prev) => prev.filter((item) => item.id !== u.id));
      setNotification(`User ${u.name} has been deleted.`);
      fetchAuditLogs(auditPage, auditActionFilter);
      setTimeout(() => setNotification(null), 3500);
    } else {
      setError(res.error?.message || 'Failed to delete user.');
    }
  };

  const handleDeleteEvent = async (ev: EventItem) => {
    const evId = ev._id || ev.id || '';
    const confirm = window.confirm(
      `Are you sure you want to delete or cancel event "${ev.title}"?\n\nIf the event has existing registrations or results, it will be safely marked as Cancelled rather than permanently deleting historical records.`
    );
    if (!confirm) return;

    setError(null);
    const res = await apiClient<{ action: string; message: string; event?: any }>(
      `/api/events/${evId}`,
      { method: 'DELETE' }
    );

    if (res.success) {
      if (res.data?.action === 'cancelled') {
        setEvents((prev) =>
          prev.map((e) => ((e._id || e.id) === evId ? { ...e, status: 'Cancelled' } : e))
        );
      } else {
        setEvents((prev) => prev.filter((e) => (e._id || e.id) !== evId));
      }
      setNotification(res.data?.message || 'Event operation completed.');
      fetchAuditLogs(auditPage, auditActionFilter);
      setTimeout(() => setNotification(null), 4000);
    } else {
      setError(res.error?.message || 'Failed to delete or cancel event.');
    }
  };

  const handleDispatchAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    setAnnLoading(true);
    setError(null);

    const res = await apiClient('/announcements', {
      method: 'POST',
      body: JSON.stringify({
        title: annTitle.trim(),
        content: annContent.trim(),
        priority: annPriority,
      }),
    });

    setAnnLoading(false);

    if (res.success) {
      setNotification('Campus-wide announcement dispatched successfully.');
      setAnnTitle('');
      setAnnContent('');
      setAnnPriority('Normal');
      fetchMetrics();
      fetchAuditLogs(auditPage, auditActionFilter);
      setTimeout(() => setNotification(null), 3500);
    } else {
      setError(res.error?.message || 'Failed to publish announcement');
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('LOGIN') || action.includes('AUTH')) return 'bg-[#3D6A4E]/10 text-[#3D6A4E] border-[#3D6A4E]/20';
    if (action.includes('ROLE') || action.includes('ADMIN')) return 'bg-[#5A1E2D]/10 text-[#5A1E2D] border-[#5A1E2D]/30';
    if (action.includes('CREATE')) return 'bg-[#5A1E2D]/10 text-[#5A1E2D] border-[#5A1E2D]/30';
    return 'bg-[#FFF8E7] text-[#857568] border-[#D8C3A5]';
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.loginId && u.loginId.toLowerCase().includes(q)) ||
      (u.collegeName && u.collegeName.toLowerCase().includes(q));
    const matchesRole = !userRoleFilter || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredEvents = events.filter((e) => {
    const q = eventSearch.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.eventCode.toLowerCase().includes(q) ||
      (e.collegeName && e.collegeName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {/* ADMIN EXECUTIVE HEADER */}
      <div className="bg-[#FFFCF5] rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF8E7] text-[#5A1E2D] border border-[#D8C3A5] text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-[#5A1E2D]" />
            <span>Institutional Governance Authority</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2B211D]">
            Campus Command — {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#857568] max-w-xl">
            Full administrator authority. Create and manage student, organizer, judge, and volunteer accounts; oversee all events, venues, and audit logs.
          </p>
        </div>

        <button
          onClick={() => {
            fetchUsers();
            fetchEvents();
            fetchMetrics();
            fetchAuditLogs(auditPage, auditActionFilter);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#FFF8E7] hover:bg-[#D8C3A5]/30 text-[#2B211D] border border-[#D8C3A5] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#5A1E2D]" />
          <span>Refresh All Metrics</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-[#3D6A4E]/10 border border-[#3D6A4E]/30 text-[#3D6A4E] text-xs flex items-center gap-2 font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#3D6A4E]" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-[#8B2635]/10 border border-[#8B2635]/30 text-[#8B2635] text-xs flex items-center gap-2 font-semibold shadow-xs">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* TOP-LEVEL METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#D8C3A5] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#857568]">Total Users</div>
          <div className="text-xl sm:text-2xl font-bold text-[#2B211D]">{users.length}</div>
          <div className="text-[10px] text-[#3D6A4E] font-medium">All verified accounts</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#D8C3A5] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#857568]">Total Events</div>
          <div className="text-xl sm:text-2xl font-bold text-[#2B211D]">{events.length}</div>
          <div className="text-[10px] text-[#5A1E2D] font-medium">Campus activities</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#D8C3A5] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#857568]">Venues</div>
          <div className="text-xl sm:text-2xl font-bold text-[#2B211D]">{venues.length}</div>
          <div className="text-[10px] text-[#3D6A4E] font-medium">Available spaces</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#D8C3A5] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#857568]">Categories</div>
          <div className="text-xl sm:text-2xl font-bold text-[#2B211D]">{categories.length}</div>
          <div className="text-[10px] text-[#5A1E2D] font-medium">Competition tracks</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#D8C3A5] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#857568]">Registrations</div>
          <div className="text-xl sm:text-2xl font-bold text-[#2B211D]">{metrics?.registrations?.total ?? 0}</div>
          <div className="text-[10px] text-[#3D6A4E] font-medium">Issued passes</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#D8C3A5] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#857568]">Audit Logs</div>
          <div className="text-xl sm:text-2xl font-bold text-[#2B211D]">{auditPagination?.total ?? auditLogs.length}</div>
          <div className="text-[10px] text-[#857568]">Security entries</div>
        </div>
      </div>

      {/* USER & ROLE MANAGEMENT MATRIX */}
      <div className="bg-[#FFFCF5] rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#D8C3A5] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#5A1E2D]" />
              <h2 className="text-base sm:text-lg font-bold text-[#2B211D]">
                Account Authority & User Management
              </h2>
            </div>
            <p className="text-xs text-[#857568]">
              Create, update, inspect, and safely delete Student, Organizer, Judge, Volunteer, and Admin accounts.
            </p>
          </div>

          <button
            onClick={() => setCreateUserModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#5A1E2D] hover:bg-[#742A3D] text-[#FFF8E7] text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>

        {/* User Search & Role Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#857568] absolute left-3.5 top-3" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search user by name, email, login ID, or college..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] placeholder-[#857568]/60 focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D]"
            />
          </div>

          <select
            value={userRoleFilter}
            onChange={(e) => setUserRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D] cursor-pointer"
          >
            <option value="">All Roles ({users.length})</option>
            <option value="Student">Students</option>
            <option value="Organizer">Organizers</option>
            <option value="Judge">Judges</option>
            <option value="Volunteer">Volunteers</option>
            <option value="Admin">Admins</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF8E7] text-[#857568] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5 rounded-l-xl">User Profile</th>
                <th className="py-3 px-3.5">Email / Login ID</th>
                <th className="py-3 px-3.5">Current Role</th>
                <th className="py-3 px-3.5">College</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 rounded-r-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8C3A5]/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-[#857568]">
                    No accounts match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FFF8E7]/60 transition-colors">
                    <td className="py-3.5 px-3.5 font-semibold text-[#2B211D]">
                      <div>{u.name}</div>
                      {u.phoneNumber && (
                        <div className="text-[10px] text-[#857568] font-mono">{u.phoneNumber}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5 text-[#857568] font-mono">
                      <div>{u.email}</div>
                      {u.loginId && (
                        <span className="text-[10px] bg-[#5A1E2D]/10 text-[#5A1E2D] px-1.5 py-0.5 rounded">
                          ID: {u.loginId}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FFF8E7] text-[#5A1E2D] border border-[#D8C3A5]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-[#857568] max-w-xs truncate">
                      {u.collegeName || '—'}
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span
                        className={`flex items-center gap-1 font-medium ${
                          u.status === 'Active' ? 'text-[#3D6A4E]' : 'text-[#8B2635]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'Active' ? 'bg-[#3D6A4E]' : 'bg-[#8B2635]'
                          }`}
                        />
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Role select */}
                        <select
                          value={u.role}
                          disabled={updatingId === u.id || u.id === user?.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2 py-1 bg-[#FFF8E7] border border-[#D8C3A5] rounded-lg text-xs text-[#2B211D] font-medium focus:outline-none focus:ring-1 focus:ring-[#5A1E2D] disabled:opacity-50 cursor-pointer"
                        >
                          <option value="Student">Student</option>
                          <option value="Organizer">Organizer</option>
                          <option value="Judge">Judge</option>
                          <option value="Volunteer">Volunteer</option>
                          <option value="Admin">Admin</option>
                        </select>

                        {/* Edit button */}
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          title="Edit Account Details"
                          className="p-1.5 rounded-lg bg-[#FFF8E7] hover:bg-[#D8C3A5]/40 text-[#2B211D] border border-[#D8C3A5] transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete button (with safeguard checks) */}
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.id === user?.id}
                          title={
                            u.id === user?.id
                              ? 'Cannot delete your own account'
                              : 'Delete User Account'
                          }
                          className="p-1.5 rounded-lg bg-[#FFF8E7] hover:bg-[#8B2635]/15 text-[#8B2635] border border-[#D8C3A5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ALL EVENTS MANAGEMENT (ADMIN AUTHORITY) */}
      <div className="bg-[#FFFCF5] rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#D8C3A5] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#5A1E2D]" />
              <h2 className="text-base sm:text-lg font-bold text-[#2B211D]">
                Campus Events Oversight
              </h2>
            </div>
            <p className="text-xs text-[#857568]">
              Inspect, modify, or safely cancel/delete any campus event across organizers and departments.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingEvent(null);
              setEventModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#5A1E2D] hover:bg-[#742A3D] text-[#FFF8E7] text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#857568] absolute left-3.5 top-3" />
            <input
              type="text"
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              placeholder="Filter events by title, code, or college..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] placeholder-[#857568]/60 focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF8E7] text-[#857568] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5 rounded-l-xl">Event Title</th>
                <th className="py-3 px-3.5">College</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Capacity</th>
                <th className="py-3 px-3.5 rounded-r-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8C3A5]/60">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-[#857568]">
                    {loadingEvents ? 'Loading events...' : 'No events found.'}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const evId = ev._id || ev.id || '';
                  return (
                    <tr key={evId} className="hover:bg-[#FFF8E7]/60 transition-colors">
                      <td className="py-3.5 px-3.5 font-bold text-[#2B211D]">
                        <div>{ev.title}</div>
                        <div className="text-[10px] text-[#857568] font-mono">{ev.eventCode}</div>
                      </td>
                      <td className="py-3.5 px-3.5 text-[#857568]">{ev.collegeName || '—'}</td>
                      <td className="py-3.5 px-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FFF8E7] text-[#5A1E2D] border border-[#D8C3A5]">
                          {ev.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3.5 font-mono text-[#2B211D]">
                        {ev.registeredCount} / {ev.capacity}
                      </td>
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingEvent(ev);
                              setEventModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#FFF8E7] hover:bg-[#D8C3A5]/40 text-[#2B211D] border border-[#D8C3A5] font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev)}
                            className="px-2.5 py-1 rounded-lg bg-[#FFF8E7] hover:bg-[#8B2635]/15 text-[#8B2635] border border-[#D8C3A5] font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Cancel / Delete
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
      </div>

      {/* GLOBAL BULLETIN DISPATCH */}
      <div className="bg-[#FFFCF5] rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="border-b border-[#D8C3A5] pb-4">
          <h2 className="text-base sm:text-lg font-bold text-[#2B211D]">Dispatch Campus Bulletin</h2>
          <p className="text-xs text-[#857568]">Broadcast official notices and guidelines to all students and faculty</p>
        </div>

        <form onSubmit={handleDispatchAnnouncement} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-[#2B211D]">Bulletin Title</label>
              <input
                type="text"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="e.g. Campus Festival Registration Guidelines"
                className="w-full px-3.5 py-2.5 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2B211D]">Priority Level</label>
              <select
                value={annPriority}
                onChange={(e) => setAnnPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D] cursor-pointer"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#2B211D]">Message Body</label>
            <textarea
              rows={3}
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              placeholder="Detail collegiate instructions, venue access rules, or schedules..."
              className="w-full px-3.5 py-2.5 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D] resize-none"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={annLoading}
              className="px-5 py-2.5 rounded-xl bg-[#5A1E2D] hover:bg-[#742A3D] text-[#FFF8E7] text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{annLoading ? 'Dispatching...' : 'Broadcast Bulletin'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* AUDIT LOG UI (ADMIN ONLY) */}
      <div className="bg-[#FFFCF5] rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#D8C3A5] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#5A1E2D]" />
              <h2 className="text-base sm:text-lg font-bold text-[#2B211D]">Security & Audit Trail</h2>
            </div>
            <p className="text-xs text-[#857568] mt-0.5">
              Immutable institutional logging for authentication, state modifications, scoring, and certificates.
            </p>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#857568]" />
            <select
              value={auditActionFilter}
              onChange={(e) => {
                setAuditActionFilter(e.target.value);
                setAuditPage(1);
                fetchAuditLogs(1, e.target.value);
              }}
              className="px-3 py-1.5 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-1 focus:ring-[#5A1E2D] cursor-pointer"
            >
              <option value="">All Audit Actions</option>
              <option value="USER_LOGIN">User Login</option>
              <option value="USER_ROLE_UPDATED">Role Updated</option>
              <option value="EVENT_CREATED">Event Created</option>
              <option value="SCHEDULE_CREATED">Schedule Created</option>
              <option value="VOLUNTEER_ASSIGNED">Volunteer Assigned</option>
              <option value="JUDGE_ASSIGNED">Judge Assigned</option>
              <option value="EVALUATION_SUBMITTED">Evaluation Submitted</option>
              <option value="CERTIFICATE_ISSUED">Certificate Issued</option>
            </select>

            <button
              onClick={() => fetchAuditLogs(auditPage, auditActionFilter)}
              disabled={loadingAudit}
              className="p-1.5 rounded-xl bg-[#FFF8E7] hover:bg-[#D8C3A5]/40 border border-[#D8C3A5] text-[#857568] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin text-[#5A1E2D]' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF8E7] text-[#857568] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5 rounded-l-xl">Timestamp</th>
                <th className="py-3 px-3.5">Action</th>
                <th className="py-3 px-3.5">Actor</th>
                <th className="py-3 px-3.5">Resource</th>
                <th className="py-3 px-3.5 rounded-r-xl text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8C3A5]/60">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#857568] text-xs">
                    {loadingAudit ? 'Loading security audit trail...' : 'No audit entries match filter.'}
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const actorName =
                    typeof log.actorId === 'object' && log.actorId?.name
                      ? log.actorId.name
                      : log.actorRole || 'System';
                  return (
                    <tr key={log._id || log.id} className="hover:bg-[#FFF8E7]/60 transition-colors">
                      <td className="py-3 px-3.5 text-[#857568] font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-[#2B211D]">
                        <span className="font-medium">{actorName}</span>
                        {log.actorRole && (
                          <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] bg-[#FFF8E7] text-[#857568] border border-[#D8C3A5]">
                            {log.actorRole}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-[#857568] font-mono text-[11px]">
                        {log.resourceType
                          ? `${log.resourceType}${log.resourceId ? `:${log.resourceId.substring(0, 8)}` : ''}`
                          : '-'}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            log.success
                              ? 'bg-[#3D6A4E]/10 text-[#3D6A4E] border-[#3D6A4E]/20'
                              : 'bg-[#8B2635]/10 text-[#8B2635] border-[#8B2635]/20'
                          }`}
                        >
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Audit Pagination */}
        {auditPagination && auditPagination.totalPages > 1 && (
          <div className="pt-3 border-t border-[#D8C3A5] flex items-center justify-between text-xs text-[#857568]">
            <span>
              Page {auditPagination.page} of {auditPagination.totalPages} ({auditPagination.total} total logs)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={auditPage <= 1 || loadingAudit}
                onClick={() => {
                  const p = auditPage - 1;
                  setAuditPage(p);
                  fetchAuditLogs(p, auditActionFilter);
                }}
                className="px-3 py-1.5 rounded-xl border border-[#D8C3A5] bg-[#FFF8E7] hover:bg-[#D8C3A5]/30 disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={auditPage >= auditPagination.totalPages || loadingAudit}
                onClick={() => {
                  const p = auditPage + 1;
                  setAuditPage(p);
                  fetchAuditLogs(p, auditActionFilter);
                }}
                className="px-3 py-1.5 rounded-xl border border-[#D8C3A5] bg-[#FFF8E7] hover:bg-[#D8C3A5]/30 disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {createUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFCF5] rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D8C3A5] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#5A1E2D]" />
                <h3 className="text-lg font-bold text-[#2B211D]">Create Account</h3>
              </div>
              <button
                onClick={() => setCreateUserModalOpen(false)}
                className="p-1 rounded-lg text-[#857568] hover:text-[#2B211D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#2B211D] mb-1">
                  Full Name <span className="text-[#5A1E2D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Dr. Priya Sharma"
                  className="w-full px-3.5 py-2 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2B211D] mb-1">
                    Email Address <span className="text-[#5A1E2D]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="priya@campuspulse.edu"
                    className="w-full px-3.5 py-2 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B211D] mb-1">
                    Login ID / Username <span className="text-[#857568]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newUserLoginId}
                    onChange={(e) => setNewUserLoginId(e.target.value)}
                    placeholder="e.g. organizer2"
                    className="w-full px-3.5 py-2 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2B211D] mb-1">
                    Role <span className="text-[#5A1E2D]">*</span>
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D] cursor-pointer"
                  >
                    <option value="Student">Student</option>
                    <option value="Organizer">Organizer</option>
                    <option value="Judge">Judge</option>
                    <option value="Volunteer">Volunteer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B211D] mb-1">
                    Password (min 8 chars) <span className="text-[#5A1E2D]">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B211D] mb-1">
                  College / Institution Name
                </label>
                <input
                  type="text"
                  value={newUserCollege}
                  onChange={(e) => setNewUserCollege(e.target.value)}
                  placeholder="e.g. CampusPulse Institute of Technology"
                  className="w-full px-3.5 py-2 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B211D] mb-1">
                  Phone Number (India, Optional)
                </label>
                <input
                  type="tel"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-3.5 py-2 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D8C3A5]">
                <button
                  type="button"
                  onClick={() => setCreateUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#857568] hover:text-[#2B211D] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserLoading}
                  className="px-5 py-2 rounded-xl bg-[#5A1E2D] hover:bg-[#742A3D] text-[#FFF8E7] text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {createUserLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFCF5] rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D8C3A5] pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#5A1E2D]" />
                <h3 className="text-lg font-bold text-[#2B211D]">Edit User Profile</h3>
              </div>
              <button
                onClick={() => setEditUserModalOpen(false)}
                className="p-1 rounded-lg text-[#857568] hover:text-[#2B211D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#2B211D] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B211D] mb-1">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D] cursor-pointer"
                >
                  <option value="Student">Student</option>
                  <option value="Organizer">Organizer</option>
                  <option value="Judge">Judge</option>
                  <option value="Volunteer">Volunteer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B211D] mb-1">
                  Account Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D] cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B211D] mb-1">
                  College / Institution
                </label>
                <input
                  type="text"
                  value={editCollege}
                  onChange={(e) => setEditCollege(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B211D] mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-3.5 py-2 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D8C3A5]">
                <button
                  type="button"
                  onClick={() => setEditUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#857568] hover:text-[#2B211D] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editUserLoading}
                  className="px-5 py-2 rounded-xl bg-[#5A1E2D] hover:bg-[#742A3D] text-[#FFF8E7] text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {editUserLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT FORM MODAL (ADMIN) */}
      <EventFormModal
        event={editingEvent}
        isOpen={eventModalOpen}
        categories={categories}
        venues={venues}
        onClose={() => setEventModalOpen(false)}
        onSuccess={() => {
          setEventModalOpen(false);
          fetchEvents();
          setNotification(editingEvent ? 'Event updated successfully.' : 'New event created successfully.');
          setTimeout(() => setNotification(null), 3500);
        }}
      />
    </div>
  );
};
