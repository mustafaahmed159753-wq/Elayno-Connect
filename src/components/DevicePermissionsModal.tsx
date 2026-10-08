import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Monitor,
  Smartphone,
  Tablet,
  Camera,
  Mic,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Video,
  Volume2,
  RefreshCw,
  Lock,
  Globe,
  Key,
  BellRing,
  PhoneCall,
  Play
} from "lucide-react";
import { detectBrowserAndDevice, checkMediaPermissions, DeviceInfo } from "../lib/deviceDetect";
import { soundManager } from "../lib/sound";

interface Props {
  onClose: () => void;
}

export const DevicePermissionsModal: React.FC<Props> = ({ onClose }) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [permState, setPermState] = useState<{
    camera: string;
    microphone: string;
    hasDevices: boolean;
  }>({ camera: "unknown", microphone: "unknown", hasDevices: false });

  const [testingMedia, setTestingMedia] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const info = detectBrowserAndDevice();
    setDeviceInfo(info);
    checkMediaPermissions().then(setPermState);

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleTestMedia = async () => {
    setTestError(null);
    setTestSuccess(false);
    setTestingMedia(true);

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "navigator.mediaDevices is disabled in this browser or insecure HTTP context."
        );
      }

      const userStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setStream(userStream);
      setTestSuccess(true);
      checkMediaPermissions().then(setPermState);
    } catch (err: any) {
      console.error(err);
      setTestError(
        err.message || "Failed to access Camera/Microphone. Ensure permissions are granted."
      );
    } finally {
      setTestingMedia(false);
    }
  };

  const handleStopTest = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setTestSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Device, Browser & SSL Diagnostic</h2>
              <p className="text-xs text-slate-400">
                Camera, Microphone permissions, and HTTPS Secure Context setup
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Section 1: Auto Detected Environment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400">
                {deviceInfo?.deviceType === "Mobile" ? (
                  <Smartphone className="w-5 h-5" />
                ) : deviceInfo?.deviceType === "Tablet" ? (
                  <Tablet className="w-5 h-5" />
                ) : (
                  <Monitor className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Device Type</div>
                <div className="font-bold text-white text-sm">{deviceInfo?.deviceType || "Detecting..."}</div>
                <div className="text-[10px] text-slate-400">{deviceInfo?.osName}</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Detected Browser</div>
                <div className="font-bold text-white text-sm">{deviceInfo?.browserName || "Detecting..."}</div>
                <div className="text-[10px] text-slate-400">{deviceInfo?.browserVersion ? `v${deviceInfo.browserVersion}` : "Auto"}</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${deviceInfo?.isSecureContext ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">SSL / Protocol</div>
                <div className={`font-bold text-sm ${deviceInfo?.isSecureContext ? "text-emerald-400" : "text-amber-400"}`}>
                  {deviceInfo?.isSecureContext ? "Secure HTTPS Context" : "Insecure HTTP"}
                </div>
                <div className="text-[10px] text-slate-400">{deviceInfo?.protocol}</div>
              </div>
            </div>
          </div>

          {/* Warning for HTTP Context */}
          {!deviceInfo?.isSecureContext && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-amber-300 text-xs">Notice: WebRTC Camera/Mic requires HTTPS or localhost</div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Web browsers (Chrome, Edge, Safari) strictly block camera and microphone access on unencrypted HTTP IP addresses.
                  To enable full video calling when hosting on your server:
                </p>
                <div className="mt-2 text-[11px] font-mono bg-slate-950 p-2.5 rounded-lg border border-amber-500/20 text-slate-300">
                  Option 1: Run <span className="text-sky-400 font-bold">npm run certs</span> on your server to generate <span className="text-emerald-400">key.pem</span> and <span className="text-emerald-400">cert.pem</span> SSL certificates.<br/>
                  Option 2: Open browser flags: <span className="text-amber-300 font-bold">chrome://flags/#unsafely-treat-insecure-origin-as-secure</span> and add your IP.
                </div>
              </div>
            </div>
          )}

          {/* Camera & Mic Test Tool */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-sky-400" /> Interactive Hardware & Stream Test
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Verify camera video feed and microphone capture before initiating WebRTC video calls.
                </p>
              </div>

              {!stream ? (
                <button
                  onClick={handleTestMedia}
                  disabled={testingMedia}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-sky-500/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingMedia ? "animate-spin" : ""}`} />
                  {testingMedia ? "Testing..." : "Test Camera & Mic"}
                </button>
              ) : (
                <button
                  onClick={handleStopTest}
                  className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 font-bold text-xs transition"
                >
                  Stop Test
                </button>
              )}
            </div>

            {/* Test Video Preview Area */}
            {stream && (
              <div className="relative rounded-xl overflow-hidden bg-black border border-slate-700 aspect-video max-h-56 flex items-center justify-center shadow-lg">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Live Hardware Stream Active
                </div>
              </div>
            )}

            {testError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{testError}</span>
              </div>
            )}

            {testSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Camera and Microphone successfully initialized and functioning properly!</span>
              </div>
            )}
          </div>

          {/* Default Notification Sounds & Ringtones Tester */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <BellRing className="w-4 h-4 text-amber-400" /> Default Audio Ringtones & Notification Sounds
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Preview high-clarity Web Audio synthesizers used for incoming messages, call ringtones, and connection chimes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => soundManager.playMessageSound()}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-300 font-semibold text-[11px] flex flex-col items-center gap-1 transition"
              >
                <BellRing className="w-4 h-4 text-amber-400" />
                Message Chime
              </button>

              <button
                onClick={() => {
                  soundManager.startRingtone();
                  setTimeout(() => soundManager.stopRingtone(), 3000);
                }}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-300 font-semibold text-[11px] flex flex-col items-center gap-1 transition"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                Incoming Call
              </button>

              <button
                onClick={() => {
                  soundManager.startOutgoingRing();
                  setTimeout(() => soundManager.stopOutgoingRing(), 3000);
                }}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/10 text-sky-300 font-semibold text-[11px] flex flex-col items-center gap-1 transition"
              >
                <Volume2 className="w-4 h-4 text-sky-400" />
                Outgoing Ring
              </button>

              <button
                onClick={() => soundManager.playCallConnected()}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-indigo-300 font-semibold text-[11px] flex flex-col items-center gap-1 transition"
              >
                <Play className="w-4 h-4 text-indigo-400" />
                Connected Chord
              </button>
            </div>
          </div>

          {/* SSL Cert Generation Instructions */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
            <h4 className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
              <Key className="w-4 h-4 text-indigo-400" /> Self-Signed SSL Certificate Generator
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              If you host Elyano Connect on a local network or custom server, run the built-in certificate generator script to instantly create <span className="text-white font-mono">key.pem</span> and <span className="text-white font-mono">cert.pem</span> for HTTPS:
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-sky-400 flex items-center justify-between">
              <span>npm run certs</span>
              <span className="text-slate-500 text-[10px]">Creates SSL certs automatically</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
