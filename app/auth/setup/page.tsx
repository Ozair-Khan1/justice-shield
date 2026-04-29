"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldMark } from "@/components/ShieldMark";
import Link from "next/link";

function SetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // We'll use a special endpoint or update signup to handle this
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Setup failed");

      router.push("/auth?mode=signin&message=Account activated. Please sign in.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/5 px-3 py-1">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">Account Setup</span>
      </div>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">Set your password</h1>
      <p className="mt-2 text-sm text-titanium-400">
        Welcome to the network. Please verify your email and secure your account.
      </p>

      <div className="mt-8">
        <form onSubmit={onSetup} className="space-y-4">
          <label className="block">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">New Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm text-titanium-50 outline-none transition-colors focus:border-red-500"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Confirm Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm text-titanium-50 outline-none transition-colors focus:border-red-500"
            />
          </label>

          {error && (
            <div className="rounded-sm border border-red-500/40 bg-red-500/10 p-3 font-mono text-xs text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-red-600 px-6 py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Activating..." : "Activate Account →"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-titanium-950 text-titanium-50">
      <div className="border-b border-titanium-800 px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <ShieldMark className="size-7 text-red-600" />
          <span className="font-display text-base font-bold uppercase italic tracking-tighter">
            Justice <span className="text-red-600">Shield</span>
          </span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <Suspense fallback={<div className="font-mono text-xs text-titanium-500">Initializing setup...</div>}>
          <SetupContent />
        </Suspense>
      </div>
    </div>
  );
}
