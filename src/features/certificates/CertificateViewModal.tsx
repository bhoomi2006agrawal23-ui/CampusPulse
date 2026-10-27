import React from 'react';
import { Award, ShieldCheck, X, Printer } from 'lucide-react';

interface CertificateViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: {
    certificateId: string;
    recipientName: string;
    eventName?: string;
    certificateType: string;
    issueDate: string | Date;
    verificationHash: string;
  } | null;
}

export const CertificateViewModal: React.FC<CertificateViewModalProps> = ({
  isOpen,
  onClose,
  certificate,
}) => {
  if (!isOpen || !certificate) return null;

  const formattedDate = new Date(certificate.issueDate).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1713]/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#FFFDF8] border border-[#E6D8C3] rounded-3xl shadow-2xl p-6 sm:p-10 flex flex-col items-center text-center">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#786B61] hover:text-[#1F1713] p-2 rounded-xl hover:bg-[#FBF7EF] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Frame */}
        <div className="w-full border-4 border-double border-[#E2CF9F] p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-[#FFFDF8] via-[#FBF7EF] to-[#F7F0E3] relative overflow-hidden shadow-inner">
          {/* Subtle Watermark */}
          <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none text-[#C6A15B]">
            <Award className="w-80 h-80" />
          </div>

          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FBF7EF] border border-[#E6D8C3] flex items-center justify-center text-[#B58A3A] shadow-2xs">
              <Award className="w-8 h-8" />
            </div>
          </div>

          <div className="font-mono text-[11px] uppercase tracking-widest text-[#B58A3A] font-bold mb-1">
            CampusPulse Official Collegiate Credential
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif-accent font-bold text-[#1F1713] tracking-tight mb-2">
            Certificate of {certificate.certificateType}
          </h2>
          <p className="text-xs text-[#786B61] mb-6">This credential certifies that</p>

          <div className="text-2xl sm:text-3xl font-bold text-[#1F1713] border-b border-[#E6D8C3] pb-3 mb-5 max-w-md mx-auto">
            {certificate.recipientName}
          </div>

          <p className="text-xs sm:text-sm text-[#786B61] max-w-lg mx-auto mb-8 leading-relaxed">
            has successfully participated in and satisfied all operational benchmarks for{' '}
            <span className="font-semibold text-[#1F1713]">{certificate.eventName || 'CampusPulse Collegiate Event'}</span>,
            demonstrating exemplary dedication, academic curiosity, and collegiate excellence.
          </p>

          {/* Certificate Footer Credentials */}
          <div className="grid grid-cols-2 pt-6 border-t border-[#E6D8C3] text-left">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#786B61]">Issued Date</div>
              <div className="text-xs font-semibold text-[#1F1713] mt-0.5">{formattedDate}</div>
              <div className="text-[10px] text-[#786B61] mt-1 font-mono">ID: {certificate.certificateId}</div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-[#71866F] text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" /> Cryptographically Verified
              </div>
              <div className="text-[9px] font-mono text-[#786B61] mt-1 truncate max-w-[180px]">
                {certificate.verificationHash.substring(0, 24)}...
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-[#C6A15B] hover:bg-[#B58A3A] text-[#FFFDF8] text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-[#FBF7EF] hover:bg-[#F7F0E3] border border-[#E6D8C3] text-xs font-semibold text-[#786B61] rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
