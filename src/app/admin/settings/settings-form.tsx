'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Gauge } from 'lucide-react';

export function SettingsForm() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    publicGalleryEnabled: true,
    allowSignups: true,
    defaultCredits: 20,
    maxImageSize: 5,
    rateLimitEnabled: true,
    rateLimitMaxRequests: 20,
    rateLimitWindowMin: 60,
    announcementMessage: '',
    announcementEnabled: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings({
            maintenanceMode: data.maintenanceMode,
            publicGalleryEnabled: data.publicGalleryEnabled,
            allowSignups: data.allowSignups,
            defaultCredits: data.defaultCredits,
            maxImageSize: data.maxImageSize,
            rateLimitEnabled: data.rateLimitEnabled ?? true,
            rateLimitMaxRequests: data.rateLimitMaxRequests ?? 20,
            rateLimitWindowMin: data.rateLimitWindowMin ?? 60,
            announcementMessage: data.announcementMessage || '',
            announcementEnabled: data.announcementEnabled || false,
          });
        }
      } catch (error) {
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (key: keyof typeof settings, value: boolean | number | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success('Settings updated successfully');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      toast.error('Error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-zinc-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-8">
      {/* General Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-zinc-100 border-b border-zinc-800 pb-2">General Access</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-zinc-200">Maintenance Mode</Label>
            <p className="text-sm text-zinc-400">Lock the application for all non-admin users.</p>
          </div>
          <Switch 
            checked={settings.maintenanceMode} 
            onCheckedChange={(v) => handleChange('maintenanceMode', v)} 
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-zinc-200">Allow New Signups</Label>
            <p className="text-sm text-zinc-400">Enable or disable new user registrations.</p>
          </div>
          <Switch 
            checked={settings.allowSignups} 
            onCheckedChange={(v) => handleChange('allowSignups', v)} 
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-zinc-200">Public Gallery Feature</Label>
            <p className="text-sm text-zinc-400">Enable the community gallery showcase.</p>
          </div>
          <Switch 
            checked={settings.publicGalleryEnabled} 
            onCheckedChange={(v) => handleChange('publicGalleryEnabled', v)} 
          />
        </div>
      </div>

      {/* Credit Defaults */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-zinc-100 border-b border-zinc-800 pb-2">Defaults & Limits</h3>
        
        <div className="grid gap-2">
          <Label className="text-zinc-200">Default Sign-up Credits</Label>
          <div className="flex items-center gap-2">
            <Input 
              type="number" 
              value={settings.defaultCredits}
              onChange={(e) => handleChange('defaultCredits', parseInt(e.target.value) || 0)}
              className="w-24 bg-zinc-800/50 border-zinc-700 text-zinc-100"
            />
            <span className="text-sm text-zinc-400">credits given to new users</span>
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-zinc-200">Max Image Upload Size</Label>
          <div className="flex items-center gap-2">
            <Input 
              type="number" 
              value={settings.maxImageSize}
              onChange={(e) => handleChange('maxImageSize', parseInt(e.target.value) || 0)}
              className="w-24 bg-zinc-800/50 border-zinc-700 text-zinc-100"
            />
            <span className="text-sm text-zinc-400">MB per file</span>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-zinc-100 border-b border-zinc-800 pb-2">Announcements</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-zinc-200">Enable Announcement</Label>
            <p className="text-sm text-zinc-400">Show a banner to all active users.</p>
          </div>
          <Switch 
            checked={settings.announcementEnabled} 
            onCheckedChange={(v) => handleChange('announcementEnabled', v)} 
          />
        </div>

        {settings.announcementEnabled && (
          <div className="grid gap-2">
            <Label className="text-zinc-200">Announcement Message</Label>
            <Input 
              type="text" 
              value={settings.announcementMessage}
              onChange={(e) => handleChange('announcementMessage', e.target.value)}
              placeholder="e.g. System maintenance tonight at 12 AM UTC"
              className="bg-zinc-800/50 border-zinc-700 text-zinc-100"
            />
          </div>
        )}
      </div>

      {/* Rate Limiting */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-zinc-100 border-b border-zinc-800 pb-2 flex items-center gap-2">
          <Gauge size={18} className="text-orange-400" />
          Rate Limiting
        </h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-zinc-200">Enable Rate Limiting</Label>
            <p className="text-sm text-zinc-400">Limit how many AI requests a user can make per time window.</p>
          </div>
          <Switch 
            checked={settings.rateLimitEnabled} 
            onCheckedChange={(v) => handleChange('rateLimitEnabled', v)} 
          />
        </div>

        {settings.rateLimitEnabled && (
          <div className="space-y-4 pl-1 border-l-2 border-orange-500/20 ml-1">
            <div className="grid gap-2 pl-4">
              <Label className="text-zinc-200">Max Requests Per Window</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  value={settings.rateLimitMaxRequests}
                  onChange={(e) => handleChange('rateLimitMaxRequests', parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-24 bg-zinc-800/50 border-zinc-700 text-zinc-100"
                />
                <span className="text-sm text-zinc-400">AI requests (edit + generate combined per endpoint)</span>
              </div>
            </div>

            <div className="grid gap-2 pl-4">
              <Label className="text-zinc-200">Time Window</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  value={settings.rateLimitWindowMin}
                  onChange={(e) => handleChange('rateLimitWindowMin', parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-24 bg-zinc-800/50 border-zinc-700 text-zinc-100"
                />
                <span className="text-sm text-zinc-400">minutes</span>
              </div>
              <p className="text-xs text-zinc-500">
                Example: {settings.rateLimitMaxRequests} requests per {settings.rateLimitWindowMin} minute{settings.rateLimitWindowMin !== 1 ? 's' : ''} = ~{Math.round(settings.rateLimitMaxRequests / (settings.rateLimitWindowMin / 60))} requests/hour
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-purple-600 hover:bg-purple-500 text-white min-w-32"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
