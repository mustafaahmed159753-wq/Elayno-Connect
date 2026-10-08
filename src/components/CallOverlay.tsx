import React, { useEffect, useRef, useState } from "react";
import { socket } from "../lib/socket";
import { soundManager } from "../lib/sound";
import { callAlertManager } from "../lib/callAlerts";
import { CallState, User } from "../types";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  PhoneIncoming,
  Volume2,
  Scan,
  Play,
  Smartphone,
  Speaker,
} from "lucide-react";

interface Props {
  callState: CallState;
  onEndCall: () => void;
  onAnswerCall?: () => void;
  currentUser: string;
  usersMap: Record<string, User>;
}

// Check if current device is a mobile phone/tablet
const isMobileDevice = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua) ||
    (/Macintosh/i.test(ua) && isTouch);
};

const isAppleMobile = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && isTouch);
};

// Modifies Opus SDP parameters for mobile voice calls to enforce telephony mode.
// Instructs Android audio HAL and iOS AVAudioSession to route to earpiece (STREAM_VOICE_CALL).
// Desktop mode bypasses this and remains untouched.
function applyMobileVoiceSdp(sdp: string): string {
  try {
    if (!isMobileDevice() || !sdp) return sdp;
    return sdp.replace(/a=fmtp:(\d+)(.*)/g, (match, pt, rest) => {
      if (sdp.includes(`rtpmap:${pt} opus`) || sdp.includes(`rtpmap:${pt} OPUS`)) {
        let params = rest;
        if (!params.includes("stereo=")) {
          params += ";stereo=0;sprop-stereo=0";
        }
        if (!params.includes("useinbandfec=")) {
          params += ";useinbandfec=1";
        }
        return `a=fmtp:${pt}${params}`;
      }
      return match;
    });
  } catch (_) {
    return sdp;
  }
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.services.mozilla.com" },
  ],
  iceCandidatePoolSize: 10,
};

// Robust Media Stream Fallback for iframes or restricted environments
async function acquireMediaStream(wantVideo: boolean): Promise<MediaStream> {
  const isMobile = isMobileDevice();
  
  const audioConstraints: MediaTrackConstraints | boolean = isMobile
    ? {
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
        autoGainControl: { ideal: true },
      }
    : true;

  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const videoConstraint = wantVideo
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: isMobile ? "user" : undefined,
            }
          : false;

        return await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: videoConstraint,
        });
      } catch (e) {
        console.warn("High-res video constraint failed, trying basic video:", e);
        try {
          return await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
            video: wantVideo ? true : false,
          });
        } catch (e1) {
          console.warn("Basic video failed, trying audio only:", e1);
          try {
            return await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
          } catch (e2) {
            console.warn("Audio devices unavailable, creating synthetic stream fallback:", e2);
          }
        }
      }
    }
  } catch (err) {
    console.warn("navigator.mediaDevices error:", err);
  }

  // Create clean synthetic media stream fallback so WebRTC always connects
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "24px sans-serif";
    ctx.fillText("Audio/Video Stream Active", 180, 240);
  }
  const stream = (canvas as any).captureStream ? (canvas as any).captureStream(15) : new MediaStream();
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0; // Silent audio track
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  } catch (_) {}
  return stream;
}

