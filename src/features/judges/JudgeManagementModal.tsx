import React, { useState, useEffect } from 'react';
import { X, Award, UserPlus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api/client.js';

interface JudgeAssignment {
  _id?: string;
  id?: string;
  eventId: string;
  userId: any;
  roleDescription?: string;
  assignedAt: string;
  isFinalized: boolean;
}

interface JudgeManagementModalProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const JudgeManagementModal: React.FC<JudgeManagementModalProps> = ({
  eventId,
  eventTitle,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [judges, setJudges] = useState<JudgeAssignment[]>([]);
  const [availableJudges, setAvailableJudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [roleDescription, setRoleDescription] = useState('Lead Technical Evaluator');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await apiClient<{ judges: JudgeAssignment[] }>(`/api/events/${eventId}/judges`);
    if (res.success && res.data) {
      setJudges(res.data.judges);
    }

    const userRes = await apiClient<{ users: any[] }>('/api/users');
    if (userRes.success && userRes.data) {
      const jUsers = userRes.data.users.filter((u) => u.role === 'Judge');
      setAvailableJudges(jUsers);
      if (jUsers.length > 0 && !selectedUserId) {
        setSelectedUserId(jUsers[0].id || jUsers[0]._id);
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
      setErrorMessage('Please select a judge');
      return;
    }

    setFormLoading(true);
    const res = await apiClient(`/api/events/${eventId}/judges`, {
      method: 'POST',
      body: JSON.stringify({
        userId: selectedUserId,
        roleDescription: roleDescription.trim() || undefined,
      }),
    });
    setFormLoading(false);

    if (res.success) {
      setSuccessMessage('Judge assigned to event evaluation panel');
      setShowAssignForm(false);
      fetchData();
      setTimeout(() => setSuccessMessage(null), 3500);
    } else {
      setErrorMessage(res.error?.message || 'Assignment failed');
    }
  };

  const handleRemove = async (assignmentId: string) => {
    if (!window.confirm('Remove this judge from the evaluation panel?')) return;
    const res = await apiClient(`/api/judges/${assignmentId}`, { method: 'DELETE' });
    if (res.success) {
      fetchData();
    } else {
      alert(res.error?.message || 'Failed to remove judge');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-6 sm:p-8 shadow-2xl text-[#2B211C] space-y-5"
      >
        <div className="flex justify-between items-start border-b border-[#E6D8C3] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#C6A15B]" />
              <h3 className="text-base sm:text-lg font-bold text-[#1F1713]">Judge Evaluation Panel</h3>
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
                <span>Assign Judge</span>
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

        {/* Assign Form */}
        {showAssignForm && (
          <form onSubmit={handleAssignSubmit} className="p-5 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] space-y-3.5 text-xs animate-in fade-in">
            <div className="font-bold text-sm text-[#1F1713]">Assign Expert Evaluator to Panel</div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-[#2B211C]">Select Judge Profile <span className="text-[#C6A15B]">*</span></label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B] cursor-pointer"
                  required
                >
                  {availableJudges.map((j) => (
                    <option key={j.id || j._id} value={j.id || j._id}>
                      {j.name} ({j.email}) — {j.profileInfo?.department || 'Faculty/Fellow'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#2B211C]">Role & Rubric Specialization</label>
                <input
                  type="text"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="e.g. AI System Architecture Evaluator"
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
                {formLoading ? 'Assigning...' : 'Confirm Judge'}
              </button>
            </div>
          </form>
        )}

        {/* Judges List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#786B61] space-y-2">
            <div className="w-6 h-6 border-2 border-[#E6D8C3] border-t-[#C6A15B] rounded-full animate-spin mx-auto"></div>
            <div>Loading evaluation panel...</div>
          </div>
        ) : judges.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] space-y-2 p-6">
            <Award className="w-8 h-8 text-[#E6D8C3] mx-auto" />
            <h4 className="text-sm font-bold text-[#1F1713]">No judges assigned yet</h4>
            <p className="text-xs text-[#786B61]">
              Add faculty or research fellows to score candidate submissions and review project rubrics.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBF7EF] text-[#786B61] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-xl">Judge</th>
                  <th className="py-2.5 px-3">Specialization</th>
                  <th className="py-2.5 px-3">Assigned Date</th>
                  <th className="py-2.5 px-3 rounded-r-xl text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6D8C3]">
                {judges.map((j) => {
                  const judgeUser = typeof j.userId === 'object' ? j.userId : null;
                  const jId = j._id || j.id || '';

                  return (
                    <tr key={jId} className="hover:bg-[#FBF7EF]/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#1F1713]">{judgeUser?.name || 'Judge Evaluator'}</div>
                        <div className="text-[10px] text-[#786B61]">{judgeUser?.email || ''}</div>
                      </td>
                      <td className="py-3 px-3 text-[#2B211C]">
                        {j.roleDescription || 'Panel Evaluator'}
                      </td>
                      <td className="py-3 px-3 text-[#786B61] font-mono text-[11px]">
                        {new Date(j.assignedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleRemove(jId)}
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
