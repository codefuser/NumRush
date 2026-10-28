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

  it('should preserve player and allow reconnection during active match', async () => {
    const { room, player: host } = roomManager.createRoom('socket-host', {
      displayName: 'HostAlice',
      userId: 'user-alice',
      settings: { numberRange: { min: 1, max: 20 }, gameMode: 'COMPLETE_GRID' },
    });

    const joinRes = roomManager.joinRoom('socket-bob', {
      roomCode: room.roomCode,
      displayName: 'BobGuest',
      userId: 'user-bob',
    });
    const bob = joinRes.player!;
    roomManager.setPlayerReady(room.id, bob.id, true);

    // Start game
    roomManager.startGame(room.id, host.id);
    room.status = 'PLAYING';
    room.currentMatch!.status = 'RUNNING';

    // Bob disconnects/leaves mid-match
    roomManager.leaveRoom(room.id, bob.id);

    // Bob should still be in room.players as disconnected (not deleted)
    expect(room.players[bob.id]).toBeDefined();
    expect(room.players[bob.id].isConnected).toBe(false);

    // Bob reconnects with new socket ID
    const reconnRes = roomManager.reconnectPlayer('socket-bob-new', room.id, bob.id);
    expect(reconnRes.success).toBe(true);
    expect(reconnRes.player!.isConnected).toBe(true);
    expect(reconnRes.player!.socketId).toBe('socket-bob-new');

    // Bob claims current target 1
    const claimRes = await roomManager.submitClaim('socket-bob-new', room.id, room.currentMatch!.id, 1, 'act-bob-1');
    expect(claimRes.success).toBe(true);
    expect(room.currentMatch!.currentTarget).toBe(2);
  });

  it('should create COMPLETE_GRID room with durationSeconds 0 (unlimited) and allow claims indefinitely', async () => {
    const { room, player: host } = roomManager.createRoom('socket-host-cg', {
      displayName: 'AliceGrid',
      userId: 'user-alice-cg',
      settings: { numberRange: { min: 1, max: 10 }, gameMode: 'COMPLETE_GRID' },
    });

    // Default duration for COMPLETE_GRID should be 0 (unlimited time)
    expect(room.settings.durationSeconds).toBe(0);

    const startRes = roomManager.startGame(room.id, host.id);
    expect(startRes.success).toBe(true);
    expect(room.currentMatch!.settings.durationSeconds).toBe(0);

    // Fast-forward simulation: Even if 400 seconds (longer than standard 180s) have passed
    room.status = 'PLAYING';
    room.currentMatch!.status = 'RUNNING';
    room.currentMatch!.startedAt = Date.now() - 400 * 1000;

    const claimRes = await roomManager.submitClaim(
      'socket-host-cg',
      room.id,
      room.currentMatch!.id,
      1,
      'act-host-cg-1'
    );

    expect(claimRes.success).toBe(true);
    expect(room.currentMatch!.currentTarget).toBe(2);
  });

  it('should restore Host status to original creator when they rejoin after disconnect', () => {
    // 1. Host creates room
    const { room, player: originalHost } = roomManager.createRoom('sock-host-1', {
      displayName: 'CreatorHost',
      userId: 'user-creator',
      settings: { playerLimit: 2 },
    });

    expect(room.creatorId).toBe('user-creator');
    expect(room.hostId).toBe('user-creator');
    expect(originalHost.isHost).toBe(true);

    // 2. Player 2 joins
    const join2 = roomManager.joinRoom('sock-p2', {
      roomCode: room.roomCode,
      displayName: 'PlayerTwo',
      userId: 'user-p2',
    });
    expect(join2.success).toBe(true);
    const p2 = join2.player!;
    expect(p2.isHost).toBe(false);

    // 3. Host disconnects -> Host temporarily migrates to Player 2
    roomManager.handleDisconnect('sock-host-1');
    expect(room.hostId).toBe('user-p2');
    expect(p2.isHost).toBe(true);

    // 4. Original Creator Host returns / rejoins
    const returnJoin = roomManager.joinRoom('sock-host-rejoin', {
      roomCode: room.roomCode,
      displayName: 'CreatorHost',
      userId: 'user-creator',
    });

    expect(returnJoin.success).toBe(true);
    // Host role MUST be restored to original creator!
    expect(room.hostId).toBe('user-creator');
    expect(returnJoin.player!.isHost).toBe(true);
    expect(p2.isHost).toBe(false);
  });

  it('should reserve slot on temporary leave (rejoin later) and free slot on permanent leave', () => {
    // Room with capacity of 3
    const { room } = roomManager.createRoom('sock-h', {
      displayName: 'Host',
      userId: 'user-h',
      settings: { playerLimit: 3 },
    });

    // P2 and P3 join (Room full: 3/3)
    roomManager.joinRoom('sock-p2', { roomCode: room.roomCode, displayName: 'P2', userId: 'user-p2' });
    roomManager.joinRoom('sock-p3', { roomCode: room.roomCode, displayName: 'P3', userId: 'user-p3' });

    // P3 leaves with "Rejoin Later" (permanent: false)
    roomManager.leaveRoom(room.id, 'user-p3', false);
    expect(room.players['user-p3'].isReserved).toBe(true);
    expect(room.players['user-p3'].isConnected).toBe(false);

    // Outsider P4 tries to join -> REJECTED because P3's spot is reserved!
    const join4 = roomManager.joinRoom('sock-p4', { roomCode: room.roomCode, displayName: 'P4', userId: 'user-p4' });
    expect(join4.success).toBe(false);
    expect(join4.error).toContain('full');

    // P3 rejoins into their reserved spot
    const p3Rejoin = roomManager.joinRoom('sock-p3-new', { roomCode: room.roomCode, displayName: 'P3', userId: 'user-p3' });
    expect(p3Rejoin.success).toBe(true);
    expect(p3Rejoin.player!.isReserved).toBe(false);

    // Now P3 leaves PERMANENTLY (permanent: true)
    roomManager.leaveRoom(room.id, 'user-p3', true);
    expect(room.players['user-p3']).toBeUndefined();

    // Now outsider P4 CAN join because the slot is freed!
    const join4After = roomManager.joinRoom('sock-p4', { roomCode: room.roomCode, displayName: 'P4', userId: 'user-p4' });
    expect(join4After.success).toBe(true);
    expect(join4After.player!.id).toBe('user-p4');
  });
});
