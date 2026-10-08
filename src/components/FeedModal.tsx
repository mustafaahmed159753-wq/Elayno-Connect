import React, { useState, useEffect, useRef } from "react";
import { User, FeedPost, FeedComment, FeedReactionType, FeedNotification } from "../types";
import { socket } from "../lib/socket";
import {
  X,
  Globe,
  Image as ImageIcon,
  Video,
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  Send,
  Sparkles,
  Shield,
  Film,
  Camera,
  RefreshCw,
  User as UserIcon,
  Filter,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Smile,
  AlertCircle,
  AtSign,
  ChevronDown,
} from "lucide-react";

interface Props {
  currentUser: string;
  usersMap: Record<string, User>;
  onClose: () => void;
  onViewUserProfile?: (user: User) => void;
}

const REACTION_CONFIG: Record<
  FeedReactionType,
  { label: string; emoji: string; color: string; bg: string; border: string }
> = {
  like: { label: "Like", emoji: "👍", color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30" },
  love: { label: "Love", emoji: "❤️", color: "text-rose-400", bg: "bg-rose-500/15", border: "border-rose-500/30" },
  wow: { label: "Wow", emoji: "😮", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  hug: { label: "Hug", emoji: "🤗", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
  dislike: { label: "Dislike", emoji: "👎", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30" },
};

export const FeedModal: React.FC<Props> = ({
  currentUser,
  usersMap,
  onClose,
  onViewUserProfile,
}) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "images" | "videos" | "my_posts" | "pending_review">("all");
  const [pendingCount, setPendingCount] = useState(0);

  // Notifications state
  const [notifications, setNotifications] = useState<FeedNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [adminAlertDismissed, setAdminAlertDismissed] = useState(false);

  // Post creation state
  const [newPostText, setNewPostText] = useState("");
  const [mediaFile, setMediaFile] = useState<{
    dataUrl: string;
    filename: string;
    type: "image" | "video";
    fileObj?: File;
  } | null>(null);
  const [postScope, setPostScope] = useState<"public" | "timeline">("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [shareSuccessId, setShareSuccessId] = useState<string | null>(null);

  // Reaction picker state: postId -> boolean
  const [activeReactionPicker, setActiveReactionPicker] = useState<string | null>(null);

  // Decline dialog state
  const [declineTarget, setDeclineTarget] = useState<FeedPost | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionTargetInput, setMentionTargetInput] = useState<"post" | string>("post"); // 'post' or postId for comment
  const [mentionCursorIndex, setMentionCursorIndex] = useState<number>(0);

  // Custom standalone GUI scope menu state
  const [isScopeMenuOpen, setIsScopeMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const postTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const scopeMenuRef = useRef<HTMLDivElement | null>(null);

  const safeUsersMap = usersMap || {};
  const me = safeUsersMap[currentUser] || { username: currentUser };
  const isAdmin = me.role === "admin" || currentUser === "admin" || currentUser === "Elite";

  const getAvatarUrl = (img?: string) => {
    if (!img) return null;
    if (img.startsWith("http") || img.startsWith("data:") || img.startsWith("/uploads/")) return img;
    return `/uploads/${img}`;
  };

  const myAvatarSrc = getAvatarUrl(me.image);

  // Handle click outside for notifications dropdown and scope menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showNotifications &&
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        isScopeMenuOpen &&
        scopeMenuRef.current &&
        !scopeMenuRef.current.contains(e.target as Node)
      ) {
        setIsScopeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications, isScopeMenuOpen]);

  // Fetch initial feed posts
  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/feed?username=${encodeURIComponent(currentUser)}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.posts)) {
        setPosts(data.posts);
        if (typeof data.pendingCount === "number") {
          setPendingCount(data.pendingCount);
        }
      }
    } catch (err) {
      console.error("Error fetching feed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/feed/notifications/${encodeURIComponent(currentUser)}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await fetch("/api/feed/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking notifications read:", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await fetch("/api/feed/notifications/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser }),
      });
      setNotifications([]);
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  useEffect(() => {
    fetchFeed();
    fetchNotifications();

    // Socket.io real-time listeners
    const handlePostCreated = (post: FeedPost) => {
      setPosts((prev) => {
        // If post already exists, update it, otherwise prepend
        const existingIdx = prev.findIndex((p) => p.id === post.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = post;
          return updated;
        }
        return [post, ...prev];
      });

      if ((post.status || "approved") === "pending" && isAdmin) {
        setPendingCount((prev) => prev + 1);
      }
    };

    const handlePostApproved = (post: FeedPost) => {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
      if (isAdmin) {
        setPendingCount((prev) => Math.max(0, prev - 1));
      }
    };

    const handlePostDeclined = (data: { postId: string; status: string; declined_reason?: string }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === data.postId
            ? { ...p, status: "declined" as any, declined_reason: data.declined_reason }
            : p
        )
      );
      if (isAdmin) {
        setPendingCount((prev) => Math.max(0, prev - 1));
      }
    };

    const handlePostReacted = (data: { postId: string; reactions: Record<string, FeedReactionType>; likes: string[] }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === data.postId ? { ...p, reactions: data.reactions, likes: data.likes } : p
        )
      );
    };

    const handlePostCommented = (data: { postId: string; comment: FeedComment }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === data.postId
            ? { ...p, comments: [...(p.comments || []), data.comment] }
            : p
        )
      );
    };

    const handlePostDeleted = (data: { postId: string }) => {
      setPosts((prev) => prev.filter((p) => p.id !== data.postId));
    };

    const handleFeedNotification = (notif: FeedNotification) => {
      if (notif.recipient.toLowerCase() === currentUser.toLowerCase()) {
        setNotifications((prev) => [notif, ...prev]);
      }
    };

    const handleAdminPendingAlert = (alertData: { postId: string; author: string; snippet: string }) => {
      if (isAdmin) {
        setPendingCount((prev) => prev + 1);
        const adminNotif: FeedNotification = {
          id: `admin_alert_${Date.now()}`,
          recipient: currentUser,
          sender: alertData.author,
          type: "pending_post_for_admin",
          postId: alertData.postId,
          postSnippet: alertData.snippet,
          message: `Post by @${alertData.author} requires your administrative review and approval.`,
          created_at: new Date().toISOString(),
          read: false,
        };
        setNotifications((prev) => [adminNotif, ...prev]);
      }
    };

    socket.on("feed_post_created", handlePostCreated);
    socket.on("feed_post_approved", handlePostApproved);
    socket.on("feed_post_declined", handlePostDeclined);
    socket.on("feed_post_reacted", handlePostReacted);
    socket.on("feed_post_commented", handlePostCommented);
    socket.on("feed_post_deleted", handlePostDeleted);
    socket.on("feed_notification", handleFeedNotification);
    socket.on("feed_admin_pending_alert", handleAdminPendingAlert);

    return () => {
      socket.off("feed_post_created", handlePostCreated);
      socket.off("feed_post_approved", handlePostApproved);
      socket.off("feed_post_declined", handlePostDeclined);
      socket.off("feed_post_reacted", handlePostReacted);
      socket.off("feed_post_commented", handlePostCommented);
      socket.off("feed_post_deleted", handlePostDeleted);
      socket.off("feed_notification", handleFeedNotification);
      socket.off("feed_admin_pending_alert", handleAdminPendingAlert);
    };
  }, [currentUser, isAdmin]);

  // Handle Photo selection
  const handleSelectPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setMediaFile({
        dataUrl: reader.result as string,
        filename: file.name,
        type: "image",
        fileObj: file,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Handle Video selection
  const handleSelectVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 80 * 1024 * 1024) {
      alert("Video file size is larger than 80MB. Please select a smaller clip.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMediaFile({
        dataUrl: reader.result as string,
        filename: file.name,
        type: "video",
        fileObj: file,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Handle typing & mention detection in post input
  const handlePostInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setNewPostText(val);

    // Check if user is typing a mention
    const textBeforeCursor = val.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setMentionTargetInput("post");
      setMentionCursorIndex(cursorPos);
    } else {
      setMentionQuery(null);
    }
  };

  // Handle typing & mention detection in comment input
  const handleCommentInputChange = (postId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart || val.length;
    setCommentInput((prev) => ({ ...prev, [postId]: val }));

    const textBeforeCursor = val.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setMentionTargetInput(postId);
      setMentionCursorIndex(cursorPos);
    } else {
      setMentionQuery(null);
    }
  };

  // Insert mention into current input
  const handleInsertMention = (username: string) => {
    if (mentionTargetInput === "post") {
      const textBeforeMention = newPostText.substring(0, mentionCursorIndex).replace(/@([a-zA-Z0-9_-]*)$/, `@${username} `);
      const textAfterMention = newPostText.substring(mentionCursorIndex);
      setNewPostText(textBeforeMention + textAfterMention);
      setMentionQuery(null);
      setTimeout(() => {
        postTextareaRef.current?.focus();
      }, 50);
    } else {
      const postId = mentionTargetInput;
      const currentVal = commentInput[postId] || "";
      const textBeforeMention = currentVal.substring(0, mentionCursorIndex).replace(/@([a-zA-Z0-9_-]*)$/, `@${username} `);
      const textAfterMention = currentVal.substring(mentionCursorIndex);
      setCommentInput((prev) => ({ ...prev, [postId]: textBeforeMention + textAfterMention }));
      setMentionQuery(null);
    }
  };

  // Submit new post
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() && !mediaFile) return;

    setIsSubmitting(true);
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
          setIsSubmitting(false);
          return;
        }
      }

      // Create post
      const postRes = await fetch("/api/feed/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: currentUser,
          content: newPostText.trim(),
          media_type: mediaType,
          media_url: mediaUrl,
          media_name: mediaName,
          scope: postScope,
        }),
      });

      const postData = await postRes.json();
      if (postData.ok) {
        setNewPostText("");
        setMediaFile(null);
        setMentionQuery(null);
        fetchFeed();
      } else {
        alert(`Failed to share post: ${postData.m || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error("Error creating post:", err);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // React to post (like, love, wow, hug, dislike)
  const handleReactToPost = async (postId: string, reaction: FeedReactionType) => {
    setActiveReactionPicker(null);
    try {
      const res = await fetch("/api/feed/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, username: currentUser, reaction }),
      });
      const data = await res.json();
      if (data.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, reactions: data.reactions, likes: data.likes } : p
          )
        );
      }
    } catch (err) {
      console.error("Error reacting to post:", err);
    }
  };

  // Approve post (Admin only)
  const handleApprovePost = async (postId: string) => {
    try {
      const res = await fetch("/api/feed/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, adminUsername: currentUser }),
      });
      const data = await res.json();
      if (data.ok) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
        setPendingCount((prev) => Math.max(0, prev - 1));
      } else {
        alert(`Approval error: ${data.m || "Failed"}`);
      }
    } catch (err) {
      console.error("Error approving post:", err);
    }
  };

  // Decline post (Admin only)
  const handleConfirmDeclinePost = async () => {
    if (!declineTarget) return;
    try {
      const res = await fetch("/api/feed/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: declineTarget.id,
          adminUsername: currentUser,
          reason: declineReason.trim() || "Post declined by administrator.",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === declineTarget.id
              ? { ...p, status: "declined", declined_reason: declineReason.trim() || "Declined by admin." }
              : p
          )
        );
        setPendingCount((prev) => Math.max(0, prev - 1));
        setDeclineTarget(null);
        setDeclineReason("");
      } else {
        alert(`Decline error: ${data.m || "Failed"}`);
      }
    } catch (err) {
      console.error("Error declining post:", err);
    }
  };

  // Submit Comment
  const handleSubmitComment = async (postId: string) => {
    const text = (commentInput[postId] || "").trim();
    if (!text) return;

    try {
      const res = await fetch("/api/feed/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          author: currentUser,
          text,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setCommentInput((prev) => ({ ...prev, [postId]: "" }));
        setMentionQuery(null);
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

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

  // Share post text/link
  const handleSharePost = (post: FeedPost) => {
    const shareText = `Elyano Hospital Intranet - Post by ${post.author}:\n"${post.content}"`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setShareSuccessId(post.id);
      setTimeout(() => setShareSuccessId(null), 2500);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    if (filter === "pending_review") {
      return (p.status || "approved") === "pending";
    }
    if (filter === "images") {
      return p.media_type === "image" || (p.media_url && !p.media_url.match(/\.(mp4|webm|mov)$/i));
    }
    if (filter === "videos") {
      return p.media_type === "video" || (p.media_url && p.media_url.match(/\.(mp4|webm|mov)$/i));
    }
    if (filter === "my_posts") {
      return p.author.toLowerCase() === currentUser.toLowerCase();
    }
    return true;
  });

  const formatPostTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (_) {
      return "Recently";
    }
  };

  // Helper to render text with interactive @mentions
  const renderTextWithMentions = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@[a-zA-Z0-9_-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const username = part.substring(1);
        const mentionedUser = safeUsersMap[username];
        return (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onViewUserProfile && mentionedUser) {
                onViewUserProfile(mentionedUser);
              }
            }}
            className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded-md bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-400 hover:text-teal-300 font-bold text-xs transition cursor-pointer"
            title={`View profile of @${username}`}
          >
            @{username}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Autocomplete matching users list
  const matchingUsers: User[] = mentionQuery !== null
    ? (Object.values(safeUsersMap) as User[]).filter(
        (u: User) =>
          u &&
          u.username &&
          u.username.toLowerCase().includes(mentionQuery.toLowerCase()) &&
          u.username.toLowerCase() !== currentUser.toLowerCase()
      ).slice(0, 5)
    : [];

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      id="feed-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col h-[92vh] max-h-[850px] relative">
        {/* Header */}
        <div className="px-3 sm:px-5 py-3 border-b border-slate-800/80 bg-slate-900/95 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Elyano Connect Official Logo */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 border border-teal-500/40 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
              <img
                src="/uploads/Elyanoconnect_logo.png"
                alt="Elyano Connect Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "block";
                }}
              />
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full hidden">
                <defs>
                  <linearGradient id="elyanoLogoHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00c4b4" />
                    <stop offset="50%" stopColor="#009688" />
                    <stop offset="100%" stopColor="#00796b" />
                  </linearGradient>
                </defs>
                <path d="M 68,124 C 42,95 48,50 92,44 C 98,43 72,78 82,108 C 92,128 112,102 152,36 C 128,66 106,98 90,118 C 76,138 68,132 68,124 Z" fill="url(#elyanoLogoHeader)" />
                <path d="M 94,70 L 148,38 C 150,36 151,41 144,46 L 90,78 C 88,79 89,72 94,70 Z" fill="url(#elyanoLogoHeader)" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-sm md:text-base font-black text-white tracking-tight truncate">
                  Elyano - Connect Public Community Feed
                </h2>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate hidden sm:block">
                Hospital staff clinical updates, case discussions & media
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Notifications Button */}
            <div className="relative shrink-0" ref={notificationsRef}>
              <button
                id="feed-notifications-toggle-btn"
                onClick={() => {
                  setShowNotifications((prev) => !prev);
                  if (!showNotifications && unreadNotificationsCount > 0) {
                    markNotificationsAsRead();
                  }
                }}
                className={`relative p-2 rounded-xl transition ${
                  showNotifications
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                    : "bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
                title="Community Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow">
                    {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Drawer - Anchored safely so it opens completely on both mobile and desktop */}
              {showNotifications && (
                <div
                  id="feed-notifications-dropdown"
                  className="absolute -right-[4.5rem] sm:right-0 top-full mt-2 w-[calc(100vw-3rem)] sm:w-96 max-w-sm sm:max-w-none bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="p-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-teal-400" />
                      <span className="font-bold text-xs text-white">Community Notifications</span>
                      {unreadNotificationsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                          {unreadNotificationsCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-slate-400 hover:text-rose-400 transition text-[11px]"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 p-1">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        <Bell className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                        No notifications yet. You will be alerted for mentions, reactions, and approvals.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-2.5 rounded-xl transition text-xs flex items-start gap-2.5 ${
                            !notif.read ? "bg-teal-500/10" : "hover:bg-slate-800/40"
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-teal-500/30 flex items-center justify-center shrink-0 text-[11px] font-bold text-teal-300">
                            {notif.type === "reaction" ? (
                              notif.reactionType ? REACTION_CONFIG[notif.reactionType]?.emoji || "👍" : "👍"
                            ) : notif.type === "post_approved" ? (
                              "✅"
                            ) : notif.type === "post_declined" ? (
                              "❌"
                            ) : notif.type === "pending_post_for_admin" ? (
                              "🛡️"
                            ) : notif.type === "mention" ? (
                              "@"
                            ) : (
                              "💬"
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-slate-200 text-xs leading-snug">{notif.message}</p>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {formatPostTime(notif.created_at)}
                            </span>
                          </div>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Reloading Button */}
            <button
              onClick={fetchFeed}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              title="Reload Feed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Exiting Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Exit Community Feed"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Admin Pending Posts Alert Banner */}
        {isAdmin && pendingCount > 0 && !adminAlertDismissed && (
          <div className="p-2.5 sm:p-3 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 text-amber-300 font-medium min-w-0">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">
                <strong className="font-bold">Admin Moderation Alert:</strong> {pendingCount} user post(s) awaiting review.
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setFilter("pending_review")}
                className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition text-[11px] shadow-sm"
              >
                Review
              </button>
              <button
                onClick={() => setAdminAlertDismissed(true)}
                className="p-1 rounded-lg text-amber-400 hover:text-amber-200"
                title="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Single Non-side-scrollable Line: Profile Photo -> All Updates -> Photos -> Videos -> My Posts */}
        <div className="px-2.5 sm:px-4 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center gap-1 sm:gap-1.5 w-full shrink-0 overflow-hidden select-none">
          {/* User Profile Photo */}
          <button
            type="button"
            onClick={() => onViewUserProfile && onViewUserProfile(me)}
            className="cursor-pointer shrink-0 group focus:outline-none"
            title={`Signed in as ${currentUser} - Click to view profile`}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 border border-teal-500/40 overflow-hidden flex items-center justify-center shrink-0 group-hover:border-teal-400 transition shadow-sm">
              {myAvatarSrc ? (
                <img src={myAvatarSrc} alt={currentUser} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-[10px] sm:text-[11px] text-teal-300">
                  {currentUser.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          </button>

          {/* Filter Action Buttons in ONE non-scrollable line */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
            {/* 1: All Updates */}
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`flex-1 min-w-0 py-1 sm:py-1.5 px-1 sm:px-1.5 rounded-xl text-[10px] sm:text-xs font-semibold transition text-center truncate ${
                filter === "all"
                  ? "bg-teal-500/20 border border-teal-500/40 text-teal-300 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
              }`}
            >
              All Updates
            </button>

            {/* 2: Photos */}
            <button
              type="button"
              onClick={() => setFilter("images")}
              className={`flex-1 min-w-0 py-1 sm:py-1.5 px-1 sm:px-1.5 rounded-xl text-[10px] sm:text-xs font-semibold transition flex items-center justify-center gap-1 truncate ${
                filter === "images"
                  ? "bg-teal-500/20 border border-teal-500/40 text-teal-300 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
              }`}
            >
              <ImageIcon className="w-3 h-3 shrink-0" />
              <span className="truncate">Photos</span>
            </button>

            {/* 3: Videos */}
            <button
              type="button"
              onClick={() => setFilter("videos")}
              className={`flex-1 min-w-0 py-1 sm:py-1.5 px-1 sm:px-1.5 rounded-xl text-[10px] sm:text-xs font-semibold transition flex items-center justify-center gap-1 truncate ${
                filter === "videos"
                  ? "bg-teal-500/20 border border-teal-500/40 text-teal-300 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Film className="w-3 h-3 shrink-0" />
              <span className="truncate">Videos</span>
            </button>

            {/* 4: Ending with My Posts */}
            <button
              type="button"
              onClick={() => setFilter("my_posts")}
              className={`flex-1 min-w-0 py-1 sm:py-1.5 px-1 sm:px-1.5 rounded-xl text-[10px] sm:text-xs font-semibold transition flex items-center justify-center gap-1 truncate ${
                filter === "my_posts"
                  ? "bg-teal-500/20 border border-teal-500/40 text-teal-300 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
              }`}
            >
              <UserIcon className="w-3 h-3 shrink-0" />
              <span className="truncate">My Posts</span>
            </button>
          </div>
        </div>

        {/* Scrollable Feed Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* Create New Post Box */}
          <form
            onSubmit={handleSubmitPost}
            className="p-3 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-md space-y-3 relative overflow-visible"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-teal-500/40 flex items-center justify-center font-bold text-teal-300 shrink-0 overflow-hidden text-xs">
                {myAvatarSrc ? (
                  <img src={myAvatarSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser.substring(0, 2).toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0 relative">
                <textarea
                  ref={postTextareaRef}
                  value={newPostText}
                  onChange={handlePostInputChange}
                  placeholder={`What's happening in your department, ${currentUser}? Type @ to mention colleagues...`}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition resize-none"
                />

                {/* Autocomplete Mentions Popover */}
                {mentionQuery !== null && mentionTargetInput === "post" && matchingUsers.length > 0 && (
                  <div className="absolute left-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden">
                    <div className="px-3 py-1.5 bg-slate-950 text-[10px] font-bold text-teal-400 border-b border-slate-800 flex items-center gap-1">
                      <AtSign className="w-3 h-3" /> Mention Colleague
                    </div>
                    <div className="max-h-36 overflow-y-auto">
                      {matchingUsers.map((u) => (
                        <button
                          key={u.username}
                          type="button"
                          onClick={() => handleInsertMention(u.username)}
                          className="w-full px-3 py-2 text-left text-xs hover:bg-slate-800 flex items-center gap-2 transition"
                        >
                          <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-100 truncate">@{u.username}</span>
                          <span className="text-[10px] text-slate-400 ml-auto truncate">{u.department || u.role}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Media Preview Box */}
                {mediaFile && (
                  <div className="relative mt-2 p-2 bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden max-h-60">
                    <button
                      type="button"
                      onClick={() => setMediaFile(null)}
                      className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-950/80 text-white flex items-center justify-center hover:bg-red-500 transition z-10"
                      title="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {mediaFile.type === "image" ? (
                      <img
                        src={mediaFile.dataUrl}
                        alt="Preview"
                        className="w-full max-h-52 object-contain rounded-lg"
                      />
                    ) : (
                      <video
                        src={mediaFile.dataUrl}
                        controls
                        className="w-full max-h-52 rounded-lg bg-black"
                      />
                    )}
                    <div className="mt-1 text-[11px] text-teal-400 font-medium truncate">
                      {mediaFile.type === "image" ? "📷 Image: " : "🎥 Video: "}
                      {mediaFile.filename}
                    </div>
                  </div>
                )}

                {/* Non-admin notice */}
                {!isAdmin && (
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-teal-400" />
                    Community safety note: Non-admin posts are submitted for administrator approval before publishing.
                  </p>
                )}
              </div>
            </div>

            {/* Hidden File Inputs */}
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
              accept="video/mp4,video/webm,video/quicktime,video/mkv"
              className="hidden"
              onChange={handleSelectVideo}
            />

            {/* Post Action Buttons */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-teal-400 text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition shrink-0"
                  title="Attach Photo"
                >
                  <Camera className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xs:inline text-[11px] sm:text-xs">Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition shrink-0"
                  title="Attach Video"
                >
                  <Video className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xs:inline text-[11px] sm:text-xs">Video</span>
                </button>

                {/* Standalone GUI Scope Selector: Contained within borders */}
                <div className="relative shrink-0 min-w-0" ref={scopeMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsScopeMenuOpen((prev) => !prev)}
                    className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition shadow-sm max-w-[125px] sm:max-w-[155px]"
                    title="Choose Feed Destination"
                  >
                    {postScope === "public" ? (
                      <>
                        <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="truncate text-xs">Public Feed</span>
                      </>
                    ) : (
                      <>
                        <UserIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="truncate text-xs">My Timeline</span>
                      </>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${isScopeMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Floating Menu Contained in View */}
                  {isScopeMenuOpen && (
                    <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 bottom-full mb-2 w-52 sm:w-56 max-w-[calc(100vw-2rem)] bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1">
                        Select Destination
                      </div>

                      {/* Option 1: Public Community Feed */}
                      <button
                        type="button"
                        onClick={() => {
                          setPostScope("public");
                          setIsScopeMenuOpen(false);
                        }}
                        className={`w-full p-2 rounded-xl text-left transition flex items-start gap-2 ${
                          postScope === "public"
                            ? "bg-teal-500/15 border border-teal-500/30 text-teal-200"
                            : "hover:bg-slate-800 text-slate-300 hover:text-white"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">Public Feed</span>
                            {postScope === "public" && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                            Visible to all staff
                          </p>
                        </div>
                      </button>

                      {/* Option 2: My Timeline Only */}
                      <button
                        type="button"
                        onClick={() => {
                          setPostScope("timeline");
                          setIsScopeMenuOpen(false);
                        }}
                        className={`w-full p-2 rounded-xl text-left transition flex items-start gap-2 mt-1 ${
                          postScope === "timeline"
                            ? "bg-sky-500/15 border border-sky-500/30 text-sky-200"
                            : "hover:bg-slate-800 text-slate-300 hover:text-white"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                          <UserIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">My Timeline</span>
                            {postScope === "timeline" && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                            Private to your profile
                          </p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Post Button */}
              <button
                type="submit"
                disabled={isSubmitting || (!newPostText.trim() && !mediaFile)}
                className={`px-3.5 sm:px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm shrink-0 ${
                  isSubmitting || (!newPostText.trim() && !mediaFile)
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-teal-500 to-sky-500 text-slate-950 hover:brightness-110"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAdmin ? "Share Post" : "Post"}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Posts Stream */}
          {loading ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-400" />
              <p className="text-xs">Loading community feed...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2 bg-slate-950/40 rounded-2xl border border-slate-800/60">
              <Globe className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">
                {filter === "pending_review" ? "No posts pending review" : "No posts in this category yet"}
              </p>
              <p className="text-xs">
                {filter === "pending_review"
                  ? "All user posts have been moderated and approved."
                  : "Be the first to share a clinical update, photo, or video!"}
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const authorUser = safeUsersMap[post.author] || { username: post.author };
              const postStatus = post.status || "approved";
              const isPending = postStatus === "pending";
              const isDeclined = postStatus === "declined";
              const commentList = post.comments || [];
              const isCommentsOpen = openComments[post.id] ?? false;
              const isAuthor = post.author.toLowerCase() === currentUser.toLowerCase();

              const authorAvatar = getAvatarUrl(authorUser.image);

              // Reactions calculation
              const reactionsMap: Record<string, FeedReactionType> = post.reactions || {};
              const userReaction: FeedReactionType | undefined = reactionsMap[currentUser];

              // Count by reaction type
              const reactionCounts: Record<FeedReactionType, number> = {
                like: 0,
                love: 0,
                wow: 0,
                hug: 0,
                dislike: 0,
              };
              Object.values(reactionsMap).forEach((r) => {
                if (reactionCounts[r] !== undefined) {
                  reactionCounts[r]++;
                }
              });
              const totalReactionsCount = Object.keys(reactionsMap).length;

              return (
                <div
                  key={post.id}
                  id={`post-${post.id}`}
                  className={`p-4 rounded-2xl bg-slate-950/80 border shadow-md space-y-3 transition relative ${
                    isPending
                      ? "border-amber-500/50 bg-amber-950/10"
                      : isDeclined
                      ? "border-red-500/40 opacity-75"
                      : "border-slate-800/80 hover:border-slate-700/80"
                  }`}
                >
                  {/* Status Banner for Pending / Declined posts */}
                  {isPending && (
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-amber-300 font-medium">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          {isAdmin
                            ? `Pending Admin Review: Submitted by ${post.author}`
                            : "Your post is pending administrator review before appearing publicly"}
                        </span>
                      </div>

                      {/* Admin Quick Action Buttons */}
                      {isAdmin && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleApprovePost(post.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => {
                              setDeclineTarget(post);
                              setDeclineReason("");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-bold text-[11px] flex items-center gap-1 transition"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {isDeclined && (
                    <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>Post declined by administrator. Reason: {post.declined_reason || "Policy moderation"}</span>
                    </div>
                  )}

                  {/* Post Header */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onViewUserProfile && onViewUserProfile(authorUser)}
                      className="flex items-center gap-2.5 text-left group min-w-0"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-teal-500/30 flex items-center justify-center font-bold text-teal-300 overflow-hidden shrink-0 text-xs group-hover:ring-2 group-hover:ring-teal-400/50 transition">
                        {authorAvatar ? (
                          <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          post.author.substring(0, 2).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-white group-hover:text-teal-300 transition-colors">
                            {post.author}
                          </span>
                          {authorUser.role === "admin" && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold">
                              Admin
                            </span>
                          )}
                          {authorUser.source === "ad" && (
                            <span className="px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[9px] font-bold">
                              AD Staff
                            </span>
                          )}
                          {post.scope === "timeline" && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                              Timeline
                            </span>
                          )}
                          {postStatus === "approved" && post.approved_by && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                              Approved
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {authorUser.department || authorUser.status || "Hospital Staff"} • {formatPostTime(post.created_at)}
                        </p>
                      </div>
                    </button>

                    {(isAuthor || isAdmin) && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition shrink-0"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Post Content Text with interactive Mentions */}
                  {post.content && (
                    <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {renderTextWithMentions(post.content)}
                    </div>
                  )}

                  {/* Post Media (Image or Video) */}
                  {post.media_url && (
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 max-h-96 flex items-center justify-center">
                      {post.media_type === "video" || post.media_url.match(/\.(mp4|webm|mov)$/i) ? (
                        <video
                          src={post.media_url}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full max-h-96 rounded-xl bg-black"
                        />
                      ) : (
                        <img
                          src={post.media_url}
                          alt="Post attachment"
                          onClick={() => setLightboxImage(post.media_url!)}
                          className="w-full max-h-96 object-contain rounded-xl cursor-pointer hover:opacity-95 transition"
                        />
                      )}
                    </div>
                  )}

                  {/* Reactions Summary Badges Bar */}
                  {totalReactionsCount > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {(["like", "love", "wow", "hug", "dislike"] as FeedReactionType[]).map((rKey) => {
                        const count = reactionCounts[rKey];
                        if (count === 0) return null;
                        const cfg = REACTION_CONFIG[rKey];
                        const isSelectedByMe = userReaction === rKey;
                        return (
                          <button
                            key={rKey}
                            onClick={() => handleReactToPost(post.id, rKey)}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 transition ${
                              isSelectedByMe
                                ? `${cfg.bg} ${cfg.color} border ${cfg.border} ring-1 ring-teal-400/30`
                                : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
                            }`}
                            title={`${count} people reacted ${cfg.label}`}
                          >
                            <span>{cfg.emoji}</span>
                            <span>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Interaction Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-slate-400 text-xs relative">
                    <div className="flex items-center gap-3 relative">
                      {/* Interactive Reaction Button with Dropdown Hover/Click Picker */}
                      <div
                        className="relative"
                        onMouseLeave={() => {
                          // Allow delay before closing
                        }}
                      >
                        <button
                          onClick={() =>
                            setActiveReactionPicker((prev) => (prev === post.id ? null : post.id))
                          }
                          className={`flex items-center gap-1.5 font-semibold transition px-2 py-1 rounded-xl ${
                            userReaction
                              ? `${REACTION_CONFIG[userReaction]?.bg} ${REACTION_CONFIG[userReaction]?.color} border ${REACTION_CONFIG[userReaction]?.border}`
                              : "hover:bg-slate-900 hover:text-teal-300"
                          }`}
                        >
                          <span className="text-sm">
                            {userReaction ? REACTION_CONFIG[userReaction]?.emoji : "👍"}
                          </span>
                          <span>{userReaction ? REACTION_CONFIG[userReaction]?.label : "React"}</span>
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </button>

                        {/* Floating Reaction Bar with 5 requested reactions */}
                        {activeReactionPicker === post.id && (
                          <div className="absolute left-0 bottom-full mb-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                            {(["like", "love", "wow", "hug", "dislike"] as FeedReactionType[]).map((rKey) => {
                              const cfg = REACTION_CONFIG[rKey];
                              const isSelected = userReaction === rKey;
                              return (
                                <button
                                  key={rKey}
                                  type="button"
                                  onClick={() => handleReactToPost(post.id, rKey)}
                                  className={`p-2 rounded-xl transition transform hover:scale-125 flex flex-col items-center gap-0.5 ${
                                    isSelected
                                      ? `${cfg.bg} border ${cfg.border}`
                                      : "hover:bg-slate-800/80"
                                  }`}
                                  title={cfg.label}
                                >
                                  <span className="text-xl">{cfg.emoji}</span>
                                  <span className="text-[9px] font-bold text-slate-300">{cfg.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Comments Toggle Button */}
                      <button
                        onClick={() =>
                          setOpenComments((prev) => ({
                            ...prev,
                            [post.id]: !isCommentsOpen,
                          }))
                        }
                        className="flex items-center gap-1.5 hover:text-teal-300 font-semibold transition px-2 py-1 rounded-xl hover:bg-slate-900"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{commentList.length} Comments</span>
                      </button>
                    </div>

                    {/* Share Button */}
                    <button
                      onClick={() => handleSharePost(post)}
                      className="flex items-center gap-1 hover:text-sky-300 transition text-[11px] px-2 py-1 rounded-xl hover:bg-slate-900"
                      title="Share post"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{shareSuccessId === post.id ? "Copied!" : "Share"}</span>
                    </button>
                  </div>

                  {/* Inline Comments Section */}
                  {isCommentsOpen && (
                    <div className="pt-2 border-t border-slate-800/60 space-y-2.5">
                      {commentList.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {commentList.map((cmt) => {
                            const cmtUser = safeUsersMap[cmt.author] || { username: cmt.author };
                            const cmtAvatar = getAvatarUrl(cmtUser.image);
                            return (
                              <div
                                key={cmt.id}
                                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/60 flex items-start gap-2 text-xs"
                              >
                                <button
                                  type="button"
                                  onClick={() => onViewUserProfile && onViewUserProfile(cmtUser)}
                                  className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-teal-400 shrink-0 overflow-hidden cursor-pointer hover:border-teal-400 transition"
                                  title={`View ${cmt.author}'s profile`}
                                >
                                  {cmtAvatar ? (
                                    <img src={cmtAvatar} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    cmt.author.substring(0, 2).toUpperCase()
                                  )}
                                </button>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <button
                                      type="button"
                                      onClick={() => onViewUserProfile && onViewUserProfile(cmtUser)}
                                      className="font-bold text-slate-200 hover:text-teal-300 transition text-left cursor-pointer"
                                    >
                                      {cmt.author}
                                    </button>
                                    <span className="text-[10px] text-slate-500">
                                      {formatPostTime(cmt.created_at)}
                                    </span>
                                  </div>
                                  <div className="text-slate-300 mt-0.5 whitespace-pre-wrap">
                                    {renderTextWithMentions(cmt.text)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add Comment Input with Mention support */}
                      <div className="relative pt-1">
                        {/* Mention Suggestions for comment */}
                        {mentionQuery !== null && mentionTargetInput === post.id && matchingUsers.length > 0 && (
                          <div className="absolute left-0 bottom-full mb-1 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden">
                            <div className="px-3 py-1 bg-slate-950 text-[10px] font-bold text-teal-400 border-b border-slate-800 flex items-center gap-1">
                              <AtSign className="w-3 h-3" /> Mention Colleague
                            </div>
                            <div className="max-h-32 overflow-y-auto">
                              {matchingUsers.map((u) => (
                                <button
                                  key={u.username}
                                  type="button"
                                  onClick={() => handleInsertMention(u.username)}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-800 flex items-center gap-2 transition"
                                >
                                  <span className="font-semibold text-slate-100 truncate">@{u.username}</span>
                                  <span className="text-[10px] text-slate-400 ml-auto truncate">{u.department || u.role}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={commentInput[post.id] || ""}
                            onChange={(e) => handleCommentInputChange(post.id, e)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitComment(post.id);
                              }
                            }}
                            placeholder="Write a comment or type @ to mention..."
                            className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                          />
                          <button
                            onClick={() => handleSubmitComment(post.id)}
                            disabled={!commentInput[post.id]?.trim()}
                            className="p-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 text-slate-950 font-bold transition disabled:text-slate-500"
                            title="Post comment"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Decline Reason Modal Dialog */}
      {declineTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-red-400 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" /> Decline Post by {declineTarget.author}
              </h3>
              <button
                onClick={() => setDeclineTarget(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Provide an administrative explanation or reason for the author:
            </p>

            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Clinical privacy guidelines, sensitive patient info, inappropriate media..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeclineTarget(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeclinePost}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Viewer */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 animate-in fade-in"
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
