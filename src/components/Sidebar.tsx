import React, { useState } from "react";
import { User, Group, Message } from "../types";
import { EliteLogo } from "./EliteLogo";
import { requestNotificationPermission } from "../lib/notifications";
import {
  Search,
  Users,
  MessageSquare,
  Plus,
  Ticket,
  PhoneCall,
  Palette,
  LogOut,
  UserCheck,
  Shield,
  Circle,
  Clock,
  Sparkles,
  Settings,
  ShieldCheck,
  Laptop,
  Bell,
  Globe,
  Rss,
  BookUser,
  Check,
  CheckCheck,
  Pin,
} from "lucide-react";

interface Props {
  currentUser: string;
  usersMap: Record<string, User>;
  onlineList: string[];
  groups: Group[];
  unreadCounts: Record<string, number>;
  selectedChatId: string | null;
  onSelectChat: (id: string, type: "user" | "group") => void;
  onViewProfile?: (user: User) => void;
  onOpenTicketModal: () => void;
  onOpenCallLogModal: () => void;
  onOpenThemeModal: () => void;
  onOpenProfileModal: () => void;
  onOpenGroupModal: () => void;
  onOpenAdminModal: () => void;
  onOpenDeviceModal: () => void;
  onOpenFeedModal?: () => void;
  onOpenPhoneNotebookModal?: () => void;
  messages?: Message[];
  pinnedChatIds?: string[];
  onTogglePinChat?: (chatId: string, e?: React.MouseEvent) => void;
  onLogout: () => void;
  className?: string;
}

