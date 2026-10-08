import React, { useEffect, useState } from "react";
import {
  Bot,
  MessageSquare,
  PhoneCall,
  ArrowRightLeft,
  ShieldCheck,
  Activity,
  Building2,
  Sparkles,
  Wifi,
  ChevronRight,
} from "lucide-react";
import { SplashPhoto } from "../types";

interface Props {
  onFinish: () => void;
}

export const SplashScreen: React.FC<Props> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing Elyano Connect...");
  const [stage, setStage] = useState<"elyano_logo" | "elite_logo" | "full">("elyano_logo");
  const [symbolsVisible, setSymbolsVisible] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [elyanoImgError, setElyanoImgError] = useState(false);
  const [eliteImgError, setEliteImgError] = useState(false);

  useEffect(() => {
    // 1. First: Elyanoconnect_logo.png appears immediately (stage: "elyano_logo")
    setProgress(15);

    // 2. Title "ELYANO - CONNECT" appears in the middle
    const timerTitle = setTimeout(() => {
      setTitleVisible(true);
      setProgress(35);
      setStatusText("Linking Offline Secure Network...");
    }, 700);

    // 3. Next: Elitee.jpg appears smoothly
    const timerElite = setTimeout(() => {
      setStage("elite_logo");
      setProgress(60);
      setStatusText("Syncing with Elite Hospital Intranet...");
    }, 1400);

    // 4. Symbols (robot, text chat, calling, file transfers) appear in animation mode
    const timerSymbols = setTimeout(() => {
      setSymbolsVisible(true);
      setStage("full");
      setProgress(85);
      setStatusText("Securing Real-Time Media & AI Diagnostic Channels...");
    }, 2100);

    // 5. Finalize readiness
    const timerReady = setTimeout(() => {
      setProgress(100);
      setStatusText("Elyano Connect Intranet Ready.");
    }, 3000);

    // 6. Complete and enter app
    const timerFinish = setTimeout(() => {
      onFinish();
    }, 3800);

    return () => {
      clearTimeout(timerTitle);
      clearTimeout(timerElite);
      clearTimeout(timerSymbols);
      clearTimeout(timerReady);
      clearTimeout(timerFinish);
    };
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070b14] text-slate-100 p-4 sm:p-6 select-none animate-in fade-in duration-300 overflow-hidden">
      {/* Dynamic Background Glow Rings */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse delay-700" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.6)_0%,rgba(7,11,20,1)_100%)] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/40 flex flex-col items-center text-center relative z-10 backdrop-blur-2xl">
        {/* Subtle hospital accreditation badge */}
        <div className="mb-4 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/25 text-[11px] font-bold text-teal-300 flex items-center gap-1.5 shadow-sm">
          <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>Developed by IT Department, For Elite Hospital</span>
        </div>

        {/* --- SEQUENTIAL PHOTOS: Elyanoconnect_logo.png first, then Elitee.jpg --- */}
        <div className="w-full mb-6 flex flex-col items-center justify-center min-h-[140px] sm:min-h-[160px] relative">
          {/* Container holding the two photos with graceful transition */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
            {/* 1. Elyanoconnect_logo.png (appears first) */}
            <div
              className={`transition-all duration-700 ease-out transform flex flex-col items-center ${
                stage === "elyano_logo"
                  ? "scale-105 opacity-100 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20"
                  : "scale-100 opacity-95 ring-1 ring-cyan-500/30"
              } rounded-2xl bg-slate-950/80 p-2.5 sm:p-3 border border-slate-800`}
            >
              <div className="w-24 h-16 sm:w-32 sm:h-20 flex items-center justify-center overflow-hidden rounded-xl bg-[#0b0f19] relative group">
                {!elyanoImgError ? (
                  <img
                    src="/uploads/Elyanoconnect_logo.png"
                    alt="ElyanoConnect Logo"
                    className="w-full h-full object-contain filter drop-shadow-md"
                    onError={() => setElyanoImgError(true)}
                  />
                ) : (
                  /* High-Fidelity SVG Constellation Node Fallback */
                  <div className="w-full h-full flex flex-col items-center justify-center p-1">
                    <div className="relative w-9 h-9 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/50 animate-ping absolute opacity-30" />
                      <div className="w-7 h-7 rounded-full border border-cyan-400/60 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-white mt-1">
                      Elyano<span className="text-cyan-400">connect</span>
                    </span>
                  </div>
                )}
                {/* Active pulse dot on photo 1 */}
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80 animate-pulse" />
              </div>
              <span className="text-[10px] font-semibold text-cyan-300 mt-1.5 tracking-wide">
                ElyanoConnect
              </span>
            </div>

            {/* 2. Elitee.jpg (appears next) */}
            <div
              className={`transition-all duration-700 ease-out transform flex flex-col items-center ${
                stage === "elyano_logo"
                  ? "opacity-0 translate-y-4 pointer-events-none scale-95"
                  : "opacity-100 translate-y-0 scale-100 ring-1 ring-teal-500/40 shadow-lg shadow-teal-500/10"
              } rounded-2xl bg-white/95 p-2.5 sm:p-3 border border-slate-200`}
            >
              <div className="w-24 h-16 sm:w-32 sm:h-20 flex items-center justify-center overflow-hidden rounded-xl bg-white relative">
                {!eliteImgError ? (
                  <img
                    src="/uploads/Elitee.jpg"
                    alt="Elite Hospital Logo"
                    className="w-full h-full object-contain p-1"
                    onError={() => setEliteImgError(true)}
                  />
                ) : (
                  /* High-Fidelity Elite Hospital Logo SVG Fallback */
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-1">
                    <svg viewBox="0 0 100 60" className="w-12 h-8" fill="none">
                      <path
                        d="M20,40 C10,25 25,10 45,15 C45,15 35,28 40,38 C45,42 55,30 75,5 C60,20 48,35 40,42 Z"
                        fill="#009688"
                      />
                      <path d="M42,24 L72,8 L40,28 Z" fill="#009688" />
                      <path d="M38,32 L68,16 L36,36 Z" fill="#009688" />
                    </svg>
                    <span className="text-[11px] font-black text-slate-800 leading-none">
                      ≡lite
                    </span>
                    <span className="text-[7px] font-bold tracking-widest text-slate-500">
                      HOSPITAL
                    </span>
                  </div>
                )}
                {/* Active pulse dot on photo 2 */}
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-500 shadow-sm shadow-teal-500/80" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 mt-1.5 tracking-wide">
                Elite Hospital
              </span>
            </div>
          </div>
        </div>

        {/* --- MIDDLE OF SCREEN: THE WORD "ELYANO - CONNECT" --- */}
        <div
          className={`my-3 sm:my-4 transition-all duration-700 ease-out transform ${
            titleVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
          }`}
        >
          <div className="relative inline-block">
            {/* Glowing background halo */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-sky-500/20 blur-xl rounded-full" />
            <h1 className="relative text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-widest sm:tracking-[0.18em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-teal-200 to-sky-300 drop-shadow-sm font-sans">
              ELYANO - CONNECT
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-1 tracking-wider uppercase">
            Offline Device Communication & Intranet Hub
          </p>
        </div>

        {/* --- ANIMATED SYMBOLS: Robot, Text Chat, Calling, File Transfers --- */}
        <div
          className={`w-full my-4 py-3 px-2 rounded-2xl bg-slate-950/60 border border-slate-800/80 transition-all duration-700 ${
            symbolsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="text-[10px] font-bold text-cyan-400/90 uppercase tracking-widest mb-3 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Integrated Communication Features</span>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {/* 1. Robot Symbol */}
            <div className="flex flex-col items-center group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-slate-900 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-md shadow-cyan-500/10 relative transition-transform duration-300 group-hover:scale-110 animate-bounce [animation-duration:2.8s]">
                <Bot className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-slate-950" />
              </div>
              <span className="text-[11px] font-bold text-slate-200 mt-2">Robot</span>
              <span className="text-[9px] text-cyan-400/90 font-medium">AI Diagnostic</span>
            </div>

            {/* 2. Text Chat Symbol */}
            <div className="flex flex-col items-center group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-slate-900 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-md shadow-teal-500/10 relative transition-transform duration-300 group-hover:scale-110 animate-bounce [animation-duration:3.2s] [animation-delay:0.3s]">
                <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-teal-400 ring-2 ring-slate-950" />
              </div>
              <span className="text-[11px] font-bold text-slate-200 mt-2">Text Chat</span>
              <span className="text-[9px] text-teal-400/90 font-medium">Live Messages</span>
            </div>

            {/* 3. Calling Symbol */}
            <div className="flex flex-col items-center group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-sky-500/20 to-slate-900 border border-sky-500/40 flex items-center justify-center text-sky-300 shadow-md shadow-sky-500/10 relative transition-transform duration-300 group-hover:scale-110 animate-bounce [animation-duration:3.0s] [animation-delay:0.6s]">
                <PhoneCall className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-slate-950" />
              </div>
              <span className="text-[11px] font-bold text-slate-200 mt-2">Calling</span>
              <span className="text-[9px] text-sky-400/90 font-medium">Voice & Video</span>
            </div>

            {/* 4. File Transfers Symbol */}
            <div className="flex flex-col items-center group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-slate-900 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-md shadow-indigo-500/10 relative transition-transform duration-300 group-hover:scale-110 animate-bounce [animation-duration:3.4s] [animation-delay:0.9s]">
                <ArrowRightLeft className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-400 ring-2 ring-slate-950" />
              </div>
              <span className="text-[11px] font-bold text-slate-200 mt-2">File Transfers</span>
              <span className="text-[9px] text-indigo-400/90 font-medium">P2P Offline Share</span>
            </div>
          </div>
        </div>

        {/* Progress Bar & Status Text */}
        <div className="w-full mt-3 space-y-2">
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-sky-400 rounded-full transition-all duration-300 ease-out shadow-sm shadow-cyan-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-semibold px-1">
            <span className="text-slate-400 flex items-center gap-1.5 truncate">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
              <span className="truncate">{statusText}</span>
            </span>
            <span className="text-cyan-300 font-mono font-bold shrink-0">{progress}%</span>
          </div>
        </div>

        {/* Skip Intro Button */}
        <button
          onClick={onFinish}
          className="mt-5 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer hover:underline"
        >
          <span>Skip Intro & Enter Elyano Connect</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
