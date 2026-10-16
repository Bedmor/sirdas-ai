"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+905550200605";
  const cleanWaNumber = waNumber.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${cleanWaNumber}?text=Selamun%20Aleykum`;

  return (
    <header
      className="left-0 w-full z-40 bg-[#080c0a]/90 backdrop-blur-md border-b border-outline-variant/40 sticky top-0"
      role="banner"
    >
      <div className="h-20 max-w-[1200px] mx-auto px-6 flex items-center justify-between gap-4">
        {/* Brand Link */}
        <Link
          aria-label="Sırdaş AI Ana Sayfa"
          className="flex items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
          href="/"
        >
          <div
            aria-hidden="true"
            className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/60 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0"
          >
            <Image
              src="/icon.png"
              alt="Sırdaş AI Logosu"
              width={40}
              height={40}
              priority
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-heading text-xl font-bold tracking-wide text-on-surface leading-none">
              Sırdaş AI
            </span>
            <span className="text-[11px] tracking-widest text-slate-300 uppercase mt-1">
              Manevi Tefekkür &amp; Rehberlik
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Ana Gezinti" className="hidden lg:flex items-center gap-8">
          <Link
            className="text-sm text-primary hover:text-amber-300 font-medium transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
            href="/#simdi-dene"
          >
            Şimdi Dene
          </Link>
          <Link
            className="text-sm text-slate-300 hover:text-primary transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
            href="/#sohbet-ornekleri"
          >
            Tefekkür Odaları
          </Link>
          <Link
            className="text-sm text-slate-300 hover:text-primary transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
            href="/askida-sirdas"
          >
            Askıda Sırdaş
          </Link>
          <Link
            className="text-sm text-slate-300 hover:text-primary transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
            href="/#gayemiz"
          >
            Gayemiz
          </Link>
          <Link
            className="text-sm text-slate-300 hover:text-primary transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
            href="/sorumluluk-reddi"
          >
            Sınırlar &amp; Beyan
          </Link>
          <Link
            className="text-sm text-slate-300 hover:text-primary transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
            href="/admin"
          >
            Yönetim
          </Link>
        </nav>

        {/* WhatsApp Button & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <a
            aria-label="WhatsApp üzerinden Sırdaş AI ile sohbete başla (Yeni sekmede açılır)"
            className="inline-flex items-center gap-2 bg-[#12231b] hover:bg-[#183125] text-secondary border border-secondary/30 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
            href={waUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <i aria-hidden="true" className="ph ph-whatsapp-logo text-base"></i>
            <span className="hidden sm:inline">WhatsApp&apos;ta Başla</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            aria-label={mobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
            className="lg:hidden rounded-lg p-2 text-slate-300 hover:bg-surface-container hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <i className={`ph text-2xl ${mobileMenuOpen ? "ph-x" : "ph-list"}`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-outline-variant/40 bg-[#080c0a]/95 backdrop-blur-xl px-6 pt-4 pb-6 space-y-3">
          <Link
            href="/#simdi-dene"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-semibold text-primary hover:bg-surface-container"
          >
            Şimdi Dene (1 Hak)
          </Link>
          <Link
            href="/#sohbet-ornekleri"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:text-primary hover:bg-surface-container"
          >
            Tefekkür Odaları
          </Link>
          <Link
            href="/askida-sirdas"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:text-primary hover:bg-surface-container"
          >
            Askıda Sırdaş
          </Link>
          <Link
            href="/#gayemiz"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:text-primary hover:bg-surface-container"
          >
            Gayemiz
          </Link>
          <Link
            href="/sorumluluk-reddi"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:text-primary hover:bg-surface-container"
          >
            Sınırlar &amp; Beyan
          </Link>
          <Link
            href="/gizlilik-politikasi"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:text-primary hover:bg-surface-container"
          >
            Gizlilik Politikası (KVKK)
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:text-primary hover:bg-surface-container"
          >
            Yönetim Konsolu
          </Link>

          <div className="pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full bg-secondary-container hover:bg-[#117a51] text-white font-semibold text-xs shadow transition-all"
            >
              <i aria-hidden="true" className="ph ph-whatsapp-logo text-base"></i>
              <span>WhatsApp ile Dertleş</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
