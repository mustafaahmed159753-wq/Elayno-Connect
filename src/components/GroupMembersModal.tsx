import React, { useState } from "react";
import { User, Group } from "../types";
import { Users, Search, Check, UserPlus, UserMinus, ShieldAlert, X } from "lucide-react";

interface Props {
  group: Group;
  usersMap: Record<string, User>;
  onClose: () => void;
  onSaveMembers: (groupId: string, newMembers: string[]) => Promise<void> | void;
}

export const GroupMembersModal: React.FC<Props> = ({
  group,
  usersMap,
  onClose,
  onSaveMembers,
}) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>(group.members || []);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const [filterTab, setFilterTab] = useState<"all" | "members" | "non_members">("all");

  const allUserKeys = Object.keys(usersMap);

  const filteredUsers = allUserKeys.filter((u) => {
    const user = usersMap[u];
    const term = search.toLowerCase();
    const isSelected = selectedMembers.includes(u);

    if (filterTab === "members" && !isSelected) return false;
    if (filterTab === "non_members" && isSelected) return false;

    return (
      u.toLowerCase().includes(term) ||
      (user?.status && user.status.toLowerCase().includes(term)) ||
      (user?.role && user.role.toLowerCase().includes(term))
    );
  });

  const toggleUser = (username: string) => {
    if (selectedMembers.includes(username)) {
      setSelectedMembers(selectedMembers.filter((u) => u !== username));
    } else {
      setSelectedMembers([...selectedMembers, username]);
    }
  };

  const handleSelectAll = () => {
    setSelectedMembers(allUserKeys);
  };

  const handleDeselectAll = () => {
    setSelectedMembers([]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveMembers(group.id, selectedMembers);
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 text-slate-100 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                Manage Group Members
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-semibold">
                  {selectedMembers.length} Members
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Group: <span className="text-sky-400 font-semibold">{group.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" /> Group members successfully updated!
          </div>
        )}

        {/* Search & Bulk Select Controls */}
        <div className="space-y-2">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`flex-1 py-1.5 rounded-xl transition ${
                filterTab === "all"
                  ? "bg-slate-800 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Staff ({allUserKeys.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("members")}
              className={`flex-1 py-1.5 rounded-xl transition ${
                filterTab === "members"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-indigo-400 hover:text-indigo-300"
              }`}
            >
              Members ({selectedMembers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("non_members")}
              className={`flex-1 py-1.5 rounded-xl transition ${
                filterTab === "non_members"
                  ? "bg-slate-800 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Non-Members ({allUserKeys.length - selectedMembers.length})
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff members by name, role, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                title="Add all users to this group"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 text-[11px] font-semibold transition"
                title="Remove all members"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* User Selection List */}
        <div className="max-h-64 overflow-y-auto space-y-1.5 p-2 bg-slate-950/80 rounded-2xl border border-slate-800">
          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">No users found matching search</div>
          ) : (
            filteredUsers.map((u) => {
              const user = usersMap[u];
              const isSelected = selectedMembers.includes(u);

              return (
                <div
                  key={u}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition select-none ${
                    isSelected
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-200"
                      : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sky-400 text-xs overflow-hidden shrink-0">
                      {user?.image ? (
                        <img src={`/uploads/${user.image}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        u.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-100 truncate">{u}</span>
                        {user?.role === "admin" && (
                          <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 text-[9px] font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{user?.status || "Hospital Staff"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected ? (
                      <button
                        type="button"
                        onClick={() => toggleUser(u)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-[11px] flex items-center gap-1 transition"
                        title="Delete member from group"
                      >
                        <UserMinus className="w-3.5 h-3.5 text-rose-400" /> Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleUser(u)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700 font-semibold text-[11px] flex items-center gap-1 transition"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-slate-400" /> Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            {selectedMembers.length} user{selectedMembers.length === 1 ? "" : "s"} assigned
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Members"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
