import React, { useState, useEffect, useRef } from "react";
import { STICKER_PACKS, StickerItem } from "../data/stickers";
import { Sparkles, X, Heart, Laptop, Hospital, Zap, Search } from "lucide-react";

interface StickerPickerProps {
  onSelectSticker: (sticker: StickerItem) => void;
  onClose: () => void;
}

export const StickerPicker: React.FC<StickerPickerProps> = ({ onSelectSticker, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<string>("medical");
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Position calculation so the full sticker menu is always completely in view without clipping
  useEffect(() => {
    const updatePosition = () => {
      const parent = containerRef.current?.parentElement;
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      if (!parent) {
        setCoords({
          top: Math.max(16, screenH - 480),
          left: Math.max(16, (screenW - 440) / 2),
          width: Math.min(440, screenW - 32),
          height: Math.min(460, screenH - 80),
        });
        return;
      }

      const rect = parent.getBoundingClientRect();
      const isMobile = screenW < 640;
      const width = isMobile ? screenW - 24 : Math.min(450, screenW - 32);
      const maxHeight = Math.min(480, screenH - 90);

      // Desired top position: above the button
      let top = rect.top - maxHeight - 12;
      let height = maxHeight;

      if (top < 16) {
        top = 16;
        height = Math.max(280, rect.top - 28);
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

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const categoryIcons: Record<string, React.ReactNode> = {
    medical: <Hospital className="w-3.5 h-3.5" />,
    tech: <Laptop className="w-3.5 h-3.5" />,
    reactions: <Heart className="w-3.5 h-3.5" />,
    badges: <Zap className="w-3.5 h-3.5" />,
  };

  const allStickers = STICKER_PACKS.flatMap((p) => p.stickers);

  // Filter stickers based on category or search query
  const displayedStickers = searchQuery.trim()
    ? allStickers.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.emoji.includes(searchQuery)
      )
    : (STICKER_PACKS.find((p) => p.id === activeCategory) || STICKER_PACKS[0]).stickers;

  const currentPack = STICKER_PACKS.find((p) => p.id === activeCategory) || STICKER_PACKS[0];

  return (
    <div
      ref={containerRef}
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
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 shrink-0 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs text-white block">Hospital Sticker Collection</span>
            <span className="text-[10px] text-slate-400">High-definition vector badges & reactions</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs p-1.5 rounded-lg hover:bg-slate-800 transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 py-1.5 bg-slate-950/40 border-b border-slate-800/80 shrink-0">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stickers by name or keyword..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs (hidden during active search) */}
      {!searchQuery.trim() && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/50 border-b border-slate-800/80 overflow-x-auto scrollbar-none shrink-0">
          {STICKER_PACKS.map((pack) => {
            const isActive = pack.id === activeCategory;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => setActiveCategory(pack.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <span>{pack.icon}</span>
                <span className="text-[11px]">{pack.title.split(" ")[0]}</span>
                <span className="text-[9px] px-1 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {pack.stickers.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Stickers Grid */}
      <div className="flex-1 overflow-y-auto p-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="text-[11px] font-bold text-slate-400 mb-2 px-1 flex items-center justify-between">
          <span>{searchQuery.trim() ? `Search Results (${displayedStickers.length})` : currentPack.title}</span>
          <span className="text-[10px] text-slate-500">{displayedStickers.length} stickers</span>
        </div>

        {displayedStickers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs text-slate-400">No stickers found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {displayedStickers.map((stk) => (
              <button
                key={stk.id}
                type="button"
                onClick={() => onSelectSticker(stk)}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/60 flex flex-col items-center justify-center gap-2 transition active:scale-95 group shadow-sm hover:shadow-indigo-500/10 cursor-pointer"
                title={stk.description}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center relative transition-transform group-hover:scale-108">
                  <img
                    src={stk.previewUrl}
                    alt={stk.name}
                    className="w-full h-full object-contain filter drop-shadow-md"
                  />
                </div>
                <div className="w-full text-center min-w-0">
                  <span className="text-[10px] font-bold text-slate-300 group-hover:text-indigo-300 block truncate">
                    {stk.name}
                  </span>
                  <span className="text-[8px] text-slate-500 block truncate">{stk.emoji} {stk.category}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3.5 py-1.5 border-t border-slate-800/80 bg-slate-950/60 shrink-0 flex items-center justify-between text-[10px] text-slate-500">
        <span>Click to instantly send sticker</span>
        <span className="text-indigo-400 font-medium">Vector Graphics</span>
      </div>
    </div>
  );
};
