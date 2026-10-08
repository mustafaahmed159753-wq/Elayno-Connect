import React, { useState, useEffect, useRef } from "react";
import { Smile, Search, X, Heart, Hospital, Laptop, Sparkles, ThumbsUp, Coffee } from "lucide-react";

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "popular",
    name: "Popular & Quick",
    icon: <Sparkles className="w-3.5 h-3.5" />,
    emojis: [
      "👍", "❤️", "😂", "🔥", "🎉", "🙏", "💯", "😎", "🚀", "💡", "✅", "✨",
      "🩺", "💉", "🏥", "💻", "⚡", "👏", "🫡", "☕", "👌", "🤝", "💪", "🙌"
    ],
  },
  {
    id: "smileys",
    name: "Smileys & Faces",
    icon: <Smile className="w-3.5 h-3.5" />,
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃",
      "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😜", "🤪",
      "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏",
      "😒", "🙄", "😬", "🤥", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢",
      "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓",
      "🧐", "😕", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "😦", "😧",
      "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫"
    ],
  },
  {
    id: "gestures",
    name: "Hands & Gestures",
    icon: <ThumbsUp className="w-3.5 h-3.5" />,
    emojis: [
      "👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈",
      "👉", "👆", "🖕", "👇", "☝️", "🫵", "👋", "🤚", "🖐️", "✋", "🖖", "🫲",
      "🫱", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🦾", "🫡", "🤳"
    ],
  },
  {
    id: "medical",
    name: "Hospital & Medical",
    icon: <Hospital className="w-3.5 h-3.5" />,
    emojis: [
      "🏥", "🩺", "💉", "💊", "🩹", "🩸", "🚑", "👨‍⚕️", "👩‍⚕️", "🧑‍⚕️", "🔬", "🧬",
      "🧪", "🩻", "🦷", "🫀", "🫁", "🦴", "♿", "🩼", "🌡️", "📋", "⚕️", "🏨",
      "🚨", "🛌", "🧴", "🧯", "🧼", "🧻", "🧫", "🛡️", "⚠️", "🔔", "🟢", "🔴"
    ],
  },
  {
    id: "tech",
    name: "Tech & Workplace",
    icon: <Laptop className="w-3.5 h-3.5" />,
    emojis: [
      "💻", "🖥️", "🖨️", "⌨️", "🖱️", "📱", "☎️", "📞", "📟", "📠", "📡", "🔋",
      "🔌", "💡", "🔧", "🔨", "⚙️", "🗄️", "📁", "📂", "📄", "📊", "📈", "📉",
      "🔒", "🔑", "🛡️", "⚡", "🤖", "🌐", "📶", "💾", "💿", "🏷️", "📦", "✉️"
    ],
  },
  {
    id: "hearts",
    name: "Hearts & Symbols",
    icon: <Heart className="w-3.5 h-3.5" />,
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕",
      "💞", "💓", "💗", "💖", "💘", "💝", "💟", "⭐", "🌟", "✨", "💫", "🎯",
      "🔥", "💯", "✅", "❌", "⭕", "🛑", "⚠️", "❓", "❗", "‼️", "💬", "💭"
    ],
  },
  {
    id: "activities",
    name: "Food & Breaks",
    icon: <Coffee className="w-3.5 h-3.5" />,
    emojis: [
      "☕", "🍵", "🥤", "🧋", "🍎", "🥪", "🍕", "🍔", "🥗", "🍱", "🍰", "🍩",
      "🍪", "🍫", "🍿", "🚗", "🚲", "⏰", "⏱️", "⏳", "💤", "🎵", "🎧", "📷"
    ],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Position calculation so the full menu is always completely in view without clipping
  useEffect(() => {
    const updatePosition = () => {
      const parent = pickerRef.current?.parentElement;
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      if (!parent) {
        setCoords({
          top: Math.max(16, screenH - 460),
          left: Math.max(16, (screenW - 390) / 2),
          width: Math.min(390, screenW - 32),
          height: Math.min(440, screenH - 80),
        });
        return;
      }

      const rect = parent.getBoundingClientRect();
      const isMobile = screenW < 640;
      const width = isMobile ? screenW - 24 : Math.min(400, screenW - 32);
      const maxHeight = Math.min(460, screenH - 90);

      // Desired top position: above the button
      let top = rect.top - maxHeight - 12;
      let height = maxHeight;

      if (top < 16) {
        top = 16;
        height = Math.max(260, rect.top - 28);
      }

      // Horizontal alignment: try aligning with button left, clamp within viewport
      let left = isMobile ? 12 : rect.left;
      if (left + width > screenW - 16) {
        left = screenW - width - 16;
      }
      if (left < 16) {
        left = 16;
      }

      setCoords({ top, left, width, height });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Filtered emojis if searching
  const isSearching = searchQuery.trim().length > 0;
  const filteredEmojis = isSearching
    ? Array.from(
        new Set(
          EMOJI_CATEGORIES.flatMap((cat) => cat.emojis).filter((emoji) =>
            // Simple match or index in full set
            true
          )
        )
      )
    : [];

  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];

  return (
    <div
      ref={pickerRef}
      style={
        coords
          ? {
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              height: `${coords.height}px`,
            }
          : undefined
      }
      className="fixed bg-slate-900/98 backdrop-blur-2xl border border-slate-700/90 rounded-2xl shadow-2xl z-[9999] flex flex-col animate-in fade-in slide-in-from-bottom-2 text-slate-100 overflow-hidden"
    >
      {/* Header with Title and Close Button */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 shrink-0 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Smile className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs text-white">Select Emoji</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto scrollbar-none shrink-0">
        {EMOJI_CATEGORIES.map((cat) => {
          const isActive = cat.id === activeTab;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveTab(cat.id);
                setSearchQuery("");
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              title={cat.name}
            >
              <span>{cat.icon}</span>
              <span className="text-[11px] hidden sm:inline">{cat.name.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Emoji Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="text-[11px] font-bold text-slate-400 mb-2 px-1 flex items-center justify-between">
          <span>{currentCategory.name}</span>
          <span className="text-[10px] text-slate-500">{currentCategory.emojis.length} emojis</span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5 sm:gap-2">
          {currentCategory.emojis.map((emoji, idx) => (
            <button
              key={`${emoji}-${idx}`}
              type="button"
              onClick={() => {
                onSelectEmoji(emoji);
              }}
              className="w-10 h-10 sm:w-10 sm:h-10 text-2xl flex items-center justify-center rounded-xl hover:bg-slate-800/90 active:scale-90 transition hover:scale-110 cursor-pointer select-none"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Quick Pick Bar */}
      <div className="px-3 py-2 border-t border-slate-800/90 bg-slate-950/70 shrink-0 flex items-center justify-between text-[11px] text-slate-400">
        <span className="text-[10px] text-slate-500">Click any emoji to insert into message</span>
        <div className="flex items-center gap-1">
          {["👍", "❤️", "🙏", "😂", "✅"].map((quickEmoji) => (
            <button
              key={quickEmoji}
              type="button"
              onClick={() => onSelectEmoji(quickEmoji)}
              className="hover:scale-125 transition active:scale-95 text-base px-1"
            >
              {quickEmoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
