import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { Footer } from './components/Footer.js';
import { LoginForm } from './features/auth/LoginForm.js';
import { RegisterForm } from './features/auth/RegisterForm.js';
import { EventCatalog } from './features/events/EventCatalog.js';
import { StudentDashboard } from './features/dashboards/StudentDashboard.js';
import { OrganizerDashboard } from './features/dashboards/OrganizerDashboard.js';
import { JudgeDashboard } from './features/dashboards/JudgeDashboard.js';
import { VolunteerDashboard } from './features/dashboards/VolunteerDashboard.js';
import { AdminDashboard } from './features/dashboards/AdminDashboard.js';
import { apiClient } from './api/client.js';
import { CATEGORY_VISUALS } from './utils/imageAssets.js';
import {
  Users,
  Building,
  Plus,
} from 'lucide-react';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeDashboardTab, setActiveDashboardTab] = useState<string>('overview');
  const [categories, setCategories] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);

  useEffect(() => {
    // Load categories & venues for catalog preview
    apiClient<{ categories: any[] }>('/api/categories').then((res) => {
      if (res.success && res.data?.categories) {
        setCategories(res.data.categories);
      }
    });

    apiClient<{ venues: any[] }>('/api/venues').then((res) => {
      if (res.success && res.data?.venues) {
        setVenues(res.data.venues);
      }
    });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F0E3] flex items-center justify-center text-[#2B211C]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#E6D8C3] border-t-[#C6A15B] rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-[#786B61] font-medium tracking-wide">
            Loading CampusPulse...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F0E3] text-[#2B211C] flex flex-col font-sans selection:bg-[#E2CF9F] selection:text-[#1F1713]">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* VIEW: HOME / EVENT CATALOG */}
        {currentView === 'home' && (
          <EventCatalog
            onNavigateToLogin={() => setCurrentView('login')}
            onNavigateToRegister={() => setCurrentView('register')}
          />
        )}

        {/* VIEW: LOGIN */}
        {currentView === 'login' && (
          <div className="py-6">
            <LoginForm
              onSuccess={() => setCurrentView('dashboard')}
              onSwitchToRegister={() => setCurrentView('register')}
            />
          </div>
        )}

        {/* VIEW: REGISTER */}
        {currentView === 'register' && (
          <div className="py-6">
            <RegisterForm
              onSuccess={() => setCurrentView('dashboard')}
              onSwitchToLogin={() => setCurrentView('login')}
            />
          </div>
        )}

        {/* VIEW: DASHBOARD (WITH SIDEBAR & ROLE SHELL) */}
        {currentView === 'dashboard' && (
          <div>
            {!user ? (
              <div className="max-w-md mx-auto text-center py-12 space-y-4 bg-[#FFFDF8] p-8 rounded-3xl border border-[#E6D8C3] shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#FBF7EF] text-[#B58A3A] flex items-center justify-center mx-auto shadow-2xs border border-[#E6D8C3]/60">
                  <Building className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#1F1713]">Account Sign-In Required</h3>
                <p className="text-xs text-[#786B61]">
                  Sign in to access your personalized campus dashboard, ticket passes, and records.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setCurrentView('login')}
                    className="px-6 py-2.5 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Proceed to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Collapsible/Sticky Navigation Sidebar */}
                <div className="w-full lg:w-64 shrink-0">
                  <Sidebar
                    activeTab={activeDashboardTab}
                    setActiveTab={setActiveDashboardTab}
                  />
                </div>

                {/* Main Role Content View */}
                <div className="flex-1 w-full min-w-0">
                  {user.role === 'Student' && (
                    <StudentDashboard activeTab={activeDashboardTab} />
                  )}
                  {user.role === 'Organizer' && (
                    <OrganizerDashboard activeTab={activeDashboardTab} />
                  )}
                  {user.role === 'Judge' && (
                    <JudgeDashboard activeTab={activeDashboardTab} />
                  )}
                  {user.role === 'Volunteer' && (
                    <VolunteerDashboard activeTab={activeDashboardTab} />
                  )}
                  {user.role === 'Admin' && (
                    <AdminDashboard activeTab={activeDashboardTab} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: CATEGORIES */}
        {currentView === 'categories' && (
          <div className="space-y-6">
            <div className="border-b border-[#E6D8C3] pb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#B58A3A] mb-1">
                Taxonomy
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1F1713] tracking-tight">
                Event Categories & Tracks
              </h2>
              <p className="text-xs text-[#786B61] mt-1">
                Collegiate departments, inter-college leagues, hackathons, and symposium tracks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((cat) => {
                const slug = (cat.slug || cat.name || '').toLowerCase();
                const visual =
                  slug.includes('hack')
                    ? CATEGORY_VISUALS.hackathons
                    : slug.includes('work')
                    ? CATEGORY_VISUALS.workshops
                    : slug.includes('cultur')
                    ? CATEGORY_VISUALS.cultural
                    : slug.includes('sport')
                    ? CATEGORY_VISUALS.sports
                    : slug.includes('tech')
                    ? CATEGORY_VISUALS.tech
                    : CATEGORY_VISUALS.general;

                return (
                  <div
                    key={cat._id || cat.id}
                    className="group bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] overflow-hidden flex flex-col justify-between hover:border-[#C6A15B]/50 hover:shadow-md transition-all duration-300"
                  >
                    <div>
                      <div className="relative h-40 w-full overflow-hidden bg-[#FBF7EF]">
                        <img
                          src={visual.imageUrl}
                          alt={cat.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1F1713]/60 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3.5 right-3.5 flex justify-between items-end">
                          <span className="text-[11px] font-bold text-[#FFFDF8]">
                            {cat.code || cat.slug?.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-2">
                        <h3 className="font-bold text-base text-[#1F1713] group-hover:text-[#C6A15B] transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-[#786B61] leading-relaxed line-clamp-2">
                          {cat.description || 'Official campus competition and workshop category track.'}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <button
                        onClick={() => setCurrentView('home')}
                        className="w-full py-2 px-3 rounded-xl bg-[#FBF7EF] hover:bg-[#F7F0E3] text-[#2B211C] text-xs font-semibold border border-[#E6D8C3] transition-colors cursor-pointer"
                      >
                        Explore Events
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW: VENUES */}
        {currentView === 'venues' && (
          <div className="space-y-6">
            <div className="border-b border-[#E6D8C3] pb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#B58A3A] mb-1">
                Facilities
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1F1713] tracking-tight">
                Campus Venues & Locations
              </h2>
              <p className="text-xs text-[#786B61] mt-1">
                Official venues equipped with audio-visual hardware, workstations, and reserved seating.
              </p>
            </div>

            {venues.length === 0 ? (
              /* CRITICAL RULE: Empty venue state when no real venues exist */
              <div className="py-16 px-6 text-center bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] max-w-xl mx-auto space-y-4 shadow-2xs">
                <div className="w-14 h-14 rounded-2xl bg-[#FBF7EF] text-[#C6A15B] flex items-center justify-center mx-auto shadow-2xs border border-[#E6D8C3]/50">
                  <Building className="w-7 h-7" />
                </div>
                {user?.role === 'Organizer' ? (
                  <>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#1F1713]">
                      No venues available yet
                    </h3>
                    <p className="text-xs sm:text-sm text-[#786B61] max-w-md mx-auto leading-relaxed">
                      Add a venue before scheduling your event.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setCurrentView('dashboard');
                          setActiveDashboardTab('schedules');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] text-xs font-semibold transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Venue</span>
                      </button>
                    </div>
                  </>
                ) : user?.role === 'Admin' ? (
                  <>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#1F1713]">
                      No venues have been added yet.
                    </h3>
                    <p className="text-xs sm:text-sm text-[#786B61] max-w-md mx-auto leading-relaxed">
                      Configure campus facilities to enable event scheduling across departments.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setCurrentView('dashboard');
                          setActiveDashboardTab('venues');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] text-xs font-semibold transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Venue</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#1F1713]">
                      Campus Venue Directory
                    </h3>
                    <p className="text-xs sm:text-sm text-[#786B61] max-w-md mx-auto leading-relaxed">
                      Official campus facilities will appear here once registered by university administration.
                    </p>
                  </>
                )}
              </div>
            ) : (
              /* Display real existing venues from data */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {venues.map((venue) => (
                  <div
                    key={venue.name || venue._id}
                    className="p-6 rounded-3xl bg-[#FFFDF8] border border-[#E6D8C3] shadow-2xs space-y-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-[#1F1713]">{venue.name}</h3>
                        {venue.building && (
                          <div className="text-xs text-[#786B61] mt-0.5">{venue.building}</div>
                        )}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-[#FBF7EF] text-[#C6A15B] border border-[#E6D8C3] flex items-center justify-center shrink-0">
                        <Building className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#71866F] bg-[#71866F]/10 border border-[#71866F]/20 px-3 py-1.5 rounded-xl font-medium">
                      <Users className="w-3.5 h-3.5" />
                      <span>Seating Capacity: {venue.capacity} attendees</span>
                    </div>

                    {venue.amenities && venue.amenities.length > 0 && (
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-[#786B61] font-semibold mb-2">
                          Included Amenities
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {venue.amenities.map((a: string) => (
                            <span
                              key={a}
                              className="px-2.5 py-1 rounded-lg text-[10px] bg-[#FBF7EF] text-[#786B61] border border-[#E6D8C3]"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {venue.contactPerson && (
                      <div className="text-xs text-[#786B61] pt-3 border-t border-[#E6D8C3] flex justify-between">
                        <span>Contact:</span>
                        <span className="text-[#2B211C] font-semibold">{venue.contactPerson}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
export default App;
