"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Volume2,
  ChevronDown,
  ChevronUp,
  Search,
  HeartPulse,
  Brain,
  User,
  Bot,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AuditMessage,
  AuditDetailDrawer,
  getDistress,
  getIsFatwa,
  getIsRiba,
} from "@/components/admin/audit-detail-drawer";

const DEMO_AUDIT_MESSAGES: AuditMessage[] = [
  {
    id: "audit-demo-1",
    role: "ASSISTANT",
    content:
      "Kıymetli kardeşim, rızık endişesi ve borç daralması kulun nefsine ağır bir yüktür. Ancak bilmelisin ki faiz kapısı kulu feraha değil, Allah ve Resulü ile bir harbe sürükler (Bakara, 279). Peygamberimiz (s.a.v.) borç yükü altında kaldığında Rabbine sığınarak 'Allahım, kederden, acizlikten ve borcun belimi bükmesinden Sana sığınırım' diye niyaz ederdi. Sebeplere hürmet et, tevekkülü elden bırakma.",
    createdAt: new Date().toISOString(),
    userPhone: "+90555•••12",
    audioSent: true,
    jevMetadata: {
      noul: { is_fatwa: 0.05, is_riba: 0.92, needs_audio: 0.88 },
      choice: {
        nafs_trap: "FAKIRLIK_KORKUSU_VESVESESI",
        rag_category: "RIZIK_VE_TICARET",
      },
      score: { distress_level: 8 },
    },
    editorAudit: {
      murakabe_applied: true,
      ilahi_riza_checked: true,
      tevekkul_and_talak_hope_included: true,
      nafs_and_vesvese_addressed:
        "Şeytanın fakirlikle korkutarak haram faize sevk etme vesvesesi deşifre edildi.",
      siyer_example_used:
        "Peygamberimiz'in (s.a.v.) borç duası ve Taif sonrası teslimiyeti",
      riba_warning_included: true,
    },
  },
  {
    id: "audit-demo-2",
    role: "ASSISTANT",
    content:
      "Değerli kardeşim, eşinizle yaşadığınız bu derin ihtilaf kalbinizi incitmiş. Lakin boşanma (talak) ve nafaka gibi hususlar şer'i hüküm gerektiren fıkhi mevzulardır. Manevi Pusula fıkhi fetva mercii değildir; hak kaybı yaşamamanız için Diyanet Alo 190 Fetva Hattı'na danışmanızı istirham ederiz. Ancak bir eş ve Müslüman olarak şu an öfkeyle değil, hilm ve murakabe şuuruyla hareket etmeniz kalbinize şifa olacaktır.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    userPhone: "+90532•••45",
    audioSent: false,
    jevMetadata: {
      noul: { is_fatwa: 0.95, is_riba: 0.02, needs_audio: 0.15 },
      choice: {
        nafs_trap: "INTIKAM_VE_HASET",
        rag_category: "AILE_VE_SILA_I_RAHIM",
      },
      score: { distress_level: 6 },
    },
    editorAudit: {
      murakabe_applied: true,
      ilahi_riza_checked: true,
      tevekkul_and_talak_hope_included: false,
      nafs_and_vesvese_addressed:
        "Öfkeyle ani boşanma kararı alma nefis zaafı",
      siyer_example_used:
        "Peygamber Efendimiz'in 'Öfkelendiğin zaman sus ve abdest al' tavsiyesi",
      riba_warning_included: false,
    },
  },
  {
    id: "audit-demo-3",
    role: "ASSISTANT",
    content:
      "İmtihan dünyasında her daralmanın ardında ilahi bir hikmet gizlidir. Kalbini ferah tut, Talâk Suresi'nde müjdelendiği gibi: 'Kim Allah'tan sakınırsa, Allah ona bir çıkış yolu açar.' (Talâk, 2-3). Bu gecenin sükûnetinde teheccüd vakti ellerini semaya açıp duaya sarıl.",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    userPhone: "+90544•••88",
    audioSent: true,
    jevMetadata: {
      noul: { is_fatwa: 0.01, is_riba: 0.05, needs_audio: 0.95 },
      choice: {
        nafs_trap: "ACELECI_TALEPLER_VE_ISTIACAL",
        rag_category: "DUA_VE_ILCA_USULU",
      },
      score: { distress_level: 3 },
    },
    editorAudit: {
      murakabe_applied: true,
      ilahi_riza_checked: true,
      tevekkul_and_talak_hope_included: true,
      nafs_and_vesvese_addressed:
        "Duanın vakti gelmemiş neticesi için acelecilik (isti'câl) vesvesesi kırıldı.",
      siyer_example_used:
        "Ashabın hicret gecesindeki mutlak tevekkülü ve seher vakti ilticası",
      riba_warning_included: false,
    },
  },
];

