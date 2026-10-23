export const SCREENS = {
  HOME: 'HOME',
  CREATE: 'CREATE',
  JOIN: 'JOIN',
  LOBBY: 'LOBBY',
  GAME: 'GAME',
  RESULTS: 'RESULTS',
  PRACTICE: 'PRACTICE',
  LEADERBOARD: 'LEADERBOARD',
  PROFILE: 'PROFILE',
  HOW_TO_PLAY: 'HOW_TO_PLAY',
} as const;

export type Screen = (typeof SCREENS)[keyof typeof SCREENS];

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
  durationSeconds: number;
  isPrivate: boolean;
  password?: string;
  wrongClickPenalty: WrongClickPenalty;
  allowSpectators: boolean;
  allowLateJoin: boolean;
  soundEnabled: boolean;
}

export interface Player {
  id: string;
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

export interface PersistentPlayerStats {
  playerId: string;
  displayName: string;
  avatarUrl?: string;
  totalMatches: number;
  wins: number;
  losses: number;
  totalPoints: number;
  bestScore: number;
  avgAccuracy: number;
  avgReactionTimeMs: number;
  lastPlayedAt: number;
}

export interface PracticeStats {
  score: number;
  correct: number;
  wrong: number;
  accuracy: number;
  elapsedSeconds: number;
  isComplete: boolean;
}
