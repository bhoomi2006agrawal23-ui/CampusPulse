import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { User, Mail, Lock, Phone, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Password validation
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setErrorMessage('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setErrorMessage('Password must contain at least one number');
      return;
    }

    // Indian phone number validation if entered
    if (phoneNumber.trim()) {
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      const isIndianMobile = /^(\+?91|0)?[6-9]\d{9}$/.test(cleanPhone);
      if (!isIndianMobile) {
        setErrorMessage('Please enter a valid 10-digit Indian phone number (e.g. +91 98765 43210)');
        return;
      }
    }

    setLoading(true);
    const res = await register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phoneNumber: phoneNumber.trim() || undefined,
    });
    setLoading(false);

    if (res.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(res.error || 'Registration failed');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-[#FFFCF5] rounded-3xl border border-[#D8C3A5] p-6 sm:p-8 shadow-sm text-[#2B211D]">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FFF8E7] text-[#5A1E2D] border border-[#D8C3A5] mb-3 shadow-2xs">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#5A1E2D]">Student Account Creation</h2>
        <p className="text-xs text-[#857568] mt-1">
          Join CampusPulse to discover and register for events across campus
        </p>
      </div>

      <div className="mb-5 p-3.5 rounded-2xl bg-[#FFF8E7] border border-[#D8C3A5] text-[#857568] text-xs flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 shrink-0 text-[#5A1E2D] mt-0.5" />
        <div>
          <span className="font-bold text-[#2B211D]">Student Profile:</span> All self-registered accounts receive full access to event registrations, schedules, and digital passes.
        </div>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3 rounded-xl bg-[#8B2635]/10 border border-[#8B2635]/30 text-[#8B2635] text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#8B2635]" />
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-[#2B211D] mb-1">
            Full Name <span className="text-[#5A1E2D]">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#857568] absolute left-3.5 top-3" />
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya Patel"
              className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] placeholder-[#857568]/60 focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D] transition-all"
            />
          </div>
        </div>

        {/* Google Email Address */}
        <div>
          <label className="block text-xs font-semibold text-[#2B211D] mb-1">
            Google Email Address <span className="text-[#5A1E2D]">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#857568] absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] placeholder-[#857568]/60 focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D] transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-[#2B211D] mb-1">
            Password <span className="text-[#857568] font-normal text-[11px]">(min 8 chars, 1 uppercase, 1 digit)</span> <span className="text-[#5A1E2D]">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#857568] absolute left-3.5 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] placeholder-[#857568]/60 focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D] transition-all"
            />
          </div>
        </div>

        {/* Phone Number (India format) */}
        <div>
          <label className="block text-xs font-semibold text-[#2B211D] mb-1">
            Phone Number <span className="text-[#857568] font-normal text-[11px]">(Optional, India)</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-[#857568] absolute left-3.5 top-3" />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFF8E7] border border-[#D8C3A5] rounded-xl text-xs text-[#2B211D] placeholder-[#857568]/60 focus:outline-none focus:ring-2 focus:ring-[#5A1E2D]/30 focus:border-[#5A1E2D] transition-all"
            />
          </div>
        </div>

        {/* Sign up submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#5A1E2D] hover:bg-[#742A3D] text-[#FFF8E7] font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-[#FFF8E7]/30 border-t-[#FFF8E7] rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Create Student Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {onSwitchToLogin && (
        <div className="mt-6 text-center text-xs text-[#857568]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold text-[#5A1E2D] hover:text-[#742A3D] hover:underline cursor-pointer"
          >
            Sign in
          </button>
        </div>
      )}
    </div>
  );
};
