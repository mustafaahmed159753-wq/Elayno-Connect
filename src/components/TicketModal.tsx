import React, { useState, useEffect, useMemo } from "react";
import {
  Ticket as TicketIcon,
  MapPin,
  CheckCircle2,
  Search,
  Phone,
  Building2,
  Check,
  X,
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeft,
  Info,
} from "lucide-react";
import { PlaceLocation, Group } from "../types";
import { HOSPITAL_FLOORS, HOSPITAL_PLACES, FloorDefinition } from "../data/hospitalPlaces";

interface Props {
  currentUser: string;
  groups?: Group[];
  onClose: () => void;
  onSubmitted: () => void;
}

const DEFAULT_DEPARTMENTS = [
  { id: "IT Support", name: "IT & Network Support", icon: "💻" },
  { id: "Maintenance", name: "Biomedical & Maintenance", icon: "🔧" },
  { id: "Pharmacy", name: "Pharmacy Services", icon: "💊" },
  { id: "Housekeeping", name: "Housekeeping & Facilities", icon: "🧹" },
];

export const TicketModal: React.FC<Props> = ({ currentUser, groups = [], onClose, onSubmitted }) => {
  const [step, setStep] = useState(1);
  const [places, setPlaces] = useState<PlaceLocation[]>(HOSPITAL_PLACES);
  
  // Selected Floor & Place state
  const [selectedFloorCode, setSelectedFloorCode] = useState<string>("G");
  const [floor, setFloor] = useState<string>("Ground Floor");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>("");
  const [subLocation, setSubLocation] = useState<string>("");
  const [specificDetails, setSpecificDetails] = useState<string>("");
  const [extension, setExtension] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Compute dynamic departments from admin ticket groups or defaults
  const ticketGroups = groups.filter((g) => g.is_ticket_group);
  const dynamicDepts =
    ticketGroups.length > 0
      ? ticketGroups.map((g) => ({
          id: g.name,
          name: g.name,
          icon: g.name.toLowerCase().includes("it")
            ? "💻"
            : g.name.toLowerCase().includes("pharmacy")
            ? "💊"
            : g.name.toLowerCase().includes("maint")
            ? "🔧"
            : "🏥",
        }))
      : DEFAULT_DEPARTMENTS;

  const [dept, setDept] = useState(dynamicDepts[0]?.id || "IT Support");

  // Fetch registered places from backend, falling back to local dataset
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.places) && data.places.length > 0) {
          setPlaces(data.places);
        }
      })
      .catch((e) => console.error("Could not fetch server places config:", e));
  }, []);

  // Active Floor definition helper
  const activeFloorDef = useMemo(() => {
    return HOSPITAL_FLOORS.find((f) => f.code === selectedFloorCode) || HOSPITAL_FLOORS[1];
  }, [selectedFloorCode]);

  // Check if place belongs to a floor definition
  const matchesFloorDef = (place: PlaceLocation, floorDef: FloorDefinition) => {
    const pf = (place.floor || "").toLowerCase().trim();
    if (floorDef.code === "ALL") return true;
    if (floorDef.floorName.toLowerCase() === pf) return true;
    if (floorDef.aliases.some((alias) => pf.includes(alias.toLowerCase()))) return true;
    return false;
  };

  // Pre-calculate place counts per floor
  const floorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    HOSPITAL_FLOORS.forEach((fl) => {
      counts[fl.code] = places.filter((p) => matchesFloorDef(p, fl)).length;
    });
    return counts;
  }, [places]);

  // Handle Floor Tab Pick
  const handleSelectFloor = (floorDef: FloorDefinition | { code: string; name: string; floorName: string }) => {
    setSelectedFloorCode(floorDef.code);
    if (floorDef.code !== "ALL") {
      setFloor(floorDef.floorName);
    }
  };

  // Filter places based on picked floor and search text
  const filteredPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return places.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.extension && p.extension.includes(q)) ||
        (p.number && p.number.includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.floor && p.floor.toLowerCase().includes(q));

      if (selectedFloorCode === "ALL") {
        return matchSearch;
      }
      return matchesFloorDef(p, activeFloorDef) && matchSearch;
    });
  }, [places, selectedFloorCode, activeFloorDef, searchQuery]);

  // Pick up place, floor, and extension number directly!
  const handleSelectPlace = (place: PlaceLocation) => {
    setSelectedPlaceId(place.id);
    setSubLocation(place.name);
    setFloor(place.floor);
    
    // Pick up floor code
    const matchedFl = HOSPITAL_FLOORS.find((f) => matchesFloorDef(place, f));
    if (matchedFl) {
      setSelectedFloorCode(matchedFl.code);
    }

    // Automatically pick up extension number
    const ext = place.extension || place.number || "";
    setExtension(ext);
  };

  const handleSubmit = async () => {
    const resolvedSubLocation = [subLocation.trim(), specificDetails.trim()]
      .filter(Boolean)
      .join(" — ");

    if (!resolvedSubLocation || !description.trim()) {
      alert("Please select a place or enter location details, and describe the issue.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitted_by: currentUser,
          department: dept,
          floor,
          sub_location: resolvedSubLocation,
          extension: extension.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSubmitted();
          onClose();
        }, 1500);
      } else {
        alert(data.m || "Failed to submit ticket");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/60 rounded-3xl p-6 text-slate-100 shadow-2xl animate-in fade-in duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shadow-inner">
              <TicketIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Submit Support Ticket
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Step {step} of 3
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {step === 1 && "Choose the responsible department"}
                {step === 2 && "Pick floor, place & auto-detect extension number"}
                {step === 3 && "Describe issue & review ticket details"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
            <h4 className="font-bold text-xl text-white">Ticket Submitted Successfully!</h4>
            <p className="text-xs text-slate-300 max-w-md">
              Your ticket has been registered with Floor: <b>{floor}</b>, Place: <b>{subLocation}</b>, and Phone Extension: <b>{extension || "N/A"}</b>.
            </p>
            <span className="text-[11px] text-sky-400 bg-sky-950/60 px-3 py-1 rounded-full border border-sky-500/30">
              Auto-dispatched to the {dept} department group chat
            </span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {/* STEP 1: Department Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <label className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">
                  Select Department to Handle Request
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dynamicDepts.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDept(d.id)}
                      className={`p-4 rounded-2xl border text-left flex items-center gap-3.5 transition group ${
                        dept === d.id
                          ? "bg-sky-500/15 border-sky-500 text-white font-bold ring-1 ring-sky-500/50 shadow-lg shadow-sky-500/10"
                          : "bg-slate-950/70 border-slate-800 hover:bg-slate-800/50 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <span className="text-2xl p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/50 group-hover:scale-110 transition shrink-0">
                        {d.icon}
                      </span>
                      <div className="min-w-0">
                        <span className="text-sm font-bold block truncate">{d.name}</span>
                        <span className="text-[11px] text-slate-400">Hospital Support Queue</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
                  >
                    Continue to Location & Places <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Floor Selection, Search & Places Picker with Auto Extension Pickup */}
            {step === 2 && (
              <div className="space-y-4">
                {/* 1. Floor Selector Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Layers className="w-4 h-4 text-sky-400" /> 1. Select Hospital Floor:
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Active: <b className="text-sky-300">{activeFloorDef.name}</b>
                    </span>
                  </div>

                  {/* Horizontal Scrollable Floor Pills */}
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {HOSPITAL_FLOORS.map((fl) => {
                      const isSelected = selectedFloorCode === fl.code;
                      const count = floorCounts[fl.code] || 0;
                      return (
                        <button
                          key={fl.code}
                          type="button"
                          onClick={() => handleSelectFloor(fl)}
                          className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? "bg-sky-500/20 border-sky-400 text-sky-200 font-bold ring-2 ring-sky-400/40 shadow-md"
                              : "bg-slate-950/70 border-slate-800 hover:bg-slate-800/60 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <span className="text-sm font-black tracking-tight">{fl.shortLabel}</span>
                          <span className="text-[10px] text-slate-400 leading-none truncate w-full text-center">
                            {fl.floorName.replace(" Floor", "")}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                              isSelected ? "bg-sky-400/30 text-sky-200" : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}

                    {/* All Floors Button */}
                    <button
                      type="button"
                      onClick={() => handleSelectFloor({ code: "ALL", name: "All Hospital Floors", floorName: "Hospital-wide" })}
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                        selectedFloorCode === "ALL"
                          ? "bg-purple-500/20 border-purple-400 text-purple-200 font-bold ring-2 ring-purple-400/40 shadow-md"
                          : "bg-slate-950/70 border-slate-800 hover:bg-slate-800/60 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <span className="text-sm font-black">ALL</span>
                      <span className="text-[10px] text-slate-400 leading-none">Floors</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                        {places.length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. Interactive Search Box */}
                <div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search place, room or extension on ${
                        selectedFloorCode === "ALL" ? "all floors" : activeFloorDef.shortLabel
                      } (e.g. ICU, CT, 2022, 1001, Pharmacy)...`}
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition placeholder:text-slate-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between px-1 mt-1 text-[11px] text-slate-400">
                    <span>
                      Showing <b>{filteredPlaces.length}</b> places {selectedFloorCode !== "ALL" && `on ${activeFloorDef.name}`}
                    </span>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="text-sky-400 hover:underline"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Places Grid shown AFTER the picked floor */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                    {filteredPlaces.length === 0 ? (
                      <div className="col-span-full py-8 text-center text-slate-400 text-xs space-y-2">
                        <MapPin className="w-7 h-7 text-slate-600 mx-auto" />
                        <p>No hospital places matched "{searchQuery}" on this floor.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFloorCode("ALL");
                            setSearchQuery(searchQuery);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-300 font-semibold text-xs hover:bg-sky-500/30 transition"
                        >
                          Search across ALL Hospital Floors
                        </button>
                      </div>
                    ) : (
                      filteredPlaces.map((p) => {
                        const isSelected = selectedPlaceId === p.id || subLocation === p.name;
                        const extNum = p.extension || p.number;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectPlace(p)}
                            className={`p-3 rounded-xl border text-left transition flex items-start justify-between gap-2.5 group ${
                              isSelected
                                ? "bg-sky-500/20 border-sky-400 text-sky-100 ring-1 ring-sky-400/50 shadow-md"
                                : "bg-slate-900/80 border-slate-800 hover:bg-slate-800/60 text-slate-300 hover:border-slate-700"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold truncate group-hover:text-white">
                                  {p.name}
                                </span>
                                {isSelected && (
                                  <span className="w-4 h-4 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] text-slate-400 truncate">
                                  🏢 {p.floor}
                                </span>
                                {p.category && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/50 truncate">
                                    {p.category}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Extension Badge */}
                            {extNum && (
                              <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-950/90 border border-sky-500/30 text-sky-300 text-[11px] font-mono font-bold group-hover:border-sky-400 transition">
                                <Phone className="w-3 h-3 text-sky-400" />
                                <span>Ext: {extNum}</span>
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 4. Auto-Picked Location & Extension Confirmation Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-950 to-indigo-950/40 border border-sky-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Auto-Picked Location & Extension
                    </span>
                    {subLocation && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                        Ready to File
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Picked Floor:</span>
                      <span className="font-bold text-slate-100 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-sky-400" /> {floor || "Not picked yet"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Picked Place:</span>
                      <span className="font-bold text-slate-100 truncate block" title={subLocation}>
                        {subLocation || "Select place above"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Phone Extension:</span>
                      <span className="font-bold text-sky-300 font-mono flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-sky-400" />
                        {extension ? `Ext. ${extension}` : "Internal Line"}
                      </span>
                    </div>
                  </div>

                  {/* Refinement Inputs: Custom Specific Bed/Room & Editable Extension */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Specific Room / Bed / Desk (Optional)
                      </label>
                      <input
                        type="text"
                        value={specificDetails}
                        onChange={(e) => setSpecificDetails(e.target.value)}
                        placeholder="e.g. Bed 02, Doctor Desk, Console 1..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500 transition"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Extension Number (Auto-detected from place)
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={extension}
                          onChange={(e) => setExtension(e.target.value)}
                          placeholder="e.g. 1001, 2022..."
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sky-300 font-mono text-xs focus:outline-none focus:border-sky-500 transition font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back / Next Step navigation */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="button"
                    disabled={!subLocation.trim()}
                    onClick={() => setStep(3)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      subLocation.trim()
                        ? "bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    Next: Issue Description <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Issue Description & Final Review */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Summary Banner */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                    Ticket Overview & Destination
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Target Department:</span>
                      <span className="font-bold text-slate-200">{dept}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Hospital Floor:</span>
                      <span className="font-bold text-slate-200">{floor}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Selected Place:</span>
                      <span className="font-bold text-slate-200 truncate block">{subLocation}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Phone Extension:</span>
                      <span className="font-bold text-sky-400 font-mono">
                        {extension ? `Ext: ${extension}` : "Ext. Internal"}
                      </span>
                    </div>
                  </div>

                  {specificDetails && (
                    <div className="pt-1.5 border-t border-slate-800/80 text-xs">
                      <span className="text-[10px] text-slate-500 block">Specific Location Note:</span>
                      <span className="text-slate-300 italic">{specificDetails}</span>
                    </div>
                  )}
                </div>

                {/* Problem Description Textarea */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Describe the Issue / Service Request <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what happened, any error messages, affected device, or maintenance needed..."
                    rows={4}
                    className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500 transition resize-none placeholder:text-slate-500"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Location
                  </button>
                  <button
                    type="button"
                    disabled={loading || !description.trim()}
                    onClick={handleSubmit}
                    className={`flex-1 py-3 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition ${
                      !description.trim() || loading
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25"
                    }`}
                  >
                    {loading ? "Submitting Ticket..." : "🚀 File & Submit Ticket"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
