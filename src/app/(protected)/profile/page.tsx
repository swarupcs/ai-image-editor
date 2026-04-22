"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LogOut,
  LayoutDashboard,
  User,
  Mail,
  Lock,
  Calendar,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

type UserData = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  hasPassword: boolean;
  createdAt: string;
  accounts: { provider: string }[];
};

function ProviderBadge({ provider }: { provider: string }) {
  const styles: Record<string, string> = {
    google:
      "bg-blue-500/10 border-blue-500/20 text-blue-400",
    github:
      "bg-zinc-700/40 border-zinc-600/40 text-zinc-300",
    credentials:
      "bg-purple-500/10 border-purple-500/20 text-purple-400",
  };
  const labels: Record<string, string> = {
    google: "Google",
    github: "GitHub",
    credentials: "Email & Password",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${styles[provider] ?? "bg-zinc-800 border-zinc-700 text-zinc-400"}`}
    >
      {labels[provider] ?? provider}
    </span>
  );
}

function AvatarFallback({ name, image }: { name?: string | null; image?: string | null }) {
  const initials = name
    ? name
        .trim()
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  if (image) {
    return (
      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-800">
        <Image src={image} alt={name ?? "Avatar"} width={80} height={80} className="object-cover" />
      </div>
    );
  }

  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/30 to-violet-600/30 border-2 border-purple-500/30 flex items-center justify-center">
      <span className="text-2xl font-bold text-purple-300">{initials}</span>
    </div>
  );
}

function Feedback({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${
        type === "success"
          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
          : "bg-red-500/10 border border-red-500/20 text-red-400"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 size={15} className="shrink-0" />
      ) : (
        <AlertCircle size={15} className="shrink-0" />
      )}
      {message}
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit name state
  const [name, setName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameFeedback, setNameFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((data) => {
        setUserData(data);
        setName(data.name ?? "");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameFeedback(null);
    setNameSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNameFeedback({ type: "error", message: data.error });
      } else {
        setUserData((prev) => (prev ? { ...prev, name: data.name } : prev));
        await updateSession({ name: data.name });
        setNameFeedback({ type: "success", message: "Display name updated." });
      }
    } catch {
      setNameFeedback({ type: "error", message: "Something went wrong." });
    } finally {
      setNameSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback({
        type: "error",
        message: "New password must be at least 6 characters.",
      });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordFeedback({ type: "error", message: data.error });
      } else {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordFeedback({ type: "success", message: "Password updated successfully." });
      }
    } catch {
      setPasswordFeedback({ type: "error", message: "Something went wrong." });
    } finally {
      setPasswordSaving(false);
    }
  };

  const providers = userData?.accounts.map((a) => a.provider) ?? [];
  if (userData?.hasPassword && !providers.includes("credentials")) {
    providers.unshift("credentials");
  }

  const joinedDate = userData?.createdAt
    ? new Date(userData.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

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

          <span className="text-zinc-100 tracking-tight text-base">
            Img<span className="text-purple-400">Studio</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 px-2.5"
            >
              <LayoutDashboard size={14} className="mr-1.5" />
              <span className="hidden sm:inline text-xs">Dashboard</span>
            </Button>
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

      {/* Main content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 py-10 md:py-16 space-y-6">
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Profile
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Manage your account details and security settings.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-zinc-600" />
          </div>
        ) : (
          <>
            {/* Identity card */}
            <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800/60 p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              <AvatarFallback
                name={userData?.name}
                image={userData?.image}
              />
              <div className="space-y-2 min-w-0">
                <div>
                  <p className="text-lg font-semibold text-zinc-100 truncate">
                    {userData?.name || (
                      <span className="text-zinc-500 font-normal">
                        No name set
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-zinc-500 truncate">
                    {userData?.email}
                  </p>
                </div>
                {providers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {providers.map((p) => (
                      <ProviderBadge key={p} provider={p} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Account info */}
            <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800/60 divide-y divide-zinc-800/60">
              <div className="flex items-center gap-3 px-6 py-4">
                <Mail size={15} className="text-zinc-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500 mb-0.5">Email address</p>
                  <p className="text-sm text-zinc-200 truncate">
                    {userData?.email}
                  </p>
                </div>
              </div>
              {joinedDate && (
                <div className="flex items-center gap-3 px-6 py-4">
                  <Calendar size={15} className="text-zinc-500 shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">
                      Member since
                    </p>
                    <p className="text-sm text-zinc-200">{joinedDate}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Panel Quick Access */}
            {userData?.role === 'ADMIN' && (
              <div className="rounded-2xl bg-purple-900/10 border border-purple-500/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                    <LayoutDashboard size={16} />
                    Admin Access
                  </h2>
                  <p className="text-zinc-400 text-sm mt-1">
                    You have administrator privileges. Manage users and generations from the Admin Panel.
                  </p>
                </div>
                <Link href="/admin">
                  <Button className="bg-purple-600 hover:bg-purple-500 text-white border-0 shrink-0 whitespace-nowrap">
                    Go to Admin Panel
                  </Button>
                </Link>
              </div>
            )}

            {/* Edit display name */}
            <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800/60 p-6 space-y-5">
              <div className="flex items-center gap-2">
                <User size={16} className="text-purple-400" />
                <h2 className="text-sm font-semibold text-zinc-200">
                  Display Name
                </h2>
              </div>
              <form onSubmit={handleSaveName} className="space-y-4">
                {nameFeedback && (
                  <Feedback
                    type={nameFeedback.type}
                    message={nameFeedback.message}
                  />
                )}
                <div className="space-y-2">
                  <Label htmlFor="display-name" className="text-zinc-400 text-sm">
                    Name
                  </Label>
                  <Input
                    id="display-name"
                    type="text"
                    placeholder="Your display name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500/50 focus:ring-purple-500/20"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={nameSaving || name.trim() === (userData?.name ?? "")}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-500 text-white border-0 h-9 px-5"
                >
                  {nameSaving && (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  )}
                  Save changes
                </Button>
              </form>
            </div>

            {/* Change password — only for credential accounts */}
            {userData?.hasPassword && (
              <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800/60 p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-purple-400" />
                  <h2 className="text-sm font-semibold text-zinc-200">
                    Change Password
                  </h2>
                </div>
                <form
                  onSubmit={handleChangePassword}
                  className="space-y-4"
                >
                  {passwordFeedback && (
                    <Feedback
                      type={passwordFeedback.type}
                      message={passwordFeedback.message}
                    />
                  )}
                  <div className="space-y-2">
                    <Label
                      htmlFor="current-password"
                      className="text-zinc-400 text-sm"
                    >
                      Current password
                    </Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500/50 focus:ring-purple-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="new-password"
                      className="text-zinc-400 text-sm"
                    >
                      New password
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500/50 focus:ring-purple-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirm-new-password"
                      className="text-zinc-400 text-sm"
                    >
                      Confirm new password
                    </Label>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500/50 focus:ring-purple-500/20"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={
                      passwordSaving ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-500 text-white border-0 h-9 px-5"
                  >
                    {passwordSaving && (
                      <Loader2 size={14} className="mr-2 animate-spin" />
                    )}
                    Update password
                  </Button>
                </form>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
