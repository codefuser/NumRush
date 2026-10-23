# NumRush - System Architecture

NumRush is a high-performance, real-time multiplayer number-finding and visual-memory game built across web and mobile platforms.

```
                      ┌───────────────────────────────────────┐
                      │              CLIENT TIER              │
                      │  React 19 + TypeScript + TailwindCSS  │
                      │       Vite + Web Audio Engine         │
                      └───────▲───────────────────────▲───────┘
                              │                       │
                     Web Browser                     Android APK
                    (Desktop/Tablet)             (Capacitor Android)
                              │                       │
                              └───────────┬───────────┘
                                          │
                             WebSocket / Socket.IO
                             REST HTTP (Port 3001)
                                          │
                      ┌───────────────────▼───────────────────┐
                      │             BACKEND TIER              │
                      │    Node.js + Express + Socket.IO      │
                      │   Server-Authoritative Game Engine    │
                      └───────┬───────────────────────┬───────┘
                              │                       │
                     Serialized Queue           Event Broadcaster
                    (Atomic Race Lock)        (Low-Latency Room Sync)
                              │                       │
                      ┌───────▼───────────────────────▼───────┐
                      │            DATA & STORAGE             │
                      │   PostgreSQL / Supabase (RLS enabled) │
                      │  Resilient Local In-Memory Fallback   │
                      └───────────────────────────────────────┘
```

---

## 1. Core Architectural Pillars

### A. Server-Authoritative Logic & Fair Play
- **Grid Generation**: Shuffled on match creation using an unbiased Fisher-Yates algorithm. All clients receive an identical immutable sequence.
- **Strict Target Ordering**: Targets start at `min` and progress strictly ascending `1 → 2 → 3 ... → N`.
- **Atomic Serialized Queue**: To resolve simultaneous clicks down to the sub-millisecond level, every room features an in-memory sequential promise queue (`RoomManager.enqueueRoomOperation`).
  - First valid processed claim claims the target and awards the point.
  - Subsequent clicks processed milliseconds later are rejected with `"Already claimed"` or `"Wrong number"`.
  - Tie-breaker rule: server receipt order.
- **Authoritative Clock**: The match timer is governed by the server deadline (`endsAt`). Timer ticks (`game:timerUpdated`) and authoritative timeout declarations originate exclusively from the server.

### B. Client Performance & Rendering Optimization
- **Memoized Number Grid**: Every number tile is an individually interactive element wrapped with `React.memo` and equality comparisons. Only the active target, newly claimed number, and previous target re-render upon state updates.
- **Client-Side Synthesis (Web Audio API)**: Sound effects (chimes, clicks, pings, victory fanfare) are synthesized natively in-memory via the browser `AudioContext`. Zero network lag and zero external audio file loading failures.
- **Zoom & Fullscreen**: Fluid CSS transformations (`scale()`) and CSS grid column responsive adjustments maintain buttery 60 FPS performance across all viewports.

### C. Persistent Storage with Zero-Downtime Fallback
- `DatabaseService` dynamically detects whether Supabase credentials (`SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`) or direct PostgreSQL (`DATABASE_URL`) are present.
- If cloud credentials are not supplied, it immediately falls back to a persistent in-memory repository with full support for match history, player profiles, and rankings so development, tests, and offline runs never fail.

### D. Multiplatform Capacitor Architecture
- The exact same React + TypeScript codebase powers both the responsive web application and the native Android APK.
- Uses `@capacitor/core`, `@capacitor/android`, `@capacitor/status-bar`, and `@capacitor/splash-screen`.
