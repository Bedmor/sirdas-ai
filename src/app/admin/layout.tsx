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
  Layers,
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
    },
    {
      name: "Operatör VAS Raporları",
      href: "/admin/vas-reports",
      icon: BarChart3,
      active: pathname.startsWith("/admin/vas-reports"),
    },
    {
      name: "Denetim Günlüğü (Audit)",
      href: "/admin/audit-logs",
      icon: ShieldCheck,
      active: pathname.startsWith("/admin/audit-logs"),
    },
    {
      name: "Çelik Kasa RAG",
      href: "/admin/knowledge",
      icon: BookOpen,
      active: pathname.startsWith("/admin/knowledge"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-card/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Siteye Dön</span>
            </Link>

            <div className="h-4 w-[1px] bg-border" />

            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-950 border border-amber-500/40 flex items-center justify-center text-amber-300 font-serif font-bold text-lg">
                س
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-foreground font-serif">
                  Sırdaş AI
                </span>
                <span className="text-[11px] text-muted-foreground ml-2 px-1.5 py-0.5 rounded bg-muted">
                  Yönetim Konsolu
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Sistem Çevrimiçi</span>
            </div>
            <Badge variant="gold" className="text-[11px]">
              Yönetici Modu
            </Badge>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-1 sm:space-x-4 overflow-x-auto border-t border-border/40 py-1">
          {navItems.map((item) => {
            const IconComp = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  item.active
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <IconComp className="h-3.5 w-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
