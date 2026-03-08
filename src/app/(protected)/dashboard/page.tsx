"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Wand2,
  Palette,
  Sparkles,
  LogOut,
  ArrowRight,
  User,
  Zap,
  Images,
  Globe,
  Loader2,
} from "lucide-react";

type SavedImage = {
  id: string;
  title: string | null;
  imageData: string;
  isPublic: boolean;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState<number | null>(null);
  const [recentImages, setRecentImages] = useState<SavedImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => setCredits(d.credits))
      .catch(() => {});

    fetch("/api/images?limit=6")
      .then((r) => r.json())
      .then((d) => setRecentImages(d.images ?? []))
      .catch(() => {})
      .finally(() => setLoadingImages(false));
  }, []);

  return (
    <div className="min-h-dvh bg-zinc-950">
      {/* Background pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #a855f7 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/10 via-transparent to-transparent" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 h-14 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 font-bold text-lg"
        >
          <div className="relative h-9 w-9 overflow-hidden rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-violet-600/10 border border-purple-500/20">
            <Image src="/logo.png" alt="ImgGen Logo" fill className="object-cover p-0.5" priority />
          </div>
          <span className="text-zinc-100 tracking-tight text-base">
            Img<span className="text-purple-400">Gen</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Credits badge */}
          {credits !== null && (
            <div className={`hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-medium ${credits > 5 ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
              <Zap size={12} />
              {credits} credit{credits !== 1 ? "s" : ""}
            </div>
          )}
          <Link href="/profile">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800/80 hover:border-zinc-700/50 transition-colors cursor-pointer">
              <User size={14} className="text-zinc-400" />
              <span className="text-sm text-zinc-300 hidden sm:block">
                {session?.user?.name || session?.user?.email}
              </span>
            </div>
          </Link>
          <Button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            variant="ghost"
            size="sm"
            className="h-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 px-2.5"
          >
            <LogOut size={14} className="mr-1.5" />
            <span className="hidden sm:inline text-xs">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16 space-y-10">
        {/* Welcome */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
          </h1>
          <p className="text-zinc-500 text-lg">
            What would you like to create today?
          </p>
        </div>

        {/* Quick Start */}
        <Link href="/editor">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/20 p-8 md:p-10 hover:border-purple-500/40 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-zinc-100">Open Editor</h2>
                <p className="text-zinc-400 max-w-md">
                  Upload an image or generate from a prompt. Inpaint, apply
                  filters, expand, enhance, and more.
                </p>
                <div className="flex items-center gap-2 text-purple-400 font-medium text-sm">
                  Launch Editor
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-600/20 border border-purple-500/20 flex items-center justify-center overflow-hidden">
                  <Image src="/logo.png" width={96} height={96} alt="Editor" className="object-cover p-1" />
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Nav links: Gallery + Public */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/gallery/user">
            <div className="group p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors space-y-3 cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Images size={18} className="text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-zinc-200 text-sm">My Gallery</p>
                <p className="text-xs text-zinc-500">Saved images & collections</p>
              </div>
            </div>
          </Link>
          <Link href="/gallery">
            <div className="group p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors space-y-3 cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Globe size={18} className="text-violet-400" />
              </div>
              <div>
                <p className="font-semibold text-zinc-200 text-sm">Community Gallery</p>
                <p className="text-xs text-zinc-500">Browse public creations</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent images */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
              Recent Saves
            </h3>
            <Link href="/gallery/user" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
              View all →
            </Link>
          </div>
          {loadingImages ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-zinc-600" />
            </div>
          ) : recentImages.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-zinc-800/50 border-dashed">
              <p className="text-zinc-600 text-sm">No saved images yet. Open the editor and hit Save.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {recentImages.map((img) => (
                <div key={img.id} className="aspect-square rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-900 relative">
                  <Image src={img.imageData} alt={img.title ?? ""} fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
            Available Tools
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Wand2,
                title: "Inpainting",
                description:
                  "Select areas and describe changes. Remove objects, add elements, or transform regions.",
              },
              {
                icon: Palette,
                title: "AI Filters",
                description:
                  "Apply artistic styles like Ghibli, Cyberpunk, Oil Painting, and more.",
              },
              {
                icon: Sparkles,
                title: "Image Expansion",
                description:
                  "Expand your images to different aspect ratios with AI-generated content.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 space-y-3"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <feature.icon size={18} className="text-purple-400" />
                </div>
                <h4 className="font-semibold text-zinc-200">{feature.title}</h4>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
