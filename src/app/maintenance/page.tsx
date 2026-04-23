export default function MaintenancePage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-200">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-white">We&apos;ll be right back!</h1>
        <p className="text-zinc-400 text-lg">
          The application is currently undergoing scheduled maintenance. Please check back later.
        </p>
      </div>
    </div>
  );
}
