'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function SettingsForm() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    publicGalleryEnabled: true,
    allowSignups: true,
    defaultCredits: 20,
    maxImageSize: 5,
  });

  const handleChange = (key: keyof typeof settings, value: boolean | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Settings updated successfully');
    setIsSaving(false);
  };

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
