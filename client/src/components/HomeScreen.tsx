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
  Zap,
  Radio,
  Swords,
  Clock,
  Play,
  Minus,
  User,
  Sparkles,
} from 'lucide-react';
import { socketService } from '../services/socket.js';
import type { ActiveSessionData } from '../services/socket.js';
import { api } from '../services/api.js';
import { playerStatsService } from '../services/playerStatsService.js';
import type { PersistentPlayerStats } from '../types/index.js';
import { soloStorage, SavedSoloGame } from '../services/soloStorage.js';
import type { SoloGameConfig } from './SoloSetupModal.js';

interface HomeScreenProps {
  displayName: string;
  userId: string;
  onUpdateDisplayName: (name: string) => void;
  onOpenCreateModal: () => void;
  onOpenJoinModal: (code?: string) => void;
  onOpenPractice: () => void;
  onStartSoloGame?: (config: SoloGameConfig) => void;
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
  onStartSoloGame,
  onOpenLeaderboard,
  onOpenProfile,
  onResumeActiveSession,
}) => {
  // Mobile Tabs: 'SOLO' or 'MULTIPLAYER'
  const [activeTab, setActiveTab] = useState<'SOLO' | 'MULTIPLAYER'>('SOLO');

  const [activeSession, setActiveSession] = useState<ActiveSessionData | null>(null);
  const [playerStats, setPlayerStats] = useState<PersistentPlayerStats>(() => {
    return playerStatsService.getLocalStats(userId, displayName);
  });
  const [publicRooms, setPublicRooms] = useState<any[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(displayName);

  // Solo Practice State
  const [savedSolo, setSavedSolo] = useState<SavedSoloGame | null>(null);
  const [soloPreset, setSoloPreset] = useState<number | 'custom'>(50);
  const [customCount, setCustomCount] = useState<number>(75);
  const [soloMode, setSoloMode] = useState<'COMPLETE_GRID' | 'TIME_ATTACK'>('COMPLETE_GRID');
  const [soloTimeLimit, setSoloTimeLimit] = useState<number>(120);

  const fetchStats = () => {
    playerStatsService.syncWithBackend(userId, displayName).then((stats) => {
      if (stats) setPlayerStats(stats);
    });
  };

  useEffect(() => {
    const session = socketService.getActiveSession();
    setActiveSession(session);

    const saved = soloStorage.getSavedGame();
    if (saved && saved.currentTarget <= saved.maxNumber) {
      setSavedSolo(saved);
    }

    fetchStats();

    const handleFocus = () => fetchStats();
    const handleStatsUpdated = (e: Event) => {
      const custom = e as CustomEvent<PersistentPlayerStats>;
      if (custom.detail) setPlayerStats(custom.detail);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('numrush:statsUpdated', handleStatsUpdated);
    const interval = setInterval(fetchStats, 6000);

    api.getActiveRooms().then((res) => {
      if (res && res.rooms) setPublicRooms(res.rooms);
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('numrush:statsUpdated', handleStatsUpdated);
      clearInterval(interval);
    };
  }, [userId, displayName]);

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (!trimmed) return;
    onUpdateDisplayName(trimmed);
    const updated = { ...playerStats, displayName: trimmed };
    playerStatsService.saveLocalStats(updated);
    setPlayerStats(updated);
    api.updateProfile(userId, trimmed);
    setIsEditingName(false);
  };

  const totalMatches = playerStats?.totalMatches ?? 0;
  const wins = playerStats?.wins ?? 0;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const bestScore = playerStats?.bestScore ?? 0;

  const rankTitle =
    wins >= 25 ? 'Master Hunter' : wins >= 10 ? 'Elite Hunter' : wins >= 3 ? 'Pro Hunter' : 'Novice Hunter';

  const effectiveMax = soloPreset === 'custom' ? Math.min(200, Math.max(10, customCount || 50)) : soloPreset;

  const handleLaunchSolo = (resume = false) => {
    if (resume && savedSolo) {
      onStartSoloGame?.({
        maxNumber: savedSolo.maxNumber,
        gameMode: savedSolo.gameMode,
        timeLimitSeconds: savedSolo.timeLimitSeconds,
        resumeSaved: true,
      });
      return;
    }

    soloStorage.clearSavedGame();
    setSavedSolo(null);
    onStartSoloGame?.({
      maxNumber: effectiveMax,
      gameMode: soloMode,
      timeLimitSeconds: soloTimeLimit,
      resumeSaved: false,
    });
  };

  // Render content for Single Player card
  const renderSoloCard = () => (
    <div className="space-y-3.5">
      {/* Saved Match Notice */}
      {savedSolo && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 shadow-lg flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-display font-black text-white">
                Unfinished Match Saved
              </span>
            </div>
            <p className="text-[10px] font-mono text-amber-300/90 mt-0.5">
              Target: #{savedSolo.currentTarget} of {savedSolo.maxNumber} numbers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLaunchSolo(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-display font-black flex items-center gap-1 tap-effect shadow-md cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-black stroke-none" />
              Resume
            </button>
          </div>
        </div>
      )}

      {/* Solo Setup Card */}
      <div className="rounded-3xl bg-[#0D1424] border border-amber-500/30 p-4 sm:p-5 shadow-xl space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="font-display font-black text-sm sm:text-base text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Solo Matrix Training
            </h3>
            <span className="text-xs font-mono text-amber-400 font-bold">
              1 – {effectiveMax} tiles
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Hone your visual hunt reflex. Complete sequentially with zero distractions.
          </p>
        </div>

        {/* Range Presets Chips */}
        <div>
          <label className="text-[10px] font-mono uppercase text-gray-400 font-bold tracking-wider block mb-1.5">
            Tile Count
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {[30, 50, 100, 150].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setSoloPreset(num)}
                className={`py-2 rounded-xl font-display font-black text-xs border transition-all text-center cursor-pointer ${
                  soloPreset === num
                    ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                1–{num}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setSoloPreset('custom')}
              className={`py-2 rounded-xl font-display font-black text-xs border transition-all text-center cursor-pointer ${
                soloPreset === 'custom'
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                  : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Theme-Styled Custom Number Input */}
          {soloPreset === 'custom' && (
            <div className="mt-3 p-3 rounded-2xl bg-black/40 border border-cyan-500/40 animate-fade-in">
              <span className="text-[10px] font-mono text-gray-400 block mb-1.5">
                Enter target count (10 – 200):
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomCount((v) => Math.max(10, v - 5))}
                  className="w-10 h-10 rounded-xl bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-300 flex items-center justify-center font-bold active:scale-95 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={customCount || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setCustomCount(isNaN(val) ? 0 : Math.min(200, Math.max(1, val)));
                    }}
                    placeholder="e.g. 75"
                    className="w-full h-10 text-center font-display font-black text-base text-cyan-300 bg-gray-900/80 border border-cyan-500/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-mono text-gray-500 pointer-events-none">
                    tiles
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setCustomCount((v) => Math.min(200, v + 5))}
                  className="w-10 h-10 rounded-xl bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-300 flex items-center justify-center font-bold active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Objective Pills */}
        <div>
          <label className="text-[10px] font-mono uppercase text-gray-400 font-bold tracking-wider block mb-1.5">
            Game Mode
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSoloMode('COMPLETE_GRID')}
              className={`py-2 px-3 rounded-xl border text-xs font-display font-bold transition-all text-center cursor-pointer ${
                soloMode === 'COMPLETE_GRID'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-gray-900/60 border-gray-800 text-gray-400'
              }`}
            >
              Complete Grid (1–{effectiveMax})
            </button>

            <button
              type="button"
              onClick={() => setSoloMode('TIME_ATTACK')}
              className={`py-2 px-3 rounded-xl border text-xs font-display font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                soloMode === 'TIME_ATTACK'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-gray-900/60 border-gray-800 text-gray-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Time Attack ({soloTimeLimit}s)
            </button>
          </div>
        </div>

        {/* Launch Buttons */}
        <div className="pt-2">
          <button
            onClick={() => handleLaunchSolo(false)}
            className="w-full py-3.5 px-4 rounded-2xl font-display font-black text-sm text-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 tap-effect cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black stroke-none" />
            {savedSolo ? `Start New Game (1 – ${effectiveMax})` : `Start Solo Hunt (1 – ${effectiveMax})`}
          </button>
        </div>
      </div>
    </div>
  );

  // Render content for Multiplayer card
  const renderMultiplayerCard = () => (
    <div className="space-y-3.5">
      {/* Active Reconnection Alert */}
      {activeSession && (
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/50 shadow-xl flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2.5 min-w-0">
            <RotateCcw className="w-5 h-5 text-amber-400 flex-shrink-0 animate-spin-slow" />
            <div className="truncate">
              <div className="font-display font-bold text-xs text-white truncate">
                Match in Progress ({activeSession.roomCode})
              </div>
              <span className="text-[10px] text-amber-200/80">Rejoin active game</span>
            </div>
          </div>

          <button
            onClick={() => onResumeActiveSession(activeSession)}
            className="px-4 py-2 rounded-xl font-display font-black text-xs text-black bg-amber-400 hover:bg-amber-300 flex-shrink-0 tap-effect cursor-pointer"
          >
            Resume
          </button>
        </div>
      )}

      {/* Multiplayer Action Card */}
      <div className="rounded-3xl bg-[#0D1424] border border-cyan-500/30 p-4 sm:p-5 shadow-xl space-y-4">
        <div>
          <h3 className="font-display font-black text-sm sm:text-base text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Live Multiplayer Arena
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Compete in real-time with friends or online players on a shared synchronized matrix!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onOpenCreateModal}
            className="py-3.5 px-3 rounded-2xl font-display font-black text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-600 via-sky-600 to-purple-600 hover:brightness-110 shadow-lg flex items-center justify-center gap-1.5 tap-effect cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Create Room
          </button>

          <button
            onClick={() => onOpenJoinModal()}
            className="py-3.5 px-3 rounded-2xl font-display font-black text-xs sm:text-sm text-gray-200 bg-gray-900/80 hover:bg-gray-800 border border-gray-700 hover:border-cyan-400 flex items-center justify-center gap-1.5 tap-effect cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-cyan-400" />
            Join with Code
          </button>
        </div>
      </div>

      {/* Live Public Rooms Radar */}
      <div className="rounded-3xl bg-[#0D1424] border border-gray-800/80 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h4 className="font-display font-black text-sm text-white">
              Live Public Rooms
            </h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-900 border border-gray-800 text-gray-400">
            {publicRooms.length} available
          </span>
        </div>

        {publicRooms.length === 0 ? (
          <div className="py-5 text-center text-xs text-gray-400 rounded-2xl bg-gray-900/40 border border-gray-800/60 p-4">
            <p>No public rooms open right now.</p>
            <p className="text-[11px] text-gray-500 mt-1">
              Click <strong>Create Room</strong> to host a match and invite players!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {publicRooms.map((room) => (
              <div
                key={room.id}
                className="p-3 rounded-2xl bg-[#11192d]/70 border border-gray-800 hover:border-cyan-500/40 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-sm text-cyan-300">
                      {room.roomCode}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                      1–{room.numberRange.max}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                    {room.playerCount} / {room.playerLimit} Players
                  </div>
                </div>

                <button
                  onClick={() => onOpenJoinModal(room.roomCode)}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-display font-bold tap-effect cursor-pointer"
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

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-4 sm:space-y-5">
      {/* 1. Sleek Player Hunter Header Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#11192d] via-[#0E1626] to-[#0A0F1D] border border-cyan-500/20 p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Avatar & Player Name */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div
              onClick={onOpenProfile}
              title="View Hunter Profile & Settings"
              className="relative flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-purple-600 flex items-center justify-center font-display font-black text-lg text-black shadow-[0_0_20px_rgba(0,240,255,0.35)] ring-2 ring-cyan-400/50">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0A0F1D]" />
            </div>

            <div className="min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={tempName}
                    maxLength={18}
                    onChange={(e) => setTempName(e.target.value)}
                    className="bg-black/60 border border-cyan-400 rounded-xl px-2.5 py-1 text-sm text-white focus:outline-none font-bold"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 rounded-xl bg-cyan-400 text-black hover:bg-cyan-300 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-base sm:text-xl text-white truncate">
                    {displayName}
                  </span>
                  <button
                    onClick={() => {
                      setTempName(displayName);
                      setIsEditingName(true);
                    }}
                    className="text-gray-400 hover:text-cyan-400 transition-colors p-1 cursor-pointer"
                    title="Edit Name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold uppercase tracking-wider">
                  {rankTitle}
                </span>
                <span className="text-[11px] font-mono text-gray-400">
                  {totalMatches} Matches Played
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons: Profile, Settings & Leaderboard */}
          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <button
              onClick={onOpenProfile}
              title="Hunter Profile & Settings"
              className="px-3 py-2 rounded-2xl bg-gray-900/90 hover:bg-gray-800 border border-gray-800 text-cyan-400 hover:text-cyan-300 transition-all active:scale-95 flex items-center gap-1.5 tap-effect cursor-pointer text-xs font-bold font-display"
            >
              <User className="w-4 h-4" />
              <span>Profile & Settings</span>
            </button>

            <button
              onClick={onOpenLeaderboard}
              title="Global Leaderboard"
              className="px-3 py-2 rounded-2xl bg-gray-900/90 hover:bg-gray-800 border border-gray-800 text-amber-400 hover:text-amber-300 transition-all active:scale-95 flex items-center gap-1.5 tap-effect cursor-pointer text-xs font-bold font-display"
            >
              <Trophy className="w-4 h-4" />
              <span>Rankings</span>
            </button>
          </div>
        </div>

        {/* Hunter Quick Stats Bar */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-gray-800/80 text-center">
          <div className="p-2 rounded-xl bg-black/30 border border-gray-800/60">
            <span className="text-[9px] font-mono uppercase text-gray-400 block tracking-wider">Matches</span>
            <span className="font-display font-black text-sm sm:text-base text-white">{totalMatches}</span>
          </div>

          <div className="p-2 rounded-xl bg-black/30 border border-gray-800/60">
            <span className="text-[9px] font-mono uppercase text-gray-400 block tracking-wider">Victories</span>
            <span className="font-display font-black text-sm sm:text-base text-amber-400">{wins}</span>
          </div>

          <div className="p-2 rounded-xl bg-black/30 border border-gray-800/60">
            <span className="text-[9px] font-mono uppercase text-gray-400 block tracking-wider">Win Rate</span>
            <span className="font-display font-black text-sm sm:text-base text-cyan-400">{winRate}%</span>
          </div>

          <div className="p-2 rounded-xl bg-black/30 border border-gray-800/60">
            <span className="text-[9px] font-mono uppercase text-gray-400 block tracking-wider">Best Pts</span>
            <span className="font-display font-black text-sm sm:text-base text-purple-400">{bestScore}</span>
          </div>
        </div>
      </div>

      {/* 2. Responsive Layout: Dual-Column on Laptop/Desktop (lg+), Segmented Tabs on Mobile (<lg) */}
      
      {/* Desktop / Laptop Layout: Both Columns Side-by-Side */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-5 items-start">
        {renderSoloCard()}
        {renderMultiplayerCard()}
      </div>

      {/* Mobile (<lg) Layout: Segmented Tabs */}
      <div className="lg:hidden space-y-4">
        {/* Segmented Tab Pill */}
        <div className="relative p-1 rounded-2xl bg-[#090E1A] border border-gray-800 shadow-md flex select-none">
          <div
            className="absolute top-1 bottom-1 rounded-xl transition-all duration-300 ease-out shadow-lg"
            style={{
              left: activeTab === 'SOLO' ? '4px' : '50%',
              width: 'calc(50% - 4px)',
              background:
                activeTab === 'SOLO'
                  ? 'linear-gradient(to right, #F59E0B, #EAB308)'
                  : 'linear-gradient(to right, #00F0FF, #3B82F6)',
            }}
          />

          <button
            type="button"
            onClick={() => setActiveTab('SOLO')}
            className={`relative z-10 flex-1 py-2.5 px-3 rounded-xl font-display font-black text-xs flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer ${
              activeTab === 'SOLO' ? 'text-black' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Target className="w-4 h-4 stroke-[2.5]" />
            <span>Single Player</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MULTIPLAYER')}
            className={`relative z-10 flex-1 py-2.5 px-3 rounded-xl font-display font-black text-xs flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer ${
              activeTab === 'MULTIPLAYER' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Swords className="w-4 h-4 stroke-[2.5]" />
            <span>Multiplayer</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'SOLO' ? renderSoloCard() : renderMultiplayerCard()}
      </div>
    </div>
  );
};
