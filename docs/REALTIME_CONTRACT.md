# NumRush - Real-Time Socket.IO Event Contract

This document specifies the bidirectional Socket.IO protocol used between the NumRush client (Web and Android APK) and the backend server.

---

## 1. Client-to-Server Events

| Event Name | Payload | Description |
|------------|---------|-------------|
| `room:create` | `{ displayName, userId, settings }` | Creates a new room with custom rules. Registers sender as host. |
| `room:join` | `{ roomCode, displayName, userId, password? }` | Joins an existing lobby by code or invite token. |
| `room:updateSettings` | `{ roomId, settings }` | Host modifies room settings before match start. |
| `room:ready` | `{ roomId, isReady }` | Toggles player readiness. |
| `room:start` | `{ roomId }` | Host triggers countdown start (verified against readiness). |
| `room:leave` | `{ roomId }` | Player gracefully exits the room. |
| `room:kick` | `{ roomId, targetPlayerId }` | Host removes a player from the room before start. |
| `game:claimNumber` | `{ roomId, matchId, number, actionId, clientTimestamp }` | Player attempts to claim a number. Atomically serialized on the server. |
| `game:playAgain` | `{ roomId }` | Host triggers a fresh match round with a new shuffled grid. |
| `game:requestSnapshot` | `{ roomId, userId? }` | Reconnecting client requests authoritative state recovery. |
| `player:heartbeat` | `{ roomId, userId }` | Periodic heartbeat keeping session active. |

---

## 2. Server-to-Client Events

| Event Name | Payload | Description |
|------------|---------|-------------|
| `room:created` | `{ success, room, player }` | Emitted to creator upon successful room generation. |
| `room:joined` | `{ success, room, player }` | Emitted to joiner upon entering room. |
| `room:playerJoined` | `{ player, playerCount }` | Broadcast to all room members when a new player connects. |
| `room:playerLeft` | `{ playerId, remainingCount }` | Broadcast when a player leaves. |
| `room:playerReadyUpdated` | `{ playerId, isReady }` | Broadcast when any player toggles ready. |
| `room:settingsUpdated` | `{ settings }` | Broadcast when host updates settings. |
| `room:hostMigrated` | `{ previousHostId, newHostId, newHostName }` | Broadcast when host disconnects and privileges transfer. |
| `room:kicked` | `{ reason }` | Sent directly to a kicked player. |
| `room:error` | `{ message }` | Sent on validation or state errors. |
| `game:countdown` | `{ countdownSeconds, currentTarget, maxTarget }` | Broadcast when host starts match. |
| `game:countdownTick` | `{ remaining }` | Broadcast every second of countdown. |
| `game:started` | `{ matchId, shuffledGrid, currentTarget, maxTarget, endsAt }` | Official match launch. Distributes shuffled grid. |
| `game:numberClaimed` | `{ number, claimedBy: { playerId, displayName, color }, nextTarget, scores, serverClaimedAt }` | Emitted to all clients when a claim is won. |
| `game:claimRejected` | `{ number, reason, currentTarget }` | Sent exclusively to the player who misclicked or lost a race. |
| `game:playerStatsUpdated`| `{ playerId, score, correctClicks, wrongClicks, accuracy }` | Updates live leaderboard statistics. |
| `game:timerUpdated` | `{ remainingSeconds, serverTime, endsAt }` | Periodic clock synchronization tick. |
| `game:finished` | `{ results: MatchResults, reason }` | Authoritative match conclusion with rankings and stats. |
| `game:stateSnapshot` | `{ success, room, currentMatch, yourPlayer, serverTime }` | Complete game snapshot restoring client after disconnect. |
| `room:playAgainReady` | `{ room }` | Broadcast when host resets room for another match. |

---

## 3. Concurrency & Race Condition Resolution
When multiple players click the same target number (e.g. Target 27):
1. Both client requests hit the server socket interface.
2. The requests enter `RoomManager.enqueueRoomOperation(roomId, ...)`.
3. The promise queue processes **Request A**:
   - `currentTarget === 27` (True).
   - Validates claim, awards point to Player A, sets `currentTarget = 28`, marks 27 in `claimedMap`.
   - Broadcasts `game:numberClaimed` (27 claimed by Player A, next target 28).
4. The promise queue immediately processes **Request B**:
   - `currentTarget === 28` (Target has already advanced!).
   - Detects `27 in claimedMap` -> Rejected (`"Number 27 has already been claimed"`).
   - Emits private `game:claimRejected` to Player B.
5. Result: Exactly one winner, exactly one point awarded, target advances once, verified by automated concurrency tests.
