import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../api/client.js';
import { JudgeScoringModal } from '../judges/JudgeScoringModal.js';
import {
  Award,
  CheckCircle2,
  Star,
  FileCheck,
  ChevronRight,
  Users,
} from 'lucide-react';

interface JudgeDashboardProps {
  activeTab?: string;
}

export const JudgeDashboard: React.FC<JudgeDashboardProps> = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  // Scoring Modal state
  const [scoringModalOpen, setScoringModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
  const [selectedExistingResult, setSelectedExistingResult] = useState<any | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    const res = await apiClient<{ assignments: any[] }>('/api/judges/me');
    if (res.success && res.data) {
      setAssignments(res.data.assignments);
      if (res.data.assignments.length > 0 && !selectedEventId) {
        const firstEv = res.data.assignments[0].eventId;
        const firstEvId = typeof firstEv === 'object' ? firstEv._id || firstEv.id : firstEv;
        setSelectedEventId(firstEvId);
      }
    }
    setLoading(false);
  };

  const fetchParticipantsAndEvaluations = async (eventId: string) => {
    setParticipantsLoading(true);
    const partRes = await apiClient<{ participants: any[] }>(`/api/events/${eventId}/judge-participants`);
    if (partRes.success && partRes.data) {
      setParticipants(partRes.data.participants);
    }

    const evalRes = await apiClient<{ evaluations: any[] }>(`/api/events/${eventId}/evaluations`);
    if (evalRes.success && evalRes.data) {
      setEvaluations(evalRes.data.evaluations);
    }
    setParticipantsLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchParticipantsAndEvaluations(selectedEventId);
    }
  }, [selectedEventId]);

  const handleOpenScoreModal = (participant: any) => {
    const student = typeof participant.studentId === 'object' ? participant.studentId : participant;
    const studentId = student?._id || student?.id || participant.studentId;

    const existing = evaluations.find((ev) => {
      const pId = typeof ev.participantId === 'object' ? ev.participantId._id || ev.participantId.id : ev.participantId;
      return pId === studentId;
    });

    setSelectedParticipant(participant);
    setSelectedExistingResult(existing || null);
    setScoringModalOpen(true);
  };

  const handleScoreSuccess = () => {
    setScoringModalOpen(false);
    setNotification('Evaluation score recorded successfully');
    if (selectedEventId) {
      fetchParticipantsAndEvaluations(selectedEventId);
    }
    setTimeout(() => setNotification(null), 3500);
  };

  const selectedAssignment = assignments.find((a) => {
    const evId = typeof a.eventId === 'object' ? a.eventId._id || a.eventId.id : a.eventId;
    return evId === selectedEventId;
  });

  const selectedEventObj = selectedAssignment && typeof selectedAssignment.eventId === 'object'
    ? selectedAssignment.eventId
    : null;

  return (
    <div className="space-y-6">
      {/* JUDGE DASHBOARD HEADER */}
      <div className="bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#C6A15B]"></span>
            <span>Evaluation Panel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1713]">
            Evaluation Portal — {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#786B61] max-w-xl">
            Access assigned candidate scoring rubrics, review project submissions, and record qualitative criteria scores.
          </p>
        </div>

        <div className="text-right bg-[#FBF7EF] px-4 py-3 rounded-2xl border border-[#E6D8C3] shrink-0">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#786B61]">Panel Designation</div>
          <div className="text-xs font-bold text-[#1F1713] mt-0.5">
            {user?.profileInfo?.department || 'Academic Evaluator'}
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-[#71866F]/10 border border-[#71866F]/30 text-[#71866F] text-xs flex items-center gap-2 font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#71866F]" />
          <span>{notification}</span>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#786B61]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Assigned Competitions</span>
            <Award className="w-4 h-4 text-[#C6A15B]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F1713]">{assignments.length}</div>
          <div className="text-[11px] text-[#786B61]">Authorized evaluator</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#786B61]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Submissions Evaluated</span>
            <FileCheck className="w-4 h-4 text-[#71866F]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F1713]">
            {evaluations.length} / {participants.length}
          </div>
          <div className="text-[11px] text-[#71866F] font-medium">Rubric criteria graded</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#786B61]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Evaluation State</span>
            <Star className="w-4 h-4 text-[#B58A3A]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F1713]">
            {participants.length > 0 && evaluations.length === participants.length ? 'Completed' : 'In Progress'}
          </div>
          <div className="text-[11px] text-[#786B61]">Standard scoring scale</div>
        </div>
      </div>

      {/* COMPETITION SELECTION & CANDIDATE ROSTER */}
      <div className="bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E6D8C3] pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F1713]">Assigned Competitions & Candidates</h2>
            <p className="text-xs text-[#786B61]">Select an assigned event to access student candidate roster</p>
          </div>

          {/* Event Selector */}
          {assignments.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#786B61]">Event:</span>
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="px-3 py-1.5 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] font-semibold focus:outline-none focus:ring-1 focus:ring-[#C6A15B] cursor-pointer"
              >
                {assignments.map((a) => {
                  const ev = a.eventId;
                  const evId = typeof ev === 'object' ? ev._id || ev.id : ev;
                  const title = typeof ev === 'object' ? ev.title : `Event #${evId}`;
                  return (
                    <option key={evId} value={evId}>
                      {title}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-[#786B61]">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] space-y-3 p-8">
            <Award className="w-10 h-10 text-[#E6D8C3] mx-auto" />
            <h3 className="text-base font-bold text-[#1F1713]">No competitions assigned yet</h3>
            <p className="text-xs text-[#786B61] max-w-sm mx-auto">
              Event organizers will designate you as an official judge when competition evaluations begin.
            </p>
          </div>
        ) : participantsLoading ? (
          <div className="py-12 text-center text-xs text-[#786B61] space-y-2">
            <div className="w-7 h-7 border-3 border-[#E6D8C3] border-t-[#C6A15B] rounded-full animate-spin mx-auto"></div>
            <div>Loading candidate roster...</div>
          </div>
        ) : participants.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] space-y-2 p-6">
            <Users className="w-8 h-8 text-[#E6D8C3] mx-auto" />
            <h4 className="text-sm font-bold text-[#1F1713]">No registered candidates found</h4>
            <p className="text-xs text-[#786B61]">
              Candidates will appear once students register for {selectedEventObj?.title || 'this event'}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {participants.map((p) => {
              const student = typeof p.studentId === 'object' ? p.studentId : p;
              const studentId = student?._id || student?.id || p.studentId;
              const studentName = student?.name || 'Student Candidate';
              const studentEmail = student?.email || '';

              const existingEval = evaluations.find((ev) => {
                const pId = typeof ev.participantId === 'object' ? ev.participantId._id || ev.participantId.id : ev.participantId;
                return pId === studentId;
              });

              return (
                <div
                  key={studentId}
                  className="p-5 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] space-y-3 flex flex-col justify-between hover:border-[#C6A15B]/50 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-[#786B61]">
                        Ticket: {p.ticketCode || 'CP-TICKET'}
                      </span>
                      {existingEval ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#71866F]/10 text-[#71866F] border border-[#71866F]/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Score: {existingEval.score}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3]">
                          Pending
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-[#1F1713]">{studentName}</h4>
                    <div className="text-[11px] text-[#786B61]">{studentEmail}</div>

                    {existingEval?.feedback && (
                      <div className="p-2.5 rounded-xl bg-[#FFFDF8] border border-[#E6D8C3] text-[11px] text-[#786B61] italic">
                        "{existingEval.feedback}"
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenScoreModal(p)}
                    className="w-full py-2 px-3 rounded-xl bg-[#FFFDF8] hover:bg-[#FBF7EF] text-[#2B211C] text-xs font-semibold border border-[#E6D8C3] transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <span>{existingEval ? 'Edit Evaluation' : 'Score Submission'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#C6A15B]" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scoring Modal */}
      {selectedEventId && (
        <JudgeScoringModal
          eventId={selectedEventId}
          eventTitle={
            (() => {
              const currentAssignment = assignments.find((a) => {
                const ev = a.eventId;
                const evId = typeof ev === 'object' ? ev._id || ev.id : ev;
                return evId === selectedEventId;
              });
              return typeof currentAssignment?.eventId === 'object' && currentAssignment?.eventId?.title
                ? currentAssignment.eventId.title
                : 'Assigned Event';
            })()
          }
          participant={selectedParticipant}
          existingResult={selectedExistingResult}
          isOpen={scoringModalOpen}
          onClose={() => setScoringModalOpen(false)}
          onSuccess={handleScoreSuccess}
        />
      )}
    </div>
  );
};
