# NumRush - Production Deployment Guide

This guide details deploying the NumRush Game Server, Web Client, and Database.

---

## 1. Cloud Database Setup (Supabase / PostgreSQL)

1. Create a project at [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the contents of `server/migrations/001_initial_schema.sql`.
4. Navigate to **Project Settings -> API** to retrieve:
   - `Project URL` (`SUPABASE_URL`)
   - `service_role` secret key (`SUPABASE_SERVICE_ROLE_KEY`)

---

## 2. Deploying the Backend Game Server (Node.js + Socket.IO)

Recommended platforms: **Render**, **Railway**, **DigitalOcean App Platform**, or **AWS ECS/Fly.io**.

### Environment Variables for Server:
```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://numrush.game,capacitor://localhost,http://localhost
APP_URL=https://numrush.game
SUPABASE_URL=https://your-supabase-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MAX_NUMBER_LIMIT=500
RECONNECTION_GRACE_PERIOD_MS=60000
```

### Build & Start Commands:
- Build command: `npm install && npm run build`
- Start command: `node dist/index.js`
- Health check path: `/health`

> **Note on Horizontal Scaling**: If scaling across multiple container instances, attach the `@socket.io/redis-adapter` so room events propagate seamlessly across node processes.

---

## 3. Deploying the Web Frontend (React + Vite)

Recommended platforms: **Vercel**, **Cloudflare Pages**, or **Netlify**.

### Environment Variables for Frontend:
```env
VITE_BACKEND_URL=https://api.numrush.game
```

### Build Configuration:
- Framework preset: `Vite`
- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`

---

## 4. HTTPS & WebSocket Requirements
- Ensure your hosting provider supports WebSocket upgrade connections (HTTP `101 Switching Protocols`).
- Both HTTP and WebSocket connections must use TLS (`https://` and `wss://`) in production to prevent mixed-content blocks on modern mobile and desktop browsers.
