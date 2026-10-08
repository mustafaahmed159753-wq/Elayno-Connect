import React, { useState } from "react";
import { Message } from "../types";
import { Search, MessageSquare, ArrowRight } from "lucide-react";

interface Props {
  currentUser: string;
  onClose: () => void;
  onSelectMessage: (recipient: string, messageId: number) => void;
}

export const GlobalSearchModal: React.FC<Props> = ({
  currentUser,
  onClose,
  onSelectMessage,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q.trim())}&user=${encodeURIComponent(currentUser)}`
      );
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-md p-4 pt-16">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/60 rounded-3xl p-5 text-slate-100 shadow-2xl animate-in fade-in duration-200">
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-950 border border-slate-800 rounded-2xl mb-4">
          <Search className="w-4 h-4 text-sky-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Global search messages across all chats..."
            className="flex-1 bg-transparent text-sm text-slate-100 focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <p className="text-xs text-slate-500 text-center py-6">Searching messages...</p>
          ) : results.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              {query ? "No matching messages found." : "Type at least 2 characters to search"}
            </p>
          ) : (
            results.map((m) => {
              const other = m.sender === currentUser ? m.recipient : m.sender;

              return (
                <div
                  key={m.id}
                  onClick={() => {
                    onSelectMessage(other, m.id);
                    onClose();
                  }}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-sky-500/50 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-semibold text-sky-400">{other}</span>
                    <span className="text-[10px]">
                      {new Date(m.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 truncate">{m.msg || m.filename}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
