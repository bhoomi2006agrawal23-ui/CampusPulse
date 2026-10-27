import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.js';
import { Clock, MapPin, User, Plus, Trash2, Edit3, Calendar } from 'lucide-react';

export interface ScheduleItem {
  _id?: string;
  id?: string;
  eventId: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  venueId?: any;
  trackName?: string;
  speakerOrLead?: string;
}

interface ScheduleTimelineProps {
  eventId: string;
  canManage?: boolean;
  onOpenCreate?: () => void;
  onOpenEdit?: (schedule: ScheduleItem) => void;
  onDelete?: (scheduleId: string) => void;
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  eventId,
  canManage,
  onOpenCreate,
  onOpenEdit,
  onDelete,
}) => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    setLoading(true);
    const res = await apiClient<{ schedules: ScheduleItem[] }>(`/api/events/${eventId}/schedules`);
    if (res.success && res.data) {
      setSchedules(res.data.schedules);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedules();
  }, [eventId]);

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-xs text-[#786B61] space-y-1.5">
        <div className="w-5 h-5 border-2 border-[#E6D8C3] border-t-[#C6A15B] rounded-full animate-spin mx-auto"></div>
        <div>Loading schedule agenda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-[#E6D8C3] pb-2">
        <h4 className="text-xs font-bold text-[#1F1713] uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#C6A15B]" /> Event Agenda & Session Timetable
        </h4>
        {canManage && onOpenCreate && (
          <button
            onClick={onOpenCreate}
            className="px-3 py-1 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3 h-3" />
            <span>Add Session</span>
          </button>
        )}
      </div>

      {schedules.length === 0 ? (
        <div className="py-6 text-center space-y-1 p-4 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3]">
          <Clock className="w-6 h-6 text-[#E6D8C3] mx-auto mb-1" />
          <p className="text-xs font-semibold text-[#1F1713]">No scheduled sessions yet</p>
          <p className="text-[11px] text-[#786B61]">Event sessions and keynote timings will appear here once published.</p>
        </div>
      ) : (
        <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E6D8C3]">
          {schedules.map((s) => {
            const venueName = typeof s.venueId === 'object' && s.venueId?.name ? s.venueId.name : null;
            const sId = s._id || s.id || '';

            return (
              <div
                key={sId}
                className="relative pl-8 p-4 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] hover:border-[#C6A15B]/50 transition-colors"
              >
                {/* Timeline node */}
                <div className="absolute left-2.5 top-4.5 w-2.5 h-2.5 rounded-full bg-[#C6A15B] ring-4 ring-[#FFFDF8]"></div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#B58A3A] bg-[#FFFDF8] px-2.5 py-0.5 rounded-md border border-[#E6D8C3]">
                        {formatDate(s.startDateTime)} • {formatTime(s.startDateTime)} – {formatTime(s.endDateTime)}
                      </span>
                      {s.trackName && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FFFDF8] text-[#B58A3A] border border-[#E6D8C3]">
                          {s.trackName}
                        </span>
                      )}
                    </div>

                    <h5 className="text-sm font-bold text-[#1F1713]">{s.title}</h5>

                    {s.description && (
                      <p className="text-xs text-[#786B61] leading-relaxed">{s.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#786B61]">
                      {venueName && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#C6A15B]" />
                          <span>{venueName}</span>
                        </div>
                      )}
                      {s.speakerOrLead && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-[#71866F]" />
                          <span>Lead: {s.speakerOrLead}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                      {onOpenEdit && (
                        <button
                          onClick={() => onOpenEdit(s)}
                          className="p-1.5 rounded-lg hover:bg-[#F7F0E3] text-[#786B61] transition-colors cursor-pointer"
                          title="Edit Session"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(sId)}
                          className="p-1.5 rounded-lg hover:bg-[#A9675D]/10 text-[#A9675D] transition-colors cursor-pointer"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
