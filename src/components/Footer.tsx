import React from 'react';
import { Activity, ShieldCheck, Calendar, Sparkles, MapPin, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#FFFDF8] border-t border-[#E6D8C3] text-[#786B61] py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-sm">
          {/* Brand Info */}
          <div className="space-y-3.5 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#C6A15B] text-[#FFFDF8] flex items-center justify-center shadow-xs">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[#1F1713]">
                Campus<span className="text-[#C6A15B]">Pulse</span>
              </span>
            </div>
            <p className="text-xs text-[#786B61] leading-relaxed">
              Where campus life comes alive. The centralized platform for student competitions, technical symposiums, creative showcases, and academic workshops.
            </p>
            <div className="text-[11px] text-[#786B61] flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#71866F]"></span>
              Official Institutional Campus Portal
            </div>
          </div>

          {/* Platform Exploration */}
          <div>
            <h4 className="text-[#1F1713] text-xs font-bold uppercase tracking-wider mb-3">
              Explore Campus
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-[#2B211C] transition-colors cursor-pointer flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Upcoming Competitions</span>
              </li>
              <li className="hover:text-[#2B211C] transition-colors cursor-pointer flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Workshops & Seminars</span>
              </li>
              <li className="hover:text-[#2B211C] transition-colors cursor-pointer flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Campus Venues & Facilities</span>
              </li>
              <li className="hover:text-[#2B211C] transition-colors cursor-pointer flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>Verified Merit Certificates</span>
              </li>
            </ul>
          </div>

          {/* Student & Faculty Desks */}
          <div>
            <h4 className="text-[#1F1713] text-xs font-bold uppercase tracking-wider mb-3">
              Campus Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="text-[#786B61]">Student Event Hub & Digital Passes</li>
              <li className="text-[#786B61]">Faculty Coordinator Desk</li>
              <li className="text-[#786B61]">Competition Evaluation Panel</li>
              <li className="text-[#786B61]">Student Council Operations Desk</li>
              <li className="text-[#786B61]">Institutional Command & Audit</li>
            </ul>
          </div>

          {/* Institutional Integrity */}
          <div>
            <h4 className="text-[#1F1713] text-xs font-bold uppercase tracking-wider mb-3">
              Institutional Trust
            </h4>
            <p className="text-xs text-[#786B61] leading-relaxed mb-3">
              All events, registrations, attendances, and certificates are authenticated directly through verified collegiate identity rosters.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FBF7EF] border border-[#E6D8C3] text-[11px] text-[#71866F] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cryptographically Verified Credentials</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#E6D8C3] flex flex-col sm:flex-row justify-between items-center text-xs text-[#786B61] gap-3">
          <div>© 2026 CampusPulse. All rights reserved. Built for College Institutions.</div>
          <div className="flex items-center gap-4 text-xs text-[#786B61]">
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
