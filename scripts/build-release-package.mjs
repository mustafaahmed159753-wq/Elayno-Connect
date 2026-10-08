import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import archiverModule from "archiver";
import { generateFeaturesPdf } from "./generate-features-pdf.mjs";

function createZipArchive(options = { zlib: { level: 9 } }) {
  const archiverFn = archiverModule?.default || archiverModule;
  if (typeof archiverFn === "function") {
    return archiverFn("zip", options);
  }
  if (archiverFn?.ZipArchive) {
    return new archiverFn.ZipArchive(options);
  }
  if (archiverFn?.Archiver) {
    return new archiverFn.Archiver("zip", options);
  }
  throw new Error("Unable to create zip archive");
}

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, "dist");
const RELEASE_DIR = path.join(ROOT_DIR, "release");
const APP_RELEASE_DIR = path.join(RELEASE_DIR, "elite-hospital-app");
const ZIP_OUTPUT_PATH = path.join(RELEASE_DIR, "elite-hospital-app-standalone-v1.0.zip");
const DOCS_DIR = path.join(ROOT_DIR, "docs");
const PDF_PATH = path.join(DOCS_DIR, "ELITE_HOSPITAL_FEATURES_MANUAL.pdf");

console.log("\n=======================================================");
console.log(" 🏥 ELITE HOSPITAL NETWORK - STANDALONE RELEASE BUILDER");
console.log("=======================================================\n");

// Step 1: Ensure PDF is generated
console.log("📄 Step 1: Generating Real-Screen Features PDF Manual...");
fs.mkdirSync(DOCS_DIR, { recursive: true });
await generateFeaturesPdf(PDF_PATH);

// Step 2: Build production frontend & server bundle
console.log("\n🔨 Step 2: Compiling Production Binaries & Web Assets...");
console.log("Executing: npm run build (Vite + ESBuild)");
execSync("npm run build", { stdio: "inherit", cwd: ROOT_DIR });

// Verify dist/server.cjs exists
if (!fs.existsSync(path.join(DIST_DIR, "server.cjs"))) {
  throw new Error("Compilation failed: dist/server.cjs was not found!");
}
if (!fs.existsSync(path.join(DIST_DIR, "index.html"))) {
  throw new Error("Compilation failed: dist/index.html was not found!");
}

// Step 3: Clean and prepare release directory
console.log("\n📦 Step 3: Preparing Source-Code-Free Release Bundle...");
if (fs.existsSync(APP_RELEASE_DIR)) {
  fs.rmSync(APP_RELEASE_DIR, { recursive: true, force: true });
}
fs.mkdirSync(APP_RELEASE_DIR, { recursive: true });
fs.mkdirSync(path.join(APP_RELEASE_DIR, "docs"), { recursive: true });
fs.mkdirSync(path.join(APP_RELEASE_DIR, "data"), { recursive: true });
fs.mkdirSync(path.join(APP_RELEASE_DIR, "user_images"), { recursive: true });
fs.mkdirSync(path.join(APP_RELEASE_DIR, "shared_files"), { recursive: true });

// Copy compiled dist directory (NO source files)
console.log(" -> Copying compiled dist/ directory (No source code included)...");
fs.cpSync(DIST_DIR, path.join(APP_RELEASE_DIR, "dist"), { recursive: true });

// Copy seed database and directory data if present
if (fs.existsSync(path.join(ROOT_DIR, "data", "db.json"))) {
  console.log(" -> Copying initial seed database (data/db.json)...");
  fs.copyFileSync(path.join(ROOT_DIR, "data", "db.json"), path.join(APP_RELEASE_DIR, "data", "db.json"));
}
if (fs.existsSync(path.join(ROOT_DIR, "data", "hospital_phone_directory.json"))) {
  fs.copyFileSync(path.join(ROOT_DIR, "data", "hospital_phone_directory.json"), path.join(APP_RELEASE_DIR, "data", "hospital_phone_directory.json"));
}

// Copy the PDF manual into the release package
console.log(" -> Copying Screen Features Manual PDF...");
fs.copyFileSync(PDF_PATH, path.join(APP_RELEASE_DIR, "docs", "ELITE_HOSPITAL_FEATURES_MANUAL.pdf"));

