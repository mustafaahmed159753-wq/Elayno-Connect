import React, { useState } from "react";
import { User } from "../types";
import { Users, Plus, ShieldAlert } from "lucide-react";

interface Props {
  currentUser: string;
  usersMap: Record<string, User>;
  onClose: () => void;
  onCreateGroup: (name: string, members: string[]) => void;
}

export const GroupModal: React.FC<Props> = ({
  currentUser,
  usersMap,
  onClose,
  onCreateGroup,
}) => {
  const [name, setName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([currentUser]);

  const isAdmin = usersMap[currentUser]?.role === "admin";
  const availableUsers = Object.keys(usersMap).filter((u) => u !== currentUser);

  const toggleMember = (u: string) => {
    if (selectedMembers.includes(u)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== u));
    } else {
      setSelectedMembers([...selectedMembers, u]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!name.trim()) return;
    onCreateGroup(name.trim(), selectedMembers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/60 rounded-3xl p-6 text-slate-100 shadow-2xl animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm">Create New Group</h3>
          </div>
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {!isAdmin ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col gap-2 items-center text-center">
            <ShieldAlert className="w-8 h-8 text-amber-400 shrink-0" />
            <span className="font-bold">Administrator Privilege Required</span>
            <p className="text-slate-300 text-[11px]">
              Only System Administrators can create and broadcast new group communication channels. Please contact an Administrator (e.g. Elite) to create a group.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Group Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Emergency Room Team"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select Members</label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-1">
                {availableUsers.map((u) => {
                  const checked = selectedMembers.includes(u);
                  return (
                    <label
                      key={u}
                      onClick={() => toggleMember(u)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                        checked
                          ? "bg-indigo-500/15 border-indigo-500 text-indigo-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>{u}</span>
                      <input type="checkbox" checked={checked} readOnly className="accent-indigo-500" />
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition"
            >
              Create Group ({selectedMembers.length})
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
