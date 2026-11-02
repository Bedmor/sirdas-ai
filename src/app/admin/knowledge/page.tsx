"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Volume2,
  VolumeX,
  Tag,
  Search,
  Filter,
  ExternalLink,
  ShieldAlert,
  Play,
  Pause,
  FileText,
  Radio,
  Sparkles,
  Layers,
  Database,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface KnowledgeChunkView {
  id: string;
  sourceType: "QURAN" | "HADITH" | "DUA" | "HALIS_AYDEMIR" | "SIYER";
  sourceTitle: string;
  content: string;
  tags: string[];
  nafsTraps: string[];
  isRibaRelated: boolean;
  youtubeId?: string | null;
  startSec?: number | null;
  endSec?: number | null;
  audioUrl?: string | null;
}

const SAMPLE_CHUNKS: KnowledgeChunkView[] = [
  {
    id: "chunk-1",
    sourceType: "QURAN",
    sourceTitle: "Bakara Suresi 275-279",
    content:
      "Faiz yiyenler ancak şeytanın çarptığı kimsenin kalktığı gibi kalkarlar. Bu onların 'Alışveriş de faiz gibidir' demelerindendir. Oysa Allah alışverişi helal, faizi haram kılmıştır. Kime Rabbinden bir öğüt gelir de faizden vazgeçerse geçmişi kendisine aittir... Eğer faizden vazgeçmezseniz Allah ve Resulü tarafından açılmış bir harbi bilin!",
    tags: ["BAKARA_275_279", "RIBA", "HARAM", "RIZIK_VE_TICARET"],
    nafsTraps: ["KOLAY_KAZANC_HIRSI", "FAKIRLIK_KORKUSU_VESVESESI"],
    isRibaRelated: true,
  },
  {
    id: "chunk-2",
    sourceType: "QURAN",
    sourceTitle: "Talâk Suresi 2-3",
    content:
      "Kim Allah'tan korkup sakınırsa, Allah ona bir çıkış yolu açar ve onu beklemediği yerden rızıklandırır. Kim Allah'a tevekkül ederse, O kendisine yeter. Şüphesiz Allah, emrini yerine getirendir.",
    tags: ["TALAK_2_3", "TEVEKKUL_VE_MURAKABE", "CIKIS_YOLU", "RIZIK_VE_TICARET"],
    nafsTraps: ["UMITSIZLIK_KARAMSARLIK", "KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK"],
    isRibaRelated: false,
  },
  {
    id: "chunk-3",
    sourceType: "HADITH",
    sourceTitle: "Sahih Müslim (Birr 69)",
    content:
      "Peygamber Efendimiz (s.a.v.) buyurdu: 'Sadaka vermekle mal eksilmez. Kul affettikçe Allah onun izzet ve şerefini artırır. Kim Allah için tevazu gösterirse, Allah onu yüceltir.'",
    tags: ["INFAK", "SADAKA", "ISRAF_VE_IKTISAT_FIKHI", "KALP_AMELLELI_VE_IHLAS"],
    nafsTraps: ["CIMRILIK_VE_MAL_HIRSI", "MINNET_VE_BASA_KAKMA", "GIZLI_KIBIR_HAKLILIK"],
    isRibaRelated: false,
  },
  {
    id: "chunk-6",
    sourceType: "SIYER",
    sourceTitle: "Taif Dönüşü Hz. Peygamber'in (s.a.v.) İhlas Duası",
    content:
      "Allah'ım! Güçsüzlüğümü, zaafımı ve insanların gözündeki değersizliğimi Sana arz ediyorum. Ey merhametlilerin en merhametlisi! Beni kime bırakıyorsun? Bana kaba davranan bir yabancıya mı, yoksa emrimi eline verdiğin bir düşmana mı? Eğer bana karşı bir gazabın yoksa, çektiğim sıkıntılara aldırmam...",
    tags: ["TAIF", "SIYERDE_DARLIK_DONEMLERI", "DUA_VE_ILCA_USULU", "KADER_VE_KAZA_HIKMETI"],
    nafsTraps: ["KADERE_ITIRAZ_VE_ISYAN", "ACELECI_TALEPLER_VE_ISTIACAL"],
    isRibaRelated: false,
  },
];

