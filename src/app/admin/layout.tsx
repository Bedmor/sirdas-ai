"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

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
      icon: "ph-squares-four",
      active: pathname === "/admin",
      badge: "Canlı",
    },
    {
      name: "Denetim Günlüğü (Audit)",
      href: "/admin/audit-logs",
      icon: "ph-shield-check",
      active: pathname.startsWith("/admin/audit-logs"),
      badge: "Jev & Gemini",
    },
    {
      name: "Çelik Kasa RAG",
      href: "/admin/knowledge",
      icon: "ph-book-bookmark",
      active: pathname.startsWith("/admin/knowledge"),
      badge: "pgvector",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container spiritual-bg-pattern relative overflow-x-hidden">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 w-full border-b border-outline-variant/40 bg-[rgb(14_34_36_/_0.9)] backdrop-blur-xs transition-all shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-4">
          {/* Left: Brand & Return */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-primary transition-colors py-1.5 px-2.5 rounded-lg hover:bg-surface-container border border-transparent hover:border-outline-variant/40"
              title="Siteye Dön"
            >
              <i className="ph ph-arrow-left text-sm"></i>
              <span className="hidden sm:inline">Siteye Dön</span>
            </Link>

            <div className="h-4 w-[1px] bg-outline-variant/40" />

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/60 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
                <Image
                  src="/icon.png"
                  alt="Manevi Pusula Logosu"
                  width={32}
                  height={32}
                  priority
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-sm tracking-wide text-on-surface">
                    Manevi Pusula
                  </span>
                  <span className="text-[10px] font-mono text-primary px-1.5 py-0.5 rounded-full bg-surface-container border border-primary/30 font-medium">
                    v2.5
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Yönetim &amp; Denetim Konsolu
                </span>
              </div>
            </div>
          </div>

          {/* Right: Engine Telemetry & Mode Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/40 text-[11px] text-slate-300">
              <i className="ph ph-cpu text-secondary"></i>
              <span>Jev 1.14 &bull; Gemini 2.5 Flash</span>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-container border border-secondary/30 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
              <span className="text-[11px] text-secondary font-medium hidden sm:inline">
                Sistem Çevrimiçi
              </span>
            </div>

            <span className="text-[11px] font-medium tracking-wide bg-surface-container-highest text-primary border border-primary/40 px-2.5 py-1 rounded-lg shadow-sm">
              Yönetici Modu
            </span>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-1 sm:space-x-2 overflow-x-auto border-t border-outline-variant/30 py-1.5 scrollbar-none">
          {navItems.map((item) => {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                  item.active
                    ? "bg-surface-container-highest text-on-surface font-semibold border border-primary/50 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-surface-container border border-transparent"
                }`}
              >
                <i
                  className={`ph ${item.icon} text-sm ${
                    item.active ? "text-primary" : "text-slate-400"
                  }`}
                ></i>
                <span>{item.name}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      item.active
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-surface-container text-slate-400"
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
      <footer className="border-t border-outline-variant/30 py-3 text-center text-[11px] text-slate-400 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>Manevi Pusula Bilişsel Denetim Ağı &bull; 5 Manevi Süzgeç Koruması</span>
          </div>
          <div className="font-mono text-[10px] text-slate-400">
            Node: tr-ist-edge-01 &bull; pgvector: 768d &bull; Cloudflare R2: sirdas-ai
          </div>
        </div>
      </footer>
    </div>
  );
}
