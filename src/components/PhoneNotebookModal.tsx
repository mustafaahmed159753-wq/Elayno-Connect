import React, { useState, useEffect, useMemo } from "react";
import { User, PhoneNotebookContact } from "../types";
import { socket } from "../lib/socket";
import {
  X,
  Phone,
  BookUser,
  Search,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Building2,
  Layers,
  Copy,
  Check,
  Shield,
  Clock,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Filter,
} from "lucide-react";

interface Props {
  currentUser: string;
  usersMap: Record<string, User>;
  onClose: () => void;
}

const ORDERED_FLOORS = [
  "Basement",
  "Ground Floor",
  "M Floor",
  "1st Floor",
  "2nd Floor",
  "3rd Floor",
  "4th Floor",
];

// Normalize floor from location string
export function getContactFloor(location: string): string {
  if (!location) return "Ground Floor";
  const loc = location.trim().toLowerCase();
  if (loc === "basement" || loc.includes("basement")) return "Basement";
  if (loc === "ground floor" || loc.includes("ground floor") || loc.includes("ground")) return "Ground Floor";
  if (loc === "m floor" || loc.includes("m floor") || loc.includes("mezanine") || loc.includes("mezzanine")) return "M Floor";
  if (loc === "1st floor" || loc.includes("1st") || loc.includes("first")) return "1st Floor";
  if (loc === "2nd floor" || loc.includes("2nd") || loc.includes("second")) return "2nd Floor";
  if (loc === "3rd floor" || loc.includes("3rd") || loc.includes("third")) return "3rd Floor";
  if (loc === "4th floor" || loc.includes("4th") || loc.includes("fourth")) return "4th Floor";
  return location.trim();
}

