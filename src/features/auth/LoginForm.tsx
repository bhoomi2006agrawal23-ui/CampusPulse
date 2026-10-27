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
    <div className="w-full max-w-4xl mx-auto bg-[#FFFCF5] rounded-3xl border border-[#D8C3A5] shadow-sm overflow-hidden text-[#2B211D]">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
        {/* Left / Visual Branding Area */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#FFF8E7] via-[#FFFCF5] to-[#D8C3A5]/30 p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#D8C3A5]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFCF5] border border-[#D8C3A5] text-[#5A1E2D] text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#5A1E2D]" />
              <span>CampusPulse Portal</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#2B211D] leading-snug">
              Every college event, <br />
              <span className="font-serif italic text-[#5A1E2D]">seamlessly managed.</span>
            </h1>

            <p className="text-xs text-[#857568] leading-relaxed">
              Sign in with your verified institutional role to manage campus activities, evaluate candidate projects, coordinate shifts, or participate in events.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-3 my-6">
            <div className="flex items-center gap-2.5 text-xs text-[#857568]">
              <CheckCircle2 className="w-4 h-4 text-[#3D6A4E] shrink-0" />
              <span>Role-gated operational workspaces & tools</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#857568]">
              <CheckCircle2 className="w-4 h-4 text-[#3D6A4E] shrink-0" />
              <span>Real-time timetables & venue conflict protection</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#857568]">
              <CheckCircle2 className="w-4 h-4 text-[#3D6A4E] shrink-0" />
              <span>Standardized rubrics & merit certifications</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#857568]">
              <CheckCircle2 className="w-4 h-4 text-[#3D6A4E] shrink-0" />
              <span>Enterprise audit trails & security governance</span>
            </div>
          </div>

          <div className="text-[11px] text-[#857568] border-t border-[#D8C3A5] pt-3 flex items-center justify-between">
            <span>Institutional Event Management</span>
            <span className="font-semibold text-[#5A1E2D]">v2.7 Secured</span>
          </div>
        </div>

        {/* Right / Login Form Area */}
        <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-center bg-[#FFFCF5]">
          {/* Dynamic Header */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#5A1E2D]">
              {selectedRole ? `${selectedRole} Login` : 'CampusPulse Sign In'}
            </h2>
            <p className="text-xs text-[#857568] mt-1">
              {selectedRole
                ? `Enter your credentials below to access the ${selectedRole.toLowerCase()} workspace.`
                : 'Select your role to continue.'}
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-[#8B2635]/10 border border-[#8B2635]/30 text-[#8B2635] text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#8B2635]" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Role Selection Dropdown (Always visible) */}
            <div>
              <label
                htmlFor="role-selection"
                className="block text-xs font-semibold text-[#2B211D] mb-1.5"
              >
                Select Your Role <span className="text-[#5A1E2D]">*</span>
              </label>
              <div className="relative">
                <select
                  id="role-selection"
                  value={selectedRole}
                  onChange={handleRoleChange}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs sm:text-sm text-[#2B211D] focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D] transition-all cursor-pointer font-medium disabled:opacity-60"
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
                    className="block text-xs font-semibold text-[#2B211D] mb-1"
                  >
                    {selectedRole === 'Admin' ? 'Admin ID or Email Address' : 'Email Address or Login ID'}{' '}
                    <span className="text-[#5A1E2D]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#857568] absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      id="login-id"
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      placeholder={
                        selectedRole === 'Admin'
                          ? 'Enter admin1 or admin2 or email'
                          : `Enter your ${selectedRole.toLowerCase()} email or ID`
                      }
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs sm:text-sm text-[#2B211D] placeholder-[#857568]/60 focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D] transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Password Field with Masking and Toggle */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-[#2B211D] mb-1"
                  >
                    Password <span className="text-[#5A1E2D]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#857568] absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs sm:text-sm text-[#2B211D] placeholder-[#857568]/60 focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D] transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-2.5 p-0.5 text-[#857568] hover:text-[#2B211D] transition-colors cursor-pointer"
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
                  className="w-full py-3 rounded-xl bg-[#5A1E2D] hover:bg-[#742A3D] active:bg-[#4E1825] text-[#FFF8E7] font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-[#FFF8E7]/30 border-t-[#FFF8E7] rounded-full animate-spin" />
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
            <div className="mt-6 p-4 rounded-2xl bg-[#FFF8E7] border border-[#D8C3A5] text-xs text-[#857568] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FFFCF5] border border-[#D8C3A5] text-[#5A1E2D] flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <p className="leading-relaxed">
                Choose <span className="font-semibold text-[#2B211D]">Student</span>, <span className="font-semibold text-[#2B211D]">Organizer</span>, <span className="font-semibold text-[#2B211D]">Judge</span>, <span className="font-semibold text-[#2B211D]">Volunteer</span>, or <span className="font-semibold text-[#2B211D]">Admin</span> from the dropdown above to load your secure sign-in portal.
              </p>
            </div>
          )}

          {/* Student Profile Registration Link */}
          {onSwitchToRegister && (
            <div className="mt-6 text-center text-xs text-[#857568] pt-4 border-t border-[#D8C3A5]/60">
              New student to CampusPulse?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-bold text-[#5A1E2D] hover:text-[#742A3D] hover:underline cursor-pointer"
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
