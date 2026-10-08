import React, { useState } from "react";
import { User } from "../types";
import {
  Camera,
  Volume2,
  Play,
  User as UserIcon,
  Building,
  Mail,
  Phone,
  FileText,
  Check,
  Save,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import {
  soundManager,
  RINGTONE_OPTIONS,
  NOTIFICATION_OPTIONS,
  RingtoneOption,
  NotificationOption,
} from "../lib/sound";

interface Props {
  currentUser: string;
  userMap: Record<string, User>;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
  onUpdatePhoto: (dataUrl: string, filename: string) => void;
  onUpdateCoverPhoto?: (dataUrl: string, filename: string) => void;
  onUpdateFullProfile?: (data: {
    status?: string;
    department?: string;
    email?: string;
    phone?: string;
    bio?: string;
    cover_image?: string;
  }) => void;
}

const PRESET_STATUSES = [
  "Available",
  "In surgery / On the floor",
  "In a meeting",
  "Emergency Dept On-Duty",
  "Busy / Do Not Disturb",
  "On break / Meal",
  "Working remotely",
];

export const ProfileModal: React.FC<Props> = ({
  currentUser,
  userMap,
  onClose,
  onUpdateStatus,
  onUpdatePhoto,
  onUpdateCoverPhoto,
  onUpdateFullProfile,
}) => {
  const me = userMap[currentUser] || { username: currentUser };
  const [activeTab, setActiveTab] = useState<"profile" | "audio">("profile");
  const [customStatus, setCustomStatus] = useState(me.status || "");
  const [department, setDepartment] = useState(me.department || "");
  const [email, setEmail] = useState(me.email || `${currentUser}@elitehospital.org`);
  const [phone, setPhone] = useState(me.phone || "");
  const [bio, setBio] = useState(me.bio || "");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    me.cover_image ? `/uploads/${me.cover_image}` : null
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    me.image ? `/uploads/${me.image}` : null
  );

  const [selectedRingtone, setSelectedRingtone] = useState<RingtoneOption>(
    soundManager.currentRingtone
  );
  const [selectedNotification, setSelectedNotification] = useState<NotificationOption>(
    soundManager.currentNotificationSound
  );

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl);
      onUpdatePhoto(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setCoverPreview(dataUrl);
      if (onUpdateCoverPhoto) {
        onUpdateCoverPhoto(dataUrl, file.name);
      } else {
        // Direct API upload
        fetch("/upload_cover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: currentUser,
            image_data: dataUrl,
            filename: file.name,
          }),
        }).catch(() => {});
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectRingtone = (r: RingtoneOption) => {
    setSelectedRingtone(r);
    soundManager.setRingtone(r);
    soundManager.playRingtoneOnce(r);
  };

  const handleSelectNotification = (n: NotificationOption) => {
    setSelectedNotification(n);
    soundManager.setNotificationSound(n);
    soundManager.playMessageSound(n);
  };

  const handleSaveDetails = async () => {
    if (onUpdateFullProfile) {
      onUpdateFullProfile({
        status: customStatus,
        department,
        email,
        phone,
        bio,
      });
    } else {
      onUpdateStatus(customStatus);
      fetch("/api/update_profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: currentUser,
          status: customStatus,
          department,
          email,
          phone,
          bio,
        }),
      }).catch(() => {});
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div
      id="profile-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-3xl overflow-hidden text-slate-100 shadow-2xl my-auto flex flex-col max-h-[90vh]">
        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 flex flex-col">
          {/* Cover Photo Header */}
          <div className="h-32 w-full relative bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-700 overflow-hidden shrink-0">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Cover"
                className="w-full h-full object-cover brightness-90"
              />
            ) : (
              <div className="w-full h-full opacity-60 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-black/30" />

            {/* Upload Cover Button */}
            <label
              className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-slate-950/70 hover:bg-slate-950/90 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer backdrop-blur-sm transition border border-white/15"
              title="Change Profile Cover Photo"
            >
              <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
              <span>Change Cover</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
            </label>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-slate-300 hover:text-white text-xs px-2.5 py-1 rounded-xl bg-slate-950/70 hover:bg-slate-950/90 backdrop-blur-sm transition border border-white/15"
            >
              ✕ Close
            </button>
          </div>

          <div className="px-6 pb-6 pt-0 relative flex flex-col -mt-12">
            {/* Avatar & Tab Switcher */}
            <div className="flex items-end justify-between mb-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-slate-900 border-4 border-slate-900 shadow-2xl flex items-center justify-center text-2xl font-bold text-teal-400 overflow-hidden ring-2 ring-teal-400/50">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    currentUser.substring(0, 2).toUpperCase()
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-teal-500 text-slate-950 hover:bg-teal-400 cursor-pointer shadow-md transition ring-2 ring-slate-900">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Tab Toggle */}
              <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 self-center">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === "profile"
                      ? "bg-teal-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Profile & Bio
                </button>
                <button
                  onClick={() => setActiveTab("audio")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === "audio"
                      ? "bg-teal-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sounds
                </button>
              </div>
            </div>

            <div className="mb-3">
              <h4 className="font-bold text-base text-white">{currentUser}</h4>
              <span className="text-[11px] text-slate-400 capitalize">
                {me.role || "Hospital Staff"}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {activeTab === "profile" && (
                <>
                  {/* Bio / Specialization Field (Prominent) */}
                  <div className="bg-slate-950/80 border border-teal-500/40 rounded-2xl p-3 shadow-inner">
                    <label className="text-xs font-bold text-teal-400 block mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Bio / Specialization
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="e.g. Senior Trauma Surgeon / Chief Nursing Officer / IT SysAdmin"
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-400 transition resize-none placeholder:text-slate-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      This appears below your online presence indicator in the chat header and full
                      profile cards.
                    </p>
                  </div>

                  {/* Quick Preset Status */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Quick Preset Status
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PRESET_STATUSES.map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            setCustomStatus(st);
                            onUpdateStatus(st);
                          }}
                          className={`p-2 rounded-xl border text-[11px] font-medium transition text-left truncate ${
                            customStatus === st
                              ? "bg-teal-500/20 border-teal-500 text-teal-300"
                              : "bg-slate-950 border-slate-800 hover:bg-slate-800/50 text-slate-300"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Status Message */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Custom Status Message
                    </label>
                    <input
                      type="text"
                      value={customStatus}
                      onChange={(e) => setCustomStatus(e.target.value)}
                      placeholder="e.g. In Room 402 / On call"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-teal-400" /> Department / Clinical Unit
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Emergency, Cardiology, Surgery, IT"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-sky-400" /> Official Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. staff@elitehospital.org"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" /> Internal Phone / Extension
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. Ext 4410 / +1 555-0199"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    type="button"
                    onClick={handleSaveDetails}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-teal-900/30 active:scale-98"
                  >
                    {savedSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-950" />
                        <span>Profile Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Profile & Bio</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {activeTab === "audio" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-teal-400 font-bold text-xs">
                    <Volume2 className="w-4 h-4" /> Audio Ringtones & Notification Chimes
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">
                      Incoming Call Ringtone
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                      {RINGTONE_OPTIONS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleSelectRingtone(r.id)}
                          className={`p-2 rounded-xl border text-left flex items-center justify-between transition ${
                            selectedRingtone === r.id
                              ? "bg-teal-500/20 border-teal-500 text-teal-300 font-semibold"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <div className="truncate">
                            <div className="text-[11px] font-medium leading-tight">{r.name}</div>
                          </div>
                          <Play className="w-3 h-3 text-teal-400 shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">
                      Message & Alert Sound
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                      {NOTIFICATION_OPTIONS.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleSelectNotification(n.id)}
                          className={`p-2 rounded-xl border text-left flex items-center justify-between transition ${
                            selectedNotification === n.id
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <div className="truncate">
                            <div className="text-[11px] font-medium leading-tight">{n.name}</div>
                          </div>
                          <Play className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
