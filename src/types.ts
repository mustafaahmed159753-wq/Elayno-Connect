export interface User {
  username: string;
  password?: string;
  session_token?: string;
  image?: string;
  cover_image?: string;
  status?: string;
  last_seen?: string | null;
  role?: string;
  department?: string;
  email?: string;
  phone?: string;
  bio?: string;
  joined_at?: string;
  source?: "ad" | "local";
  can_see_all_users?: boolean;
  visible_users?: string[];
  is_bot?: boolean;
  bot_type?: "it_triage" | "system" | "hospital_info";
  full_name?: string;
  mobile_phone?: string;
  assigned_extension?: string;
  floor?: string;
  zone?: string;
  shift_start?: string;
  shift_end?: string;
  shift_end_timestamp?: string;
  shift_ongoing?: boolean;
  remaining_minutes?: number;
  expected_shift_end?: string;
  on_duty?: boolean;
  onboarding_completed?: boolean;
  login_count?: number;
}

export interface StaffPresenceRecord {
  username: string;
  full_name: string;
  department: string;
  phone_number: string;
  extension: string;
  floor: string;
  zone: string;
  room_or_station?: string;
  role: string;
  on_duty: boolean;
  shift_start: string;
  shift_end: string;
  shift_end_timestamp?: string;
  expected_shift_end?: string;
  last_login: string;
  login_count: number;
  onboarding_completed: boolean;
}

export interface BotInteractivePrompt {
  step: "problem" | "name" | "extension" | "floor" | "place" | "device_hostname" | "confirmation";
  field_key: string;
  label: string;
  placeholder?: string;
  default_value?: string;
  options?: string[];
  button_label?: string;
  submitted?: boolean;
  submitted_value?: string;
}

export interface Message {
  id: number;
  sender: string;
  recipient: string;
  msg?: string;
  type?: "text" | "file";
  subtype?: "image" | "video" | "audio" | "doc" | "sticker" | "folder";
  filename?: string;
  data?: string;
  read?: boolean;
  delivered?: boolean;
  timestamp: string;
  reply_to_id?: number | null;
  reply_preview?: string | null;
  is_deleted?: boolean;
  original_text?: string;
  edited_at?: string;
  deleted_at?: string;
  deleted_by?: string;
  edit_history?: { previous_text: string; edited_at: string; edited_by: string }[];
  is_pinned?: boolean;
  reactions?: Record<string, string[]>;
  ticket_id?: number;
  ticket_status?: "pending" | "working_on" | "resolved" | "open" | "working" | "solved" | "closed";
  interactive_prompt?: BotInteractivePrompt;
  is_folder?: boolean;
  folder_type?: string;
  folder_badge?: string;
  folder_extension?: string;
  file_count?: number;
  folder_manifest?: { name: string; size: number; path?: string }[];
  file_size_bytes?: number;
  file_size_str?: string;
  download_url?: string;
  ticket_details?: {
    id: number;
    submitted_by: string;
    reporter_name?: string;
    reporter_extension?: string;
    location_extension?: string;
    extension?: string;
    reporter_email?: string;
    reporter_department?: string;
    reporter_role?: string;
    device_username?: string;
    user_details_snapshot?: Record<string, any>;
    department: string;
    floor: string;
    sub_location: string;
    description: string;
    status: string;
    created_at: string;
    working_by?: string;
    working_at?: string;
    solved_at?: string;
    closed_at?: string;
    resolution_duration?: string;
  };
}

export interface Group {
  id: string;
  name: string;
  creator: string;
  members: string[];
  is_ticket_group?: boolean;
}

export interface Ticket {
  id: number;
  submitted_by: string;
  reporter_name?: string;
  reporter_extension?: string;
  location_extension?: string;
  extension?: string;
  reporter_email?: string;
  reporter_department?: string;
  reporter_role?: string;
  device_username?: string;
  user_details_snapshot?: Record<string, any>;
  department: string;
  floor: string;
  sub_location: string;
  description: string;
  status: "pending" | "working_on" | "resolved" | "open" | "working" | "solved" | "closed";
  created_at: string;
  working_by?: string;
  working_at?: string;
  solved_at?: string;
  closed_at?: string;
  resolution_duration?: string;
  ticket_msg_id?: number;
  telegram_message_id?: number;
  telegram_chat_id?: string;
  last_telegram_status_sent?: string;
  last_telegram_status_time?: number;
}

export interface BotKnowledgeEntry {
  id: string;
  ticket_id?: number;
  reporter_username: string;
  reporter_name: string;
  reporter_ext: string;
  reporter_email: string;
  reporter_dept: string;
  reporter_role: string;
  floor: string;
  place: string;
  device_username?: string;
  category: string;
  is_it_problem: boolean;
  severity: string;
  problem_description: string;
  root_cause: string;
  user_advice: string[];
  engineer_action: string;
  resolution_status: "pending" | "working_on" | "resolved";
  resolved_by?: string;
  resolved_at?: string;
  resolution_duration?: string;
  created_at: string;
}

