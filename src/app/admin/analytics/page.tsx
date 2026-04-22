import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsCharts } from './analytics-charts';

export const metadata = { title: 'Analytics | Admin Panel' };

export default async function AdminAnalyticsPage() {
  const images = await prisma.generatedImage.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const users = await prisma.user.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Process data for charts
  const dateMap = new Map<string, { date: string; images: number; users: number }>();

  // Fill last 14 days with 0s to ensure the chart looks good even with no data
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dateMap.set(dateStr, { date: dateStr, images: 0, users: 0 });
  }

  images.forEach((img) => {
    const dateStr = img.createdAt.toISOString().split('T')[0];
    if (dateMap.has(dateStr)) {
      const entry = dateMap.get(dateStr)!;
      entry.images += 1;
    } else {
      // If it's an older date, we can include it or ignore it. 
      // For simplicity, let's just include all available dates in the map.
      dateMap.set(dateStr, { date: dateStr, images: 1, users: 0 });
    }
  });

  users.forEach((user) => {
    const dateStr = user.createdAt.toISOString().split('T')[0];
    if (dateMap.has(dateStr)) {
      const entry = dateMap.get(dateStr)!;
      entry.users += 1;
    } else if (dateMap.has(dateStr)) {
      dateMap.set(dateStr, { date: dateStr, images: 0, users: 1 });
    }
  });

  // Sort by date string
  const chartData = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Analytics</h1>
        <p className="text-zinc-400">Detailed usage statistics and growth metrics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardHeader>
            <CardTitle className="text-zinc-100">Growth Overview</CardTitle>
            <CardDescription className="text-zinc-400">
              New users and generated images over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsCharts data={chartData} />
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900/50 border-zinc-800/50">
           <CardHeader>
            <CardTitle className="text-zinc-100">System Usage</CardTitle>
            <CardDescription className="text-zinc-400">
              Total system load and active metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center gap-8 py-8">
             <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Total API Calls (Mock)</span>
                  <span className="text-zinc-100 font-medium">{(images.length * 2.3).toFixed(0)}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[65%]" />
                </div>
             </div>
             
             <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Storage Used (Mock)</span>
                  <span className="text-zinc-100 font-medium">{(images.length * 1.2).toFixed(1)} MB / 5 GB</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[12%]" />
                </div>
             </div>
             
             <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Active Models</span>
                  <span className="text-zinc-100 font-medium">gemini-3-pro-image-preview</span>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