export const Sidebar: React.FC<Props> = ({
  currentUser,
  usersMap,
  onlineList,
  groups,
  unreadCounts,
  selectedChatId,
  onSelectChat,
  onViewProfile,
  onOpenTicketModal,
  onOpenCallLogModal,
  onOpenThemeModal,
  onOpenProfileModal,
  onOpenGroupModal,
  onOpenAdminModal,
  onOpenDeviceModal,
  onOpenFeedModal,
  onOpenPhoneNotebookModal,
  messages = [],
  pinnedChatIds: propPinnedChatIds,
  onTogglePinChat: propOnTogglePinChat,
  onLogout,
  className = "",
}) => {
  const [search, setSearch] = useState("");
  const [onlineSearch, setOnlineSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "direct" | "groups">("all");
  const [showOnlineModal, setShowOnlineModal] = useState(false);

  // Persistent Pinned Chats State per User
  const [localPinnedChatIds, setLocalPinnedChatIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`elyano_pinned_chats_${currentUser}`);
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const pinnedChatIds = propPinnedChatIds ?? localPinnedChatIds;

  const togglePinChat = (chatId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (propOnTogglePinChat) {
      propOnTogglePinChat(chatId, e);
    } else {
      setLocalPinnedChatIds((prev) => {
        const isPinned = prev.includes(chatId);
        const next = isPinned ? prev.filter((id) => id !== chatId) : [chatId, ...prev];
        try {
          localStorage.setItem(`elyano_pinned_chats_${currentUser}`, JSON.stringify(next));
        } catch (_) {}
        return next;
      });
    }
  };

  const me = usersMap[currentUser] || { username: currentUser };

  const isMyRoleAdmin = me.role === "admin";
  const canSeeAll = isMyRoleAdmin || me.can_see_all_users !== false;
  const allowedList = me.visible_users || [];

  const allUserKeys = Array.from(new Set([...Object.keys(usersMap), ...onlineList]));
  // Deduplicate bot keys: use "it_bot" as canonical key for chat selection, but display as "BOT"
  const dedupedUserKeys = allUserKeys.filter((u) => {
    if (u === "BOT" && allUserKeys.includes("it_bot")) return false;
    return true;
  });

  const allUsers = dedupedUserKeys.filter((u) => {
    if (u === currentUser) return false;
    if (canSeeAll) return true;
    if (usersMap[u]?.role === "admin") return true;
    return allowedList.includes(u);
  });

  const myGroups = groups.filter((g) => g.members.includes(currentUser));

  // Helper to extract the most recent message info (timestamp, preview snippet, time string)
  const getChatLatestInfo = (chatId: string, isGroup: boolean) => {
    if (!messages || messages.length === 0) {
      return { latestTime: 0, preview: "", timeStr: "" };
    }

    let chatMsgs: Message[] = [];
    if (isGroup) {
      chatMsgs = messages.filter((m) => m.recipient === chatId && !m.is_deleted);
    } else {
      const isITBot = chatId === "it_bot" || chatId === "BOT";
      const isInfoBot = chatId === "info_bot";
      chatMsgs = messages.filter((m) => {
        if (m.is_deleted) return false;
        if (m.recipient.startsWith("group_")) return false;
        if (isITBot) {
          return (
            (m.sender === currentUser && (m.recipient === "it_bot" || m.recipient === "BOT")) ||
            ((m.sender === "it_bot" || m.sender === "BOT") && m.recipient === currentUser)
          );
        }
        if (isInfoBot) {
          return (
            (m.sender === currentUser && m.recipient === "info_bot") ||
            (m.sender === "info_bot" && m.recipient === currentUser)
          );
        }
        return (
          (m.sender === currentUser && m.recipient === chatId) ||
          (m.sender === chatId && m.recipient === currentUser)
        );
      });
    }

    if (chatMsgs.length === 0) {
      return { latestTime: 0, preview: "", timeStr: "" };
    }

    const lastMsg = chatMsgs[chatMsgs.length - 1];
    let latestTime = 0;
    try {
      latestTime = new Date(lastMsg.timestamp).getTime();
      if (isNaN(latestTime)) latestTime = Number(lastMsg.id) || 0;
    } catch (_) {
      latestTime = Number(lastMsg.id) || 0;
    }

    let preview = "";
    const isMe = lastMsg.sender === currentUser;
    if (lastMsg.type === "file") {
      preview = `📎 ${
        lastMsg.subtype === "image"
          ? "Photo"
          : lastMsg.subtype === "video"
          ? "Video"
          : "File"
      }: ${lastMsg.filename || "Attachment"}`;
    } else {
      preview = lastMsg.msg || "";
    }

    let timeStr = "";
    try {
      const d = new Date(lastMsg.timestamp);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      if (isToday) {
        timeStr = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      } else if (isYesterday) {
        timeStr = "Yesterday";
      } else {
        timeStr = d.toLocaleDateString([], { month: "short", day: "numeric" });
      }
    } catch (_) {
      timeStr = "";
    }

    return {
      latestTime,
      preview,
      timeStr,
      isMe,
      read: Boolean(lastMsg.read),
      delivered: Boolean(lastMsg.delivered),
    };
  };

  // Sort Users: pinned chats first, then unread, then recent activity
  const sortedUsers = allUsers
    .filter((u) => {
      const isBotUser = u === "it_bot" || u === "BOT" || usersMap[u]?.is_bot;
      const searchName = isBotUser ? "bot" : u.toLowerCase();
      return searchName.includes(search.toLowerCase()) || u.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const isPinnedA = pinnedChatIds.includes(a);
      const isPinnedB = pinnedChatIds.includes(b);

      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;
      if (isPinnedA && isPinnedB) {
        return pinnedChatIds.indexOf(a) - pinnedChatIds.indexOf(b);
      }

      const infoA = getChatLatestInfo(a, false);
      const infoB = getChatLatestInfo(b, false);
      const unreadA = unreadCounts[a] || 0;
      const unreadB = unreadCounts[b] || 0;

      // 1. Unread chats with new unread messages float to top
      if (unreadA > 0 && unreadB === 0) return -1;
      if (unreadB > 0 && unreadA === 0) return 1;

      // 2. Primary sorting: recent received messages first, then older
      if (infoA.latestTime > 0 || infoB.latestTime > 0) {
        if (infoA.latestTime !== infoB.latestTime) {
          return infoB.latestTime - infoA.latestTime;
        }
      }

      // 3. Fallback: Bot floats near top if no chat history
      const isBotA = a === "it_bot" || a === "BOT" || usersMap[a]?.is_bot;
      const isBotB = b === "it_bot" || b === "BOT" || usersMap[b]?.is_bot;
      if (isBotA && !isBotB) return -1;
      if (!isBotA && isBotB) return 1;

      // 4. Online presence
      const onlineA = onlineList.includes(a) || isBotA ? 1 : 0;
      const onlineB = onlineList.includes(b) || isBotB ? 1 : 0;
      if (onlineA !== onlineB) return onlineB - onlineA;

      return a.localeCompare(b);
    });

  // Sort Groups: pinned groups first, then unread, then recent activity
  const sortedGroups = myGroups
    .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const isPinnedA = pinnedChatIds.includes(a.id);
      const isPinnedB = pinnedChatIds.includes(b.id);

      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;
      if (isPinnedA && isPinnedB) {
        return pinnedChatIds.indexOf(a.id) - pinnedChatIds.indexOf(b.id);
      }

      const infoA = getChatLatestInfo(a.id, true);
      const infoB = getChatLatestInfo(b.id, true);
      const unreadA = unreadCounts[a.id] || 0;
      const unreadB = unreadCounts[b.id] || 0;

      if (unreadA > 0 && unreadB === 0) return -1;
      if (unreadB > 0 && unreadA === 0) return 1;

      if (infoA.latestTime > 0 || infoB.latestTime > 0) {
        if (infoA.latestTime !== infoB.latestTime) {
          return infoB.latestTime - infoA.latestTime;
        }
      }

      return a.name.localeCompare(b.name);
    });

  const filteredUsers = sortedUsers;
  const filteredGroups = sortedGroups;

  // Unified conversations for the "All" tab sorted by pinned first, then recent received messages
  type ConversationItem =
    | {
        type: "group";
        id: string;
        group: Group;
        latestTime: number;
        preview: string;
        timeStr: string;
        unread: number;
        isMe?: boolean;
        read?: boolean;
        delivered?: boolean;
        isPinned?: boolean;
      }
    | {
        type: "user";
        id: string;
        username: string;
        latestTime: number;
        preview: string;
        timeStr: string;
        unread: number;
        isMe?: boolean;
        read?: boolean;
        delivered?: boolean;
        isPinned?: boolean;
      };

  const allConversations: ConversationItem[] = [
    ...filteredGroups.map((g) => {
      const info = getChatLatestInfo(g.id, true);
      return {
        type: "group" as const,
        id: g.id,
        group: g,
        latestTime: info.latestTime,
        preview: info.preview,
        timeStr: info.timeStr,
        unread: unreadCounts[g.id] || 0,
        isMe: info.isMe,
        read: info.read,
        delivered: info.delivered,
        isPinned: pinnedChatIds.includes(g.id),
      };
    }),
    ...filteredUsers.map((u) => {
      const info = getChatLatestInfo(u, false);
      return {
        type: "user" as const,
        id: u,
        username: u,
        latestTime: info.latestTime,
        preview: info.preview,
        timeStr: info.timeStr,
        unread: unreadCounts[u] || 0,
        isMe: info.isMe,
        read: info.read,
        delivered: info.delivered,
        isPinned: pinnedChatIds.includes(u),
      };
    }),
  ].sort((a, b) => {
    const isPinnedA = pinnedChatIds.includes(a.id);
    const isPinnedB = pinnedChatIds.includes(b.id);

    if (isPinnedA && !isPinnedB) return -1;
    if (!isPinnedA && isPinnedB) return 1;
    if (isPinnedA && isPinnedB) {
      return pinnedChatIds.indexOf(a.id) - pinnedChatIds.indexOf(b.id);
    }

    // Unread conversations float first
    if (a.unread > 0 && b.unread === 0) return -1;
    if (b.unread > 0 && a.unread === 0) return 1;

    // Arrange according to the time a message is received: recent first, then older
    if (a.latestTime > 0 || b.latestTime > 0) {
      if (a.latestTime !== b.latestTime) {
        return b.latestTime - a.latestTime;
      }
    }

    const isBotA = a.type === "user" && (a.username === "it_bot" || a.username === "BOT" || usersMap[a.username]?.is_bot);
    const isBotB = b.type === "user" && (b.username === "it_bot" || b.username === "BOT" || usersMap[b.username]?.is_bot);
    if (isBotA && !isBotB) return -1;
    if (!isBotA && isBotB) return 1;

    return a.id.localeCompare(b.id);
  });

  const onlineCount = onlineList.filter((u) => u !== currentUser).length;

  return (
    <aside className={`w-full md:w-80 lg:w-88 flex-col h-full bg-slate-900/90 border-r border-slate-800/80 backdrop-blur-xl shrink-0 select-none ${className}`}>
      {/* Brand Header */}
      <div className="px-3.5 pt-3 pb-1 border-b border-slate-800/50 flex items-center justify-between">
        <EliteLogo size="sm" variant="dark" showText={true} className="!flex-row gap-2" />
        <span className="text-[9px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded-full">
          Intranet Portal
        </span>
      </div>

      {/* Header Profile Card with Actions fitted inside frame */}
      <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/80 space-y-2.5">
        {/* Top Profile Row */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onOpenProfileModal}
            className="flex items-center gap-2.5 min-w-0 text-left group hover:opacity-90 transition"
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-sky-500/40 flex items-center justify-center font-bold text-sky-400 overflow-hidden shadow-md">
                {me.image ? (
                  <img src={`/uploads/${me.image}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser.substring(0, 2).toUpperCase()
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-100 truncate group-hover:text-sky-400 transition-colors">
                  {currentUser}
                </span>
                {me.role === "admin" && (
                  <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[9px] font-bold shrink-0">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate font-medium">{me.status || "System Administrator & Director"}</p>
            </div>
          </button>

          {/* Smaller Public Feed button perfectly fitting between user name and logout */}
          {onOpenFeedModal && (
            <button
              id="sidebar-public-feed-btn"
              onClick={onOpenFeedModal}
              className="py-1 px-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 hover:bg-teal-500/25 hover:text-teal-300 hover:border-teal-400/50 transition flex items-center gap-1.5 text-xs font-semibold shrink-0 shadow-sm"
              title="Public Community Feed & Wall"
            >
              <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Feed</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="p-1.5 rounded-xl hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Icons Row directly under profile details from left to right */}
        <div className="flex items-center justify-between gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-slate-300">
          <button
            onClick={() => setShowOnlineModal(true)}
            className="relative p-2 rounded-xl hover:bg-slate-800 hover:text-emerald-400 transition flex items-center justify-center flex-1"
            title="Online Users"
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            {onlineCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[8px] font-extrabold bg-emerald-500 text-slate-950 rounded-full shadow">
                {onlineCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              requestNotificationPermission();
            }}
            className="p-2 rounded-xl hover:bg-slate-800 hover:text-amber-400 transition flex items-center justify-center flex-1"
            title="Enable Push Notifications"
          >
            <Bell className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={onOpenTicketModal}
            className="p-2 rounded-xl hover:bg-slate-800 hover:text-sky-400 transition flex items-center justify-center flex-1"
            title="IT / Support Tickets"
          >
            <Ticket className="w-4 h-4 text-sky-400" />
          </button>

          <button
            onClick={onOpenCallLogModal}
            className="p-2 rounded-xl hover:bg-slate-800 hover:text-indigo-400 transition flex items-center justify-center flex-1"
            title="Call History"
          >
            <PhoneCall className="w-4 h-4 text-indigo-400" />
          </button>

          <button
            onClick={onOpenThemeModal}
            className="p-2 rounded-xl hover:bg-slate-800 hover:text-amber-400 transition flex items-center justify-center flex-1"
            title="Theme Settings"
          >
            <Palette className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={onOpenDeviceModal}
            className="p-2 rounded-xl hover:bg-slate-800 hover:text-teal-400 transition flex items-center justify-center flex-1"
            title="Device & System Diagnostic"
          >
            <Laptop className="w-4 h-4 text-teal-400" />
          </button>

          {me?.role === "admin" && (
            <button
              onClick={onOpenAdminModal}
              className="p-2 rounded-xl bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition flex items-center justify-center flex-1"
              title="Admin Dashboard"
            >
              <Shield className="w-4 h-4 text-sky-400" />
            </button>
          )}
        </div>

        {/* Action Buttons Row: File Ticket, Phone Notebook & Admin Group Creation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenTicketModal}
            className="flex-1 py-1.5 px-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 font-semibold text-xs flex items-center justify-center gap-1.5 transition truncate"
            title="Open Support & IT Tickets"
          >
            <Ticket className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Ticket</span>
          </button>

          {onOpenPhoneNotebookModal && (
            <button
              id="sidebar-phone-notebook-btn"
              onClick={onOpenPhoneNotebookModal}
              className="flex-1 py-1.5 px-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 hover:bg-teal-500/25 hover:border-teal-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-sm truncate"
              title="Open Hospital Department Phone Directory & Extensions"
            >
              <BookUser className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate">Phone Book</span>
            </button>
          )}

          {me?.role === "admin" && (
            <button
              onClick={onOpenGroupModal}
              className="py-1.5 px-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 font-bold text-xs flex items-center justify-center gap-1 transition shrink-0"
              title="Create Group (Admin Permission Only)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Group</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats or users..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500 transition"
          />
        </div>
      </div>

      {/* Chat Category Tabs */}
      <div className="px-3 pb-2 flex gap-1 border-b border-slate-800/60">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "all"
              ? "bg-slate-800 text-sky-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("direct")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "direct"
              ? "bg-slate-800 text-sky-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Direct ({filteredUsers.length})
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "groups"
              ? "bg-slate-800 text-sky-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Groups ({filteredGroups.length})
        </button>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeTab === "all" ? (
          allConversations.map((item) => {
            if (item.type === "group") {
              const group = item.group;
              const isSelected = selectedChatId === group.id;
              const isPinned = pinnedChatIds.includes(group.id);
              return (
                <div
                  key={group.id}
                  onClick={() => onSelectChat(group.id, "group")}
                  className={`group/item relative w-full flex items-center gap-3 p-2.5 rounded-xl transition text-left cursor-pointer ${
                    isSelected
                      ? "bg-sky-500/15 border border-sky-500/40 text-white font-medium"
                      : isPinned
                      ? "bg-slate-800/40 border-l-[3px] border-l-amber-400 hover:bg-slate-800/70 text-slate-200"
                      : "hover:bg-slate-800/50 text-slate-300"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-sm truncate">{group.name}</span>
                        {isPinned && (
                          <span title="Pinned chat" className="text-amber-400 shrink-0">
                            <Pin className="w-3 h-3 fill-amber-400/40 text-amber-400 -rotate-45" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.timeStr && (
                          <span className="text-[10px] text-slate-400">{item.timeStr}</span>
                        )}
                        {item.unread > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-500 text-slate-950 rounded-full">
                            {item.unread}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => togglePinChat(group.id, e)}
                          className={`p-1 rounded-lg hover:bg-slate-700/80 transition shrink-0 ${
                            isPinned
                              ? "text-amber-400 opacity-100"
                              : "text-slate-400 opacity-0 group-hover/item:opacity-100 hover:text-amber-400"
                          }`}
                          title={isPinned ? "Unpin chat" : "Pin chat to top"}
                        >
                          <Pin className={`w-3.5 h-3.5 ${isPinned ? "fill-amber-400/40" : ""} -rotate-45`} />
                        </button>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {item.preview || `${group.members.length} members`}
                    </span>
                  </div>
                </div>
              );
            } else {
              const username = item.username;
              const isSelected = selectedChatId === username;
              const isPinned = pinnedChatIds.includes(username);
              const isITBot = username === "it_bot" || username === "BOT" || usersMap[username]?.bot_type === "it_triage";
              const isInfoBot = username === "info_bot" || usersMap[username]?.bot_type === "hospital_info";
              const isBotUser = isITBot || isInfoBot || usersMap[username]?.is_bot;
              const user = usersMap[username] || { username };
              const displayName = isInfoBot ? "Hospital Info BOT" : isITBot ? "IT Diagnostic BOT" : (user.full_name || user.name || username);
              const isOnline = isBotUser || onlineList.includes(username);
              const avatarSrc = user.image
                ? (user.image.startsWith("data:") || user.image.startsWith("http") || user.image.startsWith("/") ? user.image : `/uploads/${user.image}`)
                : isInfoBot
                ? "/info_bot_avatar.svg"
                : isITBot
                ? "/uploads/bot_avatar.jpg"
                : null;

              return (
                <div
                  key={username}
                  onClick={() => onSelectChat(username, "user")}
                  className={`group/item relative w-full flex items-center gap-3 p-2.5 rounded-xl transition text-left cursor-pointer ${
                    isSelected
                      ? "bg-sky-500/15 border border-sky-500/40 text-white font-medium"
                      : isPinned
                      ? "bg-slate-800/40 border-l-[3px] border-l-amber-400 hover:bg-slate-800/70 text-slate-200"
                      : "hover:bg-slate-800/50 text-slate-300"
                  }`}
                >
                  <div
                    className="relative shrink-0 cursor-pointer group/avatar"
                    title={`View ${displayName}'s Profile`}
                    onClick={(e) => {
                      if (onViewProfile) {
                        e.stopPropagation();
                        onViewProfile(
                          isInfoBot
                            ? { ...user, username: "info_bot", is_bot: true, role: "bot", image: user.image || "info_bot_avatar.svg" }
                            : isITBot
                            ? { ...user, username: "BOT", is_bot: true, role: "bot", image: user.image || "bot_avatar.jpg" }
                            : user
                        );
                      }
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 group-hover/avatar:border-teal-400 flex items-center justify-center text-slate-300 font-bold overflow-hidden transition">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={displayName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (isITBot && !e.currentTarget.src.includes("bot_avatar.png")) {
                              e.currentTarget.src = "/uploads/bot_avatar.png";
                            }
                          }}
                        />
                      ) : (
                        displayName.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        isOnline ? "bg-emerald-500 ring-1 ring-emerald-400/40" : "bg-slate-600"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-sm truncate">{displayName}</span>
                        {isBotUser && (
                          <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold shrink-0">
                            AI
                          </span>
                        )}
                        {isPinned && (
                          <span title="Pinned chat" className="text-amber-400 shrink-0">
                            <Pin className="w-3 h-3 fill-amber-400/40 text-amber-400 -rotate-45" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.timeStr && (
                          <span className="text-[10px] text-slate-400">{item.timeStr}</span>
                        )}
                        {item.unread > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-500 text-slate-950 rounded-full">
                            {item.unread}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => togglePinChat(username, e)}
                          className={`p-1 rounded-lg hover:bg-slate-700/80 transition shrink-0 ${
                            isPinned
                              ? "text-amber-400 opacity-100"
                              : "text-slate-400 opacity-0 group-hover/item:opacity-100 hover:text-amber-400"
                          }`}
                          title={isPinned ? "Unpin chat" : "Pin chat to top"}
                        >
                          <Pin className={`w-3.5 h-3.5 ${isPinned ? "fill-amber-400/40" : ""} -rotate-45`} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-400 truncate">
                      {item.preview ? (
                        <div className="flex items-center gap-1 truncate">
                          {item.isMe && (
                            item.read ? (
                              <CheckCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 stroke-[2.5]" title="Read" />
                            ) : item.delivered ? (
                              <CheckCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" title="Delivered" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" title="Sent" />
                            )
                          )}
                          <span className="truncate">{item.preview}</span>
                        </div>
                      ) : (
                        <>
                          <span
                            className={`text-[10px] font-medium ${
                              isOnline ? "text-emerald-400" : "text-slate-500"
                            }`}
                          >
                            {isOnline ? (isBotUser ? "Online 24/7" : "Online") : "Offline"}
                          </span>
                          {(user.status || isBotUser) && (
                            <span className="truncate">
                              • {user.status || "IT Diagnostic Specialist"}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          })
        ) : activeTab === "direct" ? (
          filteredUsers.map((username) => {
            const isSelected = selectedChatId === username;
            const isPinned = pinnedChatIds.includes(username);
            const isBotUser = username === "it_bot" || username === "BOT" || usersMap[username]?.is_bot;
            const user = usersMap[username] || { username };
            const displayName = isBotUser ? "BOT" : username;
            const isOnline = isBotUser || onlineList.includes(username);
            const unread = unreadCounts[username] || 0;
            const info = getChatLatestInfo(username, false);
            const avatarSrc = user.image
              ? (user.image.startsWith("data:") || user.image.startsWith("http") || user.image.startsWith("/") ? user.image : `/uploads/${user.image}`)
              : isBotUser
              ? "/uploads/bot_avatar.jpg"
              : null;

            return (
              <div
                key={username}
                onClick={() => onSelectChat(username, "user")}
                className={`group/item relative w-full flex items-center gap-3 p-2.5 rounded-xl transition text-left cursor-pointer ${
                  isSelected
                    ? "bg-sky-500/15 border border-sky-500/40 text-white font-medium"
                    : isPinned
                    ? "bg-slate-800/40 border-l-[3px] border-l-amber-400 hover:bg-slate-800/70 text-slate-200"
                    : "hover:bg-slate-800/50 text-slate-300"
                }`}
              >
                <div
                  className="relative shrink-0 cursor-pointer group/avatar"
                  title={`View ${displayName}'s Profile`}
                  onClick={(e) => {
                    if (onViewProfile) {
                      e.stopPropagation();
                      onViewProfile(
                        isBotUser
                          ? { ...user, username: "BOT", is_bot: true, role: "bot", image: user.image || "bot_avatar.jpg" }
                          : user
                      );
                    }
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 group-hover/avatar:border-teal-400 flex items-center justify-center text-slate-300 font-bold overflow-hidden transition">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          if (isBotUser && !e.currentTarget.src.includes("bot_avatar.png")) {
                            e.currentTarget.src = "/uploads/bot_avatar.png";
                          }
                        }}
                      />
                    ) : (
                      displayName.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                      isOnline ? "bg-emerald-500 ring-1 ring-emerald-400/40" : "bg-slate-600"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-sm truncate">{displayName}</span>
                      {isBotUser && (
                        <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold shrink-0">
                          AI
                        </span>
                      )}
                      {isPinned && (
                        <span title="Pinned chat" className="text-amber-400 shrink-0">
                          <Pin className="w-3 h-3 fill-amber-400/40 text-amber-400 -rotate-45" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {info.timeStr && (
                        <span className="text-[10px] text-slate-400">{info.timeStr}</span>
                      )}
                      {unread > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-500 text-slate-950 rounded-full">
                          {unread}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => togglePinChat(username, e)}
                        className={`p-1 rounded-lg hover:bg-slate-700/80 transition shrink-0 ${
                          isPinned
                            ? "text-amber-400 opacity-100"
                            : "text-slate-400 opacity-0 group-hover/item:opacity-100 hover:text-amber-400"
                        }`}
                        title={isPinned ? "Unpin chat" : "Pin chat to top"}
                      >
                        <Pin className={`w-3.5 h-3.5 ${isPinned ? "fill-amber-400/40" : ""} -rotate-45`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-400 truncate">
                    {info.preview ? (
                      <div className="flex items-center gap-1 truncate">
                        {info.isMe && (
                          info.read ? (
                            <CheckCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 stroke-[2.5]" title="Read" />
                          ) : info.delivered ? (
                            <CheckCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" title="Delivered" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" title="Sent" />
                          )
                        )}
                        <span className="truncate">{info.preview}</span>
                      </div>
                    ) : (
                      <>
                        <span
                          className={`text-[10px] font-medium ${
                            isOnline ? "text-emerald-400" : "text-slate-500"
                          }`}
                        >
                          {isOnline ? (isBotUser ? "Online 24/7" : "Online") : "Offline"}
                        </span>
                        {(user.status || isBotUser) && (
                          <span className="truncate">
                            • {user.status || "IT Diagnostic Specialist"}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          filteredGroups.map((group) => {
            const isSelected = selectedChatId === group.id;
            const isPinned = pinnedChatIds.includes(group.id);
            const unread = unreadCounts[group.id] || 0;
            const info = getChatLatestInfo(group.id, true);

            return (
              <div
                key={group.id}
                onClick={() => onSelectChat(group.id, "group")}
                className={`group/item relative w-full flex items-center gap-3 p-2.5 rounded-xl transition text-left cursor-pointer ${
                  isSelected
                    ? "bg-sky-500/15 border border-sky-500/40 text-white font-medium"
                    : isPinned
                    ? "bg-slate-800/40 border-l-[3px] border-l-amber-400 hover:bg-slate-800/70 text-slate-200"
                    : "hover:bg-slate-800/50 text-slate-300"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Users className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-sm truncate">{group.name}</span>
                      {isPinned && (
                        <span title="Pinned chat" className="text-amber-400 shrink-0">
                          <Pin className="w-3 h-3 fill-amber-400/40 text-amber-400 -rotate-45" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {info.timeStr && (
                        <span className="text-[10px] text-slate-400">{info.timeStr}</span>
                      )}
                      {unread > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-500 text-slate-950 rounded-full">
                          {unread}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => togglePinChat(group.id, e)}
                        className={`p-1 rounded-lg hover:bg-slate-700/80 transition shrink-0 ${
                          isPinned
                            ? "text-amber-400 opacity-100"
                            : "text-slate-400 opacity-0 group-hover/item:opacity-100 hover:text-amber-400"
                        }`}
                        title={isPinned ? "Unpin chat" : "Pin chat to top"}
                      >
                        <Pin className={`w-3.5 h-3.5 ${isPinned ? "fill-amber-400/40" : ""} -rotate-45`} />
                      </button>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {info.preview || `${group.members.length} members`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Online Modal */}
      {showOnlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/60 rounded-2xl p-5 text-slate-100 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-bold text-sm">Online Users ({onlineCount})</h3>
              </div>
              <button
                onClick={() => {
                  setShowOnlineModal(false);
                  setOnlineSearch("");
                }}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                ✕ Close
              </button>
            </div>

            {/* Online User Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search active online staff..."
                value={onlineSearch}
                onChange={(e) => setOnlineSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-0.5">
              {Array.from(new Set<string>(onlineList))
                .filter((u: string) => {
                  if (u === currentUser) return false;
                  if (u === "BOT" && onlineList.includes("it_bot")) return false;
                  if (!onlineSearch.trim()) return true;
                  const term = onlineSearch.toLowerCase();
                  const uObj = usersMap[u];
                  const isBotUser = u === "it_bot" || u === "BOT" || uObj?.is_bot;
                  return (
                    u.toLowerCase().includes(term) ||
                    (isBotUser && "bot".includes(term)) ||
                    (uObj?.status && uObj.status.toLowerCase().includes(term)) ||
                    (uObj?.role && uObj.role.toLowerCase().includes(term))
                  );
                })
                .map((u: string) => {
                  const uObj = usersMap[u];
                  const isITBot = u === "it_bot" || u === "BOT" || uObj?.bot_type === "it_triage";
                  const isInfoBot = u === "info_bot" || uObj?.bot_type === "hospital_info";
                  const isBotUser = isITBot || isInfoBot || uObj?.is_bot;
                  const displayName = isInfoBot ? "Hospital Info BOT" : isITBot ? "IT Diagnostic BOT" : (uObj?.full_name || uObj?.name || u);
                  const avatarSrc = uObj?.image
                    ? (uObj.image.startsWith("data:") || uObj.image.startsWith("http") || uObj.image.startsWith("/") ? uObj.image : `/uploads/${uObj.image}`)
                    : isInfoBot
                    ? "/info_bot_avatar.svg"
                    : isITBot
                    ? "/uploads/bot_avatar.jpg"
                    : null;

                  return (
                    <div
                      key={u}
                      onClick={() => {
                        setShowOnlineModal(false);
                        setOnlineSearch("");
                        onSelectChat(isInfoBot ? "info_bot" : isITBot ? "it_bot" : u, "user");
                      }}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition border border-transparent hover:border-slate-700/60"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-sky-400 overflow-hidden shrink-0">
                          {avatarSrc ? (
                            <img
                              src={avatarSrc}
                              alt={displayName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                if (isITBot && !e.currentTarget.src.includes("bot_avatar.png")) {
                                  e.currentTarget.src = "/uploads/bot_avatar.png";
                                }
                              }}
                            />
                          ) : (
                            displayName.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-200 block truncate">{displayName}</span>
                            {isBotUser && (
                              <span className="px-1 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[8px] font-bold">
                                AI
                              </span>
                            )}
                          </div>
                          {(uObj?.status || isBotUser) && (
                            <p className="text-[10px] text-slate-400 truncate">
                              {uObj?.status || "IT Diagnostic Specialist"}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                        {isBotUser ? "24/7" : "Active Now"}
                      </span>
                    </div>
                  );
                })}

              {onlineList.filter((u) => u !== currentUser).length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6">No other users currently online</p>
              )}

              {onlineList.filter((u) => u !== currentUser).length > 0 &&
                onlineList.filter((u) => {
                  if (u === currentUser) return false;
                  if (!onlineSearch.trim()) return true;
                  const term = onlineSearch.toLowerCase();
                  const uObj = usersMap[u];
                  return (
                    u.toLowerCase().includes(term) ||
                    (uObj?.status && uObj.status.toLowerCase().includes(term)) ||
                    (uObj?.role && uObj.role.toLowerCase().includes(term))
                  );
                }).length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">No online users match "{onlineSearch}"</p>
                )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
