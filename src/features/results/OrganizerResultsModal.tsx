import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle2, AlertCircle, X, Lock, Share2 } from 'lucide-react';
import { apiClient } from '../../api/client.js';

interface ResultItem {
  _id?: string;
  id?: string;
  participantId: any;
  score: number;
  rank?: number;
  awardTitle?: string;
  feedback?: string;
  isPublished?: boolean;
  isFinalized?: boolean;
}

interface OrganizerResultsModalProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OrganizerResultsModal: React.FC<OrganizerResultsModalProps> = ({
  eventId,
  eventTitle,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states for adding/updating a score
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [score, setScore] = useState<number>(85);
  const [awardTitle, setAwardTitle] = useState('');
  const [feedback, setFeedback] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resResults, resParts] = await Promise.all([
        apiClient<{ results: ResultItem[] }>(`/api/events/${eventId}/results`),
        apiClient<{ participants: any[] }>(`/api/events/${eventId}/registrations`),
      ]);

      if (resResults.success && resResults.data) {
        setResults(resResults.data.results || []);
      }
      if (resParts.success && resParts.data) {
        setParticipants(resParts.data.participants || []);
      }
    } catch {
      setError('Failed to load event scorecards');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    setActionLoading(true);
    setError(null);
    try {
      const res = await apiClient(`/api/events/${eventId}/results`, {
        method: 'POST',
        body: JSON.stringify({
          participantId: selectedStudentId,
          score,
          awardTitle: awardTitle.trim() || undefined,
          feedback: feedback.trim() || undefined,
        }),
      });

      if (res.success) {
        setNotification('Score registered successfully!');
        setSelectedStudentId('');
        setAwardTitle('');
        setFeedback('');
        fetchData();
        if (onSuccess) onSuccess();
        setTimeout(() => setNotification(null), 3000);
      } else {
        setError(res.error?.message || 'Failed to record participant score');
      }
    } catch {
      setError('Error while saving score');
    }
    setActionLoading(false);
  };

  const handleFinalize = async () => {
    if (!window.confirm('Finalize rankings for this competition? Scores will be locked.')) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await apiClient(`/api/events/${eventId}/results/finalize`, {
        method: 'PATCH',
      });

      if (res.success) {
        setNotification('Rankings finalized based on current scores!');
        fetchData();
        if (onSuccess) onSuccess();
        setTimeout(() => setNotification(null), 3000);
      } else {
        setError(res.error?.message || 'Failed to finalize rankings');
      }
    } catch {
      setError('Error while finalizing ranks');
    }
    setActionLoading(false);
  };

  const handlePublish = async () => {
    if (!window.confirm('Publish results to student scoreboards and generate certificates?')) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await apiClient(`/api/events/${eventId}/results/publish`, {
        method: 'PATCH',
      });

      if (res.success) {
        setNotification('Results successfully published to participants!');
        fetchData();
        if (onSuccess) onSuccess();
        setTimeout(() => setNotification(null), 3000);
      } else {
        setError(res.error?.message || 'Failed to publish results');
      }
    } catch {
      setError('Error while publishing results');
    }
    setActionLoading(false);
  };

  const isPublished = results.some((r) => r.isPublished);
  const isFinalized = results.some((r) => r.isFinalized);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-[#FFFDF8] border border-[#E6D8C3] rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] flex flex-col text-[#2B211C]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E6D8C3] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FBF7EF] text-[#B58A3A] text-xs font-semibold border border-[#E6D8C3] flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-[#C6A15B]" /> Event Standings Desk
              </span>
              {isPublished ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[#71866F]/10 text-[#71866F] text-[10px] font-bold border border-[#71866F]/30">
                  PUBLISHED
                </span>
              ) : isFinalized ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[#FBF7EF] text-[#B58A3A] text-[10px] font-bold border border-[#E6D8C3]">
                  FINALIZED
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-[#FBF7EF] text-[#786B61] text-[10px] font-bold border border-[#E6D8C3]">
                  DRAFT SCORING
                </span>
              )}
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

        {/* Notifications & Error Alerts */}
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

        <div className="overflow-y-auto space-y-6 py-4 flex-1">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#FBF7EF] rounded-2xl border border-[#E6D8C3]">
            <div className="text-xs text-[#786B61]">
              <span className="font-bold text-[#1F1713]">{results.length}</span> of{' '}
              <span className="font-bold text-[#1F1713]">{participants.length}</span> participants scored
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFinalize}
                disabled={actionLoading || results.length === 0}
                className="px-3.5 py-1.5 bg-[#FFFDF8] hover:bg-[#FBF7EF] disabled:opacity-50 text-xs font-semibold text-[#1F1713] border border-[#E6D8C3] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Lock className="w-3.5 h-3.5 text-[#B58A3A]" /> Finalize Ranks
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={actionLoading || results.length === 0}
                className="px-4 py-1.5 bg-[#C6A15B] hover:bg-[#B58A3A] disabled:opacity-50 text-xs font-semibold text-[#FFFDF8] rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" /> Publish Results
              </button>
            </div>
          </div>

          {/* Form: Evaluate / Record Score */}
          <form onSubmit={handleSaveResult} className="p-5 bg-[#FBF7EF] rounded-2xl border border-[#E6D8C3] space-y-3.5">
            <div className="font-bold text-xs uppercase tracking-wider text-[#786B61]">
              Record / Update Participant Score
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-[#786B61] mb-1">Select Participant</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 cursor-pointer"
                  required
                >
                  <option value="">-- Choose confirmed student --</option>
                  {participants.map((reg) => {
                    const student = typeof reg.studentId === 'object' ? reg.studentId : null;
                    const sId = student?._id || student?.id || reg.studentId;
                    const sName = student?.name || 'Student';
                    const sEmail = student?.email || '';
                    return (
                      <option key={sId} value={sId}>
                        {sName} ({sEmail})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#786B61] mb-1">Score (0 - 1000)</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] font-mono focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#786B61] mb-1">Award Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Grand Prize Winner / 1st Place"
                  value={awardTitle}
                  onChange={(e) => setAwardTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#786B61] mb-1">Evaluator Feedback (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Exceptional architectural modularity"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={actionLoading || !selectedStudentId}
                className="px-4 py-2 bg-[#C6A15B] hover:bg-[#B58A3A] disabled:opacity-50 text-[#FFFDF8] text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                {actionLoading ? 'Saving...' : 'Save Evaluation Score'}
              </button>
            </div>
          </form>

          {/* Current Leaderboard / Standings */}
          <div className="space-y-2">
            <div className="font-bold text-xs text-[#1F1713] uppercase tracking-wider">
              Evaluations Roster ({results.length})
            </div>

            {results.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#786B61] bg-[#FBF7EF] rounded-2xl border border-[#E6D8C3]">
                No evaluations recorded yet. Use the form above to score participants.
              </div>
            ) : (
              <div className="divide-y divide-[#E6D8C3] border border-[#E6D8C3] rounded-2xl overflow-hidden bg-[#FFFDF8]">
                {results.map((r, idx) => {
                  const student = typeof r.participantId === 'object' ? r.participantId : null;
                  const sName = student?.name || 'Participant';
                  const sEmail = student?.email || '';

                  return (
                    <div key={r._id || r.id || idx} className="p-3.5 px-4 flex items-center justify-between gap-3 text-xs hover:bg-[#FBF7EF]/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-[#FBF7EF] text-[#B58A3A] font-bold flex items-center justify-center text-[11px] shrink-0 border border-[#E6D8C3]">
                          #{r.rank || idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-[#1F1713]">{sName}</div>
                          <div className="text-[10px] text-[#786B61]">{sEmail}</div>
                          {r.awardTitle && (
                            <div className="text-[10px] text-[#B58A3A] font-semibold mt-0.5">★ {r.awardTitle}</div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold font-mono text-sm text-[#1F1713]">{r.score} <span className="text-[10px] font-normal text-[#786B61]">pts</span></div>
                        <div className="text-[9px] text-[#786B61]">
                          {r.isPublished ? 'Published' : r.isFinalized ? 'Finalized' : 'Draft'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
