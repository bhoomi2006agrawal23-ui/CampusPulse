import React, { useState, useEffect } from 'react';
import { EventItem, EventCard } from './EventCard.js';
import { EventDetailsModal } from './EventDetailsModal.js';
import { RegistrationConfirmModal } from './RegistrationConfirmModal.js';
import { EventFormModal } from './EventFormModal.js';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../api/client.js';
import {
  Search,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Award,
} from 'lucide-react';

interface EventCatalogProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export const EventCatalog: React.FC<EventCatalogProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
}) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [eventToRegister, setEventToRegister] = useState<EventItem | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Feedback Notification
  const [notification, setNotification] = useState<string | null>(null);

  const isOrganizerOrAdmin = user && (user.role === 'Organizer' || user.role === 'Admin');

  const fetchEvents = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedVenue) params.set('venue', selectedVenue);
    if (selectedStatus) params.set('status', selectedStatus);
    params.set('page', String(page));
    params.set('limit', '9');

    const res = await apiClient<{ events: EventItem[] }>(`/api/events?${params.toString()}`);
    if (res.success && res.data) {
      setEvents(res.data.events);
      if (res.meta) {
        setTotalPages((res.meta.totalPages as number) || 1);
        setTotalCount((res.meta.total as number) || res.data.events.length);
      } else {
        setTotalCount(res.data.events.length);
      }
    }
    setLoading(false);
  };

  const fetchInitialData = async () => {
    const catRes = await apiClient<{ categories: any[] }>('/api/categories');
    if (catRes.success && catRes.data) setCategories(catRes.data.categories);

    const venRes = await apiClient<{ venues: any[] }>('/api/venues');
    if (venRes.success && venRes.data) setVenues(venRes.data.venues);

    if (user && user.role === 'Student') {
      const regRes = await apiClient<{ registrations: any[] }>('/api/registrations/me');
      if (regRes.success && regRes.data) {
        const regIds = regRes.data.registrations.map((r) =>
          typeof r.eventId === 'object' ? r.eventId._id || r.eventId.id : r.eventId
        );
        setMyRegistrations(regIds);
      }
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [page, selectedCategory, selectedVenue, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleOpenDetails = (event: EventItem) => {
    setSelectedEvent(event);
    setDetailsModalOpen(true);
  };

  const handleInitiateRegister = (event: EventItem) => {
    if (!user) {
      onNavigateToLogin();
      return;
    }
    if (user.role !== 'Student' && user.role !== 'Admin') {
      setNotification(`Only students can register for events. Your role is ${user.role}.`);
      setTimeout(() => setNotification(null), 3500);
      return;
    }
    setEventToRegister(event);
    setConfirmModalOpen(true);
  };

  const handleRegistrationSuccess = () => {
    setConfirmModalOpen(false);
    setDetailsModalOpen(false);
    const evId = eventToRegister?._id || eventToRegister?.id || '';
    setMyRegistrations((prev) => [...prev, evId]);
    setNotification('Registration confirmed! Your digital ticket pass is active.');
    fetchEvents();
    setTimeout(() => setNotification(null), 4000);
  };

  const scrollToCatalog = () => {
    const catalogElement = document.getElementById('event-catalog-section');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedCategory || selectedVenue || selectedStatus);

  return (
    <div className="space-y-12">
      {/* Toast Notification */}
      {notification && (
        <div className="p-4 rounded-2xl bg-[#71866F]/10 border border-[#71866F]/30 text-[#71866F] text-xs flex items-center justify-between shadow-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#71866F]" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-[#71866F] hover:opacity-75 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFFDF8] via-[#FBF7EF] to-[#F7F0E3] border border-[#E6D8C3] p-8 sm:p-12 lg:p-16 shadow-xs">
        {/* Subtle decorative gold glows */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#E2CF9F]/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 rounded-full bg-[#C6A15B]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFDF8] border border-[#E6D8C3] text-[#B58A3A] text-[11px] font-bold tracking-widest uppercase shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>CAMPUS EVENTS • CONNECT • PARTICIPATE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1F1713] leading-[1.12]">
              Where Campus Life <br />
              <span className="font-serif-accent font-semibold italic text-[#C6A15B]">Comes Alive.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#786B61] max-w-xl leading-relaxed">
              Discover competitions, workshops, seminars, fests and student activities happening across your campus.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={scrollToCatalog}
                className="px-6 py-3.5 rounded-2xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] font-bold text-sm shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Explore Events</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {isOrganizerOrAdmin && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-6 py-3.5 rounded-2xl bg-[#FFFDF8] hover:bg-[#FBF7EF] text-[#2B211C] font-semibold text-sm border border-[#E6D8C3] transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  <Plus className="w-4 h-4 text-[#C6A15B]" />
                  <span>Create an Event</span>
                </button>
              )}
            </div>

            {/* Quick stats highlight */}
            <div className="pt-6 border-t border-[#E6D8C3] grid grid-cols-3 gap-4 max-w-md text-left">
              <div>
                <div className="text-lg sm:text-xl font-bold text-[#2B211C]">{categories.length > 0 ? `${categories.length}` : 'Active'}</div>
                <div className="text-[11px] text-[#786B61]">Event Categories</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold text-[#2B211C]">{venues.length > 0 ? `${venues.length}` : 'Available'}</div>
                <div className="text-[11px] text-[#786B61]">Campus Venues</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold text-[#2B211C]">Verified</div>
                <div className="text-[11px] text-[#786B61]">Digital Credentials</div>
              </div>
            </div>
          </div>

          {/* Hero Visual Imagery */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              {/* Main Card */}
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-[#E6D8C3] bg-[#FFFDF8]">
                <img
                  src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80"
                  alt="College students participating in campus event"
                  className="w-full h-72 object-cover"
                />
                <div className="p-5 space-y-2 bg-[#FFFDF8]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#B58A3A]">CAMPUS SPOTLIGHT</span>
                    <span className="text-[11px] text-[#71866F] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#71866F]"></span> Live System
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-[#1F1713]">
                    Experience Collegiate Excellence
                  </h3>
                  <p className="text-xs text-[#786B61]">
                    Join departmental student activities, showcase projects, and earn verified credentials.
                  </p>
                </div>
              </div>

              {/* Floating micro-card badge */}
              <div className="absolute -bottom-4 -left-4 sm:-left-6 bg-[#FFFDF8]/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#E6D8C3] shadow-lg flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#E2CF9F]/40 text-[#B58A3A] flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#2B211C]">Verified Credentials</div>
                  <div className="text-[10px] text-[#786B61]">Instant certificate verification</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EVENT CATALOG & SEARCH */}
      <section id="event-catalog-section" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-[#E6D8C3] pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#B58A3A] mb-1">
              Events Directory
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1F1713] tracking-tight">
              Discover Campus Events
            </h2>
          </div>
          <div className="text-xs text-[#786B61]">
            {totalCount > 0 ? `${totalCount} events published` : 'Real-time schedule'}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-[#FFFDF8] rounded-2xl border border-[#E6D8C3] p-4 sm:p-5 shadow-2xs space-y-4">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#786B61] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by title, description, or event code..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs sm:text-sm text-[#2B211C] placeholder-[#786B61]/60 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B]"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              Search
            </button>
          </form>

          {/* Category Tabs & Filter Selects */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-[#E6D8C3]">
            {/* Category Segmented Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === ''
                    ? 'bg-[#C6A15B] text-[#FFFDF8] shadow-2xs'
                    : 'bg-[#FBF7EF] text-[#786B61] hover:text-[#2B211C] border border-[#E6D8C3]'
                }`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c._id || c.id}
                  onClick={() => {
                    setSelectedCategory(c._id || c.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === (c._id || c.id)
                      ? 'bg-[#C6A15B] text-[#FFFDF8] shadow-2xs'
                      : 'bg-[#FBF7EF] text-[#786B61] hover:text-[#2B211C] border border-[#E6D8C3]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Venues & Status dropdowns */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedVenue}
                onChange={(e) => {
                  setSelectedVenue(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-1 focus:ring-[#C6A15B] cursor-pointer"
              >
                <option value="">All Venues</option>
                {venues.map((v) => (
                  <option key={v._id || v.id} value={v._id || v.id}>
                    {v.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-1 focus:ring-[#C6A15B] cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="RegistrationOpen">Registration Open</option>
                <option value="Published">Published</option>
                <option value="RegistrationClosed">Registration Closed</option>
                <option value="EventUpcoming">Upcoming</option>
                <option value="EventOngoing">Ongoing</option>
                <option value="EventCompleted">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* EVENT EMPTY STATE OR DYNAMIC CARDS */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#E6D8C3] border-t-[#C6A15B] rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-[#786B61] font-medium">Loading campus events...</p>
          </div>
        ) : events.length === 0 ? (
          /* Empty state - strictly NO fake demo events! */
          <div className="py-16 px-6 text-center bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] max-w-2xl mx-auto space-y-4 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-[#FBF7EF] text-[#C6A15B] flex items-center justify-center mx-auto shadow-2xs border border-[#E6D8C3]/50">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#1F1713]">
              Your Campus Calendar Awaits
            </h3>
            <p className="text-xs sm:text-sm text-[#786B61] max-w-md mx-auto leading-relaxed">
              No events have been published yet. New competitions, workshops, seminars and activities will appear here once organizers publish them.
            </p>

            <div className="pt-2 flex flex-wrap justify-center items-center gap-3">
              {isOrganizerOrAdmin ? (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] text-xs font-semibold transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create an Event</span>
                </button>
              ) : (
                <div className="inline-flex items-center px-4 py-2 rounded-xl bg-[#FBF7EF] text-[#5A463B] text-xs font-medium border border-[#E6D8C3]">
                  Check Back Soon
                </div>
              )}

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                    setSelectedVenue('');
                    setSelectedStatus('');
                    setPage(1);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#F7F0E3] hover:bg-[#FBF7EF] text-[#786B61] hover:text-[#2B211C] text-xs font-medium border border-[#E6D8C3] transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Real dynamic event cards */
          <div className="space-y-6">
            <div className="flex justify-between items-center text-xs text-[#786B61]">
              <span>Showing {events.length} of {totalCount} events</span>
              <span>Page {page} of {totalPages}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev) => {
                const evId = ev._id || ev.id || '';
                const isRegistered = myRegistrations.includes(evId);

                return (
                  <EventCard
                    key={evId}
                    event={ev}
                    isRegistered={isRegistered}
                    onViewDetails={handleOpenDetails}
                    onRegisterClick={handleInitiateRegister}
                  />
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2.5 rounded-xl bg-[#FFFDF8] border border-[#E6D8C3] text-[#786B61] disabled:opacity-40 hover:bg-[#FBF7EF] transition-colors cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-[#2B211C] px-4">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2.5 rounded-xl bg-[#FFFDF8] border border-[#E6D8C3] text-[#786B61] disabled:opacity-40 hover:bg-[#FBF7EF] transition-colors cursor-pointer shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* EVENT DETAILS MODAL */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={detailsModalOpen}
        isRegistered={Boolean(selectedEvent && myRegistrations.includes(selectedEvent._id || selectedEvent.id || ''))}
        userRole={user?.role}
        onClose={() => setDetailsModalOpen(false)}
        onRegisterClick={handleInitiateRegister}
      />

      {/* REGISTRATION CONFIRM MODAL */}
      <RegistrationConfirmModal
        event={eventToRegister}
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onSuccess={handleRegistrationSuccess}
      />

      {/* CREATE EVENT MODAL FOR ORGANIZERS/ADMIN */}
      {isOrganizerOrAdmin && (
        <EventFormModal
          isOpen={createModalOpen}
          categories={categories}
          venues={venues}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={(newEvent) => {
            setCreateModalOpen(false);
            setNotification(`Event "${newEvent.title}" created successfully!`);
            fetchEvents();
            setTimeout(() => setNotification(null), 4000);
          }}
        />
      )}
    </div>
  );
};
