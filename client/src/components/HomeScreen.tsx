import React, { useState, useEffect } from 'react';
import {
  Plus,
  LogIn,
  Gamepad2,
  Trophy,
  HelpCircle,
  Play,
  RotateCcw,
  Users,
  Clock,
  Sparkles,
  Zap,
  Target,
  Edit2,
  Check,
  Flame,
} from 'lucide-react';
import { socketService } from '../services/socket.js';
import type { ActiveSessionData } from '../services/socket.js';
import { api } from '../services/api.js';
import type { PersistentPlayerStats } from '../types/index.js';

interface HomeScreenProps {
  displayName: string;
  userId: string;
  onUpdateDisplayName: (name: string) => void;
  onOpenCreateModal: () => void;
  onOpenJoinModal: (code?: string) => void;
  onOpenPractice: () => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
  onResumeActiveSession: (session: ActiveSessionData) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  displayName,
  userId,
  onUpdateDisplayName,
  onOpenCreateModal,
  onOpenJoinModal,
  onOpenPractice,
  onOpenLeaderboard,
  onOpenProfile,
  onResumeActiveSession,
}) => {
  const [activeSession, setActiveSession] = useState<ActiveSessionData | null>(null);
  const [playerStats, setPlayerStats] = useState<PersistentPlayerStats | null>(null);
  const [publicRooms, setPublicRooms] = useState<any[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(displayName);

  useEffect(() => {
    // Check local storage for active game session
    const session = socketService.getActiveSession();
    setActiveSession(session);

    // Fetch user stats
    api.getProfile(userId).then((stats) => {
      if (stats) setPlayerStats(stats);
    });

    // Fetch open public rooms
    api.getActiveRooms().then((res) => {
      if (res && res.rooms) setPublicRooms(res.rooms);
    });
  }, [userId]);

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (!trimmed) return;
    onUpdateDisplayName(trimmed);
    api.updateProfile(userId, trimmed);
    setIsEditingName(false);
  };

  const winRate =
    playerStats && playerStats.totalMatches > 0
      ? Math.round((playerStats.wins / playerStats.totalMatches) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* 1. Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel-glow p-8 sm:p-12 text-center sm:text-left border border-cyan-500/30">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-4">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real-Time Multiplayer Visual-Memory Competition</span>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tight leading-none mb-4">
              SPOT. MEMORIZE.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500">
                STRIKE FIRST.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 max-w-xl">
              Race sequential numbers in a shared shuffled grid. The fastest eye and sharpest memory wins every target.
            </p>

            {/* Main Action Buttons in Hero */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-8">
              <button
                onClick={onOpenCreateModal}
                className="px-8 py-4 rounded-2xl font-display font-extrabold text-base text-black bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-400 hover:opacity-95 shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all tap-effect flex items-center gap-2"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                Create New Match
              </button>

              <button
                onClick={() => onOpenJoinModal()}
                className="px-8 py-4 rounded-2xl font-display font-extrabold text-base text-white bg-surface-light hover:bg-gray-700/80 border border-gray-700 hover:border-cyan-400 transition-all tap-effect flex items-center gap-2"
              >
                <LogIn className="w-5 h-5 text-cyan-400" />
                Join Room
              </button>
            </div>
          </div>

          {/* Graphic Icon Artwork */}
          <div className="hidden lg:flex flex-col items-center justify-center">
            <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-purple-500/10 to-transparent p-6 border border-cyan-500/30 shadow-[0_0_50px_rgba(0,240,255,0.2)] flex items-center justify-center">
              <img src="/logo.svg" alt="NumRush" className="w-36 h-36 drop-shadow-[0_0_20px_rgba(0,240,255,0.8)] animate-pulse-glow" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Active Session Banner (if existing room) */}
      {activeSession && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-purple-500/20 border-2 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.25)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-amber-500/30 text-amber-300">
              <RotateCcw className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-white">
                  Active Match Detected: {activeSession.roomCode}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  RECONNECT READY
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                You were participating in this room. Click below to reconnect and restore your grid.
              </p>
            </div>
          </div>

          <button
            onClick={() => onResumeActiveSession(activeSession)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-display font-bold text-sm text-black bg-amber-400 hover:bg-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all tap-effect"
          >
            Resume Room
          </button>
        </div>
      )}

      {/* 3. Player Summary Card & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Player Profile Summary */}
        <div className="glass-panel rounded-3xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-mono text-cyan-400 tracking-wider">
              Hunter Profile
            </span>
            <button
              onClick={onOpenProfile}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              View Full →
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center font-display font-black text-2xl text-black shadow-md flex-shrink-0">
              {displayName.slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    maxLength={20}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full bg-black/60 border border-cyan-400 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 rounded-lg bg-cyan-400 text-black hover:bg-cyan-300"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xl text-white truncate">
                    {displayName}
                  </span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-gray-500 hover:text-cyan-400"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <span className="text-xs text-gray-400 font-mono">
                {playerStats?.totalMatches ?? 0} Total Games
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-surface-light/40 border border-gray-800/80">
              <span className="text-[10px] text-gray-400 uppercase font-mono block">Wins</span>
              <span className="font-display font-bold text-base text-amber-300">
                {playerStats?.wins ?? 0}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-light/40 border border-gray-800/80">
              <span className="text-[10px] text-gray-400 uppercase font-mono block">Win Rate</span>
              <span className="font-display font-bold text-base text-cyan-400">
                {winRate}%
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-light/40 border border-gray-800/80">
              <span className="text-[10px] text-gray-400 uppercase font-mono block">Best Pts</span>
              <span className="font-display font-bold text-base text-purple-300">
                {playerStats?.bestScore ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Center & Right: Feature Action Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Practice Mode Card */}
          <div
            onClick={onOpenPractice}
            className="p-6 rounded-3xl glass-panel border border-gray-800 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] transition-all cursor-pointer group tap-effect"
          >
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 w-fit mb-4 group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-white mb-1">
              Practice Solo Mode
            </h3>
            <p className="text-xs text-gray-400">
              Train your scanning speed and peripheral visual memory with flexible range sizes.
            </p>
          </div>

          {/* Global Leaderboard Card */}
          <div
            onClick={onOpenLeaderboard}
            className="p-6 rounded-3xl glass-panel border border-gray-800 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all cursor-pointer group tap-effect"
          >
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 w-fit mb-4 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-white mb-1">
              Hall of Fame
            </h3>
            <p className="text-xs text-gray-400">
              Check out world rankings, top player win rates, and highest scores.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Open Public Rooms Browser */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display font-bold text-xl text-white">Open Matchmaking Rooms</h2>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {publicRooms.length} {publicRooms.length === 1 ? 'room' : 'rooms'} active
          </span>
        </div>

        {publicRooms.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No public rooms currently waiting. Click <strong>Create New Match</strong> above to host one!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {publicRooms.map((room) => (
              <div
                key={room.id}
                className="p-4 rounded-2xl bg-surface-light/40 border border-gray-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-bold text-sm text-cyan-300">
                      {room.roomCode}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                      {room.playerCount}/{room.playerLimit} Players
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Range: 1–{room.numberRange.max}</div>
                    <div>Mode: {room.gameMode === 'TIME_CHALLENGE' ? 'Time Challenge' : 'Complete Grid'}</div>
                  </div>
                </div>

                <button
                  onClick={() => onOpenJoinModal(room.roomCode)}
                  className="mt-4 w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-colors tap-effect"
                >
                  Join Match
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