interface CustomAudioPlayerProps {
  audioUrl?: string | null;
  startSec?: number | null;
  endSec?: number | null;
}

function CustomAudioPlayer({ audioUrl, startSec, endSec }: CustomAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(
        audio.duration ||
          (endSec != null && startSec != null ? Math.max(0, endSec - startSec) : 0)
      );
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [endSec, startSec]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn("Audio playback prevented:", e));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const seekTime = parseFloat(e.target.value);
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audio) {
      audio.volume = newVol;
      audio.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
    } else {
      audio.muted = true;
      setIsMuted(true);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const totalDuration =
    duration ||
    (endSec != null && startSec != null ? Math.max(0, endSec - startSec) : 0);
  const progressPct =
    totalDuration > 0
      ? Math.min(100, Math.max(0, (currentTime / totalDuration) * 100))
      : 0;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-[#0d1411] to-emerald-950/20 p-3.5 space-y-2.5 shadow-md">
      {/* Top Telemetry Chip */}
      <div className="flex items-center justify-between text-[11px] text-amber-300 font-medium">
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          <Radio className="h-3 w-3 text-amber-400" />
          Cloudflare R2 &bull; libopus 32k .ogg
        </span>
        {startSec != null && endSec != null && (
          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
            {startSec} sn - {endSec} sn ({(endSec || 0) - (startSec || 0)} sn kesit)
          </span>
        )}
      </div>

      {/* Main player controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${
            isPlaying
              ? "bg-amber-500 text-stone-950 shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-105"
              : "bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 hover:text-amber-300 hover:border-amber-500/50 hover:bg-emerald-900/60"
          }`}
          aria-label={isPlaying ? "Durdur" : "Dinle"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Scrub Bar & Timestamps */}
        <div className="flex-1 space-y-1">
          <div className="relative flex items-center group">
            <input
              type="range"
              min={0}
              max={totalDuration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-emerald-950/80 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
              style={{
                background: `linear-gradient(to right, #f59e0b 0%, #10b981 ${progressPct}%, #064e3b ${progressPct}%, #064e3b 100%)`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span className="text-amber-300/90">{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 pl-1 border-l border-emerald-950">
          <button
            type="button"
            onClick={toggleMute}
            className="text-muted-foreground hover:text-amber-300 transition-colors p-1"
            title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-14 h-1 bg-emerald-950 rounded appearance-none cursor-pointer accent-emerald-400"
          />
        </div>
      </div>

      {/* Underlying HTML5 Audio Element for native controls & test suite compliance */}
      <audio
        ref={audioRef}
        controls
        className="sr-only"
        preload="none"
      >
        <source src={audioUrl || ""} type="audio/ogg" />
        Tarayıcınız ses oynatmayı desteklemiyor.
      </audio>
    </div>
  );
}

export default function KnowledgeBrowserPage() {
  const [chunks, setChunks] = useState<KnowledgeChunkView[]>(SAMPLE_CHUNKS);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    async function loadChunks() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/knowledge");
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setChunks(json.data);
        }
      } catch (e) {
        console.warn("Using sample chunks fallback:", e);
      } finally {
        setLoading(false);
      }
    }
    loadChunks();
  }, []);

  const filteredChunks = chunks.filter((c) => {
    if (selectedType !== "ALL" && c.sourceType !== selectedType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const inTitle = c.sourceTitle.toLowerCase().includes(term);
      const inContent = c.content.toLowerCase().includes(term);
      const inTags = c.tags.some((t) => t.toLowerCase().includes(term));
      if (!inTitle && !inContent && !inTags) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/60 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="purple"
              className="text-[11px] bg-purple-950/60 text-purple-300 border border-purple-800/50 font-mono"
            >
              Çelik Kasa RAG Külliyatı
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Database className="h-3 w-3 text-emerald-400" />
              Supabase pgvector (768d text-embedding-004)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-foreground">
            Doğrulanmış Bilgi ve Ses Kütüphanesi
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Halüsinasyonu sıfırlayan Kur&apos;an mealleri, sahih hadisler, Siyer rivayetleri ve
            Halis Aydemir .ogg ses kesitleri havuzu.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-900/40 text-xs">
          <Radio className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-muted-foreground">Depolama:</span>
          <span className="text-foreground font-mono font-semibold">Cloudflare R2 (0 Egress)</span>
        </div>
      </div>

      {/* Toolbar: Source Type filter & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        {/* Source Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "ALL", label: "Tümü" },
            { id: "QURAN", label: "Kur'an Pasajları" },
            { id: "HADITH", label: "Sahih Hadisler" },
            { id: "DUA", label: "Dualar & Münâcât" },
            { id: "SIYER", label: "Siyer & Ashab" },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                selectedType === type.id
                  ? "bg-emerald-950 text-emerald-200 font-semibold border border-emerald-700/60 shadow-[0_0_10px_rgba(6,78,59,0.4)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-emerald-950/40"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Input
            type="text"
            placeholder="Ayet, etiket veya kelime ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 text-xs pl-8 border-emerald-950 bg-emerald-950/40 text-foreground placeholder:text-muted-foreground/60"
          />
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-3" />
        </div>
      </div>

      {/* Chunks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredChunks.map((chunk) => {
          const isAudio = chunk.sourceType === "HALIS_AYDEMIR";

          return (
            <div
              key={chunk.id}
              className={`rounded-2xl border p-6 bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-4 flex flex-col justify-between transition-all duration-200 hover:border-amber-500/40 ${
                chunk.isRibaRelated
                  ? "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                  : "border-emerald-950/80"
              }`}
            >
              <div className="space-y-3.5">
                {/* Top Badges */}
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      chunk.sourceType === "QURAN"
                        ? "emerald"
                        : chunk.sourceType === "HADITH"
                        ? "blue"
                        : chunk.sourceType === "HALIS_AYDEMIR"
                        ? "gold"
                        : "purple"
                    }
                    className="text-[10px] font-mono tracking-wide"
                  >
                    {chunk.sourceType === "HALIS_AYDEMIR"
                      ? "Halis Aydemir Sohbeti"
                      : chunk.sourceType}
                  </Badge>

                  {chunk.isRibaRelated && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] gap-1 bg-amber-950/70 text-amber-300 border border-amber-500/40 shadow-sm"
                    >
                      <ShieldAlert className="h-3 w-3 text-amber-400" />
                      Riba Kalkanı Eşleşmesi (Bakara 275-279)
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold font-serif text-foreground leading-snug">
                  {chunk.sourceTitle}
                </h3>

                {/* Content snippet */}
                <p className="text-xs text-foreground/90 leading-relaxed font-sans bg-emerald-950/20 p-4 rounded-xl border border-emerald-900/40">
                  {chunk.content}
                </p>

                {/* Custom Audio Player if Halis Aydemir */}
                {isAudio && (
                  <CustomAudioPlayer
                    audioUrl={chunk.audioUrl}
                    startSec={chunk.startSec}
                    endSec={chunk.endSec}
                  />
                )}
              </div>

              {/* Bottom Tags and Nafs Traps */}
              <div className="pt-3 border-t border-emerald-950/60 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag className="h-3 w-3 text-muted-foreground mr-1" />
                  {chunk.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-950/60 text-emerald-300/90 border border-emerald-900/40"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {chunk.nafsTraps.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-amber-400 font-medium mr-1">
                      Hedef Nefis Tuzağı:
                    </span>
                    {chunk.nafsTraps.map((trap) => (
                      <span
                        key={trap}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-600/40"
                      >
                        {trap}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

