import { PersistentPlayerStats } from '../types/index.js';
import { api } from './api.js';

const STATS_STORAGE_KEY = 'numrush_career_stats';
const HISTORY_STORAGE_KEY = 'numrush_career_history';

export interface LocalHistoryEntry {
  matchId: string;
  gameMode: string;
  score: number;
  rank: number;
  accuracy: number;
  won: boolean;
  endedAt: number;
}

export const playerStatsService = {
  getLocalStats(userId: string, defaultName: string = 'Hunter'): PersistentPlayerStats {
    try {
      const raw = localStorage.getItem(`${STATS_STORAGE_KEY}_${userId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse local stats:', e);
    }

    const initial: PersistentPlayerStats = {
      playerId: userId,
      displayName: defaultName,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      totalPoints: 0,
      bestScore: 0,
      avgAccuracy: 0,
      avgReactionTimeMs: 0,
      lastPlayedAt: Date.now(),
    };
    return initial;
  },

  saveLocalStats(stats: PersistentPlayerStats) {
    try {
      localStorage.setItem(`${STATS_STORAGE_KEY}_${stats.playerId}`, JSON.stringify(stats));
      window.dispatchEvent(new CustomEvent('numrush:statsUpdated', { detail: stats }));
    } catch (e) {
      console.warn('Failed to save local stats:', e);
    }
  },

  getLocalHistory(userId: string): LocalHistoryEntry[] {
    try {
      const raw = localStorage.getItem(`${HISTORY_STORAGE_KEY}_${userId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // fallback
    }
    return [];
  },

  saveLocalHistory(userId: string, entry: LocalHistoryEntry) {
    try {
      const history = this.getLocalHistory(userId);
      history.unshift(entry);
      localStorage.setItem(`${HISTORY_STORAGE_KEY}_${userId}`, JSON.stringify(history.slice(0, 50)));
    } catch (e) {
      console.warn('Failed to save history entry:', e);
    }
  },

  recordMatchResult(params: {
    userId: string;
    displayName: string;
    score: number;
    won: boolean;
    accuracy: number;
    avgReactionTimeMs: number;
    gameMode: string;
    matchId?: string;
  }): PersistentPlayerStats {
    const { userId, displayName, score, won, accuracy, avgReactionTimeMs, gameMode, matchId } = params;
    const current = this.getLocalStats(userId, displayName);

    current.totalMatches += 1;
    if (won) {
      current.wins += 1;
    } else {
      current.losses += 1;
    }

    current.totalPoints += score;
    current.bestScore = Math.max(current.bestScore, score);
    current.displayName = displayName;
    current.lastPlayedAt = Date.now();

    const matches = current.totalMatches;
    current.avgAccuracy = Math.round(((current.avgAccuracy * (matches - 1) + accuracy) / matches) * 10) / 10;
    current.avgReactionTimeMs = Math.round((current.avgReactionTimeMs * (matches - 1) + (avgReactionTimeMs || 800)) / matches);

    this.saveLocalStats(current);

    this.saveLocalHistory(userId, {
      matchId: matchId || `m_${Date.now()}`,
      gameMode,
      score,
      rank: won ? 1 : 2,
      accuracy,
      won,
      endedAt: Date.now(),
    });

    // Also dispatch background update to backend API
    api.recordSoloMatch({
      playerId: userId,
      displayName,
      score,
      won,
      accuracy,
      avgReactionTimeMs,
      gameMode,
    }).catch(() => {});

    return current;
  },

  async syncWithBackend(userId: string, displayName: string): Promise<PersistentPlayerStats> {
    const local = this.getLocalStats(userId, displayName);
    try {
      const remote = await api.getProfile(userId);
      if (remote && remote.totalMatches >= local.totalMatches) {
        // Remote is newer/higher, persist local copy
        this.saveLocalStats(remote);
        return remote;
      }
    } catch {
      // Offline fallback: keep local
    }
    return local;
  },
};
