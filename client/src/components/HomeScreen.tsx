import React, { useState, useEffect } from 'react';
import {
  Plus,
  LogIn,
  Trophy,
  RotateCcw,
  Users,
  Target,
  Edit2,
  Check,
  Sparkles,
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
    const session = socketService.getActiveSession();
    setActiveSession(session);

    api.getProfile(userId).then((stats) => {
      if (stats) setPlayerStats(stats);
    });

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
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* 1. Mobile Game Hero Banner */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#111c33] via-[#0d1527] to-[#0B0F19] p-4 sm:p-6 border border-cyan-500/30 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono mb-2">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Multiplayer Visual-Memory Hunt</span>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight leading-tight">
              SPOT.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-400">
                STRIKE FIRST.
              </span>
            </h1>

            <p className="text-xs text-gray-300 mt-1 max-w-md mx-auto sm:mx-0">
              Find sequential numbers in a shared shuffled grid. First player to spot each target gets the point!
            </p>

            {/* Quick Play Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={onOpenCreateModal}
                className="py-3 px-3 rounded-xl font-display font-black text-xs sm:text-sm text-black bg-gradient-to-r from-cyan-400 to-purple-400 hover:opacity-95 shadow-md flex items-center justify-center gap-1.5 tap-effect"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Create Match
              </button>

              <button
                onClick={() => onOpenJoinModal()}
                className="py-3 px-3 rounded-xl font-display font-black text-xs sm:text-sm text-white bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-cyan-400 flex items-center justify-center gap-1.5 tap-effect"
              >
                <LogIn className="w-4 h-4 text-cyan-400" />
                Join Room
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Active Session Card (If reconnecting) */}
      {activeSession && (
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/60 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <RotateCcw className="w-5 h-5 text-amber-400 flex-shrink-0 animate-spin-slow" />
            <div className="truncate">
              <div className="font-bold text-xs text-white truncate">
                Active Room: {activeSession.roomCode}
              </div>
              <span className="text-[10px] text-amber-200/80">Click to resume gameplay</span>
            </div>
          </div>

          <button
            onClick={() => onResumeActiveSession(activeSession)}
            className="px-4 py-2 rounded-xl font-display font-bold text-xs text-black bg-amber-400 hover:bg-amber-300 flex-shrink-0 tap-effect"
          >
            Resume
          </button>
        </div>
      )}

      {/* 3. Player Stats & Practice Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Profile Stats Quick Card */}
        <div className="p-4 rounded-2xl bg-[#0F172A] border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-mono text-cyan-400">Hunter Profile</span>
            <button
              onClick={onOpenProfile}
              className="text-[11px] text-gray-400 hover:text-white"
            >
              Stats →
            </button>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center font-display font-black text-lg text-black flex-shrink-0">
              {displayName.slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={tempName}
                    maxLength={20}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full bg-black/60 border border-cyan-400 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 rounded-lg bg-cyan-400 text-black hover:bg-cyan-300"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-sm text-white truncate">
                    {displayName}
                  </span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-gray-500 hover:text-cyan-400"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <span className="text-[10px] text-gray-400 font-mono">
                {playerStats?.totalMatches ?? 0} Games Played
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="p-1.5 rounded-lg bg-gray-900/60 border border-gray-800">
              <span className="text-[9px] text-gray-400 uppercase font-mono block">Wins</span>
              <span className="font-display font-bold text-xs text-amber-300">
                {playerStats?.wins ?? 0}
              </span>
            </div>

            <div className="p-1.5 rounded-lg bg-gray-900/60 border border-gray-800">
              <span className="text-[9px] text-gray-400 uppercase font-mono block">Win Rate</span>
              <span className="font-display font-bold text-xs text-cyan-400">
                {winRate}%
              </span>
            </div>

            <div className="p-1.5 rounded-lg bg-gray-900/60 border border-gray-800">
              <span className="text-[9px] text-gray-400 uppercase font-mono block">Best Pts</span>
              <span className="font-display font-bold text-xs text-purple-300">
                {playerStats?.bestScore ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Solo Practice Mode Card */}
        <div
          onClick={onOpenPractice}
          className="p-4 rounded-2xl bg-[#0F172A] border border-gray-800 hover:border-cyan-500/40 cursor-pointer flex flex-col justify-between tap-effect"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display font-bold text-sm text-white">Solo Practice</h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800">
                OFFLINE
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Train your eyes and memory speed solo before entering multiplayer rooms.
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-800 text-xs text-cyan-400 font-semibold">
            <span>Play Practice Mode</span>
            <span>→</span>
          </div>
        </div>
      </div>

      {/* 4. Open Public Lobbies */}
      <div className="p-4 rounded-2xl bg-[#0F172A] border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h2 className="font-display font-bold text-sm text-white">Open Rooms</h2>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            {publicRooms.length} available
          </span>
        </div>

        {publicRooms.length === 0 ? (
          <div className="py-4 text-center text-xs text-gray-500">
            No open public rooms. Click <strong>Create Match</strong> to host one!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {publicRooms.map((room) => (
              <div
                key={room.id}
                className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-display font-bold text-xs text-cyan-300">
                    {room.roomCode}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    1–{room.numberRange.max} • {room.playerCount}/{room.playerLimit} Players
                  </div>
                </div>

                <button
                  onClick={() => onOpenJoinModal(room.roomCode)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold tap-effect"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