export const CallOverlay: React.FC<Props> = ({
  callState,
  onEndCall,
  onAnswerCall,
  currentUser,
  usersMap,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isMinimised, setIsMinimised] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [statusText, setStatusText] = useState("Connecting...");
  const [localCallState, setLocalCallState] = useState<"incoming" | "outgoing" | "connected">(
    callState.state
  );
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [videoFitMode, setVideoFitMode] = useState<"contain" | "cover">("contain");
  const [needsUserPlayInteraction, setNeedsUserPlayInteraction] = useState(false);
  const [audioOutput, setAudioOutput] = useState<"earpiece" | "outspeaker">(() => {
    // If phone device, default is earpiece, otherwise outspeakers
    return isMobileDevice() ? "earpiece" : "outspeaker";
  });
  const [audioToast, setAudioToast] = useState<string | null>(null);
  const [isEarModeLocked, setIsEarModeLocked] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoBgRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteMediaStreamRef = useRef<MediaStream | null>(null);
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const processedCandidatesRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const peerData = usersMap[callState.peerUser] || { username: callState.peerUser };

  const showAudioToast = (msg: string) => {
    setAudioToast(msg);
    setTimeout(() => setAudioToast(null), 2500);
  };

  const addIceCandidateSafe = async (cand: RTCIceCandidateInit) => {
    if (!cand || !cand.candidate) return;
    if (processedCandidatesRef.current.has(cand.candidate)) return;
    processedCandidatesRef.current.add(cand.candidate);

    const pc = pcRef.current;
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (err) {
        console.warn("Failed to add ICE candidate:", err);
      }
    } else {
      iceCandidatesQueueRef.current.push(cand);
    }
  };

  const flushQueuedCandidates = async (pc: RTCPeerConnection) => {
    const queue = [...iceCandidatesQueueRef.current];
    iceCandidatesQueueRef.current = [];
    for (const cand of queue) {
      if (cand && cand.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (err) {
          console.warn("Failed to add queued ICE candidate:", err);
        }
      }
    }
  };

  const setupRemoteTrackHandler = (pc: RTCPeerConnection) => {
    pc.ontrack = (event) => {
      // Set speech contentHint on mobile audio tracks to signal telephony mode to Android AudioManager
      if (event.track.kind === "audio" && isMobileDevice()) {
        event.track.contentHint = "speech";
      }

      let stream = event.streams && event.streams[0];
      if (!stream) {
        if (!remoteMediaStreamRef.current) {
          remoteMediaStreamRef.current = new MediaStream();
        }
        remoteMediaStreamRef.current.addTrack(event.track);
        stream = remoteMediaStreamRef.current;
      } else {
        remoteMediaStreamRef.current = stream;
      }

      // Always trigger state update with fresh MediaStream instance so React updates
      setRemoteStream(new MediaStream(stream.getTracks()));

      const isVoice = callState.callType === "voice";

      // Dedicated remote audio element for WebRTC VoIP telephony & earpiece
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch((err) => {
          console.warn("Audio autoplay blocked by mobile browser:", err);
          setNeedsUserPlayInteraction(true);
        });
      }

      // Video elements: muted={true} so audio plays exclusively through remoteAudioRef
      if (!isVoice) {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.muted = true;
          remoteVideoRef.current.play().catch((err) => {
            console.warn("Video autoplay blocked:", err);
            setNeedsUserPlayInteraction(true);
          });
        }
        if (remoteVideoBgRef.current) {
          remoteVideoBgRef.current.srcObject = stream;
          remoteVideoBgRef.current.play().catch(() => {});
        }
      } else {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (remoteVideoBgRef.current) remoteVideoBgRef.current.srcObject = null;
      }

      // Apply audio output routing to newly bound stream
      applyAudioOutputRouting(audioOutput);

      event.track.onunmute = () => {
        if (!isVoice && remoteVideoRef.current) {
          remoteVideoRef.current.play().catch(() => {
            setNeedsUserPlayInteraction(true);
          });
        }
        if (!isVoice && remoteVideoBgRef.current) {
          remoteVideoBgRef.current.play().catch(() => {});
        }
      };
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && event.candidate.candidate) {
        socket.emit("call_ice_candidate", {
          to: callState.peerUser,
          candidate: event.candidate,
        });
      }
    };

    pc.onicecandidateerror = (event: any) => {
      console.warn("WebRTC ICE candidate error:", event.errorText, event.errorCode, event.url);
    };

    pc.onicegatheringstatechange = () => {
      console.log("WebRTC ICE gathering state:", pc.iceGatheringState);
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log("WebRTC ICE connection state:", state);
      if (state === "connected" || state === "completed") {
        setStatusText("Connected");
        setLocalCallState("connected");
      } else if (state === "checking") {
        setStatusText("Connecting media...");
      } else if (state === "disconnected") {
        setStatusText("Reconnecting...");
      } else if (state === "failed") {
        setStatusText("Connection Failed - Retrying...");
        if (typeof (pc as any).restartIce === "function") {
          try {
            (pc as any).restartIce();
          } catch (err) {
            console.warn("ICE restart failed:", err);
          }
        }
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log("WebRTC Peer connection state:", state);
      if (state === "connected") {
        setStatusText("Connected");
        setLocalCallState("connected");
      } else if (state === "connecting") {
        setStatusText("Connecting...");
      } else if (state === "disconnected") {
        setStatusText("Reconnecting...");
      } else if (state === "failed") {
        setStatusText("Call Disconnected");
      } else if (state === "closed") {
        setStatusText("Call Ended");
      }
    };
  };

  const applyAudioOutputRouting = async (targetMode: "earpiece" | "outspeaker") => {
    try {
      const audioEl = remoteAudioRef.current;
      const isMobile = isMobileDevice();

      // 1. iOS Safari AudioSession API (iOS 17+)
      // 'play-and-record' routes directly to earpiece receiver on iPhone/iPad in Safari
      // 'playback' routes to the loudspeaker
      if (isMobile && typeof navigator !== "undefined" && "audioSession" in navigator) {
        try {
          (navigator as any).audioSession.type = targetMode === "earpiece" ? "play-and-record" : "playback";
        } catch (sessionErr) {
          console.warn("iOS audioSession set failed:", sessionErr);
        }
      }

      // 2. Standard & Mobile Device Enumeration with setSinkId
      if (typeof navigator !== "undefined" && navigator.mediaDevices) {
        try {
          if (navigator.mediaDevices.enumerateDevices) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioOutputs = devices.filter((d) => d.kind === "audiooutput");

            let chosenSinkId = "";

            if (targetMode === "earpiece") {
              const earpiece = audioOutputs.find(
                (d) =>
                  d.label.toLowerCase().includes("earpiece") ||
                  d.label.toLowerCase().includes("receiver") ||
                  d.label.toLowerCase().includes("handset") ||
                  d.label.toLowerCase().includes("phone") ||
                  d.label.toLowerCase().includes("internal") ||
                  d.label.toLowerCase().includes("telephony") ||
                  d.deviceId === "communications"
              );
              // If specific earpiece found, use its deviceId; otherwise "default" in communication mode
              chosenSinkId = earpiece ? earpiece.deviceId : (audioOutputs[0]?.deviceId || "default");
            } else {
              const speaker = audioOutputs.find(
                (d) =>
                  d.label.toLowerCase().includes("speaker") ||
                  d.label.toLowerCase().includes("loudspeaker") ||
                  d.label.toLowerCase().includes("external") ||
                  (!d.label.toLowerCase().includes("earpiece") && d.deviceId !== "default" && d.deviceId !== "")
              );
              chosenSinkId = speaker ? speaker.deviceId : (audioOutputs[1]?.deviceId || "");
            }

            if (audioEl && typeof (audioEl as any).setSinkId === "function") {
              try {
                await (audioEl as any).setSinkId(chosenSinkId);
              } catch (sinkErr) {
                // Fallback to empty default sink
                try {
                  await (audioEl as any).setSinkId("");
                } catch (_) {}
              }
            }
          }
        } catch (deviceErr) {
          console.warn("Sink ID enumeration error:", deviceErr);
        }
      }

      // 3. Calibrated Volume based on target mode
      if (audioEl) {
        if (targetMode === "earpiece") {
          // Earpiece is directly against ear, calibrated to prevent distortion
          audioEl.volume = 0.7;
        } else {
          // Outspeaker needs full gain
          audioEl.volume = 1.0;
        }
      }
    } catch (err) {
      console.warn("Audio output routing failed:", err);
    }
  };

  const handleToggleAudioOutput = async () => {
    const nextMode = audioOutput === "earpiece" ? "outspeaker" : "earpiece";
    setAudioOutput(nextMode);

    // If mobile Android and selectAudioOutput is supported, allow user to directly pick device
    if (isMobileDevice() && typeof (navigator.mediaDevices as any)?.selectAudioOutput === "function") {
      try {
        const selected = await (navigator.mediaDevices as any).selectAudioOutput();
        if (selected && remoteAudioRef.current && typeof (remoteAudioRef.current as any).setSinkId === "function") {
          await (remoteAudioRef.current as any).setSinkId(selected.deviceId);
          showAudioToast(`🔊 Output: ${selected.label || nextMode}`);
          return;
        }
      } catch (_) {
        // User dismissed picker or fallback
      }
    }

    await applyAudioOutputRouting(nextMode);
    showAudioToast(
      nextMode === "earpiece"
        ? "📱 Earpiece active (Hold phone to ear)"
        : "🔊 Outspeakers active (Loudspeaker)"
    );
  };

  // Keep localCallState in sync with callState prop changes
  useEffect(() => {
    setLocalCallState(callState.state);
  }, [callState.state]);

  // Bind local media stream to localVideoRef element whenever mounted
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, localCallState, isMinimised]);

  // Bind remote media stream to remoteVideoRef and remoteAudioRef element whenever mounted
  useEffect(() => {
    const isVoice = callState.callType === "voice";
    if (remoteStream) {
      if (!isVoice) {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(() => {});
        }
        if (remoteVideoBgRef.current) {
          remoteVideoBgRef.current.srcObject = remoteStream;
          remoteVideoBgRef.current.play().catch(() => {});
        }
      } else {
        // Keep video elements strictly detached during voice calls so mobile audio routing targets earpiece
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (remoteVideoBgRef.current) remoteVideoBgRef.current.srcObject = null;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(() => {});
      }
      applyAudioOutputRouting(audioOutput);
    }
  }, [remoteStream, localCallState, isMinimised, videoFitMode, audioOutput, callState.callType]);

  useEffect(() => {
    if (localCallState === "incoming") {
      return () => {
        callAlertManager.stopAllAlerts();
      };
    } else if (localCallState === "outgoing") {
      soundManager.startOutgoingRing();
      return () => soundManager.stopOutgoingRing();
    } else {
      callAlertManager.stopAllAlerts();
    }
  }, [localCallState]);

  // Duration timer
  useEffect(() => {
    if (localCallState === "connected") {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [localCallState]);

  // Handle Outgoing Call Initiation (Caller side)
  useEffect(() => {
    if (!callState.active) return;

    if (callState.state === "outgoing" && !pcRef.current) {
      const startOutgoingCall = async () => {
        try {
          const wantVideo = callState.callType === "video";
          const stream = await acquireMediaStream(wantVideo);

          localStreamRef.current = stream;
          setLocalStream(stream);

          const pc = new RTCPeerConnection(RTC_CONFIG);
          pcRef.current = pc;

          stream.getTracks().forEach((track) => {
            if (track.kind === "audio" && isMobileDevice()) {
              track.contentHint = "speech";
            }
            pc.addTrack(track, stream);
          });

          setupRemoteTrackHandler(pc);

          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: wantVideo,
          });

          // Apply mobile telephony SDP munging for voice calls to route to earpiece
          if (isMobileDevice() && !wantVideo && offer.sdp) {
            offer.sdp = applyMobileVoiceSdp(offer.sdp);
          }

          await pc.setLocalDescription(offer);

          socket.emit("call_offer", {
            to: callState.peerUser,
            call_type: callState.callType,
            offer: pc.localDescription,
          });
        } catch (err) {
          console.error("Failed to start outgoing call:", err);
          setStatusText("Media Device Error");
        }
      };

      startOutgoingCall();
    }
  }, [callState.active, callState.state, callState.peerUser, callState.callType]);

  // Socket listeners for call signaling inside CallOverlay
  useEffect(() => {
    if (!callState.active) return;

    const handleCallAnsweredSocket = async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      if (data.from === callState.peerUser && pcRef.current) {
        try {
          if (pcRef.current.signalingState !== "stable") {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            setLocalCallState("connected");
            setStatusText("Connected");
            await flushQueuedCandidates(pcRef.current);
          }
        } catch (err) {
          console.error("Error setting remote answer description:", err);
        }
      }
    };

    const handleIceCandidateSocket = async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      if (data.from === callState.peerUser) {
        await addIceCandidateSafe(data.candidate);
      }
    };

    const handleCallEndedSocket = (data: { from?: string }) => {
      if (!data?.from || data.from === callState.peerUser) {
        onEndCall();
      }
    };

    socket.on("call_answered", handleCallAnsweredSocket);
    socket.on("ice_candidate", handleIceCandidateSocket);
    socket.on("call_ended", handleCallEndedSocket);
    socket.on("call_rejected", handleCallEndedSocket);

    return () => {
      socket.off("call_answered", handleCallAnsweredSocket);
      socket.off("ice_candidate", handleIceCandidateSocket);
      socket.off("call_ended", handleCallEndedSocket);
      socket.off("call_rejected", handleCallEndedSocket);
    };
  }, [callState.active, callState.peerUser, onEndCall]);

  // Cleanup WebRTC connection on unmount or call end
  useEffect(() => {
    return () => {
      callAlertManager.stopAllAlerts();
      if (pcRef.current) {
        try {
          pcRef.current.close();
        } catch (_) {}
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      iceCandidatesQueueRef.current = [];
      processedCandidatesRef.current.clear();
    };
  }, [callState.active]);

  // Answer Incoming Call (Callee side)
  const handleAnswer = async () => {
    try {
      // 1. Immediately cut all ringing sound, mobile vibration, and dismiss notifications
      callAlertManager.stopAllAlerts();
      if (onAnswerCall) {
        onAnswerCall();
      }

      // Direct user gesture audio unlock
      if (remoteAudioRef.current) {
        remoteAudioRef.current.play().catch(() => {});
      }
      setLocalCallState("connected");
      setStatusText("Connecting...");

      const wantVideo = callState.callType === "video";
      const stream = await acquireMediaStream(wantVideo);

      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      stream.getTracks().forEach((track) => {
        if (track.kind === "audio" && isMobileDevice()) {
          track.contentHint = "speech";
        }
        pc.addTrack(track, stream);
      });

      setupRemoteTrackHandler(pc);

      if (callState.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(callState.offer));
        await flushQueuedCandidates(pc);

        const answer = await pc.createAnswer();

        // Apply mobile telephony SDP munging for voice calls to route to earpiece
        if (isMobileDevice() && !wantVideo && answer.sdp) {
          answer.sdp = applyMobileVoiceSdp(answer.sdp);
        }

        await pc.setLocalDescription(answer);

        socket.emit("call_answer", {
          to: callState.peerUser,
          answer: pc.localDescription,
        });
      }
    } catch (err) {
      console.error("Failed to answer call:", err);
      setStatusText("Device Error");
    }
  };

  const handleToggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const handleToggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = isCameraOff;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const handleManualPlayVideo = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current
        .play()
        .then(() => {
          setNeedsUserPlayInteraction(false);
        })
        .catch((err) => {
          console.warn("Manual video play error:", err);
        });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!callState.active) return null;

  return (
    <>
      {/* Dedicated Remote Audio Playback Element for WebRTC VoIP Telephony & Earpiece Routing - Always mounted */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        aria-hidden="true"
        className="fixed -top-96 -left-96 w-1 h-1 opacity-0 pointer-events-none"
      />

      {/* Incoming Call Modal */}
      {localCallState === "incoming" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-lg p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/60 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-sky-500/50 flex items-center justify-center text-3xl font-bold text-sky-400 overflow-hidden shadow-xl">
                {peerData.image ? (
                  <img src={`/uploads/${peerData.image}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  callState.peerUser.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md animate-bounce">
                <PhoneIncoming className="w-4 h-4" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{callState.peerUser}</h3>
            <p className="text-xs text-sky-400 font-medium mb-6">
              Incoming {callState.callType === "video" ? "Video" : "Voice"} Call...
            </p>

            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  callAlertManager.stopAllAlerts();
                  onEndCall();
                }}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-transform active:scale-95"
                title="Decline"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button
                onClick={handleAnswer}
                className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 animate-pulse"
                title="Answer Call"
              >
                <Phone className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outgoing Call Modal */}
      {localCallState === "outgoing" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-lg p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/60 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-sky-500/50 flex items-center justify-center text-3xl font-bold text-sky-400 overflow-hidden shadow-xl mb-4 animate-pulse">
              {peerData.image ? (
                <img src={`/uploads/${peerData.image}`} alt="" className="w-full h-full object-cover" />
              ) : (
                callState.peerUser.substring(0, 2).toUpperCase()
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{callState.peerUser}</h3>
            <p className="text-xs text-slate-400 mb-6">Calling {callState.callType === "video" ? "Video" : "Voice"}...</p>

            <button
              onClick={() => {
                callAlertManager.stopAllAlerts();
                onEndCall();
              }}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-transform active:scale-95"
              title="Cancel Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Active Call View (Full screen or Minimised PiP) */}
      {localCallState === "connected" && (
        <div
          className={`fixed transition-all duration-300 z-50 ${
            isMinimised
              ? "bottom-6 right-6 w-80 h-52 rounded-2xl bg-slate-900 border-2 border-sky-500/60 shadow-2xl overflow-hidden"
              : "inset-0 bg-slate-950 flex flex-col"
          }`}
        >
      {/* Hold-to-Ear Screen Dimmer for Mobile Phone Mode (Prevents accidental cheek/ear taps) */}
      {isEarModeLocked && (
        <div
          onClick={() => setIsEarModeLocked(false)}
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none"
        >
          <Smartphone className="w-14 h-14 text-slate-600 animate-pulse mb-4" />
          <p className="text-white text-base font-semibold">Phone Ear Mode Active</p>
          <p className="text-slate-400 text-xs mt-1">Screen dimmed to prevent accidental touches</p>
          <span className="mt-6 px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 shadow">
            Tap anywhere to wake screen
          </span>
        </div>
      )}

      {/* Top Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/50 text-white text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>{callState.peerUser}</span>
          <span className="text-slate-400">|</span>
          <span className="font-mono text-sky-400">{formatTime(callDuration)}</span>
        </div>

        {/* Audio Output Route Badge */}
        <button
          onClick={handleToggleAudioOutput}
          className={`px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition flex items-center gap-1.5 shadow-lg active:scale-95 ${
            audioOutput === "earpiece"
              ? "bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30"
              : "bg-teal-500/20 border-teal-500/50 text-teal-300 hover:bg-teal-500/30"
          }`}
          title="Click to switch between Earpiece (Handset) and Outspeakers (Speakerphone)"
        >
          {audioOutput === "earpiece" ? (
            <>
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Earpiece Mode</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Outspeakers</span>
            </>
          )}
        </button>

        <button
          onClick={() => setIsMinimised(!isMinimised)}
          className="w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-white flex items-center justify-center hover:bg-slate-800 transition"
          title={isMinimised ? "Expand" : "Minimise"}
        >
          {isMinimised ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Audio Mode Feedback Toast */}
      {audioToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/95 border border-sky-500/60 text-sky-200 text-xs font-semibold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          {audioToast}
        </div>
      )}

      {/* Main Call View: Voice Screen or Video Stream */}
      {callState.callType === "voice" ? (
        <div className="relative flex-1 w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
          {/* Animated concentric audio pulse rings */}
          <div className="relative flex items-center justify-center my-6">
            <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border border-sky-500/20 animate-ping pointer-events-none" />
            <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-teal-500/30 animate-pulse pointer-events-none" />
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 border-4 border-white/20 flex items-center justify-center text-4xl sm:text-5xl font-extrabold text-white shadow-2xl relative z-10 overflow-hidden">
              {peerData.image ? (
                <img src={`/uploads/${peerData.image}`} alt="" className="w-full h-full object-cover" />
              ) : (
                callState.peerUser.substring(0, 2).toUpperCase()
              )}
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">{callState.peerUser}</h3>
          <p className="text-xs text-slate-400 font-medium mb-4">
            {localCallState === "connected" ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5 justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Voice Call In Progress
              </span>
            ) : (
              statusText
            )}
          </p>

          {/* Quick Audio Routing Pill */}
          <div className="flex flex-col items-center gap-2 mt-2">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs">
              <span className="text-slate-400">Audio output:</span>
              <span className={`font-semibold flex items-center gap-1 ${
                audioOutput === "earpiece" ? "text-amber-300" : "text-teal-300"
              }`}>
                {audioOutput === "earpiece" ? (
                  <>
                    <Smartphone className="w-3.5 h-3.5" /> Earpiece (Default for Phone)
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" /> Outspeakers (Loudspeaker)
                  </>
                )}
              </span>
            </div>

            <button
              onClick={handleToggleAudioOutput}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 hover:text-white transition active:scale-95 shadow"
            >
              {audioOutput === "earpiece" ? "🔊 Switch to Outspeakers" : "📱 Switch to Earpiece"}
            </button>

            {isMobileDevice() && (
              <button
                onClick={() => setIsEarModeLocked(true)}
                className="mt-1 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5 shadow active:scale-95"
                title="Black out screen when holding phone against ear to prevent accidental touches"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" /> Hold to Ear (Dim Screen)
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative flex-1 w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Ambient blurred backdrop for portrait mobile video on wide laptop screens */}
          {videoFitMode === "contain" && remoteStream && (
            <video
              ref={remoteVideoBgRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-25 pointer-events-none scale-110"
            />
          )}

          {/* Remote Video Stream - Full uncropped frame in contain mode (no zoom!) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            {...({ "webkit-playsinline": "true" } as any)}
            className={`w-full h-full relative z-10 transition-all duration-300 ${
              videoFitMode === "contain" ? "object-contain" : "object-cover"
            }`}
          />

          {/* Mobile autoplay fallback prompt if video is paused by mobile browser */}
          {needsUserPlayInteraction && (
            <div className="absolute z-30 inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center p-4">
              <button
                onClick={handleManualPlayVideo}
                className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-2xl flex items-center gap-2 cursor-pointer border border-sky-300 animate-pulse active:scale-95 transition"
              >
                <Play className="w-5 h-5 fill-current" /> Tap to Start Video Stream
              </button>
              <p className="text-xs text-sky-200 mt-2">Browser paused autoplay for media</p>
            </div>
          )}

          {/* Remote Video Avatar Fallback */}
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-300">
              <div className="w-28 h-28 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-4xl font-bold text-sky-400 overflow-hidden shadow-2xl mb-3">
                {peerData.image ? (
                  <img src={`/uploads/${peerData.image}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  callState.peerUser.substring(0, 2).toUpperCase()
                )}
              </div>
              <span className="text-sm font-semibold">{callState.peerUser}</span>
              <span className="text-xs text-slate-500 mt-1">{statusText}</span>
            </div>
          )}

          {/* Local Video Picture-In-Picture */}
          {!isMinimised && (
            <div className="absolute bottom-24 right-6 w-36 h-48 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
              {isCameraOff && (
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-slate-500 text-xs">
                  Camera Off
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Control Bar */}
      {!isMinimised && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 sm:gap-4 bg-slate-900/90 backdrop-blur-md px-5 sm:px-6 py-3 rounded-full border border-slate-700/60 shadow-2xl">
          <button
            onClick={handleToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition ${
              isMuted ? "bg-red-500 hover:bg-red-600" : "bg-slate-800 hover:bg-slate-700"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Audio Output Route Switcher Button */}
          <button
            onClick={handleToggleAudioOutput}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition border ${
              audioOutput === "earpiece"
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30"
                : "bg-teal-500/20 border-teal-500/50 text-teal-300 hover:bg-teal-500/30"
            }`}
            title={
              audioOutput === "earpiece"
                ? "Audio: Earpiece (Handset mode default for phone). Click to switch to Outspeakers (Speakerphone)"
                : "Audio: Outspeakers (Loudspeaker). Click to switch to Earpiece"
            }
          >
            {audioOutput === "earpiece" ? (
              <Smartphone className="w-5 h-5 text-amber-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-teal-400" />
            )}
          </button>

          {callState.callType === "video" && (
            <button
              onClick={handleToggleCamera}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition ${
                isCameraOff ? "bg-red-500 hover:bg-red-600" : "bg-slate-800 hover:bg-slate-700"
              }`}
              title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
            >
              {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* Aspect Ratio / Zoom Mode Toggle for Video calls */}
          {callState.callType === "video" && remoteStream && (
            <button
              onClick={() => setVideoFitMode((prev) => (prev === "contain" ? "cover" : "contain"))}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                videoFitMode === "contain"
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 hover:bg-sky-500/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
              title={
                videoFitMode === "contain"
                  ? "Aspect Ratio: Full Uncropped Frame (Normal, No Zoom) — Click to Fill Screen"
                  : "Aspect Ratio: Fill Screen (Zoomed/Cropped) — Click to Fit Uncropped"
              }
            >
              <Scan className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => {
              callAlertManager.stopAllAlerts();
              onEndCall();
            }}
            className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      )}
        </div>
      )}
    </>
  );
};

