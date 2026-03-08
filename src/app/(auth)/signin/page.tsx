"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2 } from "lucide-react";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
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
          Welcome back
        </h1>
        <p className="text-zinc-500 text-sm">Sign in to your ImgGen account</p>
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

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold rounded-xl border-0"
        >
          {isLoading ? (
            <Loader2 size={18} className="mr-2 animate-spin" />
          ) : (
            <LogIn size={18} className="mr-2" />
          )}
          Sign In
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}
