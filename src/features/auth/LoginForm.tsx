import React, { useState } from 'react';
import { useAuth, UserRole } from '../../context/AuthContext.js';
import { Lock, Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2, Eye, EyeOff, UserCheck } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

const ROLE_OPTIONS: UserRole[] = ['Admin', 'Organizer', 'Judge', 'Volunteer', 'Student'];

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole | '';
    setSelectedRole(newRole);
    // Requirement: If the selected role changes, clear entered credentials and update heading
    setEmail('');
    setPassword('');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setErrorMessage('Please select your role before signing in.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email or login ID.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    const res = await login(email.trim(), password, selectedRole);
    setLoading(false);

    if (res.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(res.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#FFFDF9] rounded-3xl border border-[#E7DED4] shadow-sm overflow-hidden text-[#292522]">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
        {/* Left / Visual Branding Area */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#F8F5F0] via-[#FAF7F2] to-[#E7DED4]/40 p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E7DED4]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFDF9] border border-[#E7DED4] text-[#B97868] text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#B97868]" />
              <span>CampusPulse Portal</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#292522] leading-snug">
              Every college event, <br />
              <span className="font-serif italic text-[#B97868]">seamlessly managed.</span>
            </h1>

            <p className="text-xs text-[#766E65] leading-relaxed">
              Sign in with your verified institutional role to manage campus activities, evaluate candidate projects, coordinate shifts, or participate in events.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-3 my-6">
            <div className="flex items-center gap-2.5 text-xs text-[#766E65]">
              <CheckCircle2 className="w-4 h-4 text-[#6F8B73] shrink-0" />
              <span>Role-gated operational workspaces & tools</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#766E65]">
              <CheckCircle2 className="w-4 h-4 text-[#6F8B73] shrink-0" />
              <span>Real-time timetables & venue conflict protection</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#766E65]">
              <CheckCircle2 className="w-4 h-4 text-[#6F8B73] shrink-0" />
              <span>Standardized rubrics & merit certifications</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#766E65]">
              <CheckCircle2 className="w-4 h-4 text-[#6F8B73] shrink-0" />
              <span>Enterprise audit trails & security governance</span>
            </div>
          </div>

          <div className="text-[11px] text-[#766E65] border-t border-[#E7DED4] pt-3 flex items-center justify-between">
            <span>Institutional Event Management</span>
            <span className="font-semibold text-[#B97868]">v2.6 Security Hardened</span>
          </div>
        </div>

        {/* Right / Login Form Area */}
        <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-center bg-[#FFFDF9]">
          {/* Dynamic Header */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#292522]">
              {selectedRole ? `${selectedRole} Login` : 'CampusPulse Sign In'}
            </h2>
            <p className="text-xs text-[#766E65] mt-1">
              {selectedRole
                ? `Enter your credentials below to access the ${selectedRole.toLowerCase()} workspace.`
                : 'Select your role to continue.'}
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-[#A9675D]/10 border border-[#A9675D]/30 text-[#A9675D] text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#A9675D]" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Role Selection Dropdown (Always visible) */}
            <div>
              <label
                htmlFor="role-selection"
                className="block text-xs font-semibold text-[#292522] mb-1.5"
              >
                Select Your Role <span className="text-[#B97868]">*</span>
              </label>
              <div className="relative">
                <select
                  id="role-selection"
                  value={selectedRole}
                  onChange={handleRoleChange}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs sm:text-sm text-[#292522] focus:outline-none focus:ring-2 focus:ring-[#B97868]/30 focus:border-[#B97868] transition-all cursor-pointer font-medium disabled:opacity-60"
                >
                  <option value="" disabled>
                    Choose your role
                  </option>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Login fields displayed ONLY after a role is selected */}
            {selectedRole && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                {/* Email or Login ID Field */}
                <div>
                  <label
                    htmlFor="login-id"
                    className="block text-xs font-semibold text-[#292522] mb-1"
                  >
                    Email or Login ID <span className="text-[#B97868]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#766E65] absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      id="login-id"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      placeholder={`Enter your ${selectedRole.toLowerCase()} email or ID`}
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs sm:text-sm text-[#292522] placeholder-[#766E65]/60 focus:outline-none focus:ring-2 focus:ring-[#B97868]/30 focus:border-[#B97868] transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Password Field with Masking and Toggle */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-[#292522] mb-1"
                  >
                    Password <span className="text-[#B97868]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#766E65] absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs sm:text-sm text-[#292522] placeholder-[#766E65]/60 focus:outline-none focus:ring-2 focus:ring-[#B97868]/30 focus:border-[#B97868] transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-2.5 p-0.5 text-[#766E65] hover:text-[#292522] transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#B97868] hover:bg-[#A66859] active:bg-[#975C4E] text-[#FFFDF9] font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-[#FFFDF9]/30 border-t-[#FFFDF9] rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In as {selectedRole}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </form>

          {/* Fallback helper when role is not selected */}
          {!selectedRole && (
            <div className="mt-6 p-4 rounded-2xl bg-[#F8F5F0] border border-[#E7DED4] text-xs text-[#766E65] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FFFDF9] border border-[#E7DED4] text-[#B97868] flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <p className="leading-relaxed">
                Choose <span className="font-semibold text-[#292522]">Student</span>, <span className="font-semibold text-[#292522]">Organizer</span>, <span className="font-semibold text-[#292522]">Judge</span>, <span className="font-semibold text-[#292522]">Volunteer</span>, or <span className="font-semibold text-[#292522]">Admin</span> from the dropdown above to load your secure sign-in portal.
              </p>
            </div>
          )}

          {/* Student Profile Registration Link */}
          {onSwitchToRegister && (
            <div className="mt-6 text-center text-xs text-[#766E65] pt-4 border-t border-[#E7DED4]/60">
              New student to CampusPulse?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-bold text-[#B97868] hover:text-[#A66859] hover:underline cursor-pointer"
              >
                Create a student profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
