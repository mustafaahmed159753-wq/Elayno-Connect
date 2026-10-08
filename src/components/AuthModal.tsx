import React, { useState } from "react";
import { socket } from "../lib/socket";
import { LogIn, UserPlus, ShieldAlert, Building, Lock, Shield, User } from "lucide-react";
import { EliteLogo } from "./EliteLogo";

interface Props {
  onLoginSuccess: (username: string, openAdmin?: boolean, extraData?: any) => void;
}

export const AuthModal: React.FC<Props> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<"staff" | "admin">("staff");
  const [username, setUsername] = useState(() => localStorage.getItem("elyano_remembered_username") || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("elyano_remember_me") !== "false");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = (u: string, p: string, mode: "staff" | "admin") => {
    if (!u.trim()) {
      setError("Please enter a username");
      return;
    }
    setLoading(true);
    setError(null);

    if (!socket.connected) {
      socket.connect();
    }

    const timer = setTimeout(() => {
      setLoading(false);
      setError("Server response timed out. Please try again.");
    }, 6000);

    const handleAuthRes = (data: { ok: boolean; user?: string; token?: string; m?: string; openAdmin?: boolean }) => {
      clearTimeout(timer);
      setLoading(false);
      socket.off("auth_res", handleAuthRes);

      if (data.ok && data.user) {
        if (data.token) {
          localStorage.setItem("elyano_token", data.token);
        }
        localStorage.setItem("elyano_auth_pass", p);
        if (rememberMe) {
          localStorage.setItem("elyano_remembered_username", data.user);
          localStorage.setItem("elyano_remember_me", "true");
          localStorage.setItem("elyano_user", data.user);
        } else {
          localStorage.removeItem("elyano_remembered_username");
          localStorage.setItem("elyano_remember_me", "false");
          localStorage.setItem("elyano_user", data.user);
        }
        onLoginSuccess(data.user, data.openAdmin || mode === "admin", data);
      } else {
        setError(data.m || "Authentication failed");
      }
    };

    socket.on("auth_res", handleAuthRes);
    socket.emit("authenticate", {
      user: u.trim(),
      pass: p,
      type: "login",
      mode,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900/95 border border-slate-700/60 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <EliteLogo size="lg" variant="dark" showText={true} className="mb-2" />
          <p className="text-xs text-slate-400 mt-0.5">Active Directory (LDAP) Communication Portal</p>

          <div className="mt-2 flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
              <Building className="w-3 h-3" /> LDAP: Active Directory Connected
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[10px] font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> LDAP Bind Authentication
            </span>
          </div>
        </div>

        {/* Login Type Switcher Buttons */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthMode("staff");
              setError(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
              authMode === "staff"
                ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <User className="w-4 h-4" /> Staff Login
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode("admin");
              setError(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
              authMode === "admin"
                ? "bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Shield className="w-4 h-4 text-amber-300" /> Admin Login
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Forms */}
        {authMode === "staff" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAuth(username, password, "staff");
            }}
            className="space-y-3.5"
          >
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-2.5 text-center text-[11px] text-sky-300">
              💬 <strong>Staff Mode:</strong> Sign in to join clinical chats, group channels, and submit support tickets.
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Staff Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. dr_horvat or nurse_ivancic"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Password <span className="text-sky-400 font-normal">(Required)</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter account password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500 accent-sky-500 cursor-pointer"
                />
                <span className="font-medium text-slate-300">Remember me on this browser</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm transition shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Enter Staff Portal
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 text-center italic pt-1">
              New staff member accounts are created exclusively by System Administrators from the Admin Panel.
            </p>
          </form>
        ) : (
          /* Admin Login Form */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAuth(username, password, "admin");
            }}
            className="space-y-3.5"
          >
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-center text-[11px] text-amber-300">
              🛡️ <strong>Admin Control Mode:</strong> Sign in with System Administrator credentials (e.g. <span className="font-bold">Elite</span>) to launch the Control Dashboard.
            </div>

            <div>
              <label className="text-xs font-semibold text-amber-300 mb-1 block">Administrator Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Elite or admin"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/30 text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                />
                <span className="font-medium text-slate-300">Remember me on this browser</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1 rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-sky-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4 text-amber-300" /> Launch Control Dashboard
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 text-center italic">
              Note: Admins who wish to participate in staff chats can also use the Staff Login option above.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
