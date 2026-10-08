import React, { useEffect, useState } from "react";
import { CallLog } from "../types";
import { PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, Clock } from "lucide-react";

interface Props {
  currentUser: string;
  onClose: () => void;
  onStartCallWith: (user: string, type: "voice" | "video") => void;
}

export const CallLogModal: React.FC<Props> = ({ currentUser, onClose, onStartCallWith }) => {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [filter, setFilter] = useState<"all" | "missed" | "outgoing" | "incoming">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/call_history?user=${encodeURIComponent(currentUser)}`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentUser]);

  const filteredLogs = logs.filter((log) => {
    if (filter === "missed") return log.status === "missed";
    if (filter === "outgoing") return log.caller === currentUser;
    if (filter === "incoming") return log.callee === currentUser;
    return true;
  });

  const formatDuration = (sec: number) => {
    if (!sec) return "00:00";
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-3xl p-6 text-slate-100 shadow-2xl animate-in fade-in duration-200 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Call History</h3>
              <p className="text-[11px] text-slate-400">{logs.length} Total Calls Logged</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">
            ✕ Close
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 mb-3 border-b border-slate-800 pb-3">
          {(["all", "outgoing", "incoming", "missed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                filter === f
                  ? "bg-sky-500 text-slate-950"
                  : "bg-slate-800/60 text-slate-400 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <p className="text-xs text-slate-500 text-center py-8">Loading history...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No call history found.</p>
          ) : (
            filteredLogs.map((log) => {
              const isOutgoing = log.caller === currentUser;
              const peer = isOutgoing ? log.callee : log.caller;
              const isMissed = log.status === "missed";

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isMissed
                          ? "bg-red-500/10 text-red-400 border border-red-500/30"
                          : isOutgoing
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                      }`}
                    >
                      {isMissed ? (
                        <PhoneMissed className="w-4 h-4" />
                      ) : isOutgoing ? (
                        <PhoneOutgoing className="w-4 h-4" />
                      ) : (
                        <PhoneIncoming className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{peer}</span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          ({log.call_type})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span>{new Date(log.started_at).toLocaleString()}</span>
                        {log.duration_sec > 0 && (
                          <span>• {formatDuration(log.duration_sec)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        onClose();
                        onStartCallWith(peer, "voice");
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 transition"
                      title="Callback Voice"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onStartCallWith(peer, "video");
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-sky-500/20 hover:text-sky-400 text-slate-300 transition"
                      title="Callback Video"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
