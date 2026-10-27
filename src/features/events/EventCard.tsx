import React from 'react';
import { Calendar, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getEventImageUrl } from '../../utils/imageAssets.js';

export interface EventItem {
  _id?: string;
  id?: string;
  title: string;
  eventCode: string;
  slug: string;
  description: string;
  collegeName?: string;
  categoryId: any;
  primaryVenueId: any;
  organizerId?: any;
  startDateTime: string;
  endDateTime: string;
  registrationStart: string;
  registrationEnd: string;
  capacity: number;
  registeredCount: number;
  status: string;
  bannerUrl?: string;
  eligibility?: string;
  instructions?: string;
}

interface EventCardProps {
  event: EventItem;
  isRegistered?: boolean;
  onViewDetails: (event: EventItem) => void;
  onRegisterClick?: (event: EventItem) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isRegistered,
  onViewDetails,
  onRegisterClick,
}) => {
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
  const imageUrl = getEventImageUrl(event);

  const formatEventDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RegistrationOpen':
        return (
          <span className="text-[11px] font-semibold text-[#71866F] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#71866F]"></span>
            Registration Open
          </span>
        );
      case 'Published':
        return (
          <span className="text-[11px] font-semibold text-[#C6A15B] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6A15B]"></span>
            Published
          </span>
        );
      case 'RegistrationClosed':
        return (
          <span className="text-[11px] font-semibold text-[#786B61] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E6D8C3]"></span>
            Registration Closed
          </span>
        );
      case 'EventUpcoming':
        return (
          <span className="text-[11px] font-semibold text-[#B58A3A] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B58A3A]"></span>
            Upcoming
          </span>
        );
      case 'EventOngoing':
        return (
          <span className="text-[11px] font-semibold text-[#71866F] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#71866F] animate-pulse"></span>
            Live Now
          </span>
        );
      case 'EventCompleted':
        return (
          <span className="text-[11px] font-semibold text-[#786B61]">
            Completed
          </span>
        );
      case 'ResultsPublished':
        return (
          <span className="text-[11px] font-semibold text-[#B58A3A]">
            Results Published
          </span>
        );
      case 'Cancelled':
        return (
          <span className="text-[11px] font-semibold text-[#A9675D]">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-semibold text-[#786B61]">
            {status}
          </span>
        );
    }
  };

  const capacityPct = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));

  return (
    <div className="group bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] overflow-hidden flex flex-col justify-between hover:border-[#C6A15B]/50 hover:shadow-lg transition-all duration-300">
      <div>
        {/* Event Header Image */}
        <div
          onClick={() => onViewDetails(event)}
          className="relative h-48 w-full overflow-hidden bg-[#FBF7EF] cursor-pointer"
        >
          <img
            src={imageUrl}
            alt={event.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F1713]/60 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

          {/* Floating Category Tag */}
          <div className="absolute top-3.5 left-3.5">
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#FFFDF8]/95 backdrop-blur-xs text-[#2B211C] shadow-xs border border-[#E6D8C3]">
              {categoryName}
            </span>
          </div>

          {/* Registered Ribbon */}
          {isRegistered && (
            <div className="absolute top-3.5 right-3.5">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#71866F] text-[#FFFDF8] shadow-xs flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Registered
              </span>
            </div>
          )}

          {/* Event Code Badge */}
          <div className="absolute bottom-3 left-3.5">
            <span className="text-[10px] font-mono font-medium text-[#FFFDF8]/90 bg-[#1F1713]/60 backdrop-blur-xs px-2 py-0.5 rounded-md">
              {event.eventCode}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 sm:p-6 space-y-3">
          {/* Status Line */}
          <div className="flex items-center justify-between">
            {getStatusBadge(event.status)}
            <span className="text-[11px] font-mono text-[#786B61]">
              {Math.max(0, event.capacity - event.registeredCount)} seats left
            </span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onViewDetails(event)}
            className="text-base sm:text-lg font-bold text-[#2B211C] hover:text-[#C6A15B] transition-colors cursor-pointer line-clamp-1 leading-snug"
          >
            {event.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-[#786B61] line-clamp-2 leading-relaxed">
            {event.description}
          </p>

          {/* Event Metadata */}
          <div className="pt-3 border-t border-[#E6D8C3] space-y-2 text-xs text-[#786B61]">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
              <span className="truncate">{formatEventDate(event.startDateTime)}</span>
            </div>
            {venueName && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
                <span className="truncate">{venueName}</span>
              </div>
            )}
          </div>

          {/* Capacity Progress Bar */}
          <div className="pt-1">
            <div className="flex justify-between items-center text-[10px] text-[#786B61] mb-1">
              <span>Enrollment Capacity</span>
              <span className="font-medium text-[#2B211C]">{event.registeredCount} / {event.capacity}</span>
            </div>
            <div className="w-full bg-[#FBF7EF] h-1.5 rounded-full overflow-hidden border border-[#E6D8C3]/50">
              <div
                className="h-full bg-[#C6A15B] rounded-full transition-all duration-300"
                style={{ width: `${capacityPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-5 sm:p-6 pt-0 flex items-center gap-2.5">
        <button
          onClick={() => onViewDetails(event)}
          className="flex-1 py-2.5 px-3 rounded-xl border border-[#E6D8C3] bg-[#FBF7EF] hover:bg-[#F7F0E3] text-[#2B211C] text-xs font-semibold transition-colors cursor-pointer text-center"
        >
          View Details
        </button>

        {onRegisterClick && !isRegistered && (
          <button
            onClick={() => onRegisterClick(event)}
            disabled={!isRegWindowOpen || isFull || event.status === 'Cancelled' || event.status === 'EventCompleted'}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-center shadow-xs hover:shadow-md flex items-center justify-center gap-1"
          >
            <span>{isFull ? 'Sold Out' : 'Register'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
