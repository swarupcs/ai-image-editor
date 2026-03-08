import Image from "next/image";
import Link from "next/link";

type PublicImage = {
  id: string;
  title: string | null;
  prompt: string | null;
  imageData: string;
  createdAt: string;
  user: { name: string | null; image: string | null };
};

async function getPublicImages(): Promise<PublicImage[]> {
  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/gallery?limit=48`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.images ?? [];
}

export default async function PublicGalleryPage() {
  const images = await getPublicImages();

  return (
    <div className="min-h-dvh bg-zinc-950">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #a855f7 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/10 via-transparent to-transparent" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 h-14 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg">
          <div className="relative h-9 w-9 overflow-hidden rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-violet-600/10 border border-purple-500/20">
            <Image src="/logo.png" alt="ImgGen" fill className="object-cover p-0.5" priority />
          </div>
          <span className="text-zinc-100 tracking-tight text-base">
            Img<span className="text-purple-400">Gen</span>
          </span>
        </Link>
        <Link href="/dashboard">
          <button className="h-8 px-3 text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            Go to Dashboard →
          </button>
        </Link>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-10 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 tracking-tight">
            Community Gallery
          </h1>
          <p className="text-zinc-500 text-base max-w-sm mx-auto">
            Creations shared by ImgGen users. Share yours by marking images public.
          </p>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-zinc-500">No public images yet. Be the first to share!</p>
            <Link href="/dashboard" className="mt-4 inline-block text-purple-400 hover:text-purple-300 text-sm transition-colors">
              Start creating →
            </Link>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
            {images.map((img) => (
              <div key={img.id} className="break-inside-avoid rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-900/40 group">
                <div className="relative">
                  <Image
                    src={img.imageData}
                    alt={img.title ?? "Community image"}
                    width={400}
                    height={400}
                    className="w-full h-auto"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-zinc-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-xs text-zinc-300 line-clamp-3">{img.prompt}</p>
                  </div>
                </div>
                <div className="px-3 py-2.5 flex items-center gap-2 border-t border-zinc-800/50">
                  <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                    {img.user.image ? (
                      <Image src={img.user.image} alt="" width={20} height={20} className="object-cover" />
                    ) : (
                      <span className="text-[9px] font-bold text-zinc-400">
                        {img.user.name?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 truncate">
                    {img.user.name ?? "Anonymous"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
