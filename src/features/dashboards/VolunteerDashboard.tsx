import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../api/client.js';
import {
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calendar,
  ClipboardList,
} from 'lucide-react';

interface VolunteerDashboardProps {
  activeTab?: string;
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = () => {
  const { user } = useAuth();
  const [duties, setDuties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDuties = async () => {
    setLoading(true);
    const res = await apiClient<{ duties: any[] }>('/api/volunteers/me');
    if (res.success && res.data) {
      setDuties(res.data.duties);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDuties();
  }, []);

  const handleCheckIn = async (dutyId: string) => {
    setCheckingInId(dutyId);
    setError(null);

    const res = await apiClient(`/api/volunteers/${dutyId}/check-in`, {
      method: 'POST',
    });

    setCheckingInId(null);

    if (res.success) {
      setNotification('You have successfully checked in for this duty shift!');
      fetchDuties();
      setTimeout(() => setNotification(null), 3500);
    } else {
      setError(res.error?.message || 'Check-in failed');
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Flexible Schedule';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const checkedInCount = duties.filter((d) => d.isCheckedIn).length;

  return (
    <div className="space-y-6">
      {/* VOLUNTEER DASHBOARD HEADER */}
      <div className="bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#C6A15B]"></span>
            <span>Operations Staff</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1713]">
            Duty Desk & Logistics — {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#786B61] max-w-xl">
            View assigned duty stations, check in for shifts, and support collegiate event coordination on-site.
          </p>
        </div>

        <div className="text-right bg-[#FBF7EF] px-4 py-3 rounded-2xl border border-[#E6D8C3] shrink-0">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#786B61]">Volunteer Roster</div>
          <div className="text-xs font-bold text-[#1F1713] mt-0.5">
            {user?.profileInfo?.studentId || 'VOL-305'} • {user?.profileInfo?.department || 'Operations'}
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-[#71866F]/10 border border-[#71866F]/30 text-[#71866F] text-xs flex items-center gap-2 font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#71866F]" />
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#786B61]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Assigned Shifts</span>
            <Calendar className="w-4 h-4 text-[#C6A15B]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F1713]">{duties.length} Shifts</div>
          <div className="text-[11px] text-[#786B61]">Confirmed duties</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#786B61]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Completed Check-Ins</span>
            <CheckCircle2 className="w-4 h-4 text-[#71866F]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F1713]">
            {checkedInCount} / {duties.length}
          </div>
          <div className="text-[11px] text-[#71866F] font-medium">Duty presence confirmed</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#786B61]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Operational Status</span>
            <ShieldCheck className="w-4 h-4 text-[#B58A3A]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#1F1713]">Active</div>
          <div className="text-[11px] text-[#71866F] font-medium">Ready for on-site duties</div>
        </div>
      </div>

      {/* DUTY SHIFTS LIST */}
      <div className="bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-[#E6D8C3] pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1F1713]">My Assigned Duty Shifts</h3>
            <p className="text-xs text-[#786B61]">Check in when you arrive at your designated campus event station</p>
          </div>

          <button
            onClick={fetchDuties}
            disabled={loading}
            className="p-2 rounded-xl bg-[#FBF7EF] hover:bg-[#F7F0E3] text-[#786B61] border border-[#E6D8C3] transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#C6A15B]' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#786B61] space-y-2">
            <div className="w-6 h-6 border-2 border-[#E6D8C3] border-t-[#C6A15B] rounded-full animate-spin mx-auto"></div>
            <div>Loading assigned shifts...</div>
          </div>
        ) : duties.length === 0 ? (
          <div className="text-center py-16 px-6 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] space-y-3">
            <ClipboardList className="w-10 h-10 text-[#E6D8C3] mx-auto" />
            <h4 className="text-base font-bold text-[#1F1713]">No volunteer shifts assigned</h4>
            <p className="text-xs text-[#786B61] max-w-sm mx-auto">
              Event organizers will allocate logistics, check-in desk, and usher shifts as events approach.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {duties.map((duty) => {
              const event = typeof duty.eventId === 'object' ? duty.eventId : null;
              const eventTitle = event ? event.title : `Event #${duty.eventId}`;
              const venueName =
                event && typeof event.primaryVenueId === 'object' && event.primaryVenueId?.name
                  ? event.primaryVenueId.name
                  : null;

              return (
                <div
                  key={duty._id || duty.id}
                  className="p-5 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] space-y-4 flex flex-col justify-between hover:border-[#C6A15B]/50 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3]">
                        {duty.roleDescription || 'Logistics Staff'}
                      </span>
                      {duty.isCheckedIn ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#71866F]/10 text-[#71866F] border border-[#71866F]/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#71866F]" /> Checked In
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3]">
                          Pending Check-In
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-base text-[#1F1713]">{eventTitle}</h4>

                    <div className="space-y-1.5 text-xs text-[#786B61]">
                      {venueName && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
                          <span>Station: {venueName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" />
                        <span>Shift: {formatDateTime(duty.shiftStart)} - {formatDateTime(duty.shiftEnd)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E6D8C3]/70">
                    {duty.isCheckedIn ? (
                      <div className="text-[11px] text-[#71866F] font-medium flex items-center gap-1.5 py-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Checked in at {new Date(duty.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(duty._id || duty.id)}
                        disabled={checkingInId === (duty._id || duty.id)}
                        className="w-full py-2.5 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] text-xs font-bold shadow-xs hover:shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {checkingInId === (duty._id || duty.id) ? (
                          <div className="w-4 h-4 border-2 border-[#FFFDF8]/30 border-t-[#FFFDF8] rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Check In for Shift</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