export default function AuditLogsPage() {
  const [messages, setMessages] = useState<AuditMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"USER" | "ASSISTANT" | "all">("USER");
  const [filterDistress, setFilterDistress] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit-logs?limit=150");
      const json = await res.json();
      if (json.success && Array.isArray(json.messages)) {
        setMessages(json.messages as AuditMessage[]);
      } else {
        // Fallback to stats endpoint if audit-logs fails
        const statsRes = await fetch("/api/admin/stats");
        const statsJson = await statsRes.json();
        if (statsJson.success && statsJson.data?.recentMessages) {
          setMessages(statsJson.data.recentMessages as AuditMessage[]);
        }
      }
    } catch (e) {
      console.error("Audit log fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const displayMessages: AuditMessage[] = messages;

  const userCount = displayMessages.filter((m) => m.role === "USER").length;
  const assistantCount = displayMessages.filter(
    (m) => m.role === "ASSISTANT"
  ).length;

  const highDistressCount = displayMessages.filter(
    (m) => getDistress(m) >= 8
  ).length;
  const mediumDistressCount = displayMessages.filter((m) => {
    const d = getDistress(m);
    return d >= 5 && d < 8;
  }).length;
  const lowDistressCount = displayMessages.filter(
    (m) => getDistress(m) < 5
  ).length;
  const totalCount = displayMessages.length || 1;

  const filtered = displayMessages.filter((msg) => {
    if (activeTab !== "all" && msg.role !== activeTab) return false;

    const distress = getDistress(msg);
    if (filterDistress === "high" && distress < 8) return false;
    if (filterDistress === "medium" && (distress < 5 || distress >= 8))
      return false;
    if (filterDistress === "low" && distress >= 5) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const inContent = msg.content.toLowerCase().includes(term);
      const inPhone = msg.userPhone.toLowerCase().includes(term);
      if (!inContent && !inPhone) return false;
    }

    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/60 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="gold"
              className="text-[11px] bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono"
            >
              Sistem 1 Refleks + Sistem 2 Gemini
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              İçsel Editör Doğrulama Günlüğü
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-foreground">
            Bilişsel Denetim ve Audit Günlüğü
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Sistem 1 Refleks sınıflandırması ve Gemini 3.8 Flash güvenlik/kalite kontrolleri anlık telemetri dökümü.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl border border-emerald-900/60 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 text-xs font-medium transition-colors"
          >
            {loading ? "Yenileniyor..." : "Yenile"}
          </button>
          <div className="flex items-center gap-2 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-900/40 text-xs">
            <Brain className="h-4 w-4 text-emerald-400" />
            <span className="text-muted-foreground">Aktif Model:</span>
            <span className="text-foreground font-mono font-semibold">
              Gemini 3.8 Flash
            </span>
          </div>
        </div>
      </div>

      {/* Distress Score Distribution Overview Strip */}
      <div className="p-5 rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-rose-400" />
            Sistem 1 Kriz &amp; Ruhsal Sıkıntı (Distress) Dağılımı
          </span>
          <span className="text-muted-foreground font-mono text-[11px]">
            Toplam {displayMessages.length} denetim oturumu
          </span>
        </div>

        <div className="h-2 w-full rounded-full bg-emerald-950/60 overflow-hidden flex gap-0.5">
          <div
            style={{
              width: `${Math.round((highDistressCount / totalCount) * 100)}%`,
            }}
            className="bg-rose-500 transition-all duration-300"
            title="Yüksek Kriz (>=8)"
          />
          <div
            style={{
              width: `${Math.round((mediumDistressCount / totalCount) * 100)}%`,
            }}
            className="bg-amber-500 transition-all duration-300"
            title="Orta Baskı (5-7)"
          />
          <div
            style={{
              width: `${Math.round((lowDistressCount / totalCount) * 100)}%`,
            }}
            className="bg-emerald-500 transition-all duration-300"
            title="Sükûn (<5)"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
              <span className="text-xs text-rose-300 font-medium">
                Yüksek Kriz (&ge; 8)
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400">
              {highDistressCount} oturum (
              {Math.round((highDistressCount / totalCount) * 100)}%)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-xs text-amber-300 font-medium">
                Orta Baskı (5 - 7)
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              {mediumDistressCount} oturum (
              {Math.round((mediumDistressCount / totalCount) * 100)}%)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium">
                Dengeli &amp; Normal (&lt; 5)
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {lowDistressCount} oturum (
              {Math.round((lowDistressCount / totalCount) * 100)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation & Search Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Role Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-emerald-950/40 border border-emerald-900/40 w-fit">
            <button
              onClick={() => setActiveTab("USER")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "USER"
                  ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-3.5 w-3.5 text-emerald-400" />
              <span>Kullanıcı Mesajları (Sorular)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 font-mono border border-emerald-800/50">
                {userCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("ASSISTANT")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "ASSISTANT"
                  ? "bg-amber-600/30 text-amber-200 border border-amber-500/40 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bot className="h-3.5 w-3.5 text-amber-400" />
              <span>Manevi Pusula Yanıtları (Ajan)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-950 text-amber-300 font-mono border border-amber-800/50">
                {assistantCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "all"
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Tüm Akış</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-950/80 text-muted-foreground font-mono">
                {displayMessages.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">
              Filtrelenen: <strong className="text-foreground">{filtered.length}</strong> / {displayMessages.length}
            </span>
          </div>
        </div>

        {/* Toolbar: Distress & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
              Kriz / Distress Skoru
            </label>
            <select
              value={filterDistress}
              onChange={(e) =>
                setFilterDistress(
                  e.target.value as "all" | "high" | "medium" | "low"
                )
              }
              className="w-full h-9 rounded-lg border border-emerald-950 bg-emerald-950/40 text-foreground px-2.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              <option value="all">Tüm Kriz Dereceleri</option>
              <option value="high">Yüksek Kriz (&ge; 8 / 112 Koruması)</option>
              <option value="medium">Orta Baskı (5 - 7)</option>
              <option value="low">Sükûnet (&lt; 5)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
              İçerik veya Telefon Arama
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Mesaj metni veya kullanıcı telefonu ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 text-xs pl-7 border-emerald-950 bg-emerald-950/40 text-foreground placeholder:text-muted-foreground/60"
              />
              <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-14 text-center text-xs text-muted-foreground rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 flex flex-col items-center justify-center gap-2">
            <div className="h-6 w-6 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <span>Denetim kayıtları veritabanından getiriliyor...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-14 text-center text-xs text-muted-foreground rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90">
            Seçilen filtre kriterlerine uygun denetim kaydı bulunamadı.
          </div>
        ) : (
          filtered.map((msg) => {
            const isExpanded = expandedId === msg.id;
            const distress = getDistress(msg);
            const isFatwa = getIsFatwa(msg) >= 0.7;
            const isRiba = getIsRiba(msg) >= 0.7;

            return (
              <div
                key={msg.id}
                className={`rounded-2xl border bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all overflow-hidden ${
                  distress >= 8
                    ? "border-rose-900/60 hover:border-rose-600/70"
                    : isRiba || isFatwa
                    ? "border-amber-900/60 hover:border-amber-600/70"
                    : "border-emerald-950/80 hover:border-emerald-700/60"
                }`}
              >
                <div
                  onClick={() => toggleExpand(msg.id)}
                  className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 select-none hover:bg-emerald-950/20 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-emerald-400">
                        {msg.userPhone}
                      </span>
                      <span className="text-emerald-950">&bull;</span>
                      <Badge
                        variant={msg.role === "USER" ? "outline" : "default"}
                        className={`text-[10px] px-2 py-0.5 ${
                          msg.role === "USER"
                            ? "border-emerald-900/60 text-muted-foreground"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-800/50"
                        }`}
                      >
                        {msg.role === "USER" ? "Kullanıcı" : "Manevi Pusula"}
                      </Badge>
                      <span className="text-emerald-950">&bull;</span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString("tr-TR")}
                      </span>

                      {/* Sistem kontrol bayrakları: Murakabe, Riba, Fetva, Distress ve editorAudit */}
                      {isFatwa && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] bg-rose-950/60 text-rose-300 border border-rose-800/50"
                        >
                          Alo 190 Danışma
                        </Badge>
                      )}
                      {msg.audioSent && (
                        <Badge
                          variant="blue"
                          className="text-[10px] gap-1 bg-cyan-950/60 text-cyan-300 border border-cyan-800/50"
                        >
                          <Volume2 className="h-3 w-3" />
                          Sesli Mesaj
                        </Badge>
                      )}
                      {distress >= 8 ? (
                        <Badge
                          variant="destructive"
                          className="text-[10px] bg-rose-950/70 text-rose-300 border border-rose-600/50 font-mono"
                        >
                          Kriz: {distress}/10 (112)
                        </Badge>
                      ) : distress >= 5 ? (
                        <Badge
                          variant="gold"
                          className="text-[10px] bg-amber-950/70 text-amber-300 border border-amber-600/50 font-mono"
                        >
                          Yoğunluk: {distress}/10
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-emerald-900/60 text-emerald-300 font-mono"
                        >
                          Dengeli: {distress}/10
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed font-sans">
                      {msg.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto text-xs text-muted-foreground group-hover:text-amber-400 transition-colors">
                    <span className="text-[11px] font-medium">
                      {isExpanded ? "Detayları Gizle" : "Denetimi İncele"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-amber-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {isExpanded && <AuditDetailDrawer msg={msg} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
