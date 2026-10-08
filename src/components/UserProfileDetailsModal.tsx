import React, { useState, useEffect, useRef } from "react";
import { User, FeedPost, FeedComment } from "../types";
import { socket } from "../lib/socket";
import {
  X,
  Phone,
  Video,
  MessageSquare,
  Mail,
  Building,
  Shield,
  Clock,
  Circle,
  FileText,
  Image as ImageIcon,
  Edit,
  Sparkles,
  Heart,
  Camera,
  Film,
  Send,
  Trash2,
  Share2,
  RefreshCw,
  Calendar,
} from "lucide-react";

interface Props {
  user: User;
  isOnline: boolean;
  currentUser: string;
  onClose: () => void;
  onStartChat: (username: string) => void;
  onStartCall: (username: string, type: "voice" | "video") => void;
  onStartMeeting?: (username: string) => void;
  onOpenMyProfile?: () => void;
}

export const UserProfileDetailsModal: React.FC<Props> = ({
  user,
  isOnline,
  currentUser,
  onClose,
  onStartChat,
  onStartCall,
  onStartMeeting,
  onOpenMyProfile,
}) => {
  const isMe = user.username === currentUser;
  const isBot =
    user.is_bot === true ||
    user.role === "bot" ||
    user.username === "BOT" ||
    user.username === "it_bot" ||
    user.bot_type === "it_triage";

  const displayName = isBot ? "BOT" : user.username === "it_bot" ? "BOT" : user.username;

  const [activeTab, setActiveTab] = useState<"profile" | "timeline">("profile");
  const [timelinePosts, setTimelinePosts] = useState<FeedPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Timeline post creation
  const [postText, setPostText] = useState("");
  const [mediaFile, setMediaFile] = useState<{
    dataUrl: string;
    filename: string;
    type: "image" | "video";
  } | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch user timeline posts
  const fetchTimeline = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/timeline/${encodeURIComponent(user.username)}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.posts)) {
        setTimelinePosts(data.posts);
      }
    } catch (err) {
      console.error("Error fetching timeline:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchTimeline();

    const handlePostCreated = (newPost: FeedPost) => {
      if (newPost.author.toLowerCase() === user.username.toLowerCase()) {
        setTimelinePosts((prev) => [newPost, ...prev.filter((p) => p.id !== newPost.id)]);
      }
    };

    const handlePostLiked = (data: { postId: string; likes: string[] }) => {
      setTimelinePosts((prev) =>
        prev.map((p) => (p.id === data.postId ? { ...p, likes: data.likes } : p))
      );
    };

    const handlePostCommented = (data: { postId: string; comment: FeedComment }) => {
      setTimelinePosts((prev) =>
        prev.map((p) =>
          p.id === data.postId
            ? { ...p, comments: [...(p.comments || []), data.comment] }
            : p
        )
      );
    };

    const handlePostDeleted = (data: { postId: string }) => {
      setTimelinePosts((prev) => prev.filter((p) => p.id !== data.postId));
    };

    socket.on("feed_post_created", handlePostCreated);
    socket.on("feed_post_liked", handlePostLiked);
    socket.on("feed_post_commented", handlePostCommented);
    socket.on("feed_post_deleted", handlePostDeleted);

    return () => {
      socket.off("feed_post_created", handlePostCreated);
      socket.off("feed_post_liked", handlePostLiked);
      socket.off("feed_post_commented", handlePostCommented);
      socket.off("feed_post_deleted", handlePostDeleted);
    };
  }, [user.username]);

  const handleSelectPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMediaFile({
        dataUrl: reader.result as string,
        filename: file.name,
        type: "image",
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSelectVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMediaFile({
        dataUrl: reader.result as string,
        filename: file.name,
        type: "video",
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCreateTimelinePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() && !mediaFile) return;

    setIsPosting(true);
    try {
      let mediaUrl = "";
      let mediaType: "none" | "image" | "video" = "none";
      let mediaName = "";

      if (mediaFile) {
        const upRes = await fetch("/api/upload_media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_data: mediaFile.dataUrl,
            filename: mediaFile.filename,
            type: mediaFile.type,
          }),
        });
        const upData = await upRes.json();
        if (upData.ok) {
          mediaUrl = upData.url;
          mediaType = upData.type;
          mediaName = upData.filename;
        } else {
          alert(`Upload failed: ${upData.m || "Unknown error"}`);
          setIsPosting(false);
          return;
        }
      }

      const res = await fetch("/api/feed/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: currentUser,
          content: postText.trim(),
          media_type: mediaType,
          media_url: mediaUrl,
          media_name: mediaName,
          scope: "public",
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setPostText("");
        setMediaFile(null);
      }
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      await fetch("/api/feed/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, username: currentUser }),
      });
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleComment = async (postId: string) => {
    const text = (commentInput[postId] || "").trim();
    if (!text) return;
    try {
      const res = await fetch("/api/feed/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, author: currentUser, text }),
      });
      const data = await res.json();
      if (data.ok) {
        setCommentInput((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await fetch("/api/feed/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, username: currentUser }),
      });
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  // Resolve avatar URL with support for data URLs, external URLs, uploads, and default bot avatar
  const getAvatarUrl = () => {
    if (user.image) {
      if (user.image.startsWith("data:") || user.image.startsWith("http") || user.image.startsWith("/")) {
        return user.image;
      }
      return `/uploads/${user.image}`;
    }
    if (isBot) {
      return "/uploads/bot_avatar.jpg";
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

  const formatLastSeen = (lastSeen?: string | null) => {
    if (isBot) return "Online 24/7";
    if (!lastSeen) return "Offline";
    try {
      const d = new Date(lastSeen);
      if (isNaN(d.getTime())) return "Offline";
      const diffMinutes = Math.floor((Date.now() - d.getTime()) / 60000);
      if (diffMinutes < 1) return "Seen just now";
      if (diffMinutes < 60) return `Seen ${diffMinutes} min ago`;
      return `Last seen ${d.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } catch (_) {
      return "Offline";
    }
  };

  const formatJoined = (joined?: string) => {
    if (isBot) return "Core System Diagnostic Bot";
    if (!joined) return "Staff Member";
    try {
      const d = new Date(joined);
      if (isNaN(d.getTime())) return "Staff Member";
      return d.toLocaleDateString([], { month: "long", year: "numeric" });
    } catch (_) {
      return "Staff Member";
    }
  };

  return (
    <div
      id="user-profile-details-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh] my-auto relative">
        {/* Scrollable Container */}
        <div className="overflow-y-auto w-full flex-1 flex flex-col pr-0.5">
          {/* Cover Photo Banner */}
          <div className="h-36 w-full relative bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-700 overflow-hidden shrink-0">
            {user.cover_image ? (
              <img
                src={
                  user.cover_image.startsWith("data:") ||
                  user.cover_image.startsWith("http") ||
                  user.cover_image.startsWith("/")
                    ? user.cover_image
                    : `/uploads/${user.cover_image}`
                }
                alt="Cover"
                className="w-full h-full object-cover brightness-90"
              />
            ) : isBot ? (
              <div className="w-full h-full bg-gradient-to-r from-cyan-900 via-slate-900 to-indigo-950 flex items-center justify-center opacity-90">
                <div className="w-full h-full opacity-30 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>
            ) : (
              <div className="w-full h-full opacity-60 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
            )}

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-black/40" />

            {/* Top Header Close Button */}
            <button
              id="close-profile-modal-btn"
              onClick={onClose}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-950/90 text-white flex items-center justify-center backdrop-blur-sm transition border border-white/10 z-10"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Avatar & Primary Info */}
          <div className="px-6 pb-6 pt-0 relative flex flex-col items-center text-center -mt-14">
            <div className="relative mb-3">
              <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-slate-900 shadow-2xl overflow-hidden flex items-center justify-center font-black text-2xl text-teal-300 ring-2 ring-teal-400/50">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (isBot && !e.currentTarget.src.includes("bot_avatar.png")) {
                        e.currentTarget.src = "/uploads/bot_avatar.png";
                      }
                    }}
                  />
                ) : (
                  displayName.substring(0, 2).toUpperCase()
                )}
              </div>
              {/* Status Dot */}
              <span
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-slate-900 shadow-md ${
                  isOnline || isBot ? "bg-emerald-500 ring-2 ring-emerald-400/30" : "bg-slate-500"
                }`}
                title={isOnline || isBot ? "Online Active" : "Offline"}
              />
            </div>

            {/* User Name & Badges */}
            <div className="flex items-center gap-2 mb-1 flex-wrap justify-center">
              <h3 className="text-xl font-bold text-white tracking-tight">{displayName}</h3>
              {isBot ? (
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> 24/7 AI Diagnostic Specialist
                </span>
              ) : user.role === "admin" ? (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3 text-indigo-400" /> Admin
                </span>
              ) : null}
              {user.source === "ad" && (
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-[10px] font-bold">
                  Active Directory
                </span>
              )}
            </div>

            {/* 1. Online / Last Seen Presence Line */}
            <div className="flex items-center gap-1.5 text-xs mb-2">
              <Circle
                className={`w-2 h-2 fill-current ${
                  isOnline || isBot ? "text-emerald-400" : "text-slate-500"
                }`}
              />
              <span className={isOnline || isBot ? "text-emerald-400 font-bold" : "text-slate-400"}>
                {isOnline || isBot ? "Online Active" : formatLastSeen(user.last_seen)}
              </span>
            </div>

            {/* 2. Bio / Specialization (Directly below Online/Last Seen status) */}
            <div className="w-full bg-slate-950/80 border border-teal-500/30 rounded-2xl p-3.5 mb-4 text-left shadow-inner">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-teal-400 uppercase tracking-wider mb-1">
                <FileText className="w-3.5 h-3.5" /> Bio / Specialization
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                {user.bio ||
                  (isBot
                    ? "Hospital Central IT Diagnostic & Triage Specialist. Available 24/7 to analyze technical issues, troubleshoot hospital workstations & medical systems, and automatically forward structured incident reports directly to the IT Support Team."
                    : user.status || "Hospital Clinical & Support Specialist")}
              </p>
            </div>

            {/* Custom Status Message if distinct from bio */}
            {user.status && user.status !== user.bio && (
              <div className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 mb-4 text-left">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Current Status Note
                </div>
                <p className="text-xs text-slate-300">{user.status}</p>
              </div>
            )}

            {/* Action Buttons */}
            {isBot ? (
              <div className="w-full mb-5">
                <button
                  id="profile-action-chat-btn"
                  onClick={() => {
                    onStartChat("it_bot");
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-900/30 active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Start Chat with BOT</span>
                </button>
              </div>
            ) : !isMe ? (
              <div className="grid grid-cols-3 gap-2 w-full mb-5">
                <button
                  id="profile-action-chat-btn"
                  onClick={() => {
                    onStartChat(user.username);
                    onClose();
                  }}
                  className="py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs flex flex-col items-center justify-center gap-1 transition shadow-lg shadow-teal-900/30 active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat</span>
                </button>

                <button
                  id="profile-action-voice-btn"
                  onClick={() => {
                    onStartCall(user.username, "voice");
                    onClose();
                  }}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 transition shadow-lg shadow-emerald-900/30 active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                  <span>Voice Call</span>
                </button>

                <button
                  id="profile-action-video-btn"
                  onClick={() => {
                    onStartCall(user.username, "video");
                    onClose();
                  }}
                  className="py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 transition shadow-lg shadow-sky-900/30 active:scale-95"
                >
                  <Video className="w-4 h-4" />
                  <span>Video Call</span>
                </button>
              </div>
            ) : (
              <div className="w-full mb-4">
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenMyProfile) onOpenMyProfile();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:bg-teal-500/30 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile & Cover Photo</span>
                </button>
              </div>
            )}

            {/* Tab Switcher: Profile Details vs Personal Timeline */}
            <div className="w-full flex gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === "profile"
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Profile Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("timeline")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === "timeline"
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> Timeline ({timelinePosts.length})
              </button>
            </div>

            {/* Profile Details Tab Content */}
            {activeTab === "profile" && (
              <div className="w-full space-y-2 text-left text-xs">
                {(user.department || isBot) && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <Building className="w-4 h-4 text-teal-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-slate-400">Department / Clinical Unit</div>
                      <div className="font-semibold text-slate-200 truncate">
                        {user.department || "Information Technology"}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-400">Official Email</div>
                    <div className="font-semibold text-slate-200 truncate">
                      {user.email || (isBot ? "it_bot@elitehospital.org" : `${user.username}@elitehospital.org`)}
                    </div>
                  </div>
                </div>

                {(user.phone || isBot) && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-slate-400">Internal Extension / Phone</div>
                      <div className="font-semibold text-slate-200 truncate">
                        {user.phone || "Ext. 8888 (IT Helpdesk)"}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-400">Hospital Directory Registered</div>
                    <div className="font-semibold text-slate-200 truncate">
                      {formatJoined(user.joined_at)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Tab Content */}
            {activeTab === "timeline" && (
              <div className="w-full space-y-3 text-left">
                {/* Post creation if viewing own profile */}
                {isMe && (
                  <form
                    onSubmit={handleCreateTimelinePost}
                    className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5 shadow-md"
                  >
                    <textarea
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      placeholder="Share a status update, photo, or clinical video to your timeline..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition resize-none"
                    />

                    {mediaFile && (
                      <div className="relative p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setMediaFile(null)}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-950/80 text-white flex items-center justify-center hover:bg-red-500 text-xs"
                        >
                          ✕
                        </button>
                        {mediaFile.type === "image" ? (
                          <img
                            src={mediaFile.dataUrl}
                            alt=""
                            className="w-full max-h-40 object-contain rounded-lg"
                          />
                        ) : (
                          <video
                            src={mediaFile.dataUrl}
                            controls
                            className="w-full max-h-40 rounded-lg bg-black"
                          />
                        )}
                        <span className="text-[10px] text-teal-400 block mt-1 truncate">
                          {mediaFile.filename}
                        </span>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleSelectPhoto}
                    />
                    <input
                      type="file"
                      ref={videoInputRef}
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      onChange={handleSelectVideo}
                    />

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-teal-400 text-xs flex items-center gap-1 transition"
                        >
                          <Camera className="w-3.5 h-3.5" /> Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 text-xs flex items-center gap-1 transition"
                        >
                          <Film className="w-3.5 h-3.5" /> Video
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isPosting || (!postText.trim() && !mediaFile)}
                        className="px-3 py-1 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 text-slate-950 font-bold text-xs flex items-center gap-1 transition disabled:text-slate-500"
                      >
                        {isPosting ? "Posting..." : "Share"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Timeline Posts List */}
                {loadingPosts ? (
                  <div className="p-6 text-center text-slate-400 space-y-1">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-400" />
                    <p className="text-xs">Loading timeline...</p>
                  </div>
                ) : timelinePosts.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/60 space-y-1">
                    <Calendar className="w-6 h-6 mx-auto text-slate-600" />
                    <p className="text-xs font-semibold text-slate-300">No posts on this timeline yet</p>
                    <p className="text-[11px]">Updates, photos, and videos will show up here.</p>
                  </div>
                ) : (
                  timelinePosts.map((post) => {
                    const isLiked = (post.likes || []).includes(currentUser);
                    const likeCount = (post.likes || []).length;
                    const commentList = post.comments || [];
                    const isCommentsOpen = openComments[post.id] ?? false;
                    const canDelete = post.author === currentUser || currentUser === "admin" || currentUser === "Elite";

                    return (
                      <div
                        key={post.id}
                        className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-md space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white text-xs">{post.author}</span>
                            <span className="text-[10px] text-slate-500 ml-2">
                              {new Date(post.created_at).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1 rounded text-slate-500 hover:text-red-400 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {post.content && (
                          <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {post.content}
                          </p>
                        )}

                        {post.media_url && (
                          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 max-h-72 flex items-center justify-center">
                            {post.media_type === "video" || post.media_url.match(/\.(mp4|webm|mov)$/i) ? (
                              <video
                                src={post.media_url}
                                controls
                                playsInline
                                className="w-full max-h-72 rounded-xl bg-black"
                              />
                            ) : (
                              <img
                                src={post.media_url}
                                alt=""
                                onClick={() => setLightboxImage(post.media_url!)}
                                className="w-full max-h-72 object-contain rounded-xl cursor-pointer hover:opacity-95"
                              />
                            )}
                          </div>
                        )}

                        {/* Likes & Comments Bar */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-slate-400">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleLike(post.id)}
                              className={`flex items-center gap-1 font-semibold transition ${
                                isLiked ? "text-rose-400" : "hover:text-rose-300"
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
                              <span>{likeCount}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setOpenComments((prev) => ({
                                  ...prev,
                                  [post.id]: !isCommentsOpen,
                                }))
                              }
                              className="flex items-center gap-1 hover:text-teal-300 transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{commentList.length}</span>
                            </button>
                          </div>
                        </div>

                        {/* Inline Comments */}
                        {isCommentsOpen && (
                          <div className="pt-2 border-t border-slate-800/60 space-y-2">
                            {commentList.map((cmt) => (
                              <div
                                key={cmt.id}
                                className="p-2 rounded-xl bg-slate-900 border border-slate-800/60 text-[11px]"
                              >
                                <span className="font-bold text-slate-200">{cmt.author}: </span>
                                <span className="text-slate-300">{cmt.text}</span>
                              </div>
                            ))}

                            <div className="flex items-center gap-1.5 pt-1">
                              <input
                                type="text"
                                value={commentInput[post.id] || ""}
                                onChange={(e) =>
                                  setCommentInput((prev) => ({ ...prev, [post.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleComment(post.id);
                                  }
                                }}
                                placeholder="Add a comment..."
                                className="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleComment(post.id)}
                                disabled={!commentInput[post.id]?.trim()}
                                className="p-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold disabled:opacity-40"
                              >
                                <Send className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Zoom */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in"
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxImage}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
