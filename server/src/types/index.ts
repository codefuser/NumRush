export type GameMode = 'TIME_CHALLENGE' | 'COMPLETE_GRID';
export type WrongClickPenalty = 'NONE' | 'TIME' | 'SCORE';
export type RoomStatus = 'WAITING' | 'COUNTDOWN' | 'PLAYING' | 'FINISHED' | 'EXPIRED';
export type MatchStatus = 'COUNTDOWN' | 'RUNNING' | 'ENDED';

export interface NumberRange {
  min: number;
  max: number;
}

export interface RoomSettings {
  numberRange: NumberRange;
  playerLimit: number;
  countdownSeconds: number;
  gameMode: GameMode;
  durationSeconds: number; // for TIME_CHALLENGE or time-capped COMPLETE_GRID
  isPrivate: boolean;
  password?: string;
  wrongClickPenalty: WrongClickPenalty;
  allowSpectators: boolean;
  allowLateJoin: boolean;
  soundEnabled: boolean;
}

export interface Player {
  id: string; // Persistent player profile ID or session ID
  socketId: string;
  displayName: string;
  avatarUrl?: string;
  color: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  score: number;
  correctClicks: number;
  wrongClicks: number;
  joinedAt: number;
  lastActiveAt: number;
  disconnectedAt?: number;
}

export interface ClaimRecord {
  number: number;
  playerId: string;
  playerName: string;
  playerColor: string;
  serverClaimedAt: number;
  actionId: string;
}

export interface MatchPlayerStats {
  score: number;
  correctClicks: number;
  wrongClicks: number;
  totalReactionTimeMs: number;
  avgReactionTimeMs: number;
  accuracy: number;
  claims: number[];
}

export interface MatchState {
  id: string;
  roomId: string;
  status: MatchStatus;
  settings: RoomSettings;
  shuffledGrid: number[];
  currentTarget: number;
  maxTarget: number;
  startedAt: number;
  countdownEndsAt: number;
  endsAt: number;
  claims: ClaimRecord[];
  claimedMap: Record<number, ClaimRecord>;
  playerStats: Record<string, MatchPlayerStats>;
  lastClaimTimestamp: number;
}

export interface PlayerRanking {
  rank: number;
  playerId: string;
  displayName: string;
  avatarUrl?: string;
  color: string;
  score: number;
  correctClicks: number;
  wrongClicks: number;
  accuracy: number;
  avgReactionTimeMs: number;
  claimsCount: number;
  isHost: boolean;
  isConnected: boolean;
}

export interface MatchResults {
  matchId: string;
  roomId: string;
  gameMode: GameMode;
  numberRange: NumberRange;
  totalNumbers: number;
  claimedNumbers: number;
  durationSeconds: number;
  startedAt: number;
  endedAt: number;
  winner: PlayerRanking | null;
  isTie: boolean;
  rankings: PlayerRanking[];
}

export interface RoomState {
  id: string;
  roomCode: string;
  hostId: string;
  status: RoomStatus;
  settings: RoomSettings;
  players: Record<string, Player>;
  createdAt: number;
  expiresAt: number;
  currentMatch: MatchState | null;
  lastResults: MatchResults | null;
}

// Client-to-Server Event Payloads
export interface CreateRoomPayload {
  displayName: string;
  avatarUrl?: string;
  userId?: string;
  settings: Partial<RoomSettings>;
}

export interface JoinRoomPayload {
  roomCode: string;
  displayName: string;
  avatarUrl?: string;
  userId?: string;
  password?: string;
}

export interface UpdateSettingsPayload {
  roomId: string;
  settings: Partial<RoomSettings>;
}

export interface ClaimNumberPayload {
  roomId: string;
  matchId: string;
  number: number;
  actionId: string;
  userId?: string;
  clientTimestamp?: number;
}

// Server-to-Client Event Payloads
export interface RoomSnapshotPayload {
  room: RoomState;
  yourPlayerId: string;
}

export interface ClaimResultPayload {
  success: boolean;
  number: number;
  claimedBy?: {
    playerId: string;
    displayName: string;
    color: string;
  };
  nextTarget: number;
  scores: Record<string, number>;
  serverClaimedAt: number;
  reason?: string;
}

export interface PlayerStatsUpdatePayload {
  playerId: string;
  score: number;
  correctClicks: number;
  wrongClicks: number;
  accuracy: number;
}

export interface TimerUpdatePayload {
  remainingSeconds: number;
  serverTime: number;
  endsAt: number;
}
