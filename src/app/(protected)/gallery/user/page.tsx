"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LayoutDashboard,
  Trash2,
  Globe,
  Lock,
  FolderPlus,
  Folder,
  Plus,
  X,
  Loader2,
  ImageIcon,
  Link2,
  Check,
  Download,
  Search,
} from "lucide-react";

type SavedImage = {
  id: string;
  title: string | null;
  prompt: string | null;
  imageData: string;
  isPublic: boolean;
  createdAt: string;
};

type Collection = {
  id: string;
  name: string;
  createdAt: string;
  _count: { images: number };
  images: { image: { imageData: string } }[];
};

function NavBar() {
  return (
    <header className="relative z-10 h-14 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 shrink-0">
      <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-lg">
        <div className="relative h-9 w-9 overflow-hidden rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-violet-600/10 border border-purple-500/20">
          <Image src="/logo.png" alt="ImgGen" fill className="object-cover p-0.5" priority />
        </div>
        <span className="text-zinc-100 tracking-tight text-base">
          Img<span className="text-purple-400">Gen</span>
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="h-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 px-2.5">
            <LayoutDashboard size={14} className="mr-1.5" />
            <span className="hidden sm:inline text-xs">Dashboard</span>
          </Button>
        </Link>
        <Button onClick={() => signOut({ callbackUrl: "/signin" })} variant="ghost" size="sm" className="h-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 px-2.5">
          <LogOut size={14} className="mr-1.5" />
          <span className="hidden sm:inline text-xs">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}

export default function GalleryPage() {
  const [images, setImages] = useState<SavedImage[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"images" | "collections">("images");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [addingToCollection, setAddingToCollection] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [imgRes, colRes] = await Promise.all([
        fetch("/api/images"),
        fetch("/api/collections"),
      ]);
      const imgData = await imgRes.json();
      const colData = await colRes.json();
      setImages(imgData.images ?? []);
      setCollections(colData.collections ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/images/${id}`, { method: "DELETE" });
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleTogglePublic = async (id: string, current: boolean) => {
    const res = await fetch(`/api/images/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !current }),
    });
    const data = await res.json();
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, isPublic: data.isPublic } : img))
    );
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    setCreatingCollection(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCollectionName }),
      });
      const data = await res.json();
      setCollections((prev) => [{ ...data, _count: { images: 0 }, images: [] }, ...prev]);
      setNewCollectionName("");
      setShowNewCollection(false);
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleAddToCollection = async (collectionId: string, imageId: string) => {
    setAddingToCollection(imageId);
    try {
      await fetch(`/api/collections/${collectionId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });
      await fetchData();
    } finally {
      setAddingToCollection(null);
    }
  };

  const handleCopyLink = async (img: SavedImage) => {
    // Make public first if private
    if (!img.isPublic) {
      await fetch(`/api/images/${img.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: true }),
      });
      setImages((prev) => prev.map((i) => (i.id === img.id ? { ...i, isPublic: true } : i)));
    }
    const url = `${window.location.origin}/p/${img.id}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(img.id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleDownload = (img: SavedImage) => {
    const link = document.createElement("a");
    link.href = img.imageData;
    link.download = `imggen-${img.id}.png`;
    link.click();
  };

  const filteredImages = images.filter((img) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      img.title?.toLowerCase().includes(q) ||
      img.prompt?.toLowerCase().includes(q)
    );
  });

  const handleDeleteCollection = async (id: string) => {
    await fetch(`/api/collections/${id}`, { method: "DELETE" });
    setCollections((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-dvh bg-zinc-950 flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #a855f7 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/10 via-transparent to-transparent" />
      </div>

      <NavBar />

      <div className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">My Gallery</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {images.length} image{images.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <Link href="/editor">
            <Button className="h-9 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white border-0 rounded-xl text-sm">
              <Plus size={15} className="mr-1.5" />
              New Image
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-xl p-1 gap-1 w-fit">
          {(["images", "collections"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex items-center gap-2 py-1.5 px-4 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === t
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t === "images" ? <ImageIcon size={14} /> : <Folder size={14} />}
              {t}
            </button>
          ))}
        </div>

        {/* Search bar (images tab only) */}
        {activeTab === "images" && !loading && images.length > 0 && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title or prompt…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-72 h-9 bg-zinc-900/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl pl-8 pr-3 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-zinc-600" />
          </div>
        ) : activeTab === "images" ? (
          images.length === 0 ? (
            <div className="text-center py-24 space-y-4">
              <ImageIcon size={40} className="text-zinc-700 mx-auto" />
              <p className="text-zinc-500">No saved images yet.</p>
              <Link href="/editor">
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 mt-2">
                  Open Editor
                </Button>
              </Link>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-500 text-sm">No images match &ldquo;{searchQuery}&rdquo;</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-900/40"
                >
                  <div className="aspect-square relative">
                    <Image
                      src={img.imageData}
                      alt={img.title ?? "Generated image"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-zinc-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                      <div className="flex justify-between items-start gap-1">
                        <button
                          onClick={() => handleTogglePublic(img.id, img.isPublic)}
                          title={img.isPublic ? "Make private" : "Make public"}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${
                            img.isPublic
                              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                              : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {img.isPublic ? <Globe size={11} /> : <Lock size={11} />}
                          {img.isPublic ? "Public" : "Private"}
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDownload(img)}
                            title="Download image"
                            className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            onClick={() => handleCopyLink(img)}
                            title="Copy shareable link"
                            className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                          >
                            {copiedLink === img.id ? <Check size={13} className="text-emerald-400" /> : <Link2 size={13} />}
                          </button>
                          <button
                            onClick={() => handleDelete(img.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      {/* Add to collection */}
                      {collections.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-zinc-500 text-xs">Add to collection</p>
                          <div className="flex flex-wrap gap-1">
                            {collections.slice(0, 3).map((col) => (
                              <button
                                key={col.id}
                                onClick={() => handleAddToCollection(col.id, img.id)}
                                disabled={addingToCollection === img.id}
                                className="text-xs px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-colors"
                              >
                                {col.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {img.title && (
                    <div className="px-3 py-2 border-t border-zinc-800/50">
                      <p className="text-xs text-zinc-400 truncate">{img.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-zinc-500 text-sm">{collections.length} collection{collections.length !== 1 ? "s" : ""}</p>
              <Button
                onClick={() => setShowNewCollection(true)}
                variant="outline"
                size="sm"
                className="h-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs"
              >
                <FolderPlus size={14} className="mr-1.5" />
                New Collection
              </Button>
            </div>

            {showNewCollection && (
              <form onSubmit={handleCreateCollection} className="flex gap-2">
                <input
                  autoFocus
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection name"
                  className="flex-1 h-9 bg-zinc-900/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl px-3 text-sm focus:outline-none focus:border-purple-500/50"
                />
                <Button type="submit" disabled={creatingCollection} size="sm" className="h-9 bg-purple-600 hover:bg-purple-500 text-white border-0">
                  {creatingCollection ? <Loader2 size={14} className="animate-spin" /> : "Create"}
                </Button>
                <Button type="button" onClick={() => setShowNewCollection(false)} variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                  <X size={14} />
                </Button>
              </form>
            )}

            {collections.length === 0 ? (
              <div className="text-center py-24 space-y-4">
                <Folder size={40} className="text-zinc-700 mx-auto" />
                <p className="text-zinc-500">No collections yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {collections.map((col) => (
                  <div key={col.id} className="rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-900/40 group">
                    <div className="aspect-square relative bg-zinc-900 flex items-center justify-center">
                      {col.images[0] ? (
                        <Image
                          src={col.images[0].image.imageData}
                          alt={col.name}
                          fill
                          className="object-cover opacity-60"
                          unoptimized
                        />
                      ) : (
                        <Folder size={32} className="text-zinc-700" />
                      )}
                      <div className="absolute inset-0 flex items-end justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeleteCollection(col.id)}
                          className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="px-3 py-2.5 border-t border-zinc-800/50">
                      <p className="text-sm font-medium text-zinc-200 truncate">{col.name}</p>
                      <p className="text-xs text-zinc-500">{col._count.images} image{col._count.images !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
