"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // Auto sign-in after successful signup
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/signin");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Create an account
        </h1>
        <p className="text-zinc-500 text-sm">
          Get started with ImgGen for free
        </p>
      </div>

      {/* OAuth first */}
      <OAuthButtons />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-xs text-zinc-600 shrink-0">
          or continue with email
        </span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      {/* Credentials form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name" className="text-zinc-400 text-sm">
            Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500/50 focus:ring-purple-500/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-zinc-400 text-sm">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500/50 focus:ring-purple-500/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-zinc-400 text-sm">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500/50 focus:ring-purple-500/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-zinc-400 text-sm">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
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
          disabled={isLoading}
          className="w-full h-11 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold rounded-xl border-0"
        >
          {isLoading ? (
            <Loader2 size={18} className="mr-2 animate-spin" />
          ) : (
            <UserPlus size={18} className="mr-2" />
          )}
          Create Account
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
