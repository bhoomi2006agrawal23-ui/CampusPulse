import React, { useState, useEffect } from 'react';
import { EventItem } from './EventCard.js';
import { X, AlertCircle, Save, Plus, Building, MapPin } from 'lucide-react';
import { apiClient } from '../../api/client.js';

interface EventFormModalProps {
  event?: EventItem | null;
  isOpen: boolean;
  categories: any[];
  venues: any[];
  onClose: () => void;
  onSuccess: (savedEvent: any) => void;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  event,
  isOpen,
  categories,
  venues: initialVenues,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(event);
  const eventId = event?._id || event?.id;

  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [collegeName, setCollegeName] = useState(
    event?.collegeName || 'CampusPulse Institute of Technology'
  );
  const [categoryId, setCategoryId] = useState(
    typeof event?.categoryId === 'object'
      ? event?.categoryId?._id || event?.categoryId?.id
      : event?.categoryId || (categories[0]?._id || categories[0]?.id || '')
  );

  const [collegeVenues, setCollegeVenues] = useState<any[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [primaryVenueId, setPrimaryVenueId] = useState(
    typeof event?.primaryVenueId === 'object'
      ? event?.primaryVenueId?._id || event?.primaryVenueId?.id
      : event?.primaryVenueId || ''
  );

  // Add New Venue Modal / Form state
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueBuilding, setNewVenueBuilding] = useState('');
  const [newVenueCapacity, setNewVenueCapacity] = useState(100);
  const [newVenueAmenities, setNewVenueAmenities] = useState('');
  const [newVenueContact, setNewVenueContact] = useState('');
  const [addingVenue, setAddingVenue] = useState(false);
  const [venueError, setVenueError] = useState<string | null>(null);

  // Fetch venues whenever collegeName changes
  useEffect(() => {
    if (!collegeName.trim()) {
      setCollegeVenues([]);
      setPrimaryVenueId('');
      return;
    }

    setVenuesLoading(true);
    apiClient<{ venues: any[] }>(`/api/venues?collegeName=${encodeURIComponent(collegeName.trim())}`)
      .then((res) => {
        if (res.success && res.data?.venues) {
          setCollegeVenues(res.data.venues);
          // If current primaryVenueId is not in this college's venues, select first available or clear
          const exists = res.data.venues.some(
            (v: any) => (v._id || v.id) === primaryVenueId
          );
          if (!exists) {
            setPrimaryVenueId(res.data.venues[0]?._id || res.data.venues[0]?.id || '');
          }
        } else {
          setCollegeVenues([]);
          setPrimaryVenueId('');
        }
      })
      .catch(() => {
        setCollegeVenues([]);
        setPrimaryVenueId('');
      })
      .finally(() => {
        setVenuesLoading(false);
      });
  }, [collegeName]);

