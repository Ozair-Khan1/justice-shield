"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import PhoneInput, { parsePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useLoading } from "@/components/LoadingProvider";
import { Country, City } from 'country-state-city';
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";
import * as React from "react";




interface Profile {
  full_name: string;
  phone: string;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  membership_tier: string;
  city?: string | null;
  country?: string | null;
  specialties: string;
}

export default function AccountPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const { startLoading, stopLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [specialtiesOpen, setSpecialtiesOpen] = useState(false);
  const specialtiesRef = React.useRef<HTMLTextAreaElement>(null);


  useEffect(() => {
    if (!user) return;
    const normalize = (p: string | null | undefined) => {
      if (!p) return "";
      return p.startsWith("+") ? p : `+${p}`;
    };
    setProfile(
      {
        full_name: user.full_name ?? "",
        phone: normalize(user.phone),
        emergency_contact_name: user.emergency_contact_name ?? "",
        emergency_contact_phone: normalize(user.emergency_contact_phone),
        membership_tier: user.membership_tier ?? "basic",
        city: user.city ?? "",
        country: user.country ?? "",
        specialties: (user as any).specialties || "",
      }
    );
  }, [user]);

  if (!profile || !user) return <div className="font-mono text-xs text-titanium-500">Loading...</div>;

  const update = (k: keyof Profile, v: string) => setProfile({ ...profile, [k]: v });

  const handlePhoneChange = (v: string | undefined) => {
    const newPhone = v ?? '';
    let updates: Partial<Profile> = { phone: newPhone };

    if (newPhone) {
      try {
        const phoneNumber = parsePhoneNumber(newPhone);
        if (phoneNumber && phoneNumber.country) {
          try {
            const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
            const detectedCountry = regionNames.of(phoneNumber.country);

            if (detectedCountry && !profile.country) {
              updates.country = detectedCountry;
            }
          } catch (intlError) {
            // Fallback to code if Intl fails
            if (!profile.country) updates.country = phoneNumber.country;
          }
        }
      } catch (e) {
        // Ignore parsing errors for partial numbers
      }
    }

    setProfile(prev => ({ ...prev!, ...updates }));
  };

  const onSave = async () => {
    if (!profile) return;
    setSaving(true);
    startLoading("Syncing Profile Data...");
    setError(null);

    try {
      if (profile?.full_name.trim().length === 0) {
        throw new Error("Please enter your full name.");
      } else if (profile?.full_name.trim().length < 3) {
        throw new Error("Full name must be at least 3 characters long.");
      }

      if (profile?.phone) {
        const phoneDigits = profile.phone.replace(/\D/g, "");
        if (phoneDigits.length < 4 || phoneDigits.length > 15) {
          throw new Error("Primary phone number must be between 4 and 15 digits.");
        }
      } else {
        throw new Error("Please enter your phone number.");
      }

      if (profile?.emergency_contact_name && profile?.emergency_contact_name.trim().length < 3) {
        throw new Error("Emergency contact name must be at least 3 characters long.");
      }

      if (profile?.emergency_contact_phone) {
        const emergencyDigits = profile.emergency_contact_phone.replace(/\D/g, "");
        if (emergencyDigits.length < 4 || emergencyDigits.length > 15) {
          throw new Error("Emergency contact number must be between 4 and 15 digits.");
        }
      }

      const data = await fetch("/api/auth/account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          phone: profile.phone,
          emergency_contact_name: profile.emergency_contact_name,
          emergency_contact_phone: profile.emergency_contact_phone,
          city: profile.city,
          country: profile.country,
          specialties: profile.specialties.trim().toLowerCase(),
        })
      }).then(res => res.json());

      if (data.error) {
        throw new Error(data.error);
      }

      setSavedAt(Date.now());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
      stopLoading();
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-12 max-w-3xl">

        <header>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">Member Profile</span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Account</h1>
        </header>

        <section className="space-y-6 rounded-lg border border-titanium-800 bg-titanium-900/40 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-titanium-500">Membership</div>
              <div className="mt-1 font-display text-2xl font-bold uppercase">{user.membership_tier}</div>
            </div>
            <span className="rounded-sm border border-action/40 bg-action/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-action">Active</span>
          </div>

          <Field label="Full Name" value={profile.full_name ?? ""} onChange={(v) => update("full_name", v)} />
          <label className="block">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Phone <span className="text-red-500">*</span></span>
            <PhoneInput
              placeholder="Enter phone number"
              value={profile.phone ?? ''}
              onChange={handlePhoneChange}
              defaultCountry="US"
              international={false}
              className="phone-input-custom mt-2"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Country</span>
              <select
                value={Country.getAllCountries().find(c => c.name === profile.country)?.isoCode || ""}
                onChange={(e) => {
                  const countryCode = e.target.value;
                  const countryName = Country.getCountryByCode(countryCode)?.name || "";
                  setProfile(prev => ({ ...prev!, country: countryName, city: "" }));
                }}
                className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm text-titanium-50 outline-none transition-colors focus:border-action disabled:opacity-50 cursor-pointer"
              >
                <option value="">Select Country</option>
                {Country.getAllCountries().map((c) => (
                  <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">City</span>
              <select
                value={profile.city ?? ""}
                onChange={(e) => update("city", e.target.value)}
                disabled={!profile.country}
                className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm text-titanium-50 outline-none transition-colors focus:border-action disabled:opacity-50 cursor-pointer"
              >
                <option value="">Select City</option>
                {profile.country && City.getCitiesOfCountry(Country.getAllCountries().find(c => c.name === profile.country)?.isoCode || "")?.map((city, index) => (
                  <option key={`${city.name}-${index}`} value={city.name}>{city.name}</option>
                ))}
              </select>
            </label>
          </div>

          {user.role === "ATTORNEY" && (
            <div className="border-t border-titanium-800 pt-6">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-action">Professional Specialties</span>
              <p className="mt-2 text-xs text-titanium-500">Comma-separated list of your legal practice areas (e.g., Criminal Law, Civil Litigation, Family Law).</p>
              <Popover open={specialtiesOpen} onOpenChange={setSpecialtiesOpen}>
                <PopoverAnchor asChild>
                  <textarea
                    ref={specialtiesRef}
                    value={profile.specialties}
                    onChange={(e) => setProfile({ ...profile, specialties: e.target.value })}
                    onFocus={() => setSpecialtiesOpen(true)}
                    onMouseEnter={() => setSpecialtiesOpen(true)}
                    onMouseLeave={() => document.activeElement !== specialtiesRef.current && setSpecialtiesOpen(false)}
                    rows={2}
                    className="mt-4 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm text-titanium-50 outline-none transition-colors focus:border-action"
                  />
                </PopoverAnchor>
                <PopoverContent
                  side="top"
                  align="center"
                  sideOffset={8}
                  collisionPadding={10}
                  className="z-50 w-auto max-w-[280px] overflow-hidden rounded-md bg-action px-3 py-1.5 text-xs text-action-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 border-none shadow-xl"
                >
                  <p className="text-center font-medium">Please separate multiple specialties with commas.</p>
                </PopoverContent>
              </Popover>

            </div>
          )}

          {user.role !== "ATTORNEY" && (
            <div className="border-t border-titanium-800 pt-6">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-action">Emergency Contact</div>
              <p className="mt-2 text-sm text-titanium-400">Notified automatically when you trigger an SOS.</p>
              <div className="mt-6 space-y-4">
                <Field label="Contact Name" value={profile.emergency_contact_name ?? ""} onChange={(v) => update("emergency_contact_name", v)} />
                <label className="block">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Contact Number</span>
                  <PhoneInput
                    placeholder="Enter phone number"
                    value={profile.emergency_contact_phone ?? ''}
                    onChange={(v) => update("emergency_contact_phone", v ?? '')}
                    defaultCountry="US"
                    international={false}
                    className="phone-input-custom mt-2"
                  />
                </label>
              </div>
            </div>
          )}

          {error && (
            <div className="animate-shake rounded-sm border border-red-500/40 bg-red-500/10 p-3 font-mono text-xs text-red-500">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button onClick={onSave} disabled={saving}
              className="rounded-sm bg-action px-6 py-3 text-sm font-bold uppercase tracking-widest text-action-foreground hover:bg-action/90 disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {savedAt && <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500">✓ Saved</span>}
          </div>
        </section>
      </div>
    </TooltipProvider>
  );

}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string, placeholder?: string }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">{label} {label === 'Full Name' ? <span className="text-red-500">*</span> : ''}</span>
      <input type={type} value={value} onChange={(e) => onChange(type === "password" ? e.target.value.trim() : e.target.value)} placeholder={placeholder}
        className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm outline-none focus:border-action" />
    </label>
  );
}