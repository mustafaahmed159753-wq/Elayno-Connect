import React, { useEffect, useState, useRef } from "react";
import { socket } from "./lib/socket";
import { soundManager } from "./lib/sound";
import { callAlertManager } from "./lib/callAlerts";
import { sendPushNotification } from "./lib/notifications";
import { User, Message, Group, CallState } from "./types";
import { AuthModal } from "./components/AuthModal";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { CallOverlay } from "./components/CallOverlay";
import { TicketModal } from "./components/TicketModal";
import { CallLogModal } from "./components/CallLogModal";
import { GlobalSearchModal } from "./components/GlobalSearchModal";
import { ThemePickerModal } from "./components/ThemePickerModal";
import { ProfileModal } from "./components/ProfileModal";
import { GroupModal } from "./components/GroupModal";
import { AdminModal } from "./components/AdminModal";
import { SplashScreen } from "./components/SplashScreen";
import { DevicePermissionsModal } from "./components/DevicePermissionsModal";
import { GroupMeetingModal } from "./components/GroupMeetingModal";
import { UserProfileDetailsModal } from "./components/UserProfileDetailsModal";
import { FeedModal } from "./components/FeedModal";
import { PhoneNotebookModal } from "./components/PhoneNotebookModal";
import { HospitalStaffOnboardingModal } from "./components/HospitalStaffOnboardingModal";
import { ShiftPresenceCheckinModal } from "./components/ShiftPresenceCheckinModal";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const [currentUser, setCurrentUser] = useState<string | null>(
    localStorage.getItem("elyano_user") || null
  );

  const [usersMap, setUsersMap] = useState<Record<string, User>>({});
  const [onlineList, setOnlineList] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChatType, setSelectedChatType] = useState<"user" | "group">("user");
  const selectedChatIdRef = useRef<string | null>(selectedChatId);
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  // Persistent Pinned Chats State
  const [pinnedChatIds, setPinnedChatIds] = useState<string[]>(() => {
    try {
      const user = localStorage.getItem("elyano_user");
      if (!user) return [];
      const saved = localStorage.getItem(`elyano_pinned_chats_${user}`);
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  // Sync pinned chats when user switches
  useEffect(() => {
    if (currentUser) {
      try {
        const saved = localStorage.getItem(`elyano_pinned_chats_${currentUser}`);
        setPinnedChatIds(saved ? JSON.parse(saved) : []);
      } catch (_) {
        setPinnedChatIds([]);
      }
    } else {
      setPinnedChatIds([]);
    }
  }, [currentUser]);

  const handleTogglePinChat = (chatId: string) => {
    if (!currentUser || !chatId) return;
    setPinnedChatIds((prev) => {
      const isPinned = prev.includes(chatId);
      const next = isPinned ? prev.filter((id) => id !== chatId) : [chatId, ...prev];
      try {
        localStorage.setItem(`elyano_pinned_chats_${currentUser}`, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  // Call State
  const [callState, setCallState] = useState<CallState>({
    active: false,
    state: "outgoing",
    peerUser: "",
    callType: "voice",
  });

  const stopCallRinging = () => {
    callAlertManager.stopAllAlerts();
  };

  const handleAnswerCall = () => {
    callAlertManager.stopAllAlerts();
    soundManager.playCallConnected();
    setCallState((prev) => ({
      ...prev,
      state: "connected",
    }));
  };

  // Modal Visibility
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showCallLogModal, setShowCallLogModal] = useState(false);
  const [showGlobalSearchModal, setShowGlobalSearchModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showPhoneNotebookModal, setShowPhoneNotebookModal] = useState(false);
  const [showStaffOnboardingModal, setShowStaffOnboardingModal] = useState(false);
  const [showShiftPresenceModal, setShowShiftPresenceModal] = useState(false);
  const [staffUserProfile, setStaffUserProfile] = useState<any>(null);
  const [viewingUserProfile, setViewingUserProfile] = useState<User | null>(null);

  // Group Video Meeting State
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [meetingTitle, setMeetingTitle] = useState("Hospital Staff Video Call");

  // Check URL query parameters for meeting links (e.g. ?meeting=mtg-12345)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mId = params.get("meeting") || params.get("room");
    if (mId) {
      setActiveMeetingId(mId);
    }
  }, []);

  // Mobile & Browser Hardware Back Button Handling
  const navStateRef = useRef({
    selectedChatId,
    showTicketModal,
    showCallLogModal,
    showGlobalSearchModal,
    showThemeModal,
    showProfileModal,
    showGroupModal,
    showAdminModal,
    showDeviceModal,
    showFeedModal,
    showPhoneNotebookModal,
    viewingUserProfile,
    activeMeetingId,
  });

  useEffect(() => {
    navStateRef.current = {
      selectedChatId,
      showTicketModal,
      showCallLogModal,
      showGlobalSearchModal,
      showThemeModal,
      showProfileModal,
      showGroupModal,
      showAdminModal,
      showDeviceModal,
      showFeedModal,
      showPhoneNotebookModal,
      viewingUserProfile,
      activeMeetingId,
    };
  }, [
    selectedChatId,
    showTicketModal,
    showCallLogModal,
    showGlobalSearchModal,
    showThemeModal,
    showProfileModal,
    showGroupModal,
    showAdminModal,
    showDeviceModal,
    showFeedModal,
    showPhoneNotebookModal,
    viewingUserProfile,
    activeMeetingId,
  ]);

  // Intercept phone / browser back button (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const curr = navStateRef.current;

      // 1. First priority: Close any active modal
      if (curr.viewingUserProfile) {
        setViewingUserProfile(null);
        return;
      }
      if (curr.showPhoneNotebookModal) {
        setShowPhoneNotebookModal(false);
        return;
      }
      if (curr.showFeedModal) {
        setShowFeedModal(false);
        return;
      }
      if (curr.showTicketModal) {
        setShowTicketModal(false);
        return;
      }
      if (curr.showCallLogModal) {
        setShowCallLogModal(false);
        return;
      }
      if (curr.showGlobalSearchModal) {
        setShowGlobalSearchModal(false);
        return;
      }
      if (curr.showThemeModal) {
        setShowThemeModal(false);
        return;
      }
      if (curr.showProfileModal) {
        setShowProfileModal(false);
        return;
      }
      if (curr.showGroupModal) {
        setShowGroupModal(false);
        return;
      }
      if (curr.showAdminModal) {
        setShowAdminModal(false);
        return;
      }
      if (curr.showDeviceModal) {
        setShowDeviceModal(false);
        return;
      }
      if (curr.activeMeetingId) {
        setActiveMeetingId(null);
        return;
      }

      // 2. Second priority: If a chat is open on mobile/desktop, close chat and return to prior page (chat list)
      if (curr.selectedChatId) {
        setSelectedChatId(null);
        return;
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Ensure history state is pushed when entering a chat or opening a modal
  useEffect(() => {
    const isModalOpen =
      showTicketModal ||
      showCallLogModal ||
      showGlobalSearchModal ||
      showThemeModal ||
      showProfileModal ||
      showGroupModal ||
      showAdminModal ||
      showDeviceModal ||
      showFeedModal ||
      !!viewingUserProfile ||
      !!activeMeetingId;

    if (selectedChatId || isModalOpen) {
      if (!window.history.state || !window.history.state.elyanoApp) {
        window.history.pushState({ elyanoApp: true, time: Date.now() }, "");
      }
    }
  }, [
    selectedChatId,
    showTicketModal,
    showCallLogModal,
    showGlobalSearchModal,
    showThemeModal,
    showProfileModal,
    showGroupModal,
    showAdminModal,
    showDeviceModal,
    viewingUserProfile,
    activeMeetingId,
  ]);

  // Pop-up Notification Toast
  const [activeToast, setActiveToast] = useState<{
    id: number;
    sender: string;
    text: string;
    chatId: string;
    chatType: "user" | "group";
  } | null>(null);

  // Theme (Default is Hospital Clean Light)
  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem("elyano_theme") || "hospital-light"
  );

  const [currentFont, setCurrentFont] = useState(
    localStorage.getItem("elyano_font") || "jakarta"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-font", currentFont);
  }, [currentFont]);

  // Request browser push notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Stop any lingering audio ringtones on mount
  useEffect(() => {
    soundManager.stopAll();
  }, []);

  // Auto-connect and authenticate
  useEffect(() => {
    soundManager.stopAll();
    if (!socket.connected) {
      socket.connect();
    }

    const tryAuth = () => {
      if (currentUser) {
        const token = localStorage.getItem("elyano_token") || "";
        const pass = localStorage.getItem("elyano_auth_pass") || "";
        socket.emit("authenticate", { user: currentUser, pass, token, type: "login" });
      }
    };

    tryAuth();

    const handleConnect = () => {
      tryAuth();
    };

    const isClinicOrAdminAccount = (uname?: string) => {
      if (!uname) return true;
      const clean = uname.trim().toLowerCase();
      if (clean === "elite" || clean === "admin" || clean === "it_bot" || clean === "info_bot" || clean === "bot") return true;
      if (clean.startsWith("clinic")) return true;
      const match = clean.match(/^clinic[-_ ]?(\d+)/i);
      if (match) return true;
      return false;
    };

    const handleAuthRes = (data: {
      ok: boolean;
      user?: string;
      token?: string;
      m?: string;
      needs_onboarding?: boolean;
      needs_shift_checkin?: boolean;
      is_demo?: boolean;
      user_profile?: any;
    }) => {
      if (data.ok) {
        if (data.token) {
          localStorage.setItem("elyano_token", data.token);
        }
        if (data.user_profile) {
          setStaffUserProfile(data.user_profile);
        }
        const targetUser = data.user || currentUser || "";
        const cleanTarget = targetUser.trim().toLowerCase();
        const hasCompletedOnboardingLocal = localStorage.getItem(`elyano_onboarding_done_${cleanTarget}`) === "true";
        const hasUserProfileOnboarding = !!(
          data.user_profile?.onboarding_completed ||
          (data.user_profile?.department && data.user_profile.department.trim().length > 0 && data.user_profile.department !== "Hospital Staff")
        );
        const alreadyRegistered = hasCompletedOnboardingLocal || hasUserProfileOnboarding || !data.needs_onboarding;

        if (!data.is_demo && !isClinicOrAdminAccount(targetUser)) {
          if (!alreadyRegistered && data.needs_onboarding) {
            setShowStaffOnboardingModal(true);
          } else if (data.needs_shift_checkin) {
            setShowShiftPresenceModal(true);
          }
        }
      } else {
        console.warn("[App] Authentication rejected on reconnect:", data.m);
        // Clear stored session and cleanly return to login modal
        localStorage.removeItem("elyano_user");
        localStorage.removeItem("elyano_token");
        localStorage.removeItem("elyano_auth_pass");
        setCurrentUser(null);
      }
    };

    const handleInitData = (data: {
      history: Message[];
      all_users: Record<string, User>;
      online_list: string[];
      groups: Group[];
      unread: Record<string, number>;
    }) => {
      setMessages(data.history || []);
      setUsersMap(data.all_users || {});
      setOnlineList(data.online_list || []);
      setGroups(data.groups || []);
      setUnreadCounts(data.unread || {});
    };

    const handleStatusChange = (data: { online_list: string[] }) => {
      setOnlineList(data.online_list || []);
    };

    const handleUsersUpdate = (users: Record<string, User>) => {
      setUsersMap(users);
    };

    const handleNewMsg = (newMsg: Message) => {
      const isGroup = newMsg.recipient.startsWith("group_");
      const chatKey = isGroup ? newMsg.recipient : newMsg.sender;
      const isViewingChat = selectedChatIdRef.current === chatKey;

      if (newMsg.sender !== currentUser && isViewingChat && !isGroup) {
        newMsg.read = true;
        newMsg.delivered = true;
        socket.emit("mark_read", { sender: newMsg.sender, recipient: currentUser, msg_id: newMsg.id });
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // Play message sound and handle unread counts
      if (newMsg.sender !== currentUser) {
        soundManager.playMessageSound();

        if (!isViewingChat) {
          setUnreadCounts((prev) => ({
            ...prev,
            [chatKey]: (prev[chatKey] || 0) + 1,
          }));
        }

        // Trigger native browser notification if granted
        sendPushNotification(
          `Message from ${newMsg.sender}`,
          newMsg.msg ? (newMsg.msg.length > 60 ? newMsg.msg.slice(0, 60) + "..." : newMsg.msg) : "Sent a file attachment",
          usersMap[newMsg.sender]?.image ? `/uploads/${usersMap[newMsg.sender].image}` : undefined
        );

        // Show floating in-app pop-up toast notification
        setActiveToast({
          id: Date.now(),
          sender: newMsg.sender,
          text: newMsg.msg || (newMsg.type === "file" ? "Sent a file attachment" : "New voice audio message"),
          chatId: chatKey,
          chatType: isGroup ? "group" : "user",
        });
      }
    };

    const handleMsgReadStatus = (data: { sender: string; recipient: string; msg_id?: number }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (data.msg_id && m.id === data.msg_id) {
            return { ...m, read: true, delivered: true };
          }
          if (
            (m.sender === data.sender && m.recipient === data.recipient) ||
            (data.sender === "it_bot" && m.recipient === data.recipient && (m.sender === "it_bot" || m.sender === "BOT")) ||
            (data.recipient === "it_bot" && m.sender === data.sender && (m.recipient === "it_bot" || m.recipient === "BOT"))
          ) {
            return { ...m, read: true, delivered: true };
          }
          return m;
        })
      );
    };

    const handleMsgDeliveredStatus = (data: { msg_id: number; sender: string; recipient: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.msg_id ? { ...m, delivered: true } : m))
      );
    };

    const handleReactionUpdate = (data: { msg_id: number; reactions: string }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === data.msg_id) {
            try {
              return { ...m, reactions: JSON.parse(data.reactions) };
            } catch (_) {}
          }
          return m;
        })
      );
    };

    const handleMsgEdited = (data: {
      msg_id: number;
      new_text: string;
      ticket_status?: string;
      ticket_details?: any;
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.msg_id
            ? {
                ...m,
                msg: data.new_text,
                ...(data.ticket_status ? { ticket_status: data.ticket_status } : {}),
                ...(data.ticket_details ? { ticket_details: data.ticket_details } : {}),
              }
            : m
        )
      );
    };

    const handleTicketStatusUpdated = (data: {
      ticket_id: number;
      status: string;
      ticket: any;
      updated_by: string;
    }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.ticket_id === data.ticket_id || m.ticket_details?.id === data.ticket_id) {
            return {
              ...m,
              ticket_status: data.status,
              ticket_details: {
                ...(m.ticket_details || {}),
                ...(data.ticket || {}),
                status: data.status,
              },
            };
          }
          return m;
        })
      );
    };

    const handleMsgPromptUpdated = (data: { msg_id: number; prompt: any }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.msg_id
            ? { ...m, interactive_prompt: data.prompt }
            : m
        )
      );
    };

    const handleMsgDeleted = (data: { msg_id: number }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.msg_id ? { ...m, is_deleted: true, msg: "" } : m))
      );
    };

    const handleMsgPinned = (data: { msg_id: number }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.msg_id ? { ...m, is_pinned: !m.is_pinned } : m))
      );
    };

    const handleGroupCreated = (newGroup: Group) => {
      setGroups((prev) => [...prev, newGroup]);
    };

    // WebRTC Signaling Handlers with Phone Ringing & Wake-up
    const handleIncomingCall = (data: {
      from: string;
      call_type: "voice" | "video";
      offer: RTCSessionDescriptionInit;
    }) => {
      const avatarUrl = usersMap[data.from]?.image ? `/uploads/${usersMap[data.from].image}` : undefined;
      callAlertManager.startIncomingCallAlerts(data.from, data.call_type, avatarUrl);

      setCallState({
        active: true,
        state: "incoming",
        peerUser: data.from,
        callType: data.call_type,
        offer: data.offer,
      });
    };

    const handleCallAnswered = (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      stopCallRinging();
      soundManager.playCallConnected();
      setCallState((prev) => ({
        ...prev,
        state: "connected",
        offer: data.answer,
      }));
    };

    const handleCallEnded = () => {
      stopCallRinging();
      soundManager.playCallEnded();
      setCallState({
        active: false,
        state: "outgoing",
        peerUser: "",
        callType: "voice",
      });
    };

    const handleForceDisconnect = (data: { reason: string }) => {
      alert(`Session ended: ${data.reason || "Disconnected"}`);
      handleLogout();
    };

    socket.on("connect", handleConnect);
    socket.on("auth_res", handleAuthRes);
    socket.on("init_data", handleInitData);
    socket.on("user_status_change", handleStatusChange);
    socket.on("user_list_update", handleUsersUpdate);
    socket.on("new_msg", handleNewMsg);
    socket.on("msg_read_status", handleMsgReadStatus);
    socket.on("msg_delivered_status", handleMsgDeliveredStatus);
    socket.on("reaction_update", handleReactionUpdate);
    socket.on("msg_edited", handleMsgEdited);
    socket.on("msg_prompt_updated", handleMsgPromptUpdated);
    socket.on("ticket_status_updated", handleTicketStatusUpdated);
    socket.on("msg_deleted", handleMsgDeleted);
    socket.on("msg_pinned", handleMsgPinned);
    socket.on("group_created", handleGroupCreated);
    socket.on("force_disconnect", handleForceDisconnect);

    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_answered", handleCallAnswered);
    socket.on("call_rejected", handleCallEnded);
    socket.on("call_busy", handleCallEnded);
    socket.on("call_ended", handleCallEnded);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("auth_res", handleAuthRes);
      socket.off("init_data", handleInitData);
      socket.off("user_status_change", handleStatusChange);
      socket.off("user_list_update", handleUsersUpdate);
      socket.off("new_msg", handleNewMsg);
      socket.off("msg_read_status", handleMsgReadStatus);
      socket.off("msg_delivered_status", handleMsgDeliveredStatus);
      socket.off("reaction_update", handleReactionUpdate);
      socket.off("msg_edited", handleMsgEdited);
      socket.off("msg_prompt_updated", handleMsgPromptUpdated);
      socket.off("ticket_status_updated", handleTicketStatusUpdated);
      socket.off("msg_deleted", handleMsgDeleted);
      socket.off("msg_pinned", handleMsgPinned);
      socket.off("group_created", handleGroupCreated);
      socket.off("force_disconnect", handleForceDisconnect);

      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_answered", handleCallAnswered);
      socket.off("call_rejected", handleCallEnded);
      socket.off("call_busy", handleCallEnded);
      socket.off("call_ended", handleCallEnded);
    };
  }, [currentUser]);

  const handleLoginSuccess = (username: string, openAdmin?: boolean, extraData?: any) => {
    if (!socket.connected) {
      socket.connect();
    }
    localStorage.setItem("elyano_user", username);
    setCurrentUser(username);
    if (openAdmin) {
      setShowAdminModal(true);
    }
    if (extraData?.user_profile) {
      setStaffUserProfile(extraData.user_profile);
    }
    const cleanU = (username || "").trim().toLowerCase();
    const isClinic = cleanU.startsWith("clinic") || /^clinic[-_ ]?(\d+)/i.test(cleanU);
    const hasCompletedOnboardingLocal = localStorage.getItem(`elyano_onboarding_done_${cleanU}`) === "true";
    const hasUserProfileOnboarding = !!(
      extraData?.user_profile?.onboarding_completed ||
      (extraData?.user_profile?.department && extraData.user_profile.department.trim().length > 0 && extraData.user_profile.department !== "Hospital Staff")
    );
    const alreadyRegistered = hasCompletedOnboardingLocal || hasUserProfileOnboarding || (extraData && !extraData.needs_onboarding);

    if (extraData && !extraData.is_demo && !isClinic && cleanU !== "admin" && cleanU !== "elite") {
      if (!alreadyRegistered && extraData.needs_onboarding) {
        setShowStaffOnboardingModal(true);
      } else if (extraData.needs_shift_checkin) {
        setShowShiftPresenceModal(true);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("elyano_user");
    localStorage.removeItem("elyano_token");
    localStorage.removeItem("elyano_auth_pass");
    if (localStorage.getItem("elyano_remember_me") === "false") {
      localStorage.removeItem("elyano_remembered_username");
    }
    setCurrentUser(null);
    setSelectedChatId(null);
    socket.disconnect();
  };

  const handleSelectChat = (id: string, type: "user" | "group") => {
    if (selectedChatId !== id) {
      try {
        window.history.pushState({ elyanoApp: true, chat: id }, "");
      } catch (e) {
        console.error(e);
      }
    }
    setSelectedChatId(id);
    setSelectedChatType(type);

    // Clear unread
    setUnreadCounts((prev) => ({ ...prev, [id]: 0 }));
    if (type === "user") {
      socket.emit("mark_read", { sender: id, recipient: currentUser });
      setMessages((prev) =>
        prev.map((m) => {
          if (
            (m.sender === id && m.recipient === currentUser) ||
            ((id === "it_bot" || id === "BOT") && (m.sender === "it_bot" || m.sender === "BOT") && m.recipient === currentUser)
          ) {
            return { ...m, read: true, delivered: true };
          }
          return m;
        })
      );
    }
  };

  const handleStartCall = (type: "voice" | "video") => {
    if (!selectedChatId || selectedChatType === "group") return;

    soundManager.startOutgoingRing();
    setCallState({
      active: true,
      state: "outgoing",
      peerUser: selectedChatId,
      callType: type,
    });
  };

  const handleStartCallWith = (user: string, type: "voice" | "video") => {
    setSelectedChatId(user);
    setSelectedChatType("user");

    soundManager.startOutgoingRing();
    setCallState({
      active: true,
      state: "outgoing",
      peerUser: user,
      callType: type,
    });
  };

  const handleStartGroupMeeting = (meetingId?: string) => {
    const id = meetingId || `mtg-${Date.now().toString(36).slice(-6)}`;
    setActiveMeetingId(id);
    if (selectedChatId) {
      const chatObj = selectedChatType === "group" ? groups.find((g) => g.id === selectedChatId) : null;
      setMeetingTitle(chatObj ? chatObj.name : `Video Meeting (${selectedChatId})`);
    } else {
      setMeetingTitle("Hospital Staff Video Sync");
    }
  };

  const handleEndCall = () => {
    stopCallRinging();
    soundManager.playCallEnded();
    if (callState.peerUser) {
      if (callState.state === "incoming") {
        socket.emit("call_rejected", { to: callState.peerUser });
      } else {
        socket.emit("call_ended", { to: callState.peerUser });
      }
    }
    setCallState({
      active: false,
      state: "outgoing",
      peerUser: "",
      callType: "voice",
    });
  };

  const handleUpdateStatus = (status: string) => {
    if (!currentUser) return;
    fetch("/update_status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: currentUser, status }),
    });
    setUsersMap((prev) => ({
      ...prev,
      [currentUser]: { ...(prev[currentUser] || { username: currentUser }), status },
    }));
  };

  const handleUpdateCoverPhoto = async (dataUrl: string, filename: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/upload_cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: currentUser, image_data: dataUrl, filename }),
      });
      const data = await res.json();
      if (data.ok && data.filename) {
        setUsersMap((prev) => ({
          ...prev,
          [currentUser]: {
            ...(prev[currentUser] || { username: currentUser }),
            cover_image: data.filename,
          },
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateFullProfile = async (data: {
    status?: string;
    department?: string;
    email?: string;
    phone?: string;
    bio?: string;
    cover_image?: string;
  }) => {
    if (!currentUser) return;
    try {
      await fetch("/api/update_profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: currentUser,
          ...data,
        }),
      });
      setUsersMap((prev) => ({
        ...prev,
        [currentUser]: {
          ...(prev[currentUser] || { username: currentUser }),
          ...data,
        },
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePhoto = async (dataUrl: string, filename: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/upload_profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: currentUser, image_data: dataUrl, filename }),
      });
      const data = await res.json();
      if (data.ok && data.filename) {
        setUsersMap((prev) => ({
          ...prev,
          [currentUser]: {
            ...(prev[currentUser] || { username: currentUser }),
            image: data.filename,
          },
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = (name: string, members: string[]) => {
    socket.emit("create_group", { name, members });
  };

  return (
    <div className="fixed inset-0 flex h-full h-[100dvh] w-full max-w-full bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {!currentUser ? (
        <AuthModal onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          <Sidebar
            currentUser={currentUser}
            usersMap={usersMap}
            onlineList={onlineList}
            groups={groups}
            unreadCounts={unreadCounts}
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            onViewProfile={(u) => setViewingUserProfile(u)}
            onOpenTicketModal={() => setShowTicketModal(true)}
            onOpenCallLogModal={() => setShowCallLogModal(true)}
            onOpenThemeModal={() => setShowThemeModal(true)}
            onOpenProfileModal={() => setShowProfileModal(true)}
            onOpenGroupModal={() => setShowGroupModal(true)}
            onOpenAdminModal={() => setShowAdminModal(true)}
            onOpenDeviceModal={() => setShowDeviceModal(true)}
            onOpenFeedModal={() => setShowFeedModal(true)}
            onOpenPhoneNotebookModal={() => setShowPhoneNotebookModal(true)}
            messages={messages}
            pinnedChatIds={pinnedChatIds}
            onTogglePinChat={handleTogglePinChat}
            onLogout={handleLogout}
            className={selectedChatId ? "hidden md:flex" : "flex h-full w-full"}
          />

          <ChatArea
            currentUser={currentUser}
            targetId={selectedChatId}
            targetType={selectedChatType}
            usersMap={usersMap}
            groups={groups}
            messages={messages}
            onlineList={onlineList}
            isPinned={selectedChatId ? pinnedChatIds.includes(selectedChatId) : false}
            onTogglePin={() => selectedChatId && handleTogglePinChat(selectedChatId)}
            onStartCall={handleStartCall}
            onStartGroupMeeting={handleStartGroupMeeting}
            onOpenCallLog={() => setShowCallLogModal(true)}
            onOpenGlobalSearch={() => setShowGlobalSearchModal(true)}
            onViewProfile={(u) => setViewingUserProfile(u)}
            onBack={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                setSelectedChatId(null);
              }
            }}
            className={selectedChatId ? "flex h-full w-full" : "hidden md:flex"}
          />

          {/* WebRTC Audio & Video Call Overlay */}
          <CallOverlay
            callState={callState}
            onEndCall={handleEndCall}
            onAnswerCall={handleAnswerCall}
            currentUser={currentUser}
            usersMap={usersMap}
          />

          {/* Multi-participant Group Video Meeting Modal */}
          {activeMeetingId && currentUser && (
            <GroupMeetingModal
              meetingId={activeMeetingId}
              currentUser={currentUser}
              meetingTitle={meetingTitle}
              onClose={() => setActiveMeetingId(null)}
              onSendLinkToChat={(linkMsg) => {
                if (selectedChatId) {
                  socket.emit("send_msg", {
                    sender: currentUser,
                    recipient: selectedChatId,
                    type: "text",
                    msg: linkMsg,
                  });
                }
              }}
            />
          )}

          {/* Auxiliary Modals */}
          {showTicketModal && (
            <TicketModal
              currentUser={currentUser}
              groups={groups}
              onClose={() => setShowTicketModal(false)}
              onSubmitted={() => {}}
            />
          )}

          {showCallLogModal && (
            <CallLogModal
              currentUser={currentUser}
              onClose={() => setShowCallLogModal(false)}
              onStartCallWith={handleStartCallWith}
            />
          )}

          {showGlobalSearchModal && (
            <GlobalSearchModal
              currentUser={currentUser}
              onClose={() => setShowGlobalSearchModal(false)}
              onSelectMessage={(peer, msgId) => {
                setSelectedChatId(peer);
                setSelectedChatType("user");
              }}
            />
          )}

          {showThemeModal && (
            <ThemePickerModal
              currentTheme={currentTheme}
              currentFont={currentFont}
              onSelectTheme={(t) => {
                setCurrentTheme(t);
                localStorage.setItem("elyano_theme", t);
              }}
              onSelectFont={(f) => {
                setCurrentFont(f);
                localStorage.setItem("elyano_font", f);
              }}
              onClose={() => setShowThemeModal(false)}
            />
          )}

          {showProfileModal && (
            <ProfileModal
              currentUser={currentUser}
              userMap={usersMap}
              onClose={() => setShowProfileModal(false)}
              onUpdateStatus={handleUpdateStatus}
              onUpdatePhoto={handleUpdatePhoto}
              onUpdateCoverPhoto={handleUpdateCoverPhoto}
              onUpdateFullProfile={handleUpdateFullProfile}
            />
          )}

          {/* Staff Member Full Profile Details Modal */}
          {viewingUserProfile && currentUser && (
            <UserProfileDetailsModal
              user={
                (viewingUserProfile.username === "BOT" || viewingUserProfile.username === "it_bot" || viewingUserProfile.is_bot)
                  ? {
                      ...(usersMap["BOT"] || usersMap["it_bot"] || viewingUserProfile),
                      username: "BOT",
                      is_bot: true,
                      role: "bot",
                      image: (usersMap["BOT"]?.image || usersMap["it_bot"]?.image || viewingUserProfile.image || "bot_avatar.jpg"),
                    }
                  : usersMap[viewingUserProfile.username] || viewingUserProfile
              }
              isOnline={
                onlineList.includes(viewingUserProfile.username) ||
                ((viewingUserProfile.username === "BOT" || viewingUserProfile.username === "it_bot" || viewingUserProfile.is_bot) &&
                  (onlineList.includes("it_bot") || onlineList.includes("BOT")))
              }
              currentUser={currentUser}
              onClose={() => setViewingUserProfile(null)}
              onOpenMyProfile={() => setShowProfileModal(true)}
              onStartChat={(username) => {
                const targetChat = username === "BOT" || username === "it_bot" ? "it_bot" : username;
                handleSelectChat(targetChat, "user");
                setViewingUserProfile(null);
              }}
              onStartCall={(username, type) => {
                handleStartCallWith(username, type);
                setViewingUserProfile(null);
              }}
              onStartMeeting={() => {
                handleStartGroupMeeting();
                setViewingUserProfile(null);
              }}
            />
          )}

          {showGroupModal && (
            <GroupModal
              currentUser={currentUser}
              usersMap={usersMap}
              onClose={() => setShowGroupModal(false)}
              onCreateGroup={handleCreateGroup}
            />
          )}

          {showAdminModal && (
            <AdminModal
              currentUser={currentUser}
              usersMap={usersMap}
              onlineList={onlineList}
              groups={groups}
              onClose={() => setShowAdminModal(false)}
              onRefreshData={() => {
                if (currentUser) {
                  socket.emit("authenticate", { user: currentUser, type: "login" });
                }
              }}
            />
          )}

          {showDeviceModal && (
            <DevicePermissionsModal onClose={() => setShowDeviceModal(false)} />
          )}

          {showFeedModal && currentUser && (
            <FeedModal
              currentUser={currentUser}
              usersMap={usersMap}
              onClose={() => setShowFeedModal(false)}
              onViewUserProfile={(u) => {
                setShowFeedModal(false);
                setViewingUserProfile(u);
              }}
            />
          )}

          {showPhoneNotebookModal && currentUser && (
            <PhoneNotebookModal
              currentUser={currentUser}
              usersMap={usersMap}
              onClose={() => setShowPhoneNotebookModal(false)}
            />
          )}

          {/* Mandatory Staff Onboarding Modal for First Login */}
          {showStaffOnboardingModal && currentUser && (
            <HospitalStaffOnboardingModal
              username={currentUser}
              onCompleted={(updatedProfile) => {
                setShowStaffOnboardingModal(false);
                const cleanU = (currentUser || "").trim().toLowerCase();
                localStorage.setItem(`elyano_onboarding_done_${cleanU}`, "true");
                setStaffUserProfile({
                  ...(updatedProfile || {}),
                  onboarding_completed: true,
                  shift_ongoing: true,
                });
                setUsersMap((prev) => ({
                  ...prev,
                  [currentUser]: {
                    ...(prev[currentUser] || {}),
                    ...updatedProfile,
                    onboarding_completed: true,
                    shift_ongoing: true,
                  },
                }));
                // Seamlessly select info_bot to show welcome & registered details
                handleSelectChat("info_bot", "user");
              }}
              onLogout={() => {
                handleLogout();
                setShowStaffOnboardingModal(false);
              }}
            />
          )}

          {/* Shift Presence Check-in Modal for Subsequent Logins */}
          {showShiftPresenceModal && currentUser && (
            <ShiftPresenceCheckinModal
              username={currentUser}
              userProfile={staffUserProfile || usersMap[currentUser]}
              onCompleted={(presenceData) => {
                setShowShiftPresenceModal(false);
                if (presenceData) {
                  setStaffUserProfile((prev: any) => ({
                    ...(prev || {}),
                    ...presenceData,
                    shift_ongoing: true,
                  }));
                  setUsersMap((prev) => ({
                    ...prev,
                    [currentUser]: {
                      ...(prev[currentUser] || {}),
                      ...presenceData,
                      shift_ongoing: true,
                    },
                  }));
                }
              }}
              onClose={() => setShowShiftPresenceModal(false)}
            />
          )}

          {/* Incoming Message Floating Pop-up Toast Banner */}
          {activeToast && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] w-[92vw] max-w-sm bg-slate-900/95 border border-sky-500/60 shadow-2xl rounded-2xl p-3 text-white flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300 backdrop-blur-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 font-bold flex items-center justify-center shrink-0 text-sm">
                  {activeToast.sender.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-sky-300 truncate">New Message: {activeToast.sender}</p>
                  <p className="text-[11px] text-slate-300 truncate">{activeToast.text}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    handleSelectChat(activeToast.chatId, activeToast.chatType);
                    setActiveToast(null);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[11px] shadow transition"
                >
                  View
                </button>
                <button
                  onClick={() => setActiveToast(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
