import React, { useState } from "react";
import { Palette, Check, Volume2, Music, Play, Type } from "lucide-react";
import {
  soundManager,
  RINGTONE_OPTIONS,
  NOTIFICATION_OPTIONS,
  RingtoneOption,
  NotificationOption,
} from "../lib/sound";

interface Props {
  currentTheme: string;
  currentFont?: string;
  onSelectTheme: (theme: string) => void;
  onSelectFont?: (font: string) => void;
  onClose: () => void;
}

export const THEMES = [
  {
    id: "glassy",
    name: "Glassy Translucent",
    bg: "bg-slate-900/60",
    border: "border-sky-400/50",
    accent: "bg-sky-400",
    textPreview: "text-sky-200",
  },
  {
    id: "obsidian-glass",
    name: "Obsidian Smoked Glass",
    bg: "bg-slate-950/80",
    border: "border-slate-600",
    accent: "bg-slate-200",
    textPreview: "text-white",
  },
  {
    id: "aurora-glass",
    name: "Aurora Translucent Teal",
    bg: "bg-teal-950/70",
    border: "border-teal-400/50",
    accent: "bg-teal-400",
    textPreview: "text-teal-200",
  },
  {
    id: "amethyst-glass",
    name: "Amethyst Violet Glass",
    bg: "bg-purple-950/70",
    border: "border-purple-400/50",
    accent: "bg-purple-400",
    textPreview: "text-purple-200",
  },
  {
    id: "sunset-glass",
    name: "Sunset Coral Glass",
    bg: "bg-orange-950/70",
    border: "border-orange-400/50",
    accent: "bg-orange-400",
    textPreview: "text-orange-200",
  },
  {
    id: "titanium",
    name: "Titanium Slate",
    bg: "bg-zinc-900",
    border: "border-zinc-600",
    accent: "bg-zinc-300",
    textPreview: "text-zinc-100",
  },
  {
    id: "white",
    name: "Clean White",
    bg: "bg-white",
    border: "border-slate-300",
    accent: "bg-teal-600",
    textPreview: "text-black",
  },
  {
    id: "emerald",
    name: "Emerald Forest",
    bg: "bg-emerald-950",
    border: "border-emerald-600",
    accent: "bg-emerald-400",
    textPreview: "text-emerald-200",
  },
  {
    id: "amber",
    name: "Amber Sunset",
    bg: "bg-amber-950",
    border: "border-amber-600",
    accent: "bg-amber-500",
    textPreview: "text-amber-200",
  },
  {
    id: "purple",
    name: "Neon Violet",
    bg: "bg-indigo-950",
    border: "border-indigo-600",
    accent: "bg-indigo-400",
    textPreview: "text-indigo-200",
  },
  {
    id: "cyberpunk",
    name: "Cyber Neon",
    bg: "bg-zinc-950",
    border: "border-pink-600",
    accent: "bg-cyan-400",
    textPreview: "text-cyan-300",
  },
  {
    id: "nordic",
    name: "Nordic Frost",
    bg: "bg-slate-100",
    border: "border-slate-300",
    accent: "bg-sky-600",
    textPreview: "text-slate-900",
  },
  {
    id: "sepia",
    name: "Sepia Warmth",
    bg: "bg-amber-100",
    border: "border-amber-300",
    accent: "bg-amber-800",
    textPreview: "text-amber-950",
  },
  {
    id: "red",
    name: "Crimson Red",
    bg: "bg-red-950",
    border: "border-red-600",
    accent: "bg-red-500",
    textPreview: "text-red-100",
  },
  {
    id: "light-blue",
    name: "Light Blue",
    bg: "bg-sky-100",
    border: "border-sky-300",
    accent: "bg-sky-600",
    textPreview: "text-sky-950",
  },
  {
    id: "dark-blue",
    name: "Dark Blue",
    bg: "bg-slate-900",
    border: "border-slate-700",
    accent: "bg-sky-400",
    textPreview: "text-white",
  },
  {
    id: "pink",
    name: "Soft Pink",
    bg: "bg-pink-100",
    border: "border-pink-300",
    accent: "bg-pink-600",
    textPreview: "text-pink-950",
  },
  {
    id: "black",
    name: "Midnight Black",
    bg: "bg-black",
    border: "border-slate-800",
    accent: "bg-emerald-500",
    textPreview: "text-white",
  },
  {
    id: "cyber-teal",
    name: "Cyber Teal Matrix",
    bg: "bg-cyan-950",
    border: "border-cyan-500",
    accent: "bg-cyan-400",
    textPreview: "text-cyan-200",
  },
  {
    id: "royal-sapphire",
    name: "Royal Sapphire Glass",
    bg: "bg-blue-950/80",
    border: "border-blue-400/60",
    accent: "bg-blue-500",
    textPreview: "text-blue-100",
  },
  {
    id: "cherry-blossom",
    name: "Cherry Blossom",
    bg: "bg-rose-50",
    border: "border-rose-300",
    accent: "bg-rose-500",
    textPreview: "text-rose-950",
  },
  {
    id: "slate-monochrome",
    name: "Clinical Monochrome",
    bg: "bg-slate-900",
    border: "border-slate-500",
    accent: "bg-white",
    textPreview: "text-slate-100",
  },
  {
    id: "matcha-latte",
    name: "Matcha Serenity",
    bg: "bg-stone-100",
    border: "border-emerald-300",
    accent: "bg-emerald-700",
    textPreview: "text-emerald-950",
  },
  {
    id: "solar-flare",
    name: "Solar Flare Gold",
    bg: "bg-zinc-950",
    border: "border-amber-500/60",
    accent: "bg-amber-400",
    textPreview: "text-amber-300",
  },
  {
    id: "neon-matrix",
    name: "Terminal Green",
    bg: "bg-black",
    border: "border-green-600",
    accent: "bg-green-400",
    textPreview: "text-green-400",
  },
  {
    id: "lavender-mist",
    name: "Lavender Mist",
    bg: "bg-purple-50",
    border: "border-purple-300",
    accent: "bg-purple-600",
    textPreview: "text-purple-950",
  },
  {
    id: "crimson-luxury",
    name: "Crimson Velvet",
    bg: "bg-stone-950",
    border: "border-red-600/70",
    accent: "bg-rose-600",
    textPreview: "text-rose-200",
  },
  {
    id: "arctic-ice",
    name: "Arctic Glacier",
    bg: "bg-sky-950/90",
    border: "border-sky-300/60",
    accent: "bg-sky-300",
    textPreview: "text-sky-100",
  },
];

