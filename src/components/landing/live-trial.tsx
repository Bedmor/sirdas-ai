"use client";

import React from "react";
import Link from "next/link";
import {
  Scenario,
  SCENARIOS_DATA,
  EXAMPLE_TOPICS,
} from "./trial-scenarios-data";
import { ScenariosShowcase } from "./scenarios-showcase";

export type { Scenario };
export { SCENARIOS_DATA, EXAMPLE_TOPICS };

export function LiveTrialSection({ waUrl }: { waUrl: string }) {
  return (
    <div
      aria-label="Manevi Pusula Örnek Manevi Hasbihaller"
      className="w-full max-w-3xl mx-auto mt-8 sm:mt-12 text-left"
      id="sohbet-ornekleri"
    >
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/40 bg-[#0b141a]">
        {/* Chat Interface Header */}
        <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                aria-hidden="true"
                className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary"
              >
                <span className="material-symbols-outlined text-2xl">spa</span>
              </div>
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-white text-sm font-bold">Manevi Pusula</span>
                <span
                  aria-label="Onaylı Manevi Pusula Hattı"
                  className="material-symbols-outlined text-secondary text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
              </div>
              <span className="text-emerald-400 text-xs leading-tight font-medium">
                Örnek Manevi Hasbihaller &amp; Hikmetli Cevaplar
              </span>
            </div>
          </div>

          <Link
            href={waUrl || "/"}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary-container hover:bg-[#117a51] text-white text-xs font-semibold tracking-wide transition-colors"
          >
            <span>Sohbete Başla</span>
            <i className="ph ph-arrow-right text-xs" />
          </Link>
        </div>

        {/* SCENARIOS SHOWCASE */}
        <ScenariosShowcase waUrl={waUrl} />
      </div>
    </div>
  );
}
