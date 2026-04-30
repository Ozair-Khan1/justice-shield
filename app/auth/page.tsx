"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { ShieldMark } from "@/components/ShieldMark";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';


export default function AuthPage() {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<"details" | "verification">("details");
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState("")
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState<string | undefined>("");
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'ADMIN') {
        router.push('/app/admin');
      } else if (user.role === "ATTORNEY") {
        router.push('/app/attorney');
      } else {
        router.push('/app');
      }
    }
  }, [user, loading, router]);

  // Restore state on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("pending_signup");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.emailSent) setEmailSent(data.email);
        if (data.mode) setMode(data.mode);
        if (data.step) setStep(data.step);
      } catch (e) {
        console.error("Failed to restore signup state", e);
      }
    }
  }, []);

  // Persist state changes
  useEffect(() => {
    if (mode === "signup") {
      sessionStorage.setItem("pending_signup", JSON.stringify({ email, fullName, phone, password, mode, step }));
    } else {
      sessionStorage.removeItem("pending_signup");
    }
  }, [email, fullName, phone, password, mode, step]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const onSendOtp = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setStep("verification");
      setResendTimer(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const validatePassword = (pass: string) => {
    if (pass.length < 6) return "Password must be at least 6 characters long.";
    if (!/[0-9]/.test(pass)) return "Password must contain at least one number.";
    if (!/[@$!%*?&]/.test(pass)) return "Password must contain at least one special character (@$!%*?&).";
    return null;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        if (step === "details") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const passwordError = validatePassword(password);

          if (fullName.trim().length === 0) {
            throw new Error("Please enter your full name.");
          } else if (fullName.trim().length < 3) {
            throw new Error("Full name must be at least 3 characters long.");
          }

          if (phone) {
            const digits = phone.replace(/\D/g, "");
            if (digits.length < 4 || digits.length > 15) {
              throw new Error("Phone number must be between 4 and 15 digits.");
            }
          } else {
            throw new Error("Please enter your phone number.");
          }

          if (!emailRegex.test(email)) {
            throw new Error("Please enter a valid email address.");
          }

          if (passwordError) {
            throw new Error(passwordError);
          }

          if (!acceptedTerms) {
            throw new Error("You must accept the Terms of Agreement to create an account.");
          }

          // Phase 1: Just send OTP
          await onSendOtp();
          return;
        } else {
          // Phase 2: Complete signup with OTP
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, full_name: fullName, phone, otp }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Signup failed");
          sessionStorage.removeItem("pending_signup");
        }
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
      }

      await refreshUser();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-titanium-950 text-titanium-50">
      <div className="border-b border-titanium-800 px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <ShieldMark className="size-7 text-action" />
          <span className="font-display text-base font-bold uppercase italic tracking-tighter">
            Justice <span className="text-action">Shield</span>
          </span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-action/30 bg-action/5 px-3 py-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-action">
              {mode === "signin" ? "Member Access" : "Establish Protection"}
            </span>
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">
            {mode === "signin" ? "Sign in" : step === "verification" ? "Verify email" : "Create account"}
          </h1>
          <p className="mt-2 text-sm text-titanium-400">
            {mode === "signin"
              ? "Access your encrypted dashboard."
              : step === "verification"
                ? `Enter the code sent to ${emailSent}`
                : "Active protection in under a minute."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {mode === "signup" && step === "details" && (
              <>
                <Field label="Full name" type="text" value={fullName} onChange={setFullName} />
                <label className="block">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Phone <span className="text-red-500">*</span></span>
                  <PhoneInput
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={setPhone}
                    defaultCountry="US"
                    international={false}
                    className="phone-input-custom mt-2"
                  />
                </label>
                <Field label="Email" type="email" value={email} onChange={setEmail} />
                <div className="space-y-1">
                  <Field label="Password" type="password" value={password} onChange={setPassword} />
                </div>
              </>
            )}

            {mode === "signup" && step === "verification" && (
              <div className="space-y-4">
                <Field
                  label="Verification Code"
                  type="text"
                  value={otp}
                  onChange={setOtp}
                  required
                  placeholder="000000"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    disabled={resendTimer > 0 || submitting}
                    onClick={onSendOtp}
                    className="font-mono text-[10px] uppercase tracking-widest text-action hover:text-action/80 disabled:text-titanium-600"
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                  </button>
                </div>
              </div>
            )}

            {mode === "signin" && (
              <>
                <Field label="Email" type="email" value={email} onChange={setEmail} required />
                <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={6} />
              </>
            )}

            {mode === "signup" && step === "details" && (
              <label className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 size-4 cursor-pointer accent-action"
                />
                <span className="font-mono text-[11px] leading-relaxed text-titanium-400">
                  I have read and agree to the{" "}
                  <Link href="/terms" target="_blank" className="text-action underline-offset-4 hover:underline">
                    Terms of Agreement
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" className="text-action underline-offset-4 hover:underline">
                    Privacy Statement
                  </Link>
                  .
                </span>
              </label>
            )}

            {error && (
              <div className="animate-shake rounded-sm border border-red-500/40 bg-red-500/10 p-3 font-mono text-xs text-red-500">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-sm bg-action px-6 py-4 text-sm font-bold uppercase tracking-widest text-action-foreground transition-colors hover:bg-action/90 disabled:opacity-50"
            >
              {submitting ? "Processing..." : mode === "signin" ? "Sign In →" : step === "verification" ? "Complete Setup →" : "Activate Shield →"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
              }}
              className="font-mono text-xs uppercase tracking-widest text-titanium-400 hover:text-titanium-50"
            >
              {mode === "signin" ? "→ Need an account? Sign up" : "→ Have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, required, minLength, placeholder,
}: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  required?: boolean; minLength?: number; placeholder?: string;
}) {
  const [typePassword, setTypePassword] = useState(false)

  const onClickHandler = () => {
    setTypePassword(!typePassword)
  }

  return (
    <label className="block">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">{label} <span className="text-red-500">*</span></span>
      <div className="relative">
        <input
          type={type === 'password' ? typePassword ? 'text' : 'password' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          minLength={minLength}
          placeholder={placeholder}
          className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm text-titanium-50 outline-none transition-colors focus:border-action pr-12"
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={onClickHandler}
            className="absolute right-4 top-8 -translate-y-1/2 text-titanium-400 hover:text-titanium-200"
          >
            {typePassword ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-closed-icon lucide-eye-closed"><path d="m15 18-.722-3.25" /><path d="M2 8a10.645 10.645 0 0 0 20 0" /><path d="m20 15-1.726-2.05" /><path d="m4 15 1.726-2.05" /><path d="m9 18 .722-3.25" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>}
          </button>
        )}
      </div>
    </label>
  );
}
