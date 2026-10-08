import React, { useState, useRef, useEffect, useMemo } from "react";
import { Play, Pause, Mic, Volume2 } from "lucide-react";

interface Props {
  src: string;
  isMine?: boolean;
}

export const VoiceMessagePlayer: React.FC<Props> = ({ src = "", isMine = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate deterministic realistic audio waveform bar heights based on audio URL
  const barHeights = useMemo(() => {
    let hash = 0;
    const safeSrc = src || "";
    for (let i = 0; i < safeSrc.length; i++) {
      hash = (hash << 5) - hash + safeSrc.charCodeAt(i);
      hash |= 0;
    }
    const totalBars = 32;
    const heights: number[] = [];
    for (let i = 0; i < totalBars; i++) {
      const seed = Math.abs(Math.sin(hash + i * 1.45) * 100);
      // Realistic heights between 25% and 100%
      const heightPercent = Math.max(25, Math.min(100, Math.floor((seed % 75) + 25)));
      heights.push(heightPercent);
    }
    return heights;
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => console.warn("Audio play error", e));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const formatSecs = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full min-w-[220px] max-w-xs sm:max-w-sm py-1 select-none">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Seamless Modern Voice Note Layout - No Border Rectangles */}
      <div className="flex items-center gap-3 w-full">
        {/* Play/Pause Glow Circle Button */}
        <button
          onClick={togglePlay}
          type="button"
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-md ${
            isPlaying
              ? "bg-sky-400 text-slate-950 ring-4 ring-sky-400/25"
              : isMine
              ? "bg-white/20 hover:bg-white/30 text-white"
              : "bg-teal-500 hover:bg-teal-400 text-slate-950"
          }`}
          title={isPlaying ? "Pause voice note" : "Play voice note"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Waveform & Time Track */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          {/* Interactive Waveform Visualizer */}
          <div
            onClick={handleSeek}
            className="flex items-center gap-[3px] h-7 cursor-pointer group py-1"
            title="Click or drag to seek audio position"
          >
            {barHeights.map((height, idx) => {
              const barPercent = (idx / barHeights.length) * 100;
              const isPlayed = barPercent <= progressPercent;

              return (
                <div
                  key={idx}
                  className="flex-1 flex items-center justify-center h-full"
                >
                  <span
                    style={{ height: `${height}%` }}
                    className={`w-[3px] rounded-full transition-all duration-150 ${
                      isPlayed
                        ? "bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)]"
                        : "bg-white/35 group-hover:bg-white/50"
                    } ${isPlaying && isPlayed ? "scale-y-110" : ""}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Time Progression & Speed Controls */}
          <div className="flex items-center justify-between text-[10.5px] text-slate-300 font-mono">
            <span className="font-semibold text-sky-200">
              {isPlaying ? formatSecs(currentTime) : formatSecs(duration || currentTime)}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleSpeed}
                type="button"
                className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] font-bold font-sans transition"
                title="Toggle playback speed (1x, 1.5x, 2x)"
              >
                {playbackRate}x
              </button>
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5 font-sans">
                <Mic className="w-3 h-3 text-sky-300 inline" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
