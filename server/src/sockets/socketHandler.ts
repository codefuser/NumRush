import { Server, Socket } from 'socket.io';
import { RoomManager } from '../game/RoomManager.js';
import { dbService } from '../db/DatabaseService.js';
import {
  CreateRoomPayload,
  JoinRoomPayload,
  UpdateSettingsPayload,
  ClaimNumberPayload,
} from '../types/index.js';

export function setupSocketHandlers(io: Server, roomManager: RoomManager) {
  // Wire RoomManager broadcaster to Socket.IO
  roomManager.setBroadcaster(
    (roomId: string, event: string, payload: unknown) => {
      io.to(roomId).emit(event, payload);
    },
    (socketId: string, event: string, payload: unknown) => {
      io.to(socketId).emit(event, payload);
    }
  );

  // Automatically persist all completed matches (cleared or expired)
  roomManager.setOnMatchFinished(async (results, match) => {
    try {
      await dbService.saveMatchResults(results, match);
    } catch (e) {
      console.error('Failed to save match results:', e);
    }
  });

  io.on('connection', (socket: Socket) => {
    // 1. Create Room
    socket.on('room:create', (payload: CreateRoomPayload, callback?: (res: unknown) => void) => {
      try {
        const { room, player } = roomManager.createRoom(socket.id, payload);
        socket.join(room.id);

        const response = {
          success: true,
          room,
          player,
          inviteUrl: `${payload.displayName ? '' : ''}`,
        };

        socket.emit('room:created', response);
        if (callback) callback(response);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create room';
        socket.emit('room:error', { message: errorMsg });
        if (callback) callback({ success: false, error: errorMsg });
      }
    });

    // 2. Join Room
    socket.on('room:join', (payload: JoinRoomPayload, callback?: (res: unknown) => void) => {
      try {
        const result = roomManager.joinRoom(socket.id, payload);
        if (!result.success || !result.room || !result.player) {
          socket.emit('room:error', { message: result.error || 'Failed to join room' });
          if (callback) callback({ success: false, error: result.error });
          return;
        }

        socket.join(result.room.id);

        const now = Date.now();
        const remainingSeconds = result.room.currentMatch && result.room.currentMatch.status === 'RUNNING'
          ? Math.max(0, Math.ceil((result.room.currentMatch.endsAt - now) / 1000))
          : (result.room.currentMatch?.settings.durationSeconds ?? result.room.settings.durationSeconds);

        const countdownRemaining = result.room.currentMatch && result.room.currentMatch.status === 'COUNTDOWN'
          ? Math.max(0, Math.ceil((result.room.currentMatch.countdownEndsAt - now) / 1000))
          : null;

        const response = {
          success: true,
          room: result.room,
          player: result.player,
          serverTime: now,
          remainingSeconds,
          countdownRemaining,
        };

        socket.emit('room:joined', response);
        socket.to(result.room.id).emit('room:playerJoined', {
          player: result.player,
          playerCount: Object.values(result.room.players).filter((p) => p.isConnected).length,
        });

        if (callback) callback(response);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error joining room';
        socket.emit('room:error', { message: errorMsg });
        if (callback) callback({ success: false, error: errorMsg });
      }
    });

    // 3. Update Settings (Host only)
    socket.on('room:updateSettings', (payload: UpdateSettingsPayload, callback?: (res: unknown) => void) => {
      const room = roomManager.getRoom(payload.roomId);
      if (!room) {
        if (callback) callback({ success: false, error: 'Room not found' });
        return;
      }

      // Find player id for this socket
      const player = Object.values(room.players).find((p) => p.socketId === socket.id);
      if (!player) {
        if (callback) callback({ success: false, error: 'Not in room' });
        return;
      }

      const result = roomManager.updateSettings(payload.roomId, player.id, payload.settings);
      if (!result.success) {
        socket.emit('room:error', { message: result.error });
        if (callback) callback({ success: false, error: result.error });
        return;
      }

      io.to(room.id).emit('room:settingsUpdated', {
        settings: room.settings,
      });

      if (callback) callback({ success: true, settings: room.settings });
    });

    // 4. Player Ready Toggle
    socket.on('room:ready', (data: { roomId: string; isReady: boolean }, callback?: (res: unknown) => void) => {
      const room = roomManager.getRoom(data.roomId);
      if (!room) return;
      const player = Object.values(room.players).find((p) => p.socketId === socket.id);
      if (!player) return;

      roomManager.setPlayerReady(room.id, player.id, data.isReady);
      io.to(room.id).emit('room:playerReadyUpdated', {
        playerId: player.id,
        isReady: data.isReady,
      });

      if (callback) callback({ success: true });
    });

    // 5. Start Game (Host only)
    socket.on('room:start', (data: { roomId: string }, callback?: (res: unknown) => void) => {
      const room = roomManager.getRoom(data.roomId);
      if (!room) {
        if (callback) callback({ success: false, error: 'Room not found' });
        return;
      }
      const player = Object.values(room.players).find((p) => p.socketId === socket.id);
      if (!player) {
        if (callback) callback({ success: false, error: 'Not in room' });
        return;
      }

      const result = roomManager.startGame(data.roomId, player.id);
      if (!result.success) {
        socket.emit('room:error', { message: result.error });
        if (callback) callback({ success: false, error: result.error });
        return;
      }

      if (callback) callback({ success: true });
    });

    // 6. Claim Number (Server-authoritative, atomic concurrency queue)
    socket.on('game:claimNumber', async (payload: ClaimNumberPayload, callback?: (res: unknown) => void) => {
      try {
        const result = await roomManager.submitClaim(
          socket.id,
          payload.roomId,
          payload.matchId,
          payload.number,
          payload.actionId
        );

        if (callback) callback(result);

        // If match finished, persist match results in DB
        if (result.matchFinished) {
          const room = roomManager.getRoom(payload.roomId);
          if (room && room.lastResults && room.currentMatch) {
            await dbService.saveMatchResults(room.lastResults, room.currentMatch);
          }
        }
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : 'Error processing claim';
        if (callback) callback({ success: false, error: errorMsg });
      }
    });

    // 7. Play Again (Host only)
    socket.on('game:playAgain', (data: { roomId: string }, callback?: (res: unknown) => void) => {
      const room = roomManager.getRoom(data.roomId);
      if (!room) return;
      const player = Object.values(room.players).find((p) => p.socketId === socket.id);
      if (!player) return;

      const result = roomManager.playAgain(data.roomId, player.id);
      if (callback) callback(result);
    });

    // 8. Request State Snapshot (for Reconnection)
    socket.on('game:requestSnapshot', (data: { roomId: string; userId?: string }, callback?: (res: unknown) => void) => {
      const room = roomManager.getRoom(data.roomId);
      if (!room) {
        if (callback) callback({ success: false, error: 'Room expired or not found' });
        return;
      }

      // Reconnect player socket and update room mapping
      if (data.userId) {
        roomManager.reconnectPlayer(socket.id, room.id, data.userId);
      }
      socket.join(room.id);

      const player = data.userId ? room.players[data.userId] : undefined;
      const now = Date.now();
      const remainingSeconds = room.currentMatch && room.currentMatch.status === 'RUNNING'
        ? Math.max(0, Math.ceil((room.currentMatch.endsAt - now) / 1000))
        : (room.currentMatch?.settings.durationSeconds ?? room.settings.durationSeconds);

      const countdownRemaining = room.currentMatch && room.currentMatch.status === 'COUNTDOWN'
        ? Math.max(0, Math.ceil((room.currentMatch.countdownEndsAt - now) / 1000))
        : null;

      const snapshot = {
        success: true,
        room,
        currentMatch: room.currentMatch,
        yourPlayer: player,
        serverTime: now,
        remainingSeconds,
        countdownRemaining,
      };

      socket.emit('game:stateSnapshot', snapshot);
      if (data.userId && player) {
        socket.to(room.id).emit('room:playerReconnected', {
          playerId: player.id,
          displayName: player.displayName,
        });
      }
      if (callback) callback(snapshot);
    });

    // 8b. Dedicated Reconnect Handler
    socket.on('room:reconnect', (data: { roomId: string; userId: string }, callback?: (res: unknown) => void) => {
      const result = roomManager.reconnectPlayer(socket.id, data.roomId, data.userId);
      if (!result.success || !result.room) {
        if (callback) callback({ success: false, error: result.error || 'Failed to reconnect' });
        return;
      }

      socket.join(result.room.id);

      const now = Date.now();
      const remainingSeconds = result.room.currentMatch && result.room.currentMatch.status === 'RUNNING'
        ? Math.max(0, Math.ceil((result.room.currentMatch.endsAt - now) / 1000))
        : (result.room.currentMatch?.settings.durationSeconds ?? result.room.settings.durationSeconds);

      const countdownRemaining = result.room.currentMatch && result.room.currentMatch.status === 'COUNTDOWN'
        ? Math.max(0, Math.ceil((result.room.currentMatch.countdownEndsAt - now) / 1000))
        : null;

      const snapshot = {
        success: true,
        room: result.room,
        currentMatch: result.room.currentMatch,
        yourPlayer: result.player,
        serverTime: now,
        remainingSeconds,
        countdownRemaining,
      };

      socket.emit('game:stateSnapshot', snapshot);
      socket.to(result.room.id).emit('room:playerReconnected', {
        playerId: data.userId,
        displayName: result.player?.displayName,
      });

      if (callback) callback(snapshot);
    });

    // 9. Leave Room
    socket.on('room:leave', (data: { roomId: string }) => {
      const room = roomManager.getRoom(data.roomId);
      if (!room) return;
      const player = Object.values(room.players).find((p) => p.socketId === socket.id);
      if (!player) return;

      roomManager.leaveRoom(room.id, player.id);
      socket.leave(room.id);
    });

    // 10. Kick Player
    socket.on('room:kick', (data: { roomId: string; targetPlayerId: string }, callback?: (res: unknown) => void) => {
      const room = roomManager.getRoom(data.roomId);
      if (!room) return;
      const player = Object.values(room.players).find((p) => p.socketId === socket.id);
      if (!player) return;

      const result = roomManager.kickPlayer(room.id, player.id, data.targetPlayerId);
      if (callback) callback(result);
    });

    // 11. Heartbeat
    socket.on('player:heartbeat', (data: { roomId?: string; userId?: string }) => {
      if (data.roomId && data.userId) {
        const room = roomManager.getRoom(data.roomId);
        if (room && room.players[data.userId]) {
          room.players[data.userId].lastActiveAt = Date.now();
        }
      }
    });

    // 12. Disconnect
    socket.on('disconnect', () => {
      const { roomId } = roomManager.handleDisconnect(socket.id);
      if (roomId) {
        socket.leave(roomId);
      }
    });
  });
}
