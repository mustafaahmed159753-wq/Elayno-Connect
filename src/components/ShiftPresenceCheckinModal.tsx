import React, { useState } from "react";
import { socket } from "../lib/socket";
import {
  Clock,
  MapPin,
  Building,
  CheckCircle2,
  CalendarCheck,
  Sparkles,
  PhoneCall,
  User,
  Sun,
  Moon,
  Sunset,
  Check,
} from "lucide-react";
import {
  HOSPITAL_FLOORS,
  HOSPITAL_ZONES,
  SHIFT_PRESETS,
} from "./HospitalStaffOnboardingModal";

interface Props {
  username: string;
  userProfile?: {
    full_name?: string;
    department?: string;
    assigned_extension?: string;
    floor?: string;
    zone?: string;
    shift_end?: string;
  };
  onCompleted: (presenceData: any) => void;
  onClose?: () => void;
}

export const ShiftPresenceCheckinModal: React.FC<Props> = ({
  username,
  userProfile,
  onCompleted,
  onClose,
}) => {
  const initialTime = userProfile?.shift_end || "17:00";
  const [initH, initM] = initialTime.split(":").map(Number);

  const [shiftHours, setShiftHours] = useState(isNaN(initH) ? 17 : initH);
  const [shiftMinutes, setShiftMinutes] = useState(isNaN(initM) ? 0 : initM);
  const [floor, setFloor] = useState(userProfile?.floor || "3rd Floor");
  const [zone, setZone] = useState(userProfile?.zone || "Zone A");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedShiftEnd = `${shiftHours.toString().padStart(2, "0")}:${shiftMinutes.toString().padStart(2, "0")}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      username,
      shift_end: formattedShiftEnd,
      floor,
      zone,
    };

    try {
      const res = await fetch("/api/staff/shift_checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        if (socket.connected) {
          socket.emit("staff_shift_checkin_submit", payload);
        }
        onCompleted(data.presence || payload);
      } else {
        setError(data.message || "Failed to update shift presence.");
      }
    } catch (err) {
      console.error("Shift checkin error:", err);
      if (socket.connected) {
        socket.emit("staff_shift_checkin_submit", payload);
        onCompleted(payload);
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = userProfile?.full_name || username;
  const dept = userProfile?.department || "Hospital Department";
  const ext = userProfile?.assigned_extension || "Internal";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-0 sm:p-4 overflow-hidden">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] max-w-lg bg-slate-900 border-0 sm:border border-teal-500/40 sm:rounded-3xl shadow-2xl text-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-sky-600 p-0.5 shadow-lg shadow-teal-500/20 shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-teal-400" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                Daily Shift & Presence Check-in
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-[10px] font-bold">
                Duty Roster
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              Hospital Information BOT • Shift Presence Tracker
            </p>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-24 sm:pb-6 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
              <span>{error}</span>
            </div>
          )}

          {/* User Identity Snapshot */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 font-bold">
                {displayName.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{displayName}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="truncate">{dept}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono font-bold">Ext. {ext}</span>
                </div>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase shrink-0">
              Verified
            </div>
          </div>

          {/* Floor & Zone Station */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-400" />
                Floor Location
              </label>
              <div className="flex flex-wrap gap-1.5">
                {HOSPITAL_FLOORS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFloor(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                      floor === f
                        ? "bg-sky-500 border-sky-400 text-slate-950 shadow-md shadow-sky-500/20 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-400" />
                Zone / Station
              </label>
              <div className="flex flex-wrap gap-1.5">
                {HOSPITAL_ZONES.map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZone(z)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                      zone === z
                        ? "bg-teal-500 border-teal-400 text-slate-950 shadow-md shadow-teal-500/20 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CUSTOM STANDALONE SHIFT CLOCK */}
          <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Expected Shift Ending Time
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                Custom Clock
              </span>
            </div>

            {/* Glowing Digital Time Face */}
            <div className="flex items-center justify-center gap-3 py-3 px-4 bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-inner">
              {/* Hours Stepper */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setShiftHours((prev) => (prev + 1) % 24)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition text-xs font-bold"
                >
                  ▲
                </button>
                <span className="text-3xl font-black font-mono text-amber-300 tracking-wider">
                  {shiftHours.toString().padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => setShiftHours((prev) => (prev - 1 + 24) % 24)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition text-xs font-bold"
                >
                  ▼
                </button>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">Hours</span>
              </div>

              <span className="text-3xl font-black text-amber-400/80 animate-pulse pb-4">
                :
              </span>

              {/* Minutes Stepper */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setShiftMinutes((prev) => (prev + 15) % 60)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition text-xs font-bold"
                >
                  ▲
                </button>
                <span className="text-3xl font-black font-mono text-amber-300 tracking-wider">
                  {shiftMinutes.toString().padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => setShiftMinutes((prev) => (prev - 15 + 60) % 60)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition text-xs font-bold"
                >
                  ▼
                </button>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">Mins</span>
              </div>

              {/* Period */}
              <div className="ml-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-xs font-extrabold text-amber-400 font-mono block">
                  {shiftHours >= 12 ? "PM" : "AM"}
                </span>
                <span className="text-[9px] text-slate-400">
                  {shiftHours >= 18 ? "Night" : shiftHours >= 12 ? "Afternoon" : "Morning"}
                </span>
              </div>
            </div>

            {/* Quick Shift Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
              {SHIFT_PRESETS.map((p) => {
                const [h, m] = p.time.split(":").map(Number);
                const isSelected = shiftHours === h && shiftMinutes === m;
                const Icon = p.icon;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setShiftHours(h);
                      setShiftMinutes(m);
                    }}
                    className={`p-2 rounded-xl text-left border flex items-center gap-2 transition cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-amber-400" : "text-slate-500"}`} />
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold block truncate">{p.time}</span>
                      <span className="text-[9px] text-slate-400 block truncate">{p.period}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky/Fixed Footer Action Buttons */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 flex items-center justify-end gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Skip for Now
            </button>
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-teal-500/25 transition cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span>Updating Presence...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Shift Presence ({formattedShiftEnd})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
