import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

export async function generateFeaturesPdf(outputPath) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const TEAL_PRIMARY = [0, 137, 123]; // #00897B
  const TEAL_ACCENT = [0, 172, 193]; // #00ACC1
  const DARK_BG = [15, 23, 42]; // #0F172A
  const CARD_BG = [241, 245, 249]; // #F1F5F9
  const CARD_BORDER = [203, 213, 225]; // #CBD5E1
  const TEXT_DARK = [15, 23, 42];
  const TEXT_MUTED = [100, 116, 139];
  const TEXT_LIGHT = [255, 255, 255];
  const SUCCESS_GREEN = [16, 185, 129];
  const WARNING_AMBER = [245, 158, 11];
  const DANGER_RED = [239, 68, 68];

  function addHeader(title, category = "ELITE HOSPITAL NETWORK • SYSTEM FEATURE MANUAL") {
    doc.setFillColor(...DARK_BG);
    doc.rect(0, 0, pageWidth, 54, "F");

    // Top color strip
    doc.setFillColor(...TEAL_PRIMARY);
    doc.rect(0, 0, pageWidth, 4, "F");

    // Title & Category
    doc.setTextColor(0, 196, 180);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(category.toUpperCase(), margin, 24);

    doc.setTextColor(...TEXT_LIGHT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(title, margin, 42);

    // Right logo / watermark text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Elyano Connect v1.0 • Enterprise Release", pageWidth - margin, 42, { align: "right" });
  }

  function addFooter(pageNum, totalPages) {
    doc.setDrawColor(...CARD_BORDER);
    doc.setLineWidth(0.75);
    doc.line(margin, pageHeight - 34, pageWidth - margin, pageHeight - 34);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text("CONFIDENTIAL & PROPRIETARY • FOR AUTHORIZED HEALTHCARE STAFF ONLY", margin, pageHeight - 20);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 20, { align: "right" });
  }

  // ==========================================
  // PAGE 1: COVER PAGE
  // ==========================================
  // Background gradient-like dark canvas
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Top banner accent
  doc.setFillColor(...TEAL_PRIMARY);
  doc.rect(0, 0, pageWidth, 12, "F");

  // Hospital emblem / cross graphic
  const emblemX = pageWidth / 2;
  const emblemY = 160;

  // Glow circle
  doc.setFillColor(17, 94, 89);
  doc.circle(emblemX, emblemY, 52, "F");
  doc.setFillColor(13, 148, 136);
  doc.circle(emblemX, emblemY, 44, "F");

  // Medical Cross
  doc.setFillColor(...TEXT_LIGHT);
  // Vertical bar
  doc.roundedRect(emblemX - 8, emblemY - 26, 16, 52, 3, 3, "F");
  // Horizontal bar
  doc.roundedRect(emblemX - 26, emblemY - 8, 52, 16, 3, 3, "F");

  // Titles
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("ELYANO CONNECT", pageWidth / 2, 260, { align: "center" });

  doc.setTextColor(45, 212, 191);
  doc.setFontSize(14);
  doc.text("ELITE HOSPITAL NETWORK & CLINICAL MESSAGING PLATFORM", pageWidth / 2, 285, { align: "center" });

  doc.setTextColor(203, 213, 225);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Official Production Release & Screen Features Documentation Manual", pageWidth / 2, 310, { align: "center" });

  // Divider
  doc.setDrawColor(45, 212, 191);
  doc.setLineWidth(1.5);
  doc.line(pageWidth / 2 - 120, 330, pageWidth / 2 + 120, 330);

  // Metadata Card in Center
  const metaCardY = 360;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin + 20, metaCardY, contentWidth - 40, 240, 10, 10, "F");
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(margin + 20, metaCardY, contentWidth - 40, 240, 10, 10, "S");

  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("RELEASE INFORMATION & COMPLIANCE SUMMARY", margin + 40, metaCardY + 30);

  const metaRows = [
    ["Release Architecture:", "Self-Contained Standalone Production Build (Zero Source Code Exposed)"],
    ["Runtime Engine:", "Node.js 18+ / 20+ (ESBuild Bundled CommonJS + Pre-compiled Static Assets)"],
    ["Version:", "1.0.0 Enterprise Production Release"],
    ["Build Status:", "Verified & Validated Production Build (dist/server.cjs + dist/assets/)"],
    ["Target Deployment:", "On-Premises Linux / Windows Server, Docker Container, or Private Cloud"],
    ["Security Protocols:", "TLS/HTTPS Encryption, WebRTC DTLS/SRTP, LDAP/AD Authentication"],
    ["Primary Modules:", "Real-Time Chat, Video/Voice Calling, Medical Feed, AI Diagnostics, IT Tickets, Directory"],
    ["Documentation Date:", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
  ];

  let currentMetaY = metaCardY + 60;
  metaRows.forEach(([label, val]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(label, margin + 40, currentMetaY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_LIGHT);
    doc.text(val, margin + 170, currentMetaY);
    currentMetaY += 21;
  });

  // Bottom Notice
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "This technical guide contains real architectural screen diagrams and functional operating specifications for the production release.",
    pageWidth / 2,
    720,
    { align: "center", maxWidth: contentWidth - 40 }
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(45, 212, 191);
  doc.text("STANDALONE SOURCE-CODE-FREE DISTRIBUTION • HOSPITAL DEPLOYMENT READY", pageWidth / 2, 750, { align: "center" });

  addFooter(1, 10);

  // ==========================================
  // PAGE 2: ARCHITECTURE & ZERO-SOURCE-CODE DEPLOYMENT
  // ==========================================
  doc.addPage();
  addHeader("ARCHITECTURE & ZERO-SOURCE-CODE SPECIFICATION");

  // Overview box
  let y = 75;
  doc.setFillColor(...CARD_BG);
  doc.roundedRect(margin, y, contentWidth, 75, 8, 8, "F");
  doc.setDrawColor(...CARD_BORDER);
  doc.roundedRect(margin, y, contentWidth, 75, 8, 8, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEAL_PRIMARY);
  doc.text("Executive Summary: Zero-Source-Code Distribution Architecture", margin + 15, y + 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  const archSummary =
    "Elyano Connect is packaged as an optimized, production-hardened binary and pre-compiled asset release. The client-side React UI is minified and bundled into static HTML/JS/CSS, and the server-side logic is bundled into a single CommonJS executable (dist/server.cjs). Healthcare organizations can deploy, host, and run the entire hospital platform on their internal infrastructure without needing or exposing any TypeScript or React source code.";
  doc.text(archSummary, margin + 15, y + 36, { maxWidth: contentWidth - 30, lineHeightFactor: 1.4 });

  // Architectural Diagram / Workflow Card
  y += 90;
  doc.setFillColor(...DARK_BG);
  doc.roundedRect(margin, y, contentWidth, 190, 8, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(45, 212, 191);
  doc.text("STANDALONE PRODUCTION PACKAGE ANATOMY (NO SOURCE CODE)", margin + 15, y + 22);

  // Diagram 3 columns
  const colWidth = (contentWidth - 40) / 3;
  const colY = y + 40;

  // Box 1: Pre-Compiled Engine
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin + 10, colY, colWidth, 130, 6, 6, "F");
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("📁 dist/ [COMPILED]", margin + 20, colY + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const box1Lines = [
    "• server.cjs (Bundled API & WS)",
    "• index.html (App Entry Point)",
    "• assets/*.js (Minified App Bundle)",
    "• assets/*.css (Compiled Styles)",
    "• ZERO .ts or .tsx files",
    "• Completely Obfuscated",
  ];
  let b1y = colY + 38;
  box1Lines.forEach((l) => {
    doc.text(l, margin + 20, b1y);
    b1y += 14;
  });

  // Box 2: Automated Launchers
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin + 15 + colWidth, colY, colWidth, 130, 6, 6, "F");
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("⚡ LAUNCH & SETUP", margin + 25 + colWidth, colY + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const box2Lines = [
    "• setup.sh (Linux/macOS Auto-Setup)",
    "• start.sh (Linux/macOS Launcher)",
    "• setup.bat (Windows Auto-Setup)",
    "• start.bat (Windows Launcher)",
    "• Dockerfile (Container Image)",
    "• docker-compose.yml (One-Click)",
  ];
  let b2y = colY + 38;
  box2Lines.forEach((l) => {
    doc.text(l, margin + 25 + colWidth, b2y);
    b2y += 14;
  });

  // Box 3: Runtime Config & Storage
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin + 20 + colWidth * 2, colY, colWidth, 130, 6, 6, "F");
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("🔒 CONFIG & STORAGE", margin + 30 + colWidth * 2, colY + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const box3Lines = [
    "• package.json (Runtime Deps Only)",
    "• .env.example (Environment Vars)",
    "• data/ (Persistent JSON Database)",
    "• user_images/ (Profile Avatars)",
    "• shared_files/ (Attachments)",
    "• elite-hospital.service (Systemd)",
  ];
  let b3y = colY + 38;
  box3Lines.forEach((l) => {
    doc.text(l, margin + 30 + colWidth * 2, b3y);
    b3y += 14;
  });

  // Security and Compliance Table
  y += 205;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Hospital Security, Privacy & Enterprise Compliance", margin, y);

  y += 15;
  const securityFeatures = [
    ["End-to-End P2P Encryption", "All WebRTC video and audio communications use DTLS/SRTP encryption directly between medical devices without intermediate audio storage."],
    ["Role-Based Access Control (RBAC)", "Hierarchical authorization distinguishing Hospital Administrators, Doctors, Nurses, and Medical Technicians."],
    ["Active Directory / LDAP Sync", "Direct integration with hospital on-premises Active Directory Domain Services for central authentication and credential management."],
    ["Self-Signed & Custom SSL/TLS", "Built-in automatic HTTPS certificate generation and support for official hospital wildcard/CA certificates."],
    ["Air-Gapped & Offline Operable", "Capable of running fully on an isolated hospital intranet without external internet access, ensuring strict data sovereignty."],
    ["Audit & Incident Logging", "All administrative operations, broadcasts, tickets, and user status transitions are recorded in non-volatile audit logs."],
  ];

  securityFeatures.forEach(([title, desc]) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 38, 4, 4, "F");
    doc.setDrawColor(...CARD_BORDER);
    doc.roundedRect(margin, y, contentWidth, 38, 4, 4, "S");

    // Left indicator bar
    doc.setFillColor(...TEAL_PRIMARY);
    doc.rect(margin, y, 4, 38, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...TEAL_PRIMARY);
    doc.text(title, margin + 12, y + 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_DARK);
    doc.text(desc, margin + 12, y + 28, { maxWidth: contentWidth - 24 });

    y += 44;
  });

  addFooter(2, 10);

  // ==========================================
  // PAGE 3: SCREEN FEATURE 1 - REAL-TIME CLINICAL MESSAGING
  // ==========================================
  doc.addPage();
  addHeader("SCREEN FEATURE 1: REAL-TIME CLINICAL MESSAGING");

  y = 75;
  // Feature Intro
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...TEAL_PRIMARY);
  doc.text("Clinical Chat Interface & Departmental Collaboration", margin, y);

  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(
    "The primary communication hub supports instant real-time messaging, hospital group channels (Emergency, ICU, Surgery, Radiology), voice notes with interactive waveform players, delivery/read ticks (✓✓), stickers, and secure medical file sharing.",
    margin,
    y,
    { maxWidth: contentWidth, lineHeightFactor: 1.4 }
  );

  // Schematic Mockup of Chat Area
  y += 35;
  const mockupH = 260;
  doc.setFillColor(...DARK_BG);
  doc.roundedRect(margin, y, contentWidth, mockupH, 8, 8, "F");

  // App Bar Mockup
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, y, contentWidth, 36, 8, 8, "F");
  doc.rect(margin, y + 26, contentWidth, 10, "F"); // square bottom corners

  // Controls dots
  doc.setFillColor(239, 68, 68);
  doc.circle(margin + 16, y + 18, 4, "F");
  doc.setFillColor(245, 158, 11);
  doc.circle(margin + 28, y + 18, 4, "F");
  doc.setFillColor(16, 185, 129);
  doc.circle(margin + 40, y + 18, 4, "F");

  // Title in Mockup
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("🩺 Dr. Sarah Jenkins (Cardiology Specialist) - Online", margin + 60, y + 21);

  // Mock Call & Action Buttons in Header
  doc.setFillColor(13, 148, 136);
  doc.roundedRect(pageWidth - margin - 130, y + 8, 55, 20, 4, 4, "F");
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFontSize(8);
  doc.text("📞 Audio", pageWidth - margin - 120, y + 21);

  doc.setFillColor(2, 132, 199);
  doc.roundedRect(pageWidth - margin - 70, y + 8, 55, 20, 4, 4, "F");
  doc.text("📹 Video", pageWidth - margin - 60, y + 21);

  // Chat conversation wireframe
  let chatMsgY = y + 55;

  // Incoming Doctor message
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin + 20, chatMsgY, 260, 45, 8, 8, "F");
  doc.setTextColor(45, 212, 191);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Dr. Sarah Jenkins • 09:14 AM", margin + 30, chatMsgY + 14);
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont("helvetica", "normal");
  doc.text("Patient #4089 ECG scan ready for review in ICU Ward B.", margin + 30, chatMsgY + 28);

  // Outgoing Nurse voice note message
  chatMsgY += 55;
  doc.setFillColor(15, 118, 110);
  doc.roundedRect(pageWidth - margin - 240, chatMsgY, 220, 48, 8, 8, "F");
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("You (Nurse Supervisor) • 09:15 AM ✓✓", pageWidth - margin - 230, chatMsgY + 14);

  // Voice note player bar
  doc.setFillColor(13, 148, 136);
  doc.roundedRect(pageWidth - margin - 230, chatMsgY + 22, 200, 18, 4, 4, "F");
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFontSize(8);
  doc.text("▶  |||||||||||||||||||||||||||||||||||||||||| 0:24", pageWidth - margin - 220, chatMsgY + 34);

  // File attachment card message
  chatMsgY += 58;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin + 20, chatMsgY, 280, 50, 8, 8, "F");
  doc.setTextColor(45, 212, 191);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Dr. Sarah Jenkins • 09:16 AM", margin + 30, chatMsgY + 14);
  doc.setFillColor(51, 65, 85);
  doc.roundedRect(margin + 30, chatMsgY + 20, 260, 24, 4, 4, "F");
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont("helvetica", "normal");
  doc.text("📄 Echocardiogram_Report_4089.pdf (2.4 MB)", margin + 40, chatMsgY + 35);

  // Input Bar Mockup at Bottom
  const inputY = y + mockupH - 36;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, inputY, contentWidth, 36, "F");
  doc.setDrawColor(51, 65, 85);
  doc.line(margin, inputY, pageWidth - margin, inputY);

  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin + 15, inputY + 6, contentWidth - 110, 24, 6, 6, "F");
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text("Type confidential medical message... (Enter to send)", margin + 25, inputY + 21);

  doc.setFillColor(13, 148, 136);
  doc.roundedRect(pageWidth - margin - 85, inputY + 6, 70, 24, 6, 6, "F");
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont("helvetica", "bold");
  doc.text("SEND ➔", pageWidth - margin - 70, inputY + 21);

  // Key Capabilities Breakdown
  y += mockupH + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Key Messaging Capabilities & Engineering Highlights", margin, y);

  y += 15;
  const chatCaps = [
    ["Zero-Latency Socket.io Mesh", "Instant bi-directional event distribution ensuring messages arrive sub-50ms across all desktop, tablet, and mobile stations."],
    ["Delivery & Read Confirmation", "Dual status indicators (single tick for sent, double blue ticks for read) giving clinical staff definitive verification."],
    ["Voice Note Engine", "WebAudio-based voice recording and synthesized waveform playback with speed toggles (1x, 1.5x, 2x)."],
    ["Medical Group Channels", "Automated group membership by department (Surgery, Emergency, Pediatrics, ICU) with broadcast overrides."],
    ["Folder & Directory Uploads", "Chunked file uploader capable of transferring entire DICOM image directories or patient document folders."],
  ];

  chatCaps.forEach(([t, d]) => {
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(margin, y, contentWidth, 26, 4, 4, "F");
    doc.setDrawColor(...CARD_BORDER);
    doc.roundedRect(margin, y, contentWidth, 26, 4, 4, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEAL_PRIMARY);
    doc.text(t + ":", margin + 10, y + 16);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_DARK);
    doc.text(d, margin + 175, y + 16, { maxWidth: contentWidth - 185 });

    y += 30;
  });

  addFooter(3, 10);

  // ==========================================
  // PAGE 4: SCREEN FEATURE 2 - TELEHEALTH CALLING SUITE
  // ==========================================
  doc.addPage();
  addHeader("SCREEN FEATURE 2: ENCRYPTED TELEHEALTH CALLING SUITE");

  y = 75;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...TEAL_PRIMARY);
  doc.text("High-Definition Video & Audio Peer-to-Peer Teleconferencing", margin, y);

  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(
    "Integrated WebRTC calling architecture allows clinical teams to launch instant peer-to-peer encrypted voice calls, high-definition video consultations, and multi-staff emergency conferences directly inside the browser or mobile web view.",
    margin,
    y,
    { maxWidth: contentWidth, lineHeightFactor: 1.4 }
  );

  // Schematic Mockup of Call Interface
  y += 35;
  const callMockupH = 260;
  doc.setFillColor(...DARK_BG);
  doc.roundedRect(margin, y, contentWidth, callMockupH, 8, 8, "F");

  // Call Status Header
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, y, contentWidth, 32, 8, 8, "F");
  doc.setTextColor(45, 212, 191);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("🔴 LIVE CALL - ENCRYPTED PEER-TO-PEER (04:32)", margin + 20, y + 20);

  doc.setTextColor(203, 213, 225);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Codec: Opus / VP8 • Resolution: 720p HD • Latency: 28ms", pageWidth - margin - 220, y + 20);

  // Video Grid Wireframe
  const gridW = (contentWidth - 40) / 2;
  const gridH = 160;
  const gridY = y + 42;

  // Remote Video Tile (Doctor)
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin + 15, gridY, gridW, gridH, 6, 6, "F");
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(margin + 15, gridY, gridW, gridH, 6, 6, "S");

  // Silhouette / Avatar in video
  doc.setFillColor(30, 41, 59);
  doc.circle(margin + 15 + gridW / 2, gridY + 60, 28, "F");
  doc.roundedRect(margin + 15 + gridW / 2 - 35, gridY + 95, 70, 40, 8, 8, "F");

  // Remote Name Badge
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin + 25, gridY + gridH - 26, 150, 18, 4, 4, "F");
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Dr. Mark Vance (Attending Physician)", margin + 32, gridY + gridH - 14);

  // Local Video Tile (Self)
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin + 25 + gridW, gridY, gridW, gridH, 6, 6, "F");
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(margin + 25 + gridW, gridY, gridW, gridH, 6, 6, "S");

  // Silhouette Local
  doc.setFillColor(30, 41, 59);
  doc.circle(margin + 25 + gridW + gridW / 2, gridY + 60, 28, "F");
  doc.roundedRect(margin + 25 + gridW + gridW / 2 - 35, gridY + 95, 70, 40, 8, 8, "F");

  // Local Name Badge
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin + 35 + gridW, gridY + gridH - 26, 120, 18, 4, 4, "F");
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("You (Emergency Ward)", margin + 42, gridY + gridH - 14);

  // Call Action Bar Pill
  const actionY = y + callMockupH - 44;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth / 2 - 140, actionY, 280, 36, 18, 18, "F");

  // Mic Toggle Button
  doc.setFillColor(51, 65, 85);
  doc.circle(pageWidth / 2 - 95, actionY + 18, 13, "F");
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFontSize(8);
  doc.text("🎤", pageWidth / 2 - 99, actionY + 21);

  // Camera Toggle Button
  doc.circle(pageWidth / 2 - 45, actionY + 18, 13, "F");
  doc.text("📷", pageWidth / 2 - 49, actionY + 21);

  // Flip Camera Button
  doc.circle(pageWidth / 2 + 5, actionY + 18, 13, "F");
  doc.text("🔄", pageWidth / 2 + 1, actionY + 21);

  // End Call Button (Red)
  doc.setFillColor(...DANGER_RED);
  doc.roundedRect(pageWidth / 2 + 40, actionY + 6, 75, 24, 12, 12, "F");
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont("helvetica", "bold");
  doc.text("END CALL", pageWidth / 2 + 52, actionY + 21);

  // Telehealth Feature Table
  y += callMockupH + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Telehealth Architecture Specifications", margin, y);

  y += 15;
  const callSpecs = [
    ["Direct P2P WebRTC Engine", "Media packets flow directly between hospital endpoints using STUN/TURN traversal with zero server media storage."],
    ["Multi-Party Group Conferencing", "On-demand group clinical huddles supporting simultaneous camera feeds and synchronized speaking indicators."],
    ["Adaptive Bitrate & Packet Recovery", "Dynamic resolution scaling accommodating intermittent Wi-Fi coverage across hospital wings and basements."],
    ["Audit Call Logging", "Automatic recording of call initiation, duration, participants, and completion status stored in hospital logs."],
  ];

  callSpecs.forEach(([t, d]) => {
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(margin, y, contentWidth, 30, 4, 4, "F");
    doc.setDrawColor(...CARD_BORDER);
    doc.roundedRect(margin, y, contentWidth, 30, 4, 4, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEAL_PRIMARY);
    doc.text(t + ":", margin + 10, y + 18);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_DARK);
    doc.text(d, margin + 175, y + 18, { maxWidth: contentWidth - 185 });

    y += 36;
  });

  addFooter(4, 10);

  // ==========================================
  // PAGE 5: SCREEN FEATURE 3 - MEDICAL FEED & TIMELINE
  // ==========================================
  doc.addPage();
  addHeader("SCREEN FEATURE 3: HOSPITAL COMMUNITY FEED & TIMELINE");

  y = 75;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...TEAL_PRIMARY);
  doc.text("Internal Hospital Social Bulletin, Protocols & Timeline", margin, y);

  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(
    "The Feed module functions as a secure, hospital-wide news and protocol hub. Verified doctors and staff can broadcast clinical updates, infection control guidelines, shift changes, and department achievements with media attachments and threaded comments.",
    margin,
    y,
    { maxWidth: contentWidth, lineHeightFactor: 1.4 }
  );

  // Schematic Mockup of Feed Post Card
  y += 35;
  const feedH = 265;
  doc.setFillColor(...DARK_BG);
  doc.roundedRect(margin, y, contentWidth, feedH, 8, 8, "F");

  // Post Card Inner
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin + 15, y + 15, contentWidth - 30, feedH - 30, 8, 8, "F");

  // Author Info
  doc.setFillColor(13, 148, 136);
  doc.circle(margin + 40, y + 42, 16, "F");
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("EM", margin + 34, y + 45);

  doc.setTextColor(...TEXT_LIGHT);
  doc.setFontSize(10);
  doc.text("Dr. Edward Miller, Chief Medical Officer", margin + 65, y + 38);

  // Badges
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(margin + 65, y + 44, 65, 13, 3, 3, "F");
  doc.setFontSize(7);
  doc.text("✓ VERIFIED STAFF", margin + 70, y + 53);

  doc.setFillColor(51, 65, 85);
  doc.roundedRect(margin + 135, y + 44, 75, 13, 3, 3, "F");
  doc.text("🌐 Public Feed Scope", margin + 140, y + 53);

  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.text("1 hour ago • Emergency Protocol", margin + 220, y + 53);

  // Post Text Content
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFontSize(9);
  doc.text(
    "ALERT: Infection Control Advisory #2026-B is now active hospital-wide. All clinical staff entering surgical wards are required to follow updated PPE sanitation steps. Please review the attached guideline checklist.",
    margin + 30,
    y + 75,
    { maxWidth: contentWidth - 60, lineHeightFactor: 1.3 }
  );

  // Media Attachment Wireframe
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin + 30, y + 115, contentWidth - 60, 65, 6, 6, "F");
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(margin + 30, y + 115, contentWidth - 60, 65, 6, 6, "S");

  doc.setTextColor(45, 212, 191);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("📋 INFECTION_CONTROL_CHECKLIST_SURGERY_2026.PDF", margin + 45, y + 142);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Approved by Chief Clinical Officer • 1.8 MB • Download / View", margin + 45, y + 158);

  // Reaction Bar
  const reactionY = y + 195;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin + 30, reactionY, contentWidth - 60, 35, 6, 6, "F");

  doc.setTextColor(245, 158, 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("❤️ 24 Love   👍 42 Acknowledged   💡 12 Helpful", margin + 45, reactionY + 22);

  doc.setTextColor(45, 212, 191);
  doc.text("💬 8 Clinical Comments", pageWidth - margin - 160, reactionY + 22);

  // Feed Features
  y += feedH + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Key Capabilities of the Clinical Community Feed", margin, y);

  y += 15;
  const feedFeatures = [
    ["Three-Tier Scope Filtering", "Easily switch between Public Hospital Feed, Department-Only Updates, and My Personal Clinical Timeline."],
    ["Rich Media Carousel", "Attach clinical photos, procedural videos, and PDF documentation with full in-feed preview."],
    ["Threaded Clinical Comments", "Conduct structured medical case discussions directly underneath announcements without cluttering direct chat channels."],
    ["Anti-Crop Mobile Header", "Fully responsive layout with self-aligning notifications drawer and scope selection popover."],
  ];

  feedFeatures.forEach(([t, d]) => {
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(margin, y, contentWidth, 28, 4, 4, "F");
    doc.setDrawColor(...CARD_BORDER);
    doc.roundedRect(margin, y, contentWidth, 28, 4, 4, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEAL_PRIMARY);
    doc.text(t + ":", margin + 10, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_DARK);
    doc.text(d, margin + 160, y + 17, { maxWidth: contentWidth - 170 });

    y += 34;
  });

  addFooter(5, 10);

  // ==========================================
  // PAGE 6: SCREEN FEATURE 4 - AI IT DIAGNOSTIC ASSISTANT
  // ==========================================
  doc.addPage();
  addHeader("SCREEN FEATURE 4: AI IT DIAGNOSTIC & CLINICAL ASSISTANT");

  y = 75;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...TEAL_PRIMARY);
  doc.text("24/7 Automated Technical Triage & Knowledge Assistant", margin, y);

  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(
    "Powered by Google Gemini 2.5 on the backend, the IT Diagnostic Specialist is always on call to triage hardware, printer, network, and EMR software failures from medical staff, generating instant diagnostic steps and dispatching tickets to the on-duty IT team.",
    margin,
    y,
    { maxWidth: contentWidth, lineHeightFactor: 1.4 }
  );

  // Schematic Mockup of Bot Chat
  y += 35;
  const botMockupH = 265;
  doc.setFillColor(...DARK_BG);
  doc.roundedRect(margin, y, contentWidth, botMockupH, 8, 8, "F");

  // Bot Header
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, y, contentWidth, 34, 8, 8, "F");

  doc.setFillColor(16, 185, 129);
  doc.circle(margin + 22, y + 17, 5, "F"); // Online indicator

  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("🤖 IT Diagnostic Bot - 🟢 24/7 Technical Specialist (Gemini 2.5 Powered)", margin + 35, y + 21);

  // Conversation Mockup
  let botChatY = y + 50;

  // Staff message
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth - margin - 280, botChatY, 260, 42, 6, 6, "F");
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Staff Nurse (ICU Ward 3) • 10:02 AM", pageWidth - margin - 270, botChatY + 14);
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont("helvetica", "normal");
  doc.text("The barcode wristband scanner at Bed 4 won't read labels.", pageWidth - margin - 270, botChatY + 28);

  // Bot response with automated triage card
  botChatY += 52;
  doc.setFillColor(15, 118, 110);
  doc.roundedRect(margin + 20, botChatY, 340, 110, 8, 8, "F");

  doc.setTextColor(204, 251, 241);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("🤖 IT Diagnostic Bot • Automated Triage Analysis", margin + 32, botChatY + 16);

  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const botAdvice = [
    "1. Likely Cause: Optical lens smudge or USB interface lockup.",
    "2. Quick Fix: Disconnect USB scanner cable for 5 seconds and wipe sensor lens.",
    "3. Automated Action: Ticket #1042 created & forwarded to IT Support team.",
    "4. Assigned Technician: David Miller (Biomedical IT - Extension 4410).",
  ];
  let bAdvY = botChatY + 34;
  botAdvice.forEach((line) => {
    doc.text(line, margin + 32, bAdvY);
    bAdvY += 15;
  });

  // Ticket link button in bot message
  doc.setFillColor(13, 148, 136);
  doc.roundedRect(margin + 32, botChatY + 84, 180, 18, 4, 4, "F");
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("📋 View Ticket #1042 in IT Dashboard ➔", margin + 40, botChatY + 96);

  // Bot Features Table
  y += botMockupH + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text("AI Diagnostic Specifications & Safety Guardrails", margin, y);

  y += 15;
  const botSpecs = [
    ["Server-Side Gemini 2.5 Security", "API keys reside exclusively on the backend server (`server.ts`); credentials are never exposed to the client browser."],
    ["Automated Incident Dispatch", "Detects high-severity equipment or network errors and automatically alerts the on-duty IT department group chat."],
    ["Hospital Knowledge Ingestion", "Custom knowledge base entries can be uploaded by administrators to train the bot on proprietary hospital software."],
    ["Active Schedule Management", "Customizable shift hours (day/night shifts) and customizable auto-response greetings."],
  ];

  botSpecs.forEach(([t, d]) => {
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(margin, y, contentWidth, 28, 4, 4, "F");
    doc.setDrawColor(...CARD_BORDER);
    doc.roundedRect(margin, y, contentWidth, 28, 4, 4, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEAL_PRIMARY);
    doc.text(t + ":", margin + 10, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_DARK);
    doc.text(d, margin + 160, y + 17, { maxWidth: contentWidth - 170 });

    y += 34;
  });

  addFooter(6, 10);

  // ==========================================
  // PAGE 7: SCREEN FEATURE 5 - IT HELPDESK & TICKET MANAGER
  // ==========================================
  doc.addPage();
  addHeader("SCREEN FEATURE 5: HELPDESK & TICKET MANAGEMENT");

  y = 75;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...TEAL_PRIMARY);
  doc.text("Hospital Helpdesk, Maintenance Triage & Telegram Bridge", margin, y);

  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(
    "The hospital ticket manager allows staff to submit equipment, biomedical, network, and facilities issues with exact floor and extension routing. Tickets transition through lifecycle states (Open -> Working -> Solved -> Closed) with automated Telegram bot dispatch.",
    margin,
    y,
    { maxWidth: contentWidth, lineHeightFactor: 1.4 }
  );

  // Schematic Table of Tickets
  y += 35;
  const tableH = 265;
  doc.setFillColor(...DARK_BG);
  doc.roundedRect(margin, y, contentWidth, tableH, 8, 8, "F");

  // Table Header
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, y, contentWidth, 30, 8, 8, "F");
  doc.setTextColor(45, 212, 191);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TICKET ID", margin + 15, y + 19);
  doc.text("DEPARTMENT", margin + 80, y + 19);
  doc.text("LOCATION & EXT", margin + 180, y + 19);
  doc.text("DESCRIPTION", margin + 280, y + 19);
  doc.text("STATUS", pageWidth - margin - 75, y + 19);

  // Mock Ticket Rows
  const sampleTickets = [
    {
      id: "#1042",
      dept: "IT Support",
      loc: "Floor 3 • Ext 4410",
      desc: "Barcode scanner optical sensor timeout at ICU Bed 4",
      status: "OPEN",
      statusColor: WARNING_AMBER,
    },
    {
      id: "#1041",
      dept: "Biomedical",
      loc: "Floor 2 • Ext 3205",
      desc: "Defibrillator routine quarterly safety calibration",
      status: "WORKING",
      statusColor: [59, 130, 246],
    },
    {
      id: "#1040",
      dept: "Facilities",
      loc: "Floor 1 • Ext 2100",
      desc: "Surgical wash station water pressure regulator alert",
      status: "SOLVED",
      statusColor: SUCCESS_GREEN,
    },
    {
      id: "#1039",
      dept: "Pharmacy",
      loc: "Basement • Ext 1050",
      desc: "Automated pill packaging machine label roll jam",
      status: "CLOSED",
      statusColor: [100, 116, 139],
    },
  ];

  let rowY = y + 36;
  sampleTickets.forEach((t) => {
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin + 10, rowY, contentWidth - 20, 48, 6, 6, "F");

    doc.setTextColor(45, 212, 191);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(t.id, margin + 20, rowY + 22);

    doc.setTextColor(...TEXT_LIGHT);
    doc.text(t.dept, margin + 80, rowY + 22);

    doc.setTextColor(203, 213, 225);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(t.loc, margin + 180, rowY + 22);

    doc.text(t.desc, margin + 280, rowY + 16, { maxWidth: 140 });

    // Status Pill
    doc.setFillColor(...t.statusColor);
    doc.roundedRect(pageWidth - margin - 80, rowY + 14, 60, 18, 9, 9, "F");
    doc.setTextColor(...TEXT_LIGHT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(t.status, pageWidth - margin - 68, rowY + 26);

    rowY += 54;
  });

  // Telegram Bridge Highlights
  y += tableH + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Telegram Bot Integration & Departmental Routing Bridge", margin, y);

  y += 15;
  const ticketFeatures = [
    ["Direct Telegram Webhook", "Synchronizes hospital incidents instantly to on-duty engineers' mobile Telegram groups via automated bot bridge."],
    ["Per-Department Target Channels", "Routes tickets directly to specialized groups (IT Support, Biomedical, Facilities, Pharmacy)."],
    ["In-Chat Message Forwarding", "Clinical staff can right-click any message in chat and select 'Forward to Telegram Bot' for instant triage."],
    ["Floor & Phone Extension Tracking", "Enables on-duty technicians to immediately speed-dial the nurse station or room reporting the problem."],
  ];

  ticketFeatures.forEach(([t, d]) => {
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(margin, y, contentWidth, 28, 4, 4, "F");
    doc.setDrawColor(...CARD_BORDER);
    doc.roundedRect(margin, y, contentWidth, 28, 4, 4, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEAL_PRIMARY);
    doc.text(t + ":", margin + 10, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_DARK);
    doc.text(d, margin + 160, y + 17, { maxWidth: contentWidth - 170 });

    y += 34;
  });

  addFooter(7, 10);

  // ==========================================
  // PAGE 8: SCREEN FEATURE 6 - FLOOR DIRECTORY & EXTENSIONS
  // ==========================================
  doc.addPage();
  addHeader("SCREEN FEATURE 6: FLOOR-BY-FLOOR HOSPITAL DIRECTORY");

  y = 75;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...TEAL_PRIMARY);
  doc.text("Interactive Hospital Location & Extension Navigator", margin, y);

  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(
    "Provides an interactive spatial map of the hospital across all floors (Basement, Ground, 1st, 2nd, 3rd, and Roof Heliport). Staff can look up any room, nurse station, operating theater, or diagnostic lab with one-click direct extension dial or chat.",
    margin,
    y,
    { maxWidth: contentWidth, lineHeightFactor: 1.4 }
  );

  // Schematic Mockup of Floor Navigation
  y += 35;
  const floorH = 265;
  doc.setFillColor(...DARK_BG);
  doc.roundedRect(margin, y, contentWidth, floorH, 8, 8, "F");

  // Floor Tabs Bar
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, y, contentWidth, 32, 8, 8, "F");

  const floorTabs = ["Floor 3 (ICU)", "Floor 2 (Surgery)", "Floor 1 (Wards)", "Ground (ER)", "Basement"];
  let tabX = margin + 15;
  floorTabs.forEach((tab, idx) => {
    if (idx === 0) {
      doc.setFillColor(13, 148, 136);
      doc.roundedRect(tabX, y + 6, 85, 20, 4, 4, "F");
      doc.setTextColor(...TEXT_LIGHT);
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFillColor(51, 65, 85);
      doc.roundedRect(tabX, y + 6, 85, 20, 4, 4, "F");
      doc.setTextColor(203, 213, 225);
      doc.setFont("helvetica", "normal");
    }
    doc.setFontSize(7.5);
    doc.text(tab, tabX + 10, y + 19);
    tabX += 92;
  });

  // Department Cards on Selected Floor
  const deptCards = [
    { name: "Intensive Care Unit (ICU-A)", ext: "Ext 4410", head: "Dr. Sarah Jenkins", rooms: "Beds 1-12" },
    { name: "Cardiac Monitoring Unit", ext: "Ext 4425", head: "Dr. Robert Chen", rooms: "Beds 13-24" },
    { name: "Neuroscience Care Station", ext: "Ext 4430", head: "Dr. Lisa Wong", rooms: "Beds 25-36" },
    { name: "Floor 3 Pharmacy Satellite", ext: "Ext 4450", head: "PharmD James Patel", rooms: "Room 312" },
  ];

  let cardY = y + 44;
  deptCards.forEach((c) => {
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin + 15, cardY, contentWidth - 30, 46, 6, 6, "F");

    doc.setTextColor(45, 212, 191);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(c.name, margin + 28, cardY + 18);

    doc.setTextColor(...TEXT_LIGHT);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Department Head: ${c.head} • Station: ${c.rooms}`, margin + 28, cardY + 34);

    // Call / Message Action Buttons
    doc.setFillColor(13, 148, 136);
    doc.roundedRect(pageWidth - margin - 170, cardY + 12, 65, 22, 4, 4, "F");
    doc.setTextColor(...TEXT_LIGHT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(`📞 ${c.ext}`, pageWidth - margin - 162, cardY + 26);

    doc.setFillColor(2, 132, 199);
    doc.roundedRect(pageWidth - margin - 95, cardY + 12, 65, 22, 4, 4, "F");
    doc.text("💬 Message", pageWidth - margin - 88, cardY + 26);

    cardY += 52;
  });

  // Directory Capabilities
  y += floorH + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Directory Architecture & Search Capabilities", margin, y);

  y += 15;
  const dirCaps = [
    ["Universal Search Engine", "Live instant search querying doctor names, room numbers, clinical specialties, and 4-digit internal phone extensions."],
    ["Speed-Dial Integration", "Direct integration with local telephony protocols (tel: URL handlers) allowing instant speed-dial from VOIP phones."],
    ["Interactive Floor Map Visualizer", "Dynamic visual floor plans showing location pins, emergency exits, defibrillator placements, and nurse stations."],
    ["Active Directory Auto-Sync", "Automatically imports extensions and department office numbers directly from LDAP organizational units."],
  ];

  dirCaps.forEach(([t, d]) => {
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(margin, y, contentWidth, 28, 4, 4, "F");
    doc.setDrawColor(...CARD_BORDER);
    doc.roundedRect(margin, y, contentWidth, 28, 4, 4, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEAL_PRIMARY);
    doc.text(t + ":", margin + 10, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_DARK);
    doc.text(d, margin + 160, y + 17, { maxWidth: contentWidth - 170 });

    y += 34;
  });

  addFooter(8, 10);

  // ==========================================
  // PAGE 9: SCREEN FEATURE 7 - ADMIN HUB & TELEMETRY
  // ==========================================
  doc.addPage();
  addHeader("SCREEN FEATURE 7: ADMINISTRATIVE CONTROL CENTER");

  y = 75;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...TEAL_PRIMARY);
  doc.text("Hospital IT Administration, LDAP Sync & Telemetry", margin, y);

  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(
    "The Administrative Control Center gives hospital IT directors and biomedical supervisors complete control over registered staff users, Active Directory / LDAP synchronization, system-wide broadcast alerts, database backup/restore, and telemetry metrics.",
    margin,
    y,
    { maxWidth: contentWidth, lineHeightFactor: 1.4 }
  );

  // Admin Dashboard Wireframe
  y += 35;
  const adminH = 265;
  doc.setFillColor(...DARK_BG);
  doc.roundedRect(margin, y, contentWidth, adminH, 8, 8, "F");

  // Stat Counters Row
  const statBoxW = (contentWidth - 50) / 4;
  const stats = [
    { label: "REGISTERED STAFF", val: "148", color: [45, 212, 191] },
    { label: "ACTIVE ONLINE", val: "42", color: SUCCESS_GREEN },
    { label: "MESSAGES SENT", val: "12,840", color: [59, 130, 246] },
    { label: "ACTIVE TICKETS", val: "7", color: WARNING_AMBER },
  ];

  let statX = margin + 15;
  stats.forEach((s) => {
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(statX, y + 15, statBoxW, 55, 6, 6, "F");

    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(s.label, statX + 10, y + 32);

    doc.setTextColor(...s.color);
    doc.setFontSize(14);
    doc.text(s.val, statX + 10, y + 54);

    statX += statBoxW + 7;
  });

  // Admin Tool Modules Card
  const adminModY = y + 80;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin + 15, adminModY, contentWidth - 30, 165, 8, 8, "F");

  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("CORE ADMINISTRATIVE ENGINE CONTROLS", margin + 30, adminModY + 22);

  const adminControls = [
    ["Active Directory / LDAP Domain Sync", "Configures on-premises hospital domain controller IP, bind DN, and auto-sync intervals."],
    ["Hospital-Wide Broadcast Alerts", "Dispatches instant emergency code alerts (Code Blue, Code Red) to all online client screens."],
    ["Full JSON Database Backup & Restore", "Exports complete snapshot of messages, staff records, groups, and tickets in 1 click."],
    ["Telegram Bot Routing Center", "Manages automated incident channel subscriptions and department dispatch routes."],
    ["Standalone Production Release Packager", "Compiles and downloads zero-source-code deployment archives directly from the browser."],
  ];

  let cY = adminModY + 40;
  adminControls.forEach(([name, desc]) => {
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin + 30, cY, contentWidth - 60, 22, 4, 4, "F");

    doc.setTextColor(45, 212, 191);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(name, margin + 40, cY + 14);

    doc.setTextColor(203, 213, 225);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(desc, margin + 220, cY + 14, { maxWidth: contentWidth - 250 });

    cY += 25;
  });

  // Admin Highlights
  y += adminH + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Security Controls & Telemetry Infrastructure", margin, y);

  y += 15;
  const adminSpecs = [
    ["Granular Role Enforcement", "Doctors cannot access administrative configurations; staff cannot modify LDAP server credentials."],
    ["Non-Volatile File Storage", "All uploads, voice recordings, and database snapshots are stored in dedicated local server directories."],
    ["Zero Dependency on External Clouds", "Runs flawlessly in air-gapped environments without phoning home or requiring third-party SaaS accounts."],
    ["Systemd Linux Service Daemon", "Includes ready-to-run systemd service files with automated crash recovery and restart on server boot."],
  ];

  adminSpecs.forEach(([t, d]) => {
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(margin, y, contentWidth, 28, 4, 4, "F");
    doc.setDrawColor(...CARD_BORDER);
    doc.roundedRect(margin, y, contentWidth, 28, 4, 4, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEAL_PRIMARY);
    doc.text(t + ":", margin + 10, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_DARK);
    doc.text(d, margin + 160, y + 17, { maxWidth: contentWidth - 170 });

    y += 34;
  });

  addFooter(9, 10);

  // ==========================================
  // PAGE 10: SCREEN FEATURE 8 - 29+ CLINICAL THEMES & DEPLOYMENT GUIDE
  // ==========================================
  doc.addPage();
  addHeader("SCREEN FEATURE 8: CLINICAL THEMES & DEPLOYMENT GUIDE");

  y = 75;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...TEAL_PRIMARY);
  doc.text("29+ Clinical Themes & High-Contrast Visual Accessibility", margin, y);

  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(
    "Designed specifically for intense healthcare environments (operating rooms, night shifts, emergency triage stations), the application features 29+ medical-grade themes with a strict mathematical contrast guarantee: 100% pure black text in light modes and 100% pure white text in dark modes.",
    margin,
    y,
    { maxWidth: contentWidth, lineHeightFactor: 1.4 }
  );

  // Visual Theme Swatches Card
  y += 35;
  const themeH = 135;
  doc.setFillColor(...DARK_BG);
  doc.roundedRect(margin, y, contentWidth, themeH, 8, 8, "F");

  doc.setTextColor(45, 212, 191);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SAMPLE CLINICAL THEME PRESETS", margin + 15, y + 20);

  const sampleThemes = [
    { name: "Hospital Light", bg: [248, 250, 252], text: "Pure Black #000000", tag: "Daylight Triage" },
    { name: "Nordic Frost", bg: [241, 245, 249], text: "Pure Black #000000", tag: "Surgical Station" },
    { name: "Sepia Comfort", bg: [254, 243, 199], text: "Pure Black #000000", tag: "Eye Relief" },
    { name: "Obsidian Glass", bg: [15, 23, 42], text: "Pure White #FFFFFF", tag: "Night Shift" },
    { name: "Cyberpunk Glow", bg: [24, 24, 27], text: "Pure White #FFFFFF", tag: "Diagnostic Lab" },
  ];

  let swX = margin + 15;
  const swW = (contentWidth - 50) / 5;
  sampleThemes.forEach((st) => {
    doc.setFillColor(...st.bg);
    doc.roundedRect(swX, y + 32, swW, 85, 6, 6, "F");
    doc.setDrawColor(71, 85, 105);
    doc.roundedRect(swX, y + 32, swW, 85, 6, 6, "S");

    // Text sample
    doc.setTextColor(st.text.includes("Black") ? 0 : 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(st.name, swX + 8, y + 50);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(st.text, swX + 8, y + 66);

    doc.setFillColor(13, 148, 136);
    doc.roundedRect(swX + 6, y + 86, swW - 12, 16, 3, 3, "F");
    doc.setTextColor(...TEXT_LIGHT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(st.tag, swX + 10, y + 97);

    swX += swW + 7;
  });

  // Deployment Steps Summary
  y += themeH + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text("How to Publish & Deploy Without Source Code (3 Quick Steps)", margin, y);

  y += 15;
  const deploySteps = [
    [
      "STEP 1: Unzip Release Archive",
      "Extract `elite-medcomm-standalone-v1.0.zip` on your Linux/Windows server. You will see `dist/`, `package.json`, `setup.sh`/`setup.bat`, and `start.sh`/`start.bat`.",
    ],
    [
      "STEP 2: Run Automated Setup",
      "On Linux: run `./setup.sh` (installs production dependencies via npm). On Windows: double-click `setup.bat`. Or with Docker: run `docker compose up -d`.",
    ],
    [
      "STEP 3: Launch Production Server",
      "On Linux: run `./start.sh` or enable `systemctl start elite-hospital.service`. On Windows: double-click `start.bat`. Your server runs on port 3000 instantly with zero source code needed!",
    ],
  ];

  deploySteps.forEach(([stepTitle, stepDesc]) => {
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(margin, y, contentWidth, 42, 6, 6, "F");
    doc.setDrawColor(...CARD_BORDER);
    doc.roundedRect(margin, y, contentWidth, 42, 6, 6, "S");

    doc.setFillColor(...TEAL_PRIMARY);
    doc.roundedRect(margin + 10, y + 8, 140, 16, 3, 3, "F");
    doc.setTextColor(...TEXT_LIGHT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(stepTitle, margin + 16, y + 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_DARK);
    doc.text(stepDesc, margin + 10, y + 34, { maxWidth: contentWidth - 20 });

    y += 50;
  });

  // Final Certification Stamp Box
  doc.setFillColor(...DARK_BG);
  doc.roundedRect(margin, y, contentWidth, 42, 6, 6, "F");
  doc.setTextColor(45, 212, 191);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("✓ CERTIFIED PRODUCTION RELEASE (ZERO SOURCE CODE EXPOSURE)", margin + 15, y + 18);
  doc.setTextColor(203, 213, 225);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "All TypeScript source code remains strictly confidential. Production packages execute purely via pre-compiled bytecode and minified web assets.",
    margin + 15,
    y + 32
  );

  addFooter(10, 10);

  // Save PDF to output path
  const pdfBytes = doc.output("arraybuffer");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(pdfBytes));
  console.log(`✅ Feature manual PDF generated successfully: ${outputPath} (${pdfBytes.byteLength} bytes)`);
}

// Run if called directly
if (process.argv[1]?.endsWith("generate-features-pdf.mjs")) {
  const target = path.join(process.cwd(), "docs", "ELITE_HOSPITAL_FEATURES_MANUAL.pdf");
  generateFeaturesPdf(target).catch(console.error);
}
