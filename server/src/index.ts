import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from './config/index.js';
import { RoomManager } from './game/RoomManager.js';
import { setupSocketHandlers } from './sockets/socketHandler.js';
import { dbService } from './db/DatabaseService.js';

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

app.use(express.json());

// Initialize RoomManager
export const roomManager = new RoomManager();

// Configure Socket.IO
export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

setupSocketHandlers(io, roomManager);

// REST API Endpoints
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'NumRush Server',
    time: Date.now(),
    activeRooms: roomManager.getActiveRooms().length,
  });
});

app.get('/api/rooms/active', (_req, res) => {
  const rooms = roomManager.getActiveRooms().map((r) => ({
    id: r.id,
    roomCode: r.roomCode,
    status: r.status,
    playerCount: Object.keys(r.players).length,
    playerLimit: r.settings.playerLimit,
    numberRange: r.settings.numberRange,
    gameMode: r.settings.gameMode,
    createdAt: r.createdAt,
  }));
  res.json({ success: true, rooms });
});

app.get('/api/rooms/:code', (req, res) => {
  const room = roomManager.getRoomByCode(req.params.code);
  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found' });
    return;
  }
  res.json({
    success: true,
    room: {
      id: room.id,
      roomCode: room.roomCode,
      status: room.status,
      playerCount: Object.keys(room.players).length,
      playerLimit: room.settings.playerLimit,
      numberRange: room.settings.numberRange,
      gameMode: room.settings.gameMode,
      hasPassword: !!room.settings.password,
    },
  });
});

app.get('/api/profile/:id', async (req, res) => {
  try {
    const stats = await dbService.getPlayerStats(req.params.id);
    res.json({ success: true, stats });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error retrieving profile';
    res.status(500).json({ success: false, error: errorMsg });
  }
});

app.post('/api/profile/:id', async (req, res) => {
  try {
    const { displayName, avatarUrl } = req.body;
    await dbService.updateProfile(req.params.id, displayName, avatarUrl);
    const updated = await dbService.getPlayerStats(req.params.id);
    res.json({ success: true, stats: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating profile';
    res.status(500).json({ success: false, error: errorMsg });
  }
});

app.get('/api/leaderboard', async (_req, res) => {
  try {
    const leaderboard = await dbService.getLeaderboard(25);
    res.json({ success: true, leaderboard });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error retrieving leaderboard';
    res.status(500).json({ success: false, error: errorMsg });
  }
});

app.get('/api/history/:id', async (req, res) => {
  try {
    const history = await dbService.getPlayerHistory(req.params.id);
    res.json({ success: true, history });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error retrieving history';
    res.status(500).json({ success: false, error: errorMsg });
  }
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, () => {
    console.log(`===============================================`);
    console.log(`🚀 NumRush Game Server running on port ${config.port}`);
    console.log(`   Health check: http://localhost:${config.port}/health`);
    console.log(`===============================================`);
  });
}

export { app, server };
