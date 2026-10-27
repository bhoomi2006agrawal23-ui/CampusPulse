import React, { useState } from 'react';
import { ShieldCheck, Search, Award, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { apiClient } from '../../api/client.js';

interface VerifyCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const VerifyCertificateModal: React.FC<VerifyCertificateModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
}) => {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiClient(`/certificates/verify/${encodeURIComponent(code.trim().toUpperCase())}`);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error?.message || 'Certificate verification failed. No authentic record found.');
      }
    } catch {
      setError('Failed to reach verification gateway. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1713]/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#FFFDF8] border border-[#E6D8C3] rounded-3xl shadow-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#786B61] hover:text-[#1F1713] p-1.5 rounded-full hover:bg-[#FBF7EF] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3] flex items-center justify-center shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#1F1713]">Certificate Verification</h3>
            <p className="text-xs text-[#786B61]">Verify official digital credentials issued by CampusPulse</p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="mb-6">
          <label className="block text-xs font-semibold text-[#786B61] uppercase tracking-wider mb-2">
            Enter Certificate ID
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#786B61]" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CP-CERT-2026-A1B2C3"
                className="w-full pl-10 pr-4 py-2.5 bg-[#FBF7EF] border border-[#E6D8C3] rounded-xl text-sm text-[#2B211C] font-mono placeholder:text-[#786B61]/60 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30 focus:border-[#C6A15B] transition-all uppercase"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-5 py-2.5 bg-[#C6A15B] hover:bg-[#B58A3A] disabled:opacity-50 text-[#FFFDF8] text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#FFFDF8]/30 border-t-[#FFFDF8] rounded-full animate-spin" />
              ) : (
                'Verify'
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 bg-[#A9675D]/10 border border-[#A9675D]/30 rounded-2xl flex items-start gap-3 text-sm text-[#A9675D] mb-4 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs">Unverified Certificate</div>
              <div className="text-xs opacity-90 mt-0.5">{error}</div>
            </div>
          </div>
        )}

        {result && (
          <div className="p-5 bg-[#FBF7EF] border border-[#71866F]/30 rounded-2xl animate-in zoom-in-95 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6D8C3]">
              <div className="flex items-center gap-2 text-[#71866F] font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" /> Authentic & Verified
              </div>
              <span className="font-mono text-xs px-2.5 py-1 bg-[#71866F]/10 text-[#71866F] rounded-lg border border-[#71866F]/20 font-medium">
                {result.certificateId}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#786B61]">Recipient:</span>
                <span className="font-semibold text-[#1F1713]">{result.recipientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#786B61]">Event:</span>
                <span className="font-semibold text-[#1F1713] text-right">{result.eventName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#786B61]">Award / Type:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FBF7EF] text-[#B58A3A] text-[11px] rounded-md font-semibold border border-[#E6D8C3]">
                  <Award className="w-3.5 h-3.5" /> {result.certificateType}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#786B61]">Issue Date:</span>
                <span className="font-mono text-[#1F1713]">
                  {new Date(result.issueDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#786B61]">Audit Fingerprint:</span>
                <span className="font-mono text-[10px] text-[#786B61] truncate max-w-[200px]">
                  {result.verificationHash}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
