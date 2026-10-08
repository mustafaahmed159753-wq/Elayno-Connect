import React, { useEffect, useRef, useState } from "react";
import { socket } from "../lib/socket";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Copy,
  Check,
  Users,
  Share2,
  Hand,
  Maximize2,
  Minimize2,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  Crown,
  VolumeX,
  LogOut,
  AlertTriangle,
} from "lucide-react";

interface Participant {
  username: string;
  socketId: string;
  cameraOn: boolean;
  micOn: boolean;
  handRaised: boolean;
}

interface Props {
  meetingId: string;
  currentUser: string;
  meetingTitle?: string;
  onClose: () => void;
  onSendLinkToChat?: (linkMsg: string) => void;
}

const RemoteParticipantVideo = React.memo<{
  stream?: MediaStream;
  cameraOn: boolean;
  micOn?: boolean;
  username: string;
}>(({ stream, cameraOn, micOn = true, username }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.log("Remote video/audio play error:", err);
      });
    }
  }, [stream]);

  return (
    <div className="w-full h-full rounded-xl bg-slate-800 flex items-center justify-center relative overflow-hidden">
      {/* Video element always mounted so audio track plays even if camera is off */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover rounded-xl ${cameraOn && stream ? "block" : "hidden"}`}
      />

      {/* Camera Off or Connecting State */}
      {(!cameraOn || !stream) && (
        <div className="w-full h-full bg-slate-900/95 flex flex-col items-center justify-center gap-2 p-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500/20 to-sky-500/20 border-2 border-teal-500/40 flex items-center justify-center text-teal-300 font-extrabold text-xl shadow-lg">
              {username.charAt(0).toUpperCase()}
            </div>
            {micOn && (
              <span className="absolute -inset-1 rounded-full border-2 border-emerald-400/40 animate-ping pointer-events-none" />
            )}
          </div>
          <span className="text-xs text-slate-200 font-semibold">{username}</span>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
            {cameraOn ? "Connecting smooth feed..." : "Camera Off"}
          </span>
        </div>
      )}

      {/* Mic status badge */}
      <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1 z-10 text-[10px]">
        {micOn ? (
          <Mic className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <MicOff className="w-3.5 h-3.5 text-rose-400" />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
    </div>
  );
});

export const GroupMeetingModal: React.FC<Props> = ({
  meetingId,
  currentUser,
  meetingTitle = "Hospital Group Video Call",
  onClose,
  onSendLinkToChat,
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [meetingCreator, setMeetingCreator] = useState<string | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showParticipantsDrawer, setShowParticipantsDrawer] = useState(false);
  const [isMinimised, setIsMinimised] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  const isCreator = Boolean(
    (meetingCreator && meetingCreator.toLowerCase() === currentUser.toLowerCase()) ||
      currentUser === "Elite" ||
      currentUser === "admin" ||
      (!meetingCreator && participants.length > 0 && participants[0].username === currentUser)
  );

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const minimisedVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const pendingIceCandidatesRef = useRef<Record<string, RTCIceCandidateInit[]>>({});

  const meetingLink = `${window.location.origin}${window.location.pathname}?meeting=${meetingId}`;

  // Helper for self toast
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Host Action: Mute All Participants
  const handleMuteAll = () => {
    socket.emit("meeting_mute_all", {
      meetingId,
      requestedBy: currentUser,
    });
    // Mute self locally
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = false;
        setIsMicOn(false);
      }
    }
    socket.emit("meeting_state_change", {
      meetingId,
      username: currentUser,
      micOn: false,
    });
    showToast("🔇 Muted all participants' microphones");
  };

  // Host Action: End Call for Everyone
  const handleEndCallForEveryone = () => {
    socket.emit("meeting_end_for_all", {
      meetingId,
      requestedBy: currentUser,
    });
    showToast("🛑 Ending meeting for all participants...");
    setShowEndModal(false);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  // Helper to cap video sender bitrate to prevent freezing in group mesh
  const applyVideoBitrateLimits = (pc: RTCPeerConnection) => {
    try {
      pc.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === "video") {
          const params = sender.getParameters();
          if (!params.encodings || params.encodings.length === 0) {
            params.encodings = [{}];
          }
          // 350 kbps @ 24fps: ultra-smooth video grid without network congestion
          params.encodings[0].maxBitrate = 350000;
          params.encodings[0].maxFramerate = 24;
          params.degradationPreference = "maintain-framerate";
          sender.setParameters(params).catch(() => {});
        }
      });
    } catch (_) {}
  };

  // Attach local stream to video ref whenever available or toggled
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch((err) => {
        console.log("Local video play error:", err);
      });
    }
  }, [isCameraOn, isMinimised]);

  useEffect(() => {
    if (minimisedVideoRef.current && localStreamRef.current) {
      minimisedVideoRef.current.srcObject = localStreamRef.current;
      minimisedVideoRef.current.play().catch(() => {});
    }
  }, [isMinimised]);

  const createPeerConnection = (targetUser: string, isInitiator: boolean = false) => {
    if (peerConnectionsRef.current[targetUser]) {
      return peerConnectionsRef.current[targetUser];
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
      ],
    });
    peerConnectionsRef.current[targetUser] = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
      applyVideoBitrateLimits(pc);
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStreams((prev) => ({
          ...prev,
          [targetUser]: event.streams[0],
        }));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("meeting_signal", {
          meetingId,
          to: targetUser,
          from: currentUser,
          signal: { candidate: event.candidate },
          type: "candidate",
        });
      }
    };

    if (isInitiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          applyVideoBitrateLimits(pc);
          socket.emit("meeting_signal", {
            meetingId,
            to: targetUser,
            from: currentUser,
            signal: { sdp: pc.localDescription },
            type: "offer",
          });
        })
        .catch((err) => console.warn("Group meeting offer error:", err));
    }

    return pc;
  };

  // Setup Local Media Stream with Multi-Peer Optimized Constraints
  useEffect(() => {
    let isMounted = true;

    async function initMedia() {
      try {
        const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: {
            width: { ideal: isMobile ? 480 : 640, max: 854 },
            height: { ideal: isMobile ? 360 : 480, max: 480 },
            frameRate: { ideal: 24, max: 24 },
          },
        });

        const vTrack = stream.getVideoTracks()[0];
        if (vTrack) {
          (vTrack as any).contentHint = "motion";
        }

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }

        // Add tracks to any existing peer connections
        (Object.values(peerConnectionsRef.current) as RTCPeerConnection[]).forEach((pc) => {
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });
          applyVideoBitrateLimits(pc);
        });

        // Join socket meeting room
        socket.emit("meeting_join", {
          meetingId,
          username: currentUser,
          title: meetingTitle,
        });
      } catch (e) {
        console.warn("Could not get audio/video media, trying fallback or audio-only:", e);
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          if (isMounted) {
            localStreamRef.current = audioStream;
            setIsCameraOn(false);
            socket.emit("meeting_join", {
              meetingId,
              username: currentUser,
              title: meetingTitle,
            });
          }
        } catch (err) {
          showToast("⚠️ Camera/Microphone permissions required");
          socket.emit("meeting_join", {
            meetingId,
            username: currentUser,
            title: meetingTitle,
          });
        }
      }
    }

    initMedia();

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      socket.emit("meeting_leave", { meetingId, username: currentUser });
    };
  }, [meetingId, currentUser]);

  // Socket event listeners for group meeting
  useEffect(() => {
    const handleParticipants = (data: {
      meetingId: string;
      participants: Participant[];
      creator?: string;
    }) => {
      if (data.meetingId === meetingId) {
        if (data.creator) setMeetingCreator(data.creator);
        setParticipants(data.participants);
        data.participants.forEach((p) => {
          if (p.username !== currentUser) {
            const shouldInitiate = currentUser.localeCompare(p.username) > 0;
            createPeerConnection(p.username, shouldInitiate);
          }
        });
      }
    };

    const handleUserJoined = (data: {
      meetingId: string;
      user: Participant;
      participants: Participant[];
      creator?: string;
    }) => {
      if (data.meetingId === meetingId) {
        if (data.creator) setMeetingCreator(data.creator);
        setParticipants(data.participants);
        showToast(`👋 ${data.user.username} joined the meeting`);
        if (data.user.username !== currentUser) {
          const shouldInitiate = currentUser.localeCompare(data.user.username) > 0;
          createPeerConnection(data.user.username, shouldInitiate);
        }
      }
    };

    const handleUserLeft = (data: {
      meetingId: string;
      username: string;
      participants: Participant[];
      creator?: string;
    }) => {
      if (data.meetingId === meetingId) {
        if (data.creator) setMeetingCreator(data.creator);
        setParticipants(data.participants);
        showToast(`🚪 ${data.username} left the meeting`);
        if (peerConnectionsRef.current[data.username]) {
          peerConnectionsRef.current[data.username].close();
          delete peerConnectionsRef.current[data.username];
        }
        delete pendingIceCandidatesRef.current[data.username];
        setRemoteStreams((prev) => {
          const copy = { ...prev };
          delete copy[data.username];
          return copy;
        });
      }
    };

    const handleStateUpdated = (data: {
      meetingId: string;
      participants: Participant[];
      creator?: string;
    }) => {
      if (data.meetingId === meetingId) {
        if (data.creator) setMeetingCreator(data.creator);
        setParticipants(data.participants);
      }
    };

    const handleMuteAllReceived = (data: {
      meetingId: string;
      requestedBy: string;
      participants?: Participant[];
    }) => {
      if (data.meetingId === meetingId) {
        if (localStreamRef.current) {
          const audioTrack = localStreamRef.current.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = false;
          }
        }
        setIsMicOn(false);
        if (data.participants) {
          setParticipants(data.participants);
        }
        showToast(`🔇 All microphones were muted by meeting host (${data.requestedBy})`);
      }
    };

    const handleMeetingEndedByHost = (data: {
      meetingId: string;
      requestedBy: string;
    }) => {
      if (data.meetingId === meetingId) {
        showToast(`🛑 Meeting ended for everyone by host (${data.requestedBy})`);
        setTimeout(() => {
          onClose();
        }, 900);
      }
    };

    const handleMeetingSignal = async (data: {
      meetingId: string;
      from: string;
      signal: any;
      type: string;
    }) => {
      if (data.meetingId !== meetingId || data.from === currentUser) return;

      const pc = createPeerConnection(data.from, false);

      try {
        if (data.type === "offer" && data.signal?.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
          applyVideoBitrateLimits(pc);

          // Flush queued candidates
          const queued = pendingIceCandidatesRef.current[data.from] || [];
          while (queued.length > 0) {
            const cand = queued.shift();
            if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("meeting_signal", {
            meetingId,
            to: data.from,
            from: currentUser,
            signal: { sdp: answer },
            type: "answer",
          });
        } else if (data.type === "answer" && data.signal?.sdp) {
          if (pc.signalingState !== "stable") {
            await pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
            applyVideoBitrateLimits(pc);

            // Flush queued candidates
            const queued = pendingIceCandidatesRef.current[data.from] || [];
            while (queued.length > 0) {
              const cand = queued.shift();
              if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
          }
        } else if (data.type === "candidate" && data.signal?.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate)).catch(() => {});
          } else {
            if (!pendingIceCandidatesRef.current[data.from]) {
              pendingIceCandidatesRef.current[data.from] = [];
            }
            pendingIceCandidatesRef.current[data.from].push(data.signal.candidate);
          }
        }
      } catch (err) {
        console.warn("Meeting signal processing error:", err);
      }
    };

    socket.on("meeting_participants", handleParticipants);
    socket.on("meeting_user_joined", handleUserJoined);
    socket.on("meeting_user_left", handleUserLeft);
    socket.on("meeting_state_updated", handleStateUpdated);
    socket.on("meeting_mute_all", handleMuteAllReceived);
    socket.on("meeting_ended_by_host", handleMeetingEndedByHost);
    socket.on("meeting_signal", handleMeetingSignal);

    return () => {
      socket.off("meeting_participants", handleParticipants);
      socket.off("meeting_user_joined", handleUserJoined);
      socket.off("meeting_user_left", handleUserLeft);
      socket.off("meeting_state_updated", handleStateUpdated);
      socket.off("meeting_mute_all", handleMuteAllReceived);
      socket.off("meeting_ended_by_host", handleMeetingEndedByHost);
      socket.off("meeting_signal", handleMeetingSignal);

      (Object.values(peerConnectionsRef.current) as RTCPeerConnection[]).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      pendingIceCandidatesRef.current = {};
    };
  }, [meetingId]);

  // Toggle Camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const nextState = !isCameraOn;
        videoTrack.enabled = nextState;
        setIsCameraOn(nextState);
        socket.emit("meeting_state_change", {
          meetingId,
          username: currentUser,
          cameraOn: nextState,
        });
      } else if (!isCameraOn) {
        // Try requesting video track again
        navigator.mediaDevices.getUserMedia({ video: true }).then((vStream) => {
          const track = vStream.getVideoTracks()[0];
          if (track && localStreamRef.current) {
            localStreamRef.current.addTrack(track);
            if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
            setIsCameraOn(true);
            socket.emit("meeting_state_change", {
              meetingId,
              username: currentUser,
              cameraOn: true,
            });
          }
        });
      }
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const nextState = !isMicOn;
        audioTrack.enabled = nextState;
        setIsMicOn(nextState);
        socket.emit("meeting_state_change", {
          meetingId,
          username: currentUser,
          micOn: nextState,
        });
      }
    }
  };

  // Toggle Hand Raise
  const toggleHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    socket.emit("meeting_state_change", {
      meetingId,
      username: currentUser,
      handRaised: nextState,
    });
    if (nextState) showToast("✋ You raised your hand");
  };

  // Copy Meeting Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopiedLink(true);
    showToast("✓ Meeting link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Share to Chat
  const handleShareToChat = () => {
    if (onSendLinkToChat) {
      const msg = `📹 **Join Group Meeting**: [${meetingTitle}](${meetingLink})\nMeeting Code: \`${meetingId}\``;
      onSendLinkToChat(msg);
      showToast("✓ Meeting link sent to chat!");
    }
  };

  // Calculate grid layout columns based on participant count
  const allParticipants = participants.length > 0 ? participants : [{ username: currentUser, socketId: "local", cameraOn: isCameraOn, micOn: isMicOn, handRaised: isHandRaised }];
  const count = allParticipants.length;

  useEffect(() => {
    if (isMinimised && localStreamRef.current && minimisedVideoRef.current) {
      minimisedVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [isMinimised]);

  if (isMinimised) {
    return (
      <div className="fixed bottom-6 right-6 z-[160] w-80 sm:w-96 bg-slate-900/95 border-2 border-teal-500/80 rounded-3xl p-3.5 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-2xl text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <h3 className="font-bold text-xs text-white truncate">{meetingTitle}</h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsMinimised(false)}
              className="p-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 font-bold transition"
              title="Expand to Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-bold transition"
              title="Leave Meeting"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video Preview Box */}
        <div className="relative w-full h-36 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
          {isCameraOn ? (
            <video
              ref={minimisedVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-300 font-bold text-base flex items-center justify-center border border-teal-500/40">
                {currentUser.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">{currentUser} (You)</span>
            </div>
          )}

          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-slate-950/80 border border-white/10 text-[10px] font-semibold text-slate-200">
            👥 {allParticipants.length} Connected
          </div>
        </div>

        {/* Quick Mini Toolbar */}
        <div className="flex items-center justify-around pt-1">
          <button
            onClick={toggleMic}
            className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              isMicOn
                ? "bg-slate-800 border-slate-700 text-slate-200"
                : "bg-red-500/20 border-red-500/40 text-red-400"
            }`}
          >
            {isMicOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>{isMicOn ? "Muted" : "Unmute"}</span>
          </button>

          <button
            onClick={toggleCamera}
            className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              isCameraOn
                ? "bg-slate-800 border-slate-700 text-slate-200"
                : "bg-red-500/20 border-red-500/40 text-red-400"
            }`}
          >
            {isCameraOn ? <Video className="w-3.5 h-3.5 text-sky-400" /> : <VideoOff className="w-3.5 h-3.5" />}
            <span>Cam</span>
          </button>

          <button
            onClick={() => setIsMinimised(false)}
            className="px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition flex items-center gap-1 shadow-md"
          >
            <span>Expand</span>
          </button>
        </div>
      </div>
    );
  }

  let gridCols = "grid-cols-1";
  if (count === 2) gridCols = "grid-cols-1 sm:grid-cols-2";
  else if (count >= 3 && count <= 4) gridCols = "grid-cols-2";
  else if (count >= 5 && count <= 6) gridCols = "grid-cols-2 md:grid-cols-3";
  else if (count > 6) gridCols = "grid-cols-3 md:grid-cols-4";

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950 text-white flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="h-16 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 text-slate-950 shadow-md shrink-0">
            <Video className="w-5 h-5 font-bold" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-slate-100 truncate">{meetingTitle}</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live
              </span>
              {isCreator && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-[10px] shrink-0 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" /> Host
                </span>
              )}
              <span className="hidden md:flex px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-medium text-[10px] shrink-0 items-center gap-1" title="Bitrate and frames optimized for fast multi-user smoothness">
                <Sparkles className="w-3 h-3 text-teal-400" /> Smooth Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
              Code: <code className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-sky-400 font-mono text-[10px]">{meetingId}</code>
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isCreator && (
            <button
              onClick={handleMuteAll}
              className="hidden lg:flex px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition items-center gap-1.5 shadow-sm"
              title="Host: Mute all participant microphones"
            >
              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
              <span>Mute All</span>
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
            title="Copy Meeting Link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
            <span className="hidden sm:inline">{copiedLink ? "Copied!" : "Copy Link"}</span>
          </button>

          {onSendLinkToChat && (
            <button
              onClick={handleShareToChat}
              className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-semibold transition flex items-center gap-1.5"
              title="Share Link to Active Chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share in Chat</span>
            </button>
          )}

          <button
            onClick={() => setShowParticipantsDrawer(!showParticipantsDrawer)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
              showParticipantsDrawer
                ? "bg-teal-500/20 border-teal-500/50 text-teal-300"
                : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{allParticipants.length}</span>
          </button>

          <button
            onClick={() => setIsMinimised(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
            title="Minimize to Picture-in-Picture window"
          >
            <Minimize2 className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Minimize</span>
          </button>
        </div>
      </div>

      {/* Main Video Stage & Optional Drawer */}
      <div className="flex-1 relative flex overflow-hidden p-3 sm:p-4 bg-slate-950">
        {/* Toast Banner */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/95 border border-teal-500/50 text-teal-200 text-xs font-semibold shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
            {toastMsg}
          </div>
        )}

        {/* Video Tiles Grid */}
        <div className={`flex-1 grid ${gridCols} gap-3 sm:gap-4 h-full auto-rows-fr items-center justify-center`}>
          {allParticipants.map((p) => {
            const isSelf = p.username === currentUser;
            const isParticipantHost =
              (meetingCreator && p.username.toLowerCase() === meetingCreator.toLowerCase()) ||
              (!meetingCreator && p.username === (participants[0]?.username || currentUser));

            return (
              <div
                key={p.username}
                className="relative w-full h-full min-h-[160px] bg-slate-900/90 rounded-2xl border border-slate-800/90 overflow-hidden flex flex-col justify-between p-3 shadow-xl transition group"
              >
                {/* Hand Raised Banner */}
                {p.handRaised && (
                  <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-lg animate-bounce">
                    <Hand className="w-3.5 h-3.5 fill-slate-950" /> Hand Raised
                  </div>
                )}

                {/* Host Badge */}
                {isParticipantHost && !p.handRaised && (
                  <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-amber-500/30 border border-amber-500/60 text-amber-300 font-bold text-[10px] flex items-center gap-1 backdrop-blur-md shadow-md">
                    <Crown className="w-3 h-3 text-amber-400" /> Host
                  </div>
                )}

                {/* Video Feed / Avatar Placeholder */}
                {isSelf ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover rounded-xl ${!isCameraOn ? "hidden" : "block"}`}
                  />
                ) : (
                  <RemoteParticipantVideo
                    stream={remoteStreams[p.username]}
                    cameraOn={p.cameraOn}
                    micOn={p.micOn}
                    username={p.username}
                  />
                )}

                {/* Avatar for Self when Camera is Off */}
                {isSelf && !isCameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-2xl border-2 border-white/20">
                      {p.username.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="mt-3 font-semibold text-xs text-slate-300">
                      {p.username} (You)
                    </span>
                  </div>
                )}

                {/* Bottom Overlay Info Tag */}
                <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
                  <div className="px-2.5 py-1 rounded-xl bg-slate-950/80 border border-white/10 text-slate-100 font-semibold text-xs flex items-center gap-2 backdrop-blur-md">
                    <span>{p.username} {isSelf ? "(You)" : ""}</span>
                    {isParticipantHost && (
                      <span className="text-[10px] text-amber-400 font-bold">👑 Host</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div
                      className={`p-1.5 rounded-lg border text-xs backdrop-blur-md ${
                        p.micOn
                          ? "bg-slate-950/80 border-white/10 text-emerald-400"
                          : "bg-red-500/30 border-red-500/50 text-red-300"
                      }`}
                    >
                      {p.micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Participants Side Drawer */}
        {showParticipantsDrawer && (
          <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 shrink-0 flex flex-col justify-between z-30 animate-in slide-in-from-right duration-200">
            <div className="overflow-y-auto max-h-[85vh] pr-1 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-400" /> Participants ({allParticipants.length})
                </h3>
                <button
                  onClick={() => setShowParticipantsDrawer(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition"
                >
                  ✕
                </button>
              </div>

              {/* Host Control Panel in Drawer */}
              {isCreator && (
                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-rose-500/10 border border-amber-500/30 shadow-md space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-200">Host Meeting Controls</h4>
                      <p className="text-[10px] text-slate-400">Order management for hospital sync</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <button
                      onClick={handleMuteAll}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                      title="Mute microphones for all participants"
                    >
                      <VolumeX className="w-4 h-4 text-amber-400" />
                      <span>Mute All Participants</span>
                    </button>

                    <button
                      onClick={() => setShowEndModal(true)}
                      className="w-full py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                      title="End meeting for everyone"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>End Call for Everyone</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Staff Members in Call
                </p>
                {allParticipants.map((p) => {
                  const isParticipantHost =
                    (meetingCreator && p.username.toLowerCase() === meetingCreator.toLowerCase()) ||
                    (!meetingCreator && p.username === (participants[0]?.username || currentUser));

                  return (
                    <div
                      key={p.username}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {p.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-200 truncate block">
                            {p.username} {p.username === currentUser ? "(You)" : ""}
                          </span>
                          {isParticipantHost && (
                            <span className="text-[9px] font-bold text-amber-400 flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5 inline" /> Meeting Host
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-400">
                        {p.handRaised && <Hand className="w-3.5 h-3.5 text-amber-400 animate-bounce" />}
                        {p.micOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
                        {p.cameraOn ? <Video className="w-3.5 h-3.5 text-sky-400" /> : <VideoOff className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2 shrink-0">
              <button
                onClick={handleCopyLink}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4 text-sky-400" /> Copy Shareable Link
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Controls Toolbar */}
      <div className="h-20 bg-slate-900/90 border-t border-slate-800 px-4 flex items-center justify-center gap-3 sm:gap-4 shrink-0 backdrop-blur-xl z-20">
        {/* Toggle Mic */}
        <button
          onClick={toggleMic}
          className={`p-3.5 sm:p-4 rounded-2xl border transition shadow-lg flex items-center justify-center ${
            isMicOn
              ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100"
              : "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
          }`}
          title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
        >
          {isMicOn ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        {/* Toggle Camera */}
        <button
          onClick={toggleCamera}
          className={`p-3.5 sm:p-4 rounded-2xl border transition shadow-lg flex items-center justify-center ${
            isCameraOn
              ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100"
              : "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
          }`}
          title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
        >
          {isCameraOn ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        {/* Host Control: Mute All Button */}
        {isCreator && (
          <button
            onClick={handleMuteAll}
            className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 transition shadow-lg flex items-center justify-center gap-1.5 group active:scale-95"
            title="Host Control: Mute All Participants"
          >
            <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden lg:inline text-xs font-bold text-amber-200">Mute All</span>
          </button>
        )}

        {/* Raise Hand */}
        <button
          onClick={toggleHand}
          className={`p-3.5 sm:p-4 rounded-2xl border transition shadow-lg flex items-center justify-center ${
            isHandRaised
              ? "bg-amber-500 border-amber-400 text-slate-950 font-bold"
              : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
          }`}
          title="Raise / Lower Hand"
        >
          <Hand className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Copy Meeting Link */}
        <button
          onClick={handleCopyLink}
          className="p-3.5 sm:p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition shadow-lg flex items-center justify-center"
          title="Copy Meeting Link"
        >
          <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
        </button>

        {/* End / Leave Meeting */}
        <button
          onClick={() => {
            if (isCreator) {
              setShowEndModal(true);
            } else {
              onClose();
            }
          }}
          className="p-3.5 sm:p-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 active:scale-95"
          title={isCreator ? "End or Leave Meeting" : "Leave Meeting"}
        >
          <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
          <span className="hidden sm:inline text-xs">{isCreator ? "End Call" : "Leave Meeting"}</span>
        </button>
      </div>

      {/* Host End Meeting Options Dialog Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-white relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Host Meeting Controls</span>
                  <Crown className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-xs text-slate-400">
                  Choose how you want to conclude or exit this hospital sync session.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {/* Option 1: End call for everyone */}
              <button
                onClick={handleEndCallForEveryone}
                className="w-full p-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] transition border border-rose-400/40 text-left flex items-start gap-3 shadow-lg shadow-rose-900/30 group"
              >
                <div className="p-2.5 rounded-xl bg-black/25 text-white shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <PhoneOff className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>End Call for Everyone</span>
                    <span className="px-1.5 py-0.5 rounded bg-black/30 text-[10px] uppercase tracking-wider font-extrabold text-rose-200">
                      Conclude Sync
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-100/80 mt-1">
                    Disconnects all hospital staff and terminates this group meeting room immediately.
                  </p>
                </div>
              </button>

              {/* Option 2: Leave meeting only */}
              <button
                onClick={() => {
                  setShowEndModal(false);
                  onClose();
                }}
                className="w-full p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-[0.98] transition border border-slate-700 text-left flex items-start gap-3 shadow-md group"
              >
                <div className="p-2.5 rounded-xl bg-slate-900 text-slate-300 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <LogOut className="w-5 h-5 text-teal-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-slate-200">
                    Leave Meeting Only
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Leaves the room while allowing other connected medical staff to continue talking.
                  </p>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
