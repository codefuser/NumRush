import { createClient, SupabaseClient } from '@supabase/supabase-js';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { MatchResults, MatchState } from '../types/index.js';

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

export interface PlayerHistoryEntry {
  matchId: string;
  gameMode: string;
  score: number;
  rank: number;
  accuracy: number;
  won: boolean;
  endedAt: number;
}

export class DatabaseService {
  private supabase: SupabaseClient | null = null;
  private pgPool: pg.Pool | null = null;
  private isConnectedToExternalDb: boolean = false;

  // In-memory store fallback when external DB credentials are not yet supplied
  private memoryStats: Map<string, PersistentPlayerStats> = new Map();
  private memoryProfiles: Map<string, { id: string; displayName: string; avatarUrl?: string }> = new Map();
  private memoryHistory: Map<string, PlayerHistoryEntry[]> = new Map();

  constructor() {
    this.initClients();
  }

  private async initClients() {
    if (config.supabase.url && config.supabase.serviceKey) {
      try {
        this.supabase = createClient(config.supabase.url, config.supabase.serviceKey);
        this.isConnectedToExternalDb = true;
        console.log('✓ Connected to Supabase managed PostgreSQL');
      } catch (e) {
        console.warn('Failed to connect to Supabase, falling back to local store:', e);
      }
    } else if (config.databaseUrl) {
      try {
        this.pgPool = new pg.Pool({ connectionString: config.databaseUrl });
        await this.pgPool.query('SELECT 1');
        this.isConnectedToExternalDb = true;
        console.log('✓ Connected to PostgreSQL database');
        await this.runMigrations();
      } catch (e) {
        console.warn('Failed to connect to PostgreSQL, falling back to local store:', e);
      }
    } else {
      console.log('ℹ Running with local persistent memory store (Configure SUPABASE_URL or DATABASE_URL for cloud sync)');
    }
  }

  public async runMigrations() {
    if (!this.pgPool) return;
    try {
      const migrationPath = path.resolve(process.cwd(), 'migrations/001_initial_schema.sql');
      if (fs.existsSync(migrationPath)) {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        await this.pgPool.query(sql);
        console.log('✓ Database migrations applied successfully');
      }
    } catch (e) {
      console.error('Error applying migrations:', e);
    }
  }

  /**
   * Saves completed match results, player entries, claims, and updates stats
   */
  public async saveMatchResults(results: MatchResults, match: MatchState): Promise<void> {
    const isWinner = (playerId: string) => results.winner?.playerId === playerId && !results.isTie;

    // 1. Update in-memory fallback
    for (const ranking of results.rankings) {
      const pid = ranking.playerId;
      const current = this.memoryStats.get(pid) || {
        playerId: pid,
        displayName: ranking.displayName,
        avatarUrl: ranking.avatarUrl,
        totalMatches: 0,
        wins: 0,
        losses: 0,
        totalPoints: 0,
        bestScore: 0,
        avgAccuracy: 0,
        avgReactionTimeMs: 0,
        lastPlayedAt: Date.now(),
      };

      const won = isWinner(pid);
      current.totalMatches += 1;
      if (won) current.wins += 1;
      else current.losses += 1;

      current.totalPoints += ranking.score;
      current.bestScore = Math.max(current.bestScore, ranking.score);
      current.displayName = ranking.displayName;
      current.avatarUrl = ranking.avatarUrl;
      current.lastPlayedAt = Date.now();

      // Weighted rolling averages
      current.avgAccuracy = Math.round(((current.avgAccuracy * (current.totalMatches - 1) + ranking.accuracy) / current.totalMatches) * 10) / 10;
      current.avgReactionTimeMs = Math.round((current.avgReactionTimeMs * (current.totalMatches - 1) + ranking.avgReactionTimeMs) / current.totalMatches);

      this.memoryStats.set(pid, current);

      // Save to match history
      const historyList = this.memoryHistory.get(pid) || [];
      historyList.unshift({
        matchId: results.matchId,
        gameMode: results.gameMode,
        score: ranking.score,
        rank: ranking.rank,
        accuracy: ranking.accuracy,
        won,
        endedAt: results.endedAt,
      });
      this.memoryHistory.set(pid, historyList.slice(0, 50));
    }

    // 2. Persist to Supabase if configured
    if (this.supabase) {
      try {
        await this.supabase.from('matches').insert({
          id: results.matchId,
          room_id: results.roomId,
          status: 'ENDED',
          number_range: results.numberRange,
          shuffled_grid: match.shuffledGrid,
          current_target: match.currentTarget,
          game_mode: results.gameMode,
          started_at: new Date(results.startedAt).toISOString(),
          ended_at: new Date(results.endedAt).toISOString(),
          final_results: results,
        });

        const playerInserts = results.rankings.map((r) => ({
          match_id: results.matchId,
          player_id: r.playerId,
          score: r.score,
          correct_clicks: r.correctClicks,
          wrong_clicks: r.wrongClicks,
          accuracy: r.accuracy,
          avg_reaction_time_ms: r.avgReactionTimeMs,
          rank: r.rank,
          joined_at: new Date(results.startedAt).toISOString(),
        }));

        await this.supabase.from('match_players').insert(playerInserts);
      } catch (err) {
        console.error('Failed to persist match in Supabase:', err);
      }
    } else if (this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO matches (id, room_id, status, number_range, shuffled_grid, current_target, game_mode, started_at, ended_at, final_results)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            results.matchId,
            results.roomId,
            'ENDED',
            JSON.stringify(results.numberRange),
            JSON.stringify(match.shuffledGrid),
            match.currentTarget,
            results.gameMode,
            new Date(results.startedAt),
            new Date(results.endedAt),
            JSON.stringify(results),
          ]
        );
      } catch (err) {
        console.error('Failed to persist match in PG:', err);
      }
    }
  }

  /**
   * Retrieves player profile & stats
   */
  public async getPlayerStats(playerId: string): Promise<PersistentPlayerStats> {
    if (this.memoryStats.has(playerId)) {
      return this.memoryStats.get(playerId)!;
    }

    const defaultStats: PersistentPlayerStats = {
      playerId,
      displayName: 'Player',
      totalMatches: 0,
      wins: 0,
      losses: 0,
      totalPoints: 0,
      bestScore: 0,
      avgAccuracy: 0,
      avgReactionTimeMs: 0,
      lastPlayedAt: Date.now(),
    };

    return defaultStats;
  }

  /**
   * Updates or registers player profile
   */
  public async updateProfile(playerId: string, displayName: string, avatarUrl?: string): Promise<void> {
    this.memoryProfiles.set(playerId, { id: playerId, displayName, avatarUrl });
    const existing = this.memoryStats.get(playerId);
    if (existing) {
      existing.displayName = displayName;
      if (avatarUrl) existing.avatarUrl = avatarUrl;
    }
  }

  /**
   * Retrieves top players for global leaderboard
   */
  public async getLeaderboard(limit: number = 20): Promise<PersistentPlayerStats[]> {
    const all = Array.from(this.memoryStats.values());
    all.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.avgAccuracy - a.avgAccuracy;
    });
    return all.slice(0, limit);
  }

  /**
   * Retrieves recent match history for a player
   */
  public async getPlayerHistory(playerId: string): Promise<PlayerHistoryEntry[]> {
    return this.memoryHistory.get(playerId) || [];
  }
}

export const dbService = new DatabaseService();
