import React, { useState, useEffect } from "react";
import { User, Group, Ticket, AppSettings, Message, PlaceLocation, SplashPhoto, ITBotSchedule, TelegramConfig, TelegramDepartmentRoute } from "../types";
import { GroupMembersModal } from "./GroupMembersModal";
import {
  Shield,
  ShieldAlert,
  Users,
  MessageSquare,
  Ticket as TicketIcon,
  Radio,
  Download,
  Upload,
  UserPlus,
  Trash2,
  Edit,
  UserX,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  X,
  PhoneCall,
  Lock,
  Search,
  Server,
  Network,
  Database,
  Plus,
  Check,
  Building,
  MapPin,
  Image,
  FileImage,
  Layers,
  Zap,
  CheckCircle2,
  UserCheck,
  FileText,
  Bot,
  Cpu,
  Wrench,
  Sparkles,
  Terminal,
  User as UserIcon,
  Send,
  ExternalLink,
  Package,
  DownloadCloud,
  FileDown,
  ShieldCheck,
} from "lucide-react";

interface AdminModalProps {
  currentUser: string;
  usersMap: Record<string, User>;
  onlineList: string[];
  groups: Group[];
  onClose: () => void;
  onRefreshData?: () => void;
}

interface StatsData {
  user_count: number;
  online_count: number;
  message_count: number;
  group_count: number;
  ticket_counts: {
    total: number;
    open: number;
    working: number;
    solved: number;
    closed: number;
  };
  call_count: number;
}

interface BotVisualKnowledgeEntry {
  id: string;
  title: string;
  filename: string;
  admin_note: string;
  visual_notes: string;
  created_by: string;
  created_at: string;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  currentUser,
  usersMap,
  onlineList,
  groups,
  onClose,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<
    "stats" | "users" | "groups" | "messages" | "it_bot" | "visual_learning" | "telegram" | "ad_domain" | "sql_server" | "places" | "splash_photos" | "tickets" | "broadcast" | "backup" | "release"
  >("stats");

  // Telegram Integration State
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
    bot_token: "8405619013:AAHDaAS2p-sdsbxaf4U_gLRgXuXZV1FJpxQ",
    default_chat_id: "",
    department_routes: [
      { department: "IT Support", chat_id: "", label: "IT & Network Support Group" },
      { department: "Maintenance", chat_id: "", label: "Biomedical & Facilities Group" },
      { department: "Housekeeping", chat_id: "", label: "Housekeeping & Hygiene Group" },
      { department: "Pharmacy", chat_id: "", label: "Pharmacy & Medication Group" },
    ],
    enabled: true,
    notify_on_new_ticket: true,
    notify_on_ticket_status: true,
    notify_on_bot_triage: true,
    registered_chats: [],
  });
  const [newRouteDept, setNewRouteDept] = useState("");
  const [newRouteChatId, setNewRouteChatId] = useState("");
  const [newRouteLabel, setNewRouteLabel] = useState("");
  const [telegramBotInfo, setTelegramBotInfo] = useState<{ ok: boolean; username?: string; first_name?: string } | null>(null);
  const [telegramTestMsg, setTelegramTestMsg] = useState("🚨 Hospital Alert: Telegram Bot is active and connected to Elite Hospital Chat!");
  const [telegramTestTarget, setTelegramTestTarget] = useState("");
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramFeedback, setTelegramFeedback] = useState<string | null>(null);
  const [telegramUpdates, setTelegramUpdates] = useState<any[]>([]);

  const [stats, setStats] = useState<StatsData | null>(null);
  const [allUsers, setAllUsers] = useState<Record<string, User>>({});
  const [ticketsList, setTicketsList] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  // IT Bot Schedule & Diagnostic Settings State
  const [itBotConfig, setItBotConfig] = useState<ITBotSchedule>({
    enabled: true,
    mode: "always_online",
    shift_start: "00:00",
    shift_end: "23:59",
    work_days: [0, 1, 2, 3, 4, 5, 6],
    active_status_text: "🟢 24/7 Technical Diagnostic Specialist",
    offline_status_text: "🌙 Off-duty (On-call emergency triage)",
    target_group_id: "group_it_support",
    auto_analyze: true,
    auto_create_ticket: true,
    greeting_message: "Hello! I am your 24/7 IT Diagnostic Bot. Tell me what technical issue you are experiencing with your computer, printer, EMR, or network, and I will analyze it and immediately notify the on-duty IT Support team in the IT group chat.",
  });
  const [itBotProfile, setItBotProfile] = useState({
    username: "it_bot",
    status: "🟢 24/7 Technical Diagnostic Specialist",
    bio: "",
    image: "",
  });

  const handleBotAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setItBotProfile({ ...itBotProfile, image: dataUrl });
    };
    reader.readAsDataURL(file);
  };
  const [itBotLiveStatus, setItBotLiveStatus] = useState<{ is_online: boolean; reason: string; status_text: string } | null>(null);
  const [itBotSaving, setItBotSaving] = useState(false);
  const [itBotSavedMsg, setItBotSavedMsg] = useState(false);
  const [itBotGeminiActive, setItBotGeminiActive] = useState(true);
  const [testTriageInput, setTestTriageInput] = useState("Barcode Zebra printer on 2nd Floor ICU is jammed and flashing red error light");
  const [testTriageDept, setTestTriageDept] = useState("ICU / Intensive Care");
  const [testTriageResult, setTestTriageResult] = useState<any>(null);
  const [testTriageLoading, setTestTriageLoading] = useState(false);
  const [visualKnowledgeEntries, setVisualKnowledgeEntries] = useState<BotVisualKnowledgeEntry[]>([]);
  const [visualKnowledgeFile, setVisualKnowledgeFile] = useState<File | null>(null);
  const [visualKnowledgePreview, setVisualKnowledgePreview] = useState("");
  const [visualKnowledgeTitle, setVisualKnowledgeTitle] = useState("");
  const [visualKnowledgeNote, setVisualKnowledgeNote] = useState("");
  const [visualKnowledgeSaving, setVisualKnowledgeSaving] = useState(false);
  const [visualKnowledgeDeleting, setVisualKnowledgeDeleting] = useState<string | null>(null);
  const [visualKnowledgeFeedback, setVisualKnowledgeFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // SQL Server Test State
  const [sqlTestLoading, setSqlTestLoading] = useState(false);
  const [sqlTestResult, setSqlTestResult] = useState<{
    ok: boolean;
    connected: boolean;
    host?: string;
    port?: string;
    database?: string;
    latency_ms?: number;
    status_message?: string;
    tables_synced?: string[];
  } | null>(null);

  // Ticket Places State
  const [placesList, setPlacesList] = useState<PlaceLocation[]>([]);
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceFloor, setNewPlaceFloor] = useState("Ground Floor");
  const [newPlaceCategory, setNewPlaceCategory] = useState("Emergency");
  const [newPlaceExtension, setNewPlaceExtension] = useState("");
  const [newPlaceDesc, setNewPlaceDesc] = useState("");
  const [placeSearchQuery, setPlaceSearchQuery] = useState("");

  // Splash Screen Photos State
  const [splashPhotosList, setSplashPhotosList] = useState<SplashPhoto[]>([]);
  const [newPhotoTitle, setNewPhotoTitle] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");

