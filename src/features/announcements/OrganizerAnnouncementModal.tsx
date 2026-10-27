import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.js';
import { Megaphone, CheckCircle2, AlertCircle, X, Trash2, Pin, Plus } from 'lucide-react';

interface OrganizerAnnouncementModalProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OrganizerAnnouncementModal: React.FC<OrganizerAnnouncementModalProps> = ({
  eventId,
  eventTitle,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [isPinned, setIsPinned] = useState(false);

  const fetchAnnouncements = async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient<{ announcements: any[] }>(`/events/${eventId}/announcements`);
      if (res.success && res.data) {
        setAnnouncements(res.data.announcements || []);
      }
    } catch {
      setError('Failed to load announcements');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements();
    }
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setActionLoading(true);
    setError(null);

    try {
      const res = await apiClient(`/events/${eventId}/announcements`, {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          priority,
          isPinned,
        }),
      });

      if (res.success) {
        setNotification('Announcement published and notifications broadcast');
        setTitle('');
        setContent('');
        setIsPinned(false);
        setPriority('Normal');
        fetchAnnouncements();
        onSuccess?.();
        setTimeout(() => setNotification(null), 3000);
      } else {
        setError(res.error?.message || 'Failed to post announcement');
      }
    } catch {
      setError('Network error posting announcement');
    }
    setActionLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      const res = await apiClient(`/announcements/${id}`, { method: 'DELETE' });
      if (res.success) {
        setNotification('Announcement removed');
        fetchAnnouncements();
        setTimeout(() => setNotification(null), 2500);
      }
    } catch {
      setError('Failed to delete announcement');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#FFFDF9] border border-[#E7DED4] rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E7DED4] shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#6F8B73]/15 text-[#6F8B73] text-xs font-semibold border border-[#6F8B73]/30">
              <Megaphone className="w-3.5 h-3.5" /> Event Bulletin & Announcements
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
          {/* Create Form */}
          <form onSubmit={handleCreateAnnouncement} className="p-4 bg-white rounded-2xl border border-[#E7DED4] space-y-3">
            <div className="font-bold text-xs uppercase tracking-wider text-[#716B65]">
              Publish New Broadcast
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#716B65] mb-1">Headline Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Schedule Update: Keynote moved to Main Hall"
                className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs text-[#292522] focus:outline-none focus:ring-2 focus:ring-[#B97868]/30"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#716B65] mb-1">Bulletin Content</label>
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Details of the announcement..."
                className="w-full px-3 py-2 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs text-[#292522] focus:outline-none focus:ring-2 focus:ring-[#B97868]/30 resize-none"
                required
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <div>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="px-3 py-1.5 bg-[#F8F5F0] border border-[#E7DED4] rounded-xl text-xs text-[#292522] focus:outline-none focus:ring-2 focus:ring-[#B97868]/30"
                  >
                    <option value="Normal">Normal Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent Priority</option>
                  </select>
                </div>

                <label className="flex items-center gap-1.5 text-xs text-[#716B65] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded text-[#B97868] focus:ring-[#B97868]"
                  />
                  Pin Bulletin
                </label>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-[#B97868] hover:bg-[#A66657] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {actionLoading ? 'Publishing...' : 'Broadcast Announcement'}
              </button>
            </div>
          </form>

          {/* Announcements List */}
          <div className="space-y-2">
            <div className="font-bold text-xs text-[#292522] uppercase tracking-wider">
              Published Bulletins ({announcements.length})
            </div>

            {announcements.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#716B65] bg-[#F8F5F0] rounded-2xl border border-[#E7DED4]">
                No announcements published yet for this event.
              </div>
            ) : (
              <div className="space-y-2">
                {announcements.map((a) => {
                  const aId = a._id || a.id;
                  return (
                    <div
                      key={aId}
                      className="p-3.5 bg-white border border-[#E7DED4] rounded-2xl flex items-start justify-between gap-3 hover:bg-[#F8F5F0]/50 transition-colors"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          {a.isPinned && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#B97868] text-white flex items-center gap-0.5">
                              <Pin className="w-2.5 h-2.5" /> PINNED
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              a.priority === 'Urgent'
                                ? 'bg-[#B86B68]/20 text-[#B86B68]'
                                : a.priority === 'High'
                                ? 'bg-[#B78A52]/20 text-[#B78A52]'
                                : 'bg-[#F1ECE5] text-[#716B65]'
                            }`}
                          >
                            {a.priority}
                          </span>
                          <span className="text-[10px] text-[#716B65] font-mono">
                            {new Date(a.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[#292522]">{a.title}</h4>
                        <p className="text-xs text-[#716B65] leading-snug">{a.content}</p>
                      </div>

                      <button
                        onClick={() => handleDelete(aId)}
                        className="p-1.5 text-[#B86B68] hover:bg-[#FBF0EE] rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
