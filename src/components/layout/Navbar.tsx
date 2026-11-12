"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MorphingPopover,
  MorphingPopoverTrigger,
  MorphingPopoverContent,
} from "@/components/ui/morphing-popover";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className="left-0 w-full z-40 bg-surface/85 backdrop-blur-md border-b border-outline-variant/40 sticky top-0 shadow-xs"
      role="banner"
    >
      <div className="h-20 max-w-[1200px] mx-auto px-6 flex items-center justify-between gap-4">
        {/* Brand Link */}
        <Link
          aria-label="Manevi Pusula Ana Sayfa"
          className="flex items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
          href="/"
        >
          <div
            aria-hidden="true"
            className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/60 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0"
          >
            <Image
              src="/icon.png"
              alt="Manevi Pusula Logosu"
              width={40}
              height={40}
              priority
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-heading text-xl font-bold tracking-wide text-on-surface leading-none">
              Manevi Pusula
            </span>
            <span className="text-[11px] tracking-widest text-slate-300 uppercase mt-1">
              Manevi Tefekkür &amp; Rehberlik
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Ana Gezinti" className="hidden lg:flex items-center gap-8">
          <Link
            className="text-sm text-primary hover:text-amber-300 font-medium transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412] animate-pulse"
            href="/"
          >
            Tefekkür Odası
          </Link>
          <Link
            className="text-sm text-slate-300 hover:text-primary transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
            href="/araclar"
          >
            Manevi Araçlar
          </Link>
          <Link
            className="text-sm text-slate-300 hover:text-primary transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
            href="/tanitim#sohbet-ornekleri"
          >
            Örnek Senaryolar
          </Link>
          <Link
            className="text-sm text-slate-300 hover:text-primary transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
            href="/askida-sirdas"
          >
            Askıda Pusula
          </Link>
          <Link
            className="text-sm text-slate-300 hover:text-primary transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
            href="/tanitim#gayemiz"
          >
            Vizyon &amp; Misyon
          </Link>
          <Link
            className="text-sm text-slate-300 hover:text-primary transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
            href="/sorumluluk-reddi"
          >
            Sınırlar &amp; Beyan
          </Link>
        </nav>

        {/* Direct Chat Button & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <Link
            aria-label="Manevi Pusula ile doğrudan sohbete başla"
            className="inline-flex items-center gap-2 bg-secondary-container hover:bg-secondary-container/90 text-on-secondary-container border border-secondary/30 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-m3-1 hover:shadow-m3-2 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            href="/"
          >
            <i aria-hidden="true" className="ph ph-chat-circle-dots text-base"></i>
            <span className="hidden sm:inline">Sohbete Başla</span>
            <span className="sm:hidden">Sohbet</span>
          </Link>

          <div className="lg:hidden">
            <MorphingPopover open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <MorphingPopoverTrigger
                aria-label={mobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-300 hover:bg-surface-container hover:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ease-m3e-spring-bouncy hover:scale-105 active:scale-95 cursor-pointer"
              >
                <i className={`ph text-2xl ${mobileMenuOpen ? "ph-x" : "ph-list"}`}></i>
              </MorphingPopoverTrigger>

              <MorphingPopoverContent className="absolute right-0 top-12 w-64 max-w-[calc(100vw-2rem)] rounded-[28px] bg-background/95 backdrop-blur-xl border border-outline-variant/50 p-4 space-y-2 shadow-m3-4 z-50">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-primary hover:text-amber-300 hover:bg-surface-container animate-pulse"
                >
                  Tefekkür Odası
                </Link>
                <Link
                  href="/araclar"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-200 hover:text-primary hover:bg-surface-container transition-colors"
                >
                  Manevi Araçlar
                </Link>
                <Link
                  href="/tanitim#sohbet-ornekleri"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-200 hover:text-primary hover:bg-surface-container transition-colors"
                >
                  Örnek Senaryolar
                </Link>
                <Link
                  href="/askida-sirdas"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-200 hover:text-primary hover:bg-surface-container transition-colors"
                >
                  Askıda Pusula
                </Link>
                <Link
                  href="/tanitim#gayemiz"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-200 hover:text-primary hover:bg-surface-container transition-colors"
                >
                  Vizyon &amp; Misyon
                </Link>
                <Link
                  href="/sorumluluk-reddi"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-200 hover:text-primary hover:bg-surface-container transition-colors"
                >
                  Sınırlar &amp; Beyan
                </Link>
                <Link
                  href="/gizlilik-politikasi"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-200 hover:text-primary hover:bg-surface-container transition-colors"
                >
                  Gizlilik Politikası (KVKK)
                </Link>

                <div className="pt-2 border-t border-outline-variant/30">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full bg-secondary-container hover:bg-[#117a51] text-white font-semibold text-xs shadow-m3-1 transition-all duration-300 ease-m3e-spring-smooth hover:scale-[1.02] active:scale-95"
                  >
                    <i aria-hidden="true" className="ph ph-chat-circle-dots text-base text-secondary"></i>
                    <span>Manevi Pusula ile Dertleş</span>
                  </Link>
                </div>
              </MorphingPopoverContent>
            </MorphingPopover>
          </div>
        </div>
      </div>
    </header>
  );
}
