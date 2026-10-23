# 🚀 NumRush - Competitive Multiplayer Number Hunt

[![Build & Test Status](https://img.shields.io/badge/tests-10%2F10%20passing-brightgreen)](#automated-testing)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Android%20APK-blue)](#android-apk)
[![Backend](https://img.shields.io/badge/server-Node.js%20%7C%20Socket.IO-purple)](#architecture)
[![Frontend](https://img.shields.io/badge/client-React%2019%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Tailwind-cyan)](#technology-stack)

**NumRush** is a real-time, server-authoritative multiplayer number-finding and visual-memory competition. Players enter a shared room and race to identify sequential numbers in a large, randomly shuffled grid.

- **Cross-Platform**: Runs as a responsive website and an installable native Android APK.
- **Real-Time Multiplayer**: Multiple players compete in the same room with sub-millisecond race condition handling.
- **Server-Authoritative Game Engine**: Atomic serialized claim operations guarantee exactly one winner per target with zero client-side cheating.
- **Visual Memory Mechanics**: Players memorize upcoming number coordinates while hunting for the active target.

---

## 📸 Core Features

- **Gaming Dashboard**: Dark cyberpunk aesthetic, neon cyan and purple accents, glassmorphic panels, and sound toggle.
- **Flexible Room Creation**:
  - Number ranges: 1–50, 1–100, 1–150 (standard), 1–200, 1–300, or Custom (up to 500).
  - Game Modes: *Time Challenge* (1m, 3m, 5m, 10m) and *Complete the Grid*.
  - Capacity: 2 to 10 players, private/public lobbies, optional passwords, wrong-click penalties.
- **Interactive Number Grid**:
  - Zoom in, Zoom out, 100% reset, fullscreen view, touch-optimized responsive layout.
  - Visual states: *Available*, *Active Target Beacon*, *Claimed by Winner with Initials*, *Wrong Click Shake*.
  - Sticky target indicator: target stays visible even while scrolling large grids.
- **Live Leaderboard & Statistics**:
  - Real-time score updates, ranks, player color swatches, accuracy percentages, and connection indicators.
- **Session Recovery & Reconnection**:
  - Preserves session tokens in local storage.
  - 60-second grace period with full state snapshot restoration (`game:stateSnapshot`).
  - Active session banner on the home screen allows 1-click resumption.
- **Audio Synthesizer Engine**:
  - Web Audio API synthesizer for countdown ticks, chime claims, error thuds, and victory fanfare.
- **Solo Practice Mode**:
  - Offline / local training with difficulty presets without altering multiplayer statistics.
- **Verified Android APK**:
  - Precompiled debug APK included at `NumRush-debug.apk` ready for Android installation.

---

## 🛠 Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js, Express, Socket.IO, TypeScript |
| **Database** | PostgreSQL / Supabase with Row Level Security, local resilient memory store |
| **Mobile** | Capacitor Android (`@capacitor/core`, `@capacitor/android`, `@capacitor/status-bar`) |
| **Testing** | Vitest, Supertest, Socket.IO Client |

---

## 📂 Project Structure

```
d:\Projects\NumHunt\
├── NumRush-debug.apk           # Verified compiled Android APK (~4.28 MB)
├── client/                     # React + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/         # UI Components (Header, Grid, Tile, Lobby, Leaderboard, Results...)
│   │   ├── services/           # Socket.IO client, Web Audio sound manager, REST API
│   │   ├── types/              # Client type definitions
│   │   ├── App.tsx             # Root application orchestrator
│   │   └── index.css           # Custom gaming theme & Tailwind directives
│   ├── android/                # Capacitor Android Native Project (Gradle, AndroidManifest)
│   ├── capacitor.config.ts     # Capacitor configuration
│   └── package.json
├── server/                     # Node.js + Express + Socket.IO Backend
│   ├── src/
│   │   ├── config/             # Config & environment parsing
│   │   ├── db/                 # Database service & Supabase connector
│   │   ├── game/               # GridGenerator, GameRules, RoomManager, Serialized Queue
│   │   ├── sockets/            # Socket.IO event controllers & handlers
│   │   └── index.ts            # Server entrypoint & REST endpoints
│   ├── migrations/             # 001_initial_schema.sql (Postgres/Supabase schema & RLS)
│   ├── tests/                  # Automated unit and integration tests
│   └── package.json
├── docs/                       # Technical Documentation
│   ├── ARCHITECTURE.md         # System design & concurrency mechanics
│   ├── DATABASE_SCHEMA.md      # PostgreSQL / Supabase schema & RLS
│   ├── REALTIME_CONTRACT.md    # Socket.IO protocol specification
│   ├── ANDROID_APK_GUIDE.md    # APK installation & build guide
│   └── DEPLOYMENT_GUIDE.md     # Production deployment instructions
├── package.json                # Root package with monorepo scripts
└── README.md
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** v9+
- *(Optional for Android builds)*: Java 17+ or 21 and Android SDK

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/NumRush.git
cd NumHunt

# Install all dependencies (server and client)
npm run install:all
```

### 3. Running in Development
Start both the game server (port 3001) and the web app (port 5173):

```bash
# Terminal 1: Start Backend Server
cd server
npm run dev

# Terminal 2: Start Web Client
cd client
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 🧪 Automated Testing

Run the test suite verifying Fisher-Yates shuffling, range constraints, claim validation, and simultaneous 4-player concurrency race conditions:

```bash
cd server
npm test
```

### Test Results:
```
 ✓ tests/gameRules.test.ts (6 tests)
 ✓ tests/multiplayer.test.ts (4 tests)

 Test Files  2 passed (2)
      Tests  10 passed (10)
   Duration  672ms
```
- **Simultaneous Race Condition Verification**: 4 players clicking target 1 simultaneously results in **exactly 1 winner**, **exactly 1 point**, and the target advancing to 2 **once**.

---

## 📱 Android APK Installation

The installable Android APK is precompiled and ready in the project root:
- **File**: `NumRush-debug.apk`
- Sideload directly to an Android phone, or install via ADB:
  ```bash
  adb install -r NumRush-debug.apk
  ```

To rebuild the APK from source at any time:
```bash
npm run android:sync
npm run android:apk
```

---

## 📖 Documentation Links

- [System Architecture](docs/ARCHITECTURE.md)
- [Database Schema & Migrations](docs/DATABASE_SCHEMA.md)
- [Real-Time Socket Event Contract](docs/REALTIME_CONTRACT.md)
- [Android APK Build & Deployment](docs/ANDROID_APK_GUIDE.md)
- [Production Cloud Deployment](docs/DEPLOYMENT_GUIDE.md)
