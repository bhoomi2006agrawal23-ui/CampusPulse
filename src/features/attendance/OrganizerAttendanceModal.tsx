import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.js';
import { Users, CheckCircle2, Clock, AlertCircle, X, Check, XCircle } from 'lucide-react';

interface OrganizerAttendanceModalProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OrganizerAttendanceModal: React.FC<OrganizerAttendanceModalProps> = ({
  eventId,
  eventTitle,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    total: 0,
    attended: 0,
    absent: 0,
    excused: 0,
    unmarked: 0,
    attendancePercentage: 0,
  });
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient<{ summary: any; records: any[] }>(`/events/${eventId}/attendance`);
      if (res.success && res.data) {
        setRecords(res.data.records || []);
        setSummary(res.data.summary || {});
      } else {
        setError(res.error?.message || 'Failed to fetch attendance');
      }
    } catch {
      setError('Network error while loading attendance');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchAttendance();
    }
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  const handleUpdateStatus = async (registrationId: string, status: string) => {
    setUpdatingId(registrationId);
    setError(null);

    try {
      const res = await apiClient(`/events/${eventId}/attendance/${registrationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      if (res.success) {
        setNotification(`Marked as ${status}`);
        fetchAttendance();
        if (onSuccess) onSuccess();
        setTimeout(() => setNotification(null), 2500);
      } else {
        setError(res.error?.message || 'Failed to update attendance');
      }
    } catch {
      setError('Network error updating status');
    }
    setUpdatingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-[#FFFDF8] border border-[#E6D8C3] rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] flex flex-col text-[#2B211C]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E6D8C3] shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#71866F]/10 text-[#71866F] text-xs font-semibold border border-[#71866F]/20">
              <Users className="w-3.5 h-3.5 text-[#71866F]" />
              <span>Turnout & Attendance Roster</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F1713] mt-1">{eventTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#FBF7EF] text-[#786B61] hover:text-[#1F1713] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {notification && (
          <div className="mt-3 p-3 bg-[#71866F]/10 border border-[#71866F]/30 text-[#71866F] text-xs rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#71866F]" />
            <span>{notification}</span>
          </div>
        )}
        {error && (
          <div className="mt-3 p-3 bg-[#A9675D]/10 border border-[#A9675D]/30 text-[#A9675D] text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-[#A9675D]" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-4 shrink-0">
          <div className="p-3 bg-[#FBF7EF] rounded-2xl border border-[#E6D8C3]">
            <div className="text-[10px] uppercase font-bold text-[#786B61]">Total Passes</div>
            <div className="text-lg font-bold text-[#1F1713]">{summary.total}</div>
          </div>
          <div className="p-3 bg-[#71866F]/10 rounded-2xl border border-[#71866F]/20">
            <div className="text-[10px] uppercase font-bold text-[#71866F]">Attended</div>
            <div className="text-lg font-bold text-[#71866F]">
              {summary.attended} ({summary.attendancePercentage}%)
            </div>
          </div>
          <div className="p-3 bg-[#A9675D]/10 rounded-2xl border border-[#A9675D]/20">
            <div className="text-[10px] uppercase font-bold text-[#A9675D]">Absent</div>
            <div className="text-lg font-bold text-[#A9675D]">{summary.absent}</div>
          </div>
          <div className="p-3 bg-[#FBF7EF] rounded-2xl border border-[#E6D8C3]">
            <div className="text-[10px] uppercase font-bold text-[#B58A3A]">Excused</div>
            <div className="text-lg font-bold text-[#B58A3A]">{summary.excused}</div>
          </div>
          <div className="p-3 bg-[#FBF7EF] rounded-2xl border border-[#E6D8C3]">
            <div className="text-[10px] uppercase font-bold text-[#786B61]">Unmarked</div>
            <div className="text-lg font-bold text-[#786B61]">{summary.unmarked}</div>
          </div>
        </div>

        {/* Attendance Percentage Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[#786B61] mb-1 font-medium">
            <span>Overall Turnout Rate</span>
            <span>{summary.attendancePercentage}%</span>
          </div>
          <div className="w-full h-2 bg-[#FBF7EF] rounded-full overflow-hidden border border-[#E6D8C3]">
            <div
              className="h-full bg-[#71866F] transition-all duration-500 rounded-full"
              style={{ width: `${summary.attendancePercentage}%` }}
            />
          </div>
        </div>

        {/* Attendance Roster Table */}
        <div className="overflow-y-auto flex-1 border border-[#E6D8C3] rounded-2xl bg-[#FFFDF8]">
          {records.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#786B61]">
              No confirmed student registrations found for this event.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBF7EF] text-[#786B61] text-[10px] uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Student Participant</th>
                  <th className="py-2.5 px-3">Ticket Pass</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Quick Mark Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6D8C3]">
                {records.map((r) => {
                  const student = typeof r.studentId === 'object' ? r.studentId : null;
                  const sName = student?.name || 'Student';
                  const sEmail = student?.email || '';
                  const sDept = student?.profileInfo?.department || '';
                  const rId = r._id || r.id;

                  return (
                    <tr key={rId} className="hover:bg-[#FBF7EF]/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#1F1713]">{sName}</div>
                        <div className="text-[10px] text-[#786B61]">
                          {sEmail} {sDept ? `• ${sDept}` : ''}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-[#B58A3A]">
                        {r.registrationCode}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.attendanceStatus === 'Attended'
                              ? 'bg-[#71866F]/10 text-[#71866F] border border-[#71866F]/20'
                              : r.attendanceStatus === 'Absent'
                              ? 'bg-[#A9675D]/10 text-[#A9675D] border border-[#A9675D]/20'
                              : r.attendanceStatus === 'Excused'
                              ? 'bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3]'
                              : 'bg-[#FBF7EF] text-[#786B61] border border-[#E6D8C3]'
                          }`}
                        >
                          {r.attendanceStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            disabled={updatingId === rId}
                            onClick={() => handleUpdateStatus(rId, 'Attended')}
                            className="px-2 py-1 rounded-lg bg-[#71866F]/10 hover:bg-[#71866F]/20 text-[#71866F] text-[10px] font-semibold border border-[#71866F]/20 transition-colors cursor-pointer"
                            title="Mark Attended"
                          >
                            Attended
                          </button>
                          <button
                            disabled={updatingId === rId}
                            onClick={() => handleUpdateStatus(rId, 'Absent')}
                            className="px-2 py-1 rounded-lg bg-[#A9675D]/10 hover:bg-[#A9675D]/20 text-[#A9675D] text-[10px] font-semibold border border-[#A9675D]/20 transition-colors cursor-pointer"
                            title="Mark Absent"
                          >
                            Absent
                          </button>
                          <button
                            disabled={updatingId === rId}
                            onClick={() => handleUpdateStatus(rId, 'Excused')}
                            className="px-2 py-1 rounded-lg bg-[#FBF7EF] hover:bg-[#F7F0E3] text-[#B58A3A] text-[10px] font-semibold border border-[#E6D8C3] transition-colors cursor-pointer"
                            title="Mark Excused"
                          >
                            Excused
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E6D8C3] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#FBF7EF] hover:bg-[#F7F0E3] text-xs font-semibold text-[#786B61] rounded-xl border border-[#E6D8C3] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
