import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Trophy,
  Zap,
  Target,
  History,
  Edit2,
  Check,
  Award,
  Volume2,
  VolumeX,
  Smartphone,
  Shield,
  Sparkles,
  Flame,
  Crown,
} from 'lucide-react';
import { api } from '../services/api.js';
import { soundManager } from '../services/audio.js';
import type { PersistentPlayerStats } from '../types/index.js';

interface ProfileModalProps {
  userId: string;
  currentName: string;
  onUpdateName: (name: string) => void;
  onClose: () => void;
}

const AVATAR_PALETTES = [
  { id: 'cyan', from: 'from-cyan-400', via: 'via-sky-500', to: 'to-blue-600', border: 'border-cyan-400' },
  { id: 'purple', from: 'from-fuchsia-500', via: 'via-purple-600', to: 'to-indigo-600', border: 'border-purple-400' },
  { id: 'amber', from: 'from-amber-400', via: 'via-orange-500', to: 'to-red-500', border: 'border-amber-400' },
  { id: 'emerald', from: 'from-emerald-400', via: 'via-teal-500', to: 'to-cyan-600', border: 'border-emerald-400' },
  { id: 'rose', from: 'from-rose-400', via: 'via-pink-500', to: 'to-purple-600', border: 'border-rose-400' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  userId,
  currentName,
  onUpdateName,
  onClose,
}) => {
  const [stats, setStats] = useState<PersistentPlayerStats | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());
  const [vibrationEnabled, setVibrationEnabled] = useState(() => {
    return localStorage.getItem('numrush_vibration') !== 'false';
  });

  const [selectedPalette, setSelectedPalette] = useState(() => {
    return localStorage.getItem('numrush_avatar_palette') || 'cyan';
  });

  useEffect(() => {
    api.getProfile(userId).then((res) => {
      if (res) setStats(res);
    });
    api.getHistory(userId).then((res) => {
      if (res) setHistory(res);
    });
  }, [userId]);

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setSaving(true);
    soundManager.playCorrect();
    await api.updateProfile(userId, trimmed);
    onUpdateName(trimmed);
    setIsEditing(false);
    setSaving(false);
  };

  const handlePaletteSelect = (id: string) => {
    setSelectedPalette(id);
    localStorage.setItem('numrush_avatar_palette', id);
    soundManager.playCorrect();
  };

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const toggleVibration = () => {
    const next = !vibrationEnabled;
    setVibrationEnabled(next);
    localStorage.setItem('numrush_vibration', String(next));
    if (next && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const totalMatches = stats?.totalMatches ?? 0;
  const wins = stats?.wins ?? 0;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const bestScore = stats?.bestScore ?? 0;
  const avgAccuracy = stats?.avgAccuracy ?? 0;

  // Rank calculation
  let rankTitle = 'Novice Hunter';
  let nextRankTitle = 'Pro Hunter';
  let winsNeeded = 3;
  let progressPct = Math.min(100, Math.round((wins / 3) * 100));

  if (wins >= 25) {
    rankTitle = 'Master Hunter';
    nextRankTitle = 'Grandmaster';
    winsNeeded = 50;
    progressPct = Math.min(100, Math.round((wins / 50) * 100));
  } else if (wins >= 10) {
    rankTitle = 'Elite Hunter';
    nextRankTitle = 'Master Hunter';
    winsNeeded = 25;
    progressPct = Math.min(100, Math.round(((wins - 10) / 15) * 100));
  } else if (wins >= 3) {
    rankTitle = 'Pro Hunter';
    nextRankTitle = 'Elite Hunter';
    winsNeeded = 10;
    progressPct = Math.min(100, Math.round(((wins - 3) / 7) * 100));
  }

  const activePalette = AVATAR_PALETTES.find((p) => p.id === selectedPalette) || AVATAR_PALETTES[0];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#0D1424] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,240,255,0.2)] my-auto max-h-[92vh] flex flex-col cursor-default"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1. Header with Avatar & Callsign */}
        <div className="flex items-center gap-3 sm:gap-4 pb-4 border-b border-gray-800 flex-shrink-0">
          <div className="relative flex-shrink-0">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${activePalette.from} ${activePalette.via} ${activePalette.to} flex items-center justify-center font-display font-black text-xl sm:text-2xl text-black shadow-lg ring-2 ring-cyan-400/40`}
            >
              {currentName.slice(0, 2).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0D1424]" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  maxLength={18}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-black/60 border border-cyan-400 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none font-bold w-full"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="p-2 rounded-xl bg-cyan-400 text-black font-bold hover:bg-cyan-300 transition-colors"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-lg sm:text-xl text-white truncate">
                  {currentName}
                </h2>
                <button
                  onClick={() => {
                    setNameInput(currentName);
                    setIsEditing(true);
                  }}
                  className="p-1 text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer"
                  title="Edit Callsign"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                {rankTitle}
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                ID: {userId.slice(0, 7)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pt-3.5 pr-0.5">
          {/* Rank Progression Bar */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-gray-800">
            <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
              <span className="text-gray-400 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Rank Progress
              </span>
              <span className="text-cyan-400 font-bold">
                {wins} / {winsNeeded} Wins ({nextRankTitle})
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Core Career Stats Grid */}
          <div>
            <span className="text-[10px] font-mono uppercase text-gray-400 font-bold tracking-wider block mb-2">
              Career Performance
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
                <span className="text-[9px] uppercase font-mono text-gray-400 block mb-0.5">
                  Matches
                </span>
                <span className="font-display font-black text-base text-white">
                  {totalMatches}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
                <span className="text-[9px] uppercase font-mono text-gray-400 block mb-0.5">
                  Victories
                </span>
                <span className="font-display font-black text-base text-amber-400">
                  {wins}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
                <span className="text-[9px] uppercase font-mono text-gray-400 block mb-0.5">
                  Win Rate
                </span>
                <span className="font-display font-black text-base text-cyan-400">
                  {winRate}%
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
                <span className="text-[9px] uppercase font-mono text-gray-400 block mb-0.5">
                  Best Score
                </span>
                <span className="font-display font-black text-base text-purple-400">
                  {bestScore}
                </span>
              </div>
            </div>
          </div>

          {/* Avatar Theme Selector */}
          <div>
            <span className="text-[10px] font-mono uppercase text-gray-400 font-bold tracking-wider block mb-2">
              Avatar Cyber Theme
            </span>
            <div className="flex items-center gap-2.5">
              {AVATAR_PALETTES.map((pal) => (
                <button
                  key={pal.id}
                  onClick={() => handlePaletteSelect(pal.id)}
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${pal.from} ${pal.to} flex items-center justify-center transition-all ${
                    selectedPalette === pal.id
                      ? 'ring-2 ring-white scale-110 shadow-lg'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {selectedPalette === pal.id && <Check className="w-4 h-4 text-black stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Preferences & Settings */}
          <div>
            <span className="text-[10px] font-mono uppercase text-gray-400 font-bold tracking-wider block mb-2">
              Game Preferences
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={toggleSound}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all active:scale-95 cursor-pointer ${
                  !isMuted
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : 'bg-gray-900/50 border-gray-800 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>Sound FX</span>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold">
                  {!isMuted ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={toggleVibration}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all active:scale-95 cursor-pointer ${
                  vibrationEnabled
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                    : 'bg-gray-900/50 border-gray-800 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Haptics</span>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold">
                  {vibrationEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>

          {/* Match History */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono uppercase text-gray-400 font-bold tracking-wider">
                Recent Matches
              </span>
            </div>

            {history.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500 bg-black/20 rounded-2xl border border-gray-800">
                No recent matches recorded yet. Play a match to build your log!
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {history.slice(0, 10).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-900/40 border border-gray-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${
                          item.won
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {item.won ? 'VICTORY' : `RANK #${item.rank}`}
                      </span>
                      <span className="text-gray-300 text-[11px]">
                        {item.gameMode === 'TIME_CHALLENGE' ? 'Time Challenge' : 'Complete Grid'}
                      </span>
                    </div>

                    <span className="text-cyan-400 font-mono font-bold text-xs">
                      {item.score} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
