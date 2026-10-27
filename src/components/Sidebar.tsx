import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  LayoutDashboard,
  Calendar,
  Award,
  Users,
  Building,
  ClipboardList,
  LogOut,
  Megaphone,
  BarChart2,
  ShieldAlert,
  Clock,
  Ticket,
  Trophy,
  CheckSquare,
  FileCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case 'Admin':
        return [
          { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
          { id: 'users', label: 'Users & Authority', icon: Users },
          { id: 'events', label: 'Campus Events', icon: Calendar },
          { id: 'venues', label: 'Venues & Facilities', icon: Building },
          { id: 'reports', label: 'Institutional Reports', icon: BarChart2 },
          { id: 'audit-logs', label: 'Security Audit Logs', icon: ShieldAlert },
        ];
      case 'Organizer':
        return [
          { id: 'overview', label: 'Organizer Workspace', icon: LayoutDashboard },
          { id: 'events', label: 'My Managed Events', icon: Calendar },
          { id: 'roster', label: 'Participant Rosters', icon: Users },
          { id: 'schedules', label: 'Schedules & Venues', icon: Clock },
          { id: 'staff', label: 'Volunteers & Judges', icon: CheckSquare },
          { id: 'results', label: 'Results & Certificates', icon: Trophy },
          { id: 'reports', label: 'Event Analytics', icon: BarChart2 },
        ];
      case 'Judge':
        return [
          { id: 'overview', label: 'Evaluation Desk', icon: LayoutDashboard },
          { id: 'events', label: 'Assigned Competitions', icon: Calendar },
          { id: 'evaluations', label: 'Candidate Scoring', icon: FileCheck },
        ];
      case 'Volunteer':
        return [
          { id: 'overview', label: 'Duty Station', icon: LayoutDashboard },
          { id: 'shifts', label: 'My Duty Shifts', icon: ClipboardList },
          { id: 'checkin', label: 'Shift Check-In', icon: CheckSquare },
        ];
      default: // Student
        return [
          { id: 'overview', label: 'Student Hub', icon: LayoutDashboard },
          { id: 'registrations', label: 'Registered Events', icon: Ticket },
          { id: 'certificates', label: 'My Certificates', icon: Award },
          { id: 'results', label: 'Standings & Results', icon: Trophy },
          { id: 'announcements', label: 'Campus Bulletins', icon: Megaphone },
        ];
    }
  };

  const navItems = getNavItems();

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-[#5A1E2D]/10 text-[#5A1E2D] border-[#5A1E2D]/30 font-bold';
      case 'Organizer':
        return 'bg-[#5A1E2D]/10 text-[#5A1E2D] border-[#5A1E2D]/30';
      case 'Judge':
        return 'bg-[#3D6A4E]/10 text-[#3D6A4E] border-[#3D6A4E]/30';
      case 'Volunteer':
        return 'bg-[#D8C3A5]/40 text-[#2B211D] border-[#D8C3A5]';
      default:
        return 'bg-[#FFF8E7] text-[#857568] border-[#D8C3A5]';
    }
  };

  return (
    <aside className="w-full lg:w-64 bg-[#FFFCF5] rounded-2xl border border-[#D8C3A5] p-4 flex flex-col justify-between shadow-2xs">
      <div className="space-y-6">
        {/* User Profile Card */}
        <div className="p-3.5 rounded-xl bg-[#FFF8E7] border border-[#D8C3A5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#5A1E2D] text-[#FFF8E7] font-bold text-sm flex items-center justify-center shadow-2xs">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-[#2B211D] truncate">{user.name}</div>
              <div className="text-[11px] text-[#857568] truncate">{user.loginId ? `@${user.loginId}` : user.email}</div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#D8C3A5]/70 flex items-center justify-between text-[11px]">
            <span className="text-[#857568]">Role</span>
            <span className={`font-semibold px-2 py-0.5 rounded-md border text-[10px] ${getRoleBadgeStyle(user.role)}`}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#857568] px-2 mb-2">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#5A1E2D] text-[#FFF8E7] font-semibold shadow-2xs'
                    : 'text-[#857568] hover:text-[#2B211D] hover:bg-[#FFF8E7]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#FFF8E7]' : 'text-[#857568]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout button at bottom */}
      <div className="pt-6 mt-6 border-t border-[#D8C3A5]/70">
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#8B2635] hover:bg-[#8B2635]/10 transition-colors border border-[#8B2635]/20 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