  const handleCollegeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCollegeName(val);
    // Requirement: If college name changes, clear the selected venue
    setPrimaryVenueId('');
  };

  const handleAddNewVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setVenueError(null);
    if (!newVenueName.trim()) {
      setVenueError('Venue name is required');
      return;
    }
    if (!newVenueBuilding.trim()) {
      setVenueError('Building or block is required');
      return;
    }
    if (newVenueCapacity < 1) {
      setVenueError('Capacity must be at least 1');
      return;
    }

    setAddingVenue(true);
    const amenitiesArr = newVenueAmenities
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const res = await apiClient<{ venue: any }>('/api/venues', {
      method: 'POST',
      body: JSON.stringify({
        name: newVenueName.trim(),
        collegeName: collegeName.trim(),
        building: newVenueBuilding.trim(),
        capacity: Number(newVenueCapacity),
        amenities: amenitiesArr,
        contactPerson: newVenueContact.trim() || undefined,
      }),
    });
    setAddingVenue(false);

    if (res.success && res.data?.venue) {
      const created = res.data.venue;
      setCollegeVenues((prev) => [...prev, created]);
      setPrimaryVenueId(created._id || created.id);
      setShowAddVenue(false);
      setNewVenueName('');
      setNewVenueBuilding('');
      setNewVenueCapacity(100);
      setNewVenueAmenities('');
      setNewVenueContact('');
    } else {
      setVenueError(res.error?.message || 'Failed to create venue');
    }
  };

  const defaultStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const defaultEnd = new Date(defaultStart.getTime() + 4 * 60 * 60 * 1000);
  const defaultRegStart = new Date(Date.now());
  const defaultRegEnd = new Date(defaultStart.getTime() - 24 * 60 * 60 * 1000);

  const toInputDatetime = (dateVal: string | Date | undefined) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const [startDateTime, setStartDateTime] = useState(
    event ? toInputDatetime(event.startDateTime) : toInputDatetime(defaultStart)
  );
  const [endDateTime, setEndDateTime] = useState(
    event ? toInputDatetime(event.endDateTime) : toInputDatetime(defaultEnd)
  );
  const [registrationStart, setRegistrationStart] = useState(
    event ? toInputDatetime(event.registrationStart) : toInputDatetime(defaultRegStart)
  );
  const [registrationEnd, setRegistrationEnd] = useState(
    event ? toInputDatetime(event.registrationEnd) : toInputDatetime(defaultRegEnd)
  );
  const [capacity, setCapacity] = useState(event?.capacity || 100);
  const [bannerUrl, setBannerUrl] = useState(event?.bannerUrl || '');
  const [eligibility, setEligibility] = useState(event?.eligibility || '');
  const [instructions, setInstructions] = useState(event?.instructions || '');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!collegeName.trim()) {
      setErrorMessage('Please enter your college name');
      return;
    }
    if (!primaryVenueId) {
      setErrorMessage('Please select a valid venue for your college');
      return;
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const regStart = new Date(registrationStart);
    const regEnd = new Date(registrationEnd);

    if (start >= end) {
      setErrorMessage('Event start time must be strictly before event end time');
      return;
    }
    if (regStart >= regEnd) {
      setErrorMessage('Registration start time must be strictly before registration end time');
      return;
    }
    if (regEnd > start) {
      setErrorMessage('Registration end time cannot be after event start time');
      return;
    }
    if (capacity < 1) {
      setErrorMessage('Capacity must be at least 1 attendee');
      return;
    }

    setLoading(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      collegeName: collegeName.trim(),
      categoryId,
      primaryVenueId,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      registrationStart: regStart.toISOString(),
      registrationEnd: regEnd.toISOString(),
      capacity: Number(capacity),
      bannerUrl: bannerUrl.trim() || undefined,
      eligibility: eligibility.trim() || undefined,
      instructions: instructions.trim() || undefined,
    };

    let res;
    if (isEditing) {
      res = await apiClient<{ event: any }>(`/api/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } else {
      res = await apiClient<{ event: any }>('/api/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    setLoading(false);

    if (res.success && res.data) {
      onSuccess(res.data.event);
    } else {
      setErrorMessage(res.error?.message || 'Operation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1713]/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-[#FFFDF9] rounded-3xl border border-[#E7DED4] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-[#292522] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#E7DED4] flex items-center justify-between sticky top-0 bg-[#FFFDF9] z-10">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#B97868]">
              Organizer Portal
            </div>
            <h2 className="text-xl font-bold text-[#292522]">
              {isEditing ? 'Edit Campus Event' : 'Create New Campus Event'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#766E65] hover:bg-[#F8F5F0] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-[#A9675D]/10 border border-[#A9675D]/30 text-[#A9675D] text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#A9675D]" />
            <div className="font-medium">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. College Name */}
          <div>
            <label className="block text-xs font-semibold text-[#292522] mb-1">
              College Name <span className="text-[#B97868]">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-[#766E65] absolute left-3.5 top-3" />
              <input
                type="text"
                required
                minLength={2}
                maxLength={150}
                value={collegeName}
                onChange={handleCollegeChange}
                placeholder="Enter the name of your college"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs sm:text-sm text-[#292522] placeholder-[#766E65]/60 focus:outline-none focus:ring-2 focus:ring-[#B97868]/30 focus:border-[#B97868] transition-all font-medium"
              />
            </div>
            <p className="text-[11px] text-[#766E65] mt-1">
              Venues and resource availability are dynamically filtered for this college.
            </p>
          </div>

          {/* 2. Venue Selection Section */}
          <div className="p-4 rounded-2xl bg-[#F8F5F0] border border-[#E7DED4] space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#292522] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#B97868]" />
                Select Venue <span className="text-[#B97868]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddVenue((prev) => !prev)}
                className="text-xs font-bold text-[#B97868] hover:text-[#A66859] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddVenue ? 'Cancel Add Venue' : 'Add New Venue'}</span>
              </button>
            </div>

            {/* Add New Venue Form Inline */}
            {showAddVenue && (
              <div className="p-4 rounded-xl bg-[#FFFDF9] border border-[#E7DED4] space-y-3 animate-in fade-in">
                <div className="text-xs font-bold text-[#292522]">Register New Venue for {collegeName || 'College'}</div>
                {venueError && (
                  <div className="p-2 rounded-lg bg-[#A9675D]/10 text-[#A9675D] text-[11px]">
                    {venueError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#292522] mb-1">Venue Name *</label>
                    <input
                      type="text"
                      value={newVenueName}
                      onChange={(e) => setNewVenueName(e.target.value)}
                      placeholder="e.g. Auditorium Hall B"
                      className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs text-[#292522]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#292522] mb-1">Building or Block *</label>
                    <input
                      type="text"
                      value={newVenueBuilding}
                      onChange={(e) => setNewVenueBuilding(e.target.value)}
                      placeholder="e.g. Science Block"
                      className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs text-[#292522]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#292522] mb-1">Capacity *</label>
                    <input
                      type="number"
                      min={1}
                      value={newVenueCapacity}
                      onChange={(e) => setNewVenueCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs text-[#292522]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#292522] mb-1">Amenities (comma separated)</label>
                    <input
                      type="text"
                      value={newVenueAmenities}
                      onChange={(e) => setNewVenueAmenities(e.target.value)}
                      placeholder="Projector, Wi-Fi, AC"
                      className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs text-[#292522]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={addingVenue}
                  onClick={handleAddNewVenue}
                  className="px-4 py-2 rounded-xl bg-[#B97868] hover:bg-[#A66859] text-[#FFFDF9] text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
                >
                  {addingVenue ? 'Saving Venue...' : 'Save & Select Venue'}
                </button>
              </div>
            )}

            {venuesLoading ? (
              <div className="text-xs text-[#766E65] py-2 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-[#E7DED4] border-t-[#B97868] rounded-full animate-spin"></div>
                <span>Loading venues for {collegeName}...</span>
              </div>
            ) : collegeVenues.length === 0 ? (
              <div className="p-3 rounded-xl bg-[#FFFDF9] border border-[#E7DED4] text-xs text-[#766E65] space-y-2">
                <p>No venues found registered for <span className="font-semibold text-[#292522]">"{collegeName}"</span>.</p>
                <p className="text-[11px]">Click <span className="font-bold text-[#B97868]">"Add New Venue"</span> above to create one.</p>
              </div>
            ) : (
              <select
                value={primaryVenueId}
                onChange={(e) => setPrimaryVenueId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-[#E7DED4] rounded-xl text-xs sm:text-sm text-[#292522] focus:outline-none focus:ring-2 focus:ring-[#B97868]/30 focus:border-[#B97868] transition-all cursor-pointer font-medium"
              >
                <option value="" disabled>
                  Select a venue in {collegeName}
                </option>
                {collegeVenues.map((v) => (
                  <option key={v._id || v.id} value={v._id || v.id}>
                    {v.name} ({v.building} — Cap: {v.capacity})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Event Title */}
          <div>
            <label className="block text-xs font-semibold text-[#292522] mb-1">
              Event Title <span className="text-[#B97868]">*</span>
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual AI Hackathon 2026"
              className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs sm:text-sm text-[#292522] placeholder-[#766E65]/60 focus:outline-none focus:ring-2 focus:ring-[#B97868]/30 focus:border-[#B97868] transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-[#292522] mb-1">
              Event Category <span className="text-[#B97868]">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs sm:text-sm text-[#292522] focus:outline-none focus:ring-2 focus:ring-[#B97868]/30 focus:border-[#B97868] transition-all cursor-pointer font-medium"
            >
              {categories.map((cat) => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#292522] mb-1">
              Description <span className="text-[#B97868]">*</span>
            </label>
            <textarea
              rows={3}
              required
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide event details, tracks, schedule overview, and guidelines..."
              className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs sm:text-sm text-[#292522] placeholder-[#766E65]/60 focus:outline-none focus:ring-2 focus:ring-[#B97868]/30 focus:border-[#B97868] transition-all resize-none"
            />
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#292522] mb-1">
                Event Start Date & Time <span className="text-[#B97868]">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs text-[#292522]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#292522] mb-1">
                Event End Date & Time <span className="text-[#B97868]">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs text-[#292522]"
              />
            </div>
          </div>

          {/* Registration Window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#292522] mb-1">
                Registration Start <span className="text-[#B97868]">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={registrationStart}
                onChange={(e) => setRegistrationStart(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs text-[#292522]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#292522] mb-1">
                Registration Deadline <span className="text-[#B97868]">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={registrationEnd}
                onChange={(e) => setRegistrationEnd(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs text-[#292522]"
              />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-xs font-semibold text-[#292522] mb-1">
              Attendee Capacity <span className="text-[#B97868]">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs sm:text-sm text-[#292522]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E7DED4] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#F8F5F0] hover:bg-[#E7DED4] text-[#292522] text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || venuesLoading}
              className="px-6 py-2.5 rounded-xl bg-[#B97868] hover:bg-[#A66859] active:bg-[#975C4E] text-[#FFFDF9] text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#FFFDF9]/30 border-t-[#FFFDF9] rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Create Event'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
