import React, { useState } from 'react';
import { ScheduleItem } from './ScheduleTimeline.js';
import { X, Calendar, MapPin, Tag, User, AlertCircle, Save } from 'lucide-react';
import { apiClient } from '../../api/client.js';

interface ScheduleFormModalProps {
  eventId: string;
  schedule?: ScheduleItem | null;
  venues: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScheduleFormModal: React.FC<ScheduleFormModalProps> = ({
  eventId,
  schedule,
  venues,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(schedule);
  const scheduleId = schedule?._id || schedule?.id;

  const toInputDatetime = (dateVal: string | undefined) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const defaultStart = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  const defaultEnd = new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000);

  const [title, setTitle] = useState(schedule?.title || '');
  const [description, setDescription] = useState(schedule?.description || '');
  const [startDateTime, setStartDateTime] = useState(
    schedule ? toInputDatetime(schedule.startDateTime) : toInputDatetime(defaultStart.toISOString())
  );
  const [endDateTime, setEndDateTime] = useState(
    schedule ? toInputDatetime(schedule.endDateTime) : toInputDatetime(defaultEnd.toISOString())
  );
  const [venueId, setVenueId] = useState(
    typeof schedule?.venueId === 'object' ? schedule?.venueId?._id || schedule?.venueId?.id : schedule?.venueId || ''
  );
  const [trackName, setTrackName] = useState(schedule?.trackName || 'Main Stage Track');
  const [speakerOrLead, setSpeakerOrLead] = useState(schedule?.speakerOrLead || '');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (start >= end) {
      setErrorMessage('Session start time must be strictly before end time');
      return;
    }

    setLoading(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      venueId: venueId || undefined,
      trackName: trackName.trim() || 'Main Track',
      speakerOrLead: speakerOrLead.trim() || undefined,
    };

    let res;
    if (isEditing) {
      res = await apiClient(`/api/schedules/${scheduleId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } else {
      res = await apiClient(`/api/events/${eventId}/schedules`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMessage(res.error?.message || 'Failed to save session');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-6 sm:p-8 shadow-2xl text-[#2B211C] space-y-5"
      >
        <div className="flex justify-between items-start border-b border-[#E6D8C3] pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1F1713]">
              {isEditing ? 'Edit Session Timetable' : 'Add Agenda Session'}
            </h3>
            <p className="text-xs text-[#786B61]">Define session tracks, speakers, and venue allocation</p>
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
          <div>
            <label className="block font-semibold mb-1 text-[#2B211C]">
              Session Title <span className="text-[#C6A15B]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Keynote: Future of Zero-Trust Security"
              className="w-full px-3 py-2 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] placeholder-[#786B61]/60 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-[#2B211C]">
                Start Date & Time <span className="text-[#C6A15B]">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2B211C]">
                End Date & Time <span className="text-[#C6A15B]">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-[#2B211C]">Track Name</label>
              <input
                type="text"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                placeholder="e.g. Technical Track A"
                className="w-full px-3 py-2 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#2B211C]">Allocated Venue</label>
              <select
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className="w-full px-3 py-2 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B] cursor-pointer"
              >
                <option value="">Default Event Venue</option>
                {venues.map((v) => (
                  <option key={v._id || v.id} value={v._id || v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#2B211C]">Speaker / Session Lead</label>
            <input
              type="text"
              value={speakerOrLead}
              onChange={(e) => setSpeakerOrLead(e.target.value)}
              placeholder="e.g. Keynote Speaker / Faculty Chair"
              className="w-full px-3 py-2 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B]"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#2B211C]">Session Details</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief agenda description..."
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
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Session'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
