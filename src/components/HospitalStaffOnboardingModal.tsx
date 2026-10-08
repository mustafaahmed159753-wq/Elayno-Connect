import React, { useState, useEffect, useRef } from "react";
import { socket } from "../lib/socket";
import {
  Hospital,
  UserCheck,
  Building,
  Phone,
  PhoneCall,
  MapPin,
  Clock,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  Stethoscope,
  HeartPulse,
  Syringe,
  Cpu,
  Flame,
  Wrench,
  Shield,
  Layers,
  Check,
  Sun,
  Moon,
  Sunset,
} from "lucide-react";
import { EliteLogo } from "./EliteLogo";

interface Props {
  username: string;
  onCompleted: (userData: any) => void;
  onLogout?: () => void;
}

export const HOSPITAL_DEPARTMENTS: {
  name: string;
  prefix: string;
  code: string;
  extRange: string;
  icon: string;
  color: string;
}[] = [
  { name: "Emergency Ward", prefix: "11", code: "EMERG", extRange: "1100 - 1129", icon: "Flame", color: "from-rose-500 to-red-600" },
  { name: "Cardiology", prefix: "20", code: "CARDIO", extRange: "2010 - 2029", icon: "HeartPulse", color: "from-red-500 to-pink-600" },
  { name: "Surgery & Operating Theatres", prefix: "30", code: "SURG", extRange: "3010 - 3039", icon: "Syringe", color: "from-purple-500 to-indigo-600" },
  { name: "Intensive Care Unit (ICU)", prefix: "20", code: "ICU", extRange: "2030 - 2050", icon: "Stethoscope", color: "from-amber-500 to-orange-600" },
  { name: "Pediatrics", prefix: "12", code: "PED", extRange: "1200 - 1229", icon: "Sparkles", color: "from-sky-500 to-blue-600" },
  { name: "Nursing Administration", prefix: "13", code: "NURS", extRange: "1300 - 1330", icon: "HeartPulse", color: "from-teal-500 to-emerald-600" },
  { name: "Information Technology", prefix: "10", code: "IT", extRange: "1001 - 1030", icon: "Cpu", color: "from-cyan-500 to-blue-600" },
  { name: "Radiology & PACS", prefix: "10", code: "RAD", extRange: "1015 - 1040", icon: "Layers", color: "from-violet-500 to-purple-600" },
  { name: "Pharmacy", prefix: "10", code: "PHARM", extRange: "1050 - 1070", icon: "Syringe", color: "from-emerald-500 to-teal-600" },
  { name: "Laboratory & Pathology", prefix: "10", code: "LAB", extRange: "1080 - 1099", icon: "Layers", color: "from-fuchsia-500 to-pink-600" },
  { name: "Biomedical Engineering", prefix: "10", code: "BIOMED", extRange: "1022 - 1045", icon: "Wrench", color: "from-indigo-500 to-cyan-600" },
  { name: "Sales & Medical Marketing", prefix: "11", code: "SALES", extRange: "1120 - 1145", icon: "Briefcase", color: "from-amber-500 to-yellow-600" },
  { name: "Hospital Security & CCTV", prefix: "10", code: "SEC", extRange: "1002 - 1020", icon: "Shield", color: "from-slate-500 to-zinc-600" },
  { name: "Human Resources", prefix: "10", code: "HR", extRange: "1007 - 1025", icon: "UserCheck", color: "from-sky-500 to-teal-600" },
  { name: "Maintenance & Facilities", prefix: "10", code: "MAINT", extRange: "1060 - 1085", icon: "Wrench", color: "from-zinc-500 to-slate-600" },
  { name: "Outpatient Clinics", prefix: "14", code: "CLINIC", extRange: "1400 - 1450", icon: "Hospital", color: "from-blue-500 to-indigo-600" },
];

export const HOSPITAL_FLOORS = [
  "Basement",
  "Ground Floor",
  "1st Floor",
  "2nd Floor",
  "3rd Floor",
  "4th Floor",
  "5th Floor",
];

export const HOSPITAL_ZONES = [
  "Zone A",
  "Zone B",
  "Zone C",
  "Zone D",
  "Main Station",
  "East Wing",
  "West Wing",
];

