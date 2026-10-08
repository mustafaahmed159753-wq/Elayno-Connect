import React, { useState, useRef, useEffect } from "react";
import { Message, User, Group, BotInteractivePrompt } from "../types";
import { socket } from "../lib/socket";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { GroupMembersModal } from "./GroupMembersModal";
import { StickerPicker } from "./StickerPicker";
import { EmojiPicker } from "./EmojiPicker";
import { FolderCard } from "./FolderCard";
import { FolderBrowseModal } from "./FolderBrowseModal";
import { UploadProgressDock } from "./UploadProgressDock";
import { identifyFolderType, getFolderExtension, FolderTypeInfo } from "../utils/folderType";
import { uploadLargeFileOrFolder, uploadDirectoryFolder, UploadProgress } from "../utils/chunkedUploader";
import {
  Phone,
  Video,
  Send,
  Paperclip,
  Smile,
  Mic,
  MicOff,
  MoreVertical,
  Check,
  CheckCheck,
  Pin,
  Star,
  Trash2,
  Reply,
  Copy,
  Download,
  FileText,
  Play,
  Pause,
  Clock,
  Sparkles,
  Ticket,
  Edit2,
  Pencil,
  History,
  ArrowLeft,
  Users,
  UserPlus,
  VideoOff,
  Eye,
  FileSpreadsheet,
  FileCode,
  Film,
  Music,
  Image as ImageIcon,
  Upload,
  FolderUp,
  Folder,
  FolderArchive,
  HardDrive,
} from "lucide-react";

interface Props {
  currentUser: string;
  targetId: string | null;
  targetType: "user" | "group";
  usersMap: Record<string, User>;
  groups: Group[];
  messages: Message[];
  onlineList: string[];
  isPinned?: boolean;
  onTogglePin?: () => void;
  onStartCall: (type: "voice" | "video") => void;
  onStartGroupMeeting?: (meetingId?: string) => void;
  onOpenCallLog: () => void;
  onOpenGlobalSearch: () => void;
  onViewProfile?: (user: User) => void;
  onBack?: () => void;
  className?: string;
}

const EMOJIS = [
  "👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "🙏", "💯", "😎", "🚀", "💡",
  "🩺", "💉", "🏥", "💊", "👨‍⚕️", "👩‍⚕️", "🚑", "🩸", "🔬", "📋", "✅", "❌"
];