// Create a clean, production-only package.json (NO devDependencies, NO typescript, NO vite)
console.log(" -> Generating clean production package.json...");
const prodPackageJson = {
  name: "elyano-connect-production",
  version: "1.0.0",
  private: true,
  description: "Elyano Connect - Elite Hospital Network & Clinical Messaging System (Standalone Production Release)",
  main: "dist/server.cjs",
  scripts: {
    setup: "./setup.sh",
    start: "node dist/server.cjs",
    "start:https": "cross-env USE_HTTPS=true node dist/server.cjs",
  },
  dependencies: {
    "@google/genai": "^2.4.0",
    archiver: "^8.0.0",
    "cross-env": "^10.1.0",
    dotenv: "^17.2.3",
    express: "^4.21.2",
    ldapts: "^9.0.0",
    selfsigned: "^5.5.0",
    "socket.io": "^4.8.3",
  },
  engines: {
    node: ">=18.0.0",
  },
};

fs.writeFileSync(
  path.join(APP_RELEASE_DIR, "package.json"),
  JSON.stringify(prodPackageJson, null, 2),
  "utf-8"
);

// Create .env.example and default .env
console.log(" -> Generating environment configuration templates...");
const envContent = `# ====================================================================
# ELYANO CONNECT - ELITE HOSPITAL NETWORK PRODUCTION CONFIGURATION
# ====================================================================

# Port for HTTP/HTTPS web application and WebSockets (Default: 3000)
PORT=3000

# Node Environment (Must be set to production)
NODE_ENV=production

# HTTPS / SSL Mode (true = generates or uses SSL certificates in key.pem and cert.pem)
USE_HTTPS=false

# Google Gemini API Key for 24/7 Clinical & IT Diagnostics Bot (Optional)
# Obtain from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=

# Active Directory / LDAP Server (Optional - Can also be configured in Admin UI)
# LDAP_URL=ldap://192.168.1.10:389
# LDAP_BIND_DN=CN=Administrator,CN=Users,DC=hospital,DC=local
# LDAP_BIND_PASSWORD=YourPassword
# LDAP_BASE_DN=DC=hospital,DC=local

# Telegram Bot Token for automated incident dispatch (Optional)
TELEGRAM_BOT_TOKEN=8405619013:AAHDaAS2p-sdsbxaf4U_gLRgXuXZV1FJpxQ
`;

fs.writeFileSync(path.join(APP_RELEASE_DIR, ".env.example"), envContent, "utf-8");
fs.writeFileSync(path.join(APP_RELEASE_DIR, ".env"), envContent, "utf-8");

// Create setup.sh for Linux / macOS
console.log(" -> Creating Linux / macOS setup script (setup.sh)...");
const setupShContent = `#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " 🏥 ELYANO CONNECT - AUTOMATED PRODUCTION ENVIRONMENT SETUP"
echo "=========================================================="

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or 20+ first."
    echo "   Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

NODE_VER=$(node -v)
echo "✓ Node.js detected: $NODE_VER"

# Create required runtime storage folders
mkdir -p data user_images shared_files temp_directory_uploads docs

# Install production dependencies only
echo "📦 Installing production dependencies (zero build tools required)..."
npm install --omit=dev --no-audit --no-fund

echo ""
echo "=========================================================="
echo " ✅ SETUP COMPLETE!"
echo " To start Elyano Connect, run:"
echo "     ./start.sh"
echo " Or run in background via systemd service."
echo "=========================================================="
`;
fs.writeFileSync(path.join(APP_RELEASE_DIR, "setup.sh"), setupShContent, { mode: 0o755 });

// Create start.sh for Linux / macOS
console.log(" -> Creating Linux / macOS launcher script (start.sh)...");
const startShContent = `#!/usr/bin/env bash
export NODE_ENV=production
export PORT=\${PORT:-3000}

echo "🚀 Starting Elyano Connect Hospital Network on port $PORT..."
node dist/server.cjs
`;
fs.writeFileSync(path.join(APP_RELEASE_DIR, "start.sh"), startShContent, { mode: 0o755 });

// Create setup.bat for Windows
console.log(" -> Creating Windows setup script (setup.bat)...");
const setupBatContent = `@echo off
echo ==========================================================
echo  ELYANO CONNECT - AUTOMATED WINDOWS SETUP
echo ==========================================================

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 18 or 20 from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detected.
if not exist "data" mkdir "data"
if not exist "user_images" mkdir "user_images"
if not exist "shared_files" mkdir "shared_files"
if not exist "temp_directory_uploads" mkdir "temp_directory_uploads"

echo Installing production dependencies...
call npm install --omit=dev --no-audit --no-fund

echo.
echo ==========================================================
echo  SETUP COMPLETE!
echo  Double-click start.bat to launch Elyano Connect!
echo ==========================================================
pause
`;
fs.writeFileSync(path.join(APP_RELEASE_DIR, "setup.bat"), setupBatContent);

