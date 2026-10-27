import React, { useState } from 'react';
import { EventItem } from './EventCard.js';
import { X, Check, AlertCircle, Ticket, MapPin, Users, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../api/client.js';

interface RegistrationConfirmModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (regData: any) => void;
}

export const RegistrationConfirmModal: React.FC<RegistrationConfirmModalProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !event) return null;

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedPass, setConfirmedPass] = useState<any | null>(null);

  const eventId = event._id || event.id;
  const venueName =
    typeof event.primaryVenueId === 'object' && event.primaryVenueId?.name
      ? event.primaryVenueId.name
      : null;

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);

    const res = await apiClient<{ registration: any; event: any }>(`/api/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes.trim() || undefined }),
    });

    setLoading(false);

    if (res.success && res.data) {
      setConfirmedPass(res.data.registration);
      setTimeout(() => {
        onSuccess(res.data);
      }, 1800);
    } else {
      setError(res.error?.message || 'Failed to complete registration. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1713]/60 backdrop-blur-xs animate-in fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-6 sm:p-7 shadow-2xl text-[#2B211C] space-y-5"
      >
        {confirmedPass ? (
          /* Success Ticket Pass View */
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-[#71866F]/10 text-[#71866F] border border-[#71866F]/20 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#1F1713]">Registration Confirmed!</h3>
              <p className="text-xs text-[#786B61] mt-1">Your digital entry ticket is active.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] space-y-2 text-xs">
              <div className="font-mono text-[11px] font-bold text-[#B58A3A]">
                Ticket #{confirmedPass.ticketCode}
              </div>
              <div className="font-bold text-sm text-[#2B211C]">{event.title}</div>
              {venueName && <div className="text-[#786B61]">{venueName}</div>}
            </div>
          </div>
        ) : (
          /* Confirmation Form View */
          <>
            <div className="flex justify-between items-start border-b border-[#E6D8C3] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E2CF9F]/30 text-[#B58A3A] flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1F1713]">You're almost in!</h3>
                  <p className="text-[11px] text-[#786B61]">Confirm reservation for your student pass</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[#FBF7EF] text-[#786B61] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#A9675D]/10 border border-[#A9675D]/30 text-[#A9675D] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {/* Event Summary Box */}
            <div className="p-4 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] space-y-2 text-xs">
              <div className="font-bold text-sm text-[#2B211C]">{event.title}</div>
              {venueName && (
                <div className="flex items-center gap-2 text-[#786B61]">
                  <MapPin className="w-3.5 h-3.5 text-[#C6A15B]" />
                  <span>{venueName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-[#786B61]">
                <Users className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Available Seats: {Math.max(0, event.capacity - event.registeredCount)}</span>
              </div>
            </div>

            {/* Optional notes */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#2B211C]">
                Participant Notes <span className="text-[#786B61] font-normal text-[11px]">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Dietary preferences, team roster, accessibility needs..."
                className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] placeholder-[#786B61]/60 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B] resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-[#E6D8C3]">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-[#FBF7EF] hover:bg-[#F7F0E3] text-[#2B211C] text-xs font-semibold transition-colors cursor-pointer border border-[#E6D8C3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] text-xs font-bold shadow-xs hover:shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-[#FFFDF8]/30 border-t-[#FFFDF8] rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Claim Seat</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
