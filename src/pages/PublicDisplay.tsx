import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { publicUrl } from "@/lib/publicUrl";
import logo from "@/assets/qblink-logo.png";
import { Users, Clock, Maximize2, Minimize2, Volume2, VolumeX, Mic, MicOff, Wifi, WifiOff } from "lucide-react";
import { playClinicChime, announceTokenVoice, unlockAudio, isAudioAllowed } from "@/lib/audioChime";

const PublicDisplay = () => {
  const { queueId } = useParams<{ queueId: string }>();
  const [queueName, setQueueName] = useState("");
  const [currentToken, setCurrentToken] = useState<number | null>(null);
  const [nextTokens, setNextTokens] = useState<number[]>([]);
  const [waitingCount, setWaitingCount] = useState(0);
  const [inStoreCounterCode, setInStoreCounterCode] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);

  const prevTokenRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  const isUuid = (v: string | undefined) =>
    !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
  const isDemo = !isUuid(queueId);

  // Live wall clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetchData();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check audio context unlock status on user interaction
  const handleEnableAudio = async () => {
    const unlocked = await unlockAudio();
    if (unlocked) {
      setAudioUnlocked(true);
      setSoundEnabled(true);
      playClinicChime(0.6);
    }
  };

  const fetchData = useCallback(async () => {
    if (isDemo) {
      setQueueName("Live Queue");
      setCurrentToken(1);
      setWaitingCount(3);
      setNextTokens([2, 3, 4]);
      return;
    }
    const { data: q } = await supabase.from("queues").select("*").eq("id", queueId!).maybeSingle();
    if (q) {
      setQueueName(q.name);
      setCurrentToken(q.current_token ?? null);
      if (q.business_id) {
        let b: any = null;
        const { data: privBiz } = await supabase
          .from("businesses")
          .select("remote_joining_enabled, settings")
          .eq("id", q.business_id)
          .maybeSingle();
        if (privBiz) {
          b = privBiz;
        } else {
          const { data: pubBiz } = await (supabase as any)
            .from("businesses_public")
            .select("remote_joining_enabled, settings")
            .eq("id", q.business_id)
            .maybeSingle();
          b = pubBiz;
        }
        if (b && (b as any).remote_joining_enabled === false) {
          const onPremise = (b as any).settings?.on_premise_joining;
          if (onPremise?.enabled && onPremise?.counter_code) {
            setInStoreCounterCode(onPremise.counter_code);
          } else {
            setInStoreCounterCode(null);
          }
        } else {
          setInStoreCounterCode(null);
        }
      }
    } else {
      setQueueName("Live Queue");
      setCurrentToken(null);
      setInStoreCounterCode(null);
    }
    const { data: visitors } = await (supabase as any)
      .from("queue_visitors_public")
      .select("token_number, status")
      .eq("queue_id", queueId!)
      .eq("status", "waiting")
      .order("token_number", { ascending: true })
      .limit(4);
    const list = visitors ?? [];
    const { count } = await (supabase as any)
      .from("queue_visitors_public")
      .select("*", { count: "exact", head: true })
      .eq("queue_id", queueId!)
      .eq("status", "waiting");
    setWaitingCount(count ?? list.length);
    setNextTokens(list.slice(0, 3).map((v: any) => v.token_number));
  }, [isDemo, queueId]);

  // Handle Token Call Chime & Voice
  useEffect(() => {
    if (currentToken !== null) {
      if (!isFirstRender.current && prevTokenRef.current !== currentToken) {
        if (soundEnabled) {
          playClinicChime(0.7);
          if (voiceEnabled) {
            setTimeout(() => {
              announceTokenVoice(currentToken, queueName);
            }, 600);
          }
        }
      }
      prevTokenRef.current = currentToken;
      isFirstRender.current = false;
    }
  }, [currentToken, soundEnabled, voiceEnabled, queueName]);

  // Subscription & Auto-Recovery Polling (every 15s to guarantee Wi-Fi resilience)
  useEffect(() => {
    if (queueId) {
      fetchData();
      const heartbeat = setInterval(() => {
        fetchData();
      }, 15000);

      if (isDemo) return () => clearInterval(heartbeat);

      const channel = supabase
        .channel(`display-${queueId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "queue_live_signals", filter: `queue_id=eq.${queueId}` }, fetchData)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "queues", filter: `id=eq.${queueId}` }, fetchData)
        .subscribe();

      return () => {
        clearInterval(heartbeat);
        supabase.removeChannel(channel);
      };
    }
  }, [queueId, fetchData, isDemo]);

  // Periodic midnight check so waiting-room TV automatically clears yesterday's tokens past midnight
  useEffect(() => {
    if (isDemo || !queueId) return;
    const checkReset = () => {
      supabase.rpc("check_and_auto_reset_queue", { p_queue_id: queueId })
        .then(({ data }) => {
          if ((data as any)?.reset === true) {
            fetchData();
          }
        })
        .catch(() => {});
    };

    const timer = setInterval(checkReset, 60000);
    return () => clearInterval(timer);
  }, [queueId, isDemo, fetchData]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const joinUrl = publicUrl(`/join/${queueId}`);

  return (
    <div className="min-h-screen md:h-screen w-screen overflow-y-auto md:overflow-hidden bg-[#0A0F1D] text-slate-100 flex flex-col p-5 sm:p-7 select-none">
      {/* Audio Consent Banner for TV Browser Autoplay policies */}
      {!audioUnlocked && soundEnabled && (
        <button
          onClick={handleEnableAudio}
          className="mb-3 py-2 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-between shadow-lg transition-all animate-pulse"
        >
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 shrink-0" />
            <span>Click anywhere to activate waiting-room Audio Chime for TV display</span>
          </div>
          <span className="underline ml-2">Enable Sound Now →</span>
        </button>
      )}

      {/* Top Header */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Qblink" className="h-10 w-10 rounded-xl object-contain shadow-md" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{queueName || "Live Queue"}</h1>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-300 bg-teal-500/15 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                LIVE
              </span>
              {!isOnline && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full">
                  <WifiOff className="w-3 h-3" />
                  Reconnecting...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Live Token Display Board</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Sound Chime Toggle */}
          <button
            type="button"
            onClick={() => {
              if (!audioUnlocked && !soundEnabled) {
                handleEnableAudio();
              } else {
                setSoundEnabled(!soundEnabled);
              }
            }}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? "bg-teal-500/15 border-teal-500/40 text-teal-300 hover:bg-teal-500/25"
                : "bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
            title={soundEnabled ? "Mute Chime" : "Enable Chime"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? "Chime On" : "Chime Muted"}</span>
          </button>

          {/* Voice Announcement Toggle */}
          <button
            type="button"
            onClick={() => {
              if (!audioUnlocked) handleEnableAudio();
              setVoiceEnabled(!voiceEnabled);
            }}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              voiceEnabled
                ? "bg-teal-500/15 border-teal-500/40 text-teal-300 hover:bg-teal-500/25"
                : "bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
            title={voiceEnabled ? "Voice Callout On" : "Enable Voice Callout"}
          >
            {voiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{voiceEnabled ? "Voice On" : "Voice Off"}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-slate-300 font-mono text-sm bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-sm">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>{currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2-Column Split Display */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-7 items-stretch min-h-0 py-4">
        {/* Left Column: Now Serving & Up Next */}
        <section className="md:col-span-7 bg-slate-900/90 border border-teal-500/30 rounded-3xl p-6 lg:p-8 flex flex-col justify-between items-center text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500" />
          
          <div className="pt-2">
            <span className="inline-block text-teal-400 font-black uppercase tracking-widest text-base lg:text-xl px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
              Now Serving
            </span>
          </div>

          <div className="my-auto py-2">
            <p className="text-8xl sm:text-9xl lg:text-[10rem] font-black text-white tracking-tighter leading-none filter drop-shadow-[0_10px_20px_rgba(20,184,166,0.3)]">
              {currentToken ? `#${currentToken}` : "—"}
            </p>
            <p className="text-sm lg:text-base text-slate-300 font-medium mt-2">
              {currentToken ? "Please proceed to the consultation room / counter" : "Waiting for next token"}
            </p>
          </div>

          {/* Up Next Strip */}
          <div className="w-full pt-4 border-t border-slate-800/80">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Next in Line
            </p>
            {nextTokens.length > 0 ? (
              <div className="flex gap-2.5 justify-center flex-wrap">
                {nextTokens.map((t) => (
                  <div
                    key={t}
                    className="bg-slate-800/90 border border-slate-700/80 rounded-2xl px-5 py-2.5 shadow-md flex items-center gap-2"
                  >
                    <span className="text-xs text-slate-400 font-medium">Token</span>
                    <span className="text-2xl lg:text-3xl font-bold text-white">#{t}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No other patients waiting</p>
            )}
          </div>
        </section>

        {/* Right Column: Scannable QR Code & Wait Count */}
        <section className="md:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col justify-between items-center text-center shadow-xl">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Scan to Join Queue</h2>
            <p className="text-xs text-slate-400 mt-1">Zero app download · Live token alerts on your phone</p>
          </div>

          <div className="my-auto py-2 flex flex-col items-center">
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border-4 border-slate-800 inline-block">
              <QRCodeSVG value={joinUrl} size={220} includeMargin={false} />
            </div>

            {inStoreCounterCode && (
              <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-teal-500/40 text-xs shadow-sm">
                <span className="text-slate-400">Counter Code:</span>
                <span className="font-mono text-base font-black text-teal-300 tracking-wider">{inStoreCounterCode}</span>
              </div>
            )}
          </div>

          <div className="w-full pt-4 border-t border-slate-800/80 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold text-white leading-tight">
                {waitingCount} {waitingCount === 1 ? "Person" : "People"}
              </p>
              <p className="text-xs text-slate-400">Currently waiting in queue</p>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Footer */}
      <footer className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <span>Qblink Healthcare Queue Infrastructure · Zero Extra Hardware</span>
        <span className="hidden sm:inline">Keep this screen open on any smart TV or browser tablet</span>
        <span>qblink.tech</span>
      </footer>
    </div>
  );
};

export default PublicDisplay;
