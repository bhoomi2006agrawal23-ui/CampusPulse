import React from 'react';
import { Activity, ShieldCheck, Calendar, Sparkles, MapPin, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#FFFCF5] border-t border-[#D8C3A5] text-[#857568] py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-sm">
          {/* Brand Info */}
          <div className="space-y-3.5 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#5A1E2D] text-[#FFF8E7] flex items-center justify-center shadow-xs">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[#2B211D]">
                Campus<span className="text-[#5A1E2D]">Pulse</span>
              </span>
            </div>
            <p className="text-xs text-[#857568] leading-relaxed">
              Where campus life comes alive. The centralized platform for student competitions, technical symposiums, creative showcases, and academic workshops.
            </p>
            <div className="text-[11px] text-[#857568] flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3D6A4E]"></span>
              Official Institutional Campus Portal
            </div>
          </div>

          {/* Platform Exploration */}
          <div>
            <h4 className="text-[#2B211D] text-xs font-bold uppercase tracking-wider mb-3">
              Explore Campus
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-[#5A1E2D] transition-colors cursor-pointer flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#5A1E2D]" />
                <span>Upcoming Competitions</span>
              </li>
              <li className="hover:text-[#5A1E2D] transition-colors cursor-pointer flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#5A1E2D]" />
                <span>Workshops & Seminars</span>
              </li>
              <li className="hover:text-[#5A1E2D] transition-colors cursor-pointer flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#5A1E2D]" />
                <span>Campus Venues & Facilities</span>
              </li>
              <li className="hover:text-[#5A1E2D] transition-colors cursor-pointer flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#5A1E2D]" />
                <span>Verified Merit Certificates</span>
              </li>
            </ul>
          </div>

          {/* Student & Faculty Desks */}
          <div>
            <h4 className="text-[#2B211D] text-xs font-bold uppercase tracking-wider mb-3">
              Campus Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="text-[#857568]">Student Event Hub & Digital Passes</li>
              <li className="text-[#857568]">Faculty Coordinator Desk</li>
              <li className="text-[#857568]">Competition Evaluation Panel</li>
              <li className="text-[#857568]">Student Council Operations Desk</li>
              <li className="text-[#857568]">Institutional Command & Audit</li>
            </ul>
          </div>

          {/* Institutional Integrity */}
          <div>
            <h4 className="text-[#2B211D] text-xs font-bold uppercase tracking-wider mb-3">
              Institutional Trust
            </h4>
            <p className="text-xs text-[#857568] leading-relaxed mb-3">
              All events, registrations, attendances, and certificates are authenticated directly through verified collegiate identity rosters.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF8E7] border border-[#D8C3A5] text-[11px] text-[#3D6A4E] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cryptographically Verified Credentials</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#D8C3A5] flex flex-col sm:flex-row justify-between items-center text-xs text-[#857568] gap-3">
          <div>© 2026 CampusPulse. All rights reserved. Built for College Institutions.</div>
          <div className="flex items-center gap-4 text-xs text-[#857568]">
            <span>Privacy Guidelines</span>
            <span>•</span>
            <span>Student Code of Conduct</span>
            <span>•</span>
            <span>Campus Activities Board</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
