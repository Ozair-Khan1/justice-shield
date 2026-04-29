"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

interface Profile {
  full_name: string;
  phone: string | null;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  membership_tier: string;
}

export default function AccountPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    setProfile(
      {
        full_name: user.full_name ?? "",
        phone: user.phone ?? "",
        emergency_contact_name: user.emergency_contact_name ?? "",
        emergency_contact_phone: user.emergency_contact_phone ?? "",
        membership_tier: user.membership_tier ?? "basic",
      }
    );
  }, [user]);

  if (!profile || !user) return <div className="font-mono text-xs text-titanium-500">Loading...</div>;

  const update = (k: keyof Profile, v: string) => setProfile({ ...profile, [k]: v });

  const onSave = async () => {
    setSaving(true);
    const { error } = await fetch("/api/auth/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: profile.full_name,
        phone: profile.phone,
        emergency_contact_name: profile.emergency_contact_name,
        emergency_contact_phone: profile.emergency_contact_phone,
      })
    }).then(res => res.json());
    setSaving(false);
    if (!error) setSavedAt(Date.now());
  };

  return (
    <div className="space-y-12 max-w-3xl">
      <header>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">Member Profile</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Account</h1>
      </header>

      <section className="space-y-6 rounded-lg border border-titanium-800 bg-titanium-900/40 p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-titanium-500">Membership</div>
            <div className="mt-1 font-display text-2xl font-bold uppercase">{profile.membership_tier}</div>
          </div>
          <span className="rounded-sm border border-action/40 bg-action/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-action">Active</span>
        </div>

        <Field label="Full Name" value={profile.full_name ?? ""} onChange={(v) => update("full_name", v)} />
        <Field label="Phone" value={profile.phone ?? ""} onChange={(v) => update("phone", v)} type="tel" />

        <div className="border-t border-titanium-800 pt-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-action">Emergency Contact</div>
          <p className="mt-2 text-sm text-titanium-400">Notified automatically when you trigger an SOS.</p>
          <div className="mt-6 space-y-4">
            <Field label="Contact Name" value={profile.emergency_contact_name ?? ""} onChange={(v) => update("emergency_contact_name", v)} />
            <Field label="Contact Phone" value={profile.emergency_contact_phone ?? ""} onChange={(v) => update("emergency_contact_phone", v)} type="tel" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onSave} disabled={saving}
            className="rounded-sm bg-action px-6 py-3 text-sm font-bold uppercase tracking-widest text-action-foreground hover:bg-action/90 disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {savedAt && <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500">✓ Saved</span>}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm outline-none focus:border-action" />
    </label>
  );
}