export const PhoneNotebookModal: React.FC<Props> = ({
  currentUser,
  usersMap,
  onClose,
}) => {
  const [contacts, setContacts] = useState<PhoneNotebookContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Admin form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<PhoneNotebookContact | null>(null);
  const [formName, setFormName] = useState("");
  const [formDept, setFormDept] = useState("");
  const [formExt, setFormExt] = useState("");
  const [formFloor, setFormFloor] = useState("Ground Floor");
  const [formLocation, setFormLocation] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<PhoneNotebookContact | null>(null);

  // Reset confirmation
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const me = usersMap[currentUser] || { username: currentUser };
  const isAdmin = me.role === "admin" || currentUser === "admin" || currentUser === "Elite";

  // Fetch contacts
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/phone-notebook");
      const data = await res.json();
      if (data.ok && Array.isArray(data.contacts)) {
        setContacts(data.contacts);
      }
    } catch (err) {
      console.error("Failed to fetch phone notebook:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();

    // Listen for real-time updates from admin actions
    const handleUpdate = (payload: {
      action: string;
      contact?: PhoneNotebookContact;
      contacts?: PhoneNotebookContact[];
      id?: string;
    }) => {
      if (payload.action === "reset" && payload.contacts) {
        setContacts(payload.contacts);
      } else if (payload.action === "add" && payload.contact) {
        setContacts((prev) => {
          const exists = prev.some((c) => c.id === payload.contact!.id);
          if (exists) return prev;
          return [...prev, payload.contact!].sort(
            (a, b) => a.department.localeCompare(b.department) || a.name.localeCompare(b.name)
          );
        });
      } else if (payload.action === "update" && payload.contact) {
        setContacts((prev) =>
          prev.map((c) => (c.id === payload.contact!.id ? payload.contact! : c))
        );
      } else if (payload.action === "delete" && payload.id) {
        setContacts((prev) => prev.filter((c) => c.id !== payload.id));
      }
    };

    socket.on("phone_notebook_updated", handleUpdate);
    return () => {
      socket.off("phone_notebook_updated", handleUpdate);
    };
  }, []);

  // Compute all available floors in order
  const availableFloors = useMemo(() => {
    const rawFloors = new Set<string>();
    contacts.forEach((c) => {
      rawFloors.add(getContactFloor(c.location));
    });

    const ordered: string[] = [];
    ORDERED_FLOORS.forEach((f) => {
      if (rawFloors.has(f)) ordered.push(f);
    });
    // Add any custom floors not in standard list
    rawFloors.forEach((f) => {
      if (!ordered.includes(f)) ordered.push(f);
    });

    return ordered;
  }, [contacts]);

  // Contacts that belong to the currently selected floor (or all floors)
  const contactsOnSelectedFloor = useMemo(() => {
    if (selectedFloor === "all") return contacts;
    return contacts.filter((c) => getContactFloor(c.location) === selectedFloor);
  }, [contacts, selectedFloor]);

  // Departments available ON THIS SPECIFIC FLOOR
  const departmentsOnSelectedFloor = useMemo(() => {
    return Array.from(new Set(contactsOnSelectedFloor.map((c) => c.department))).sort();
  }, [contactsOnSelectedFloor]);

  // When floor selection changes, ensure department remains valid on that floor
  const handleFloorChange = (floor: string) => {
    setSelectedFloor(floor);
    if (selectedDept !== "all") {
      const futureContacts = floor === "all" ? contacts : contacts.filter((c) => getContactFloor(c.location) === floor);
      const futureDepts = new Set(futureContacts.map((c) => c.department));
      if (!futureDepts.has(selectedDept)) {
        setSelectedDept("all");
      }
    }
  };

  // Expected places based on partial letters typed in search bar (matching prefix & substrings)
  const expectedPlaces = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const pool = selectedFloor === "all"
      ? contacts
      : contacts.filter((c) => getContactFloor(c.location) === selectedFloor);

    return pool
      .filter((c) => {
        const name = c.name.toLowerCase();
        const dept = c.department.toLowerCase();
        const loc = c.location.toLowerCase();
        const ext = c.extension.toLowerCase();
        return name.includes(q) || dept.includes(q) || loc.includes(q) || ext.startsWith(q);
      })
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q) || a.extension.startsWith(q);
        const bStarts = b.name.toLowerCase().startsWith(q) || b.extension.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 10);
  }, [contacts, selectedFloor, search]);

  // Filtered contacts based on Search, Floor & Department
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // Floor filter
      if (selectedFloor !== "all" && getContactFloor(c.location) !== selectedFloor) {
        return false;
      }
      // Department filter
      if (selectedDept !== "all" && c.department !== selectedDept) {
        return false;
      }
      // Text search filter
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.extension.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        (c.notes && c.notes.toLowerCase().includes(q))
      );
    });
  }, [contacts, selectedFloor, selectedDept, search]);

  const handleCopyExtension = (contact: PhoneNotebookContact) => {
    navigator.clipboard.writeText(contact.extension);
    setCopiedId(contact.id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === contact.id ? null : curr));
    }, 2000);
  };

  const openAddForm = () => {
    setEditingContact(null);
    setFormName("");
    setFormDept(selectedDept !== "all" ? selectedDept : "");
    setFormExt("");
    const initialFloor = selectedFloor !== "all" ? selectedFloor : "Ground Floor";
    setFormFloor(initialFloor);
    setFormLocation(initialFloor);
    setFormNotes("");
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (contact: PhoneNotebookContact) => {
    setEditingContact(contact);
    setFormName(contact.name);
    setFormDept(contact.department);
    setFormExt(contact.extension);
    setFormFloor(getContactFloor(contact.location));
    setFormLocation(contact.location);
    setFormNotes(contact.notes || "");
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDept.trim() || !formExt.trim()) {
      setFormError("Name, Department, and Extension are required.");
      return;
    }

    const finalLocation = formLocation.trim() || formFloor;

    try {
      setIsSubmitting(true);
      setFormError(null);

      if (editingContact) {
        const res = await fetch(`/api/phone-notebook/${editingContact.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            department: formDept.trim(),
            extension: formExt.trim(),
            location: finalLocation,
            notes: formNotes.trim() || undefined,
            adminUsername: currentUser,
          }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.m || "Failed to update contact");
      } else {
        const res = await fetch("/api/phone-notebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            department: formDept.trim(),
            extension: formExt.trim(),
            location: finalLocation,
            notes: formNotes.trim() || undefined,
            adminUsername: currentUser,
          }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.m || "Failed to add contact");
      }

      setIsFormOpen(false);
      fetchContacts();
    } catch (err: any) {
      console.error("Save contact error:", err);
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const res = await fetch(`/api/phone-notebook/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUsername: currentUser }),
      });
      const data = await res.json();
      if (data.ok) {
        setDeleteTarget(null);
        fetchContacts();
      } else {
        alert(data.m || "Failed to delete contact");
      }
    } catch (err) {
      console.error("Delete contact error:", err);
      alert("Error deleting contact");
    }
  };

  const handleResetDirectory = async () => {
    try {
      setIsResetting(true);
      const res = await fetch("/api/phone-notebook/reset-directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUsername: currentUser }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsResetConfirmOpen(false);
        fetchContacts();
      } else {
        alert(data.m || "Failed to reset directory");
      }
    } catch (err) {
      console.error("Reset directory error:", err);
      alert("Error resetting directory");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      id="phone-notebook-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/90 rounded-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col h-[92vh] max-h-[860px] relative">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/90 bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-slate-950 shadow-md">
              <BookUser className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Hospital Phone Notebook
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold">
                  {contacts.length} Official Contacts
                </span>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Admin Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hospital extensions, department directories & physical floor routing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  id="phone-notebook-add-btn"
                  onClick={openAddForm}
                  className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition"
                  title="Add Department Contact"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Contact</span>
                </button>

                <button
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition"
                  title="Reload Official 196 Contacts Directory"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={fetchContacts}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-teal-300 transition"
              title="Refresh Directory"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Controls: Search + Floor Selection + Dynamic Departments */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800/90 shrink-0 space-y-3">
          {/* 1. TEXT SEARCH INPUT WITH PARTIAL LETTERS AUTO-SUGGESTION */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder={
                selectedFloor === "all"
                  ? "Write letters of hospital places (e.g. ph, er, icu, or, lab, card) or extension..."
                  : `Search places only on ${selectedFloor} (e.g. write letters or extension)...`
              }
              className="w-full pl-10 pr-9 py-2.5 bg-slate-900 border border-slate-700/90 rounded-xl text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition shadow-inner"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Expected Places Floating Dropdown based on partial letters */}
            {showSuggestions && search.trim().length > 0 && expectedPlaces.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-slate-900/98 backdrop-blur-md border border-teal-500/40 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 max-h-64 overflow-y-auto">
                <div className="px-3.5 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-teal-400" />
                    Expected Places Matching "{search}" ({expectedPlaces.length})
                  </span>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y divide-slate-800/60">
                  {expectedPlaces.map((place) => {
                    const floor = getContactFloor(place.location);
                    return (
                      <div
                        key={place.id}
                        onClick={() => {
                          setSearch(place.name);
                          setShowSuggestions(false);
                        }}
                        className="px-3.5 py-2 hover:bg-teal-500/10 cursor-pointer flex items-center justify-between transition gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-white block truncate">
                            {place.name}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                            <span className="text-teal-400 font-semibold">{place.department}</span>
                            <span>•</span>
                            <span>{place.location}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono font-bold text-[10px] border border-amber-500/30">
                            Ext. {place.extension}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[9px] font-semibold border border-teal-500/30">
                            {floor}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Expected Place Suggestion Chips when typing partial letters */}
          {search.trim().length > 0 && expectedPlaces.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-0.5">
              <span className="text-[10px] font-semibold text-teal-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Expected:
              </span>
              {expectedPlaces.slice(0, 5).map((place) => (
                <button
                  key={place.id}
                  onClick={() => setSearch(place.name)}
                  className="px-2.5 py-1 rounded-lg bg-teal-950/60 hover:bg-teal-900 border border-teal-500/40 text-teal-200 hover:text-white transition flex items-center gap-1 text-[11px] active:scale-95"
                >
                  <span className="font-semibold">{place.name}</span>
                  <span className="text-[10px] font-mono opacity-80 text-amber-300">({place.extension})</span>
                </button>
              ))}
            </div>
          )}

          {/* Active Floor Filter Status Banner */}
          {selectedFloor !== "all" && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Showing places <b>only existing on {selectedFloor}</b> ({filteredContacts.length} places)
                </span>
              </div>
              <button
                onClick={() => setSelectedFloor("all")}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 font-bold transition"
              >
                Clear Floor Filter
              </button>
            </div>
          )}

          {/* 2. FLOOR SELECTION BUTTONS */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1.5 text-teal-400">
                <Layers className="w-3.5 h-3.5" />
                SELECT FLOOR:
              </span>
              <span className="text-[10px] text-slate-500">
                {selectedFloor === "all"
                  ? `All hospital floors (${contacts.length} contacts)`
                  : `${contactsOnSelectedFloor.length} contacts on ${selectedFloor}`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => handleFloorChange("all")}
                className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                  selectedFloor === "all"
                    ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>All Floors</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    selectedFloor === "all" ? "bg-slate-950/20 text-slate-950" : "bg-slate-700/80 text-slate-400"
                  }`}
                >
                  {contacts.length}
                </span>
              </button>

              {availableFloors.map((floor) => {
                const count = contacts.filter((c) => getContactFloor(c.location) === floor).length;
                const isSelected = selectedFloor === floor;
                return (
                  <button
                    key={floor}
                    onClick={() => handleFloorChange(floor)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                        : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? "text-slate-950" : "text-amber-400"}`} />
                    <span>{floor}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isSelected ? "bg-slate-950/20 text-slate-950" : "bg-slate-700/80 text-slate-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. DYNAMIC DEPARTMENTS (ONLY SHOWS DEPARTMENTS PRESENT ON THE SELECTED FLOOR) */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Filter className="w-3.5 h-3.5 text-teal-400" />
                {selectedFloor === "all"
                  ? "ALL HOSPITAL DEPARTMENTS:"
                  : `DEPARTMENTS ON ${selectedFloor.toUpperCase()} (${departmentsOnSelectedFloor.length}):`}
              </span>
              {(selectedDept !== "all" || search) && (
                <button
                  onClick={() => {
                    setSelectedDept("all");
                    setSearch("");
                  }}
                  className="text-[10px] text-teal-400 hover:text-teal-300 transition underline"
                >
                  Reset filters
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => setSelectedDept("all")}
                className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 whitespace-nowrap ${
                  selectedDept === "all"
                    ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold"
                    : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                All Departments ({contactsOnSelectedFloor.length})
              </button>

              {departmentsOnSelectedFloor.map((dept) => {
                const count = contactsOnSelectedFloor.filter((c) => c.department === dept).length;
                const isSelected = selectedDept === dept;
                return (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold"
                        : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <span>{dept}</span>
                    <span className="text-[10px] font-mono opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-5 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <strong className="text-white font-mono">{filteredContacts.length}</strong>
            <span>of {contacts.length} contacts</span>
            {selectedFloor !== "all" && (
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-medium text-[11px]">
                Floor: {selectedFloor}
              </span>
            )}
            {selectedDept !== "all" && (
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 font-medium text-[11px]">
                Dept: {selectedDept}
              </span>
            )}
          </div>
          {search && (
            <span className="text-[11px] text-slate-400 italic">
              Matching &ldquo;{search}&rdquo;
            </span>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-teal-400 mb-3" />
              <p className="text-sm font-semibold">Loading hospital directory...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="py-16 text-center text-slate-500 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6">
              <BookUser className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No matching contacts found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No department or extension matches your current search or floor filter.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => {
                    setSelectedFloor("all");
                    setSelectedDept("all");
                    setSearch("");
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Clear All Filters
                </button>
                {isAdmin && (
                  <button
                    onClick={openAddForm}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:bg-teal-500/30 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Contact
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredContacts.map((contact) => {
                const floor = getContactFloor(contact.location);
                return (
                  <div
                    key={contact.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-950 transition flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      {/* Top Row: Department & Floor Badges + Admin Actions */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-teal-500/15 border border-teal-500/30 text-teal-300 text-[10px] font-bold tracking-wide">
                            {contact.department}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {floor}
                          </span>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                            <button
                              onClick={() => openEditForm(contact)}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-sky-500/20 hover:text-sky-300 text-slate-400 transition"
                              title="Edit Contact"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(contact)}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-400 transition"
                              title="Delete Contact"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Contact / Station Name */}
                      <h3 className="font-bold text-sm text-white leading-snug">
                        {contact.name}
                      </h3>

                      {/* Specific Location detail if different from floor name */}
                      {contact.location && contact.location !== floor && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{contact.location}</span>
                        </div>
                      )}

                      {/* Notes / Hours if available */}
                      {contact.notes && contact.notes !== `Floor: ${contact.location}` && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                          <Clock className="w-3 h-3 text-sky-400 shrink-0" />
                          <span className="truncate">{contact.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Extension & Action Row */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-teal-400" />
                        <span className="text-xs text-slate-400">Ext:</span>
                        <span className="font-mono font-bold text-sm text-teal-300 px-2 py-0.5 rounded-lg bg-teal-950/60 border border-teal-500/30">
                          {contact.extension}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyExtension(contact)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                          copiedId === contact.id
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                        }`}
                        title="Copy extension number to clipboard"
                      >
                        {copiedId === contact.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Elyano Connect Hospital Telecom & Intercom Directory</span>
          </span>
          <span className="text-slate-500">Live Hospital Extensions Database</span>
        </div>

        {/* Admin Add/Edit Modal Form Overlay */}
        {isFormOpen && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    {editingContact ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
                  </div>
                  <h3 className="font-bold text-sm text-white">
                    {editingContact ? "Edit Department Contact" : "Add Department Contact"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="mb-3 p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveContact} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Contact / Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. IT Service Desk-1 or Dr. Sarah Abd El Majeed"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Department *
                    </label>
                    <input
                      type="text"
                      required
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      placeholder="e.g. Customer Service & Reception"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Extension Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formExt}
                      onChange={(e) => setFormExt(e.target.value)}
                      placeholder="e.g. 1001, 8888"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Hospital Floor *
                    </label>
                    <select
                      value={formFloor}
                      onChange={(e) => {
                        setFormFloor(e.target.value);
                        if (!formLocation || ORDERED_FLOORS.includes(formLocation)) {
                          setFormLocation(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500"
                    >
                      {ORDERED_FLOORS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                      <option value="Other">Other Floor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Exact Location / Room
                    </label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="e.g. Ground Floor or Room 401"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Operational Notes / Hours (Optional)
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. 24/7 Priority Emergency Line, Open 08:00 - 20:00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition flex items-center gap-1.5 shadow"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{editingContact ? "Save Changes" : "Add Contact"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteTarget && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5 text-rose-400 mb-3">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Delete Department Contact?</h3>
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Are you sure you want to remove <strong className="text-white">{deleteTarget.name}</strong> (Ext:{" "}
                <span className="font-mono text-teal-400">{deleteTarget.extension}</span>) from the hospital phone notebook?
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteContact(deleteTarget.id)}
                  className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs shadow"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reload Official Directory Confirmation Dialog */}
        {isResetConfirmOpen && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5 text-amber-400 mb-3">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Reload Official Directory?</h3>
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                This will reset the phone notebook to the hospital&apos;s master directory of{" "}
                <strong className="text-teal-400">196 official department contacts</strong> across all floors
                (Basement, Ground Floor, M Floor, 1st, 2nd, 3rd, and 4th Floor).
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetDirectory}
                  disabled={isResetting}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5"
                >
                  {isResetting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Reload Official 196 Contacts</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
