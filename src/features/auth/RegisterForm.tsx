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
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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
    if (bio.length > 300) {
      setErrorMessage('Bio cannot exceed 300 characters');
      return;
    }

    setLoading(true);
    const res = await register({
      name,
      email,
      password,
      phoneNumber: phoneNumber || undefined,
      bio: bio || undefined,
    });
    setLoading(false);

    if (res.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(res.error || 'Registration failed');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-[#FFFDF8] rounded-3xl border border-[#E6D8C3] p-6 sm:p-8 shadow-sm text-[#2B211C]">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3] mb-3 shadow-2xs">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#1F1713]">Student Account Creation</h2>
        <p className="text-xs text-[#786B61] mt-1">
          Join CampusPulse to discover and register for events across campus
        </p>
      </div>

      <div className="mb-5 p-3.5 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] text-[#786B61] text-xs flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 shrink-0 text-[#C6A15B] mt-0.5" />
        <div>
          <span className="font-bold text-[#1F1713]">Student Profile:</span> All self-registered accounts receive full access to event registrations, schedules, and digital passes.
        </div>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3 rounded-xl bg-[#A9675D]/10 border border-[#A9675D]/30 text-[#A9675D] text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#A9675D]" />
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#1F1713] mb-1">
            Full Name <span className="text-[#C6A15B]">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#786B61] absolute left-3.5 top-3" />
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya Patel"
              className="w-full pl-10 pr-3.5 py-2.5 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] placeholder-[#786B61]/60 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1F1713] mb-1">
            College Email Address <span className="text-[#C6A15B]">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#786B61] absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. maya@campuspulse.edu"
              className="w-full pl-10 pr-3.5 py-2.5 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] placeholder-[#786B61]/60 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1F1713] mb-1">
            Password <span className="text-[#786B61] font-normal text-[11px]">(min 8 chars, 1 uppercase, 1 digit)</span> <span className="text-[#C6A15B]">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#786B61] absolute left-3.5 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-3.5 py-2.5 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] placeholder-[#786B61]/60 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1F1713] mb-1">
            Phone Number <span className="text-[#786B61] font-normal text-[11px]">(Optional)</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-[#786B61] absolute left-3.5 top-3" />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full pl-10 pr-3.5 py-2.5 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] placeholder-[#786B61]/60 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1F1713] mb-1">
            Student Bio <span className="text-[#786B61] font-normal text-[11px]">(Optional, max 300 chars)</span>
          </label>
          <textarea
            rows={2}
            maxLength={300}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="e.g. 3rd year CS student passionate about distributed systems and competitive coding."
            className="w-full px-3.5 py-2.5 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] placeholder-[#786B61]/60 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B] resize-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-[#FFFDF8]/30 border-t-[#FFFDF8] rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Create Student Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {onSwitchToLogin && (
        <div className="mt-6 text-center text-xs text-[#786B61]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold text-[#B58A3A] hover:text-[#C6A15B] hover:underline cursor-pointer"
          >
            Sign in
          </button>
        </div>
      )}
    </div>
  );
};
