"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import PhoneInput, { parsePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function AdminAccountPage() {
    const { user, refreshUser } = useAuth();
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [emergencyName, setEmergencyName] = useState("");
    const [emergencyPhone, setEmergencyPhone] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [password, setPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedAt, setSavedAt] = useState<number | null>(null);

    useEffect(() => {
        if (!user) return;
        setEmail(user.email ?? "");
        setFullName(user.full_name ?? "");

        // Normalize phone numbers for react-phone-number-input (must start with +)
        const normalize = (p: string | null) => {
            if (!p) return "";
            return p.startsWith("+") ? p : `+${p}`;
        };

        setPhone(normalize(user.phone));
        setEmergencyName(user.emergency_contact_name ?? "");
        setEmergencyPhone(normalize(user.emergency_contact_phone ?? ""));
        setCity(user.city ?? "");
        setCountry(user.country ?? "");
    }, [user]);

    if (!user) return <div className="font-mono text-xs text-titanium-500">Loading...</div>;

    const handlePhoneChange = (v: string | undefined) => {
        const newPhone = v ?? '';
        setPhone(newPhone);

        if (newPhone) {
            try {
                const phoneNumber = parsePhoneNumber(newPhone);
                if (phoneNumber && phoneNumber.country && !country) {
                    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
                    const detectedCountry = regionNames.of(phoneNumber.country);
                    if (detectedCountry) setCountry(detectedCountry);
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
    };

    const onSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError(null);

        // Validation
        if (fullName.trim().length < 3) {
            setError("Full name must be at least 3 characters long.");
            return;
        }

        const phoneDigits = phone.replace(/\D/g, "");
        if (phoneDigits.length < 4 || phoneDigits.length > 15) {
            setError("Primary phone number must be between 4 and 15 digits.");
            return;
        }

        if (emergencyPhone) {
            const emergencyDigits = emergencyPhone.replace(/\D/g, "");
            if (emergencyDigits.length < 4 || emergencyDigits.length > 15) {
                setError("Emergency contact number must be between 4 and 15 digits.");
                return;
            }
        }

        setSaving(true);
        try {
            const res = await fetch("/api/auth/account", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email,
                    full_name: fullName,
                    phone,
                    password: password,
                    emergency_contact_name: emergencyName,
                    emergency_contact_phone: emergencyPhone,
                    city,
                    country,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save changes");

            setSavedAt(Date.now());
            await refreshUser();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={onSave} className="space-y-10 max-w-3xl">
            <header>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">Admin</span>
                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Account Settings</h1>
            </header>

            {/* Profile Info */}
            <section className="space-y-6 rounded-sm border border-titanium-800 bg-titanium-900/30 p-6">
                <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest text-titanium-400">Profile Information</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Email" type="email" required value={email} onChange={setEmail} />
                    <Field label="Password" type="password" value={password} onChange={setPassword} />
                    <Field label="Full Name" value={fullName} onChange={setFullName} />
                    <Field label="Phone">
                        <PhoneInput
                            placeholder="Enter phone number"
                            value={phone}
                            onChange={handlePhoneChange}
                            defaultCountry="US"
                            international={false}
                            className="phone-input-custom mt-2"
                        />
                    </Field>
                    <Field label="City" value={city} onChange={setCity} />
                    <Field label="Country" value={country} onChange={setCountry} />
                </div>
            </section>

            {/* Emergency Contact */}
            <section className="space-y-6 rounded-sm border border-titanium-800 bg-titanium-900/30 p-6">
                <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest text-titanium-400">Emergency Contact</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Contact Name" value={emergencyName} onChange={setEmergencyName} />
                    <Field label="Contact Phone">
                        <PhoneInput
                            placeholder="Enter phone number"
                            value={emergencyPhone}
                            onChange={(v) => setEmergencyPhone(v ?? "")}
                            defaultCountry="US"
                            international={false}
                            className="phone-input-custom mt-2"
                        />
                    </Field>
                </div>
            </section>

            {/* Membership */}
            <section className="space-y-4 rounded-sm border border-titanium-800 bg-titanium-900/30 p-6">
                <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest text-titanium-400">Membership</h2>
                <div className="flex items-center gap-3">
                    <span className="inline-block rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-red-400">
                        {user.membership_tier}
                    </span>
                    <span className="font-mono text-[10px] text-titanium-500">Administrator access</span>
                </div>
            </section>

            {/* Save */}
            <div className="flex items-center gap-4">
                <div className="flex flex-col gap-4">
                    {error && (
                        <div className="rounded-sm border border-red-500/40 bg-red-500/10 p-3 font-mono text-xs text-red-500">
                            {error}
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-sm bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                        {savedAt && !error && (
                            <span className="font-mono text-[10px] text-emerald-500">
                                ✓ Saved
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </form>
    );
}

function Field({
    label,
    value,
    onChange,
    disabled,
    children,
    type = 'text',
    required,
    minLength,
    placeholder,
}: {
    label: string;
    value?: string;
    onChange?: (v: string) => void;
    disabled?: boolean;
    children?: React.ReactNode;
    type?: string;
    required?: boolean;
    minLength?: number;
    placeholder?: string;
}) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    return (
        <label className="block relative">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">{label}</span>
            {children ? (
                <div className="mt-2">{children}</div>
            ) : (
                <div className="relative">
                    <input
                        type={isPassword ? (showPassword ? "text" : "password") : (type === "email" ? "email" : "text")}
                        value={value}
                        onChange={(e) => onChange?.(e.target.value)}
                        disabled={disabled}
                        required={required}
                        minLength={minLength}
                        placeholder={placeholder}
                        className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm text-titanium-50 outline-none transition-colors focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-50 pr-12"
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-titanium-400 hover:text-titanium-200"
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-.722-3.25" /><path d="M2 8a10.645 10.645 0 0 0 20 0" /><path d="m20 15-1.726-2.05" /><path d="m4 15 1.726-2.05" /><path d="m9 18 .722-3.25" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
                            )}
                        </button>
                    )}
                </div>
            )}
        </label>
    );
}

