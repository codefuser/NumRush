import {
  MatchState,
  Player,
  PlayerRanking,
  MatchResults,
  WrongClickPenalty,
} from '../types/index.js';

export const PLAYER_COLORS = [
  '#00F0FF', // Neon Cyan
  '#A855F7', // Electric Violet
  '#F59E0B', // Amber Flame
  '#10B981', // Emerald
  '#F43F5E', // Rose/Coral
  '#38BDF8', // Sky Blue
  '#EC4899', // Hot Pink
  '#84CC16', // Lime
  '#EAB308', // Gold
  '#6366F1', // Indigo
];

export class GameRules {
  /**
   * Calculates accuracy percentage rounded to 1 decimal place.
   * If total clicks are zero, returns 0.
   */
  public static calculateAccuracy(correct: number, wrong: number): number {
    const total = correct + wrong;
    if (total === 0) return 0;
    return Math.round((correct / total) * 1000) / 10;
  }

  /**
   * Assigns a player color based on player index in room
   */
  public static getPlayerColor(index: number): string {
    return PLAYER_COLORS[index % PLAYER_COLORS.length];
  }

  /**
   * Validates whether a claim is legally eligible to be evaluated
   */
  public static validateClaimEligibility(
    match: MatchState,
    playerId: string,
    actionId: string,
    now: number = Date.now()
  ): { eligible: boolean; reason?: string } {
    if (match.status !== 'RUNNING') {
      return { eligible: false, reason: 'Match is not in progress' };
    }

    if (now > match.endsAt) {
      return { eligible: false, reason: 'Match time has expired' };
    }

    if (!match.playerStats[playerId]) {
      return { eligible: false, reason: 'Player is not a participant in this match' };
    }

    // Check duplicate action
    const isDuplicate = match.claims.some((c) => c.actionId === actionId);
    if (isDuplicate) {
      return { eligible: false, reason: 'Duplicate action request ignored' };
    }

    return { eligible: true };
  }

  /**
   * Evaluates a click on a number.
   * Server receipt order is the authoritative tie-breaker.
   */
  public static processClick(
    match: MatchState,
    player: Player,
    clickedNumber: number,
    actionId: string,
    penaltyRule: WrongClickPenalty = 'NONE',
    now: number = Date.now()
  ): {
    isCorrect: boolean;
    alreadyClaimed: boolean;
    pointAwarded: boolean;
    penaltyApplied: boolean;
    isMatchFinished: boolean;
    reason?: string;
  } {
    const stats = match.playerStats[player.id];

    // Check if number was already claimed
    if (match.claimedMap[clickedNumber]) {
      stats.wrongClicks += 1;
      stats.accuracy = this.calculateAccuracy(stats.correctClicks, stats.wrongClicks);
      return {
        isCorrect: false,
        alreadyClaimed: true,
        pointAwarded: false,
        penaltyApplied: false,
        isMatchFinished: false,
        reason: `Number ${clickedNumber} has already been claimed`,
      };
    }

    // Check if clicked number matches the current active target
    if (clickedNumber !== match.currentTarget) {
      stats.wrongClicks += 1;
      let penaltyApplied = false;
      if (penaltyRule === 'SCORE' && stats.score > 0) {
        stats.score = Math.max(0, stats.score - 1);
        player.score = stats.score;
        penaltyApplied = true;
      }
      stats.accuracy = this.calculateAccuracy(stats.correctClicks, stats.wrongClicks);
      return {
        isCorrect: false,
        alreadyClaimed: false,
        pointAwarded: false,
        penaltyApplied,
        isMatchFinished: false,
        reason: `Wrong number! Current target is ${match.currentTarget}`,
      };
    }

    // CORRECT CLAIM!
    // Compute reaction time for this target
    const reactionTime = Math.max(0, now - match.lastClaimTimestamp);
    stats.correctClicks += 1;
    stats.score += 1;
    stats.claims.push(clickedNumber);
    stats.totalReactionTimeMs += reactionTime;
    stats.avgReactionTimeMs = Math.round(stats.totalReactionTimeMs / stats.correctClicks);
    stats.accuracy = this.calculateAccuracy(stats.correctClicks, stats.wrongClicks);

    player.score = stats.score;
    player.correctClicks = stats.correctClicks;

    const claimRecord = {
      number: clickedNumber,
      playerId: player.id,
      playerName: player.displayName,
      playerColor: player.color,
      serverClaimedAt: now,
      actionId,
    };

    match.claims.push(claimRecord);
    match.claimedMap[clickedNumber] = claimRecord;
    match.lastClaimTimestamp = now;

    // Advance current target
    match.currentTarget += 1;

    // Check if grid is complete
    const isGridComplete = match.currentTarget > match.maxTarget;
    let isMatchFinished = false;

    if (match.settings.gameMode === 'COMPLETE_GRID') {
      if (isGridComplete) {
        isMatchFinished = true;
        match.status = 'ENDED';
      }
    } else if (match.settings.gameMode === 'TIME_CHALLENGE') {
      if (isGridComplete) {
        isMatchFinished = true;
        match.status = 'ENDED';
      }
    }

    return {
      isCorrect: true,
      alreadyClaimed: false,
      pointAwarded: true,
      penaltyApplied: false,
      isMatchFinished,
    };
  }