interface ChatThread {
  id: string;
  type: "direct" | "group";
  participantA?: string;
  participantB?: string;
  groupId?: string;
  groupName?: string;
  messages: Message[];
  lastTimestamp: string;
  totalMessages: number;
  deletedCount: number;
}

  // Messages audit state
  const [adminMessages, setAdminMessages] = useState<Message[]>([]);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [auditViewMode, setAuditViewMode] = useState<"chat" | "table">("chat");
  const [threadSearch, setThreadSearch] = useState("");
  const [msgSearchSender, setMsgSearchSender] = useState("");
  const [msgSearchRecipient, setMsgSearchRecipient] = useState("");
  const [msgSearchKeyword, setMsgSearchKeyword] = useState("");
  const [msgTypeFilter, setMsgTypeFilter] = useState<string>("all");

  const [sqlSeedMsg, setSqlSeedMsg] = useState<string | null>(null);
  const [adConnectMsg, setAdConnectMsg] = useState<string | null>(null);

  // Create User state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [newStatus, setNewStatus] = useState("Available");
  const [newDepartment, setNewDepartment] = useState("General Staff");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newBio, setNewBio] = useState("");

  // Edit User state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<string>("user");
  const [editStatus, setEditStatus] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCanSeeAll, setEditCanSeeAll] = useState<boolean>(true);
  const [editVisibleUsers, setEditVisibleUsers] = useState<string[]>([]);

  // Create Group state
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([currentUser]);
  const [newGroupIsTicket, setNewGroupIsTicket] = useState(false);
  const [createGroupSuccess, setCreateGroupSuccess] = useState(false);
  const [groupUserSearch, setGroupUserSearch] = useState("");

  // Group member editing state
  const [editingGroupMembersModal, setEditingGroupMembersModal] = useState<Group | null>(null);

  // Admin Password Change state
  const [currentAdminPassInput, setCurrentAdminPassInput] = useState("");
  const [newAdminPassInput, setNewAdminPassInput] = useState("");
  const [adminPassLoading, setAdminPassLoading] = useState(false);
  const [adminPassMsg, setAdminPassMsg] = useState<string | null>(null);

  // Settings / AD / SQL Server State
  const [settings, setSettings] = useState<AppSettings>({
    no_auth_mode: true,
    ad_domain: "elitehospital.org",
    ad_ldap_url: "ldap://dc01.elitehospital.org:389",
    ad_base_dn: "DC=elitehospital,DC=org",
    ad_enabled: true,
    sql_server_host: "10.0.1.50:1433",
    sql_server_db: "EliteHospitalChatDB",
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [adSyncMsg, setAdSyncMsg] = useState<string | null>(null);

  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Release Package & PDF Manual State
  const [releaseInfo, setReleaseInfo] = useState<{
    release: { filename: string; size_mb: string; modified_at: string; exists: boolean } | null;
    pdf: { filename: string; size_kb: string; modified_at: string; exists: boolean } | null;
  } | null>(null);
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [isRebuildingRelease, setIsRebuildingRelease] = useState(false);
  const [releaseRebuildMsg, setReleaseRebuildMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchReleaseInfo = async () => {
    try {
      setReleaseLoading(true);
      const res = await fetch("/api/admin/release-info");
      const data = await res.json();
      if (data.ok) {
        setReleaseInfo({ release: data.release, pdf: data.pdf });
      }
    } catch (e) {
      console.error("Failed to fetch release info", e);
    } finally {
      setReleaseLoading(false);
    }
  };

  const handleRebuildRelease = async () => {
    try {
      setIsRebuildingRelease(true);
      setReleaseRebuildMsg(null);
      const res = await fetch("/api/admin/rebuild-release", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setReleaseRebuildMsg({ ok: true, text: "Standalone production release package and Screen Features PDF successfully re-compiled!" });
        fetchReleaseInfo();
      } else {
        setReleaseRebuildMsg({ ok: false, text: data.error || "Failed to rebuild release package" });
      }
    } catch (err: any) {
      setReleaseRebuildMsg({ ok: false, text: err.message || "Network error" });
    } finally {
      setIsRebuildingRelease(false);
    }
  };

  // Ticket filter state
  const [ticketFilter, setTicketFilter] = useState<
    "all" | "open" | "working" | "solved" | "closed"
  >("all");

  const fetchAdminStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setAllUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminTickets = async () => {
    try {
      const res = await fetch("/api/admin/tickets");
      const data = await res.json();
      setTicketsList(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data && data.ad_domain) {
        setSettings(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChatThreads = async () => {
    try {
      const res = await fetch("/api/admin/chat-threads");
      const data = await res.json();
      if (data.ok && Array.isArray(data.threads)) {
        setChatThreads(data.threads);
        if (data.threads.length > 0 && !selectedThreadId) {
          setSelectedThreadId(data.threads[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeedSqlServer = async () => {
    setLoading(true);
    setSqlSeedMsg(null);
    try {
      const res = await fetch("/api/admin/sql-seed", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setSqlSeedMsg(`✓ ${data.message} (Synced ${data.users_count} Users, ${data.messages_count} Messages, ${data.tickets_count} Tickets)`);
        fetchAdminSettings();
      }
    } catch (e) {
      setSqlSeedMsg("Failed to seed database to SQL Server.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectActiveDirectory = async () => {
    setLoading(true);
    setAdConnectMsg(null);
    try {
      const res = await fetch("/api/admin/ad-connect", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setAdConnectMsg(`✓ AD Connection Active for domain "${data.domain}". Connected at ${new Date(data.connected_at).toLocaleTimeString()} with ${data.synced_users} staff records synced.`);
        fetchAdminUsers();
        fetchAdminSettings();
      }
    } catch (e) {
      setAdConnectMsg("Failed to connect to Active Directory Domain Controller.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminMessages = async () => {
    try {
      const params = new URLSearchParams();
      if (msgSearchSender) params.append("sender", msgSearchSender);
      if (msgSearchRecipient) params.append("recipient", msgSearchRecipient);
      if (msgSearchKeyword) params.append("search", msgSearchKeyword);
      const res = await fetch(`/api/admin/messages?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setAdminMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAdminMessage = async (id: number) => {
    if (!confirm(`Delete message #${id}?`)) return;
    try {
      await fetch("/api/admin/message/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchAdminMessages();
      fetchChatThreads();
      fetchAdminStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportMessagesCSV = () => {
    if (adminMessages.length === 0) return alert("No messages to export");
    const headers = ["ID", "Sender", "Recipient/Group", "Type", "Text/Filename", "Timestamp", "Date/Time"];
    const rows = adminMessages.map((m) => [
      m.id,
      `"${m.sender.replace(/"/g, '""')}"`,
      `"${m.recipient.replace(/"/g, '""')}"`,
      m.type || "text",
      `"${(m.text || m.filename || "").replace(/"/g, '""')}"`,
      m.timestamp,
      `"${new Date(m.timestamp).toLocaleString()}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `elite_hospital_messages_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchAdminStats();
    fetchAdminUsers();
    fetchAdminTickets();
    fetchAdminSettings();
    fetchAdminMessages();
    fetchChatThreads();
    fetchConfig();
    fetchITBotConfig();
    fetchTelegramConfig();
    fetchReleaseInfo();
  }, []);

  const fetchTelegramConfig = async () => {
    try {
      const res = await fetch("/api/telegram/config");
      const data = await res.json();
      if (data.ok && data.telegram) {
        setTelegramConfig((prev) => ({
          ...prev,
          ...data.telegram,
          department_routes:
            Array.isArray(data.telegram.department_routes) && data.telegram.department_routes.length > 0
              ? data.telegram.department_routes
              : prev.department_routes || [
                  { department: "IT Support", chat_id: "", label: "IT & Network Support Group" },
                  { department: "Maintenance", chat_id: "", label: "Biomedical & Facilities Group" },
                  { department: "Housekeeping", chat_id: "", label: "Housekeeping & Hygiene Group" },
                  { department: "Pharmacy", chat_id: "", label: "Pharmacy & Medication Group" },
                ],
        }));
        if (data.telegram.default_chat_id && !telegramTestTarget) {
          setTelegramTestTarget(data.telegram.default_chat_id);
        }
      }
      if (data.bot_info) {
        setTelegramBotInfo(data.bot_info);
      }
    } catch (e) {
      console.error("Error fetching telegram config:", e);
    }
  };

  const handleSaveTelegramConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTelegramLoading(true);
    setTelegramFeedback(null);
    try {
      const res = await fetch("/api/telegram/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telegramConfig),
      });
      const data = await res.json();
      if (data.ok) {
        setTelegramFeedback("✓ Telegram Bot settings saved successfully!");
        if (data.bot_info) setTelegramBotInfo(data.bot_info);
        setTimeout(() => setTelegramFeedback(null), 4000);
      } else {
        setTelegramFeedback(`Error: ${data.m || "Failed to save"}`);
      }
    } catch (err: any) {
      setTelegramFeedback(`Error: ${err.message}`);
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleSendTelegramTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTelegramLoading(true);
    setTelegramFeedback(null);
    try {
      const res = await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramTestTarget || telegramConfig.default_chat_id,
          text: telegramTestMsg,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTelegramFeedback("✅ Message successfully delivered to Telegram!");
        fetchTelegramConfig();
      } else {
        setTelegramFeedback(`❌ Telegram delivery failed: ${data.m || JSON.stringify(data.error)}`);
      }
    } catch (err: any) {
      setTelegramFeedback(`❌ Error: ${err.message}`);
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleFetchTelegramUpdates = async () => {
    setTelegramLoading(true);
    try {
      const res = await fetch("/api/telegram/updates");
      const data = await res.json();
      if (data.ok) {
        const chats = data.chats || data.detected_chats || [];
        setTelegramUpdates(data.updates || []);
        if (chats.length > 0) {
          setTelegramFeedback(`✓ Found ${chats.length} chat/group(s) from Telegram!`);
          setTelegramConfig((prev) => ({
            ...prev,
            registered_chats: chats,
            default_chat_id: prev.default_chat_id || String(chats[0].id),
          }));
        } else {
          setTelegramFeedback("No recent messages received by the Telegram bot yet. Send a message like '/start' to the bot in Telegram first!");
        }
        await fetchTelegramConfig();
      } else {
        setTelegramFeedback(`Failed to get updates: ${data.m || data.error}`);
      }
    } catch (err: any) {
      setTelegramFeedback(`Error: ${err.message}`);
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleUpdateRouteChatId = (index: number, newChatId: string) => {
    const updatedRoutes = [...(telegramConfig.department_routes || [])];
    if (updatedRoutes[index]) {
      updatedRoutes[index] = { ...updatedRoutes[index], chat_id: newChatId };
      setTelegramConfig({ ...telegramConfig, department_routes: updatedRoutes });
    }
  };

  const handleUpdateRouteLabel = (index: number, newLabel: string) => {
    const updatedRoutes = [...(telegramConfig.department_routes || [])];
    if (updatedRoutes[index]) {
      updatedRoutes[index] = { ...updatedRoutes[index], label: newLabel };
      setTelegramConfig({ ...telegramConfig, department_routes: updatedRoutes });
    }
  };

  const handleAddDepartmentRoute = () => {
    if (!newRouteDept.trim()) return;
    const newRoute: TelegramDepartmentRoute = {
      department: newRouteDept.trim(),
      chat_id: newRouteChatId.trim(),
      label: newRouteLabel.trim() || `${newRouteDept.trim()} Group`,
    };
    const currentRoutes = telegramConfig.department_routes || [];
    setTelegramConfig({
      ...telegramConfig,
      department_routes: [...currentRoutes, newRoute],
    });
    setNewRouteDept("");
    setNewRouteChatId("");
    setNewRouteLabel("");
  };

  const handleRemoveDepartmentRoute = (index: number) => {
    const updated = (telegramConfig.department_routes || []).filter((_, i) => i !== index);
    setTelegramConfig({ ...telegramConfig, department_routes: updated });
  };

  const handleSendDepartmentTest = async (chatId: string, deptName: string) => {
    if (!chatId) {
      setTelegramFeedback(`Please enter a Chat ID or Group ID for ${deptName} first.`);
      return;
    }
    setTelegramLoading(true);
    try {
      const res = await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Name of issuer: Admin Test\nPlace: Central Operations - Test Console\nExtension number: 1000\nDescription of the problem: Test verification for ${deptName} Telegram route.`,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTelegramFeedback(`✅ Test delivered to ${deptName} (${chatId})!`);
      } else {
        setTelegramFeedback(`❌ Delivery failed: ${data.m || data.error}`);
      }
    } catch (err: any) {
      setTelegramFeedback(`❌ Error: ${err.message}`);
    } finally {
      setTelegramLoading(false);
    }
  };

  const fetchITBotConfig = async () => {
    try {
      const res = await fetch("/api/admin/it_bot/config");
      const data = await res.json();
      if (data.ok && data.schedule) {
        setItBotConfig(data.schedule);
        if (data.bot_profile) setItBotProfile(data.bot_profile);
        setItBotLiveStatus(data.current_status);
        setItBotGeminiActive(data.gemini_ai_enabled);
      }
    } catch (e) {
      console.error("Error fetching IT bot config:", e);
    }
  };

  const fetchVisualKnowledge = async () => {
    try {
      const res = await fetch(`/api/admin/bot_visual_knowledge?adminUsername=${encodeURIComponent(currentUser)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("elyano_token") || ""}` },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.m || "Could not load visual knowledge");
      setVisualKnowledgeEntries(data.entries || []);
    } catch (error) {
      setVisualKnowledgeFeedback({
        ok: false,
        text: error instanceof Error ? error.message : "Could not load visual knowledge",
      });
    }
  };

  const handleVisualKnowledgeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setVisualKnowledgeFile(null);
    setVisualKnowledgePreview("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setVisualKnowledgeFeedback({ ok: false, text: "Choose a JPEG, PNG, or WebP image." });
      event.target.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setVisualKnowledgeFeedback({ ok: false, text: "Images must be 8 MB or smaller." });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setVisualKnowledgeFeedback({ ok: false, text: "The selected image could not be read." });
        return;
      }
      setVisualKnowledgeFile(file);
      setVisualKnowledgePreview(reader.result);
      setVisualKnowledgeFeedback(null);
    };
    reader.onerror = () => setVisualKnowledgeFeedback({ ok: false, text: "The selected image could not be read." });
    reader.readAsDataURL(file);
  };

  const handleSubmitVisualKnowledge = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!visualKnowledgeFile || !visualKnowledgePreview) {
      setVisualKnowledgeFeedback({ ok: false, text: "Choose an image before teaching the bot." });
      return;
    }

    setVisualKnowledgeSaving(true);
    setVisualKnowledgeFeedback(null);
    try {
      const res = await fetch("/api/admin/bot_visual_knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("elyano_token") || ""}`,
        },
        body: JSON.stringify({
          adminUsername: currentUser,
          image_data: visualKnowledgePreview,
          filename: visualKnowledgeFile.name,
          title: visualKnowledgeTitle,
          admin_note: visualKnowledgeNote,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.m || "Image learning failed");

      setVisualKnowledgeEntries((entries) => [data.entry, ...entries].slice(0, 100));
      setVisualKnowledgeFile(null);
      setVisualKnowledgePreview("");
      setVisualKnowledgeTitle("");
      setVisualKnowledgeNote("");
      setVisualKnowledgeFeedback({ ok: true, text: "The image was analyzed and its notes were added to the bot's knowledge." });
      const fileInput = document.getElementById("visual-knowledge-image") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      setVisualKnowledgeFeedback({
        ok: false,
        text: error instanceof Error ? error.message : "Image learning failed",
      });
    } finally {
      setVisualKnowledgeSaving(false);
    }
  };

  const handleDeleteVisualKnowledge = async (id: string) => {
    setVisualKnowledgeDeleting(id);
    setVisualKnowledgeFeedback(null);
    try {
      const res = await fetch("/api/admin/bot_visual_knowledge/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("elyano_token") || ""}`,
        },
        body: JSON.stringify({ adminUsername: currentUser, id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.m || "Could not remove visual knowledge");
      setVisualKnowledgeEntries((entries) => entries.filter((entry) => entry.id !== id));
    } catch (error) {
      setVisualKnowledgeFeedback({
        ok: false,
        text: error instanceof Error ? error.message : "Could not remove visual knowledge",
      });
    } finally {
      setVisualKnowledgeDeleting(null);
    }
  };

  const handleSaveITBotConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setItBotSaving(true);
    setItBotSavedMsg(false);
    try {
      const res = await fetch("/api/admin/it_bot/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: itBotConfig, bot_profile: itBotProfile }),
      });
      const data = await res.json();
      if (data.ok) {
        setItBotSavedMsg(true);
        if (data.bot_profile) setItBotProfile(data.bot_profile);
        if (data.current_status) setItBotLiveStatus(data.current_status);
        setTimeout(() => setItBotSavedMsg(false), 3500);
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setItBotSaving(false);
    }
  };

  const handleRunTestTriage = async () => {
    if (!testTriageInput.trim()) return;
    setTestTriageLoading(true);
    setTestTriageResult(null);
    try {
      const res = await fetch("/api/admin/it_bot/test_triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: testTriageInput.trim(),
          sender: currentUser,
          department: testTriageDept,
        }),
      });
      const data = await res.json();
      if (data.ok && data.analysis) {
        setTestTriageResult(data.analysis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTestTriageLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      if (data.ok) {
        if (data.places) setPlacesList(data.places);
        if (data.settings?.splash_photos) setSplashPhotosList(data.settings.splash_photos);
      }
    } catch (e) {
      console.error("Error fetching config:", e);
    }
  };

  const handleTestSqlConnection = async () => {
    setSqlTestLoading(true);
    setSqlTestResult(null);
    try {
      const res = await fetch("/api/admin/sql-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: settings.sql_server_host,
          port: settings.sql_server_port || "1433",
          database: settings.sql_server_db,
          user: settings.sql_server_user || "sa",
          password: settings.sql_server_pass || "",
          encrypt: settings.sql_server_encrypt || false,
        }),
      });
      const data = await res.json();
      setSqlTestResult(data);
    } catch (e) {
      setSqlTestResult({
        ok: false,
        connected: false,
        status_message: "Failed to connect to SQL Server. Check network host/IP address.",
      });
    } finally {
      setSqlTestLoading(false);
    }
  };

  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceName.trim()) return;
    const newPlace: PlaceLocation = {
      id: "place_" + Date.now(),
      name: newPlaceName.trim(),
      floor: newPlaceFloor,
      category: newPlaceCategory,
      extension: newPlaceExtension.trim() || undefined,
      number: newPlaceExtension.trim() || undefined,
      description: newPlaceDesc.trim() || undefined,
    };
    const updated = [...placesList, newPlace];
    setPlacesList(updated);
    setNewPlaceName("");
    setNewPlaceExtension("");
    setNewPlaceDesc("");

    try {
      await fetch("/api/admin/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ places: updated }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePlace = async (id: string) => {
    const updated = placesList.filter((p) => p.id !== id);
    setPlacesList(updated);
    try {
      await fetch("/api/admin/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ places: updated }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSplashPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;

    const newPhoto: SplashPhoto = {
      id: "photo_" + Date.now(),
      title: newPhotoTitle.trim() || "Hospital View",
      url: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim() || "Elite Hospital Clinical Facilities",
      active: true,
    };

    const updated = [...splashPhotosList, newPhoto];
    setSplashPhotosList(updated);
    setNewPhotoTitle("");
    setNewPhotoUrl("");
    setNewPhotoCaption("");

    try {
      await fetch("/api/admin/splash-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: updated }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePhotoActive = async (id: string) => {
    const updated = splashPhotosList.map((p) => (p.id === id ? { ...p, active: !p.active } : p));
    setSplashPhotosList(updated);
    try {
      await fetch("/api/admin/splash-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: updated }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSplashPhoto = async (id: string) => {
    const updated = splashPhotosList.filter((p) => p.id !== id);
    setSplashPhotosList(updated);
    try {
      await fetch("/api/admin/splash-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: updated }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (updatedSettings: Partial<AppSettings>) => {
    try {
      const merged = { ...settings, ...updatedSettings };
      setSettings(merged);
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdSync = async () => {
    setLoading(true);
    setAdSyncMsg(null);
    try {
      const res = await fetch("/api/admin/ad-sync", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setAdSyncMsg(
          `✓ AD Sync Successful for domain "${data.synced_domain}". Added ${data.added_count} staff accounts.`
        );
        fetchAdminUsers();
        fetchAdminStats();
      }
    } catch (e) {
      setAdSyncMsg("Failed to sync with Active Directory");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/user/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword.trim() || "123456",
          role: newRole,
          status: newStatus.trim() || "Elite Hospital Staff",
          department: newDepartment.trim() || "General Staff",
          email: newEmail.trim() || `${newUsername.trim()}@elitehospital.org`,
          phone: newPhone.trim(),
          bio: newBio.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setNewUsername("");
        setNewPassword("");
        setNewStatus("Available");
        setNewDepartment("General Staff");
        setNewEmail("");
        setNewPhone("");
        setNewBio("");
        fetchAdminUsers();
        fetchAdminStats();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await fetch("/api/admin/user/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editingUser.username,
          password: editPassword || undefined,
          role: editRole,
          status: editStatus,
          department: editDepartment,
          email: editEmail,
          phone: editPhone,
          bio: editBio,
          can_see_all_users: editCanSeeAll,
          visible_users: editVisibleUsers,
        }),
      });
      setEditingUser(null);
      fetchAdminUsers();
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (username === "admin") return alert("Cannot delete superadmin");
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;

    try {
      await fetch("/api/admin/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      fetchAdminUsers();
      fetchAdminStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleKickUser = async (username: string) => {
    try {
      await fetch("/api/admin/user/kick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      fetchAdminStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch("/api/admin/group/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
          members: newGroupMembers,
          is_ticket_group: newGroupIsTicket,
          creator: currentUser,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setNewGroupName("");
        setCreateGroupSuccess(true);
        setTimeout(() => setCreateGroupSuccess(false), 3000);
        if (onRefreshData) onRefreshData();
        fetchAdminStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleGroupTicket = async (group: Group) => {
    try {
      await fetch("/api/admin/group/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: group.id,
          is_ticket_group: !group.is_ticket_group,
        }),
      });
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    try {
      await fetch("/api/admin/group/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: groupId }),
      });
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveGroupMembers = async (groupId: string, newMembers: string[]) => {
    try {
      const res = await fetch("/api/admin/group/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: groupId,
          members: newMembers,
        }),
      });
      const data = await res.json();
      if (data.ok && data.group) {
        // Update local editing group state if open
        if (editingGroupMembersModal && editingGroupMembersModal.id === groupId) {
          setEditingGroupMembersModal(data.group);
        }
      }
      if (onRefreshData) onRefreshData();
      fetchAdminStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTicket = async (ticketId: number) => {
    if (!confirm(`Are you sure you want to delete ticket #${ticketId}?`)) return;
    try {
      await fetch("/api/admin/ticket/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId }),
      });
      fetchAdminTickets();
      fetchAdminStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassInput.trim()) return;

    setAdminPassLoading(true);
    setAdminPassMsg(null);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUser: currentUser,
          currentPassword: currentAdminPassInput,
          newPassword: newAdminPassInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAdminPassMsg(`✓ ${data.m}`);
        setCurrentAdminPassInput("");
        setNewAdminPassInput("");
      } else {
        setAdminPassMsg(`⚠️ ${data.m || "Failed to update password"}`);
      }
    } catch (e) {
      setAdminPassMsg("⚠️ Error updating password");
    } finally {
      setAdminPassLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (
    ticketId: number,
    newStatus: "open" | "working" | "solved" | "closed"
  ) => {
    try {
      await fetch("/api/admin/ticket/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: ticketId,
          status: newStatus,
          working_by: currentUser,
        }),
      });
      fetchAdminTickets();
      fetchAdminStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    try {
      await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: currentUser,
          message: broadcastMessage.trim(),
          target: broadcastTarget,
        }),
      });
      setBroadcastMessage("");
      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 3000);
      fetchAdminStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadSqlServerScript = async () => {
    try {
      const res = await fetch("/api/admin/sql-script");
      const text = await res.text();
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EliteHospitalChatDB_SQLServer_Schema.sql`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const res = await fetch("/api/admin/backup");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `elyano_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        const res = await fetch("/api/admin/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });
        const data = await res.json();
        if (data.ok) {
          alert("Database successfully restored!");
          fetchAdminStats();
          fetchAdminUsers();
          fetchAdminTickets();
        }
      } catch (err) {
        alert("Invalid backup JSON file");
      }
    };
    reader.readAsText(file);
  };

  const filteredUserKeys = Object.keys(allUsers).filter((u) =>
    u.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredTickets = ticketsList.filter((t) =>
    ticketFilter === "all" ? true : t.status === ticketFilter
  );

  const me = usersMap[currentUser];
  const isAdmin = me?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
        <div className="w-full max-w-md bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl p-6 text-center space-y-4 text-slate-100">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            The System Admin Dashboard is strictly restricted to accounts with <span className="text-red-400 font-bold">Administrator privileges</span>. Your current account (<span className="text-sky-400 font-semibold">{currentUser}</span>) has standard Staff privileges.
          </p>
          <p className="text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
            Please log in with an Administrator account (e.g. <strong className="text-slate-200">Elite</strong>) to access system settings.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-5xl h-[90vh] max-h-[780px] bg-slate-900 border border-sky-500/30 rounded-2xl flex flex-col shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                System Administration Control Panel
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-semibold flex items-center gap-1">
                  <Building className="w-3 h-3" /> {settings.ad_domain}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Logged in as <span className="text-sky-400 font-semibold">{currentUser}</span> • Offline Intranet & SQL Server Mode
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="px-6 bg-slate-950/50 border-b border-slate-800 flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-3.5 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === "stats"
                ? "border-sky-500 text-sky-400 bg-sky-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Overview
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3.5 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === "users"
                ? "border-sky-500 text-sky-400 bg-sky-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Users ({Object.keys(allUsers).length})
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`px-3.5 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === "groups"
                ? "border-sky-500 text-sky-400 bg-sky-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Groups ({groups.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("messages");
              fetchAdminMessages();
            }}
            className={`px-3.5 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === "messages"
                ? "border-sky-500 text-sky-400 bg-sky-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" /> Messages Audit
          </button>
          <button
            onClick={() => {
              setActiveTab("it_bot");
              fetchITBotConfig();
            }}
            className={`px-3.5 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === "it_bot"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" /> IT Bot & Schedule
          </button>
          <button
            onClick={() => {
              setActiveTab("visual_learning");
              fetchVisualKnowledge();
            }}
            className={`px-3.5 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === "visual_learning"
                ? "border-violet-400 text-violet-300 bg-violet-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileImage className="w-3.5 h-3.5 text-violet-400" /> Image Learning
          </button>
          <button
            onClick={() => {
              setActiveTab("telegram");
              fetchTelegramConfig();
            }}
            className={`px-3.5 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === "telegram"
                ? "border-sky-400 text-sky-300 bg-sky-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Send className="w-3.5 h-3.5 text-sky-400" /> Telegram Bot
          </button>
          <button
            onClick={() => setActiveTab("ad_domain")}
            className={`px-3.5 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === "ad_domain"
                ? "border-sky-500 text-sky-400 bg-sky-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Network className="w-3.5 h-3.5 text-indigo-400" /> Active Directory (AD)
          </button>
          <button
            onClick={() => setActiveTab("sql_server")}
            className={`px-3.5 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === "sql_server"
                ? "border-sky-500 text-sky-400 bg-sky-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" /> SQL Server Config
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-3.5 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === "tickets"
                ? "border-sky-500 text-sky-400 bg-sky-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <TicketIcon className="w-3.5 h-3.5" /> Tickets ({ticketsList.length})
          </button>
          <button
            onClick={() => setActiveTab("places")}
            className={`px-3.5 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === "places"
                ? "border-sky-500 text-sky-400 bg-sky-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" /> Ticket Places ({placesList.length})
          </button>
          <button
            onClick={() => setActiveTab("splash_photos")}
            className={`px-3.5 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === "splash_photos"
                ? "border-sky-500 text-sky-400 bg-sky-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Image className="w-3.5 h-3.5 text-sky-400" /> Splash Photos ({splashPhotosList.length})
          </button>
          <button
            onClick={() => setActiveTab("broadcast")}
            className={`px-3.5 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === "broadcast"
                ? "border-sky-500 text-sky-400 bg-sky-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> Broadcast
          </button>
          <button
            onClick={() => setActiveTab("backup")}
            className={`px-3.5 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === "backup"
                ? "border-sky-500 text-sky-400 bg-sky-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Backup & Restore
          </button>
          <button
            onClick={() => {
              setActiveTab("release");
              fetchReleaseInfo();
            }}
            className={`px-3.5 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === "release"
                ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Package className="w-3.5 h-3.5 text-emerald-400" /> Release & PDF Manual
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {settingsSaved && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" /> System settings saved successfully!
            </div>
          )}

          {/* TAB 1: OVERVIEW & STATS */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold">{stats?.user_count || 0}</span>
                    <p className="text-xs text-slate-400 font-medium">Total Users</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold">{stats?.online_count || 0}</span>
                    <p className="text-xs text-slate-400 font-medium">Active Online</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold">{stats?.message_count || 0}</span>
                    <p className="text-xs text-slate-400 font-medium">Messages Sent</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <TicketIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold">{stats?.ticket_counts.total || 0}</span>
                    <p className="text-xs text-slate-400 font-medium">Support Tickets</p>
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Network className="w-8 h-8 text-indigo-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">
                      Organization Active Directory: <span className="text-sky-400">{settings.ad_domain}</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      LDAP Server: {settings.ad_ldap_url} • No-Auth Mode: {settings.no_auth_mode ? "ENABLED (Instant Staff Access)" : "Disabled"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAdSync}
                  className="px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs transition shrink-0"
                >
                  Sync AD Accounts
                </button>
              </div>

              {/* Ticket Breakdown Cards */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <TicketIcon className="w-4 h-4 text-amber-400" /> Support Tickets Breakdown
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <span className="text-lg font-bold text-amber-400">
                      {stats?.ticket_counts.open || 0}
                    </span>
                    <p className="text-[11px] text-amber-300 font-medium">Open</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                    <span className="text-lg font-bold text-blue-400">
                      {stats?.ticket_counts.working || 0}
                    </span>
                    <p className="text-[11px] text-blue-300 font-medium">In Progress</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="text-lg font-bold text-emerald-400">
                      {stats?.ticket_counts.solved || 0}
                    </span>
                    <p className="text-[11px] text-emerald-300 font-medium">Solved</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-center">
                    <span className="text-lg font-bold text-slate-300">
                      {stats?.ticket_counts.closed || 0}
                    </span>
                    <p className="text-[11px] text-slate-400 font-medium">Closed</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* Admin Master Password Change Section */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-amber-500/30 space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-4 h-4" /> Admin Security & Master Password Change
                </h3>
                <p className="text-[11px] text-slate-400">
                  Update the login password for Admin Mode (<span className="font-semibold text-slate-200">Elite</span> / Administrator).
                </p>
                <form onSubmit={handleChangeAdminPassword} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="password"
                    placeholder="Current Admin Password"
                    value={currentAdminPassInput}
                    onChange={(e) => setCurrentAdminPassInput(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                  <input
                    type="password"
                    placeholder="New Admin Password"
                    value={newAdminPassInput}
                    onChange={(e) => setNewAdminPassInput(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={adminPassLoading}
                    className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 disabled:opacity-50"
                  >
                    {adminPassLoading ? "Updating..." : "Update Master Admin Password"}
                  </button>
                </form>
                {adminPassMsg && (
                  <p className={`text-xs font-semibold ${adminPassMsg.includes("✓") ? "text-emerald-400" : "text-amber-400"}`}>
                    {adminPassMsg}
                  </p>
                )}
              </div>

              {/* Create User Section */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" /> Add New Staff / Admin User
                </h3>
                <form onSubmit={handleCreateUser} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Username *"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs focus:outline-none focus:border-sky-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Password (optional in no-auth)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs focus:outline-none focus:border-sky-500"
                    />
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as "admin" | "user")}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs focus:outline-none focus:border-sky-500"
                    >
                      <option value="user">User Role</option>
                      <option value="doctor">Medical Doctor</option>
                      <option value="nurse">Nurse / Clinical</option>
                      <option value="it_support">IT Specialist</option>
                      <option value="admin">Administrator Role</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Status (e.g. On Duty / Available)"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Department (e.g. Cardiology / IT)"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs focus:outline-none focus:border-sky-500"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs focus:outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      placeholder="Phone / Extension"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs focus:outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      placeholder="Bio / Specialization"
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="py-2 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition shadow-md shadow-sky-500/20"
                    >
                      Add & Seed User
                    </button>
                  </div>
                </form>
              </div>

              {/* Search & Users Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200">Registered Users Directory</h3>
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3">User</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Status / Department</th>
                        <th className="p-3">Presence</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {filteredUserKeys.map((u) => {
                        const user = allUsers[u];
                        const isOnline = onlineList.includes(u);
                        return (
                          <tr key={u} className="hover:bg-slate-800/40 transition">
                            <td className="p-3 font-semibold text-slate-100 flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[11px] text-sky-400 overflow-hidden">
                                {user.image ? (
                                  <img
                                    src={`/uploads/${user.image}`}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  u.substring(0, 2).toUpperCase()
                                )}
                              </div>
                              <span>{u}</span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  user.role === "admin"
                                    ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                                    : "bg-slate-800 text-slate-400"
                                }`}
                              >
                                {user.role === "admin" ? "Admin" : "User"}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400">{user.status || "—"}</td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${
                                  isOnline ? "text-emerald-400" : "text-slate-500"
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-600"
                                  }`}
                                />
                                {isOnline ? "Online" : "Offline"}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-1">
                              {isOnline && (
                                <button
                                  onClick={() => handleKickUser(u)}
                                  className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-semibold transition"
                                  title="Kick Session"
                                >
                                  Kick
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setEditRole(user.role || "user");
                                  setEditStatus(user.status || "");
                                  setEditDepartment(user.department || "");
                                  setEditEmail(user.email || "");
                                  setEditPhone(user.phone || "");
                                  setEditBio(user.bio || "");
                                  setEditPassword("");
                                  setEditCanSeeAll(user.can_see_all_users !== false);
                                  setEditVisibleUsers(user.visible_users || []);
                                }}
                                className="px-2 py-1 rounded bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 font-semibold transition"
                              >
                                Edit
                              </button>
                              {u !== "admin" && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 font-semibold transition"
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit User Modal Sub-overlay */}
              {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
                  <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 space-y-4 text-slate-100 shadow-2xl my-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="font-bold text-sm text-sky-400 flex items-center gap-2">
                          <UserCheck className="w-4 h-4" /> Edit User Profile & Permissions
                        </h3>
                        <p className="text-xs text-slate-400">
                          {editingUser.username} • Account Source:{" "}
                          <span className="font-semibold text-slate-200 uppercase">
                            {editingUser.source || "Local"}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">
                            Assigned Role
                          </label>
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-medium focus:outline-none focus:border-sky-500"
                          >
                            <option value="admin">System Administrator (Full Access)</option>
                            <option value="doctor">Medical Doctor / Consultant</option>
                            <option value="nurse">Registered Nurse / Clinical Staff</option>
                            <option value="it_support">IT & Systems Support</option>
                            <option value="staff">Hospital Staff / Department Member</option>
                            <option value="user">Standard User</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">
                            Status / Presence Note
                          </label>
                          <input
                            type="text"
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            placeholder="e.g. In Surgery / On Duty"
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">
                            Department
                          </label>
                          <input
                            type="text"
                            value={editDepartment}
                            onChange={(e) => setEditDepartment(e.target.value)}
                            placeholder="e.g. Cardiology / IT Support"
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder="e.g. staff@elitehospital.org"
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">
                            Phone / Ext.
                          </label>
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="e.g. Ext 4402"
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">
                            Bio / Specialization
                          </label>
                          <input
                            type="text"
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            placeholder="e.g. Specialist in Interventional Cardiology"
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">
                          Reset Account Password
                        </label>
                        <input
                          type="password"
                          placeholder="Leave blank to keep existing password"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      {/* User Visibility Section */}
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-sky-400 block text-xs">
                              Directory Visibility Management
                            </span>
                            <p className="text-[11px] text-slate-400">
                              Control which staff members this user can see and contact in their chat sidebar.
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={editCanSeeAll}
                              onChange={(e) => setEditCanSeeAll(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                          </label>
                        </div>

                        <div className="text-[11px] font-semibold text-slate-300">
                          {editCanSeeAll ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              ✓ Can see ALL users across the entire hospital directory
                            </span>
                          ) : (
                            <span className="text-amber-400 flex items-center gap-1">
                              ⚠️ Restricted Mode: User can only see Admins and explicitly assigned users below:
                            </span>
                          )}
                        </div>

                        {!editCanSeeAll && (
                          <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-900 border border-slate-800 rounded-xl">
                            {Object.keys(allUsers)
                              .filter((u) => u !== editingUser.username)
                              .map((u) => {
                                const isChecked = editVisibleUsers.includes(u);
                                return (
                                  <label
                                    key={u}
                                    onClick={() => {
                                      if (isChecked) {
                                        setEditVisibleUsers(editVisibleUsers.filter((x) => x !== u));
                                      } else {
                                        setEditVisibleUsers([...editVisibleUsers, u]);
                                      }
                                    }}
                                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                                      isChecked
                                        ? "bg-sky-500/15 border-sky-500/40 text-sky-300"
                                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                                    }`}
                                  >
                                    <span>
                                      {u} <span className="text-[10px] text-slate-500">({allUsers[u].role || "User"})</span>
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      readOnly
                                      className="accent-sky-500"
                                    />
                                  </label>
                                );
                              })}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition shadow-lg shadow-sky-500/20"
                        >
                          Save User Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GROUP MANAGEMENT */}
          {activeTab === "groups" && (
            <div className="space-y-6">
              {/* Create Group Form */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Create New Department / Channel Group
                </h3>

                {createGroupSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
                    ✓ Group created successfully!
                  </div>
                )}

                <form onSubmit={handleCreateGroup} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-medium block mb-1">Group Name</label>
                      <input
                        type="text"
                        placeholder="e.g. ICU Staff or Pharmacy Team"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                        <input
                          type="checkbox"
                          checked={newGroupIsTicket}
                          onChange={(e) => setNewGroupIsTicket(e.target.checked)}
                          className="rounded border-slate-700 text-sky-500 focus:ring-sky-500 w-4 h-4"
                        />
                        <span>Enable Support Ticket Channel (IT / Maintenance Requests)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-slate-300 font-medium text-xs">
                        Select Group Members ({newGroupMembers.length} selected):
                      </label>
                      <div className="relative w-48 sm:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search users by name..."
                          value={groupUserSearch}
                          onChange={(e) => setGroupUserSearch(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                      {Object.keys(allUsers)
                        .filter((u) => u.toLowerCase().includes(groupUserSearch.toLowerCase()))
                        .map((u) => {
                          const isSelected = newGroupMembers.includes(u);
                          return (
                            <button
                              key={u}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setNewGroupMembers(newGroupMembers.filter((m) => m !== u));
                                } else {
                                  setNewGroupMembers([...newGroupMembers, u]);
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-lg border text-left text-xs flex items-center justify-between transition ${
                                isSelected
                                  ? "bg-sky-500/20 border-sky-500/50 text-sky-300 font-semibold"
                                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              <span className="truncate">{u}</span>
                              {isSelected && <Check className="w-3 h-3 text-sky-400 shrink-0" />}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="py-2 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
                  >
                    Create Group Now
                  </button>
                </form>
              </div>

              {/* Existing Groups Grid */}
              <h3 className="text-sm font-bold text-slate-200">Existing System Groups ({groups.length})</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((grp) => (
                  <div
                    key={grp.id}
                    className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-sm text-slate-100">{grp.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            grp.is_ticket_group
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {grp.is_ticket_group ? "Support Channel" : "Standard Group"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Creator: {grp.creator}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Members ({grp.members.length}): {grp.members.join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setEditingGroupMembersModal(grp)}
                        className="py-1.5 px-3 rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 text-xs font-semibold transition flex items-center gap-1 shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Manage Members ({grp.members.length})
                      </button>
                      <button
                        onClick={() => handleToggleGroupTicket(grp)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition text-center truncate"
                      >
                        {grp.is_ticket_group ? "Disable Ticket Channel" : "Enable Ticket Channel"}
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(grp.id)}
                        className="py-1.5 px-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Group Members Modal Overlay */}
              {editingGroupMembersModal && (
                <GroupMembersModal
                  group={editingGroupMembersModal}
                  usersMap={usersMap}
                  onClose={() => setEditingGroupMembersModal(null)}
                  onSaveMembers={handleSaveGroupMembers}
                />
              )}
            </div>
          )}

          {/* TAB 3.5: MESSAGES AUDIT LOG & CHAT VIEWER */}
          {activeTab === "messages" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Message Audit & Real-Time Chat Inspector
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Open any conversation thread as Admin to inspect direct messages, group chats, edited text, and deleted audit logs.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
                      <button
                        onClick={() => setAuditViewMode("chat")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          auditViewMode === "chat"
                            ? "bg-sky-500 text-slate-950 shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Visual Chat Viewer
                      </button>
                      <button
                        onClick={() => setAuditViewMode("table")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          auditViewMode === "table"
                            ? "bg-sky-500 text-slate-950 shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Search className="w-3.5 h-3.5" /> Raw Table Audit
                      </button>
                    </div>

                    <button
                      onClick={handleExportMessagesCSV}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> CSV
                    </button>
                  </div>
                </div>

                {auditViewMode === "table" && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs pt-1">
                    <input
                      type="text"
                      placeholder="Filter Sender..."
                      value={msgSearchSender}
                      onChange={(e) => setMsgSearchSender(e.target.value)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      placeholder="Filter Recipient / Group..."
                      value={msgSearchRecipient}
                      onChange={(e) => setMsgSearchRecipient(e.target.value)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      placeholder="Search text in message..."
                      value={msgSearchKeyword}
                      onChange={(e) => setMsgSearchKeyword(e.target.value)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                    <div className="flex gap-2">
                      <select
                        value={msgTypeFilter}
                        onChange={(e) => setMsgTypeFilter(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-sky-500"
                      >
                        <option value="all">All Types</option>
                        <option value="text">Text Only</option>
                        <option value="image">Images</option>
                        <option value="file">Files</option>
                        <option value="voice">Voice Recordings</option>
                        <option value="ticket">Tickets</option>
                      </select>
                      <button
                        onClick={fetchAdminMessages}
                        className="px-4 py-2.5 rounded-xl bg-sky-500 text-slate-950 font-bold hover:bg-sky-400 shrink-0 transition"
                      >
                        Filter
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* VISUAL CHAT VIEWER MODE */}
              {auditViewMode === "chat" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[500px]">
                  {/* LEFT COLUMN: CHAT THREADS LIST */}
                  <div className="md:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-sky-400" /> Active Chats ({chatThreads.length})
                        </span>
                        <button
                          onClick={fetchChatThreads}
                          className="p-1 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                          title="Refresh Chat Threads"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Search conversation..."
                        value={threadSearch}
                        onChange={(e) => setThreadSearch(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1.5">
                      {chatThreads
                        .filter((t) => {
                          if (!threadSearch) return true;
                          const q = threadSearch.toLowerCase();
                          if (t.type === "group") return (t.groupName || t.groupId || "").toLowerCase().includes(q);
                          return (
                            (t.participantA || "").toLowerCase().includes(q) ||
                            (t.participantB || "").toLowerCase().includes(q)
                          );
                        })
                        .map((t) => {
                          const isSelected = selectedThreadId === t.id;
                          const lastMsg = t.messages[t.messages.length - 1];

                          return (
                            <button
                              key={t.id}
                              onClick={() => setSelectedThreadId(t.id)}
                              className={`w-full p-3 rounded-xl text-left transition flex items-start gap-3 ${
                                isSelected
                                  ? "bg-sky-500/15 border border-sky-500/40 text-slate-100"
                                  : "hover:bg-slate-800/50 text-slate-300"
                              }`}
                            >
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center font-bold text-xs text-sky-300 shrink-0 shadow">
                                {t.type === "group" ? (
                                  "👥"
                                ) : (
                                  `${(t.participantA || "?")[0].toUpperCase()}${(t.participantB || "?")[0].toUpperCase()}`
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-xs text-slate-100 truncate">
                                    {t.type === "group" ? (
                                      t.groupName || t.groupId
                                    ) : (
                                      <span className="text-sky-300">
                                        {t.participantA} <span className="text-slate-500 font-normal">↔</span> {t.participantB}
                                      </span>
                                    )}
                                  </span>
                                  {lastMsg && (
                                    <span className="text-[10px] text-slate-500 shrink-0">
                                      {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>

                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {lastMsg?.is_deleted ? (
                                    <span className="text-red-400 italic">🗑️ Message deleted</span>
                                  ) : (
                                    <span>{lastMsg?.msg || lastMsg?.text || `[${lastMsg?.type || "media"}]`}</span>
                                  )}
                                </p>

                                <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                                  <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium">
                                    {t.totalMessages} msgs
                                  </span>
                                  {t.deletedCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-red-950/80 text-red-400 border border-red-500/30 font-bold">
                                      {t.deletedCount} deleted
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}

                      {chatThreads.length === 0 && (
                        <div className="p-6 text-center text-xs text-slate-500">
                          No active conversation threads found.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT MAIN PANEL: INSPECTED CHAT CONVERSATION */}
                  <div className="md:col-span-8 bg-slate-950/90 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
                    {selectedThreadId ? (() => {
                      const thread = chatThreads.find((t) => t.id === selectedThreadId);
                      if (!thread) return null;

                      return (
                        <>
                          {/* Thread Header */}
                          <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white font-bold flex items-center justify-center text-sm shadow">
                                {thread.type === "group" ? "👥" : "💬"}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                                  {thread.type === "group" ? (
                                    <span>Group: {thread.groupName || thread.groupId}</span>
                                  ) : (
                                    <span>
                                      Direct Chat: <span className="text-sky-400">{thread.participantA}</span> & <span className="text-indigo-400">{thread.participantB}</span>
                                    </span>
                                  )}
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                  Admin Supervision View • {thread.totalMessages} Messages ({thread.deletedCount} Deleted)
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={fetchChatThreads}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-sky-400" /> Sync Thread
                            </button>
                          </div>

                          {/* Chat Messages Container */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/60">
                            {thread.messages.map((m) => {
                              const senderUser = usersMap[m.sender];
                              const isDeleted = m.is_deleted;
                              const isEdited = Boolean(m.original_text);

                              return (
                                <div
                                  key={m.id}
                                  className={`p-3.5 rounded-2xl border transition space-y-2 ${
                                    isDeleted
                                      ? "bg-red-950/20 border-red-500/40"
                                      : isEdited
                                      ? "bg-amber-950/20 border-amber-500/40"
                                      : "bg-slate-900/90 border-slate-800"
                                  }`}
                                >
                                  {/* Sender & Timestamp Header */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 font-bold text-[10px] text-sky-400 flex items-center justify-center">
                                        {m.sender[0]?.toUpperCase()}
                                      </div>
                                      <span className="text-xs font-bold text-slate-200">{m.sender}</span>
                                      {senderUser?.status && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                          {senderUser.status}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                      <span>{new Date(m.timestamp).toLocaleString()}</span>
                                      <button
                                        onClick={() => handleDeleteAdminMessage(m.id)}
                                        className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition"
                                        title="Delete message"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Content Rendering */}
                                  <div className="pl-8 text-xs leading-relaxed text-slate-100">
                                    {isDeleted ? (
                                      <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs space-y-1">
                                        <div className="font-bold text-red-400 flex items-center gap-1.5">
                                          <Trash2 className="w-3.5 h-3.5" /> Message Deleted (By {m.deleted_by || m.sender})
                                        </div>
                                        <p className="line-through text-slate-300 opacity-90">
                                          Original Text: "{m.original_text || m.msg || m.text || "[Attachment]"}"
                                        </p>
                                      </div>
                                    ) : (
                                      <div>
                                        {m.type === "image" && m.filename ? (
                                          <div className="space-y-1.5">
                                            <img
                                              src={`/uploads/${m.filename}`}
                                              alt="Attachment"
                                              className="max-h-48 rounded-xl border border-slate-800 object-cover"
                                            />
                                            <a
                                              href={`/uploads/${m.filename}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-sky-400 underline font-medium text-[11px] inline-block"
                                            >
                                              🖼️ Download Full Image ({m.filename})
                                            </a>
                                          </div>
                                        ) : m.type === "file" && m.filename ? (
                                          <a
                                            href={`/uploads/${m.filename}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium inline-flex items-center gap-2 hover:bg-indigo-500/20 transition"
                                          >
                                            <FileText className="w-4 h-4 text-indigo-400" />
                                            <span>Document Attachment ({m.filename})</span>
                                          </a>
                                        ) : m.type === "voice" && m.filename ? (
                                          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                                            <audio controls src={`/uploads/${m.filename}`} className="h-8 w-full max-w-xs" />
                                          </div>
                                        ) : (
                                          <p className="text-slate-100 font-normal">{m.msg || m.text || "—"}</p>
                                        )}

                                        {isEdited && (
                                          <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-0.5">
                                            <div className="font-bold flex items-center gap-1">
                                              <Edit className="w-3 h-3 text-amber-400" /> Edited Message Audit Detail
                                            </div>
                                            <div>
                                              <span className="font-semibold text-slate-300">Original Message: </span>
                                              <span className="italic">"{m.original_text}"</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {thread.messages.length === 0 && (
                              <div className="p-12 text-center text-xs text-slate-500">
                                This conversation thread is currently empty.
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })() : (
                      <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center h-full gap-2">
                        <MessageSquare className="w-8 h-8 text-slate-700" />
                        <span>Select a chat conversation thread on the left to inspect messages.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RAW TABLE AUDIT MODE */}
              {auditViewMode === "table" && (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <div className="max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 z-10">
                        <tr>
                          <th className="p-3">ID</th>
                          <th className="p-3">Sender</th>
                          <th className="p-3">Recipient / Group</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Content / Attachment</th>
                          <th className="p-3">Sent At</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                        {adminMessages
                          .filter((m) => (msgTypeFilter === "all" ? true : m.type === msgTypeFilter))
                          .map((m) => {
                            const isGroup = m.recipient.startsWith("group_") || groups.some((g) => g.id === m.recipient);
                            const groupName = groups.find((g) => g.id === m.recipient)?.name;

                            return (
                              <tr key={m.id} className="hover:bg-slate-800/40 transition">
                                <td className="p-3 text-slate-500 font-mono">#{m.id}</td>
                                <td className="p-3 font-semibold text-slate-100">{m.sender}</td>
                                <td className="p-3 text-sky-400 font-medium">
                                  {isGroup ? `👥 ${groupName || m.recipient}` : `👤 ${m.recipient}`}
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                                    {m.type || "text"}
                                  </span>
                                </td>
                                <td className="p-3 max-w-sm break-words space-y-1">
                                  {m.is_deleted ? (
                                    <div className="p-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-[11px]">
                                      <span className="font-bold text-red-400 block">
                                        🗑️ DELETED (By {m.deleted_by || m.sender})
                                      </span>
                                      <p className="line-through opacity-80">
                                        Original Text: "{m.original_text || m.msg || m.text || "[Attachment]"}"
                                      </p>
                                    </div>
                                  ) : (
                                    <div>
                                      {m.type === "image" && m.filename ? (
                                        <a
                                          href={`/uploads/${m.filename}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sky-400 underline font-semibold flex items-center gap-1"
                                        >
                                          🖼️ Image ({m.filename})
                                        </a>
                                      ) : m.type === "file" && m.filename ? (
                                        <a
                                          href={`/uploads/${m.filename}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-indigo-400 underline font-semibold flex items-center gap-1"
                                        >
                                          📎 File ({m.filename})
                                        </a>
                                      ) : m.type === "voice" && m.filename ? (
                                        <audio controls src={`/uploads/${m.filename}`} className="h-7 w-48" />
                                      ) : (
                                        <span className="text-slate-100 font-medium">{m.msg || m.text || "—"}</span>
                                      )}

                                      {m.original_text && (
                                        <div className="mt-1 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px]">
                                          <span className="font-bold block">✏️ EDITED VERSION (Audit Log)</span>
                                          <span>Original Text: "{m.original_text}"</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">
                                  {new Date(m.timestamp).toLocaleString()}
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleDeleteAdminMessage(m.id)}
                                    className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-semibold text-[11px] transition"
                                    title="Delete message from server"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}

                        {adminMessages.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                              No sent messages found matching current filter
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACTIVE DIRECTORY (AD) CONFIG */}
          {activeTab === "ad_domain" && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-3">
                  <Network className="w-6 h-6 text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Active Directory Integration Domain: <span className="text-sky-400 font-mono">elitehospital.org</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Configure internal LDAP / Active Directory connection for local offline hospital infrastructure. Automatically connects and synchronizes staff user accounts and medical departments on server launch.
                </p>
              </div>

              {adConnectMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium animate-in fade-in">
                  {adConnectMsg}
                </div>
              )}

              {adSyncMsg && (
                <div className="p-3.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-medium">
                  {adSyncMsg}
                </div>
              )}

              <div className="space-y-4 p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    Enable Active Directory Domain Integration
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.ad_enabled}
                    onChange={(e) =>
                      handleSaveSettings({ ad_enabled: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-slate-700 text-sky-500 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    AD Domain Name
                  </label>
                  <input
                    type="text"
                    value={settings.ad_domain}
                    onChange={(e) => setSettings({ ...settings, ad_domain: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    LDAP Server URL
                  </label>
                  <input
                    type="text"
                    value={settings.ad_ldap_url}
                    onChange={(e) => setSettings({ ...settings, ad_ldap_url: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Base DN
                  </label>
                  <input
                    type="text"
                    value={settings.ad_base_dn}
                    onChange={(e) => setSettings({ ...settings, ad_base_dn: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleConnectActiveDirectory}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <Network className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Connect to Active Directory
                  </button>
                  <button
                    onClick={() => handleSaveSettings(settings)}
                    className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
                  >
                    Save AD Config
                  </button>
                  <button
                    onClick={handleAdSync}
                    disabled={loading}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Sync Staff Accounts
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SQL SERVER & OFFLINE DEPLOYMENT */}
          {activeTab === "sql_server" && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Microsoft SQL Server Connection & Automated Database Seeding
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Connect Elyano Connect directly to the local or network Microsoft SQL Server instance installed on your device or intranet hospital server (`EliteHospitalChatDB`). Database is automatically seeded on server launch.
                </p>
              </div>

              {sqlSeedMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium animate-in fade-in">
                  {sqlSeedMsg}
                </div>
              )}

              {/* SQL Test Results Banner */}
              {sqlTestResult && (
                <div
                  className={`p-4 rounded-2xl border ${
                    sqlTestResult.ok
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                      : "bg-red-500/15 border-red-500/40 text-red-300"
                  } animate-in fade-in space-y-2 text-xs`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {sqlTestResult.ok ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Connected to SQL Server Successfully!
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-5 h-5 text-red-400" /> SQL Server Connection Error
                      </>
                    )}
                  </div>
                  <p>{sqlTestResult.status_message}</p>
                  {sqlTestResult.tables_synced && (
                    <div className="pt-1 flex flex-wrap gap-1.5 items-center text-[11px]">
                      <span className="font-semibold text-slate-200">Synced Tables:</span>
                      {sqlTestResult.tables_synced.map((tbl) => (
                        <span key={tbl} className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-mono">
                          {tbl}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* No Authentication Toggle Box */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-400" /> No-Authentication Intranet Mode
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    When enabled, hospital staff can log in directly without typing passwords inside the intranet.
                  </p>
                </div>
                <button
                  onClick={() => handleSaveSettings({ no_auth_mode: !settings.no_auth_mode })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                    settings.no_auth_mode
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {settings.no_auth_mode ? "ENABLED (No Passwords)" : "Password Required"}
                </button>
              </div>

              {/* SQL Server Config & Export */}
              <div className="space-y-4 p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                  <Server className="w-4 h-4" /> Microsoft SQL Server Instance Configuration
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      SQL Server Host / IP Address
                    </label>
                    <input
                      type="text"
                      value={settings.sql_server_host || "127.0.0.1"}
                      onChange={(e) =>
                        setSettings({ ...settings, sql_server_host: e.target.value })
                      }
                      placeholder="e.g. 127.0.0.1 or 10.0.1.50 or localhost"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Port
                    </label>
                    <input
                      type="text"
                      value={settings.sql_server_port || "1433"}
                      onChange={(e) =>
                        setSettings({ ...settings, sql_server_port: e.target.value })
                      }
                      placeholder="1433"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Database Name
                    </label>
                    <input
                      type="text"
                      value={settings.sql_server_db || "EliteHospitalChatDB"}
                      onChange={(e) =>
                        setSettings({ ...settings, sql_server_db: e.target.value })
                      }
                      placeholder="EliteHospitalChatDB"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      SQL User Account
                    </label>
                    <input
                      type="text"
                      value={settings.sql_server_user || "sa"}
                      onChange={(e) =>
                        setSettings({ ...settings, sql_server_user: e.target.value })
                      }
                      placeholder="sa"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      SQL User Password
                    </label>
                    <input
                      type="password"
                      value={settings.sql_server_pass || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, sql_server_pass: e.target.value })
                      }
                      placeholder="Enter SQL Password"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.sql_server_encrypt || false}
                        onChange={(e) =>
                          setSettings({ ...settings, sql_server_encrypt: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      Encrypt Connection (SSL/TLS)
                    </label>
                  </div>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={handleSeedSqlServer}
                    disabled={loading}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Database className="w-4 h-4" /> Seed Database into SQL Server
                  </button>

                  <button
                    onClick={handleTestSqlConnection}
                    disabled={sqlTestLoading}
                    className="py-2.5 px-4 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" /> {sqlTestLoading ? "Testing Connection..." : "Test SQL Connection"}
                  </button>

                  <button
                    onClick={() => handleSaveSettings(settings)}
                    className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
                  >
                    Save Config
                  </button>

                  <button
                    onClick={handleDownloadSqlServerScript}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs transition flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Download className="w-4 h-4" /> Export T-SQL Schema (.sql)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5.5: TICKETING SYSTEM PLACES / LOCATIONS MANAGER */}
          {activeTab === "places" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-100">
                      Hospital Ticket Locations & Places Management
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs">
                    {placesList.length} Registered Places
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Add, modify, and manage hospital locations, ward floors, and medical rooms available for staff when filing IT and maintenance tickets.
                </p>
              </div>

              {/* Add New Place Form */}
              <form onSubmit={handleAddPlace} className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add New Hospital Place / Location
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Place Name / Room</label>
                    <input
                      type="text"
                      value={newPlaceName}
                      onChange={(e) => setNewPlaceName(e.target.value)}
                      placeholder="e.g. ICU Bay 4 or MRI Room 2"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Extension</label>
                    <input
                      type="text"
                      value={newPlaceExtension}
                      onChange={(e) => setNewPlaceExtension(e.target.value)}
                      placeholder="e.g. 2002, 1001"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-sky-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Floor / Wing</label>
                    <input
                      type="text"
                      value={newPlaceFloor}
                      onChange={(e) => setNewPlaceFloor(e.target.value)}
                      placeholder="e.g. 2nd Floor - East Wing"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      required
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {["Lower Ground", "Ground Floor", "Mezanine Flooe", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor"].map((fl) => (
                        <button
                          key={fl}
                          type="button"
                          onClick={() => setNewPlaceFloor(fl)}
                          className={`text-[10px] px-1.5 py-0.5 rounded border transition ${
                            newPlaceFloor === fl
                              ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {fl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Category / Department</label>
                    <select
                      value={newPlaceCategory}
                      onChange={(e) => setNewPlaceCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                    >
                      <option value="Emergency">Emergency</option>
                      <option value="Inpatient">Inpatient</option>
                      <option value="Surgical">Surgical</option>
                      <option value="Radiology">Radiology</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="Laboratory">Laboratory</option>
                      <option value="Administration">Administration</option>
                      <option value="Facilities">Facilities</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Description / Equipment Details (Optional)</label>
                  <input
                    type="text"
                    value={newPlaceDesc}
                    onChange={(e) => setNewPlaceDesc(e.target.value)}
                    placeholder="e.g. Contains telemetry monitors and resuscitation cart"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Save New Location
                </button>
              </form>

              {/* Places Search Bar */}
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={placeSearchQuery}
                  onChange={(e) => setPlaceSearchQuery(e.target.value)}
                  placeholder="Search hospital places, floors, or extension numbers..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                />
                {placeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPlaceSearchQuery("")}
                    className="px-3 py-2 rounded-xl bg-slate-700 text-xs text-slate-300 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Registered Places Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {placesList
                  .filter((p) => {
                    if (!placeSearchQuery.trim()) return true;
                    const q = placeSearchQuery.toLowerCase().trim();
                    return (
                      p.name.toLowerCase().includes(q) ||
                      p.floor.toLowerCase().includes(q) ||
                      (p.extension && p.extension.includes(q)) ||
                      (p.number && p.number.includes(q)) ||
                      (p.category && p.category.toLowerCase().includes(q))
                    );
                  })
                  .map((place) => (
                  <div
                    key={place.id}
                    className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/60 flex items-start justify-between gap-3 group hover:border-amber-500/40 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                        <h5 className="font-bold text-sm text-slate-100">{place.name}</h5>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                          {place.category}
                        </span>
                        {(place.extension || place.number) && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-mono font-bold">
                            📞 Ext: {place.extension || place.number}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300">🏢 {place.floor}</p>
                      {place.description && <p className="text-[11px] text-slate-400 italic">{place.description}</p>}
                    </div>

                    <button
                      onClick={() => handleDeletePlace(place.id)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition"
                      title="Remove place"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5.6: SPLASH SCREEN PHOTO MANAGER */}
          {activeTab === "splash_photos" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="p-5 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image className="w-6 h-6 text-sky-400" />
                    <h3 className="text-sm font-bold text-slate-100">
                      Splash Screen Photo Carousel Customizer
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 font-bold text-xs">
                    {splashPhotosList.filter((p) => p.active).length} Active Photos
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Choose and configure medical imagery photos displayed on the splash launch screen when opening Elyano Connect.
                </p>
              </div>

              {/* Add Custom Splash Photo Form */}
              <form onSubmit={handleAddSplashPhoto} className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Custom Photo to Carousel
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Photo Title</label>
                    <input
                      type="text"
                      value={newPhotoTitle}
                      onChange={(e) => setNewPhotoTitle(e.target.value)}
                      placeholder="e.g. Surgical Suite"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Image URL</label>
                    <input
                      type="text"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Caption / Subtitle</label>
                  <input
                    type="text"
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    placeholder="e.g. State-of-the-Art Robotic Surgical Operating Theatre"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Photo to Splash
                </button>
              </form>

              {/* Photo Gallery Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {splashPhotosList.map((photo) => (
                  <div
                    key={photo.id}
                    className="rounded-2xl bg-slate-800/40 border border-slate-700/60 overflow-hidden group hover:border-sky-500/50 transition flex flex-col justify-between"
                  >
                    <div className="relative h-40 bg-slate-950 overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => handleTogglePhotoActive(photo.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 ${
                            photo.active
                              ? "bg-emerald-500/80 text-white shadow"
                              : "bg-slate-900/80 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {photo.active ? "✓ Active in Splash" : "Inactive"}
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-3 right-3 text-white">
                        <h5 className="font-bold text-xs drop-shadow">{photo.title}</h5>
                        <p className="text-[10px] text-slate-300 truncate">{photo.caption}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900/60 flex items-center justify-between border-t border-slate-800">
                      <span className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                        {photo.url}
                      </span>
                      <button
                        onClick={() => handleDeleteSplashPhoto(photo.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: IT BOT & SCHEDULE CONFIGURATION */}
          {activeTab === "it_bot" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-sm font-bold text-slate-100">
                      Hospital IT Diagnostic Bot & Smart Routing Configuration
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    itBotLiveStatus?.is_online ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}>
                    {itBotLiveStatus?.is_online ? "🟢 Bot Online" : "🌙 Bot Off-Duty"}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Configure the built-in IT Bot user schedule, language auto-detection (English & Egyptian Arabic dialect), smart multi-group routing, and automated ticketing.
                </p>
                {itBotLiveStatus && (
                  <p className="text-[11px] text-cyan-300 font-mono">
                    Status Message: "{itBotLiveStatus.status_text}" — {itBotLiveStatus.reason}
                  </p>
                )}
              </div>

              {itBotSavedMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" /> IT Bot configuration and schedule saved successfully!
                </div>
              )}

              <form onSubmit={handleSaveITBotConfig} className="space-y-5">
                <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <UserIcon className="w-4 h-4" /> Bot Profile & Identity Configuration
                  </h4>
                  <p className="text-[11px] text-slate-400">Configure the bot name, status badge text, avatar image URL, and biography as displayed to users.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Bot Username / Display Name</label>
                      <input
                        type="text"
                        value={itBotProfile.username}
                        onChange={(e) => setItBotProfile({ ...itBotProfile, username: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                        placeholder="e.g. IT Bot or General Bot"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Status Message / Badge</label>
                      <input
                        type="text"
                        value={itBotProfile.status}
                        onChange={(e) => setItBotProfile({ ...itBotProfile, status: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                        placeholder="e.g. 🟢 24/7 Technical Diagnostic Specialist"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-xs font-semibold text-slate-300 block">Bot Avatar Photo</label>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-400 overflow-hidden shrink-0">
                          {itBotProfile.image ? (
                            <img src={itBotProfile.image} alt="Bot Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span>BOT</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium cursor-pointer transition inline-flex items-center gap-1.5">
                              <span>Upload Image File</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleBotAvatarFileChange}
                                className="hidden"
                              />
                            </label>
                            {itBotProfile.image && (
                              <button
                                type="button"
                                onClick={() => setItBotProfile({ ...itBotProfile, image: "" })}
                                className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1"
                              >
                                Remove Photo
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={itBotProfile.image || ""}
                            onChange={(e) => setItBotProfile({ ...itBotProfile, image: e.target.value })}
                            className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-[11px] text-slate-300"
                            placeholder="Or paste image URL..."
                          />
                        </div>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Bot Biography / About</label>
                      <textarea
                        rows={2}
                        value={itBotProfile.bio || ""}
                        onChange={(e) => setItBotProfile({ ...itBotProfile, bio: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                        <Cpu className="w-4 h-4" /> Bot Operational State & Schedule
                      </h4>
                      <p className="text-[11px] text-slate-400">Enable or disable automatic bot responses and set schedule shifts.</p>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={itBotConfig.enabled}
                        onChange={(e) => setItBotConfig({ ...itBotConfig, enabled: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                      />
                      Enable IT Bot
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Schedule Mode</label>
                      <select
                        value={itBotConfig.mode}
                        onChange={(e) => setItBotConfig({ ...itBotConfig, mode: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      >
                        <option value="always_online">Always Online (24/7 Support)</option>
                        <option value="custom_schedule">Custom Shift Hours</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Default Target Group (Fallback)</label>
                      <select
                        value={itBotConfig.target_group_id}
                        onChange={(e) => setItBotConfig({ ...itBotConfig, target_group_id: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      >
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} {g.is_ticket_group ? "(Ticketing Enabled)" : "(Non-Ticketing)"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Shift Start Time</label>
                      <input
                        type="time"
                        value={itBotConfig.shift_start}
                        onChange={(e) => setItBotConfig({ ...itBotConfig, shift_start: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Shift End Time</label>
                      <input
                        type="time"
                        value={itBotConfig.shift_end}
                        onChange={(e) => setItBotConfig({ ...itBotConfig, shift_end: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Bot Greeting Message</label>
                    <textarea
                      rows={3}
                      value={itBotConfig.greeting_message || ""}
                      onChange={(e) => setItBotConfig({ ...itBotConfig, greeting_message: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={itBotSaving}
                    className="py-2.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Bot className="w-4 h-4" /> {itBotSaving ? "Saving..." : "Save IT Bot Configuration"}
                  </button>
                </div>
              </form>

              {/* Interactive Test Triage Sandbox */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> Live Triage & Routing Simulator (Test Bot)
                </h4>
                <p className="text-xs text-slate-300">
                  Test how the IT Bot analyzes technical issues, collects user/location details, matches Egyptian Arabic or English, and routes tickets to the appropriate group.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Test Problem Message (Try English or Arabic)</label>
                    <input
                      type="text"
                      value={testTriageInput}
                      onChange={(e) => setTestTriageInput(e.target.value)}
                      placeholder="e.g. التكييف باظ في الطوارئ or Zebra printer jammed in ICU"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Department</label>
                    <input
                      type="text"
                      value={testTriageDept}
                      onChange={(e) => setTestTriageDept(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRunTestTriage}
                  disabled={testTriageLoading}
                  className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold text-xs transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${testTriageLoading ? "animate-spin" : ""}`} /> {testTriageLoading ? "Analyzing..." : "Run AI Triage Test"}
                </button>

                {testTriageResult && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center justify-between text-cyan-400 font-bold border-b border-slate-800 pb-2">
                      <span>🏷️ Category: {testTriageResult.category}</span>
                      <span>⚡ Severity: {testTriageResult.severity}</span>
                      <span>📍 Floor: {testTriageResult.floor}</span>
                    </div>
                    <p><strong className="text-slate-200">Root Cause:</strong> {testTriageResult.root_cause}</p>
                    <p><strong className="text-slate-200">Engineer Action:</strong> {testTriageResult.engineer_action}</p>
                    <div>
                      <strong className="text-slate-200 block mb-1">Generated User Reply Preview:</strong>
                      <div className="p-2.5 rounded-lg bg-slate-900 text-slate-300 whitespace-pre-wrap text-[11px]">
                        {testTriageResult.user_reply_markdown}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "visual_learning" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="p-5 rounded-2xl bg-violet-500/10 border border-violet-500/30 space-y-2">
                <div className="flex items-center gap-3">
                  <FileImage className="w-6 h-6 text-violet-400" />
                  <h3 className="text-sm font-bold text-slate-100">Teach the IT Bot with Photos</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Add photos of equipment, labels, warning lights, or error screens. Gemini extracts useful visual details and the bot can use these notes in future IT triage.
                </p>
                <p className="text-[11px] text-amber-300">
                  Do not upload patient-identifying or other sensitive personal information. The image is analyzed but not retained; only the extracted notes and your context are saved.
                </p>
              </div>

              <form onSubmit={handleSubmitVisualKnowledge} className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Reference title (optional)</label>
                    <input
                      value={visualKnowledgeTitle}
                      onChange={(event) => setVisualKnowledgeTitle(event.target.value)}
                      maxLength={120}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      placeholder="e.g. ICU Zebra printer status lights"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Admin context (optional)</label>
                    <input
                      value={visualKnowledgeNote}
                      onChange={(event) => setVisualKnowledgeNote(event.target.value)}
                      maxLength={1000}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      placeholder="Add confirmed device details or guidance"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold cursor-pointer transition inline-flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" /> Choose Photo
                    <input
                      id="visual-knowledge-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleVisualKnowledgeFileChange}
                      className="hidden"
                    />
                  </label>
                  {visualKnowledgeFile && (
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={visualKnowledgePreview} alt="Selected learning reference" className="w-14 h-14 rounded-lg object-cover border border-slate-600" />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-200 truncate">{visualKnowledgeFile.name}</p>
                        <p className="text-[11px] text-slate-400">{(visualKnowledgeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setVisualKnowledgeFile(null);
                          setVisualKnowledgePreview("");
                          const fileInput = document.getElementById("visual-knowledge-image") as HTMLInputElement | null;
                          if (fileInput) fileInput.value = "";
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={visualKnowledgeSaving || !visualKnowledgeFile}
                    className="sm:ml-auto py-2.5 px-5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${visualKnowledgeSaving ? "animate-spin" : ""}`} />
                    {visualKnowledgeSaving ? "Analyzing image..." : "Teach the Bot"}
                  </button>
                </div>
                {visualKnowledgeFeedback && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${
                    visualKnowledgeFeedback.ok
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                  }`}>
                    {visualKnowledgeFeedback.text}
                  </div>
                )}
              </form>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Saved Visual Knowledge</h4>
                  <span className="text-[11px] text-slate-400">{visualKnowledgeEntries.length} reference{visualKnowledgeEntries.length === 1 ? "" : "s"}</span>
                </div>
                {visualKnowledgeEntries.length === 0 ? (
                  <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-400 text-center">
                    No image references yet. Choose a photo above to teach the bot.
                  </div>
                ) : (
                  visualKnowledgeEntries.map((entry) => (
                    <div key={entry.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h5 className="text-sm font-bold text-violet-200">{entry.title}</h5>
                          <p className="text-[11px] text-slate-400">{entry.filename} · Added by {entry.created_by} · {new Date(entry.created_at).toLocaleString()}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteVisualKnowledge(entry.id)}
                          disabled={visualKnowledgeDeleting === entry.id}
                          className="shrink-0 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition flex items-center gap-1 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {visualKnowledgeDeleting === entry.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                      {entry.admin_note && <p className="text-xs text-slate-300"><strong className="text-slate-200">Admin context:</strong> {entry.admin_note}</p>}
                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{entry.visual_notes}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: TELEGRAM BOT INTEGRATION */}
          {activeTab === "telegram" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Status & Overview Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-cyan-500/10 border border-sky-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        Telegram Bot Integration & Ticket Dispatch
                        {telegramConfig.enabled && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                            Active
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-300">
                        Connect hospital chat directly to Telegram to automatically forward IT tickets, maintenance alerts, and messages to Telegram staff and channels.
                      </p>
                    </div>
                  </div>

                  {telegramBotInfo?.username ? (
                    <a
                      href={`https://t.me/${telegramBotInfo.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open @{telegramBotInfo.username}
                    </a>
                  ) : (
                    <button
                      onClick={() => fetchTelegramConfig()}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition shrink-0"
                    >
                      Check Bot Status
                    </button>
                  )}
                </div>

                {telegramBotInfo && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Bot Name: </span>
                      <span className="font-bold text-slate-100">{telegramBotInfo.first_name || "Telegram Bot"}</span>
                    </div>
                    {telegramBotInfo.username && (
                      <div>
                        <span className="text-slate-400">Username: </span>
                        <span className="font-mono text-sky-400 font-bold">@{telegramBotInfo.username}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400">API Status: </span>
                      <span className="text-emerald-400 font-bold">🟢 Connected & Verified</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Feedback toast / alert */}
              {telegramFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition animate-in fade-in ${
                    telegramFeedback.includes("Error") || telegramFeedback.includes("❌")
                      ? "bg-red-500/15 border-red-500/40 text-red-300"
                      : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  }`}
                >
                  <span>{telegramFeedback}</span>
                  <button
                    onClick={() => setTelegramFeedback(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Bot Settings Form */}
              <form onSubmit={handleSaveTelegramConfig} className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Telegram Bot API Credentials & Configuration
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Telegram Bot HTTP API Token
                    </label>
                    <input
                      type="password"
                      value={telegramConfig.bot_token}
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, bot_token: e.target.value })}
                      placeholder="e.g. 8405619013:AAHDaAS2p-sdsbxaf4U_gLRgXuXZV1FJpxQ"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono"
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Provided via BotFather in Telegram. Configured to dispatch hospital issues.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Default Target Chat ID or Group ID
                    </label>
                    <input
                      type="text"
                      value={telegramConfig.default_chat_id}
                      onChange={(e) => {
                        setTelegramConfig({ ...telegramConfig, default_chat_id: e.target.value });
                        setTelegramTestTarget(e.target.value);
                      }}
                      placeholder="e.g. -1004313640183 (group) or 123456789 (private user)"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono focus:border-sky-400 focus:outline-none"
                    />
                    
                    {telegramConfig.registered_chats && telegramConfig.registered_chats.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-slate-400">Detected:</span>
                        {telegramConfig.registered_chats.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setTelegramConfig({ ...telegramConfig, default_chat_id: String(c.id) });
                              setTelegramTestTarget(String(c.id));
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[11px] font-mono transition flex items-center gap-1"
                            title="Click to use this detected Telegram ID"
                          >
                            <Users className="w-3 h-3" />
                            {c.title || "Group"} ({c.id})
                          </button>
                        ))}
                      </div>
                    )}

                    {telegramConfig.default_chat_id === "5599763387" && (
                      <div className="mt-2 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs space-y-1.5">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>Group ID Fix: 5599763387 is missing Telegram supergroup prefix</span>
                        </div>
                        <p className="text-[11px] text-amber-200 leading-relaxed">
                          Telegram supergroups require a <strong>-100</strong> prefix. Telegram rejected <code>5599763387</code> as a private user ("CHAT NOT FOUND"). Your detected IT group ID is <strong>-1004313640183</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setTelegramConfig({ ...telegramConfig, default_chat_id: "-1004313640183" });
                            setTelegramTestTarget("-1004313640183");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                        >
                          Click to set ID: -1004313640183
                        </button>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400 mt-1">
                      💡 <strong>Important Telegram Tip:</strong> Telegram Group and Supergroup IDs always start with <strong>-100</strong> (e.g. <code>-1004313640183</code>).
                    </p>
                  </div>
                </div>

                {/* Automation Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-700/60">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={telegramConfig.enabled}
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, enabled: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-500 accent-sky-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Enable Telegram Integration</span>
                      <span className="text-[11px] text-slate-400">Activate forwarding endpoints and context menus</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={telegramConfig.notify_on_new_ticket}
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, notify_on_new_ticket: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-500 accent-sky-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Auto-Forward New Tickets</span>
                      <span className="text-[11px] text-slate-400">Instantly post newly filed tickets to default chat</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={telegramConfig.notify_on_ticket_status}
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, notify_on_ticket_status: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-500 accent-sky-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Forward Ticket Status Updates</span>
                      <span className="text-[11px] text-slate-400">Notify when tickets are marked In Progress or Solved</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={telegramConfig.notify_on_bot_triage}
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, notify_on_bot_triage: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-500 accent-sky-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Forward IT Bot Diagnostic Incidents</span>
                      <span className="text-[11px] text-slate-400">Post automated triage reports when users chat with IT Bot</span>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={telegramLoading}
                    className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow"
                  >
                    {telegramLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Telegram Configuration
                  </button>
                </div>
              </form>

              {/* Department & Specialized Group Chat ID Routing */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4" /> Department & Group Telegram Routing (IT, Maintenance, Housekeeping, etc.)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Specify the Telegram Chat ID or Group ID for each hospital department. Any ticket submitted by users or the BOT will be forwarded directly to the designated Telegram group or user.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveTelegramConfig()}
                    disabled={telegramLoading}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition flex items-center gap-1.5 shrink-0"
                  >
                    {telegramLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save Department Routes
                  </button>
                </div>

                {/* Standard Message Pattern Preview Notice */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Forwarded Message Pattern:
                    </div>
                    <code className="text-[11px] font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded block">
                      Name of issuer, Place, Extension number, Description of the problem
                    </code>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Updates submitted as a 1-line reply to original ticket
                  </div>
                </div>

                {/* Department Routes List */}
                <div className="space-y-3">
                  {(telegramConfig.department_routes || []).map((route, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            {route.department}
                          </span>
                          <input
                            type="text"
                            value={route.label || ""}
                            onChange={(e) => handleUpdateRouteLabel(idx, e.target.value)}
                            placeholder="Descriptive label (e.g. IT Helpdesk Group)"
                            className="text-xs bg-transparent border-b border-dashed border-slate-700 hover:border-slate-500 focus:border-sky-400 text-slate-300 px-1 py-0.5 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          {route.chat_id && (
                            <button
                              type="button"
                              onClick={() => handleSendDepartmentTest(route.chat_id, route.department)}
                              disabled={telegramLoading}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-[11px] font-semibold border border-emerald-500/30 transition flex items-center gap-1"
                              title="Send test message to this department"
                            >
                              <Send className="w-3 h-3" /> Test
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveDepartmentRoute(idx)}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 transition"
                            title="Remove department route"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-8">
                          <input
                            type="text"
                            value={route.chat_id || ""}
                            onChange={(e) => handleUpdateRouteChatId(idx, e.target.value)}
                            placeholder="Enter Telegram Chat ID or Group ID (e.g. -1001234567890 or 123456789)"
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:border-amber-400 focus:outline-none"
                          />
                        </div>

                        {/* Quick pick from discovered chats */}
                        {telegramConfig.registered_chats && telegramConfig.registered_chats.length > 0 && (
                          <div className="sm:col-span-4">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleUpdateRouteChatId(idx, e.target.value);
                                }
                              }}
                              className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-400 hover:text-slate-200 focus:border-amber-400 focus:outline-none"
                            >
                              <option value="">Quick select chat/group...</option>
                              {telegramConfig.registered_chats.map((c) => (
                                <option key={c.id} value={String(c.id)}>
                                  {c.title || `Chat ${c.id}`} ({c.id})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Custom Department Route */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-dashed border-slate-700 space-y-2">
                  <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-sky-400" /> Add New Department Group Route
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newRouteDept}
                      onChange={(e) => setNewRouteDept(e.target.value)}
                      placeholder="Department (e.g. Security, Lab, ICU)"
                      className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200"
                    />
                    <input
                      type="text"
                      value={newRouteLabel}
                      onChange={(e) => setNewRouteLabel(e.target.value)}
                      placeholder="Group Label (e.g. Hospital Security Team)"
                      className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newRouteChatId}
                        onChange={(e) => setNewRouteChatId(e.target.value)}
                        placeholder="Chat or Group ID"
                        className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddDepartmentRoute}
                        disabled={!newRouteDept.trim()}
                        className="px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Test Message & Chat Dispatcher */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <Send className="w-4 h-4" /> Live Test & Manual Telegram Dispatch
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTelegramTestMsg("🚨 [URGENT IT TICKET #TK-101] Medical Workstation Offline\n📍 Floor: Mezanine Flooe\n🏥 Room: ICU Bay 3\n👤 Reported By: Dr. Tarek\n⚠️ Issue: EMR screen frozen during patient round.")}
                      className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                    >
                      Sample Ticket
                    </button>
                    <button
                      type="button"
                      onClick={() => setTelegramTestMsg("✅ [TICKET SOLVED #TK-101] Network switch reset on Mezanine Flooe. All medical systems operating normally.")}
                      className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                    >
                      Solved Notice
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Recipient Telegram Chat ID / Group ID
                    </label>
                    <input
                      type="text"
                      value={telegramTestTarget}
                      onChange={(e) => setTelegramTestTarget(e.target.value)}
                      placeholder="Leave blank to use default chat ID configured above"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Message Content (Supports Markdown, Emoji & Hospital formatting)
                    </label>
                    <textarea
                      rows={3}
                      value={telegramTestMsg}
                      onChange={(e) => setTelegramTestMsg(e.target.value)}
                      placeholder="Type message to send to Telegram..."
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 resize-none font-sans"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendTelegramTest()}
                    disabled={telegramLoading || (!telegramTestTarget && !telegramConfig.default_chat_id)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {telegramLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Live Test Message to Telegram
                  </button>
                </div>
              </div>

              {/* Auto-Discovery of Telegram Groups and Chats */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4" /> Discovered Chats, Groups & Subscribers
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Find Telegram groups or users who have messaged or added your bot.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleFetchTelegramUpdates}
                    disabled={telegramLoading}
                    className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition flex items-center gap-1.5 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${telegramLoading ? "animate-spin" : ""}`} />
                    Discover Chats from Telegram
                  </button>
                </div>

                {telegramConfig.registered_chats && telegramConfig.registered_chats.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {telegramConfig.registered_chats.map((chat) => (
                      <div
                        key={chat.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-200 truncate">
                              {chat.title || "Telegram Chat"}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-400">
                              {chat.type || "chat"}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-sky-400">{chat.id}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setTelegramTestTarget(String(chat.id));
                              setTelegramConfig({ ...telegramConfig, default_chat_id: String(chat.id) });
                              setTelegramFeedback(`Set ${chat.title || chat.id} as Default Chat!`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-[11px] font-semibold border border-sky-500/20 transition"
                          >
                            Set Default
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updatedRoutes = [...(telegramConfig.department_routes || [])];
                              const itRoute = updatedRoutes.find((r) => r.department === "IT Support");
                              if (itRoute) {
                                itRoute.chat_id = String(chat.id);
                              } else {
                                updatedRoutes.push({ department: "IT Support", chat_id: String(chat.id), label: "IT & Network Support Group" });
                              }
                              setTelegramConfig({ ...telegramConfig, department_routes: updatedRoutes, default_chat_id: String(chat.id) });
                              setTelegramFeedback(`✓ Assigned ${chat.title || chat.id} to IT Support! Click "Save Telegram Configuration" to persist.`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-[11px] font-semibold border border-amber-500/20 transition"
                            title="Assign to IT Support department"
                          >
                            Set for IT
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendDepartmentTest(String(chat.id), chat.title || "Group")}
                            disabled={telegramLoading}
                            className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-semibold border border-emerald-500/20 transition flex items-center gap-1"
                            title="Send test message directly to this chat"
                          >
                            <Send className="w-3 h-3" /> Test
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const filtered = telegramConfig.registered_chats.filter((c) => c.id !== chat.id);
                              setTelegramConfig({ ...telegramConfig, registered_chats: filtered });
                            }}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 transition"
                            title="Remove chat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
                    <p>No registered Telegram chats detected yet.</p>
                    <p className="text-[11px] text-slate-500">
                      💡 To link a group: Add your bot to the Telegram group, type <span className="font-mono text-sky-400">/start</span> or send any message in the group, then click <strong>Discover Chats from Telegram</strong> above!
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Setup Instructions Card */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                <h5 className="font-bold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Quick Telegram Setup Guide:
                </h5>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Open Telegram and search for your bot or visit <a href={`https://t.me/${telegramBotInfo?.username || "bot"}`} target="_blank" rel="noopener noreferrer" className="text-sky-400 underline">@{telegramBotInfo?.username || "your bot"}</a>.</li>
                  <li>Click <strong>Start</strong> or send any message in a private chat with the bot, or add the bot to your IT department Telegram group.</li>
                  <li>Click <strong>Discover Chats from Telegram</strong> above to automatically detect your Chat ID, or paste the Chat ID directly into <strong>Default Target Chat ID</strong>.</li>
                  <li>In the chat conversation, staff can also right-click or long-press any ticket or message and choose <strong>Forward to Telegram Bot</strong> to dispatch instantly!</li>
                </ol>
              </div>
            </div>
          )}
          {activeTab === "tickets" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200">IT / Maintenance Tickets Manager</h3>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(["all", "open", "working", "solved", "closed"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setTicketFilter(f)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                        ticketFilter === f
                          ? "bg-sky-500 text-slate-950 font-bold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-sky-400">#{t.id}</span>
                        <span className="font-semibold text-xs text-slate-200">{t.department}</span>
                        <span className="text-xs text-slate-400">• Floor: {t.floor} ({t.sub_location})</span>
                        {(t.location_extension || t.reporter_extension || t.extension) && (
                          <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-500/30">
                            📞 Ext: {t.location_extension || t.reporter_extension || t.extension}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300">{t.description}</p>
                      <p className="text-[11px] text-slate-500">
                        Submitted by <span className="text-slate-400">{t.submitted_by}</span> on{" "}
                        {new Date(t.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                          t.status === "open"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : t.status === "working"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                            : t.status === "solved"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {t.status}
                      </span>

                      <select
                        value={t.status}
                        onChange={(e) =>
                          handleUpdateTicketStatus(
                            t.id,
                            e.target.value as "open" | "working" | "solved" | "closed"
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                      >
                        <option value="open">Open</option>
                        <option value="working">Working (In Progress)</option>
                        <option value="solved">Solved</option>
                        <option value="closed">Closed</option>
                      </select>

                      <button
                        onClick={() => handleDeleteTicket(t.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-semibold transition"
                      >
                        Delete Ticket
                      </button>
                    </div>
                  </div>
                ))}

                {filteredTickets.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-8">
                    No tickets found matching current filter
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: BROADCAST ANNOUNCEMENT */}
          {activeTab === "broadcast" && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs leading-relaxed">
                📢 Broadcast messages will be dispatched immediately to active online staff and recorded in system history.
              </div>

              {broadcastSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
                  ✓ Broadcast announcement successfully sent!
                </div>
              )}

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Broadcast Target Audience
                  </label>
                  <select
                    value={broadcastTarget}
                    onChange={(e) => setBroadcastTarget(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="all">All Channels & Staff Users</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        Group: {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Announcement Message
                  </label>
                  <textarea
                    rows={4}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Enter urgent hospital announcement or IT notice..."
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <Radio className="w-4 h-4" /> Send System Announcement
                </button>
              </form>
            </div>
          )}

          {/* TAB 8: BACKUP & RESTORE */}
          {activeTab === "backup" && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Download className="w-4 h-4 text-sky-400" /> Export Database JSON Backup
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Download a complete JSON snapshot of all registered staff users, system messages, active groups, support tickets, and call logs.
                </p>
                <button
                  onClick={handleDownloadBackup}
                  className="py-2 px-4 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 hover:bg-sky-500/30 text-xs font-bold transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download JSON Backup
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-400" /> Restore Database Snapshot
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload a JSON database backup file to restore system state.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-400 hover:file:bg-amber-500/30 transition cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 9: PRODUCTION RELEASE & PDF MANUAL */}
          {activeTab === "release" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Header Overview Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/40 border border-emerald-500/30 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                      <Package className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-base text-slate-100">
                          Standalone Production Release & Feature Manual
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                          Ready for Release
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 uppercase tracking-wider">
                          Zero Source Code
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-3xl">
                        Deploy, distribute, or host Elyano Connect securely. This standalone package contains pre-compiled binaries and bundled web assets (<span className="text-emerald-300 font-mono">dist/</span>). <strong className="text-white">Zero TypeScript or React source code is included</strong>, safeguarding intellectual property. An official 10-page vector Screen Features Manual PDF is included.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRebuildRelease}
                    disabled={isRebuildingRelease}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 ${
                      isRebuildingRelease
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                        : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRebuildingRelease ? "animate-spin" : ""}`} />
                    {isRebuildingRelease ? "Recompiling Bundle..." : "Re-Compile Release"}
                  </button>
                </div>

                {releaseRebuildMsg && (
                  <div
                    className={`mt-4 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                      releaseRebuildMsg.ok
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-rose-500/20 border-rose-500/40 text-rose-300"
                    }`}
                  >
                    {releaseRebuildMsg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {releaseRebuildMsg.text}
                  </div>
                )}
              </div>

              {/* Main Dual Grid: Release ZIP vs PDF Manual */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CARD 1: PRODUCTION ZIP ARCHIVE */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-700/60 flex flex-col justify-between space-y-4 hover:border-slate-600 transition">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                          <DownloadCloud className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-100">Standalone Release Package</h4>
                          <span className="text-[11px] text-slate-400">Zip distribution package without source code</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {releaseInfo?.release?.size_mb ? `${releaseInfo.release.size_mb} MB` : "1.20 MB"}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Package Contents (No Source Code)
                      </div>
                      <ul className="text-xs text-slate-300 space-y-1.5 pl-1">
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-mono text-emerald-300">dist/server.cjs</span>
                          <span className="text-slate-500 text-[10px]">- Bundled Node.js backend</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-mono text-emerald-300">dist/assets/</span>
                          <span className="text-slate-500 text-[10px]">- Minified React web application</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-mono text-slate-300">setup.sh / setup.bat</span>
                          <span className="text-slate-500 text-[10px]">- Automated dependency installer</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-mono text-slate-300">start.sh / start.bat</span>
                          <span className="text-slate-500 text-[10px]">- 1-Click production launch</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-mono text-slate-300">Dockerfile & docker-compose.yml</span>
                          <span className="text-slate-500 text-[10px]">- Container deployment</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-mono text-slate-300">elite-hospital.service</span>
                          <span className="text-slate-500 text-[10px]">- Linux 24/7 background service</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href="/api/admin/download-release-package"
                      download="elite-hospital-app-standalone-v1.0.zip"
                      className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-md"
                    >
                      <Download className="w-4 h-4" /> Download Standalone Package (.zip)
                    </a>
                  </div>
                </div>

                {/* CARD 2: REAL-SCREEN FEATURES PDF MANUAL */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-700/60 flex flex-col justify-between space-y-4 hover:border-slate-600 transition">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-100">Real-Screen Features Manual</h4>
                          <span className="text-[11px] text-slate-400">Official 10-Page System Documentation PDF</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {releaseInfo?.pdf?.size_kb ? `${releaseInfo.pdf.size_kb} KB` : "178 KB"}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileDown className="w-3.5 h-3.5 text-rose-400" /> Document Coverage (10 Pages)
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-rose-400 text-[10px] font-bold">P1</span> Architecture & Security
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-rose-400 text-[10px] font-bold">P2</span> Clinical Chat & Badges
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-rose-400 text-[10px] font-bold">P3</span> Telehealth Video/Audio
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-rose-400 text-[10px] font-bold">P4</span> Department Feeds
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-rose-400 text-[10px] font-bold">P5</span> 24/7 AI Diagnostic Bot
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-rose-400 text-[10px] font-bold">P6</span> IT Helpdesk & Tickets
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-rose-400 text-[10px] font-bold">P7</span> Floor Navigator
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-rose-400 text-[10px] font-bold">P8</span> LDAP / AD & SQL Sync
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-rose-400 text-[10px] font-bold">P9</span> 29+ Clinical Themes
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-rose-400 text-[10px] font-bold">P10</span> Deployment & Backups
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href="/api/admin/download-features-pdf"
                      download="ELITE_HOSPITAL_FEATURES_MANUAL.pdf"
                      className="flex-1 py-2.5 px-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md"
                    >
                      <Download className="w-4 h-4" /> Download Manual (PDF)
                    </a>
                    <a
                      href="/api/admin/download-features-pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-slate-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Preview
                    </a>
                  </div>
                </div>
              </div>

              {/* Deployment Instructions Box */}
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" /> 3-Step Standalone Production Launch Cheatsheet
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="font-bold text-sky-400 flex items-center gap-1.5">
                      <span>🐧</span> Linux VPS / Ubuntu
                    </div>
                    <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                      {"unzip release.zip\ncd elite-hospital-app\n./setup.sh\n./start.sh"}
                    </pre>
                    <p className="text-[11px] text-slate-400">
                      Runs pre-compiled binary on port 3000. Use <code className="text-sky-300">systemd</code> for background uptime.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="font-bold text-indigo-400 flex items-center gap-1.5">
                      <span>🐳</span> Docker / Container
                    </div>
                    <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                      {"unzip release.zip\ncd elite-hospital-app\ndocker compose up -d"}
                    </pre>
                    <p className="text-[11px] text-slate-400">
                      Zero dependencies required on host. Persistent volumes for database and shared files.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="font-bold text-amber-400 flex items-center gap-1.5">
                      <span>🪟</span> Windows Server / PC
                    </div>
                    <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                      {"1. Double-click setup.bat\n2. Double-click start.bat"}
                    </pre>
                    <p className="text-[11px] text-slate-400">
                      Installs production dependencies and boots up immediately on <code className="text-amber-300">http://localhost:3000</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
