import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../api/client.js';
import {
  RefreshCw,
  ShieldAlert,
  AlertCircle,
  Filter,
  CheckCircle2,
  Send,
} from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface AdminDashboardProps {
  activeTab?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [, setLoadingUsers] = useState(false);
  const [, setLoadingMetrics] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const res = await apiClient<{ users: AdminUser[] }>('/api/users');
    if (res.success && res.data) {
      setUsers(res.data.users);
    }
    setLoadingUsers(false);
  };

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await apiClient<{ metrics: any }>('/reports/system-overview');
      if (res.success && res.data) {
        setMetrics(res.data.metrics);
      }
    } catch {
      // ignore
    }
    setLoadingMetrics(false);
  };

  useEffect(() => {
    fetchUsers();
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
    if (action.includes('LOGIN') || action.includes('AUTH')) return 'bg-[#71866F]/10 text-[#71866F] border-[#71866F]/20';
    if (action.includes('ROLE') || action.includes('ADMIN')) return 'bg-[#FBF7EF] text-[#B58A3A] border-[#E6D8C3]';
    if (action.includes('CREATE')) return 'bg-[#FBF7EF] text-[#C6A15B] border-[#E6D8C3]';
    return 'bg-[#FBF7EF] text-[#786B61] border-[#E6D8C3]';
  };

  return (
    <div className="space-y-8">
      {/* ADMIN EXECUTIVE HEADER */}
      <div className="bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#C6A15B]"></span>
            <span>Institutional Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1713]">
            Campus Command — {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#786B61] max-w-xl">
            Centralized institutional oversight. Manage user roles, broadcast campus bulletins, monitor aggregate operations, and audit system activities.
          </p>
        </div>

        <button
          onClick={() => {
            fetchUsers();
            fetchMetrics();
            fetchAuditLogs(auditPage, auditActionFilter);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#FBF7EF] hover:bg-[#F7F0E3] text-[#2B211C] border border-[#E6D8C3] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#C6A15B]" />
          <span>Refresh All Metrics</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-[#71866F]/10 border border-[#71866F]/30 text-[#71866F] text-xs flex items-center gap-2 font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#71866F]" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-[#A9675D]/10 border border-[#A9675D]/30 text-[#A9675D] text-xs flex items-center gap-2 font-semibold shadow-xs">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* TOP-LEVEL METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#786B61]">Total Users</div>
          <div className="text-xl sm:text-2xl font-bold text-[#1F1713]">{metrics?.users?.total ?? users.length}</div>
          <div className="text-[10px] text-[#71866F] font-medium">Verified accounts</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#786B61]">Active Events</div>
          <div className="text-xl sm:text-2xl font-bold text-[#1F1713]">{metrics?.events?.published ?? 0}</div>
          <div className="text-[10px] text-[#C6A15B] font-medium">Scheduled</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#786B61]">Registrations</div>
          <div className="text-xl sm:text-2xl font-bold text-[#1F1713]">{metrics?.registrations?.total ?? 0}</div>
          <div className="text-[10px] text-[#71866F] font-medium">Digital passes</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#786B61]">Attendance</div>
          <div className="text-xl sm:text-2xl font-bold text-[#1F1713]">{metrics?.attendance?.rate ?? '100%'}</div>
          <div className="text-[10px] text-[#71866F] font-medium">Presence rate</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#786B61]">Certificates</div>
          <div className="text-xl sm:text-2xl font-bold text-[#1F1713]">{metrics?.certificates?.total ?? 0}</div>
          <div className="text-[10px] text-[#B58A3A] font-medium">Issued credentials</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#786B61]">Bulletins</div>
          <div className="text-xl sm:text-2xl font-bold text-[#1F1713]">{metrics?.announcements?.total ?? 0}</div>
          <div className="text-[10px] text-[#786B61]">Broadcasted</div>
        </div>
      </div>

      {/* USER & ROLE MANAGEMENT */}
      <div className="bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#E6D8C3] pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F1713]">User & Role Matrix</h2>
            <p className="text-xs text-[#786B61]">Assign and audit institutional permissions across Student, Organizer, Judge, Volunteer, and Admin</p>
          </div>
          <span className="text-xs text-[#786B61] font-mono">{users.length} registered profiles</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FBF7EF] text-[#786B61] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5 rounded-l-xl">User Profile</th>
                <th className="py-3 px-3.5">Contact Email</th>
                <th className="py-3 px-3.5">Current Role</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 rounded-r-xl text-right">Role Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6D8C3]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#FBF7EF]/70 transition-colors">
                  <td className="py-3.5 px-3.5 font-semibold text-[#1F1713]">{u.name}</td>
                  <td className="py-3.5 px-3.5 text-[#786B61] font-mono">{u.email}</td>
                  <td className="py-3.5 px-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FBF7EF] text-[#2B211C] border border-[#E6D8C3]">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <span className="text-[#71866F] flex items-center gap-1 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#71866F]"></span>
                      Active
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 text-right">
                    <select
                      value={u.role}
                      disabled={updatingId === u.id || u.id === user?.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="px-3 py-1.5 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] font-semibold focus:outline-none focus:ring-1 focus:ring-[#C6A15B] disabled:opacity-50 cursor-pointer"
                    >
                      <option value="Student">Student</option>
                      <option value="Organizer">Organizer</option>
                      <option value="Judge">Judge</option>
                      <option value="Volunteer">Volunteer</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GLOBAL BULLETIN DISPATCH */}
      <div className="bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="border-b border-[#E6D8C3] pb-4">
          <h2 className="text-base sm:text-lg font-bold text-[#1F1713]">Dispatch Campus Bulletin</h2>
          <p className="text-xs text-[#786B61]">Broadcast official notices and guidelines to all students and faculty</p>
        </div>

        <form onSubmit={handleDispatchAnnouncement} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-[#2B211C]">Bulletin Title</label>
              <input
                type="text"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="e.g. Campus Festival Registration Guidelines"
                className="w-full px-3.5 py-2.5 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2B211C]">Priority Level</label>
              <select
                value={annPriority}
                onChange={(e) => setAnnPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B] cursor-pointer"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#2B211C]">Message Body</label>
            <textarea
              rows={3}
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              placeholder="Detail collegiate instructions, venue access rules, or schedules..."
              className="w-full px-3.5 py-2.5 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B] resize-none"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={annLoading}
              className="px-5 py-2.5 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{annLoading ? 'Dispatching...' : 'Broadcast Bulletin'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* AUDIT LOG UI (ADMIN ONLY) */}
      <div className="bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E6D8C3] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#C6A15B]" />
              <h2 className="text-base sm:text-lg font-bold text-[#1F1713]">Security & Audit Trail</h2>
            </div>
            <p className="text-xs text-[#786B61] mt-0.5">
              Immutable institutional logging for authentication, state modifications, scoring, and certificates.
            </p>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#786B61]" />
            <select
              value={auditActionFilter}
              onChange={(e) => {
                setAuditActionFilter(e.target.value);
                setAuditPage(1);
                fetchAuditLogs(1, e.target.value);
              }}
              className="px-3 py-1.5 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-1 focus:ring-[#C6A15B] cursor-pointer"
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
              className="p-1.5 rounded-xl bg-[#FBF7EF] hover:bg-[#F7F0E3] border border-[#E6D8C3] text-[#786B61] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin text-[#C6A15B]' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FBF7EF] text-[#786B61] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5 rounded-l-xl">Timestamp</th>
                <th className="py-3 px-3.5">Action</th>
                <th className="py-3 px-3.5">Actor</th>
                <th className="py-3 px-3.5">Resource</th>
                <th className="py-3 px-3.5 rounded-r-xl text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6D8C3]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#786B61] text-xs">
                    {loadingAudit ? 'Loading security audit trail...' : 'No audit entries match filter.'}
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const actorName = typeof log.actorId === 'object' && log.actorId?.name ? log.actorId.name : log.actorRole || 'System';
                  return (
                    <tr key={log._id || log.id} className="hover:bg-[#FBF7EF]/70 transition-colors">
                      <td className="py-3 px-3.5 text-[#786B61] font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-[#2B211C]">
                        <span className="font-medium">{actorName}</span>
                        {log.actorRole && (
                          <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] bg-[#FBF7EF] text-[#786B61] border border-[#E6D8C3]">
                            {log.actorRole}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-[#786B61] font-mono text-[11px]">
                        {log.resourceType ? `${log.resourceType}${log.resourceId ? `:${log.resourceId.substring(0, 8)}` : ''}` : '-'}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          log.success
                            ? 'bg-[#71866F]/10 text-[#71866F] border-[#71866F]/20'
                            : 'bg-[#A9675D]/10 text-[#A9675D] border-[#A9675D]/20'
                        }`}>
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
          <div className="pt-3 border-t border-[#E6D8C3] flex items-center justify-between text-xs text-[#786B61]">
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
                className="px-3 py-1.5 rounded-xl border border-[#E6D8C3] bg-[#FBF7EF] hover:bg-[#F7F0E3] disabled:opacity-50 cursor-pointer"
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
                className="px-3 py-1.5 rounded-xl border border-[#E6D8C3] bg-[#FBF7EF] hover:bg-[#F7F0E3] disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
