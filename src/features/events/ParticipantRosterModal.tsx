import React, { useState, useEffect } from 'react';
import { EventItem } from './EventCard.js';
import { X, Users, RefreshCw } from 'lucide-react';
import { apiClient } from '../../api/client.js';

interface ParticipantRosterModalProps {
  event?: EventItem | null;
  eventId?: string;
  eventTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ParticipantRosterModal: React.FC<ParticipantRosterModalProps> = ({
  event,
  eventId: propEventId,
  eventTitle: propEventTitle,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const targetEventId = propEventId || event?._id || event?.id || '';
  const displayTitle = propEventTitle || event?.title || 'Campus Event';

  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParticipants = async () => {
    if (!targetEventId) return;
    setLoading(true);
    const res = await apiClient<{ participants: any[] }>(`/api/events/${targetEventId}/registrations`);
    if (res.success && res.data) {
      setParticipants(res.data.participants);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (targetEventId && isOpen) {
      fetchParticipants();
    }
  }, [targetEventId, isOpen]);

  const formatRegisteredAt = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
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
              <h3 className="text-base sm:text-lg font-bold text-[#1F1713]">Registered Participants Roster</h3>
            </div>
            <p className="text-xs text-[#786B61] mt-0.5">
              Event: <span className="font-semibold text-[#1F1713]">{displayTitle}</span> ({participants.length} registered)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchParticipants}
              disabled={loading}
              className="p-2 rounded-xl bg-[#FBF7EF] hover:bg-[#F7F0E3] text-[#786B61] border border-[#E6D8C3] transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#C6A15B]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#FBF7EF] text-[#786B61] hover:text-[#1F1713] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#786B61] space-y-2">
            <div className="w-6 h-6 border-2 border-[#E6D8C3] border-t-[#C6A15B] rounded-full animate-spin mx-auto mb-2"></div>
            <div>Loading attendee registrations...</div>
          </div>
        ) : participants.length === 0 ? (
          <div className="py-12 text-center space-y-2 p-6 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3]">
            <Users className="w-8 h-8 text-[#E6D8C3] mx-auto" />
            <h4 className="text-sm font-bold text-[#1F1713]">No registrations recorded yet</h4>
            <p className="text-xs text-[#786B61] max-w-sm mx-auto">
              Once students register for this event, their registration tickets and attendee details will appear in this roster.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBF7EF] text-[#786B61] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-xl">Student Name</th>
                  <th className="py-2.5 px-3">Email & Dept</th>
                  <th className="py-2.5 px-3">Pass Code</th>
                  <th className="py-2.5 px-3">Registered At</th>
                  <th className="py-2.5 px-3 rounded-r-xl text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6D8C3]">
                {participants.map((p) => {
                  const student = typeof p.studentId === 'object' ? p.studentId : null;
                  return (
                    <tr key={p._id || p.id} className="hover:bg-[#FBF7EF]/70 transition-colors">
                      <td className="py-3 px-3 font-bold text-[#1F1713]">
                        {student?.name || 'Student Attendee'}
                      </td>
                      <td className="py-3 px-3 text-[#786B61]">
                        <div>{student?.email || 'N/A'}</div>
                        <div className="text-[10px] text-[#786B61]">
                          {student?.profileInfo?.department || 'Undergraduate'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] font-semibold text-[#B58A3A] bg-[#FBF7EF] px-2 py-0.5 rounded border border-[#E6D8C3]">
                          {p.registrationCode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#786B61]">
                        {formatRegisteredAt(p.registeredAt)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#71866F]/10 text-[#71866F] border border-[#71866F]/20">
                          {p.status}
                        </span>
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