function InteractivePromptCard({
  prompt,
  messageId,
  currentUser,
}: {
  prompt: BotInteractivePrompt;
  messageId: number;
  currentUser: string;
}) {
  const [val, setVal] = useState(prompt.default_value || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if default value changes
  useEffect(() => {
    if (prompt.default_value && !val) {
      setVal(prompt.default_value);
    }
  }, [prompt.default_value]);

  const isSubmitted = Boolean(prompt.submitted);

  const handleConfirm = () => {
    const finalVal = (val || prompt.default_value || "").trim();
    if (!finalVal) return;
    setIsSubmitting(true);
    socket.emit("submit_bot_prompt", {
      message_id: messageId,
      field_key: prompt.field_key,
      value: finalVal,
      sender: currentUser,
    });
  };

  if (isSubmitted) {
    return (
      <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-inner">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/30">
            <Check className="w-3 h-3 font-bold" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-emerald-400 block font-semibold">{prompt.label}</span>
            <span className="font-bold text-slate-100 truncate block text-xs">
              {prompt.submitted_value || prompt.default_value || val}
            </span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-bold text-[10px] shrink-0 flex items-center gap-1">
          <CheckCheck className="w-3 h-3 text-emerald-400" /> Confirmed
        </span>
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-sky-500/40 shadow-xl space-y-2.5 text-slate-100 min-w-[260px] sm:min-w-[300px]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
        <label className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          {prompt.label}
        </label>
        <span className="text-[10px] text-sky-400/80 font-mono bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-500/30">
          Required Field
        </span>
      </div>

      {/* Options Quick Selector Pills if options exist */}
      {prompt.options && prompt.options.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {prompt.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setVal(opt)}
              className={`px-2.5 py-1 rounded-lg text-xs transition active:scale-95 ${
                val === opt
                  ? "bg-sky-500 text-slate-950 font-bold border border-sky-400 shadow-md scale-[1.02]"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Input or Textarea */}
      {prompt.step === "problem" ? (
        <textarea
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={prompt.placeholder || "Enter details..."}
          rows={3}
          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-100 placeholder-slate-500 text-xs outline-none transition resize-none leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleConfirm();
            }
          }}
        />
      ) : (
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={prompt.placeholder || "Enter value..."}
          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-100 placeholder-slate-500 text-xs outline-none transition"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleConfirm();
            }
          }}
        />
      )}

      {/* Confirm Button */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isSubmitting || (!val.trim() && !prompt.default_value)}
        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500 via-sky-400 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Check className="w-4 h-4 font-black" />
        {isSubmitting ? "Submitting..." : prompt.button_label || "Confirm"}
      </button>
    </div>
  );
}

export const ChatArea: React.FC<Props> = ({
  currentUser,
  targetId,
  targetType,
  usersMap = {},
  groups = [],
  messages = [],
  onlineList = [],
  isPinned = false,
  onTogglePin,
  onStartCall,
  onStartGroupMeeting,
  onOpenCallLog,
  onOpenGlobalSearch,
  onViewProfile,
  onBack,
  className = "",
}) => {
  const [inputText, setInputText] = useState("");
  const [replyToMsg, setReplyToMsg] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [editMsgText, setEditMsgText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [telegramToast, setTelegramToast] = useState<string | null>(null);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (m: Message, e: React.TouchEvent) => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    touchTimeoutRef.current = setTimeout(() => {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try { navigator.vibrate(40); } catch (_) {}
      }
      setContextMsg(m);
      setContextPos({ x, y });
    }, 450);
  };

  const handleTouchEnd = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
  };
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [contextMsg, setContextMsg] = useState<Message | null>(null);
  const [contextPos, setContextPos] = useState<{ x: number; y: number } | null>(null);

  const [helpModalTicketId, setHelpModalTicketId] = useState<number | null>(null);
  const [helpNoteText, setHelpNoteText] = useState("");
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    filename: string;
    subtype: "image" | "video" | "audio" | "doc";
  } | null>(null);

  // Drag and Drop & Pending Share File Preview State
  const [isDragging, setIsDragging] = useState(false);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const archiveInputRef = useRef<HTMLInputElement | null>(null);
  const [showFolderMenu, setShowFolderMenu] = useState(false);

  // Folder Browsing Modal State
  const [browsingFolder, setBrowsingFolder] = useState<{
    folderName: string;
    typeInfo: FolderTypeInfo;
    manifest: { name: string; size: number; path?: string }[];
    downloadUrl: string;
  } | null>(null);

  // Big File & Folder Upload Progress State (Supports 2-3 GB+)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);

  const [pendingShareFile, setPendingShareFile] = useState<{
    file: File | Blob;
    directoryFiles?: File[];
    dataUrl?: string;
    filename: string;
    subtype: "image" | "video" | "audio" | "doc" | "folder";
    sizeStr: string;
    caption: string;
    isFolder?: boolean;
    folderTypeInfo?: FolderTypeInfo;
    fileCount?: number;
    manifest?: { name: string; size: number; path?: string }[];
    isLargeTransfer?: boolean;
    totalSizeBytes?: number;
  } | null>(null);

  // Real-time Typing Status State
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Group Member Management Modal State
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false);

  const me = usersMap[currentUser];
  const isAdmin = me?.role === "admin";

  const handleCallForHelp = (ticketId: number) => {
    if (!targetId) return;
    socket.emit("repost_ticket_help", {
      ticket_id: ticketId,
      sender: currentUser,
      recipient: targetId,
      note: helpNoteText.trim() || "Assistance requested on this ticket.",
    });
    setHelpModalTicketId(null);
    setHelpNoteText("");
  };

  const [disappearingTimer, setDisappearingTimer] = useState<number>(0); // 0 = off, 86400 = 24h
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);

  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const shouldSendVoiceRef = useRef<boolean>(true);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-expand textarea vertically when typing longer messages
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      // Clamp between min 40px and max 160px (around 6 lines)
      textareaRef.current.style.height = `${Math.max(40, Math.min(scrollHeight, 160))}px`;
    }
  }, [inputText]);

  // Target information
  const isGroup = targetType === "group";
  const targetGroup = isGroup ? groups.find((g) => g.id === targetId) : null;
  const targetUser = !isGroup && targetId ? usersMap[targetId] || { username: targetId } : null;
  const isITBot = !isGroup && (targetId === "it_bot" || targetId === "BOT" || targetUser?.bot_type === "it_triage");
  const isInfoBot = !isGroup && (targetId === "info_bot" || targetUser?.bot_type === "hospital_info");
  const isBot = isITBot || isInfoBot || (!isGroup && (targetUser?.is_bot || targetUser?.role === "bot"));
  const isOnline = !isGroup && targetId ? (isBot || onlineList.includes(targetId)) : false;

  // Real-time typing status calculations for header & message area
  const isOtherParticipantTyping = Boolean(
    !isGroup &&
      targetId &&
      (typingUsers[targetId] ||
        (isITBot && (typingUsers["it_bot"] || typingUsers["BOT"])) ||
        (isInfoBot && typingUsers["info_bot"]))
  );

  const groupTypingUsers = isGroup
    ? Object.keys(typingUsers).filter((u) => typingUsers[u] && u !== currentUser)
    : [];
  const isGroupTyping = isGroup && groupTypingUsers.length > 0;

  // Clear typing cache when switching conversations
  useEffect(() => {
    setTypingUsers({});
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [targetId]);

  const handleTicketStatusChange = async (ticketId: number, newStatus: string) => {
    if (socket && socket.connected) {
      socket.emit("update_ticket_status", {
        ticket_id: ticketId,
        status: newStatus,
        updated_by: currentUser,
      });
    } else {
      try {
        await fetch("/api/tickets/update_status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticket_id: ticketId,
            status: newStatus,
            updated_by: currentUser,
          }),
        });
      } catch (err) {
        console.error("Error updating ticket status:", err);
      }
    }
  };

  // Filter messages for current chat
  const filteredMessages = messages.filter((m) => {
    if (isGroup) return m.recipient === targetId;
    if (isITBot) {
      const isBotSender = m.sender === "it_bot" || m.sender === "BOT" || m.sender.toLowerCase() === "it_bot" || m.sender.toLowerCase() === "bot";
      const isBotRecipient = m.recipient === "it_bot" || m.recipient === "BOT" || m.recipient.toLowerCase() === "it_bot" || m.recipient.toLowerCase() === "bot";
      return (
        (m.sender === currentUser && isBotRecipient) ||
        (isBotSender && m.recipient === currentUser)
      );
    }
    if (isInfoBot) {
      return (
        (m.sender === currentUser && m.recipient === "info_bot") ||
        (m.sender === "info_bot" && m.recipient === currentUser)
      );
    }
    return (
      (m.sender === currentUser && m.recipient === targetId) ||
      (m.sender === targetId && m.recipient === currentUser)
    );
  });

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [filteredMessages.length, targetId]);

  // Mark unread messages as read automatically when chat is active
  useEffect(() => {
    if (!isGroup && targetId && currentUser) {
      const hasUnread = messages.some(
        (m) =>
          !m.read &&
          !m.is_deleted &&
          ((m.sender === targetId && m.recipient === currentUser) ||
            ((targetId === "it_bot" || targetId === "BOT") &&
              (m.sender === "it_bot" || m.sender === "BOT") &&
              m.recipient === currentUser))
      );
      if (hasUnread) {
        socket.emit("mark_read", { sender: targetId, recipient: currentUser });
      }
    }
  }, [targetId, isGroup, currentUser, messages]);

  // Handle Voice Recording via MediaRecorder API
  const startRecording = async () => {
    try {
      if (isRecordingVoice) {
        stopAndSendRecording();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      recordingStreamRef.current = stream;
      audioChunksRef.current = [];
      shouldSendVoiceRef.current = true;

      let mimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
          mimeType = "audio/ogg;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        }
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (shouldSendVoiceRef.current && audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            if (targetId) {
              socket.emit("send_msg", {
                sender: currentUser,
                recipient: targetId,
                type: "file",
                subtype: "audio",
                filename: `voice_note_${Date.now()}.webm`,
                data: base64data,
                delivered: true,
                read: false,
              });
            }
          };
          reader.readAsDataURL(audioBlob);
        }

        // Clean up audio stream tracks
        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach((t) => t.stop());
          recordingStreamRef.current = null;
        }
        audioChunksRef.current = [];
      };

      mediaRecorder.start(100);
      setIsRecordingVoice(true);
      setRecordingTime(0);

      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Microphone access error:", err);
      alert("Microphone permission was not granted or microphone is not available.");
    }
  };

  const cancelRecording = () => {
    shouldSendVoiceRef.current = false;
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((t) => t.stop());
      recordingStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecordingVoice(false);
    setRecordingTime(0);
  };

  const stopAndSendRecording = () => {
    shouldSendVoiceRef.current = true;
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    stopAndSendRecording();
  };

  useEffect(() => {
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Real-time Typing socket listener
  useEffect(() => {
    const handleTypingStatus = (data: { sender: string; recipient: string; status: string | boolean }) => {
      const isBotTarget = targetId === "it_bot" || targetId === "BOT" || isBot;
      const isBotSender = data.sender === "it_bot" || data.sender === "BOT";

      if (
        data.sender !== currentUser &&
        (data.recipient === targetId ||
          data.sender === targetId ||
          (isBotTarget && isBotSender) ||
          (data.recipient === currentUser && (data.sender === targetId || (isBotTarget && isBotSender))) ||
          isGroup)
      ) {
        const isTyping = data.status === "typing" || data.status === true;
        setTypingUsers((prev) => ({
          ...prev,
          [data.sender]: isTyping,
          ...(isBotSender ? { it_bot: isTyping, BOT: isTyping } : {}),
        }));
      }
    };

    socket.on("typing_status", handleTypingStatus);
    return () => {
      socket.off("typing_status", handleTypingStatus);
    };
  }, [targetId, currentUser, isGroup, isBot]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (targetId) {
      socket.emit("typing", { sender: currentUser, recipient: targetId, status: "typing" });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing", { sender: currentUser, recipient: targetId, status: "stopped" });
      }, 2000);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !targetId) return;

    socket.emit("send_msg", {
      sender: currentUser,
      recipient: targetId,
      msg: inputText.trim(),
      type: "text",
      reply_to_id: replyToMsg?.id || null,
      reply_preview: replyToMsg
        ? `${replyToMsg.sender}: ${replyToMsg.msg || replyToMsg.filename || "Attachment"}`
        : null,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("typing", { sender: currentUser, recipient: targetId, status: "stopped" });

    setInputText("");
    setReplyToMsg(null);
    setShowEmojiPicker(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === "file") {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processFileForPreview(file);
            return;
          }
        }
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const processFileForPreview = (file: File) => {
    const sizeStr = formatBytes(file.size);
    const isLarge = file.size > 15 * 1024 * 1024; // >15MB (up to 2-3 GB)
    const typeInfo = identifyFolderType(file.name);
    const isArchiveFolder = typeInfo.isArchiveExtension;

    let subtype: "image" | "video" | "audio" | "doc" | "folder" = "doc";
    if (isArchiveFolder) {
      subtype = "folder";
    } else if (file.type.startsWith("image/")) {
      subtype = "image";
    } else if (file.type.startsWith("video/")) {
      subtype = "video";
    } else if (file.type.startsWith("audio/")) {
      subtype = "audio";
    }

    if (isLarge || isArchiveFolder) {
      // Large file or archive/folder - do not base64 decode! Use fast chunked streaming
      setPendingShareFile({
        file,
        filename: file.name,
        subtype,
        sizeStr,
        caption: inputText.trim(),
        isFolder: isArchiveFolder,
        folderTypeInfo: isArchiveFolder ? typeInfo : undefined,
        fileCount: 1,
        isLargeTransfer: true,
        totalSizeBytes: file.size,
      });
      return;
    }

    // Small files (< 15MB) can be previewed directly
    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingShareFile({
        file,
        dataUrl: reader.result as string,
        filename: file.name,
        subtype,
        sizeStr,
        caption: inputText.trim(),
        isFolder: false,
        isLargeTransfer: false,
        totalSizeBytes: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !targetId) return;

    let folderName = "Shared_Folder";
    const manifest: { name: string; size: number; path?: string }[] = [];
    let totalSizeBytes = 0;
    const fileList = Array.from(files) as File[];

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      totalSizeBytes += f.size;
      const relPath = (f as any).webkitRelativePath || f.name;
      if (i === 0 && (f as any).webkitRelativePath) {
        const topDir = (f as any).webkitRelativePath.split("/")[0];
        if (topDir) folderName = topDir;
      }
      if (i < 500) {
        manifest.push({
          name: f.name,
          size: f.size,
          path: relPath,
        });
      }
    }

    const typeInfo = identifyFolderType(folderName, manifest);
    const sizeStr = formatBytes(totalSizeBytes);

    setPendingShareFile({
      file: fileList[0],
      directoryFiles: fileList,
      filename: folderName,
      subtype: "folder",
      sizeStr,
      caption: inputText.trim(),
      isFolder: true,
      folderTypeInfo: typeInfo,
      fileCount: fileList.length,
      manifest,
      isLargeTransfer: true,
      totalSizeBytes,
    });

    e.target.value = "";
  };

  const handleCancelUpload = () => {
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort();
    }
    setUploadProgress(null);
  };

  const handleConfirmSendFile = async () => {
    if (!pendingShareFile || !targetId) return;

    // Use chunked streaming or directory upload for any large file or folder transfer (supports 2-3 GB+)
    if (
      pendingShareFile.isLargeTransfer ||
      pendingShareFile.isFolder ||
      (pendingShareFile.totalSizeBytes && pendingShareFile.totalSizeBytes > 15 * 1024 * 1024)
    ) {
      const controller = new AbortController();
      uploadAbortControllerRef.current = controller;

      const shareState = { ...pendingShareFile };
      setPendingShareFile(null);
      setInputText("");

      try {
        if (shareState.directoryFiles && shareState.directoryFiles.length > 1) {
          // Multi-file directory packaging via server archiver
          await uploadDirectoryFolder({
            files: shareState.directoryFiles,
            folderName: shareState.filename,
            sender: currentUser,
            recipient: targetId,
            caption: shareState.caption.trim(),
            manifest: shareState.manifest,
            onProgress: (prog) => {
              setUploadProgress(prog);
              if (prog.status === "completed") {
                setTimeout(() => setUploadProgress(null), 3000);
              }
            },
            signal: controller.signal,
          });
        } else {
          // Single big folder archive/volume (up to 2-3 GB+)
          const fileToUpload = shareState.file;
          if (!fileToUpload) return;

          await uploadLargeFileOrFolder({
            file: fileToUpload,
            filename: shareState.filename,
            sender: currentUser,
            recipient: targetId,
            caption: shareState.caption.trim(),
            isFolder: shareState.isFolder,
            folderName: shareState.filename,
            fileCount: shareState.fileCount,
            manifest: shareState.manifest,
            onProgress: (prog) => {
              setUploadProgress(prog);
              if (prog.status === "completed") {
                setTimeout(() => setUploadProgress(null), 3000);
              }
            },
            signal: controller.signal,
          });
        }
      } catch (err: any) {
        console.error("Large file/folder upload error:", err);
      }
      return;
    }

    // Standard small file via socket
    socket.emit("send_msg", {
      sender: currentUser,
      recipient: targetId,
      type: "file",
      subtype: pendingShareFile.subtype,
      filename: pendingShareFile.filename,
      data: pendingShareFile.dataUrl,
      msg: pendingShareFile.caption.trim(),
      is_folder: pendingShareFile.isFolder,
      folder_type: pendingShareFile.folderTypeInfo?.typeName,
      folder_badge: pendingShareFile.folderTypeInfo?.badge,
      folder_extension: getFolderExtension(pendingShareFile.filename),
      file_count: pendingShareFile.fileCount || 1,
      folder_manifest: pendingShareFile.manifest,
    });

    setInputText("");
    setPendingShareFile(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetId) return;
    processFileForPreview(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files.length > 1) {
        // Multi-file dropped as a folder
        let folderName = "Dropped_Folder_Collection";
        const manifest: { name: string; size: number; path?: string }[] = [];
        let totalSizeBytes = 0;
        for (let i = 0; i < files.length; i++) {
          totalSizeBytes += files[i].size;
          if (i < 200) {
            manifest.push({ name: files[i].name, size: files[i].size });
          }
        }
        const typeInfo = identifyFolderType(folderName, manifest);
        setPendingShareFile({
          file: files[0],
          filename: folderName,
          subtype: "folder",
          sizeStr: formatBytes(totalSizeBytes),
          caption: inputText.trim(),
          isFolder: true,
          folderTypeInfo: typeInfo,
          fileCount: files.length,
          manifest,
          isLargeTransfer: true,
          totalSizeBytes,
        });
      } else {
        processFileForPreview(files[0]);
      }
    }
  };

  const handleReaction = (msgId: number, emoji: string) => {
    if (!targetId) return;
    socket.emit("react_msg", { msg_id: msgId, emoji, recipient: targetId });
    setContextMsg(null);
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (_) {
      return "";
    }
  };

  if (!targetId) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950/60 select-none ${className}`}>
        <div className="w-20 h-24 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 mb-4 shadow-xl">
          <Sparkles className="w-10 h-10 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Select a Conversation</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          Pick a contact or group from the sidebar to start chatting, sending files, or calling.
        </p>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      className={`flex-1 flex flex-col h-full max-h-full min-h-0 w-full max-w-full bg-slate-950/60 relative overflow-hidden ${className}`}
    >
      {/* Drag & Drop Visual Overlay Target */}
      {isDragging && (
        <div className="absolute inset-0 bg-sky-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 border-4 border-dashed border-sky-400 rounded-2xl animate-in fade-in duration-200 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400 mb-3 animate-bounce">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Drop File Here to Share</h3>
          <p className="text-xs text-sky-300 mt-1">Release file to open preview and attach message</p>
        </div>
      )}
      {/* Header - Fixed & Non-Scrollable */}
      <div className="sticky top-0 z-20 p-2.5 sm:p-3.5 px-3 sm:px-4 md:px-6 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-xl flex items-center justify-between shrink-0 gap-2 min-w-0 w-full">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition md:hidden shrink-0"
              title="Back to Chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div
            className={`relative shrink-0 ${!isGroup && targetUser && onViewProfile ? "cursor-pointer hover:opacity-80 transition" : ""}`}
            title={!isGroup ? `View ${isInfoBot ? "Hospital Info BOT" : isITBot ? "IT Diagnostic BOT" : targetId}'s Profile` : undefined}
            onClick={() => {
              if (!isGroup && targetUser && onViewProfile) {
                onViewProfile(
                  isInfoBot
                    ? { ...targetUser, username: "info_bot", is_bot: true, role: "bot", image: targetUser.image || "info_bot_avatar.svg" }
                    : isITBot
                    ? { ...targetUser, username: "BOT", is_bot: true, role: "bot", image: targetUser.image || "bot_avatar.jpg" }
                    : targetUser
                );
              }
            }}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sky-400 text-sm overflow-hidden">
              {isGroup ? (
                "👥"
              ) : isInfoBot ? (
                <img
                  src="/info_bot_avatar.svg"
                  alt="Hospital Info BOT"
                  className="w-full h-full object-cover"
                />
              ) : (targetUser?.image || isITBot) ? (
                <img
                  src={
                    targetUser?.image
                      ? (targetUser.image.startsWith("data:") || targetUser.image.startsWith("http") || targetUser.image.startsWith("/")
                          ? targetUser.image
                          : `/uploads/${targetUser.image}`)
                      : "/uploads/bot_avatar.jpg"
                  }
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (isITBot && !e.currentTarget.src.includes("bot_avatar.png")) {
                      e.currentTarget.src = "/uploads/bot_avatar.png";
                    }
                  }}
                />
              ) : (
                targetId.substring(0, 2).toUpperCase()
              )}
            </div>
            {!isGroup && (
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-slate-900 ${
                  isOnline || isBot ? "bg-emerald-500 ring-1 ring-emerald-400/40" : "bg-slate-600"
                }`}
              />
            )}
          </div>

          <div
            className={`min-w-0 flex-1 pr-1 ${!isGroup && targetUser && onViewProfile ? "cursor-pointer group" : ""}`}
            onClick={() => {
              if (!isGroup && targetUser && onViewProfile) {
                onViewProfile(
                  isInfoBot
                    ? { ...targetUser, username: "info_bot", is_bot: true, role: "bot", image: targetUser.image || "info_bot_avatar.svg" }
                    : isITBot
                    ? { ...targetUser, username: "BOT", is_bot: true, role: "bot", image: targetUser.image || "bot_avatar.jpg" }
                    : targetUser
                );
              }
            }}
          >
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-xs sm:text-sm text-white leading-tight truncate max-w-[140px] xs:max-w-[180px] sm:max-w-[260px] md:max-w-sm group-hover:text-teal-300 transition-colors">
                {isGroup ? targetGroup?.name || targetId : isInfoBot ? "Hospital Info BOT" : isITBot ? "IT Diagnostic BOT" : (targetUser?.full_name || targetUser?.name || targetId)}
              </h2>
              {isInfoBot && (
                <span className="px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[9px] font-bold shrink-0">
                  Directory & Presence
                </span>
              )}
              {isITBot && (
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold shrink-0">
                  AI Diagnostic
                </span>
              )}
              {isPinned && (
                <span title="Pinned conversation" className="text-amber-400 shrink-0">
                  <Pin className="w-3.5 h-3.5 fill-amber-400/40 text-amber-400 -rotate-45" />
                </span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              {isOtherParticipantTyping || (isGroup && isGroupTyping) ? (
                <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-[10px] sm:text-[11px] py-0.5 animate-in fade-in">
                  <span className="flex items-center gap-0.5 shrink-0">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" />
                  </span>
                  <span className="truncate italic">
                    {isGroup
                      ? groupTypingUsers.length === 1
                        ? `${usersMap[groupTypingUsers[0]]?.username || groupTypingUsers[0]} is typing...`
                        : `${groupTypingUsers.length} people are typing...`
                      : isBot
                      ? "BOT is typing..."
                      : `${usersMap[targetId]?.username || targetUser?.username || targetId} is typing...`}
                  </span>
                </div>
              ) : (
                <>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                    {isGroup
                      ? `${targetGroup?.members?.length || 0} members`
                      : isOnline || isBot
                      ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                            {isBot ? "Online 24/7" : "Online Active"}
                          </span>
                        )
                      : (() => {
                          if (!targetUser?.last_seen) return "Offline";
                          try {
                            const d = new Date(targetUser.last_seen);
                            if (isNaN(d.getTime())) return "Offline";
                            const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
                            if (diffMins < 1) return "Seen just now";
                            if (diffMins < 60) return `Seen ${diffMins} min ago`;
                            return `Seen ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                          } catch (_) {
                            return "Offline";
                          }
                        })()}
                  </p>
                  {!isGroup && (targetUser?.bio || targetUser?.status || targetUser?.department) && (
                    <p className="text-[9.5px] sm:text-[10.5px] text-teal-300/90 font-medium truncate max-w-[140px] xs:max-w-[180px] sm:max-w-[260px] md:max-w-sm">
                      {targetUser.bio || targetUser.status || targetUser.department}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Admin / Creator Manage Members Button */}
          {isGroup && (isAdmin || targetGroup?.creator === currentUser) && (
            <button
              onClick={() => setShowGroupMembersModal(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 transition flex items-center gap-1.5 text-xs font-semibold shrink-0"
              title="Add or Remove Users in this Group"
            >
              <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline text-[11px]">Members ({targetGroup?.members?.length || 0})</span>
            </button>
          )}

          {/* Group Meeting / Conference Call Button */}
          {onStartGroupMeeting && (
            <button
              onClick={() => onStartGroupMeeting()}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-r from-teal-500 via-emerald-600 to-indigo-600 border border-teal-300/40 text-white hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-extrabold shadow-md shadow-teal-500/20 ring-2 ring-teal-500/30 shrink-0"
              title="Start or Join Online Group Meeting Room"
            >
              <div className="flex items-center -space-x-1 shrink-0">
                <Users className="w-3.5 h-3.5 text-teal-100" />
                <Video className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="hidden sm:inline font-black tracking-wide uppercase text-[10px]">Meeting Room</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse shrink-0" />
            </button>
          )}

          {/* 1-on-1 Call Buttons (Disabled for automated Bot) */}
          {!isGroup && !isBot && (
            <>
              <button
                onClick={() => onStartCall("voice")}
                className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition flex items-center gap-1.5 text-xs font-semibold shrink-0"
                title="Voice Call"
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">Voice</span>
              </button>

              <button
                onClick={() => onStartCall("video")}
                className="p-2 sm:p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 transition flex items-center gap-1.5 text-xs font-semibold shrink-0"
                title="Video Call"
              >
                <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">Video</span>
              </button>
            </>
          )}

          {/* Three-dots menu dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenuDropdown && (
              <div className="absolute right-0 top-12 w-48 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 z-50 text-xs text-slate-200">
                {onTogglePin && (
                  <button
                    onClick={() => {
                      setShowMenuDropdown(false);
                      onTogglePin();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 transition flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Pin className={`w-3.5 h-3.5 -rotate-45 ${isPinned ? "text-amber-400 fill-amber-400/40" : ""}`} />
                      {isPinned ? "Unpin Conversation" : "Pin to Top"}
                    </span>
                    {isPinned && <span className="text-[10px] text-amber-400 font-bold">Pinned</span>}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    onOpenGlobalSearch();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 transition flex items-center gap-2"
                >
                  🔍 Search Messages
                </button>
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    onOpenCallLog();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 transition flex items-center gap-2"
                >
                  📋 Call History
                </button>
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    setDisappearingTimer(disappearingTimer === 0 ? 86400 : 0);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 transition flex items-center justify-between"
                >
                  <span>⏱ Disappearing</span>
                  <span className="text-[10px] text-sky-400 font-bold">
                    {disappearingTimer > 0 ? "24h On" : "Off"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Window - Scrollable Area in between Header & Footer */}
      <div
        ref={chatWindowRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-6 space-y-3 scrollbar-thin scrollbar-thumb-slate-800"
      >
        {filteredMessages.length === 0 ? (
          isBot ? (
            <div className="flex flex-col items-center justify-center min-h-[70%] text-center px-4 py-8 space-y-4">
              <div className={`w-16 h-16 rounded-2xl p-0.5 shadow-xl ${isInfoBot ? "bg-gradient-to-tr from-teal-500 to-sky-400 shadow-teal-500/10" : "bg-gradient-to-tr from-sky-600 to-teal-400 shadow-sky-500/10"}`}>
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-2xl overflow-hidden p-2">
                  {isInfoBot ? (
                    <img src="/info_bot_avatar.svg" alt="Info Bot" className="w-full h-full object-contain" />
                  ) : (
                    "🤖"
                  )}
                </div>
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="text-base font-bold text-slate-100">
                  {isInfoBot ? "Hospital Directory & Presence Assistant" : "Central IT Diagnostic Assistant"}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isInfoBot
                    ? "Ask about any hospital department phone, active on-duty personnel (doctors, nurses, IT support, sales), or who is stationed across any zone or floor."
                    : "Start your conversation or report any hospital workstation, printer, EMR, or network issue below."}
                </p>
              </div>

              {/* Quick Action Suggestion Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-lg">
                {isInfoBot ? (
                  <>
                    <button
                      onClick={() => {
                        socket.emit("send_msg", {
                          sender: currentUser,
                          recipient: "info_bot",
                          msg: "Who is the on-duty doctor?",
                          type: "text",
                        });
                      }}
                      className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/50 text-xs font-medium text-slate-200 hover:text-teal-300 transition shadow-sm active:scale-95 cursor-pointer"
                    >
                      🩺 Who is on-duty Doctor?
                    </button>
                    <button
                      onClick={() => {
                        socket.emit("send_msg", {
                          sender: currentUser,
                          recipient: "info_bot",
                          msg: "Who is the on-duty nurse?",
                          type: "text",
                        });
                      }}
                      className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/50 text-xs font-medium text-slate-200 hover:text-teal-300 transition shadow-sm active:scale-95 cursor-pointer"
                    >
                      👩‍⚕️ Who is on-duty Nurse?
                    </button>
                    <button
                      onClick={() => {
                        socket.emit("send_msg", {
                          sender: currentUser,
                          recipient: "info_bot",
                          msg: "Who is in Zone A in 3rd Floor?",
                          type: "text",
                        });
                      }}
                      className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/50 text-xs font-medium text-slate-200 hover:text-teal-300 transition shadow-sm active:scale-95 cursor-pointer"
                    >
                      📍 Who is in Zone A, 3rd Floor?
                    </button>
                    <button
                      onClick={() => {
                        socket.emit("send_msg", {
                          sender: currentUser,
                          recipient: "info_bot",
                          msg: "Who is the IT support on duty?",
                          type: "text",
                        });
                      }}
                      className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/50 text-xs font-medium text-slate-200 hover:text-teal-300 transition shadow-sm active:scale-95 cursor-pointer"
                    >
                      💻 Who is on IT Support?
                    </button>
                    <button
                      onClick={() => {
                        socket.emit("send_msg", {
                          sender: currentUser,
                          recipient: "info_bot",
                          msg: "Who is on duty in sales?",
                          type: "text",
                        });
                      }}
                      className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/50 text-xs font-medium text-slate-200 hover:text-teal-300 transition shadow-sm active:scale-95 cursor-pointer"
                    >
                      💼 Who is on duty in Sales?
                    </button>
                    <button
                      onClick={() => {
                        socket.emit("send_msg", {
                          sender: currentUser,
                          recipient: "info_bot",
                          msg: "What is the phone of Cardiology department?",
                          type: "text",
                        });
                      }}
                      className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/50 text-xs font-medium text-slate-200 hover:text-teal-300 transition shadow-sm active:scale-95 cursor-pointer"
                    >
                      📞 Cardiology Phone
                    </button>
                    <button
                      onClick={() => {
                        socket.emit("send_msg", {
                          sender: currentUser,
                          recipient: "info_bot",
                          msg: "What is the emergency department phone?",
                          type: "text",
                        });
                      }}
                      className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/50 text-xs font-medium text-slate-200 hover:text-teal-300 transition shadow-sm active:scale-95 cursor-pointer"
                    >
                      🚨 Emergency Department Phone
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        socket.emit("send_msg", {
                          sender: currentUser,
                          recipient: "it_bot",
                          msg: "Hi",
                          type: "text",
                        });
                      }}
                      className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 text-xs font-medium text-slate-200 hover:text-sky-300 transition shadow-sm active:scale-95 cursor-pointer"
                    >
                      👋 Say Hello
                    </button>
                    <button
                      onClick={() => {
                        socket.emit("send_msg", {
                          sender: currentUser,
                          recipient: "it_bot",
                          msg: "Workstation computer frozen with blue screen error",
                          type: "text",
                        });
                      }}
                      className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 text-xs font-medium text-slate-200 hover:text-sky-300 transition shadow-sm active:scale-95 cursor-pointer"
                    >
                      🖥️ Workstation PC Issue
                    </button>
                    <button
                      onClick={() => {
                        socket.emit("send_msg", {
                          sender: currentUser,
                          recipient: "it_bot",
                          msg: "Zebra barcode wristband printer jamming labels",
                          type: "text",
                        });
                      }}
                      className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 text-xs font-medium text-slate-200 hover:text-sky-300 transition shadow-sm active:scale-95 cursor-pointer"
                    >
                      🖨️ Printer Jamming
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
              <p>No messages yet. Say hello!</p>
            </div>
          )
        ) : (
          filteredMessages.map((m) => {
            const isMe = m.sender === currentUser;

            return (
              <div
                key={m.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMsg(m);
                  setContextPos({ x: e.clientX, y: e.clientY });
                }}
                onTouchStart={(e) => handleTouchStart(m, e)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
                className={`flex items-end gap-2 my-1 max-w-full select-none ${isMe ? "justify-end" : "justify-start"}`}
              >
                {!isMe && (
                  <div
                    className={`w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sky-400 text-[10px] overflow-hidden shrink-0 mb-1 shadow ${
                      onViewProfile ? "cursor-pointer hover:border-teal-400 transition" : ""
                    }`}
                    title={onViewProfile ? `View ${m.sender === "it_bot" ? "BOT" : m.sender}'s Profile` : undefined}
                    onClick={() => {
                      if (onViewProfile) {
                        const isMsgSenderBot = m.sender === "it_bot" || m.sender === "BOT" || usersMap[m.sender]?.is_bot;
                        const targetSender = usersMap[m.sender] || { username: m.sender };
                        onViewProfile(
                          isMsgSenderBot
                            ? { ...targetSender, username: "BOT", is_bot: true, role: "bot", image: targetSender.image || "bot_avatar.jpg" }
                            : targetSender
                        );
                      }
                    }}
                  >
                    {(() => {
                      const isMsgSenderBot = m.sender === "it_bot" || m.sender === "BOT" || usersMap[m.sender]?.is_bot;
                      const senderImg = usersMap[m.sender]?.image || (isMsgSenderBot ? "bot_avatar.jpg" : null);
                      if (senderImg) {
                        const src = senderImg.startsWith("data:") || senderImg.startsWith("http") || senderImg.startsWith("/")
                          ? senderImg
                          : `/uploads/${senderImg}`;
                        return (
                          <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              if (isMsgSenderBot && !e.currentTarget.src.includes("bot_avatar.png")) {
                                e.currentTarget.src = "/uploads/bot_avatar.png";
                              }
                            }}
                          />
                        );
                      }
                      return (m.sender === "it_bot" ? "BOT" : m.sender).substring(0, 2).toUpperCase();
                    })()}
                  </div>
                )}

                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  {/* Sender Name in group */}
                  {isGroup && !isMe && (
                    <span className="text-[10px] font-bold text-sky-400 ml-1 mb-0.5">
                      {m.sender}
                    </span>
                  )}

                {/* Reply Banner Preview */}
                {m.reply_preview && (
                  <div className="text-[11px] bg-slate-800/80 text-slate-300 px-3 py-1 rounded-t-xl border-l-2 border-sky-500 max-w-sm truncate mb-0.5">
                    {m.reply_preview}
                  </div>
                )}

                {/* Deleted Message Render */}
                {m.is_deleted ? (
                  isAdmin ? (
                    <div className="relative p-3.5 rounded-2xl max-w-sm sm:max-w-md bg-red-950/40 border border-red-500/40 text-red-200 text-xs shadow-lg space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-red-400">
                        <Trash2 className="w-3.5 h-3.5" /> DELETED MESSAGE AUDIT TRAIL (Admin Mode)
                      </div>
                      <p className="line-through opacity-80 break-words">{m.original_text || m.msg || "[File Attachment]"}</p>
                      <div className="text-[10px] text-red-400/80 flex items-center justify-between pt-1 border-t border-red-900/40">
                        <span>Deleted by: {m.deleted_by || m.sender}</span>
                        <span>{m.deleted_at ? formatTime(m.deleted_at) : formatTime(m.timestamp)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl max-w-sm bg-slate-900/80 border border-slate-800 text-slate-500 italic text-xs flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>This message was deleted</span>
                    </div>
                  )
                ) : (
                  /* Active Message Bubble */
                  <div
                    className={`relative p-3.5 rounded-2xl max-w-sm sm:max-w-md text-xs sm:text-sm leading-relaxed shadow-lg chat-msg-bubble ${
                      isMe
                        ? `chat-msg-bubble-sent rounded-br-xs ${m.read ? "chat-msg-bubble-seen" : ""}`
                        : "chat-msg-bubble-received rounded-bl-xs"
                    }`}
                  >
                    {/* Read / Seen Glowing Indicator Pip & Edge Accent Overlay */}
                    {isMe && m.read && (
                      <>
                        <span
                          className="absolute -top-1 -right-1 flex h-2.5 w-2.5 z-10 pointer-events-none"
                          title="Seen by recipient"
                        >
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 border border-white/90 shadow-[0_0_8px_#06b6d4]"></span>
                        </span>
                        <div
                          className="absolute top-2 bottom-2 right-0.5 w-[3px] rounded-full bg-gradient-to-b from-cyan-400 via-teal-400 to-sky-400 pointer-events-none opacity-85 shadow-[0_0_8px_rgba(6,182,212,0.7)]"
                          title="Seen"
                        />
                      </>
                    )}

                    {/* Text Message or Meeting Link Card */}
                    {m.type === "text" && !m.ticket_id && (
                      <div>
                        {m.msg && (m.msg.includes("meeting=") || m.msg.includes("Join Group Meeting")) ? (
                          <div className="space-y-2.5 p-1 min-w-[260px]">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
                              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
                                <Video className="w-5 h-5 font-bold" />
                              </div>
                              <div>
                                <span className="font-bold text-xs text-white block">Group Video Meeting</span>
                                <span className="text-[10px] text-teal-300 font-mono">
                                  Code: {m.msg?.match(/Code:\s*`?([a-zA-Z0-9_-]+)`?/)?.[1] || m.msg?.match(/meeting=([a-zA-Z0-9_-]+)/)?.[1] || "mtg-live"}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">{m.msg}</p>
                            {onStartGroupMeeting && (
                              <button
                                onClick={() => {
                                  const code = m.msg?.match(/Code:\s*`?([a-zA-Z0-9_-]+)`?/)?.[1] || m.msg?.match(/meeting=([a-zA-Z0-9_-]+)/)?.[1] || "mtg-live";
                                  onStartGroupMeeting(code);
                                }}
                                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-bold text-xs transition shadow-lg flex items-center justify-center gap-2 active:scale-95"
                              >
                                <Video className="w-4 h-4 fill-slate-950" /> Join Group Video Call
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{m.msg || ""}</p>
                        )}
                      </div>
                    )}

                    {/* Support Ticket Card Workflow */}
                    {(m.type === "ticket" || m.ticket_id) && (
                      <div className="space-y-2.5 p-1 min-w-[280px]">
                        {/* Ticket Header & Status Color Badge */}
                        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                              <Ticket className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-xs text-white block">
                                Support Ticket #{m.ticket_id || m.ticket_details?.id}
                              </span>
                              <span className="text-[10px] text-slate-300">
                                {m.ticket_details?.created_at
                                  ? new Date(m.ticket_details.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : formatTime(m.timestamp)}
                              </span>
                            </div>
                          </div>

                          {/* Dynamic Color Workflow Badge: Red (Pending) -> Blue (Working) -> Green (Resolved) */}
                          {(() => {
                            const st = m.ticket_status || m.ticket_details?.status || "pending";
                            if (st === "pending" || st === "open") {
                              return (
                                <span className="px-2.5 py-1 rounded-full bg-red-500/25 border border-red-400 text-red-200 font-bold text-[11px] flex items-center gap-1.5 shadow-sm">
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> Pending
                                </span>
                              );
                            } else if (st === "working_on" || st === "working") {
                              return (
                                <span className="px-2.5 py-1 rounded-full bg-sky-500/30 border border-sky-400 text-sky-200 font-bold text-[11px] flex items-center gap-1.5 shadow-sm">
                                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-spin" /> Working On
                                </span>
                              );
                            } else {
                              return (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/30 border border-emerald-400 text-emerald-200 font-bold text-[11px] flex items-center gap-1.5 shadow-sm">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Resolved
                                </span>
                              );
                            }
                          })()}
                        </div>

                        {/* Ticket Details Body */}
                        <div className="text-xs space-y-2">
                          {m.ticket_details ? (
                            <>
                              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-white/10">
                                <div>
                                  <span className="text-slate-400 block text-[10px]">Submitted By:</span>
                                  <span className="font-semibold text-slate-100">
                                    {m.ticket_details.reporter_name || m.ticket_details.submitted_by}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">Extension / Ext:</span>
                                  <span className="font-semibold text-sky-300">
                                    {m.ticket_details.location_extension
                                      ? (m.ticket_details.location_extension.toLowerCase().startsWith("ext") ? m.ticket_details.location_extension : `Ext. ${m.ticket_details.location_extension}`)
                                      : (m.ticket_details.reporter_extension || m.ticket_details.extension || "Ext. Internal")}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">Department:</span>
                                  <span className="font-semibold text-indigo-300">{m.ticket_details.department}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">Device Hostname / User:</span>
                                  <span className="font-semibold text-emerald-300 font-mono text-[10px]">
                                    {m.ticket_details.device_username || "N/A (Facility/General)"}
                                  </span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-slate-400 block text-[10px]">Location:</span>
                                  <span className="font-semibold text-slate-200">{m.ticket_details.floor} — {m.ticket_details.sub_location}</span>
                                </div>
                              </div>

                              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-white/10">
                                <span className="text-[10px] text-amber-300 font-bold block uppercase tracking-wider">Issue Description</span>
                                <p className="mt-1 text-slate-200 whitespace-pre-wrap">{m.ticket_details.description}</p>
                              </div>

                              {/* Working Details */}
                              {m.ticket_details.working_by && (
                                <div className="text-[11px] text-sky-200 flex items-center gap-1.5 bg-sky-950/60 p-2 rounded-xl border border-sky-400/30">
                                  <Pencil className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                                  <span>Assigned Member: <b>{m.ticket_details.working_by}</b></span>
                                </div>
                              )}

                              {/* Resolution Duration Display */}
                              {m.ticket_details.resolution_duration && (
                                <div className="text-[11px] text-emerald-200 flex items-center gap-1.5 bg-emerald-950/60 p-2 rounded-xl border border-emerald-400/30 font-semibold">
                                  <Clock className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                                  <span>Resolution Duration: <b>{m.ticket_details.resolution_duration}</b></span>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="whitespace-pre-wrap">{m.msg}</p>
                          )}
                        </div>

                        {/* Interactive Workflow Buttons ONLY in support groups where engineers manage tickets */}
                        {m.ticket_id && !isBot && isGroup && (
                          <div className="pt-2 border-t border-white/10">
                            {(() => {
                              const st = m.ticket_status || m.ticket_details?.status || "pending";
                              if (st === "pending" || st === "open") {
                                return (
                                  <button
                                    onClick={() => handleTicketStatusChange(m.ticket_id!, "working_on")}
                                    className="w-full py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow hover:scale-[1.01] active:scale-[0.99]"
                                  >
                                    🔵 Start Working On Ticket
                                  </button>
                                );
                              } else if (st === "working_on" || st === "working") {
                                return (
                                  <div className="space-y-1.5">
                                    <button
                                      onClick={() => handleTicketStatusChange(m.ticket_id!, "resolved")}
                                      className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow hover:scale-[1.01] active:scale-[0.99]"
                                    >
                                      🟢 Mark Ticket as Resolved
                                    </button>
                                    <button
                                      onClick={() => {
                                        setHelpModalTicketId(m.ticket_id!);
                                        setHelpNoteText("");
                                      }}
                                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow hover:scale-[1.01] active:scale-[0.99]"
                                    >
                                      📢 Call for Other Member or Help
                                    </button>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold text-xs text-center flex items-center justify-center gap-1.5">
                                    <CheckCheck className="w-4 h-4 text-emerald-400" /> Solved & Closed
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        )}

                        {/* Pure Informative Live Status for User Chats with Bot (No clickable buttons) */}
                        {m.ticket_id && (isBot || !isGroup) && (
                          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                            {(() => {
                              const st = m.ticket_status || m.ticket_details?.status || "pending";
                              if (st === "pending" || st === "open") {
                                return (
                                  <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                                    <Clock className="w-3.5 h-3.5 animate-pulse" /> Awaiting support team pickup
                                  </span>
                                );
                              } else if (st === "working_on" || st === "working") {
                                return (
                                  <span className="flex items-center gap-1.5 text-sky-300 font-medium">
                                    <Pencil className="w-3.5 h-3.5 animate-bounce" /> Assigned staff actively troubleshooting
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> Successfully resolved and closed
                                  </span>
                                );
                              }
                            })()}
                            <span className="text-[10px] text-slate-400 font-mono">Live Update</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sent File Attachment (Folder, Image, Video, Audio, Document, PDF, ZIP, Sticker, etc.) */}
                    {m.type === "file" && (
                      <div className="space-y-2.5 p-1 min-w-[200px]">
                        {/* Folder / Big Archive Transfer Rendering */}
                        {(m.subtype === "folder" || m.is_folder) && (
                          <FolderCard
                            message={m}
                            isMine={isMe}
                            onBrowseManifest={(folderName, typeInfo, manifest, downloadUrl) => {
                              setBrowsingFolder({ folderName, typeInfo, manifest, downloadUrl });
                            }}
                          />
                        )}

                        {/* Sticker Rendering */}
                        {m.subtype === "sticker" && (
                          <div className="flex flex-col items-center justify-center p-2">
                            <img
                              src={m.data}
                              alt={m.filename || "Sticker"}
                              className="w-28 h-28 sm:w-36 sm:h-36 object-contain filter drop-shadow-md select-none hover:scale-105 transition-transform duration-150 cursor-pointer"
                              onClick={() => {
                                setContextMsg(m);
                                setContextPos({ x: window.innerWidth / 2 - 110, y: window.innerHeight / 2 - 100 });
                              }}
                            />
                            {m.msg && (
                              <span className="text-[11px] font-semibold text-slate-200 mt-1 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-white/10 shadow-sm">
                                {m.msg}
                              </span>
                            )}
                          </div>
                        )}

                        {/* File Preview Thumbnail / Player / Document Card */}
                        {m.subtype === "image" && !m.is_folder && (
                          <div className="relative group rounded-xl overflow-hidden border border-white/20 shadow-md bg-slate-950/80">
                            <img
                              src={m.data}
                              alt={m.filename || "Image"}
                              className="w-full max-h-60 object-cover cursor-pointer hover:scale-[1.01] transition"
                              onClick={() => setPreviewFile({ url: m.data!, filename: m.filename || "Image.png", subtype: "image" })}
                            />
                          </div>
                        )}

                        {m.subtype === "video" && !m.is_folder && (
                          <div className="rounded-xl overflow-hidden border border-white/20 shadow-md bg-slate-950/80 p-1">
                            <video src={m.data} controls className="w-full max-h-60 rounded-lg" />
                          </div>
                        )}

                        {m.subtype === "audio" && !m.is_folder && (
                          <VoiceMessagePlayer src={m.data!} isMine={isMe} />
                        )}

                        {m.subtype === "doc" && !m.is_folder && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/80 border border-white/15 shadow-sm">
                            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/80 shrink-0 text-sky-400">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-xs text-white truncate block">{m.filename || "Document"}</span>
                              <span className="text-[10px] text-sky-300 uppercase tracking-wider font-semibold">
                                {m.filename?.split(".").pop() || "FILE"}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Universal Preview & Download Buttons for Standard Attached Files (Excluded for Voice Audio & Stickers) */}
                        {m.subtype !== "sticker" && m.subtype !== "folder" && m.subtype !== "audio" && !m.is_folder && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewFile({
                                  url: m.data!,
                                  filename: m.filename || "Attached_File",
                                  subtype: (m.subtype as any) || "doc",
                                })
                              }
                              className="flex-1 py-1.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-slate-100 font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow"
                            >
                              <Eye className="w-3.5 h-3.5 text-sky-400" /> Preview
                            </button>
                            <a
                              href={m.download_url || m.data}
                              download={m.filename || "download"}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md text-center"
                            >
                              <Download className="w-3.5 h-3.5 text-white" /> Download
                            </a>
                          </div>
                        )}

                        {/* Attached Message / Caption */}
                        {m.msg && m.subtype !== "sticker" && m.subtype !== "folder" && m.subtype !== "audio" && !m.is_folder && (
                          <div className="pt-2 border-t border-white/15 text-xs text-slate-100 whitespace-pre-wrap leading-relaxed break-words font-normal">
                            {m.msg}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Admin Original Text Audit preview if edited */}
                    {isAdmin && m.original_text && (
                      <div className="mt-1.5 pt-1.5 border-t border-white/20 text-[10px] text-amber-200/90 flex items-center gap-1 font-mono">
                        <History className="w-3 h-3 shrink-0" />
                        <span>Original before edit: "{m.original_text}"</span>
                      </div>
                    )}

                    {/* Interactive Prompt Card with Input and Confirm Button */}
                    {m.interactive_prompt && (
                      <InteractivePromptCard
                        prompt={m.interactive_prompt}
                        messageId={m.id}
                        currentUser={currentUser}
                      />
                    )}

                    {/* Meta Time & Status Ticks */}
                    <div className="flex items-center justify-end gap-1.5 text-[10px] opacity-80 mt-1 select-none">
                      {m.edited_at && <span className="italic font-medium">(edited)</span>}
                      <span>{formatTime(m.timestamp)}</span>
                      {isMe && (
                        <span className="inline-flex items-center ml-0.5">
                          {m.read ? (
                            <span title="Seen by recipient" className="flex items-center gap-1">
                              <span className="badge-override px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 border border-cyan-400/50 text-[9px] font-bold uppercase tracking-wider shadow-xs animate-in fade-in duration-150 flex items-center gap-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                Seen
                              </span>
                              <CheckCheck className="w-3.5 h-3.5 text-cyan-500 stroke-[2.5] drop-shadow-sm" />
                            </span>
                          ) : m.delivered ? (
                            <span title="Delivered to device" className="flex items-center">
                              <CheckCheck className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
                            </span>
                          ) : (
                            <span title="Sent to server" className="flex items-center">
                              <Check className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Reactions list */}
                {m.reactions && Object.keys(m.reactions).length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {Object.entries(m.reactions).map(([emoji, users]) => (
                      <span
                        key={emoji}
                        className="px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300"
                      >
                        {emoji} {(users as string[]).length}
                      </span>
                    ))}
                  </div>
                )}
                </div>

                {/* Sender Photo on Right for Sent Messages */}
                {isMe && (
                  <div
                    className={`w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sky-400 text-[10px] overflow-hidden shrink-0 mb-1 shadow ${
                      onViewProfile ? "cursor-pointer hover:border-teal-400 transition" : ""
                    }`}
                    title={onViewProfile ? `View Your Profile (${currentUser})` : undefined}
                    onClick={() => {
                      if (onViewProfile) {
                        onViewProfile(me || { username: currentUser });
                      }
                    }}
                  >
                    {(() => {
                      const myImg = me?.image;
                      if (myImg) {
                        const src = myImg.startsWith("data:") || myImg.startsWith("http") || myImg.startsWith("/")
                          ? myImg
                          : `/uploads/${myImg}`;
                        return (
                          <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        );
                      }
                      return (currentUser || "ME").substring(0, 2).toUpperCase();
                    })()}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Real-time Typing Indicator with actual user name & avatar */}
        {Object.entries(typingUsers).some(
          ([usr, isTyping]) =>
            isTyping &&
            (isGroup ||
              usr === targetId ||
              (isBot && (usr === "it_bot" || usr === "BOT" || targetId === "it_bot" || targetId === "BOT")))
        ) && (
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-900/95 border border-slate-800 text-sky-400 text-xs font-medium w-fit my-2 shadow-lg animate-in fade-in slide-in-from-bottom-1">
            <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-sky-500/30 overflow-hidden">
              {(() => {
                const typingUserKey = isGroup
                  ? Object.keys(typingUsers).find((u) => typingUsers[u] && u !== currentUser) || targetId
                  : targetId;
                const typingUserObj = typingUserKey ? usersMap[typingUserKey] : null;
                const img = typingUserObj?.image;
                if (img) {
                  const src = img.startsWith("data:") || img.startsWith("http") || img.startsWith("/") ? img : `/uploads/${img}`;
                  return <img src={src} alt="" className="w-full h-full object-cover" />;
                }
                return isBot ? "🤖" : (typingUserKey ? typingUserKey.substring(0, 2).toUpperCase() : "💬");
              })()}
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"></span>
            </div>
            <span className="text-[11px] text-slate-300 font-semibold">
              {isGroup
                ? `${Object.keys(typingUsers)
                    .filter((u) => typingUsers[u] && u !== currentUser)
                    .map((u) => usersMap[u]?.username || u)
                    .join(", ")} ${
                    Object.keys(typingUsers).filter((u) => typingUsers[u] && u !== currentUser).length > 1
                      ? "are"
                      : "is"
                  } typing...`
                : isBot
                ? "BOT is typing..."
                : `${usersMap[targetId]?.username || targetUser?.username || targetId} is typing...`}
            </span>
          </div>
        )}
      </div>

      {/* Share File Preview & Attach Message Modal */}
      {pendingShareFile && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center shrink-0">
                  {pendingShareFile.isFolder || pendingShareFile.subtype === "folder" ? (
                    <Folder className="w-4 h-4 text-teal-400" />
                  ) : pendingShareFile.subtype === "image" ? (
                    <ImageIcon className="w-4 h-4" />
                  ) : pendingShareFile.subtype === "video" ? (
                    <Film className="w-4 h-4" />
                  ) : pendingShareFile.subtype === "audio" ? (
                    <Music className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-100 truncate">
                    {pendingShareFile.isFolder || pendingShareFile.subtype === "folder"
                      ? `Share Folder: ${pendingShareFile.filename}`
                      : `Send ${pendingShareFile.subtype === "image" ? "Photo / Image" : pendingShareFile.subtype === "video" ? "Video" : pendingShareFile.subtype === "audio" ? "Audio Recording" : "Document Attachment"}`}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    To: <span className="text-sky-300 font-semibold">{isGroup ? targetGroup?.name || targetId : targetId}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPendingShareFile(null)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1.5 rounded-xl hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Media / File Preview Display Box */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/90 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Folder / Archive Display in Modal */}
              {(pendingShareFile.isFolder || pendingShareFile.subtype === "folder") && (
                <div className="w-full p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-400/30 flex items-center justify-center shrink-0">
                        <Folder className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white truncate max-w-xs">
                            {pendingShareFile.filename}
                          </h4>
                          {pendingShareFile.folderTypeInfo && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${pendingShareFile.folderTypeInfo.badgeColor}`}>
                              {pendingShareFile.folderTypeInfo.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-teal-300 font-medium mt-0.5">
                          {pendingShareFile.folderTypeInfo?.typeName || "Folder Archive"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {pendingShareFile.folderTypeInfo?.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">TOTAL SIZE</span>
                      <span className="text-white font-bold">{pendingShareFile.sizeStr}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">BUNDLED FILES</span>
                      <span className="text-white font-bold">{pendingShareFile.fileCount || 1} items</span>
                    </div>
                  </div>

                  {pendingShareFile.isLargeTransfer && (
                    <div className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-[11px] text-teal-300 flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Large Folder Streaming Pipeline (Supports 2-3 GB+)</span>
                    </div>
                  )}
                </div>
              )}

              {pendingShareFile.subtype === "image" && !pendingShareFile.isFolder && (
                <div className="relative max-h-56 w-full flex items-center justify-center overflow-hidden rounded-xl bg-slate-900/60 p-1">
                  <img
                    src={pendingShareFile.dataUrl}
                    alt={pendingShareFile.filename}
                    className="max-h-52 max-w-full object-contain rounded-lg shadow-md"
                  />
                </div>
              )}
              {pendingShareFile.subtype === "video" && !pendingShareFile.isFolder && (
                <video
                  src={pendingShareFile.dataUrl}
                  controls
                  className="max-h-52 max-w-full rounded-xl shadow-md"
                />
              )}
              {pendingShareFile.subtype === "audio" && !pendingShareFile.isFolder && (
                <div className="w-full py-4 px-3 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-400 border border-teal-400/30 flex items-center justify-center">
                    <Music className="w-6 h-6 animate-pulse" />
                  </div>
                  <audio src={pendingShareFile.dataUrl} controls className="w-full max-w-md" />
                </div>
              )}
              {pendingShareFile.subtype === "doc" && !pendingShareFile.isFolder && (
                <div className="flex items-center gap-3.5 py-3 px-4 w-full bg-slate-900/80 rounded-xl border border-slate-800">
                  <div className="p-3 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-400 shrink-0">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-100 truncate block">{pendingShareFile.filename}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold uppercase">
                        {pendingShareFile.filename.split(".").pop() || "FILE"}
                      </span>
                      <span className="text-[11px] text-slate-400">{pendingShareFile.sizeStr}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Meta Bar */}
              <div className="w-full flex items-center justify-between pt-2 px-1 text-[11px] text-slate-400">
                <span className="truncate max-w-[200px] sm:max-w-xs font-medium text-slate-300">
                  {pendingShareFile.filename}
                </span>
                <span className="font-mono text-slate-400 shrink-0 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                  {pendingShareFile.sizeStr}
                </span>
              </div>
            </div>

            {/* Prominent Message / Note Text Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5 text-sky-400" />
                  <span>Attach a Message / Note with this File:</span>
                </label>
                <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                  Press <b>Enter ↵</b> to send (Shift+Enter for newline)
                </span>
              </div>

              <div className="relative">
                <textarea
                  value={pendingShareFile.caption}
                  onChange={(e) =>
                    setPendingShareFile((prev) => (prev ? { ...prev, caption: e.target.value } : null))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleConfirmSendFile();
                    }
                  }}
                  rows={3}
                  autoFocus
                  placeholder="Type a message or note to accompany this file... (e.g. Here is the requested scan, report, or document)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition resize-none leading-relaxed"
                />
              </div>

              {/* Quick Preset Note / Hospital Tags */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold block">Quick tags:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "📋 For Your Review",
                    "🚨 Urgent Attention",
                    "🔬 Lab / Scan Report",
                    "💊 Pharmacy Prescription",
                    "✅ Approved Document",
                    "ℹ️ FYI Only",
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setPendingShareFile((prev) => {
                          if (!prev) return null;
                          const current = prev.caption.trim();
                          const newCap = current ? `${current} - [${tag}]` : tag;
                          return { ...prev, caption: newCap };
                        });
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700/60 hover:border-sky-500/40 text-[10px] font-medium transition active:scale-95"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setPendingShareFile(null);
                  fileInputRef.current?.click();
                }}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
                title="Choose a different file"
              >
                <Paperclip className="w-3.5 h-3.5 text-slate-400" /> Change File
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPendingShareFile(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSendFile}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition flex items-center gap-1.5 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />{" "}
                  {pendingShareFile.isFolder || pendingShareFile.subtype === "folder"
                    ? "Send Folder"
                    : "Send Attachment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Members Management Modal */}
      {showGroupMembersModal && targetGroup && (
        <GroupMembersModal
          group={targetGroup}
          usersMap={usersMap}
          onClose={() => setShowGroupMembersModal(false)}
          onSaveMembers={async (groupId, newMembers) => {
            try {
              await fetch("/api/admin/group/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: groupId,
                  members: newMembers,
                }),
              });
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}

      {/* Reply Banner */}
      {replyToMsg && (
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0 z-20">
          <div className="flex items-center gap-2 truncate">
            <Reply className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Replying to <b>{replyToMsg.sender}</b>:</span>
            <span className="text-slate-400 truncate">{replyToMsg.msg || replyToMsg.filename}</span>
          </div>
          <button onClick={() => setReplyToMsg(null)} className="text-slate-500 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Edit Message Banner */}
      {editingMsg && (
        <div className="px-4 py-2.5 bg-slate-900 border-t border-indigo-500/40 flex items-center justify-between gap-3 text-xs text-slate-200 shrink-0 z-20">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Pencil className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-bold text-indigo-300 shrink-0">Edit Message:</span>
            <input
              type="text"
              value={editMsgText}
              onChange={(e) => setEditMsgText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && editMsgText.trim()) {
                  socket.emit("edit_msg", {
                    msg_id: editingMsg.id,
                    new_text: editMsgText.trim(),
                    recipient: targetId,
                  });
                  setEditingMsg(null);
                }
              }}
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                if (editMsgText.trim()) {
                  socket.emit("edit_msg", {
                    msg_id: editingMsg.id,
                    new_text: editMsgText.trim(),
                    recipient: targetId,
                  });
                  setEditingMsg(null);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs"
            >
              Save
            </button>
            <button
              onClick={() => setEditingMsg(null)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress Dock for big files and folders (up to 2-3 GB+) */}
      {uploadProgress && (
        <UploadProgressDock
          progress={uploadProgress}
          onCancel={handleCancelUpload}
        />
      )}

      {/* Input Controls Bar - Fixed & Non-Scrollable */}
      <div className="sticky bottom-0 z-20 p-2 sm:p-3 px-3 sm:px-4 md:px-6 border-t border-slate-800/80 bg-slate-900/95 backdrop-blur-xl shrink-0 w-full max-w-full pb-[max(0.625rem,env(safe-area-inset-bottom,0px))]">
        {isRecordingVoice ? (
          /* Live Audio Recording Studio Bar */
          <div className="flex items-center justify-between w-full gap-2 sm:gap-3 py-1 animate-in fade-in slide-in-from-bottom-2 duration-200 min-h-[42px]">
            {/* Recording Indicator & Timer */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping absolute" />
                <span className="w-3.5 h-3.5 rounded-full bg-red-600 relative flex items-center justify-center">
                  <Mic className="w-2 h-2 text-white" />
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-red-400 font-mono tracking-wider">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
                </span>
                <span className="text-xs font-semibold text-slate-300 hidden sm:inline">
                  Recording audio clip...
                </span>
              </div>
            </div>

            {/* Dynamic Equalizer Visualizer Bars */}
            <div className="flex-1 flex items-center justify-center gap-1 max-w-[120px] sm:max-w-xs h-6 overflow-hidden px-2">
              {[...Array(18)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-red-500 to-rose-300 rounded-full animate-pulse"
                  style={{
                    height: `${Math.max(25, Math.sin((recordingTime * 2.5) + i * 0.7) * 75 + 25)}%`,
                    animationDelay: `${i * 60}ms`,
                    animationDuration: "500ms",
                  }}
                />
              ))}
            </div>

            {/* Cancel & Send Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={cancelRecording}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 font-semibold text-xs transition flex items-center gap-1.5 active:scale-95 border border-slate-700/60"
                title="Discard Recording"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Cancel</span>
              </button>

              <button
                type="button"
                onClick={stopAndSendRecording}
                className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-900/40 active:scale-95"
                title="Send Voice Message"
              >
                <Send className="w-4 h-4 fill-slate-950" />
                <span className="hidden sm:inline">Send Clip</span>
              </button>
            </div>
          </div>
        ) : (
          /* Standard Message Input Bar */
          <div className="flex items-center gap-1.5 sm:gap-2 w-full min-w-0">
            {/* File Attachment */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-sky-400 transition shrink-0"
              title="Attach File"
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Share Entire Folder Button */}
            <button
              onClick={() => folderInputRef.current?.click()}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-teal-400 transition shrink-0 relative group"
              title="Share Entire Folder"
            >
              <FolderUp className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
            </button>
            <input
              ref={folderInputRef}
              type="file"
              {...({ webkitdirectory: "", directory: "", multiple: true } as any)}
              onChange={handleFolderUpload}
              className="hidden"
            />

            {/* Emoji Picker Trigger */}
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowStickerPicker(false);
                }}
                className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition shrink-0"
                title="Emoji"
              >
                <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {showEmojiPicker && (
                <EmojiPicker
                  onSelectEmoji={(e) => {
                    setInputText((prev) => prev + e);
                  }}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </div>

            {/* Sticker Pack Picker Trigger */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowStickerPicker(!showStickerPicker);
                  setShowEmojiPicker(false);
                }}
                className={`p-2 sm:p-2.5 rounded-xl transition shrink-0 ${
                  showStickerPicker
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                    : "hover:bg-slate-800 text-slate-400 hover:text-indigo-400"
                }`}
                title="Stickers"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {showStickerPicker && (
                <StickerPicker
                  onSelectSticker={(sticker) => {
                    socket.emit("send_msg", {
                      sender: currentUser,
                      recipient: targetId,
                      type: "file",
                      subtype: "sticker",
                      filename: `${sticker.id}.svg`,
                      data: sticker.previewUrl,
                      msg: `${sticker.emoji} ${sticker.name}`,
                      delivered: true,
                      read: false,
                    });
                    setShowStickerPicker(false);
                  }}
                  onClose={() => setShowStickerPicker(false)}
                />
              )}
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message... (Shift+Enter for newline)"
              className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition resize-none leading-relaxed overflow-y-auto max-h-40 min-h-[40px]"
            />

            {/* Voice Recorder Button - Click or Hold */}
            <button
              type="button"
              onClick={startRecording}
              className="p-2.5 sm:p-2.5 rounded-xl transition shrink-0 min-w-[38px] min-h-[38px] flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-teal-400 active:scale-95"
              title="Click to Record Voice Message"
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              className="p-2.5 sm:p-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 transition shrink-0 flex items-center justify-center min-w-[38px] min-h-[38px] active:scale-95"
              title="Send Message"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Toast Notification for Telegram */}
      {telegramToast && (
        <div className="fixed top-5 right-5 z-50 bg-sky-600 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-sky-400/40 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{telegramToast}</span>
        </div>
      )}

      {/* Context Menu & Reactions Popup */}
      {contextMsg && contextPos && (() => {
        const menuWidth = 240;
        const menuHeight = 280;
        const screenWidth = typeof window !== "undefined" ? window.innerWidth : 400;
        const screenHeight = typeof window !== "undefined" ? window.innerHeight : 700;
        const safeX = Math.max(16, Math.min(contextPos.x, screenWidth - menuWidth - 16));
        const safeY = Math.max(16, Math.min(contextPos.y, screenHeight - menuHeight - 16));

        return (
          <div
            className="fixed inset-0 z-50 select-none bg-black/25 backdrop-blur-[1px]"
            onClick={() => setContextMsg(null)}
          >
            <div
              className="fixed bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl p-1.5 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150 min-w-[230px]"
              style={{ top: safeY, left: safeX }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Quick Reactions Bar */}
              <div className="flex items-center justify-between gap-1 p-1.5 bg-slate-950/80 rounded-xl border border-slate-800 mb-1.5">
                {["👍", "❤️", "😂", "😮", "😢", "🔥", "🩺", "✅"].map((em) => (
                  <button
                    key={em}
                    onClick={() => {
                      handleReaction(contextMsg.id, em);
                      setContextMsg(null);
                    }}
                    className="p-1 hover:bg-slate-800 hover:scale-125 transition rounded-lg text-base active:scale-95"
                  >
                    {em}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setReplyToMsg(contextMsg);
                  setContextMsg(null);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2 text-slate-200 transition"
              >
                <Reply className="w-3.5 h-3.5 text-sky-400" /> Reply
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(contextMsg.msg || contextMsg.filename || "");
                  setContextMsg(null);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2 text-slate-200 transition"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Text
              </button>

              {/* Forward Ticket to Telegram Bot */}
              {contextMsg.type === "ticket" || contextMsg.ticket_id ? (
                <button
                  onClick={async () => {
                    setContextMsg(null);
                    try {
                      const res = await fetch("/api/telegram/send", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ticket_id: contextMsg.ticket_id || contextMsg.ticket_details?.id,
                          text: `🎫 Forwarded Hospital Ticket #${contextMsg.ticket_id || contextMsg.ticket_details?.id}: ${contextMsg.msg || "Hospital Ticket"}`,
                        }),
                      });
                      const data = await res.json();
                      if (data.ok) {
                        setTelegramToast("Dispatched ticket to Telegram!");
                        setTimeout(() => setTelegramToast(null), 3000);
                      } else {
                        alert(data.m || "Failed to forward to Telegram");
                      }
                    } catch (e) {
                      alert("Error dispatching to Telegram");
                    }
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-500/15 flex items-center gap-2 text-sky-300 transition"
                >
                  <Send className="w-3.5 h-3.5 text-sky-400" /> Forward Ticket to Telegram Bot
                </button>
              ) : (
                !contextMsg.is_deleted && (
                  <button
                    onClick={async () => {
                      setContextMsg(null);
                      try {
                        const res = await fetch("/api/telegram/send", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            sender: currentUser,
                            text: `💬 <b>[HOSPITAL CHAT ISSUE REPORT]</b>\n👤 <b>Reported by:</b> ${contextMsg.sender}\n📨 <b>Forwarded by:</b> ${currentUser}\n📝 <b>Details:</b>\n${contextMsg.msg || "[Media Attachment]"}`,
                          }),
                        });
                        const data = await res.json();
                        if (data.ok) {
                          setTelegramToast("Dispatched issue to Telegram!");
                          setTimeout(() => setTelegramToast(null), 3000);
                        } else {
                          alert(data.m || "Failed to forward to Telegram");
                        }
                      } catch (e) {
                        alert("Error dispatching to Telegram");
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-500/15 flex items-center gap-2 text-sky-300 transition"
                  >
                    <Send className="w-3.5 h-3.5 text-sky-400" /> Forward Issue to Telegram Bot
                  </button>
                )
              )}

              {contextMsg.sender === currentUser && !contextMsg.is_deleted && contextMsg.type === "text" && (
                <button
                  onClick={() => {
                    setEditingMsg(contextMsg);
                    setEditMsgText(contextMsg.msg || "");
                    setContextMsg(null);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2 text-sky-400 transition"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Message
                </button>
              )}

              {contextMsg.sender === currentUser && (
                <button
                  onClick={() => {
                    socket.emit("delete_msg", { msg_id: contextMsg.id, recipient: targetId });
                    setContextMsg(null);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-400 flex items-center gap-2 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Call for Help Modal */}
      {helpModalTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                📢 Request Assistance / Call for Help
              </h3>
              <button
                onClick={() => setHelpModalTicketId(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Re-post Support Ticket #{helpModalTicketId} into the group channel with your comment so other available members or specialists can assist you.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Comment / Reason for Assistance:</label>
              <textarea
                value={helpNoteText}
                onChange={(e) => setHelpNoteText(e.target.value)}
                placeholder="e.g. Need additional biomedical engineer or senior staff assistance in Room 302..."
                rows={3}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setHelpModalTicketId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCallForHelp(helpModalTicketId)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-xs font-bold text-slate-950 transition shadow-lg shadow-amber-500/20"
              >
                📢 Call for Help
              </button>
            </div>
          </div>
        </div>
      )}
      {/* File Preview Modal Overlay */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl p-6 text-slate-100 shadow-2xl flex flex-col space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5 truncate max-w-md">
                <FileText className="w-5 h-5 text-sky-400 shrink-0" />
                <h3 className="text-sm font-bold text-slate-100 truncate">{previewFile.filename}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.url}
                  download={previewFile.filename}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition active:scale-95"
                >
                  <Download className="w-4 h-4" /> Download File
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition font-bold text-xs px-2.5"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-2 min-h-[300px]">
              {previewFile.subtype === "image" && (
                <img
                  src={previewFile.url}
                  alt={previewFile.filename}
                  className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-lg border border-slate-800"
                />
              )}

              {previewFile.subtype === "video" && (
                <video
                  src={previewFile.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[70vh] rounded-2xl shadow-lg border border-slate-800"
                />
              )}

              {previewFile.subtype === "audio" && (
                <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-4 min-w-[320px]">
                  <Music className="w-12 h-12 text-teal-400 mx-auto animate-bounce" />
                  <p className="font-bold text-sm text-slate-200">{previewFile.filename}</p>
                  <audio src={previewFile.url} controls autoPlay className="w-full" />
                </div>
              )}

              {previewFile.subtype === "doc" && (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-6 text-center bg-slate-950/80 rounded-2xl border border-slate-800">
                  {previewFile.filename.toLowerCase().endsWith(".pdf") || previewFile.url.startsWith("data:application/pdf") ? (
                    <iframe
                      src={previewFile.url}
                      className="w-full h-[65vh] rounded-xl border border-slate-800"
                      title={previewFile.filename}
                    />
                  ) : (
                    <>
                      <FileText className="w-16 h-16 text-sky-400" />
                      <p className="text-sm font-bold text-slate-200">{previewFile.filename}</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Document preview mode. Download or open the attached document directly below.
                      </p>
                      <a
                        href={previewFile.url}
                        download={previewFile.filename}
                        className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
                      >
                        <Download className="w-4 h-4" /> Save & Download Document
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Folder Content Inspector Modal */}
      {browsingFolder && (
        <FolderBrowseModal
          folderName={browsingFolder.folderName}
          typeInfo={browsingFolder.typeInfo}
          manifest={browsingFolder.manifest}
          downloadUrl={browsingFolder.downloadUrl}
          onClose={() => setBrowsingFolder(null)}
        />
      )}
    </div>
  );
};
