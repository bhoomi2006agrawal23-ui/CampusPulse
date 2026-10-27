import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.js';
import { Award, Users, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface OrganizerCertificateModalProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OrganizerCertificateModal: React.FC<OrganizerCertificateModalProps> = ({
  eventId,
  eventTitle,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [certType, setCertType] = useState<'Participation' | 'Merit' | 'Appreciation'>('Participation');

  const loadData = async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);

    try {
      const [partRes, certRes] = await Promise.all([
        apiClient<{ participants: any[] }>(`/api/events/${eventId}/participants`),
        apiClient<{ certificates: any[] }>(`/events/${eventId}/certificates`),
      ]);

      if (partRes.success && partRes.data) {
        setParticipants(partRes.data.participants || []);
      }
      if (certRes.success && certRes.data) {
        setCertificates(certRes.data.certificates || []);
      }
    } catch {
      setError('Failed to fetch roster for certificate generation');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  const handleGenerateIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    setActionLoading(true);
    setError(null);

    try {
      const res = await apiClient(`/events/${eventId}/certificates`, {
        method: 'POST',
        body: JSON.stringify({
          recipientId: selectedStudentId,
          certificateType: certType,
        }),
      });

      if (res.success) {
        setNotification('Certificate generated and digitally signed!');
        setSelectedStudentId('');
        loadData();
        if (onSuccess) onSuccess();
        setTimeout(() => setNotification(null), 3500);
      } else {
        setError(res.error?.message || 'Certificate generation failed');
      }
    } catch {
      setError('Network error issuing certificate');
    }
    setActionLoading(false);
  };

  const handleBulkGenerate = async (type: 'Participation' | 'Merit') => {
    if (!window.confirm(`Generate ${type} certificates for all registered participants?`)) {
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const res = await apiClient(`/events/${eventId}/certificates/bulk`, {
        method: 'POST',
        body: JSON.stringify({ certificateType: type }),
      });

      if (res.success) {
        setNotification(`Bulk certificates generated successfully!`);
        loadData();
        if (onSuccess) onSuccess();
        setTimeout(() => setNotification(null), 4000);
      } else {
        setError(res.error?.message || 'Bulk generation failed');
      }
    } catch {
      setError('Network error during bulk issuance');
    }
    setActionLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1713]/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-[#FFFDF8] border border-[#E6D8C3] rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] flex flex-col text-[#2B211C]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E6D8C3] shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FBF7EF] text-[#B58A3A] text-xs font-semibold border border-[#E6D8C3]">
              <Award className="w-3.5 h-3.5 text-[#C6A15B]" /> Certificate Generation & Credentials Desk
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F1713] mt-1">{eventTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#FBF7EF] text-[#786B61] hover:text-[#1F1713] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {notification && (
          <div className="mt-3 p-3 bg-[#71866F]/10 border border-[#71866F]/30 text-[#71866F] text-xs rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#71866F]" />
            <span>{notification}</span>
          </div>
        )}
        {error && (
          <div className="mt-3 p-3 bg-[#A9675D]/10 border border-[#A9675D]/30 text-[#A9675D] text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-y-auto space-y-6 py-4 flex-1">
          {/* Bulk Generation Controls */}
          <div className="p-5 bg-[#FBF7EF] rounded-2xl border border-[#E6D8C3] space-y-2">
            <div className="text-xs font-bold text-[#1F1713] uppercase tracking-wider">
              Bulk Certificate Issuance
            </div>
            <p className="text-xs text-[#786B61]">
              Generate verified credentials for all confirmed event attendees in a single atomic batch.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleBulkGenerate('Participation')}
                disabled={actionLoading || participants.length === 0}
                className="px-3.5 py-2 bg-[#FFFDF8] hover:bg-[#F7F0E3] disabled:opacity-50 text-xs font-semibold text-[#1F1713] border border-[#E6D8C3] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Users className="w-3.5 h-3.5 text-[#C6A15B]" /> Bulk Issue Participation Certificates
              </button>
              <button
                type="button"
                onClick={() => handleBulkGenerate('Merit')}
                disabled={actionLoading || participants.length === 0}
                className="px-3.5 py-2 bg-[#C6A15B] hover:bg-[#B58A3A] disabled:opacity-50 text-xs font-bold text-[#FFFDF8] rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" /> Bulk Issue Merit Certificates
              </button>
            </div>
          </div>

          {/* Form: Issue Individual Certificate */}
          <form onSubmit={handleGenerateIndividual} className="p-5 bg-[#FBF7EF] rounded-2xl border border-[#E6D8C3] space-y-3.5">
            <div className="font-bold text-xs uppercase tracking-wider text-[#786B61]">
              Issue Individual Certificate
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-[#786B61] mb-1">Select Recipient</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30"
                  required
                >
                  <option value="">-- Choose student participant --</option>
                  {participants.map((reg) => {
                    const student = typeof reg.studentId === 'object' ? reg.studentId : null;
                    const sId = student?._id || student?.id || reg.studentId;
                    const sName = student?.name || 'Student';
                    const sEmail = student?.email || '';
                    return (
                      <option key={sId} value={sId}>
                        {sName} ({sEmail})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#786B61] mb-1">Credential Type</label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E6D8C3] rounded-xl text-xs text-[#2B211C] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/30"
                >
                  <option value="Participation">Participation</option>
                  <option value="Merit">Merit</option>
                  <option value="Appreciation">Appreciation</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={actionLoading || !selectedStudentId}
                className="px-4 py-2 bg-[#C6A15B] hover:bg-[#B58A3A] disabled:opacity-50 text-[#FFFDF8] text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                {actionLoading ? 'Issuing...' : 'Generate & Issue Certificate'}
              </button>
            </div>
          </form>

          {/* Issued Certificates Roster */}
          <div className="space-y-2">
            <div className="font-bold text-xs text-[#1F1713] uppercase tracking-wider">
              Issued Certificates Roster ({certificates.length})
            </div>

            {certificates.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#786B61] bg-[#FBF7EF] rounded-2xl border border-[#E6D8C3]">
                No certificates generated yet for this event.
              </div>
            ) : (
              <div className="divide-y divide-[#E6D8C3] border border-[#E6D8C3] rounded-2xl overflow-hidden bg-[#FFFDF8]">
                {certificates.map((c) => {
                  const recipient = typeof c.recipientId === 'object' ? c.recipientId : null;
                  const rName = c.recipientName || recipient?.name || 'Participant';
                  const rEmail = recipient?.email || '';

                  return (
                    <div key={c._id || c.id} className="p-3.5 px-4 flex items-center justify-between gap-3 text-xs hover:bg-[#FBF7EF]/70">
                      <div>
                        <div className="font-bold text-[#1F1713]">{rName}</div>
                        <div className="text-[10px] text-[#786B61]">{rEmail}</div>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FBF7EF] text-[#B58A3A] border border-[#E6D8C3]">
                          {c.certificateType}
                        </span>
                        <span className="font-mono text-[10px] text-[#786B61] bg-[#FBF7EF] px-2 py-1 rounded-lg border border-[#E6D8C3]">
                          {c.certificateId}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E6D8C3] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#FBF7EF] hover:bg-[#F7F0E3] text-xs font-semibold text-[#786B61] rounded-xl border border-[#E6D8C3] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