export const FONTS = [
  { id: "jakarta", name: "Plus Jakarta Sans", category: "Sans-Serif", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  { id: "dmsans", name: "DM Sans", category: "Geometric Clean", fontFamily: "'DM Sans', sans-serif" },
  { id: "urbanist", name: "Urbanist", category: "Modern Neo-Grotesk", fontFamily: "'Urbanist', sans-serif" },
  { id: "outfit", name: "Outfit Modern", category: "Contemporary Geometric", fontFamily: "'Outfit', sans-serif" },
  { id: "space", name: "Space Grotesk", category: "Tech Futuristic", fontFamily: "'Space Grotesk', sans-serif" },
  { id: "lexend", name: "Lexend Deca", category: "High Legibility", fontFamily: "'Lexend', sans-serif" },
  { id: "manrope", name: "Manrope", category: "Semi-Geometric", fontFamily: "'Manrope', sans-serif" },
  { id: "raleway", name: "Raleway", category: "Sophisticated Sans", fontFamily: "'Raleway', sans-serif" },
  { id: "cinzel", name: "Cinzel Regal", category: "Luxury Display", fontFamily: "'Cinzel', serif" },
  { id: "fraunces", name: "Fraunces", category: "Expressive Serif", fontFamily: "'Fraunces', serif" },
  { id: "nunito", name: "Nunito Soft", category: "Rounded Friendly", fontFamily: "'Nunito', sans-serif" },
  { id: "quicksand", name: "Quicksand", category: "Warm Rounded", fontFamily: "'Quicksand', sans-serif" },
  { id: "jetbrains", name: "JetBrains Mono", category: "Developer Monospace", fontFamily: "'JetBrains Mono', monospace" },
  { id: "sourcecode", name: "Source Code Pro", category: "Monospace Crisp", fontFamily: "'Source Code Pro', monospace" },
  { id: "inter", name: "Inter UI", category: "Clean Modern", fontFamily: "'Inter', sans-serif" },
  { id: "playfair", name: "Playfair Display", category: "Serif Elegance", fontFamily: "'Playfair Display', serif" },
  { id: "mono", name: "Fira Code", category: "Monospace Tech", fontFamily: "'Fira Code', monospace" },
  { id: "roboto", name: "Roboto", category: "Clean Neutral", fontFamily: "'Roboto', sans-serif" },
  { id: "poppins", name: "Poppins", category: "Geometric Friendly", fontFamily: "'Poppins', sans-serif" },
  { id: "lora", name: "Lora", category: "Classic Editorial", fontFamily: "'Lora', serif" },
  { id: "merriweather", name: "Merriweather", category: "Warm Editorial", fontFamily: "'Merriweather', serif" },
  { id: "montserrat", name: "Montserrat", category: "Bold Executive", fontFamily: "'Montserrat', sans-serif" },
  { id: "opensans", name: "Open Sans", category: "Highly Readable", fontFamily: "'Open Sans', sans-serif" },
  { id: "syne", name: "Syne Display", category: "Avant-Garde Art", fontFamily: "'Syne', sans-serif" },
];

export const ThemePickerModal: React.FC<Props> = ({
  currentTheme,
  currentFont = "jakarta",
  onSelectTheme,
  onSelectFont,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"theme" | "fonts" | "sounds">("theme");
  const [selectedRingtone, setSelectedRingtone] = useState<RingtoneOption>(
    soundManager.currentRingtone
  );
  const [selectedNotification, setSelectedNotification] = useState<NotificationOption>(
    soundManager.currentNotificationSound
  );

  const handleChooseRingtone = (rt: RingtoneOption) => {
    setSelectedRingtone(rt);
    soundManager.setRingtone(rt);
    soundManager.playRingtoneOnce(rt);
  };

  const handleChooseNotification = (no: NotificationOption) => {
    setSelectedNotification(no);
    soundManager.setNotificationSound(no);
    soundManager.playMessageSound(no);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 text-slate-100 shadow-2xl animate-in fade-in duration-200 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-teal-400" />
            <h3 className="font-bold text-sm">Themes & Font Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1.5 mb-4 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("theme")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "theme"
                ? "bg-teal-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Palette className="w-3.5 h-3.5" /> Themes ({THEMES.length})
          </button>
          <button
            onClick={() => setActiveTab("fonts")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "fonts"
                ? "bg-teal-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Type className="w-3.5 h-3.5" /> Fonts ({FONTS.length})
          </button>
          <button
            onClick={() => setActiveTab("sounds")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "sounds"
                ? "bg-teal-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" /> Audio
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {activeTab === "theme" && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-400 font-medium mb-1">
                Select your preferred interface theme palette. Designed for optical clarity across all devices.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {THEMES.map((theme) => {
                  const active = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => onSelectTheme(theme.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition ${
                        active
                          ? "bg-slate-800 border-teal-500 text-teal-300 ring-1 ring-teal-500"
                          : "bg-slate-950/70 border-slate-800 hover:bg-slate-800/50 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full ${theme.bg} ${theme.border} border-2 flex items-center justify-center shrink-0 shadow-inner`}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${theme.accent}`} />
                        </div>
                        <span className={`font-bold truncate ${theme.textPreview}`}>{theme.name}</span>
                      </div>
                      {active && <Check className="w-4 h-4 text-teal-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "fonts" && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-400 font-medium mb-1">
                Choose a typography style. Changes apply immediately across all application titles, chats, and modals.
              </p>
              <div className="space-y-2">
                {FONTS.map((font) => {
                  const active = currentFont === font.id;
                  return (
                    <button
                      key={font.id}
                      onClick={() => onSelectFont && onSelectFont(font.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition ${
                        active
                          ? "bg-slate-800 border-teal-500 text-teal-300 ring-1 ring-teal-500"
                          : "bg-slate-950/70 border-slate-800 hover:bg-slate-800/50 text-slate-300"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs" style={{ fontFamily: font.fontFamily }}>
                            {font.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                            {font.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate" style={{ fontFamily: font.fontFamily }}>
                          The quick brown fox jumps over the lazy dog
                        </p>
                      </div>
                      {active && <Check className="w-4 h-4 text-teal-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "sounds" && (
            <div className="space-y-4">
              {/* Ringtones */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400">
                  <Music className="w-3.5 h-3.5" /> Incoming Call Ringtone
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {RINGTONE_OPTIONS.map((rt) => {
                    const isSelected = selectedRingtone === rt.id;
                    return (
                      <div
                        key={rt.id}
                        onClick={() => handleChooseRingtone(rt.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border text-xs cursor-pointer transition ${
                          isSelected
                            ? "bg-slate-800 border-teal-500 text-teal-300"
                            : "bg-slate-950/60 border-slate-800 hover:bg-slate-800/50 text-slate-300"
                        }`}
                      >
                        <div>
                          <p className="font-bold">{rt.name}</p>
                          <p className="text-[10px] text-slate-400">{rt.desc}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChooseRingtone(rt.id);
                          }}
                          className="p-1.5 rounded-xl bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition flex items-center gap-1 text-[10px] font-bold"
                        >
                          <Play className="w-3 h-3 fill-current" /> Preview
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notification Sounds */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                  <Volume2 className="w-3.5 h-3.5" /> Message Notification Sound
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {NOTIFICATION_OPTIONS.map((no) => {
                    const isSelected = selectedNotification === no.id;
                    return (
                      <div
                        key={no.id}
                        onClick={() => handleChooseNotification(no.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border text-xs cursor-pointer transition ${
                          isSelected
                            ? "bg-slate-800 border-sky-500 text-sky-300"
                            : "bg-slate-950/60 border-slate-800 hover:bg-slate-800/50 text-slate-300"
                        }`}
                      >
                        <div>
                          <p className="font-bold">{no.name}</p>
                          <p className="text-[10px] text-slate-400">{no.desc}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChooseNotification(no.id);
                          }}
                          className="p-1.5 rounded-xl bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition flex items-center gap-1 text-[10px] font-bold"
                        >
                          <Play className="w-3 h-3 fill-current" /> Preview
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition"
        >
          Save & Apply
        </button>
      </div>
    </div>
  );
};

