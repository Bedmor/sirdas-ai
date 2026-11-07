"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { SCENARIOS_DATA } from "./trial-scenarios-data";

export function ScenariosShowcase({
  waUrl,
  onSwitchToTrial,
}: {
  waUrl: string;
  onSwitchToTrial?: () => void;
}) {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSeconds, setAudioSeconds] = useState(41);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlayingAudio) {
      audioIntervalRef.current = setInterval(() => {
        setAudioSeconds((sec) => {
          if (sec < 102) return sec + 1;
          setIsPlayingAudio(false);
          return 41;
        });
      }, 1000);
    } else if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isPlayingAudio]);

  const audioTimeFormatted = `${Math.floor(audioSeconds / 60)}:${String(
    audioSeconds % 60
  ).padStart(2, "0")} / 1:42`;

  const navigateScenario = useCallback((direction: number) => {
    setScenarioIndex((prev) => {
      const next = prev + direction;
      if (next < 0) return SCENARIOS_DATA.length - 1;
      if (next >= SCENARIOS_DATA.length) return 0;
      return next;
    });
  }, []);

  const currentScenario = SCENARIOS_DATA[scenarioIndex];

  return (
    <>
      {/* Scenario Navigation Bar */}
      <div className="bg-[#111b21] px-4 py-2.5 border-b border-outline-variant/20 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {SCENARIOS_DATA.map((sc, idx) => {
            const isActive = scenarioIndex === idx;
            return (
              <button
                key={sc.num}
                onClick={() => setScenarioIndex(idx)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#005c4b] text-white font-medium shadow-sm"
                    : "bg-[#202c33]/70 text-slate-300 hover:text-white hover:bg-[#202c33]"
                }`}
                type="button"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? "bg-secondary" : "bg-slate-400"
                  }`}
                />
                <span>{sc.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Next/Prev Navigation */}
        <div className="flex items-center gap-1 bg-[#1f2c34] px-2 py-1 rounded-lg border border-outline-variant/30 text-xs shrink-0">
          <button
            aria-label="Önceki örnek sohbete geç"
            className="p-1 text-slate-300 hover:text-white transition-colors"
            onClick={() => navigateScenario(-1)}
            type="button"
          >
            <i className="ph ph-caret-left text-sm" />
          </button>
          <span className="font-mono text-xs px-1 text-primary font-medium">
            {currentScenario.num} / 05
          </span>
          <button
            aria-label="Sonraki örnek sohbete geç"
            className="p-1 text-slate-300 hover:text-white transition-colors"
            onClick={() => navigateScenario(1)}
            type="button"
          >
            <i className="ph ph-caret-right text-sm" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="p-4 md:p-6 min-h-[300px] flex flex-col justify-between gap-4 bg-gradient-to-b from-[#0b141a] via-[#091117] to-[#0b141a]">
        {/* User Bubble */}
        <div className="self-end max-w-[85%] bg-[#005c4b] text-white p-3.5 rounded-xl rounded-tr-none shadow-md">
          <p className="text-sm leading-relaxed" lang="tr">
            {currentScenario.userText}
          </p>
          <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-slate-300">
            <span>{currentScenario.userTime}</span>
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-xs text-[#53bdeb]"
            >
              done_all
            </span>
          </div>
        </div>

        {/* Assistant Response Bubble */}
        <div className="self-start max-w-[92%] bg-[#202c33] text-on-surface p-4 rounded-xl rounded-tl-none shadow-lg flex flex-col gap-3">
          {/* Sacred Ayah Card Quote */}
          <div className="bg-[#182229] rounded-lg p-3 pl-3.5 border-l-4 border-primary">
            <p
              className="text-primary text-[14px] italic mb-1 leading-snug"
              lang="tr"
            >
              {currentScenario.ayah}
            </p>
            <div className="flex items-center justify-between text-slate-300 text-[11px]">
              <span className="text-primary-fixed-dim font-medium">
                {currentScenario.focusNote}
              </span>
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-xs text-primary"
              >
                auto_stories
              </span>
            </div>
          </div>

          {/* Guidance Message */}
          <p className="text-sm leading-relaxed text-[#d1d7db]" lang="tr">
            {currentScenario.reply}
          </p>

          {/* Audio Player Widget */}
          <div
            aria-label="Sesli tefekkür kaydı önizlemesi"
            className="bg-[#111b21] p-3 rounded-lg flex items-center gap-3"
          >
            <button
              aria-label="Sesli tefekkür kaydı önizlemesi (1 dakika 42 saniye)"
              aria-pressed={isPlayingAudio ? "true" : "false"}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm hover:scale-105 transition-transform flex-shrink-0 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              type="button"
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-xl"
              >
                {isPlayingAudio ? "pause" : "play_arrow"}
              </span>
            </button>
            <div className="flex flex-col flex-grow min-w-0">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-on-surface truncate font-medium">
                  Kısa Sesli Tefekkür • Gönle Ferahlık
                </span>
                <span
                  aria-live="off"
                  className="text-primary font-mono text-[11px] font-medium"
                >
                  {audioTimeFormatted}
                </span>
              </div>
              <div
                aria-hidden="true"
                className="flex items-center gap-1 h-4 w-full"
              >
                <span className="w-1 h-3 bg-primary rounded-full"></span>
                <span className="w-1 h-4 bg-primary rounded-full"></span>
                <span className="w-1 h-2 bg-primary rounded-full"></span>
                <span className="w-1 h-4 bg-primary rounded-full"></span>
                <span
                  className={`w-1 h-4 bg-primary rounded-full ${
                    isPlayingAudio ? "animate-pulse" : ""
                  }`}
                ></span>
                <span className="w-1 h-3 bg-primary rounded-full"></span>
                <span className="w-1 h-4 bg-primary rounded-full"></span>
                <span className="w-1 h-2 bg-surface-container-highest rounded-full"></span>
                <span className="w-1 h-3 bg-surface-container-highest rounded-full"></span>
                <span className="w-1 h-4 bg-surface-container-highest rounded-full"></span>
                <span className="w-1 h-3 bg-surface-container-highest rounded-full"></span>
                <span className="w-1 h-4 bg-surface-container-highest rounded-full"></span>
                <span className="w-1 h-2 bg-surface-container-highest rounded-full"></span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">
              {currentScenario.title}
            </span>
            <div className="text-[11px] text-slate-300 font-mono">
              {currentScenario.botTime}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions for Scenarios */}
      <div className="bg-[#1f2c34] p-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-slate-300 text-center sm:text-left">
          Kendi gönül meselenizi Kur&apos;an ve Sünnet hikmetiyle doğrudan hasbihal edin.
        </span>
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Link
            aria-label="Tefekkür Odasında Manevi Pusula ile sohbete başla"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-secondary-container hover:bg-[#117a51] text-white px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-colors shadow-md hover:shadow-secondary/10"
            href={waUrl || "/"}
          >
            <i className="ph ph-chat-circle-dots text-base text-secondary" />
            <span>Tefekkür Odasında Sohbete Başla →</span>
          </Link>
        </div>
      </div>
    </>
  );
}