export interface CallLog {
  id: number;
  caller: string;
  callee: string;
  call_type: "voice" | "video";
  status: "completed" | "answered" | "missed" | "rejected" | "busy" | "ringing";
  started_at: string;
  duration_sec: number;
}

export interface CallState {
  active: boolean;
  state: "outgoing" | "incoming" | "connected" | "ended";
  peerUser: string;
  callType: "voice" | "video";
  offer?: RTCSessionDescriptionInit;
  groupId?: string;
  isMinimised?: boolean;
  isMuted?: boolean;
  isCameraOff?: boolean;
}

export interface PlaceLocation {
  id: string;
  name: string;
  floor: string;
  category: string;
  number?: string;
  extension?: string;
  floor_code?: string;
  description?: string;
}

export interface SplashPhoto {
  id: string;
  title: string;
  url: string;
  active: boolean;
  caption?: string;
}

export interface ITBotSchedule {
  enabled: boolean;
  mode: "always_online" | "custom_schedule" | "shift_based";
  shift_start: string; // e.g. "00:00"
  shift_end: string;   // e.g. "23:59"
  work_days: number[]; // [0, 1, 2, 3, 4, 5, 6] (0 = Sunday)
  active_status_text: string;
  offline_status_text: string;
  target_group_id: string; // default "group_it_support"
  auto_analyze: boolean;
  auto_create_ticket: boolean;
  greeting_message?: string;
}

export interface TelegramSubscribedChat {
  chat_id: string;
  name: string;
  type: "group" | "supergroup" | "channel" | "user";
  notify_tickets: boolean;
  notify_urgent: boolean;
  added_at?: string;
}

export interface TelegramDepartmentRoute {
  department: string;
  chat_id: string;
  label?: string;
}

export interface TelegramConfig {
  enabled: boolean;
  bot_token: string;
  bot_username?: string;
  bot_first_name?: string;
  default_chat_id: string;
  department_routes?: TelegramDepartmentRoute[];
  registered_chats?: Array<{ id: string | number; title?: string; type?: string; added_at?: string }>;
  subscribed_chats?: TelegramSubscribedChat[];
  notify_on_new_ticket: boolean;
  notify_on_ticket_status: boolean;
  notify_on_bot_triage?: boolean;
  notify_on_it_incident?: boolean;
  last_tested_at?: string;
  last_test_status?: string;
}

export interface FeedMediaItem {
  url: string;
  type: "image" | "video";
  name?: string;
  size?: number;
}

export type FeedReactionType = "like" | "love" | "wow" | "hug" | "dislike";

export interface FeedComment {
  id: string;
  author: string;
  text: string;
  mentions?: string[];
  created_at: string;
}

export interface FeedPost {
  id: string;
  author: string;
  content: string;
  media_type?: "none" | "image" | "video";
  media_url?: string;
  media_name?: string;
  media_items?: FeedMediaItem[];
  scope: "public" | "timeline";
  status: "pending" | "approved" | "declined";
  approved_by?: string;
  approved_at?: string;
  declined_by?: string;
  declined_reason?: string;
  mentions?: string[];
  created_at: string;
  likes: string[];
  reactions?: Record<string, FeedReactionType>; // username -> reaction
  comments: FeedComment[];
}

export interface FeedNotification {
  id: string;
  recipient: string; // target username
  sender: string; // author or trigger user
  type: "mention" | "post_approved" | "post_declined" | "reaction" | "comment" | "pending_post_for_admin";
  postId: string;
  postSnippet?: string;
  reactionType?: FeedReactionType;
  message: string;
  created_at: string;
  read: boolean;
}

export interface AppSettings {
  no_auth_mode: boolean;
  ad_domain: string;
  ad_ldap_url: string;
  ad_base_dn: string;
  ad_enabled: boolean;
  sql_server_host?: string;
  sql_server_port?: string;
  sql_server_db?: string;
  sql_server_user?: string;
  sql_server_pass?: string;
  sql_server_encrypt?: boolean;
  sql_server_connected?: boolean;
  sql_server_last_test?: string;
  ticket_places?: PlaceLocation[];
  splash_photos?: SplashPhoto[];
  splash_duration_sec?: number;
  it_bot_schedule?: ITBotSchedule;
  telegram?: TelegramConfig;
}

export interface PhoneNotebookContact {
  id: string;
  name: string;
  department: string;
  extension: string;
  location: string;
  notes?: string;
  updated_at?: string;
}

