-- ====================================================================
-- NumRush Multiplayer Game - Initial Database Schema
-- Compatible with Supabase / PostgreSQL
-- ====================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  display_name VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(16) NOT NULL UNIQUE,
  host_player_id TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- 3. Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'COUNTDOWN',
  number_range JSONB NOT NULL,
  shuffled_grid JSONB NOT NULL,
  current_target INTEGER NOT NULL DEFAULT 1,
  game_mode VARCHAR(30) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  final_results JSONB
);

CREATE INDEX IF NOT EXISTS idx_matches_room_id ON matches(room_id);

-- 4. Match Players Table
CREATE TABLE IF NOT EXISTS match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  correct_clicks INTEGER NOT NULL DEFAULT 0,
  wrong_clicks INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC(5, 2) NOT NULL DEFAULT 0,
  avg_reaction_time_ms INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 1,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ,
  CONSTRAINT uq_match_player UNIQUE(match_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_match_players_player_id ON match_players(player_id);

-- 5. Claims Table
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  number_claimed INTEGER NOT NULL,
  server_claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action_id VARCHAR(128) NOT NULL,
  CONSTRAINT uq_claim_action UNIQUE(match_id, action_id),
  CONSTRAINT uq_claim_number UNIQUE(match_id, number_claimed)
);

CREATE INDEX IF NOT EXISTS idx_claims_match_id ON claims(match_id);

-- 6. Persistent Player Statistics Table
CREATE TABLE IF NOT EXISTS player_stats (
  player_id TEXT PRIMARY KEY,
  display_name VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  total_matches INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  avg_accuracy NUMERIC(5, 2) NOT NULL DEFAULT 0,
  avg_reaction_time_ms INTEGER NOT NULL DEFAULT 0,
  last_played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security Policies (for Supabase)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Allow public read access to public profiles & leaderboards
CREATE POLICY IF NOT EXISTS "Allow public read on profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read on player_stats" ON player_stats FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read on matches" ON matches FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read on rooms" ON rooms FOR SELECT USING (true);
