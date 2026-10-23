import { describe, it, expect } from 'vitest';
import { GridGenerator } from '../src/game/GridGenerator.js';
import { GameRules } from '../src/game/GameRules.js';
import { MatchState, Player } from '../src/types/index.js';

describe('GridGenerator Unit Tests', () => {
  it('should validate range constraints correctly', () => {
    expect(GridGenerator.validateRange({ min: 1, max: 150 }).valid).toBe(true);
    expect(GridGenerator.validateRange({ min: 0, max: 150 }).valid).toBe(false);
    expect(GridGenerator.validateRange({ min: 100, max: 50 }).valid).toBe(false);
    expect(GridGenerator.validateRange({ min: 1, max: 4 }).valid).toBe(false); // under min count
    expect(GridGenerator.validateRange({ min: 1, max: 1000 }, 500).valid).toBe(false); // over max limit
  });

  it('should generate a sequence containing every integer in range', () => {
    const seq = GridGenerator.generateSequence(1, 100);
    expect(seq.length).toBe(100);
    expect(seq[0]).toBe(1);
    expect(seq[99]).toBe(100);
  });

  it('should produce an unbiased shuffle with zero duplicates', () => {
    const range = { min: 1, max: 150 };
    const grid = GridGenerator.generateShuffledGrid(range);
    expect(grid.length).toBe(150);
    expect(GridGenerator.verifyGridIntegrity(grid, range)).toBe(true);

    // Verify it is shuffled (not identical to raw sequence)
    const raw = GridGenerator.generateSequence(1, 150);
    let differences = 0;
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] !== raw[i]) differences++;
    }
    expect(differences).toBeGreaterThan(120);
  });
});

describe('GameRules Unit Tests', () => {
  it('should calculate accuracy accurately and handle zero clicks without dividing by zero', () => {
    expect(GameRules.calculateAccuracy(0, 0)).toBe(0);
    expect(GameRules.calculateAccuracy(10, 0)).toBe(100);
    expect(GameRules.calculateAccuracy(5, 5)).toBe(50);
    expect(GameRules.calculateAccuracy(1, 2)).toBe(33.3);
  });

  it('should reject claim if match is not running or timer expired', () => {
    const mockMatch: Partial<MatchState> = {
      status: 'COUNTDOWN',
      endsAt: Date.now() + 60000,
      playerStats: { p1: { score: 0, correctClicks: 0, wrongClicks: 0, totalReactionTimeMs: 0, avgReactionTimeMs: 0, accuracy: 0, claims: [] } },
      claims: [],
    };

    const res = GameRules.validateClaimEligibility(mockMatch as MatchState, 'p1', 'act-1', Date.now());
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain('not in progress');
  });

  it('should award point on correct target, advance target, and reject wrong target', () => {
    const mockPlayer: Player = {
      id: 'p1',
      socketId: 'sock1',
      displayName: 'Alice',
      color: '#00F0FF',
      isHost: true,
      isReady: true,
      isConnected: true,
      score: 0,
      correctClicks: 0,
      wrongClicks: 0,
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    const mockMatch: MatchState = {
      id: 'm1',
      roomId: 'r1',
      status: 'RUNNING',
      settings: {
        numberRange: { min: 1, max: 50 },
        playerLimit: 4,
        countdownSeconds: 5,
        gameMode: 'COMPLETE_GRID',
        durationSeconds: 180,
        isPrivate: false,
        wrongClickPenalty: 'NONE',
        allowSpectators: false,
        allowLateJoin: false,
        soundEnabled: true,
      },
      shuffledGrid: GridGenerator.generateShuffledGrid({ min: 1, max: 50 }),
      currentTarget: 1,
      maxTarget: 50,
      startedAt: Date.now() - 5000,
      countdownEndsAt: Date.now() - 5000,
      endsAt: Date.now() + 60000,
      claims: [],
      claimedMap: {},
      playerStats: {
        p1: {
          score: 0,
          correctClicks: 0,
          wrongClicks: 0,
          totalReactionTimeMs: 0,
          avgReactionTimeMs: 0,
          accuracy: 0,
          claims: [],
        },
      },
      lastClaimTimestamp: Date.now() - 5000,
    };

    // Click wrong number (2 instead of 1)
    const wrongClick = GameRules.processClick(mockMatch, mockPlayer, 2, 'act-wrong', 'NONE');
    expect(wrongClick.isCorrect).toBe(false);
    expect(wrongClick.pointAwarded).toBe(false);
    expect(mockMatch.currentTarget).toBe(1); // target did not advance!
    expect(mockMatch.playerStats['p1'].wrongClicks).toBe(1);

    // Click correct number (1)
    const correctClick = GameRules.processClick(mockMatch, mockPlayer, 1, 'act-1', 'NONE');
    expect(correctClick.isCorrect).toBe(true);
    expect(correctClick.pointAwarded).toBe(true);
    expect(mockMatch.currentTarget).toBe(2); // target advanced to 2!
    expect(mockMatch.playerStats['p1'].score).toBe(1);
    expect(mockMatch.claimedMap[1]).toBeDefined();

    // Click same number again (already claimed)
    const repeatClick = GameRules.processClick(mockMatch, mockPlayer, 1, 'act-repeat', 'NONE');
    expect(repeatClick.isCorrect).toBe(false);
    expect(repeatClick.alreadyClaimed).toBe(true);
    expect(mockMatch.playerStats['p1'].score).toBe(1); // score unchanged!
  });
});
