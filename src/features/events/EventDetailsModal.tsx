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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1713]/60 backdrop-blur-xs animate-in fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] shadow-2xl text-[#2B211C] space-y-6"
      >
        {/* Large Event Hero Banner */}
        <div className="relative h-60 w-full overflow-hidden bg-[#FBF7EF]">
          <img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F1713]/80 via-[#1F1713]/30 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-[#1F1713]/50 text-[#FFFDF8] hover:bg-[#1F1713]/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Overlay info */}
          <div className="absolute bottom-5 left-6 right-6 text-white space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#FFFDF8]/95 text-[#2B211C] shadow-xs">
                {categoryName}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#71866F] text-[#FFFDF8]">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] text-xs">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-[#786B61] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C6A15B]" /> Event Schedule
              </div>
              <div className="font-bold text-[#2B211C]">{formatDateTime(event.startDateTime)}</div>
              <div className="text-[#786B61]">to {formatDateTime(event.endDateTime)}</div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-[#786B61] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C6A15B]" /> Primary Venue
              </div>
              <div className="font-bold text-[#2B211C]">{venueName || 'Venue to be announced'}</div>
              {venueBuilding && <div className="text-[#786B61]">{venueBuilding}</div>}
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-[#786B61] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C6A15B]" /> Registration Period
              </div>
              <div className="text-[#2B211C]">Opens: {formatDateTime(event.registrationStart)}</div>
              <div className="text-[#786B61]">Closes: {formatDateTime(event.registrationEnd)}</div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-[#786B61] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#C6A15B]" /> Capacity
              </div>
              <div className="font-bold text-[#2B211C]">
                {event.registeredCount} / {event.capacity} seats confirmed
              </div>
              <div className="w-full bg-[#E6D8C3]/50 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-[#C6A15B] rounded-full"
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#786B61]">
              About the Event
            </h3>
            <p className="text-xs sm:text-sm text-[#2B211C] leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Eligibility & Instructions */}
          {(event.eligibility || event.instructions) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.eligibility && (
                <div className="p-4 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] space-y-1">
                  <div className="text-xs font-bold text-[#2B211C] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#71866F]" />
                    <span>Eligibility Requirements</span>
                  </div>
                  <p className="text-xs text-[#786B61] leading-relaxed">
                    {event.eligibility}
                  </p>
                </div>
              )}

              {event.instructions && (
                <div className="p-4 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] space-y-1">
                  <div className="text-xs font-bold text-[#2B211C] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#C6A15B]" />
                    <span>Participant Instructions</span>
                  </div>
                  <p className="text-xs text-[#786B61] leading-relaxed">
                    {event.instructions}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Venue Amenities */}
          {venueAmenities && venueAmenities.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#786B61]">
                Facility Amenities
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {venueAmenities.map((amenity: string) => (
                  <span
                    key={amenity}
                    className="px-2.5 py-1 rounded-xl text-[11px] bg-[#FBF7EF] text-[#786B61] border border-[#E6D8C3]"
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
          <div className="pt-4 border-t border-[#E6D8C3] flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs text-[#786B61]">
              Coordinated by <span className="font-semibold text-[#2B211C]">{organizerName}</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isRegistered ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="px-4 py-2.5 rounded-xl bg-[#71866F]/10 text-[#71866F] border border-[#71866F]/30 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#71866F]" />
                    <span>Registered for Event</span>
                  </span>
                  {onCancelRegistration && (
                    <button
                      onClick={() => onCancelRegistration(eventId)}
                      className="px-3.5 py-2.5 rounded-xl border border-[#E6D8C3] text-[#A9675D] hover:bg-[#A9675D]/10 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Cancel Entry
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onRegisterClick(event)}
                  disabled={!isRegWindowOpen || isFull || event.status === 'Cancelled' || event.status === 'EventCompleted'}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] text-xs font-bold shadow-xs hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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
