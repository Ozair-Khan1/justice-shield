"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldMark } from "@/components/ShieldMark";
import Link from "next/link";
import { useLoading } from "@/components/LoadingProvider";

function SetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [typePassword, setTypePassword] = useState(false);
  const [typeConfirmPassword, setTypeConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { startLoading, stopLoading } = useLoading();
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  const onSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number");
      return;
    }
    if (!/[!@#$%^&*]/.test(password)) {
      setError("Password must contain at least one special character");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    startLoading("Finalizing Account Protection...");
    setError(null);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Setup failed");

      router.push("/auth?mode=signin&message=Account activated. Please sign in.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      stopLoading();
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
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Password</span>
            <div className="relative">
              <input
                type={typePassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm text-titanium-50 outline-none transition-colors focus:border-action pr-12"
              />

              <button
                type="button"
                onClick={() => setTypePassword(!typePassword)}
                className="absolute right-4 top-8 -translate-y-1/2 text-titanium-400 hover:text-titanium-200"
              >
                {typePassword ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-closed-icon lucide-eye-closed"><path d="m15 18-.722-3.25" /><path d="M2 8a10.645 10.645 0 0 0 20 0" /><path d="m20 15-1.726-2.05" /><path d="m4 15 1.726-2.05" /><path d="m9 18 .722-3.25" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>}
              </button>
            </div>
          </label>
          <label className="block">
            <div className="relative">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Confirm Password</span>
              <input
                type={typeConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm text-titanium-50 outline-none transition-colors focus:border-red-500 pr-12"
              />
              <button
                type="button"
                onClick={() => setTypeConfirmPassword(!typeConfirmPassword)}
                className="absolute right-4 top-14 -translate-y-1/2 text-titanium-400 hover:text-titanium-200"
              >
                {typeConfirmPassword ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-closed-icon lucide-eye-closed"><path d="m15 18-.722-3.25" /><path d="M2 8a10.645 10.645 0 0 0 20 0" /><path d="m20 15-1.726-2.05" /><path d="m4 15 1.726-2.05" /><path d="m9 18 .722-3.25" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>}
              </button>
            </div>
          </label>

          {error && (
            <div ref={errorRef} className="rounded-sm border border-red-500/40 bg-red-500/10 p-3 font-mono text-xs text-red-500">
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
      </div >
    </div >
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
