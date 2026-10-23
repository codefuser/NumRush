import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager } from '../src/game/RoomManager.js';

describe('Multiplayer & Concurrency Race Condition Integration Tests', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  it('should generate valid formatted room codes and create room', () => {
    const { room, player } = roomManager.createRoom('socket-host', {
      displayName: 'HostAlice',
      settings: {
        numberRange: { min: 1, max: 100 },
        playerLimit: 4,
        countdownSeconds: 5,
        gameMode: 'COMPLETE_GRID',
      },
    });

    expect(room.roomCode).toMatch(/^NR-[2-9A-Z]{5}$/);
    expect(player.isHost).toBe(true);
    expect(player.displayName).toBe('HostAlice');
    expect(room.status).toBe('WAITING');
  });

  it('should enforce player capacity limits', () => {
    const { room } = roomManager.createRoom('sock-h', {
      displayName: 'Host',
      settings: { playerLimit: 2 },
    });

    // Player 2 joins (capacity 2 of 2 reached)
    const join2 = roomManager.joinRoom('sock-p2', {
      roomCode: room.roomCode,
      displayName: 'Bob',
    });
    expect(join2.success).toBe(true);

    // Player 3 tries to join -> rejected
    const join3 = roomManager.joinRoom('sock-p3', {
      roomCode: room.roomCode,
      displayName: 'Charlie',
    });
    expect(join3.success).toBe(false);
    expect(join3.error).toContain('full');
  });

  it('CRITICAL TEST: 4 players click the same target simultaneously - exactly ONE wins point', async () => {
    // 1. Host creates room
    const { room, player: host } = roomManager.createRoom('socket-1', {
      displayName: 'Alice',
      settings: {
        numberRange: { min: 1, max: 50 },
        playerLimit: 4,
        countdownSeconds: 5,
        gameMode: 'COMPLETE_GRID',
      },
    });

    // 2. Three other players join
    const p2Res = roomManager.joinRoom('socket-2', { roomCode: room.roomCode, displayName: 'Bob' });
    const p3Res = roomManager.joinRoom('socket-3', { roomCode: room.roomCode, displayName: 'Charlie' });
    const p4Res = roomManager.joinRoom('socket-4', { roomCode: room.roomCode, displayName: 'Diana' });

    expect(p2Res.success).toBe(true);
    expect(p3Res.success).toBe(true);
    expect(p4Res.success).toBe(true);

    const p2 = p2Res.player!;
    const p3 = p3Res.player!;
    const p4 = p4Res.player!;

    // 3. Mark non-host players ready
    roomManager.setPlayerReady(room.id, p2.id, true);
    roomManager.setPlayerReady(room.id, p3.id, true);
    roomManager.setPlayerReady(room.id, p4.id, true);

    // 4. Host starts game
    const startRes = roomManager.startGame(room.id, host.id);
    expect(startRes.success).toBe(true);
    expect(room.currentMatch).toBeDefined();

    // Fast-forward match state to RUNNING
    const match = room.currentMatch!;
    match.status = 'RUNNING';
    match.endsAt = Date.now() + 60000;
    room.status = 'PLAYING';

    expect(match.currentTarget).toBe(1);

    // 5. SIMULTANEOUS CLAIMS: All 4 players click number 1 concurrently!
    const results = await Promise.all([
      roomManager.submitClaim('socket-1', room.id, match.id, 1, 'act-alice-1'),
      roomManager.submitClaim('socket-2', room.id, match.id, 1, 'act-bob-1'),
      roomManager.submitClaim('socket-3', room.id, match.id, 1, 'act-charlie-1'),
      roomManager.submitClaim('socket-4', room.id, match.id, 1, 'act-diana-1'),
    ]);

    // Count successful claims
    const successfulClaims = results.filter((r) => r.success);
    const failedClaims = results.filter((r) => !r.success);

    // EXACTLY 1 claim must succeed
    expect(successfulClaims.length).toBe(1);
    // EXACTLY 3 claims must fail
    expect(failedClaims.length).toBe(3);

    // Target must advance to 2 ONCE
    expect(match.currentTarget).toBe(2);

    // Total points awarded across all players must equal 1
    const totalScore = Object.values(room.players).reduce((sum, p) => sum + p.score, 0);
    expect(totalScore).toBe(1);

    // The claimed map must contain exactly 1 entry for number 1
    expect(match.claims.length).toBe(1);
    expect(match.claimedMap[1]).toBeDefined();
  });

  it('should migrate host to next connected player when host disconnects', () => {
    const { room, player: host } = roomManager.createRoom('socket-host', {
      displayName: 'AliceHost',
      settings: { playerLimit: 4 },
    });

    const joinRes = roomManager.joinRoom('socket-bob', {
      roomCode: room.roomCode,
      displayName: 'BobGuest',
    });
    const bob = joinRes.player!;

    expect(room.hostId).toBe(host.id);

    // Host disconnects
    const disconnectRes = roomManager.handleDisconnect('socket-host');
    expect(disconnectRes.newHostId).toBe(bob.id);
    expect(room.hostId).toBe(bob.id);
    expect(bob.isHost).toBe(true);
  });
});
