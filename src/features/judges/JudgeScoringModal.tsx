import React, { useState } from 'react';
import { X, Award, AlertCircle, Sliders } from 'lucide-react';
import { apiClient } from '../../api/client.js';

interface JudgeScoringModalProps {
  eventId: string;
  eventTitle: string;
  participant: any;
  existingResult?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JudgeScoringModal: React.FC<JudgeScoringModalProps> = ({
  eventId,
  eventTitle,
  participant,
  existingResult,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !participant) return null;

  const student = typeof participant.studentId === 'object' ? participant.studentId : participant;
  const studentId = student?._id || student?.id || participant.studentId;

  const [innovation, setInnovation] = useState<number>(existingResult?.criteriaScores?.innovation ?? 85);
  const [technical, setTechnical] = useState<number>(existingResult?.criteriaScores?.technical ?? 85);
  const [impact, setImpact] = useState<number>(existingResult?.criteriaScores?.impact ?? 80);
  const [presentation, setPresentation] = useState<number>(existingResult?.criteriaScores?.presentation ?? 85);

  const calculatedScore = Math.round((innovation + technical + impact + presentation) / 4);

  const [awardTitle, setAwardTitle] = useState(existingResult?.awardTitle || '');
  const [judgeFeedback, setJudgeFeedback] = useState(existingResult?.judgeFeedback || '');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = await apiClient(`/api/events/${eventId}/evaluations`, {
      method: 'POST',
      body: JSON.stringify({
        participantId: studentId,
        score: calculatedScore,
        criteriaScores: {
          innovation,
          technical,
          impact,
          presentation,
        },
        awardTitle: awardTitle.trim() || undefined,
        judgeFeedback: judgeFeedback.trim() || undefined,
      }),
    });

    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMessage(res.error?.message || 'Failed to record evaluation');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-6 sm:p-8 shadow-2xl text-[#2B211C] space-y-5"
      >
        <div className="flex justify-between items-start border-b border-[#E6D8C3] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#C6A15B]" />
              <h3 className="text-base sm:text-lg font-bold text-[#1F1713]">Participant Evaluation</h3>
            </div>
            <p className="text-xs text-[#786B61] mt-0.5">
              Event: <span className="font-semibold text-[#1F1713]">{eventTitle}</span> • Candidate: <span className="font-semibold text-[#1F1713]">{student?.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#FBF7EF] text-[#786B61] hover:text-[#1F1713] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-[#A9675D]/10 border border-[#A9675D]/30 text-[#A9675D] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#A9675D]" />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Rubric Criteria Sliders */}
          <div className="p-5 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] space-y-4">
            <div className="flex justify-between items-center font-bold text-[#1F1713]">
              <span className="flex items-center gap-1.5 text-xs">
                <Sliders className="w-3.5 h-3.5 text-[#C6A15B]" /> Scoring Rubric Criteria
              </span>
              <span className="text-sm font-mono font-bold text-[#B58A3A] bg-[#FFFDF8] px-3 py-1 rounded-xl border border-[#E6D8C3] shadow-2xs">
                Total: {calculatedScore} / 100
              </span>
            </div>

            {/* Criteria 1: Technical */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold text-[#2B211C]">
                <span>Technical Architecture & Quality</span>
                <span className="font-mono text-[#B58A3A]">{technical} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={technical}
                onChange={(e) => setTechnical(Number(e.target.value))}
                className="w-full accent-[#C6A15B] cursor-pointer"
              />
            </div>

            {/* Criteria 2: Innovation */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold text-[#2B211C]">
                <span>Innovation & Problem Solving</span>
                <span className="font-mono text-[#B58A3A]">{innovation} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={innovation}
                onChange={(e) => setInnovation(Number(e.target.value))}
                className="w-full accent-[#C6A15B] cursor-pointer"
              />
            </div>

            {/* Criteria 3: Practical Impact */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold text-[#2B211C]">
                <span>Real-World Impact & Feasibility</span>
                <span className="font-mono text-[#B58A3A]">{impact} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={impact}
                onChange={(e) => setImpact(Number(e.target.value))}
                className="w-full accent-[#C6A15B] cursor-pointer"
              />
            </div>

            {/* Criteria 4: Presentation */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold text-[#2B211C]">
                <span>Presentation, Demo & Q&A</span>
                <span className="font-mono text-[#B58A3A]">{presentation} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={presentation}
                onChange={(e) => setPresentation(Number(e.target.value))}
                className="w-full accent-[#C6A15B] cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-[#2B211C]">
              Nominated Award / Distinction <span className="text-[#786B61] font-normal text-[11px]">(Optional)</span>
            </label>
            <input
              type="text"
              value={awardTitle}
              onChange={(e) => setAwardTitle(e.target.value)}
              placeholder="e.g. Best Architectural Scalability"
              className="w-full px-3 py-2 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B]"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-[#2B211C]">
              Judge Feedback & Evaluation Notes
            </label>
            <textarea
              rows={3}
              value={judgeFeedback}
              onChange={(e) => setJudgeFeedback(e.target.value)}
              placeholder="Constructive feedback for the student..."
              className="w-full px-3 py-2 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6D8C3]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#FBF7EF] hover:bg-[#F7F0E3] border border-[#E6D8C3] font-semibold text-[#786B61] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] font-semibold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Recording...' : 'Submit Evaluation Score'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