// Create start.bat for Windows
console.log(" -> Creating Windows launcher script (start.bat)...");
const startBatContent = `@echo off
title Elyano Connect - Hospital Network Production Server
set NODE_ENV=production
if not defined PORT set PORT=3000

echo Starting Elyano Connect on port %PORT%...
node dist/server.cjs
pause
`;
fs.writeFileSync(path.join(APP_RELEASE_DIR, "start.bat"), startBatContent);

// Create Dockerfile
console.log(" -> Creating Dockerfile...");
const dockerfileContent = `# Standalone Production Container for Elyano Connect
FROM node:20-alpine

WORKDIR /app

# Copy production package definition and install dependencies
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy compiled application assets and configuration
COPY dist ./dist
COPY docs ./docs
COPY .env.example ./.env

# Create persistent storage volumes
RUN mkdir -p data user_images shared_files temp_directory_uploads

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/server.cjs"]
`;
fs.writeFileSync(path.join(APP_RELEASE_DIR, "Dockerfile"), dockerfileContent);

// Create docker-compose.yml
console.log(" -> Creating docker-compose.yml...");
const dockerComposeContent = `version: '3.8'

services:
  elyano-connect:
    build: .
    container_name: elyano_hospital_network
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - USE_HTTPS=false
      # - GEMINI_API_KEY=your_key_here
    volumes:
      - ./data:/app/data
      - ./user_images:/app/user_images
      - ./shared_files:/app/shared_files
`;
fs.writeFileSync(path.join(APP_RELEASE_DIR, "docker-compose.yml"), dockerComposeContent);

// Create systemd service unit file
console.log(" -> Creating systemd service file (elite-hospital.service)...");
const systemdContent = `[Unit]
Description=Elyano Connect - Elite Hospital Network & Clinical Communication Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/elyano-connect
ExecStart=/usr/bin/node dist/server.cjs
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
`;
fs.writeFileSync(path.join(APP_RELEASE_DIR, "elite-hospital.service"), systemdContent);

