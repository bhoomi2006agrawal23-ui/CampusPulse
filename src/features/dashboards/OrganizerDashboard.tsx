import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../api/client.js';
import { EventItem } from '../events/EventCard.js';
import { EventFormModal } from '../events/EventFormModal.js';
import { ParticipantRosterModal } from '../events/ParticipantRosterModal.js';
import { EventDetailsModal } from '../events/EventDetailsModal.js';
import { VolunteerManagementModal } from '../volunteers/VolunteerManagementModal.js';
import { JudgeManagementModal } from '../judges/JudgeManagementModal.js';
import { ScheduleFormModal } from '../schedules/ScheduleFormModal.js';
import { OrganizerResultsModal } from '../results/OrganizerResultsModal.js';
import { OrganizerAttendanceModal } from '../attendance/OrganizerAttendanceModal.js';
import { OrganizerCertificateModal } from '../certificates/OrganizerCertificateModal.js';
import { OrganizerAnnouncementModal } from '../announcements/OrganizerAnnouncementModal.js';
import { OrganizerReportModal } from '../reports/OrganizerReportModal.js';
import {
  Calendar,
  Users,
  MapPin,
  Plus,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Edit3,
  Award,
  Clock,
  Trophy,
  Megaphone,
  FileText,
  CheckSquare,
  Trash2,
} from 'lucide-react';

interface OrganizerDashboardProps {
  activeTab?: string;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [selectedRosterEvent, setSelectedRosterEvent] = useState<EventItem | null>(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDetailsEvent, setSelectedDetailsEvent] = useState<EventItem | null>(null);

  // Volunteer & Judge Modals
  const [volModalOpen, setVolModalOpen] = useState(false);
  const [selectedVolEvent, setSelectedVolEvent] = useState<EventItem | null>(null);

  const [judgeModalOpen, setJudgeModalOpen] = useState(false);
  const [selectedJudgeEvent, setSelectedJudgeEvent] = useState<EventItem | null>(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedSchedEvent, setSelectedSchedEvent] = useState<EventItem | null>(null);

