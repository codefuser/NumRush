import { v4 as uuidv4 } from 'uuid';
import {
  RoomState,
  RoomSettings,
  Player,
  MatchState,
  MatchResults,
  CreateRoomPayload,
  JoinRoomPayload,
} from '../types/index.js';
import { GridGenerator, DEFAULT_MAX_NUMBER } from './GridGenerator.js';
import { GameRules } from './GameRules.js';

export const RECONNECTION_GRACE_PERIOD_MS = 60000; // 60 seconds
export const ROOM_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
export const COUNTDOWN_INTERVAL_MS = 1000;

export interface RoomOperationQueue {
  queue: (() => Promise<void>)[];
  isProcessing: boolean;
}

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private roomCodeToId: Map<string, string> = new Map();
  private socketToPlayerMap: Map<string, { roomId: string; playerId: string }> = new Map();
  private operationQueues: Map<string, RoomOperationQueue> = new Map();
  private countdownTimers: Map<string, NodeJS.Timeout> = new Map();
  private matchTimers: Map<string, NodeJS.Timeout> = new Map();

  // Callbacks for broadcasting events through Socket.IO
  private broadcastToRoom: (roomId: string, event: string, payload: unknown) => void = () => {};
  private sendToSocket: (socketId: string, event: string, payload: unknown) => void = () => {};
  private onMatchFinishedCallback?: (results: MatchResults, match: MatchState) => void;

  public setBroadcaster(
    broadcast: (roomId: string, event: string, payload: unknown) => void,
    sendDirect: (socketId: string, event: string, payload: unknown) => void
  ) {
    this.broadcastToRoom = broadcast;
    this.sendToSocket = sendDirect;
  }

  public setOnMatchFinished(cb: (results: MatchResults, match: MatchState) => void) {
    this.onMatchFinishedCallback = cb;
  }

  /**
   * Generates a unique, hard-to-guess 5-character alphanumeric room code
   * Excludes easily confused characters like 0, O, 1, I
   */
  public generateRoomCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    let attempts = 0;
    do {
      code = 'NR-';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      attempts++;
      if (attempts > 100) break;
    } while (this.roomCodeToId.has(code));
    return code;
  }

  /**
   * Serializes operations for a given room to guarantee atomic execution of claims
   */
  public async enqueueRoomOperation<T>(roomId: string, op: () => Promise<T>): Promise<T> {
    if (!this.operationQueues.has(roomId)) {
      this.operationQueues.set(roomId, { queue: [], isProcessing: false });
    }
    const roomQueue = this.operationQueues.get(roomId)!;

    return new Promise<T>((resolve, reject) => {
      roomQueue.queue.push(async () => {
        try {
          const result = await op();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this.processQueue(roomId);
    });
  }

  private async processQueue(roomId: string) {
    const roomQueue = this.operationQueues.get(roomId);
    if (!roomQueue || roomQueue.isProcessing || roomQueue.queue.length === 0) return;

    roomQueue.isProcessing = true;
    while (roomQueue.queue.length > 0) {
      const task = roomQueue.queue.shift();
      if (task) {
        try {
          await task();
        } catch (e) {
          console.error(`Error processing operation in room ${roomId}:`, e);
        }
      }
    }
    roomQueue.isProcessing = false;
  }

  /**
   * Creates a new room
   */
  public createRoom(socketId: string, payload: CreateRoomPayload): { room: RoomState; player: Player } {
    const roomId = uuidv4();
    const roomCode = this.generateRoomCode();
    const playerId = payload.userId || uuidv4();

    const rangeMin = Math.max(1, payload.settings?.numberRange?.min ?? 1);
    const rangeMax = Math.min(DEFAULT_MAX_NUMBER, Math.max(rangeMin + 4, payload.settings?.numberRange?.max ?? 150));

    const defaultSettings: RoomSettings = {
      numberRange: { min: rangeMin, max: rangeMax },
      playerLimit: Math.min(10, Math.max(2, payload.settings?.playerLimit ?? 4)),
      countdownSeconds: [5, 10, 30].includes(payload.settings?.countdownSeconds ?? 5)
        ? payload.settings?.countdownSeconds ?? 5
        : 5,
      gameMode: payload.settings?.gameMode ?? 'TIME_CHALLENGE',
      durationSeconds: payload.settings?.durationSeconds !== undefined
        ? payload.settings.durationSeconds
        : (payload.settings?.gameMode === 'COMPLETE_GRID' ? 0 : 180),
      isPrivate: payload.settings?.isPrivate ?? false,
      password: payload.settings?.password || undefined,
      wrongClickPenalty: payload.settings?.wrongClickPenalty ?? 'NONE',
      allowSpectators: payload.settings?.allowSpectators ?? false,
      allowLateJoin: payload.settings?.allowLateJoin ?? true,
      soundEnabled: true,
    };

    const hostPlayer: Player = {
      id: playerId,
      socketId,
      displayName: (payload.displayName || 'Host Player').trim().substring(0, 20),
      avatarUrl: payload.avatarUrl,
      color: GameRules.getPlayerColor(0),
      isHost: true,
      isReady: true, // host is ready by default
      isConnected: true,
      score: 0,
      correctClicks: 0,
      wrongClicks: 0,
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    const room: RoomState = {
      id: roomId,
      roomCode,
      creatorId: playerId,
      hostId: playerId,
      status: 'WAITING',
      settings: defaultSettings,
      players: { [playerId]: hostPlayer },
      createdAt: Date.now(),
      expiresAt: Date.now() + ROOM_EXPIRY_MS,
      currentMatch: null,
      lastResults: null,
    };

    this.rooms.set(roomId, room);
    this.roomCodeToId.set(roomCode, roomId);
    this.socketToPlayerMap.set(socketId, { roomId, playerId });

    return { room, player: hostPlayer };
  }

  /**
   * Joins an existing room by code or handles player reconnection
   */
  public joinRoom(
    socketId: string,
    payload: JoinRoomPayload
  ): { success: boolean; room?: RoomState; player?: Player; error?: string } {
    const formattedCode = payload.roomCode.trim().toUpperCase();
    const roomId = this.roomCodeToId.get(formattedCode);

    if (!roomId || !this.rooms.has(roomId)) {
      return { success: false, error: 'Room not found. Check your room code.' };
    }

    const room = this.rooms.get(roomId)!;

    if (room.status === 'EXPIRED' || Date.now() > room.expiresAt) {
      return { success: false, error: 'This room has expired' };
    }

    // Check password if set
    if (room.settings.password && room.settings.password !== payload.password) {
      return { success: false, error: 'Incorrect room password' };
    }

    // Check if player is reconnecting with existing playerId
    if (payload.userId && room.players[payload.userId]) {
      const existingPlayer = room.players[payload.userId];
      existingPlayer.socketId = socketId;
      existingPlayer.isConnected = true;
      existingPlayer.isReserved = false;
      existingPlayer.disconnectedAt = undefined;
      existingPlayer.lastActiveAt = Date.now();

      // If returning player is the original creator, restore host role
      if (room.creatorId === existingPlayer.id) {
        const previousHostId = room.hostId;
        room.hostId = existingPlayer.id;
        existingPlayer.isHost = true;
        for (const p of Object.values(room.players)) {
          if (p.id !== existingPlayer.id) {
            p.isHost = false;
          }
        }
        if (previousHostId !== existingPlayer.id) {
          this.broadcastToRoom(roomId, 'room:hostMigrated', {
            previousHostId,
            newHostId: existingPlayer.id,
            newHostName: existingPlayer.displayName,
          });
        }
      }

      this.socketToPlayerMap.set(socketId, { roomId, playerId: existingPlayer.id });

      return { success: true, room, player: existingPlayer };
    }

    // Check room capacity (connected + reserved + recently disconnected players)
    const now = Date.now();
    const occupiedPlayers = Object.values(room.players).filter(
      (p) => p.isConnected || p.isReserved || (p.disconnectedAt && now - p.disconnectedAt < RECONNECTION_GRACE_PERIOD_MS)
    );
    if (occupiedPlayers.length >= room.settings.playerLimit) {
      return { success: false, error: 'Room is already full (spots occupied or reserved)' };
    }

    // Check if match already in progress and late joining not permitted
    if (room.status === 'PLAYING' && !room.settings.allowLateJoin) {
      return { success: false, error: 'Match already in progress. Late joining is not allowed.' };
    }

    const playerId = payload.userId || uuidv4();
    const playerIndex = Object.keys(room.players).length;

    const newPlayer: Player = {
      id: playerId,
      socketId,
      displayName: (payload.displayName || `Player ${playerIndex + 1}`).trim().substring(0, 20),
      avatarUrl: payload.avatarUrl,
      color: GameRules.getPlayerColor(playerIndex),
      isHost: false,
      isReady: false,
      isConnected: true,
      score: 0,
      correctClicks: 0,
      wrongClicks: 0,
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    room.players[playerId] = newPlayer;
    this.socketToPlayerMap.set(socketId, { roomId, playerId });

    // If joining during an active match, initialize their playerStats
    if (room.currentMatch && !room.currentMatch.playerStats[playerId]) {
      room.currentMatch.playerStats[playerId] = {
        score: 0,
        correctClicks: 0,
        wrongClicks: 0,
        totalReactionTimeMs: 0,
        avgReactionTimeMs: 0,
        accuracy: 0,
        claims: [],
      };
    }

    return { success: true, room, player: newPlayer };
  }

  /**
   * Seamlessly re-authenticates and re-binds a reconnecting player
   */
  public reconnectPlayer(
    socketId: string,
    roomId: string,
    playerId: string
  ): { success: boolean; room?: RoomState; player?: Player; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };

    let player = room.players[playerId];
    if (!player) {
      if (room.currentMatch && room.currentMatch.playerStats[playerId]) {
        // Restore player previously in match
        const playerIndex = Object.keys(room.players).length;
        player = {
          id: playerId,
          socketId,
          displayName: 'Player',
          color: GameRules.getPlayerColor(playerIndex),
          isHost: room.hostId === playerId,
          isReady: true,
          isConnected: true,
          score: room.currentMatch.playerStats[playerId].score || 0,
          correctClicks: room.currentMatch.playerStats[playerId].correctClicks || 0,
          wrongClicks: room.currentMatch.playerStats[playerId].wrongClicks || 0,
          joinedAt: Date.now(),
          lastActiveAt: Date.now(),
        };
        room.players[playerId] = player;
      } else {
        return { success: false, error: 'Player not found in room' };
      }
    }

    player.socketId = socketId;
    player.isConnected = true;
    player.isReserved = false;
    player.disconnectedAt = undefined;
    player.lastActiveAt = Date.now();

    // If returning player is the original creator, restore host role
    if (room.creatorId === player.id && room.hostId !== player.id) {
      const previousHostId = room.hostId;
      room.hostId = player.id;
      player.isHost = true;
      for (const p of Object.values(room.players)) {
        if (p.id !== player.id) {
          p.isHost = false;
        }
      }
      this.broadcastToRoom(roomId, 'room:hostMigrated', {
        previousHostId,
        newHostId: player.id,
        newHostName: player.displayName,
      });
    }

    if (room.currentMatch && !room.currentMatch.playerStats[playerId]) {
      room.currentMatch.playerStats[playerId] = {
        score: player.score || 0,
        correctClicks: player.correctClicks || 0,
        wrongClicks: player.wrongClicks || 0,
        totalReactionTimeMs: 0,
        avgReactionTimeMs: 0,
        accuracy: 0,
        claims: [],
      };
    }

    this.socketToPlayerMap.set(socketId, { roomId, playerId });
    return { success: true, room, player };
  }

  /**
   * Updates room settings (host only, before start)
   */
  public updateSettings(
    roomId: string,
    playerId: string,
    settingsUpdate: Partial<RoomSettings>
  ): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.hostId !== playerId) return { success: false, error: 'Only the host can modify settings' };
    if (room.status !== 'WAITING') return { success: false, error: 'Settings cannot be modified after match starts' };

    if (settingsUpdate.numberRange) {
      const validation = GridGenerator.validateRange(settingsUpdate.numberRange, DEFAULT_MAX_NUMBER);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
    }

    room.settings = {
      ...room.settings,
      ...settingsUpdate,
    };

    return { success: true };
  }

  /**
   * Toggles ready status for a player
   */
  public setPlayerReady(roomId: string, playerId: string, isReady: boolean): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    const player = room.players[playerId];
    if (!player) return { success: false, error: 'Player not in room' };

    player.isReady = isReady;
    return { success: true };
  }

  /**
   * Starts game countdown if minimum players joined and all players ready
   */
  public startGame(roomId: string, hostPlayerId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.hostId !== hostPlayerId) return { success: false, error: 'Only the host can start the game' };
    if (room.status !== 'WAITING' && room.status !== 'FINISHED') {
      return { success: false, error: 'Game is already running or counting down' };
    }

    const connectedPlayers = Object.values(room.players).filter((p) => p.isConnected);
    if (connectedPlayers.length < 1) {
      return { success: false, error: 'At least one player is required' };
    }

    // Check ready status (non-host players must be ready)
    const unreadyPlayers = connectedPlayers.filter((p) => !p.isHost && !p.isReady);
    if (unreadyPlayers.length > 0) {
      return {
        success: false,
        error: `Waiting for all players to be ready: ${unreadyPlayers.map((p) => p.displayName).join(', ')}`,
      };
    }

    room.status = 'COUNTDOWN';
    const countdownSeconds = room.settings.countdownSeconds;
    const countdownEndsAt = Date.now() + countdownSeconds * 1000;

    // Create match state with shuffled grid
    const shuffledGrid = GridGenerator.generateShuffledGrid(room.settings.numberRange, DEFAULT_MAX_NUMBER);
    const matchId = uuidv4();

    const playerStats: MatchState['playerStats'] = {};
    for (const player of Object.values(room.players)) {
      player.score = 0;
      player.correctClicks = 0;
      player.wrongClicks = 0;
      playerStats[player.id] = {
        score: 0,
        correctClicks: 0,
        wrongClicks: 0,
        totalReactionTimeMs: 0,
        avgReactionTimeMs: 0,
        accuracy: 0,
        claims: [],
      };
    }

    room.currentMatch = {
      id: matchId,
      roomId: room.id,
      status: 'COUNTDOWN',
      settings: { ...room.settings },
      shuffledGrid,
      currentTarget: room.settings.numberRange.min,
      maxTarget: room.settings.numberRange.max,
      startedAt: countdownEndsAt,
      countdownEndsAt,
      endsAt: countdownEndsAt + (
        room.settings.gameMode === 'COMPLETE_GRID' || !room.settings.durationSeconds || room.settings.durationSeconds <= 0 || room.settings.durationSeconds >= 86400
          ? 86400000
          : room.settings.durationSeconds * 1000
      ),
      claims: [],
      claimedMap: {},
      playerStats,
      lastClaimTimestamp: countdownEndsAt,
    };

    // Broadcast countdown start
    this.broadcastToRoom(roomId, 'game:countdown', {
      countdownSeconds,
      countdownEndsAt,
      currentTarget: room.currentMatch.currentTarget,
      maxTarget: room.currentMatch.maxTarget,
      matchId: room.currentMatch.id,
      shuffledGrid: room.currentMatch.shuffledGrid,
      durationSeconds: room.settings.durationSeconds,
    });

    // Clear any existing timers for this room
    if (this.countdownTimers.has(roomId)) {
      clearInterval(this.countdownTimers.get(roomId)!);
      this.countdownTimers.delete(roomId);
    }
    if (this.matchTimers.has(roomId)) {
      clearInterval(this.matchTimers.get(roomId)!);
      this.matchTimers.delete(roomId);
    }

    // Start countdown timer
    let remaining = countdownSeconds;
    const timerInterval = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        this.broadcastToRoom(roomId, 'game:countdownTick', { remaining });
      } else {
        clearInterval(timerInterval);
        this.countdownTimers.delete(roomId);
        this.launchMatch(roomId);
      }
    }, 1000);
    this.countdownTimers.set(roomId, timerInterval);

    return { success: true };
  }

  /**
   * Switches match from COUNTDOWN to RUNNING and starts the authoritative clock
   */
  private launchMatch(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentMatch) return;

    if (this.countdownTimers.has(roomId)) {
      clearInterval(this.countdownTimers.get(roomId)!);
      this.countdownTimers.delete(roomId);
    }

    room.status = 'PLAYING';
    room.currentMatch.status = 'RUNNING';
    room.currentMatch.startedAt = Date.now();
    room.currentMatch.lastClaimTimestamp = Date.now();
    const isUnlimited = room.settings.gameMode === 'COMPLETE_GRID' || !room.settings.durationSeconds || room.settings.durationSeconds <= 0 || room.settings.durationSeconds >= 86400;
    room.currentMatch.endsAt = !isUnlimited
      ? Date.now() + room.settings.durationSeconds * 1000
      : Date.now() + 86400000;

    this.broadcastToRoom(roomId, 'game:started', {
      matchId: room.currentMatch.id,
      shuffledGrid: room.currentMatch.shuffledGrid,
      currentTarget: room.currentMatch.currentTarget,
      maxTarget: room.currentMatch.maxTarget,
      startedAt: room.currentMatch.startedAt,
      endsAt: room.currentMatch.endsAt,
      durationSeconds: room.settings.durationSeconds,
    });

    // Start authoritative timer ticks and timeout end
    this.startAuthoritativeTimer(roomId, room.currentMatch.id);
  }

  /**
   * Server-authoritative timer updater
   */
  private startAuthoritativeTimer(roomId: string, matchId: string) {
    if (this.matchTimers.has(roomId)) {
      clearInterval(this.matchTimers.get(roomId)!);
      this.matchTimers.delete(roomId);
    }

    const timerInterval = setInterval(() => {
      const room = this.rooms.get(roomId);
      if (!room || !room.currentMatch || room.currentMatch.id !== matchId || room.currentMatch.status !== 'RUNNING') {
        clearInterval(timerInterval);
        this.matchTimers.delete(roomId);
        return;
      }

      const now = Date.now();
      const isUnlimited = room.settings.gameMode === 'COMPLETE_GRID' || !room.settings.durationSeconds || room.settings.durationSeconds <= 0 || room.settings.durationSeconds >= 86400;
      const remainingSeconds = isUnlimited
        ? 0
        : Math.max(0, Math.ceil((room.currentMatch.endsAt - now) / 1000));
      const elapsedSeconds = Math.max(0, Math.floor((now - room.currentMatch.startedAt) / 1000));

      this.broadcastToRoom(roomId, 'game:timerUpdated', {
        remainingSeconds,
        elapsedSeconds,
        isUnlimited,
        serverTime: now,
        endsAt: room.currentMatch.endsAt,
      });

      if (!isUnlimited && now >= room.currentMatch.endsAt) {
        clearInterval(timerInterval);
        this.matchTimers.delete(roomId);
        this.finishMatch(roomId, 'Time expired');
      }
    }, 1000);

    this.matchTimers.set(roomId, timerInterval);
  }

  /**
   * Concurrency-safe claim submission processed via the serialized room queue
   */
  public async submitClaim(
    socketId: string,
    roomId: string,
    matchId: string,
    number: number,
    actionId: string,
    userId?: string
  ): Promise<{ success: boolean; reason?: string; matchFinished?: boolean }> {
    return this.enqueueRoomOperation(roomId, async () => {
      const room = this.rooms.get(roomId);
      if (!room || !room.currentMatch || room.currentMatch.id !== matchId) {
        if (room?.currentMatch) {
          this.sendToSocket(socketId, 'game:claimRejected', {
            number,
            reason: 'Match is not active',
            currentTarget: room.currentMatch.currentTarget,
            claimedMap: room.currentMatch.claimedMap,
          });
        }
        return { success: false, reason: 'Match is not active' };
      }

      let socketInfo = this.socketToPlayerMap.get(socketId);
      // Seamless auto-rebind if player reconnected with a new socketId
      if (!socketInfo && userId && room.players[userId]) {
        const player = room.players[userId];
        player.socketId = socketId;
        player.isConnected = true;
        player.disconnectedAt = undefined;
        player.lastActiveAt = Date.now();
        this.socketToPlayerMap.set(socketId, { roomId, playerId: userId });
        socketInfo = { roomId, playerId: userId };
      }

      if (!socketInfo || socketInfo.roomId !== roomId) {
        if (room.currentMatch) {
          this.sendToSocket(socketId, 'game:claimRejected', {
            number,
            reason: 'Unauthorized player claim',
            currentTarget: room.currentMatch.currentTarget,
            claimedMap: room.currentMatch.claimedMap,
          });
        }
        return { success: false, reason: 'Unauthorized player claim' };
      }

      const player = room.players[socketInfo.playerId];
      if (!player) {
        return { success: false, reason: 'Player not recognized' };
      }

      const match = room.currentMatch;
      const now = Date.now();

      // Check eligibility
      const eligibility = GameRules.validateClaimEligibility(match, player.id, actionId, now);
      if (!eligibility.eligible) {
        this.sendToSocket(socketId, 'game:claimRejected', {
          number,
          reason: eligibility.reason,
          currentTarget: match.currentTarget,
          claimedMap: match.claimedMap,
        });
        return { success: false, reason: eligibility.reason };
      }

      // Process click through game rules
      const result = GameRules.processClick(match, player, number, actionId, match.settings.wrongClickPenalty, now);

      if (!result.isCorrect) {
        // Emit personal error feedback to the clicker with latest target & claimedMap
        this.sendToSocket(socketId, 'game:claimRejected', {
          number,
          reason: result.reason,
          currentTarget: match.currentTarget,
          claimedMap: match.claimedMap,
        });

        // Broadcast stats update so leaderboard accuracy updates
        this.broadcastToRoom(roomId, 'game:playerStatsUpdated', {
          playerId: player.id,
          score: player.score,
          correctClicks: player.correctClicks,
          wrongClicks: match.playerStats[player.id].wrongClicks,
          accuracy: match.playerStats[player.id].accuracy,
        });

        return { success: false, reason: result.reason };
      }

      // Claim is valid! Broadcast update to every connected client
      const scoresRecord: Record<string, number> = {};
      for (const p of Object.values(room.players)) {
        scoresRecord[p.id] = p.score;
      }

      this.broadcastToRoom(roomId, 'game:numberClaimed', {
        number,
        claimedBy: {
          playerId: player.id,
          displayName: player.displayName,
          color: player.color,
        },
        nextTarget: match.currentTarget,
        scores: scoresRecord,
        serverClaimedAt: now,
      });

      if (result.isMatchFinished) {
        this.finishMatch(roomId, 'All numbers completed!');
        return { success: true, matchFinished: true };
      }

      return { success: true };
    });
  }

  /**
   * Concludes a match, records final results, and notifies clients
   */
  public finishMatch(roomId: string, reason: string): MatchResults | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.currentMatch) return null;

    if (this.matchTimers.has(roomId)) {
      clearInterval(this.matchTimers.get(roomId)!);
      this.matchTimers.delete(roomId);
    }
    if (this.countdownTimers.has(roomId)) {
      clearInterval(this.countdownTimers.get(roomId)!);
      this.countdownTimers.delete(roomId);
    }

    room.currentMatch.status = 'ENDED';
    room.status = 'FINISHED';

    const results = GameRules.computeResults(room.currentMatch, room.players);
    room.lastResults = results;

    if (this.onMatchFinishedCallback && room.currentMatch) {
      this.onMatchFinishedCallback(results, room.currentMatch);
    }

    // Reset player ready states for next round
    for (const p of Object.values(room.players)) {
      p.isReady = p.isHost;
    }

    this.broadcastToRoom(roomId, 'game:finished', {
      results,
      reason,
    });

    return results;
  }

  /**
   * Resets room state to play again
   */
  public playAgain(roomId: string, hostPlayerId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.hostId !== hostPlayerId) return { success: false, error: 'Only the host can initiate Play Again' };

    if (this.matchTimers.has(roomId)) {
      clearInterval(this.matchTimers.get(roomId)!);
      this.matchTimers.delete(roomId);
    }
    if (this.countdownTimers.has(roomId)) {
      clearInterval(this.countdownTimers.get(roomId)!);
      this.countdownTimers.delete(roomId);
    }

    room.status = 'WAITING';
    room.currentMatch = null;
    room.lastResults = null;

    for (const player of Object.values(room.players)) {
      player.score = 0;
      player.correctClicks = 0;
      player.wrongClicks = 0;
      player.isReady = player.isHost;
    }

    this.broadcastToRoom(roomId, 'room:playAgainReady', {
      room,
    });

    return { success: true };
  }

  /**
   * Handles player disconnect and host migration
   */
  public handleDisconnect(socketId: string): { roomId?: string; playerId?: string; newHostId?: string } {
    const mapping = this.socketToPlayerMap.get(socketId);
    if (!mapping) return {};

    const { roomId, playerId } = mapping;
    this.socketToPlayerMap.delete(socketId);

    const room = this.rooms.get(roomId);
    if (!room) return { roomId, playerId };

    const player = room.players[playerId];
    if (player) {
      player.isConnected = false;
      player.disconnectedAt = Date.now();
    }

    let newHostId: string | undefined = undefined;

    // If host disconnected, migrate host privileges to next connected player
    if (room.hostId === playerId) {
      const eligiblePlayers = Object.values(room.players).filter((p) => p.isConnected && p.id !== playerId);
      if (eligiblePlayers.length > 0) {
        const nextHost = eligiblePlayers[0];
        room.hostId = nextHost.id;
        nextHost.isHost = true;
        if (player) player.isHost = false;
        newHostId = nextHost.id;

        this.broadcastToRoom(roomId, 'room:hostMigrated', {
          previousHostId: playerId,
          newHostId: nextHost.id,
          newHostName: nextHost.displayName,
        });
      }
    }

    // Broadcast player disconnect
    this.broadcastToRoom(roomId, 'room:playerDisconnected', {
      playerId,
      playerName: player?.displayName,
      reconnectGracePeriodMs: RECONNECTION_GRACE_PERIOD_MS,
    });

    return { roomId, playerId, newHostId };
  }

  /**
   * Removes a player explicitly leaving the room (supports permanent vs temporary hold)
   */
  public leaveRoom(roomId: string, playerId: string, permanent: boolean = false): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players[playerId];
    if (player) {
      this.socketToPlayerMap.delete(player.socketId);
    }

    if (permanent) {
      delete room.players[playerId];
      if (room.currentMatch && room.currentMatch.playerStats[playerId]) {
        delete room.currentMatch.playerStats[playerId];
      }

      // If creator permanently leaves, transfer creator role to another player
      if (room.creatorId === playerId) {
        const remaining = Object.values(room.players);
        if (remaining.length > 0) {
          room.creatorId = remaining[0].id;
        }
      }
    } else {
      // Temporary leave / hold my spot ("rejoin panuven")
      if (player) {
        player.isConnected = false;
        player.isReserved = true;
        player.disconnectedAt = Date.now();
      }
    }

    // If host left, migrate host to next connected player
    if (room.hostId === playerId) {
      const remaining = Object.values(room.players).filter((p) => p.isConnected && p.id !== playerId);
      if (remaining.length > 0) {
        const nextHost = remaining[0];
        room.hostId = nextHost.id;
        nextHost.isHost = true;
        if (player) player.isHost = false;
        this.broadcastToRoom(roomId, 'room:hostMigrated', {
          previousHostId: playerId,
          newHostId: nextHost.id,
          newHostName: nextHost.displayName,
        });
      }
    }

    const connectedCount = Object.values(room.players).filter((p) => p.isConnected).length;
    const reservedCount = Object.values(room.players).filter((p) => p.isReserved).length;

    this.broadcastToRoom(roomId, 'room:playerLeft', {
      playerId,
      permanent,
      remainingCount: connectedCount,
      reservedCount,
    });

    return true;
  }

  /**
   * Kicks a player (host only, before start)
   */
  public kickPlayer(roomId: string, hostPlayerId: string, targetPlayerId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.hostId !== hostPlayerId) return { success: false, error: 'Only the host can kick players' };
    if (room.status !== 'WAITING') return { success: false, error: 'Cannot kick players during match' };
    if (hostPlayerId === targetPlayerId) return { success: false, error: 'Host cannot kick themselves' };

    const targetPlayer = room.players[targetPlayerId];
    if (!targetPlayer) return { success: false, error: 'Player not found in room' };

    delete room.players[targetPlayerId];

    this.sendToSocket(targetPlayer.socketId, 'room:kicked', {
      reason: 'You were removed by the room host',
    });

    this.broadcastToRoom(roomId, 'room:playerLeft', {
      playerId: targetPlayerId,
      remainingCount: Object.keys(room.players).length,
    });

    return { success: true };
  }

  public getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomByCode(code: string): RoomState | undefined {
    const roomId = this.roomCodeToId.get(code.toUpperCase());
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  public getActiveRooms(): RoomState[] {
    return Array.from(this.rooms.values()).filter(
      (r) => !r.settings.isPrivate && r.status !== 'EXPIRED' && Date.now() < r.expiresAt
    );
  }
}
