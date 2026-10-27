import React from 'react';
import { EventItem } from './EventCard.js';
import { ScheduleTimeline } from '../schedules/ScheduleTimeline.js';
import { getEventImageUrl } from '../../utils/imageAssets.js';
import {
  X,
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
} from 'lucide-react';

interface EventDetailsModalProps {
  event: EventItem | null;
  isOpen: boolean;
  isRegistered?: boolean;
  userRole?: string;
  onClose: () => void;
  onRegisterClick: (event: EventItem) => void;
  onCancelRegistration?: (eventId: string) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  isOpen,
  isRegistered,
  onClose,
  onRegisterClick,
  onCancelRegistration,
}) => {
  if (!isOpen || !event) return null;

  const eventId = event._id || event.id || '';
  const now = new Date();
  const regStart = new Date(event.registrationStart);
  const regEnd = new Date(event.registrationEnd);
  const isRegWindowOpen = now >= regStart && now <= regEnd;
  const isFull = event.registeredCount >= event.capacity;

  const categoryName = typeof event.categoryId === 'object' ? event.categoryId?.name : 'General';
  const venueName =
    typeof event.primaryVenueId === 'object' && event.primaryVenueId?.name
      ? event.primaryVenueId.name
      : null;
  const venueBuilding = typeof event.primaryVenueId === 'object' ? event.primaryVenueId?.building : '';
  const venueAmenities = typeof event.primaryVenueId === 'object' ? event.primaryVenueId?.amenities : [];
  const organizerName = typeof event.organizerId === 'object' ? event.organizerId?.name : 'Faculty Coordinator';
  const imageUrl = getEventImageUrl(event);

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const capacityPct = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B211D]/60 backdrop-blur-xs animate-in fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#FFFCF5] rounded-3xl border border-[#D8C3A5] shadow-2xl text-[#2B211D] space-y-6"
      >
        {/* Large Event Hero Banner */}
        <div className="relative h-60 w-full overflow-hidden bg-[#FFF8E7]">
          <img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2B211D]/80 via-[#2B211D]/30 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-[#2B211D]/50 text-white hover:bg-[#2B211D]/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Overlay info */}
          <div className="absolute bottom-5 left-6 right-6 text-white space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#FFFCF5]/95 text-[#2B211D] shadow-xs">
                {categoryName}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#5A1E2D] text-white">
                {event.status}
              </span>
              <span className="text-[11px] font-mono bg-black/50 px-2 py-0.5 rounded text-white/90">
                {event.eventCode}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold leading-tight drop-shadow-xs text-white">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 pt-0 space-y-6">
          {/* Key Event Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FFF8E7] border border-[#D8C3A5] text-xs">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-[#857568] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#5A1E2D]" /> Event Schedule
              </div>
              <div className="font-bold text-[#2B211D]">{formatDateTime(event.startDateTime)}</div>
              <div className="text-[#857568]">to {formatDateTime(event.endDateTime)}</div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-[#857568] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#5A1E2D]" /> Primary Venue
              </div>
              <div className="font-bold text-[#2B211D]">{venueName || 'Venue to be announced'}</div>
              {venueBuilding && <div className="text-[#857568]">{venueBuilding}</div>}
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-[#857568] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#5A1E2D]" /> Registration Period
              </div>
              <div className="text-[#2B211D]">Opens: {formatDateTime(event.registrationStart)}</div>
              <div className="text-[#857568]">Closes: {formatDateTime(event.registrationEnd)}</div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-[#857568] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#5A1E2D]" /> Capacity
              </div>
              <div className="font-bold text-[#2B211D]">
                {event.registeredCount} / {event.capacity} seats confirmed
              </div>
              <div className="w-full bg-[#D8C3A5]/50 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-[#5A1E2D] rounded-full"
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#857568]">
              About the Event
            </h3>
            <p className="text-xs sm:text-sm text-[#2B211D] leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Eligibility & Instructions */}
          {(event.eligibility || event.instructions) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.eligibility && (
                <div className="p-4 rounded-2xl bg-[#FFF8E7] border border-[#D8C3A5] space-y-1">
                  <div className="text-xs font-bold text-[#2B211D] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#5A1E2D]" />
                    <span>Eligibility Requirements</span>
                  </div>
                  <p className="text-xs text-[#857568] leading-relaxed">
                    {event.eligibility}
                  </p>
                </div>
              )}

              {event.instructions && (
                <div className="p-4 rounded-2xl bg-[#FFF8E7] border border-[#D8C3A5] space-y-1">
                  <div className="text-xs font-bold text-[#2B211D] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#5A1E2D]" />
                    <span>Participant Instructions</span>
                  </div>
                  <p className="text-xs text-[#857568] leading-relaxed">
                    {event.instructions}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Venue Amenities */}
          {venueAmenities && venueAmenities.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#857568]">
                Facility Amenities
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {venueAmenities.map((amenity: string) => (
                  <span
                    key={amenity}
                    className="px-2.5 py-1 rounded-xl text-[11px] bg-[#FFF8E7] text-[#857568] border border-[#D8C3A5]"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Schedule Timeline Component */}
          <div className="pt-2">
            <ScheduleTimeline eventId={eventId} />
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#D8C3A5] flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs text-[#857568]">
              Coordinated by <span className="font-semibold text-[#2B211D]">{organizerName}</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isRegistered ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="px-4 py-2.5 rounded-xl bg-[#5A1E2D]/10 text-[#5A1E2D] border border-[#5A1E2D]/30 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#5A1E2D]" />
                    <span>Registered for Event</span>
                  </span>
                  {onCancelRegistration && (
                    <button
                      onClick={() => onCancelRegistration(eventId)}
                      className="px-3.5 py-2.5 rounded-xl border border-[#D8C3A5] text-red-700 hover:bg-red-50 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Cancel Entry
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onRegisterClick(event)}
                  disabled={!isRegWindowOpen || isFull || event.status === 'Cancelled' || event.status === 'EventCompleted'}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#5A1E2D] hover:bg-[#742A3D] text-[#FFF8E7] text-xs font-bold shadow-xs hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{isFull ? 'Capacity Reached' : 'Register Now'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
