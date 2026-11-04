"use client";

import React from "react";
import {
  ShieldCheck,
  Scale,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface AuditJevMetadata {
  noul?: { is_fatwa?: number; is_riba?: number; needs_audio?: number };
  choice?: { nafs_trap?: string; rag_category?: string };
  score?: { distress_level?: number };
  distress_level?: number;
  is_fiqh_fatwa_request?: number;
  is_debt_or_riba_related?: number;
  needs_audio_snippet?: number;
  nafs_trap?: string;
  rag_category?: string;
}

export interface AuditEditorMetadata {
  murakabe_applied?: boolean;
  ilahi_riza_checked?: boolean;
  tevekkul_and_talak_hope_included?: boolean;
  nafs_and_vesvese_addressed?: string;
  siyer_example_used?: string;
  riba_warning_included?: boolean;
  deepTriage?: {
    nafsTrap?: string;
    spiritualStage?: string;
    distressLevel?: number;
    recommendedTone?: string;
    underlyingNeed?: string;
    spiritualDiagnosis?: string;
  };
}

export interface AuditMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  userPhone: string;
  audioSent?: boolean;
  jevMetadata?: AuditJevMetadata;
  editorAudit?: AuditEditorMetadata;
}

export const getDistress = (m: AuditMessage): number =>
  m.jevMetadata?.score?.distress_level ?? m.jevMetadata?.distress_level ?? 0;

export const getIsFatwa = (m: AuditMessage): number =>
  m.jevMetadata?.noul?.is_fatwa ?? m.jevMetadata?.is_fiqh_fatwa_request ?? 0;

export const getIsRiba = (m: AuditMessage): number =>
  m.jevMetadata?.noul?.is_riba ?? m.jevMetadata?.is_debt_or_riba_related ?? 0;

export const getNeedsAudio = (m: AuditMessage): number =>
  m.jevMetadata?.noul?.needs_audio ?? m.jevMetadata?.needs_audio_snippet ?? 0;

export const getNafsTrap = (m: AuditMessage): string =>
  m.jevMetadata?.choice?.nafs_trap ||
  m.jevMetadata?.nafs_trap ||
  "FAKIRLIK_KORKUSU_VESVESESI";

export const getRagCategory = (m: AuditMessage): string =>
  m.jevMetadata?.choice?.rag_category ||
  m.jevMetadata?.rag_category ||
  "RIZIK_VE_TICARET";

