"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  ShieldCheck,
  BookOpen,
  ArrowLeft,
  Activity,
  Cpu,
  Database,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Genel Bakış",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
      badge: "Canlı",
    },
    {
      name: "Operatör VAS Raporları",
      href: "/admin/vas-reports",
      icon: BarChart3,
      active: pathname.startsWith("/admin/vas-reports"),
      badge: "GSM",
    },
    {
      name: "Denetim Günlüğü (Audit)",
      href: "/admin/audit-logs",
      icon: ShieldCheck,
      active: pathname.startsWith("/admin/audit-logs"),
      badge: "Jev & Gemini",
    },
    {
      name: "Çelik Kasa RAG",
      href: "/admin/knowledge",
      icon: BookOpen,
      active: pathname.startsWith("/admin/knowledge"),
      badge: "pgvector",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#090d0b] text-foreground antialiased selection:bg-amber-500/25 selection:text-amber-200 relative overflow-x-hidden">
      {/* Ambient spiritual glow backdrops */}
      <div
        className="pointer-events-none fixed top-0 right-1/4 w-96 h-96 rounded-full bg-emerald-950/25 blur-3xl -z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed top-40 left-10 w-80 h-80 rounded-full bg-amber-950/15 blur-3xl -z-10"
        aria-hidden="true"
      />

      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 w-full border-b border-emerald-950/70 bg-[#090d0b]/85 backdrop-blur-xl transition-all shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-4">
          {/* Left: Brand & Return */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-400 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-emerald-950/30 border border-transparent hover:border-emerald-800/40"
              title="Siteye Dön"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Siteye Dön</span>
            </Link>

            <div className="h-4 w-[1px] bg-emerald-950" />

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-900/80 to-emerald-950 border border-amber-500/30 flex items-center justify-center text-amber-300 font-serif font-bold text-lg shadow-[0_0_12px_rgba(217,119,6,0.15)] ring-1 ring-amber-500/20">
                س
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-tight text-foreground font-serif">
                    Sırdaş AI
                  </span>
                  <span className="text-[10px] font-mono text-amber-400/90 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 font-medium">
                    v2.5
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Yönetim &amp; Denetim Konsolu
                </span>
              </div>
            </div>
          </div>

          {/* Right: Engine Telemetry & Mode Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-[11px] text-muted-foreground">
              <Cpu className="h-3 w-3 text-emerald-400" />
              <span>Jev 1.14 &bull; Gemini 2.5 Flash</span>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-800/40 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] text-emerald-300 font-medium hidden sm:inline">
                Sistem Çevrimiçi
              </span>
            </div>

            <Badge
              variant="gold"
              className="text-[11px] font-medium tracking-wide bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(217,119,6,0.1)]"
            >
              Yönetici Modu
            </Badge>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-1 sm:space-x-2 overflow-x-auto border-t border-emerald-950/60 py-1.5 scrollbar-none">
          {navItems.map((item) => {
            const IconComp = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                  item.active
                    ? "bg-emerald-950 text-emerald-200 font-semibold border border-emerald-700/50 shadow-[0_0_12px_rgba(6,78,59,0.4)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-emerald-950/30 hover:border hover:border-emerald-900/40 border border-transparent"
                }`}
              >
                <IconComp
                  className={`h-3.5 w-3.5 ${
                    item.active ? "text-amber-400" : "text-muted-foreground"
                  }`}
                />
                <span>{item.name}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                      item.active
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Admin Footer bar */}
      <footer className="border-t border-emerald-950/60 py-3 text-center text-[11px] text-muted-foreground/70 bg-[#090d0b]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="h-3 w-3 text-emerald-500" />
            <span>Sırdaş AI Bilişsel Denetim Ağı &bull; 5 Manevi Süzgeç Koruması</span>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground/60">
            Node: tr-ist-edge-01 &bull; pgvector: 768d &bull; Cloudflare R2: sirdas-ai
          </div>
        </div>
      </footer>
    </div>
  );
}

