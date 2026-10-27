import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../api/client.js';
import { EventItem } from '../events/EventCard.js';
import { EventDetailsModal } from '../events/EventDetailsModal.js';
import { CertificateViewModal } from '../certificates/CertificateViewModal.js';
import { getEventImageUrl } from '../../utils/imageAssets.js';
import {
  Calendar,
  Ticket,
  Award,
  Clock,
  CheckCircle2,
  Eye,
  MapPin,
  Megaphone,
  Trophy,
  ShieldCheck,
} from 'lucide-react';

interface StudentDashboardProps {
  activeTab?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ activeTab: initialTab }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'registrations' | 'certificates' | 'results' | 'announcements'>('registrations');
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [, setError] = useState<string | null>(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [certModalOpen, setCertModalOpen] = useState(false);

  useEffect(() => {
    if (initialTab && ['registrations', 'certificates', 'results', 'announcements'].includes(initialTab)) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [regsRes, certsRes, resultsRes, annRes] = await Promise.all([
        apiClient<{ registrations: any[] }>('/registrations/me'),
        apiClient<{ certificates: any[] }>('/certificates/me'),
        apiClient<{ results: any[] }>('/results/me'),
        apiClient<{ announcements: any[] }>('/announcements'),
      ]);

      if (regsRes.success && regsRes.data) setRegistrations(regsRes.data.registrations);
      if (certsRes.success && certsRes.data) setCertificates(certsRes.data.certificates);
      if (resultsRes.success && resultsRes.data) setResults(resultsRes.data.results);
      if (annRes.success && annRes.data) setAnnouncements(annRes.data.announcements);
    } catch {
      setError('Failed to refresh student portal data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelRegistration = async (eventId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to cancel your registration for this event? Your seat will be freed up for other students.'
      )
    ) {
      return;
    }

    const res = await apiClient(`/events/${eventId}/register`, {
      method: 'DELETE',
    });

    if (res.success) {
      setNotification('Registration cancelled successfully. Your seat has been released.');
      setDetailsModalOpen(false);
      fetchData();
      setTimeout(() => setNotification(null), 3500);
    } else {
      alert(res.error?.message || 'Failed to cancel registration');
    }
  };

  const formatEventDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
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

  const getAttendanceBadge = (status?: string) => {
    switch (status) {
      case 'Attended':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#71866F]/10 text-[#71866F] border border-[#71866F]/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Attended
          </span>
        );
      case 'Absent':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#A9675D]/10 text-[#A9675D] border border-[#A9675D]/20 flex items-center gap-1">
            Absent
          </span>
        );
      case 'Excused':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3] flex items-center gap-1">
            Excused
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FBF7EF] text-[#786B61] border border-[#E6D8C3] flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#C6A15B]" /> Pass Active
          </span>
        );
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* WELCOME SECTION */}
      <div className="bg-[#FFFCF5] rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF8E7] text-[#5A1E2D] border border-[#D8C3A5] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#5A1E2D]"></span>
              <span>Student Hub</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2B211D]">
              {getTimeGreeting()}, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#857568] max-w-xl">
              Stay connected with everything happening on campus. Track your registered events, access digital passes, and view verified merit credentials.
            </p>
          </div>

          <div className="text-right bg-[#FFF8E7] px-4 py-3 rounded-2xl border border-[#D8C3A5] shrink-0">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#857568]">Student Identification</div>
            <div className="text-xs font-bold text-[#2B211D] mt-0.5">
              {user?.profileInfo?.studentId || 'STU-2026'} • {user?.profileInfo?.department || 'Undergraduate'}
            </div>
            {user?.collegeName && (
              <div className="text-[10px] text-[#5A1E2D] font-medium mt-0.5">{user.collegeName}</div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="p-4 rounded-2xl bg-[#3D6A4E]/10 border border-[#3D6A4E]/30 text-[#3D6A4E] text-xs flex items-center justify-between font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#3D6A4E]" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-[#3D6A4E] hover:opacity-75 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#FFFCF5] border border-[#D8C3A5] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#857568]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Registered Events</span>
            <Ticket className="w-4 h-4 text-[#5A1E2D]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#2B211D]">{registrations.length}</div>
          <div className="text-[11px] text-[#3D6A4E] font-medium">Digital passes issued</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFCF5] border border-[#D8C3A5] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#857568]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Upcoming Events</span>
            <Calendar className="w-4 h-4 text-[#5A1E2D]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#2B211D]">
            {registrations.filter((r) => r.attendanceStatus !== 'Attended').length}
          </div>
          <div className="text-[11px] text-[#857568]">Scheduled on calendar</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFCF5] border border-[#D8C3A5] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#857568]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Certificates</span>
            <Award className="w-4 h-4 text-[#5A1E2D]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#2B211D]">{certificates.length}</div>
          <div className="text-[11px] text-[#3D6A4E] font-medium">Verified credentials</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFCF5] border border-[#D8C3A5] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#857568]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Bulletins</span>
            <Megaphone className="w-4 h-4 text-[#5A1E2D]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#2B211D]">{announcements.length}</div>
          <div className="text-[11px] text-[#857568]">Campus notices</div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 p-1 bg-[#FFF8E7] border border-[#D8C3A5] rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('registrations')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'registrations'
              ? 'bg-[#5A1E2D] text-[#FFF8E7] shadow-2xs'
              : 'text-[#857568] hover:text-[#2B211D]'
          }`}
        >
          My Registrations ({registrations.length})
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'certificates'
              ? 'bg-[#5A1E2D] text-[#FFF8E7] shadow-2xs'
              : 'text-[#857568] hover:text-[#2B211D]'
          }`}
        >
          Certificates ({certificates.length})
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'results'
              ? 'bg-[#5A1E2D] text-[#FFF8E7] shadow-2xs'
              : 'text-[#857568] hover:text-[#2B211D]'
          }`}
        >
          Standings & Results ({results.length})
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-[#5A1E2D] text-[#FFF8E7] shadow-2xs'
              : 'text-[#857568] hover:text-[#2B211D]'
          }`}
        >
          Bulletins ({announcements.length})
        </button>
      </div>

      {/* TAB CONTENT: REGISTRATIONS */}
      {activeTab === 'registrations' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#786B61]">Loading registrations...</div>
          ) : registrations.length === 0 ? (
            <div className="py-16 text-center bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-8 space-y-3">
              <Ticket className="w-10 h-10 text-[#E6D8C3] mx-auto" />
              <h3 className="text-base font-bold text-[#1F1713]">No event registrations yet</h3>
              <p className="text-xs text-[#786B61] max-w-sm mx-auto">
                Explore upcoming campus hackathons, workshops, and sports tournaments to claim your student entry pass.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registrations.map((reg) => {
                const event = typeof reg.eventId === 'object' ? reg.eventId : null;
                if (!event) return null;
                const venueName =
                  typeof event.primaryVenueId === 'object' && event.primaryVenueId?.name
                    ? event.primaryVenueId.name
                    : null;
                const eventImg = getEventImageUrl(event);

                return (
                  <div
                    key={reg._id || reg.id}
                    className="bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Ticket Header Image */}
                      <div className="h-36 w-full overflow-hidden bg-[#FBF7EF] relative">
                        <img
                          src={eventImg}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1F1713]/60 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className="text-[10px] font-mono font-bold bg-[#FFFDF8]/95 px-2.5 py-1 rounded-full text-[#1F1713] border border-[#E6D8C3]">
                            Ticket: {reg.ticketCode}
                          </span>
                        </div>
                        <div className="absolute bottom-2.5 right-3">
                          {getAttendanceBadge(reg.attendanceStatus)}
                        </div>
                      </div>

                      {/* Ticket Body */}
                      <div className="p-5 space-y-3">
                        <h3 className="font-bold text-base text-[#1F1713] line-clamp-1">
                          {event.title}
                        </h3>

                        <div className="space-y-1.5 text-xs text-[#786B61]">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
                            <span>{formatEventDate(event.startDateTime)}</span>
                          </div>
                          {venueName && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
                              <span>{venueName}</span>
                            </div>
                          )}
                        </div>

                        {reg.notes && (
                          <div className="p-2.5 rounded-xl bg-[#FBF7EF] border border-[#E6D8C3] text-[11px] text-[#786B61]">
                            <span className="font-semibold text-[#1F1713]">Notes:</span> {reg.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ticket Footer Action */}
                    <div className="p-5 pt-0 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedEvent(event);
                          setDetailsModalOpen(true);
                        }}
                        className="flex-1 py-2 rounded-xl bg-[#FBF7EF] hover:bg-[#F7F0E3] text-[#2B211C] text-xs font-semibold border border-[#E6D8C3] transition-colors cursor-pointer text-center"
                      >
                        Event Details
                      </button>
                      <button
                        onClick={() => handleCancelRegistration(event._id || event.id)}
                        className="py-2 px-3 rounded-xl border border-[#E6D8C3] text-[#A9675D] hover:bg-[#A9675D]/10 text-xs font-medium transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          {certificates.length === 0 ? (
            <div className="py-16 text-center bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-8 space-y-3">
              <Award className="w-10 h-10 text-[#E6D8C3] mx-auto" />
              <h3 className="text-base font-bold text-[#1F1713]">No certificates issued yet</h3>
              <p className="text-xs text-[#786B61] max-w-sm mx-auto">
                Official certificates of merit and participation are awarded after events conclude.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => {
                const event = typeof cert.eventId === 'object' ? cert.eventId : null;

                return (
                  <div
                    key={cert._id || cert.id}
                    className="bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-6 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3]">
                          {cert.certificateType}
                        </span>
                        <span className="text-[10px] font-mono text-[#71866F] flex items-center gap-1 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-[#1F1713]">
                        {event ? event.title : 'Collegiate Event Certificate'}
                      </h3>

                      <div className="text-xs text-[#786B61] space-y-1 font-mono text-[11px]">
                        <div>ID: {cert.certificateId}</div>
                        <div>Issued: {new Date(cert.issueDate).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCert({
                          ...cert,
                          recipientName: user?.name || 'Student',
                          eventName: event?.title || 'Collegiate Event',
                        });
                        setCertModalOpen(true);
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View & Print Credential</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: RESULTS */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="py-16 text-center bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-8 space-y-3">
              <Trophy className="w-10 h-10 text-[#E6D8C3] mx-auto" />
              <h3 className="text-base font-bold text-[#1F1713]">No results published yet</h3>
              <p className="text-xs text-[#786B61] max-w-sm mx-auto">
                Evaluator scorecards and finalist ranks appear here once event coordinators publish results.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((res) => {
                const event = typeof res.eventId === 'object' ? res.eventId : null;

                return (
                  <div
                    key={res._id || res.id}
                    className="p-5 rounded-3xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#B58A3A] uppercase tracking-wider">
                        {event ? event.title : 'Competition Result'}
                      </span>
                      {res.rank && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3]">
                          Rank #{res.rank}
                        </span>
                      )}
                    </div>

                    <div className="text-2xl font-bold text-[#1F1713]">
                      Score: {res.score} <span className="text-xs font-normal text-[#786B61]">pts</span>
                    </div>

                    {res.feedback && (
                      <p className="text-xs text-[#786B61] p-3 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3]">
                        "{res.feedback}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="py-16 text-center bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-8 space-y-3">
              <Megaphone className="w-10 h-10 text-[#E6D8C3] mx-auto" />
              <h3 className="text-base font-bold text-[#1F1713]">No campus notices yet</h3>
              <p className="text-xs text-[#786B61] max-w-sm mx-auto">
                Official coordinator bulletins and schedule updates will appear in this feed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann._id || ann.id}
                  className="p-5 rounded-3xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F1713]">{ann.title}</span>
                    <span className="text-[10px] text-[#786B61] font-mono">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-[#786B61] leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={detailsModalOpen}
        isRegistered={true}
        userRole="Student"
        onClose={() => setDetailsModalOpen(false)}
        onRegisterClick={() => {}}
        onCancelRegistration={handleCancelRegistration}
      />

      <CertificateViewModal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        certificate={selectedCert}
      />
    </div>
  );
};