// Create RELEASE_DEPLOYMENT_GUIDE.md
console.log(" -> Creating comprehensive RELEASE_DEPLOYMENT_GUIDE.md...");
const deployGuideContent = `# 🏥 ELYANO CONNECT - STANDALONE PRODUCTION RELEASE & DEPLOYMENT GUIDE

Welcome to the official standalone production release of **Elyano Connect (Elite Hospital Network)**.

This release package is **100% self-contained and pre-compiled**. It contains all compiled server binaries (\`dist/server.cjs\`) and web client bundles (\`dist/assets/*\`). **Zero TypeScript source files or React source code are included**, enabling you to publish, distribute, host, and run the complete hospital communication platform securely without exposing your intellectual property or proprietary code.

---

## 📋 RELEASE PACKAGE CONTENTS

\`\`\`
elite-hospital-app/
├── dist/                              # Pre-compiled application (server.cjs + web assets)
│   ├── server.cjs                     # Bundled Node.js backend server (Express + Socket.io)
│   ├── index.html                     # Minified web application entry point
│   └── assets/                        # Minified JavaScript & CSS bundles (No source code!)
├── docs/
│   └── ELITE_HOSPITAL_FEATURES_MANUAL.pdf # Official 10-Page Screen Features Manual
├── package.json                       # Production-only dependencies manifest
├── .env.example                       # Environment variables template
├── .env                               # Active environment configuration
├── setup.sh                           # One-command installer for Linux / macOS
├── start.sh                           # One-command launcher for Linux / macOS
├── setup.bat                          # One-click installer for Windows Server / PC
├── start.bat                          # One-click launcher for Windows Server / PC
├── Dockerfile                         # Container configuration
├── docker-compose.yml                 # Single-command container deployment
├── elite-hospital.service             # Systemd background daemon for Linux
├── RELEASE_DEPLOYMENT_GUIDE.md        # This guide
└── README.md                          # Quick start instructions
\`\`\`

---

## ⚡ QUICK START OPTIONS

### Option 1: Linux / Ubuntu / Debian VPS Deployment (Recommended)

1. **Upload and extract the release package**:
   \`\`\`bash
   unzip elite-hospital-app-standalone-v1.0.zip
   cd elite-hospital-app
   \`\`\`

2. **Run automated setup**:
   \`\`\`bash
   chmod +x setup.sh start.sh
   ./setup.sh
   \`\`\`

3. **Launch the server**:
   \`\`\`bash
   ./start.sh
   \`\`\`
   The app will start instantly on \`http://your-server-ip:3000\`.

4. *(Optional)* **Run 24/7 as a System Service (systemd)**:
   \`\`\`bash
   sudo cp elite-hospital.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable elite-hospital
   sudo systemctl start elite-hospital
   sudo systemctl status elite-hospital
   \`\`\`

---

### Option 2: Docker / Container Deployment

Deploy in 1 command without installing any Node.js dependencies on the host machine:

\`\`\`bash
docker compose up -d
\`\`\`

To view container logs:
\`\`\`bash
docker logs -f elyano_hospital_network
\`\`\`

---

### Option 3: Windows Server / PC Deployment

1. Unzip \`elite-hospital-app-standalone-v1.0.zip\` on your Windows machine.
2. Double-click **\`setup.bat\`** to install production dependencies.
3. Double-click **\`start.bat\`** to start the hospital platform.
4. Open your browser to \`http://localhost:3000\` or your internal hospital LAN IP.

---

## 🔒 SECURITY & ENTERPRISE CONFIGURATION

### Enabling HTTPS / SSL
1. In \`.env\`, set:
   \`\`\`env
   USE_HTTPS=true
   \`\`\`
2. Place your official hospital SSL certificate as \`cert.pem\` and private key as \`key.pem\` in the root directory.
3. If no certificates are placed, the server automatically generates secure self-signed credentials.

### Active Directory / LDAP Integration
Configure your hospital domain controller under the **Admin Panel -> AD / LDAP Domain** or via \`.env\`:
- **LDAP URL**: \`ldap://192.168.1.10:389\`
- **Bind DN**: \`CN=Administrator,CN=Users,DC=hospital,DC=local\`
- **Base DN**: \`DC=hospital,DC=local\`

### AI Clinical & IT Diagnostic Bot
To enable automated 24/7 equipment and IT troubleshooting, generate a free or enterprise API key from Google AI Studio and place it in \`.env\`:
\`\`\`env
GEMINI_API_KEY=AIzaSy...
\`\`\`

---

## 📄 REAL-SCREEN FEATURES PDF DOCUMENTATION
The official 10-page Screen Features Manual is included inside the package at:
\`\`\`
docs/ELITE_HOSPITAL_FEATURES_MANUAL.pdf
\`\`\`
It contains complete visual architectural mockups and feature breakdowns for clinical chat, video calling, emergency feeds, IT helpdesk, floor directory, and administrative controls.
`;

fs.writeFileSync(path.join(APP_RELEASE_DIR, "RELEASE_DEPLOYMENT_GUIDE.md"), deployGuideContent);
fs.writeFileSync(path.join(APP_RELEASE_DIR, "README.md"), deployGuideContent);

// Step 4: Create the final Zip distribution file
console.log("\n🤐 Step 4: Compressing Standalone Release ZIP Archive...");
const output = fs.createWriteStream(ZIP_OUTPUT_PATH);
const archive = createZipArchive({ zlib: { level: 9 } });

await new Promise((resolve, reject) => {
  output.on("close", () => {
    console.log(`✓ Standalone zip created: ${ZIP_OUTPUT_PATH}`);
    console.log(`  Total file size: ${(archive.pointer() / (1024 * 1024)).toFixed(2)} MB`);
    resolve(null);
  });
  archive.on("error", (err) => reject(err));
  archive.pipe(output);
  archive.directory(APP_RELEASE_DIR, "elite-hospital-app");
  archive.finalize();
});

console.log("\n=======================================================");
console.log(" 🎉 RELEASE PACKAGING COMPLETED SUCCESSFULLY!");
console.log(` Distribution archive: ${ZIP_OUTPUT_PATH}`);
console.log(` Real-Screen Features PDF: ${PDF_PATH}`);
console.log(" Ready for publishing & distribution without source code!");
console.log("=======================================================\n");