export const ROLES_LIST = [
  { title: "Specialist Physician / Doctor", category: "Medical", icon: "Stethoscope" },
  { title: "Lead Surgeon / Consultant", category: "Medical", icon: "Syringe" },
  { title: "Nursing Supervisor / Head Nurse", category: "Nursing", icon: "HeartPulse" },
  { title: "Staff Clinical Care Nurse", category: "Nursing", icon: "HeartPulse" },
  { title: "IT Support Systems Engineer", category: "Technical", icon: "Cpu" },
  { title: "Biomedical Systems Engineer", category: "Technical", icon: "Wrench" },
  { title: "Sales & Medical Representative", category: "Commercial", icon: "Briefcase" },
  { title: "Pharmacist / Medication Specialist", category: "Clinical", icon: "Syringe" },
  { title: "Radiology Technologist", category: "Diagnostic", icon: "Layers" },
  { title: "Laboratory Technician", category: "Diagnostic", icon: "Layers" },
  { title: "Administrative Officer", category: "Admin", icon: "UserCheck" },
  { title: "Hospital Security Officer", category: "Operations", icon: "Shield" },
];

export const SHIFT_PRESETS = [
  { label: "Morning (08:00 - 15:00)", time: "15:00", icon: Sun, period: "Day" },
  { label: "Day Shift (09:00 - 17:00)", time: "17:00", icon: Sun, period: "Standard" },
  { label: "Evening (12:00 - 20:00)", time: "20:00", icon: Sunset, period: "Evening" },
  { label: "Late Night (15:00 - 23:00)", time: "23:00", icon: Moon, period: "Night" },
  { label: "Night Shift (20:00 - 08:00)", time: "08:00", icon: Moon, period: "Overnight" },
];

