# NumRush - Database Schema & Supabase Integration

NumRush utilizes a relational schema optimized for multiplayer rooms, matches, real-time claims, and persistent player statistics. It is fully compatible with **Supabase managed PostgreSQL** and standard self-hosted PostgreSQL.

The schema script is located at: `server/migrations/001_initial_schema.sql`.

---

## 1. Tables Overview

### `profiles`
Stores persistent player account identities.
- `id` (TEXT, PK): Unique player/user ID.
- `display_name` (VARCHAR(50)): Player chosen name.
- `avatar_url` (TEXT): Optional profile avatar link.
- `created_at` (TIMESTAMPTZ): Profile creation timestamp.
- `updated_at` (TIMESTAMPTZ): Last updated timestamp.

### `rooms`
Tracks active and archived multiplayer lobbies.
- `id` (UUID, PK): Unique internal room identifier.
- `room_code` (VARCHAR(16), UNIQUE): 5-character formatted code (e.g. `NR-7K2P9`).
- `host_player_id` (TEXT): Currently assigned host player.
- `status` (VARCHAR(20)): Room state (`WAITING`, `COUNTDOWN`, `PLAYING`, `FINISHED`, `EXPIRED`).
- `settings` (JSONB): Room rules (number range, mode, duration, player limit, penalties).
- `created_at` (TIMESTAMPTZ): Created timestamp.
- `expires_at` (TIMESTAMPTZ): Authoritative room expiration (default 24h).

### `matches`
Stores individual match sessions played inside a room.
- `id` (UUID, PK): Match session ID.
- `room_id` (UUID, FK -> rooms.id): Associated room.
- `status` (VARCHAR(20)): Match state (`COUNTDOWN`, `RUNNING`, `ENDED`).
- `number_range` (JSONB): Range `{ min: 1, max: 150 }`.
- `shuffled_grid` (JSONB): Exact Fisher-Yates array sent to all players.
- `current_target` (INTEGER): Final or current active target integer.
- `game_mode` (VARCHAR(30)): `TIME_CHALLENGE` or `COMPLETE_GRID`.
- `started_at` (TIMESTAMPTZ): Official match start time.
- `ended_at` (TIMESTAMPTZ): Official completion time.
- `final_results` (JSONB): Serialized full rankings, scores, and statistics.

### `match_players`
Individual player records and stats per match.
- `id` (UUID, PK).
- `match_id` (UUID, FK -> matches.id).
- `player_id` (TEXT).
- `score` (INTEGER): Points earned.
- `correct_clicks` (INTEGER): Count of targets claimed.
- `wrong_clicks` (INTEGER): Mistakes made.
- `accuracy` (NUMERIC(5,2)): `(correct / (correct + wrong)) * 100`.
- `avg_reaction_time_ms` (INTEGER): Average speed in milliseconds per target.
- `rank` (INTEGER): Final podium rank.
- `joined_at` / `disconnected_at` (TIMESTAMPTZ).

### `claims`
Audit trail of valid target claims.
- `id` (UUID, PK).
- `match_id` (UUID, FK -> matches.id).
- `player_id` (TEXT): Winning claimant.
- `number_claimed` (INTEGER): Target number claimed.
- `server_claimed_at` (TIMESTAMPTZ): Server timestamp.
- `action_id` (VARCHAR(128), UNIQUE): Unique client action token preventing duplication.
- Unique constraint: `(match_id, number_claimed)` guarantees that a number can never be claimed more than once.

### `player_stats`
Aggregated player hall-of-fame statistics for global leaderboards.
- `player_id` (TEXT, PK).
- `display_name` (VARCHAR(50)).
- `total_matches` (INTEGER).
- `wins` (INTEGER).
- `losses` (INTEGER).
- `total_points` (INTEGER).
- `best_score` (INTEGER).
- `avg_accuracy` (NUMERIC(5,2)).
- `avg_reaction_time_ms` (INTEGER).
- `last_played_at` (TIMESTAMPTZ).

---

## 2. Row Level Security (RLS)
The migration file configures Row Level Security policies:
- Profiles, Leaderboards, and Rooms have public read permissions enabled.
- Write operations are restricted through the server backend using the Supabase Service Role key, ensuring malicious clients cannot forge scores or manipulate records directly.

---

## 3. Database Migration Execution
To execute migrations against your Supabase or PostgreSQL instance:

```bash
# In the server directory with DATABASE_URL or SUPABASE credentials configured:
npm run build
npm start
```
The server automatically applies `001_initial_schema.sql` on startup when `DATABASE_URL` is set, or you can paste `server/migrations/001_initial_schema.sql` into the Supabase SQL Editor.
