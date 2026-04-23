'use client';

import { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';

export function GlobalAnnouncement() {
  const [announcement, setAnnouncement] = useState<{ message: string | null; enabled: boolean } | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setAnnouncement({
            message: data.announcementMessage,
            enabled: data.announcementEnabled,
          });
        }
      } catch (error) {
        console.error('Failed to load global announcement');
      }
    };

    fetchSettings();
  }, []);

  if (!announcement?.enabled || !announcement?.message || !isVisible) {
    return null;
  }

  return (
    <div className="bg-purple-600/90 text-white px-4 py-2 flex items-center justify-center gap-3 relative shadow-lg z-50">
      <Bell size={16} className="shrink-0" />
      <p className="text-sm font-medium text-center">{announcement.message}</p>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 hover:bg-purple-700/50 p-1 rounded-full transition-colors"
        aria-label="Dismiss announcement"
      >
        <X size={16} />
      </button>
    </div>
  );
}