  /**
   * Computes final results and rankings for a completed or expired match
   */
  public static computeResults(match: MatchState, players: Record<string, Player>): MatchResults {
    const rankings: PlayerRanking[] = Object.keys(match.playerStats).map((playerId) => {
      const stats = match.playerStats[playerId];
      const player = players[playerId] || {
        displayName: 'Player',
        color: '#00F0FF',
        isHost: false,
        isConnected: false,
      };

      return {
        rank: 0,
        playerId,
        displayName: player.displayName,
        avatarUrl: player.avatarUrl,
        color: player.color,
        score: stats.score,
        correctClicks: stats.correctClicks,
        wrongClicks: stats.wrongClicks,
        accuracy: stats.accuracy,
        avgReactionTimeMs: stats.avgReactionTimeMs,
        claimsCount: stats.claims.length,
        isHost: player.isHost,
        isConnected: player.isConnected,
      };
    });

    // Sorting rule:
    // 1. Higher score
    // 2. Higher accuracy
    // 3. Lower average reaction time
    rankings.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return a.avgReactionTimeMs - b.avgReactionTimeMs;
    });

    // Assign 1-indexed ranks (supporting ties)
    let currentRank = 1;
    for (let i = 0; i < rankings.length; i++) {
      if (i > 0) {
        const prev = rankings[i - 1];
        const curr = rankings[i];
        if (
          curr.score === prev.score &&
          curr.accuracy === prev.accuracy &&
          curr.avgReactionTimeMs === prev.avgReactionTimeMs
        ) {
          curr.rank = prev.rank;
        } else {
          curr.rank = i + 1;
        }
      } else {
        rankings[i].rank = 1;
      }
      currentRank = rankings[i].rank;
    }

    const winner = rankings.length > 0 && rankings[0].score > 0 ? rankings[0] : null;
    const isTie = rankings.length > 1 && rankings[0].score > 0 && rankings[0].score === rankings[1].score;

    const totalNumbers = match.maxTarget - match.settings.numberRange.min + 1;
    const claimedNumbers = match.claims.length;
    const durationSeconds = Math.round((Math.min(Date.now(), match.endsAt) - match.startedAt) / 1000);

    return {
      matchId: match.id,
      roomId: match.roomId,
      gameMode: match.settings.gameMode,
      numberRange: match.settings.numberRange,
      totalNumbers,
      claimedNumbers,
      durationSeconds: Math.max(0, durationSeconds),
      startedAt: match.startedAt,
      endedAt: Date.now(),
      winner,
      isTie,
      rankings,
    };
  }
}
