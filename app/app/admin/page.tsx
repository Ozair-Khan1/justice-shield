"use client";

import { useEffect, useState } from "react";
import { Shield, Users, FileText, AlertTriangle, Briefcase, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { motion } from "framer-motion";

interface Stats {
  userCount: number;
  sessionCount: number;
  intakeCount: number;
  alertCount: number;
  vendorCount: number;
  pendingVendors: number;
}

interface RecentUser {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  membership_tier: string;
  created_at: string;
}

interface RecentVendor {
  id: string;
  vendor_type: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentVendors, setRecentVendors] = useState<RecentVendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setRecentUsers(data.recentUsers ?? []);
        setRecentVendors(data.recentVendors ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="font-mono text-xs text-titanium-500">Loading admin data...</div>;
  }

  const statCards = [
    { label: "Total Users", value: stats?.userCount ?? 0, icon: Users, color: "text-blue-400" },
    { label: "SOS Sessions", value: stats?.sessionCount ?? 0, icon: Shield, color: "text-red-400" },
    { label: "Civil Intakes", value: stats?.intakeCount ?? 0, icon: FileText, color: "text-amber-400" },
    { label: "Emergency Alerts", value: stats?.alertCount ?? 0, icon: AlertTriangle, color: "text-orange-400" },
    { label: "Vendor Applications", value: stats?.vendorCount ?? 0, icon: Briefcase, color: "text-emerald-400", href: "/app/admin/vendors" },
    { label: "Pending Vendors", value: stats?.pendingVendors ?? 0, icon: Clock, color: "text-purple-400", href: "/app/admin/vendors" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-10"
    >
      <header>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">
          Admin Panel
        </span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Platform Overview</h1>
        <p className="mt-2 text-sm text-titanium-400">
          Real-time statistics and recent activity across the platform.
        </p>
      </header>

      {/* Stat Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
      >
        {statCards.map((card) => {
          const content = (
            <motion.div
              variants={itemVariants}
              className="rounded-sm border border-titanium-800 bg-titanium-900/50 p-4 transition-colors hover:border-titanium-700 h-full cursor-pointer group"
            >
              <card.icon className={`size-5 transition-transform group-hover:scale-110 ${card.color}`} />
              <p className="mt-3 font-display text-2xl font-bold">{card.value}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-titanium-500">
                {card.label}
              </p>
            </motion.div>
          );

          if (card.href) {
            return (
              <Link key={card.label} href={card.href}>
                {content}
              </Link>
            );
          }

          return <div key={card.label}>{content}</div>;
        })}
      </motion.div>

      {/* Recent Users Table */}
      <section>
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest text-titanium-400">
          Recent Users
        </h2>
        <div className="mt-4 overflow-x-auto rounded-sm border border-titanium-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-titanium-800 bg-titanium-900/60">
              <tr>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Name</th>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Email</th>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Role</th>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Tier</th>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-titanium-800/60">
              {recentUsers.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-titanium-900/40">
                  <td className="px-4 py-3 text-titanium-200">{u.full_name || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-titanium-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${u.role === "ADMIN"
                      ? "bg-red-500/15 text-red-400"
                      : u.role === "ATTORNEY"
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-titanium-700/40 text-titanium-400"
                      }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs capitalize text-titanium-400">{u.membership_tier}</td>
                  <td className="px-4 py-3 font-mono text-xs text-titanium-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-titanium-500">No users yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Vendor Applications */}
      <section>
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest text-titanium-400">
          Recent Vendor Applications
        </h2>
        <div className="mt-4 overflow-x-auto rounded-sm border border-titanium-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-titanium-800 bg-titanium-900/60">
              <tr>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Name</th>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Email</th>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Type</th>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-titanium-800/60">
              {recentVendors.map((v) => (
                <tr key={v.id} className="transition-colors hover:bg-titanium-900/40">
                  <td className="px-4 py-3 text-titanium-200">{v.full_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-titanium-400">{v.email}</td>
                  <td className="px-4 py-3 font-mono text-[10px] uppercase text-titanium-400">
                    {v.vendor_type.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${v.status === "approved"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : v.status === "rejected"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-amber-500/15 text-amber-400"
                      }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-titanium-500">
                    {new Date(v.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentVendors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-titanium-500">No applications yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
}
