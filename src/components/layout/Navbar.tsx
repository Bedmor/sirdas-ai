"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MessageCircle, Menu, X, HeartHandshake, Shield, Sparkles, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+905550200605";
  const cleanWaNumber = waNumber.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${cleanWaNumber}?text=Selamun%20Aleykum`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-90 group"
          aria-label="Sırdaş AI Ana Sayfa"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 border border-amber-500/40 flex items-center justify-center text-amber-300 font-serif font-bold text-2xl shadow-inner shadow-amber-500/10 group-hover:scale-105 transition-transform">
            س
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-foreground font-serif">
                Sırdaş AI
              </span>
              <span className="inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-700/20">
                15.1
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground -mt-0.5 font-light tracking-wide">
              Bütünsel İslami Rehberlik
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium" aria-label="Ana Menü">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Ana Sayfa
          </Link>
          <Link
            href="/#manevi-suzgecler"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            5 Manevi Süzgeç
          </Link>
          <Link
            href="/askida-sirdas"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <HeartHandshake className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Askıda Sırdaş
          </Link>
          <Link
            href="/sorumluluk-reddi"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Shield className="h-3.5 w-3.5 text-amber-600" />
            Manevi Sınırlar
          </Link>
          <Link
            href="/admin"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-blue-500" />
            Yönetim
          </Link>
        </nav>

        {/* Action Button */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm shadow-sm transition-all hover:shadow-emerald-900/20 active:scale-95 border border-emerald-700/40"
          >
            <MessageCircle className="h-4 w-4 text-emerald-300" />
            <span>Sırdaş ile Konuş</span>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          type="button"
          aria-label={mobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
          className="md:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
          >
            Ana Sayfa
          </Link>
          <Link
            href="/#manevi-suzgecler"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
          >
            5 Manevi Süzgeç
          </Link>
          <Link
            href="/askida-sirdas"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
          >
            Askıda Sırdaş (İnfak Havuzu)
          </Link>
          <Link
            href="/sorumluluk-reddi"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
          >
            Sorumluluk Reddi & Fıkhi Sınırlar
          </Link>
          <Link
            href="/gizlilik-politikasi"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
          >
            Gizlilik Politikası (KVKK)
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted"
          >
            Yönetim Paneli
          </Link>

          <div className="pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm shadow transition-all"
            >
              <MessageCircle className="h-4 w-4 text-emerald-300" />
              <span>WhatsApp ile Hemen Başla</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