export const HospitalStaffOnboardingModal: React.FC<Props> = ({
  username,
  onCompleted,
  onLogout,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState(HOSPITAL_DEPARTMENTS[0].name);
  const [deptSearch, setDeptSearch] = useState("");
  const [assignedExtension, setAssignedExtension] = useState("1105");
  const [mobilePhone, setMobilePhone] = useState("");
  const [role, setRole] = useState(ROLES_LIST[0].title);
  const [floor, setFloor] = useState("3rd Floor");
  const [zone, setZone] = useState("Zone A");
  
  // Custom Standalone Clock State
  const [shiftHours, setShiftHours] = useState(17);
  const [shiftMinutes, setShiftMinutes] = useState(0);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll input into center view when keyboard pops up on mobile
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
  };

  // Compute assigned extension dynamically whenever department changes
  useEffect(() => {
    const deptObj = HOSPITAL_DEPARTMENTS.find((d) => d.name === department);
    if (deptObj) {
      let seed = 0;
      for (let i = 0; i < username.length; i++) {
        seed = (seed + username.charCodeAt(i)) % 25;
      }
      const prefix = deptObj.prefix;
      const num = 10 + (seed % 19);
      setAssignedExtension(`${prefix}${num < 10 ? `0${num}` : num}`);
    }
  }, [department, username]);

  const formattedShiftEnd = `${shiftHours.toString().padStart(2, "0")}:${shiftMinutes.toString().padStart(2, "0")}`;

  const validateStep1 = () => {
    if (!fullName.trim()) {
      setError("Official Full Name is mandatory for hospital credentials.");
      return false;
    }
    if (fullName.trim().length < 3) {
      setError("Please enter a valid full name with at least 3 characters.");
      return false;
    }
    if (!mobilePhone.trim()) {
      setError("Mobile phone number is required for hospital staff duty roster.");
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!department) {
      setError("Please select your hospital department.");
      return false;
    }
    if (!assignedExtension.trim()) {
      setError("Assigned extension number cannot be empty.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
    setError(null);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) return;

    setSubmitting(true);
    setError(null);

    const payload = {
      username,
      full_name: fullName.trim(),
      department,
      assigned_extension: assignedExtension.trim(),
      mobile_phone: mobilePhone.trim(),
      role,
      floor,
      zone,
      shift_end: formattedShiftEnd,
    };

    try {
      const cleanUserKey = username.toLowerCase().split("@")[0].trim();
      localStorage.setItem(`elyano_onboarding_done_${cleanUserKey}`, "true");
      
      const res = await fetch("/api/staff/register_onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        if (socket.connected) {
          socket.emit("staff_onboarding_submit", payload);
        }
        onCompleted(data.profile || payload);
      } else {
        setError(data.message || "Failed to register profile. Please try again.");
      }
    } catch (err: any) {
      console.error("Onboarding submission error:", err);
      const cleanUserKey = username.toLowerCase().split("@")[0].trim();
      localStorage.setItem(`elyano_onboarding_done_${cleanUserKey}`, "true");
      if (socket.connected) {
        socket.emit("staff_onboarding_submit", payload);
        onCompleted(payload);
      } else {
        setError("Network error. Please try submitting again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDeptInfo = HOSPITAL_DEPARTMENTS.find((d) => d.name === department);

  const filteredDepts = HOSPITAL_DEPARTMENTS.filter(
    (d) =>
      d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.extRange.includes(deptSearch)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-0 sm:p-4 overflow-hidden">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] max-w-2xl bg-slate-900 border-0 sm:border border-sky-500/30 sm:rounded-3xl shadow-2xl text-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Fixed Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 via-teal-500 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Hospital className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  Hospital Staff Duty Registration
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  Mandatory First Login
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Clinical Directory • Real-time Staff Presence
              </p>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              type="button"
              className="text-xs px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer shrink-0"
            >
              Sign Out
            </button>
          )}
        </div>

        {/* Step Progress Bar Indicator */}
        <div className="shrink-0 bg-slate-950/60 px-4 sm:px-6 py-2.5 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${step === 1 ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30" : step > 1 ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"}`}>
              {step > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "1"}
            </span>
            <span className={step === 1 ? "font-bold text-sky-400" : "text-slate-400"}>
              Identity
            </span>
          </div>

          <div className="h-0.5 flex-1 mx-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-teal-400 transition-all duration-300"
              style={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${step === 2 ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30" : step > 2 ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"}`}>
              {step > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "2"}
            </span>
            <span className={step === 2 ? "font-bold text-sky-400" : "text-slate-400"}>
              Department
            </span>
          </div>

          <div className="h-0.5 flex-1 mx-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-300"
              style={{ width: step === 3 ? "100%" : "0%" }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${step === 3 ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30" : "bg-slate-800 text-slate-400"}`}>
              3
            </span>
            <span className={step === 3 ? "font-bold text-sky-400" : "text-slate-400"}>
              Station & Shift
            </span>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-28 sm:pb-6 space-y-4"
        >
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Full Name, Mobile Phone & Professional Role */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="p-3 rounded-2xl bg-sky-950/40 border border-sky-500/20 text-xs text-sky-300 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  Welcome <strong className="text-white">@{username}</strong>. Please enter your official identity for the hospital registry.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-sky-400" />
                  Full Name & Clinical Title <span className="text-rose-400">* (Mandatory)</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="e.g. Dr. Ahmed Mansour or Nurse Sarah Jenkins"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-teal-400" />
                  Mobile Phone Number <span className="text-rose-400">* (Mandatory)</span>
                </label>
                <input
                  type="tel"
                  required
                  value={mobilePhone}
                  onChange={(e) => setMobilePhone(e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="e.g. +20 100 123 4567 or +1 (555) 019-2834"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-medium focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 transition shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  Select Professional Role in Hospital
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {ROLES_LIST.map((r) => {
                    const isSelected = role === r.title;
                    return (
                      <button
                        key={r.title}
                        type="button"
                        onClick={() => setRole(r.title)}
                        className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? "bg-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/10"
                            : "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-sky-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{r.title}</p>
                          <p className="text-[10px] text-slate-400">{r.category}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Custom Standalone Department & Extension Grid */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-indigo-400" />
                  Select Your Assigned Department
                </label>
                <span className="text-[11px] text-sky-400 font-semibold">
                  {filteredDepts.length} Departments
                </span>
              </div>

              {/* Standalone Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="Search department or extension prefix..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-400 transition"
                />
              </div>

              {/* Standalone Visual Department Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {filteredDepts.map((d) => {
                  const isSelected = department === d.name;
                  return (
                    <button
                      key={d.name}
                      type="button"
                      onClick={() => setDepartment(d.name)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? "bg-gradient-to-r from-indigo-950/80 to-sky-950/80 border-indigo-400 shadow-md shadow-indigo-500/15"
                          : "bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/70 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-tr ${d.color} text-white font-bold text-xs shadow`}
                        >
                          {d.code.substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelected ? "text-indigo-200" : "text-slate-200"}`}>
                            {d.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Prefix {d.prefix}xx • {d.extRange}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 text-slate-950 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Department Auto-Assigned Extension Card */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-200">
                      Auto-Assigned Internal Extension
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Based on {department} directory allocation
                    </p>
                  </div>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-mono font-black text-sm tracking-wider shadow">
                  Ext. {assignedExtension}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Floor, Zone & Custom Interactive Shift Clock */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              {/* Floor Selector */}
              <div>
                <label className="text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  Hospital Floor Assignment
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {HOSPITAL_FLOORS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFloor(f)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        floor === f
                          ? "bg-sky-500 border-sky-400 text-slate-950 shadow-md shadow-sky-500/20 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone Selector */}
              <div>
                <label className="text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  Station Zone / Wing
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {HOSPITAL_ZONES.map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setZone(z)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        zone === z
                          ? "bg-teal-500 border-teal-400 text-slate-950 shadow-md shadow-teal-500/20 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              </div>

              {/* CUSTOM STANDALONE INTERACTIVE SHIFT CLOCK (NO Browser GUI) */}
              <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Shift Expected End Time
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                    Custom Shift Clock
                  </span>
                </div>

                {/* Digital Glowing Clock Face Display */}
                <div className="flex items-center justify-center gap-3 py-3 px-4 bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-inner">
                  {/* Hours Dial */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setShiftHours((prev) => (prev + 1) % 24)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition text-xs font-bold"
                    >
                      ▲
                    </button>
                    <span className="text-3xl sm:text-4xl font-black font-mono text-amber-300 tracking-wider">
                      {shiftHours.toString().padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShiftHours((prev) => (prev - 1 + 24) % 24)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition text-xs font-bold"
                    >
                      ▼
                    </button>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">Hours</span>
                  </div>

                  <span className="text-3xl sm:text-4xl font-black text-amber-400/80 animate-pulse pb-4">
                    :
                  </span>

                  {/* Minutes Dial */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setShiftMinutes((prev) => (prev + 15) % 60)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition text-xs font-bold"
                    >
                      ▲
                    </button>
                    <span className="text-3xl sm:text-4xl font-black font-mono text-amber-300 tracking-wider">
                      {shiftMinutes.toString().padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShiftMinutes((prev) => (prev - 15 + 60) % 60)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition text-xs font-bold"
                    >
                      ▼
                    </button>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">Mins</span>
                  </div>

                  {/* Period Indicator */}
                  <div className="ml-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-xs font-extrabold text-amber-400 font-mono block">
                      {shiftHours >= 12 ? "PM" : "AM"}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {shiftHours >= 18 ? "Night" : shiftHours >= 12 ? "Afternoon" : "Morning"}
                    </span>
                  </div>
                </div>

                {/* Quick Shift Presets Chips */}
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    Quick Shift Ending Presets:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {SHIFT_PRESETS.map((p) => {
                      const [h, m] = p.time.split(":").map(Number);
                      const isSelected = shiftHours === h && shiftMinutes === m;
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setShiftHours(h);
                            setShiftMinutes(m);
                          }}
                          className={`p-2 rounded-xl text-left border flex items-center gap-2 transition cursor-pointer ${
                            isSelected
                              ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-amber-400" : "text-slate-500"}`} />
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold block truncate">{p.time}</span>
                            <span className="text-[9px] text-slate-400 block truncate">{p.period}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Registration Summary Card */}
              <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-sky-200">
                    {fullName || username} • {role}
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    📍 {floor} ({zone}) • {department} (Ext. {assignedExtension})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Duty Until</span>
                  <span className="font-mono font-bold text-amber-400 text-xs">{formattedShiftEnd}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky/Fixed Action Footer */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-sky-500/25 transition cursor-pointer"
            >
              Continue to {step === 1 ? "Department" : "Shift Hours"} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Registering Credentials...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Register Presence</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
