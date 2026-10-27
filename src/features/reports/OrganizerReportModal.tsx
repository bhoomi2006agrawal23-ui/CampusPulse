import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.js';
import { FileText, CheckCircle2, AlertCircle, X, Download, RefreshCw, BarChart2, ShieldCheck, Users, Award } from 'lucide-react';

interface OrganizerReportModalProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const OrganizerReportModal: React.FC<OrganizerReportModalProps> = ({
  eventId,
  eventTitle,
  isOpen,
  onClose,
}) => {
  const [reports, setReports] = useState<any[]>([]);
  const [latestSummary, setLatestSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient<{ reports: any[] }>(`/events/${eventId}/reports`);
      if (res.success && res.data) {
        setReports(res.data.reports || []);
        if (res.data.reports?.length > 0) {
          setLatestSummary(res.data.reports[0]?.dataSummary);
        }
      }
    } catch {
      setError('Failed to fetch event reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  const handleGenerateReport = async () => {
    setActionLoading(true);
    setError(null);

    try {
      const res = await apiClient(`/events/${eventId}/reports`, {
        method: 'POST',
      });

      if (res.success && res.data) {
        setNotification('Event summary report snapshot generated successfully');
        setLatestSummary(res.data.report.dataSummary);
        fetchReports();
        setTimeout(() => setNotification(null), 3000);
      } else {
        setError(res.error?.message || 'Failed to generate report snapshot');
      }
    } catch {
      setError('Network error during report generation');
    }
    setActionLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-[#FFFDF9] border border-[#E7DED4] rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E7DED4] shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#B78A52]/15 text-[#B78A52] text-xs font-semibold border border-[#B78A52]/30">
              <FileText className="w-3.5 h-3.5" /> Event Intelligence & Reporting Desk
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#292522] mt-1">{eventTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#F1ECE5] text-[#716B65] hover:text-[#292522] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {notification && (
          <div className="mt-3 p-3 bg-[#EAF0EB] border border-[#D1DFD3] text-[#4E7554] text-xs rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#6F8B73]" />
            <span>{notification}</span>
          </div>
        )}
        {error && (
          <div className="mt-3 p-3 bg-[#FBF0EE] border border-[#E5CFC4] text-[#B86B68] text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-y-auto space-y-6 py-4 flex-1">
          {/* Action Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#F8F5F0] rounded-2xl border border-[#E7DED4]">
            <div className="text-xs text-[#716B65]">
              Generate timestamped analytics snapshots from registrations, attendance, and scoring engines.
            </div>
            <button
              onClick={handleGenerateReport}
              disabled={actionLoading}
              className="px-4 py-2 bg-[#B97868] hover:bg-[#A66657] disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              {actionLoading ? 'Aggregating...' : 'Generate New Summary Snapshot'}
            </button>
          </div>

          {/* Current Analytics Snapshot Display */}
          {latestSummary ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-[#E7DED4] shadow-2xs">
                  <div className="text-[10px] uppercase font-semibold text-[#716B65]">Enrollment Capacity</div>
                  <div className="text-xl font-bold text-[#292522] mt-1">
                    {latestSummary.registrations?.total} / {latestSummary.registrations?.capacity}
                  </div>
                  <div className="text-[10px] text-[#6F8B73] font-medium mt-0.5">
                    {latestSummary.registrations?.utilizationPercentage}% filled
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-[#E7DED4] shadow-2xs">
                  <div className="text-[10px] uppercase font-semibold text-[#716B65]">Attendance Rate</div>
                  <div className="text-xl font-bold text-[#6F8B73] mt-1">
                    {latestSummary.attendance?.attendanceRate}%
                  </div>
                  <div className="text-[10px] text-[#716B65] mt-0.5">
                    {latestSummary.attendance?.attended} checked in
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-[#E7DED4] shadow-2xs">
                  <div className="text-[10px] uppercase font-semibold text-[#716B65]">Staff Deployed</div>
                  <div className="text-xl font-bold text-[#292522] mt-1">
                    {(latestSummary.staffing?.volunteersAssigned || 0) + (latestSummary.staffing?.judgesAssigned || 0)}
                  </div>
                  <div className="text-[10px] text-[#716B65] mt-0.5">
                    {latestSummary.staffing?.volunteersAssigned} vol • {latestSummary.staffing?.judgesAssigned} judges
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-[#E7DED4] shadow-2xs">
                  <div className="text-[10px] uppercase font-semibold text-[#716B65]">Credentials Issued</div>
                  <div className="text-xl font-bold text-[#B97868] mt-1">
                    {latestSummary.certificates?.totalIssued || 0}
                  </div>
                  <div className="text-[10px] text-[#716B65] mt-0.5">
                    {latestSummary.evaluations?.totalEvaluations || 0} scored
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Card */}
              <div className="p-5 bg-white rounded-2xl border border-[#E7DED4] space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#292522]">
                  Consolidated Operational Snapshot
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[#F8F5F0] rounded-xl space-y-1.5">
                    <div className="font-semibold text-[#292522]">Participation Breakdown</div>
                    <div className="flex justify-between text-[#716B65]">
                      <span>Attended:</span> <span className="font-medium text-[#292522]">{latestSummary.attendance?.attended}</span>
                    </div>
                    <div className="flex justify-between text-[#716B65]">
                      <span>Absent:</span> <span className="font-medium text-[#292522]">{latestSummary.attendance?.absent}</span>
                    </div>
                    <div className="flex justify-between text-[#716B65]">
                      <span>Excused:</span> <span className="font-medium text-[#292522]">{latestSummary.attendance?.excused}</span>
                    </div>
                    <div className="flex justify-between text-[#716B65]">
                      <span>Unmarked:</span> <span className="font-medium text-[#292522]">{latestSummary.attendance?.unmarked}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8F5F0] rounded-xl space-y-1.5">
                    <div className="font-semibold text-[#292522]">Evaluation & Outcomes</div>
                    <div className="flex justify-between text-[#716B65]">
                      <span>Evaluations Completed:</span> <span className="font-medium text-[#292522]">{latestSummary.evaluations?.totalEvaluations}</span>
                    </div>
                    <div className="flex justify-between text-[#716B65]">
                      <span>Results Public:</span> <span className="font-medium text-[#292522]">{latestSummary.evaluations?.resultsPublished ? 'Yes' : 'Draft / Private'}</span>
                    </div>
                    <div className="flex justify-between text-[#716B65]">
                      <span>Top Recorded Score:</span> <span className="font-medium text-[#292522]">{latestSummary.evaluations?.topScorer || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-[#716B65]">
                      <span>Certificates Distributed:</span> <span className="font-medium text-[#292522]">{latestSummary.certificates?.totalIssued}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#716B65] bg-white rounded-2xl border border-[#E7DED4]">
              No report snapshots generated yet. Click "Generate New Summary Snapshot" above to compile event statistics.
            </div>
          )}

          {/* Historical Reports List */}
          <div className="space-y-2">
            <div className="font-bold text-xs text-[#292522] uppercase tracking-wider">
              Generated Report History ({reports.length})
            </div>

            {reports.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#716B65] bg-[#F8F5F0] rounded-2xl border border-[#E7DED4]">
                No historical records.
              </div>
            ) : (
              <div className="divide-y divide-[#E7DED4] border border-[#E7DED4] rounded-2xl overflow-hidden bg-white">
                {reports.map((r) => {
                  const author = typeof r.generatedById === 'object' ? r.generatedById?.name : 'Coordinator';
                  return (
                    <div
                      key={r._id || r.id}
                      onClick={() => setLatestSummary(r.dataSummary)}
                      className="p-3.5 px-4 flex items-center justify-between text-xs hover:bg-[#F8F5F0] transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-[#292522]">Event Summary Snapshot</div>
                        <div className="text-[10px] text-[#716B65]">
                          Generated by {author} on {new Date(r.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <button className="px-2.5 py-1 bg-white hover:bg-[#F1ECE5] border border-[#E7DED4] rounded-lg text-[10px] font-semibold text-[#B97868]">
                        Load Snapshot
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E7DED4] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-[#F1ECE5] text-xs font-semibold text-[#716B65] rounded-xl border border-[#E7DED4] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
