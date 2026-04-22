import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsForm } from './settings-form';

export const metadata = { title: 'Settings | Admin Panel' };

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Settings</h1>
        <p className="text-zinc-400">Configure system preferences and AI defaults.</p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800/50 max-w-3xl">
          <CardHeader>
            <CardTitle className="text-zinc-100">Application Configuration</CardTitle>
            <CardDescription className="text-zinc-400">
              Manage core application settings. (Note: These changes are applied system-wide immediately.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
