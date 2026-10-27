import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Clock, MapPin, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '../../api/client.js';

interface VolunteerAssignment {
  _id?: string;
  id?: string;
  eventId: string;
  userId: any;
  assignedRole: string;
  shiftStart?: string;
  shiftEnd?: string;
  location?: string;
  isCheckedIn?: boolean;
  checkedInAt?: string;
  notes?: string;
  status: string;
}

interface VolunteerManagementModalProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const VolunteerManagementModal: React.FC<VolunteerManagementModalProps> = ({
  eventId,
  eventTitle,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [volunteers, setVolunteers] = useState<VolunteerAssignment[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment form state
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignedRole, setAssignedRole] = useState('Registration Desk & Attendee Check-in');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await apiClient<{ volunteers: VolunteerAssignment[] }>(`/api/events/${eventId}/volunteers`);
    if (res.success && res.data) {
      setVolunteers(res.data.volunteers);
    }

    const userRes = await apiClient<{ users: any[] }>('/api/users');
    if (userRes.success && userRes.data) {
      const volUsers = userRes.data.users.filter((u) => u.role === 'Volunteer');
      setAvailableUsers(volUsers);
      if (volUsers.length > 0 && !selectedUserId) {
        setSelectedUserId(volUsers[0].id || volUsers[0]._id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedUserId) {
      setErrorMessage('Please select a volunteer user');
      return;
    }

    setFormLoading(true);
    const res = await apiClient(`/api/events/${eventId}/volunteers`, {
      method: 'POST',
      body: JSON.stringify({
        userId: selectedUserId,
        assignedRole: assignedRole.trim(),
        shiftStart: shiftStart ? new Date(shiftStart).toISOString() : undefined,
        shiftEnd: shiftEnd ? new Date(shiftEnd).toISOString() : undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    });
    setFormLoading(false);

    if (res.success) {
      setSuccessMessage('Volunteer assigned successfully');
      setShowAssignForm(false);
      fetchData();
      setTimeout(() => setSuccessMessage(null), 3500);
    } else {
      setErrorMessage(res.error?.message || 'Assignment failed');
    }
  };

  const handleRemove = async (assignmentId: string) => {
    if (!window.confirm('Remove this volunteer assignment?')) return;
    const res = await apiClient(`/api/volunteers/${assignmentId}`, { method: 'DELETE' });
    if (res.success) {
      fetchData();
    } else {
      alert(res.error?.message || 'Failed to remove assignment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-6 sm:p-8 shadow-2xl text-[#2B211C] space-y-5"
      >
        <div className="flex justify-between items-start border-b border-[#E6D8C3] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#C6A15B]" />
              <h3 className="text-base sm:text-lg font-bold text-[#1F1713]">Volunteer Duty Operations</h3>
            </div>
            <p className="text-xs text-[#786B61] mt-0.5">
              Event: <span className="font-semibold text-[#1F1713]">{eventTitle}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!showAssignForm && (
              <button
                onClick={() => setShowAssignForm(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Assign Volunteer</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#FBF7EF] text-[#786B61] hover:text-[#1F1713] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-[#71866F]/10 border border-[#71866F]/30 text-[#71866F] text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#71866F]" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-[#A9675D]/10 border border-[#A9675D]/30 text-[#A9675D] text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-[#A9675D]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Drawer */}
        {showAssignForm && (
          <form onSubmit={handleAssignSubmit} className="p-5 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] space-y-3.5 text-xs animate-in fade-in">
            <div className="font-bold text-sm text-[#1F1713]">New Volunteer Duty Assignment</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-[#2B211C]">Select Volunteer Profile <span className="text-[#C6A15B]">*</span></label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B] cursor-pointer"
                  required
                >
                  {availableUsers.map((u) => (
                    <option key={u.id || u._id} value={u.id || u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#2B211C]">Assigned Duty Description</label>
                <input
                  type="text"
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value)}
                  placeholder="e.g. Stage Usher & Mic Support"
                  className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-[#2B211C]">Shift Start</label>
                <input
                  type="datetime-local"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#2B211C]">Shift End</label>
                <input
                  type="datetime-local"
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#2B211C]">Station / Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Gate 2 Helpdesk"
                  className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E6D8C3]">
              <button
                type="button"
                onClick={() => setShowAssignForm(false)}
                className="px-3.5 py-1.5 rounded-xl bg-[#FBF7EF] hover:bg-[#F7F0E3] border border-[#E6D8C3] font-semibold text-[#786B61] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-4 py-1.5 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                {formLoading ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </form>
        )}

        {/* Volunteers Table */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#786B61] space-y-2">
            <div className="w-6 h-6 border-2 border-[#E6D8C3] border-t-[#C6A15B] rounded-full animate-spin mx-auto"></div>
            <div>Loading volunteer roster...</div>
          </div>
        ) : volunteers.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] space-y-2 p-6">
            <Users className="w-8 h-8 text-[#E6D8C3] mx-auto" />
            <h4 className="text-sm font-bold text-[#1F1713]">No volunteers assigned yet</h4>
            <p className="text-xs text-[#786B61]">
              Assign student council volunteers to manage registration desks and crowd assistance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBF7EF] text-[#786B61] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-xl">Volunteer</th>
                  <th className="py-2.5 px-3">Duty Role</th>
                  <th className="py-2.5 px-3">Station</th>
                  <th className="py-2.5 px-3">Check-In Status</th>
                  <th className="py-2.5 px-3 rounded-r-xl text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6D8C3]">
                {volunteers.map((v) => {
                  const volUser = typeof v.userId === 'object' ? v.userId : null;
                  const vId = v._id || v.id || '';

                  return (
                    <tr key={vId} className="hover:bg-[#FBF7EF]/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#1F1713]">{volUser?.name || 'Volunteer'}</div>
                        <div className="text-[10px] text-[#786B61]">{volUser?.email || ''}</div>
                      </td>
                      <td className="py-3 px-3 text-[#2B211C]">{v.assignedRole}</td>
                      <td className="py-3 px-3 text-[#786B61]">{v.location || 'General Venue'}</td>
                      <td className="py-3 px-3">
                        {v.isCheckedIn ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#71866F]/10 text-[#71866F] border border-[#71866F]/20">
                            Checked In
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3]">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleRemove(vId)}
                          className="p-1.5 rounded-lg hover:bg-[#A9675D]/10 text-[#A9675D] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
