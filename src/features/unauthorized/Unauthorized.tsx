import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface UnauthorizedProps {
  requiredRole?: string;
  currentRole?: string;
  onGoBack: () => void;
}

export const Unauthorized: React.FC<UnauthorizedProps> = ({
  requiredRole = 'Admin',
  currentRole = 'Student',
  onGoBack,
}) => {
  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-[#FFFDF9] rounded-3xl border border-[#E7DED4] text-[#292522] text-center shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-[#FBF0EE] border border-[#E5CFC4] text-[#B86B68] mx-auto flex items-center justify-center mb-4">
        <ShieldAlert className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-bold text-[#292522] mb-1.5">403 — Access Restricted</h2>
      <p className="text-xs text-[#716B65] leading-relaxed mb-4">
        Your current role (<span className="text-[#8F5E52] font-semibold">{currentRole}</span>) does not have sufficient institutional permissions to access this administrative zone.
      </p>

      <div className="p-3.5 rounded-xl bg-[#F8F5F0] border border-[#E7DED4] text-xs text-[#716B65] mb-6 text-left space-y-1">
        <div className="font-bold text-[#292522]">Backend RBAC Boundary</div>
        <div>Required Role: <span className="font-mono text-[#8F5E52] font-semibold">{requiredRole}</span></div>
        <div className="text-[11px] text-[#A69F97]">
          Enforced by Express authorization middleware.
        </div>
      </div>

      <button
        onClick={onGoBack}
        className="w-full py-2.5 px-4 bg-[#F1ECE5] hover:bg-[#EAE3D9] text-[#292522] font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-[#E7DED4] cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Permitted View</span>
      </button>
    </div>
  );
};