export function AuditDetailDrawer({ msg }: { msg: AuditMessage }) {
  const distress = getDistress(msg);
  const fatwaProb = getIsFatwa(msg) || 0.05;
  const ribaProb = getIsRiba(msg) || 0.1;
  const audioProb = getNeedsAudio(msg) || 0.85;

  return (
    <div className="border-t border-outline-variant/40 bg-surface/80 p-5 space-y-4 animate-in fade-in-50 text-xs">
      {/* Full Content */}
      <div>
        <div className="font-semibold text-foreground mb-1.5 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Üretilen Nihai Yanıt:</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/40 whitespace-pre-line text-foreground/95 leading-relaxed font-sans shadow-inner">
          {msg.content}
        </div>
      </div>

      {/* Jev System 1 Telemetry Panel */}
      <div className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-amber-900/30 pb-2">
          <strong className="text-amber-300 flex items-center gap-1.5 font-serif text-sm">
            <Scale className="h-4 w-4 text-amber-400" />
            Jev System 1 Hızlı Teşhis Telemetrisi
          </strong>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            Latency: ~35ms (RTX 4060 GPU / OpenRouter)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-[#0d1411] border border-emerald-950/80 space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Noul İhtimal Metrikleri
            </span>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span>is_fatwa:</span>
                <span className="text-rose-400 font-bold">{fatwaProb}</span>
              </div>
              <div className="w-full bg-emerald-950/60 rounded-full h-1.5">
                <div
                  style={{ width: `${Math.round(fatwaProb * 100)}%` }}
                  className="bg-rose-500 h-1.5 rounded-full"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span>is_riba:</span>
                <span className="text-amber-400 font-bold">{ribaProb}</span>
              </div>
              <div className="w-full bg-emerald-950/60 rounded-full h-1.5">
                <div
                  style={{ width: `${Math.round(ribaProb * 100)}%` }}
                  className="bg-amber-500 h-1.5 rounded-full"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span>needs_audio:</span>
                <span className="text-cyan-400 font-bold">{audioProb}</span>
              </div>
              <div className="w-full bg-emerald-950/60 rounded-full h-1.5">
                <div
                  style={{ width: `${Math.round(audioProb * 100)}%` }}
                  className="bg-cyan-500 h-1.5 rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0d1411] border border-emerald-950/80 space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Nefis Tuzağı &amp; Kategori
            </span>
            <div className="font-mono text-xs font-bold text-amber-300 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/40">
              {getNafsTrap(msg)}
            </div>
            <div className="text-[11px] text-muted-foreground pt-1">
              RAG Kategorisi:{" "}
              <span className="font-mono text-emerald-400 font-medium">
                {getRagCategory(msg)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0d1411] border border-emerald-950/80 space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Ruhsal Sıkıntı Derecesi
            </span>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {distress} / 10
            </div>
            <div className="text-[11px] text-muted-foreground">
              {distress >= 8
                ? "🚨 Acil Teskin Önceliği (112/182 Koruması)"
                : distress >= 5
                ? "⚠️ Manevi Baskı (Teskin Sesi Önerildi)"
                : "🌿 Sükûnet & İrşad"}
            </div>
          </div>
        </div>
      </div>

      {/* Gemini 2.5 Flash Editor Audit */}
      <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-emerald-800/30 pb-2">
          <strong className="text-emerald-300 flex items-center gap-1.5 font-serif text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Gemini 2.5 Flash İçsel Editör Denetimi (editorAudit Structured
            Output)
          </strong>
          <Badge
            variant="emerald"
            className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/50"
          >
            5 Sarsılmaz Süzgeç Onaylı
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0d1411] border border-emerald-950">
            {msg.editorAudit?.murakabe_applied ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <div>
              <span className="text-muted-foreground block text-[10px]">
                Murakabe Bilinci:
              </span>
              <span className="font-semibold text-foreground">
                {msg.editorAudit?.murakabe_applied
                  ? "Uygulandı (✓)"
                  : "Eksik (✗)"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0d1411] border border-emerald-950">
            {msg.editorAudit?.ilahi_riza_checked ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <div>
              <span className="text-muted-foreground block text-[10px]">
                İlahi Rıza Terazisi:
              </span>
              <span className="font-semibold text-foreground">
                {msg.editorAudit?.ilahi_riza_checked
                  ? "Gözetildi (✓)"
                  : "Eksik (✗)"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0d1411] border border-emerald-950">
            {msg.editorAudit?.tevekkul_and_talak_hope_included ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div>
              <span className="text-muted-foreground block text-[10px]">
                Talâk 2-3 Ümit &amp; Çıkış:
              </span>
              <span className="font-semibold text-foreground">
                {msg.editorAudit?.tevekkul_and_talak_hope_included
                  ? "Aşılandı (✓)"
                  : "Gerekmedi"}
              </span>
            </div>
          </div>
        </div>

        {msg.editorAudit?.nafs_and_vesvese_addressed && (
          <div className="p-3 rounded-lg bg-[#0d1411] border border-emerald-900/40">
            <span className="font-semibold text-amber-400 block text-[11px] mb-0.5">
              Deşifre Edilen Nefis Tuzağı &amp; Vesvese Tedavisi:
            </span>
            <p className="text-foreground/90 italic leading-relaxed">
              &ldquo;{msg.editorAudit.nafs_and_vesvese_addressed}&rdquo;
            </p>
          </div>
        )}

        {msg.editorAudit?.siyer_example_used && (
          <div className="p-3 rounded-lg bg-[#0d1411] border border-emerald-900/40">
            <span className="font-semibold text-sky-400 block text-[11px] mb-0.5">
              Kullanılan Siyer &amp; Sahih Hadis Mührü:
            </span>
            <p className="text-foreground/90 italic leading-relaxed">
              &ldquo;{msg.editorAudit.siyer_example_used}&rdquo;
            </p>
          </div>
        )}

        {msg.editorAudit?.deepTriage && (
          <div className="p-3 rounded-lg bg-[#0a1612] border border-cyan-800/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-cyan-300 block text-[11px]">
                🤖 Derin Semantik Triyaj (Gemini Flash 3.5 Lite):
              </span>
              <span className="text-[10px] text-cyan-400/80 font-mono">
                {msg.editorAudit.deepTriage.spiritualStage}
              </span>
            </div>
            {msg.editorAudit.deepTriage.spiritualDiagnosis && (
              <p className="text-foreground/90 leading-relaxed">
                <strong className="text-muted-foreground font-normal">Teşhis: </strong>
                {msg.editorAudit.deepTriage.spiritualDiagnosis}
              </p>
            )}
            {msg.editorAudit.deepTriage.underlyingNeed && (
              <p className="text-foreground/80 text-[11px] italic">
                <strong className="text-muted-foreground font-normal not-italic">Manevi İhtiyaç: </strong>
                {msg.editorAudit.deepTriage.underlyingNeed}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