  // Operations Modals
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedResultsEvent, setSelectedResultsEvent] = useState<EventItem | null>(null);

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedAttEvent, setSelectedAttEvent] = useState<EventItem | null>(null);

  const [certModalOpen, setCertModalOpen] = useState(false);
  const [selectedCertEvent, setSelectedCertEvent] = useState<EventItem | null>(null);

  const [annModalOpen, setAnnModalOpen] = useState(false);
  const [selectedAnnEvent, setSelectedAnnEvent] = useState<EventItem | null>(null);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReportEvent, setSelectedReportEvent] = useState<EventItem | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const catRes = await apiClient<{ categories: any[] }>('/api/categories');
    if (catRes.success && catRes.data) setCategories(catRes.data.categories);

    const venRes = await apiClient<{ venues: any[] }>('/api/venues');
    if (venRes.success && venRes.data) setVenues(venRes.data.venues);

    const evRes = await apiClient<{ events: EventItem[] }>('/api/events');
    if (evRes.success && evRes.data) {
      setEvents(evRes.data.events);
    } else {
      setError(evRes.error?.message || 'Failed to fetch events');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateNew = () => {
    setEditingEvent(null);
    setFormModalOpen(true);
  };

  const handleEdit = (ev: EventItem) => {
    setEditingEvent(ev);
    setFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    setFormModalOpen(false);
    setNotification(editingEvent ? 'Event updated successfully' : 'Event created successfully');
    fetchData();
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDeleteEvent = async (ev: EventItem) => {
    const evId = ev._id || ev.id || '';
    const confirm = window.confirm(
      `Are you sure you want to delete or cancel event "${ev.title}"?\n\nIf participants are already registered, the event will be safely transitioned to "Cancelled" to preserve records. If no one has registered yet, the draft event will be permanently deleted.`
    );
    if (!confirm) return;

    setError(null);
    const res = await apiClient<{ action: string; message: string; event?: any }>(
      `/api/events/${evId}`,
      { method: 'DELETE' }
    );

    if (res.success) {
      setNotification(res.data?.message || 'Event status updated.');
      fetchData();
      setTimeout(() => setNotification(null), 4000);
    } else {
      setError(res.error?.message || 'Failed to delete or cancel event.');
    }
  };

  const totalRegistrations = events.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RegistrationOpen':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#71866F]/10 text-[#71866F] border border-[#71866F]/20">
            Registration Open
          </span>
        );
      case 'Published':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3]">
            Published
          </span>
        );
      case 'RegistrationClosed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FBF7EF] text-[#786B61] border border-[#E6D8C3]">
            Registration Closed
          </span>
        );
      case 'EventUpcoming':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3]">
            Upcoming
          </span>
        );
      case 'EventOngoing':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#71866F]/15 text-[#71866F] border border-[#71866F]/30 animate-pulse">
            Live Now
          </span>
        );
      case 'EventCompleted':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FBF7EF] text-[#786B61] border border-[#E6D8C3]">
            Completed
          </span>
        );
      case 'ResultsPublished':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3]">
            Results Published
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#A9675D]/10 text-[#A9675D] border border-[#A9675D]/20">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FBF7EF] text-[#786B61] border border-[#E6D8C3]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#C6A15B]"></span>
              <span>Faculty Operations Workspace</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1713]">
              Manage your campus events
            </h1>
            <p className="text-xs sm:text-sm text-[#786B61] max-w-xl">
              Coordinate event registrations, schedules, volunteer assignments, scoring panels, and verify merit certificates.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleCreateNew}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {notification && (
        <div className="p-4 rounded-2xl bg-[#71866F]/10 border border-[#71866F]/30 text-[#71866F] text-xs flex items-center gap-2 font-semibold shadow-xs">
          <CheckCircle className="w-4 h-4 text-[#71866F]" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-[#A9675D]/10 border border-[#A9675D]/30 text-[#A9675D] text-xs flex items-center gap-2 font-semibold shadow-xs">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#786B61]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Events</span>
            <Calendar className="w-4 h-4 text-[#C6A15B]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F1713]">{events.length}</div>
          <div className="text-[11px] text-[#786B61]">Under management</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#786B61]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Registrations</span>
            <Users className="w-4 h-4 text-[#71866F]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F1713]">{totalRegistrations}</div>
          <div className="text-[11px] text-[#71866F] font-medium">Enrolled participants</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#786B61]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Campus Venues</span>
            <MapPin className="w-4 h-4 text-[#B58A3A]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F1713]">{venues.length}</div>
          <div className="text-[11px] text-[#786B61]">Available facilities</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#786B61]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Categories</span>
            <Trophy className="w-4 h-4 text-[#C6A15B]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F1713]">{categories.length}</div>
          <div className="text-[11px] text-[#786B61]">Specialized tracks</div>
        </div>
      </div>

      {/* MANAGED EVENTS TABLE */}
      <div className="bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#E6D8C3] pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F1713]">Events Management Roster</h2>
            <p className="text-xs text-[#786B61]">Lifecycle actions, attendance tracking, scoring, and certificate issuance</p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-[#FBF7EF] hover:bg-[#F7F0E3] text-[#2B211C] border border-[#E6D8C3] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C6A15B]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 px-6 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] space-y-3">
            <Calendar className="w-10 h-10 text-[#E6D8C3] mx-auto" />
            <h4 className="text-base font-bold text-[#1F1713]">Create your first event</h4>
            <p className="text-xs text-[#786B61] max-w-sm mx-auto">
              Start by creating your first campus event to open registrations for students.
            </p>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 rounded-xl bg-[#C6A15B] text-[#FFFDF8] text-xs font-semibold shadow-2xs hover:bg-[#B58A3A] transition-colors cursor-pointer"
            >
              + Create Event
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBF7EF] text-[#786B61] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3.5 rounded-l-xl">Event</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5">Capacity</th>
                  <th className="py-3 px-3.5">Operations & Desks</th>
                  <th className="py-3 px-3.5 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6D8C3]">
                {events.map((ev) => {
                  const evId = ev._id || ev.id || '';

                  return (
                    <tr key={evId} className="hover:bg-[#FBF7EF]/70 transition-colors">
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-[#1F1713] text-xs">{ev.title}</div>
                        <div className="text-[10px] text-[#786B61] font-mono">{ev.eventCode}</div>
                      </td>

                      <td className="py-3.5 px-3.5">{getStatusBadge(ev.status)}</td>

                      <td className="py-3.5 px-3.5">
                        <span className="font-mono text-xs font-semibold text-[#2B211C]">
                          {ev.registeredCount} / {ev.capacity}
                        </span>
                      </td>

                      {/* Operation Desks Buttons */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Attendance Desk */}
                          <button
                            onClick={() => {
                              setSelectedAttEvent(ev);
                              setAttendanceModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#71866F]/10 hover:bg-[#71866F]/20 text-[#71866F] text-[11px] font-semibold border border-[#71866F]/30 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Attendance Tracking"
                          >
                            <CheckSquare className="w-3 h-3 text-[#71866F]" />
                            <span>Attendance</span>
                          </button>

                          {/* Results Desk */}
                          <button
                            onClick={() => {
                              setSelectedResultsEvent(ev);
                              setResultsModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#FBF7EF] hover:bg-[#F7F0E3] text-[#B58A3A] text-[11px] font-semibold border border-[#E6D8C3] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Results & Scoring"
                          >
                            <Trophy className="w-3 h-3 text-[#B58A3A]" />
                            <span>Results</span>
                          </button>

                          {/* Certificates Desk */}
                          <button
                            onClick={() => {
                              setSelectedCertEvent(ev);
                              setCertModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#FFFDF8] hover:bg-[#FBF7EF] text-[#C6A15B] text-[11px] font-semibold border border-[#E6D8C3] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Issue Certificates"
                          >
                            <Award className="w-3 h-3 text-[#C6A15B]" />
                            <span>Certs</span>
                          </button>

                          {/* Roster Desk */}
                          <button
                            onClick={() => {
                              setSelectedRosterEvent(ev);
                              setRosterModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#FBF7EF] hover:bg-[#F7F0E3] text-[#786B61] text-[11px] font-semibold border border-[#E6D8C3] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Participant Roster"
                          >
                            <Users className="w-3 h-3 text-[#786B61]" />
                            <span>Roster</span>
                          </button>

                          {/* Bulletins */}
                          <button
                            onClick={() => {
                              setSelectedAnnEvent(ev);
                              setAnnModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#FBF7EF] hover:bg-[#F7F0E3] text-[#786B61] text-[11px] font-semibold border border-[#E6D8C3] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Announcements"
                          >
                            <Megaphone className="w-3 h-3 text-[#786B61]" />
                            <span>Bulletins</span>
                          </button>

                          {/* Reports */}
                          <button
                            onClick={() => {
                              setSelectedReportEvent(ev);
                              setReportModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#FBF7EF] hover:bg-[#F7F0E3] text-[#786B61] text-[11px] font-semibold border border-[#E6D8C3] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Event Report"
                          >
                            <FileText className="w-3 h-3 text-[#786B61]" />
                            <span>Report</span>
                          </button>
                        </div>
                      </td>

                      {/* Manage Actions */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedVolEvent(ev);
                              setVolModalOpen(true);
                            }}
                            title="Manage Volunteers"
                            className="p-1.5 rounded-lg bg-[#FBF7EF] hover:bg-[#F7F0E3] text-[#786B61] border border-[#E6D8C3] transition-colors cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedJudgeEvent(ev);
                              setJudgeModalOpen(true);
                            }}
                            title="Manage Judges"
                            className="p-1.5 rounded-lg bg-[#FBF7EF] hover:bg-[#F7F0E3] text-[#786B61] border border-[#E6D8C3] transition-colors cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedSchedEvent(ev);
                              setScheduleModalOpen(true);
                            }}
                            title="Event Schedule"
                            className="p-1.5 rounded-lg bg-[#FBF7EF] hover:bg-[#F7F0E3] text-[#786B61] border border-[#E6D8C3] transition-colors cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleEdit(ev)}
                            title="Edit Event"
                            className="p-1.5 rounded-lg bg-[#FFF8E7] hover:bg-[#D8C3A5]/40 text-[#2B211D] border border-[#D8C3A5] transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteEvent(ev)}
                            title="Cancel or Delete Event"
                            className="p-1.5 rounded-lg bg-[#FFF8E7] hover:bg-[#8B2635]/15 text-[#8B2635] border border-[#D8C3A5] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <EventFormModal
        event={editingEvent}
        isOpen={formModalOpen}
        categories={categories}
        venues={venues}
        onClose={() => setFormModalOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {selectedRosterEvent && (
        <ParticipantRosterModal
          eventId={selectedRosterEvent._id || selectedRosterEvent.id || ''}
          eventTitle={selectedRosterEvent.title}
          isOpen={rosterModalOpen}
          onClose={() => setRosterModalOpen(false)}
        />
      )}

      {selectedDetailsEvent && (
        <EventDetailsModal
          event={selectedDetailsEvent}
          isOpen={detailsModalOpen}
          userRole="Organizer"
          onClose={() => setDetailsModalOpen(false)}
          onRegisterClick={() => {}}
        />
      )}

      {selectedVolEvent && (
        <VolunteerManagementModal
          eventId={selectedVolEvent._id || selectedVolEvent.id || ''}
          eventTitle={selectedVolEvent.title}
          isOpen={volModalOpen}
          onClose={() => setVolModalOpen(false)}
        />
      )}

      {selectedJudgeEvent && (
        <JudgeManagementModal
          eventId={selectedJudgeEvent._id || selectedJudgeEvent.id || ''}
          eventTitle={selectedJudgeEvent.title}
          isOpen={judgeModalOpen}
          onClose={() => setJudgeModalOpen(false)}
        />
      )}

      {selectedSchedEvent && (
        <ScheduleFormModal
          eventId={selectedSchedEvent._id || selectedSchedEvent.id || ''}
          venues={venues}
          isOpen={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          onSuccess={() => {
            setNotification('Schedule updated');
            setTimeout(() => setNotification(null), 3000);
          }}
        />
      )}

      {selectedResultsEvent && (
        <OrganizerResultsModal
          eventId={selectedResultsEvent._id || selectedResultsEvent.id || ''}
          eventTitle={selectedResultsEvent.title}
          isOpen={resultsModalOpen}
          onClose={() => setResultsModalOpen(false)}
        />
      )}

      {selectedAttEvent && (
        <OrganizerAttendanceModal
          eventId={selectedAttEvent._id || selectedAttEvent.id || ''}
          eventTitle={selectedAttEvent.title}
          isOpen={attendanceModalOpen}
          onClose={() => setAttendanceModalOpen(false)}
        />
      )}

      {selectedCertEvent && (
        <OrganizerCertificateModal
          eventId={selectedCertEvent._id || selectedCertEvent.id || ''}
          eventTitle={selectedCertEvent.title}
          isOpen={certModalOpen}
          onClose={() => setCertModalOpen(false)}
          onSuccess={() => {
            setNotification('Certificates generated');
            setTimeout(() => setNotification(null), 3000);
          }}
        />
      )}

      {selectedAnnEvent && (
        <OrganizerAnnouncementModal
          eventId={selectedAnnEvent._id || selectedAnnEvent.id || ''}
          eventTitle={selectedAnnEvent.title}
          isOpen={annModalOpen}
          onClose={() => setAnnModalOpen(false)}
          onSuccess={() => {
            setNotification('Announcement published');
            setTimeout(() => setNotification(null), 3000);
          }}
        />
      )}

      {selectedReportEvent && (
        <OrganizerReportModal
          eventId={selectedReportEvent._id || selectedReportEvent.id || ''}
          eventTitle={selectedReportEvent.title}
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
        />
      )}
    </div>
  );
};
