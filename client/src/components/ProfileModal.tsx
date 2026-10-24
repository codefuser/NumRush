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
  LayoutGrid,
  Palette,
  Maximize,
  Minimize,
} from 'lucide-react';
import { api } from '../services/api.js';
import { soundManager } from '../services/audio.js';
import { playerStatsService } from '../services/playerStatsService.js';
import { gridThemeService, GRID_MODELS, GridModelId } from '../services/gridTheme.js';
import { backgroundThemeService, BACKGROUND_THEMES, BackgroundThemeId } from '../services/backgroundTheme.js';
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
  // 1. Initialize stats from local persistent storage first, then sync with backend
  const [stats, setStats] = useState<PersistentPlayerStats>(() => {
    return playerStatsService.getLocalStats(userId, currentName);
  });

  const [history, setHistory] = useState<any[]>(() => {
    return playerStatsService.getLocalHistory(userId);
  });

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);
  const [selectedGridModel, setSelectedGridModel] = useState<GridModelId>(() => gridThemeService.getCurrentModelId());
  const [selectedBgTheme, setSelectedBgTheme] = useState<BackgroundThemeId>(() => backgroundThemeService.getCurrentThemeId());
  const [bgCategoryFilter, setBgCategoryFilter] = useState<'ALL' | 'Space' | 'Cyber' | 'Gradient' | 'Minimal'>('ALL');

  const [vibrationEnabled, setVibrationEnabled] = useState(() => {
    return localStorage.getItem('numrush_vibration') !== 'false';
  });

  const [selectedPalette, setSelectedPalette] = useState(() => {
    return localStorage.getItem('numrush_avatar_palette') || 'cyan';
  });

  useEffect(() => {
    // Sync with backend API in background
    playerStatsService.syncWithBackend(userId, currentName).then((latest) => {
      if (latest) setStats(latest);
    });

    api.getHistory(userId).then((res) => {
      if (res && res.length > 0) {
        setHistory(res);
      }
    });

    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [userId, currentName]);

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setSaving(true);
    soundManager.playCorrect();
    onUpdateName(trimmed);

    // Update in local stats
    const updated = { ...stats, displayName: trimmed };
    playerStatsService.saveLocalStats(updated);
    setStats(updated);

    await api.updateProfile(userId, trimmed);
    setIsEditing(false);
    setSaving(false);
  };

  const handlePaletteSelect = (id: string) => {
    setSelectedPalette(id);
    localStorage.setItem('numrush_avatar_palette', id);
    soundManager.playCorrect();
  };

  const handleGridModelSelect = (id: GridModelId) => {
    setSelectedGridModel(id);
    gridThemeService.setModelId(id);
    soundManager.playCorrect();
  };

  const handleBgThemeSelect = (id: BackgroundThemeId) => {
    setSelectedBgTheme(id);
    backgroundThemeService.setThemeId(id);
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

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } catch {}
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
        className="relative w-full max-w-xl bg-[#0D1424] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,240,255,0.2)] my-auto max-h-[92vh] flex flex-col cursor-default"
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
                  className="p-2 rounded-xl bg-cyan-400 text-black font-bold hover:bg-cyan-300 transition-colors cursor-pointer"
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
              Career Performance (Permanent Record)
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

          {/* Grid Model / Theme Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" />
                Grid Design Models (Choose Style)
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                {GRID_MODELS[selectedGridModel]?.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(GRID_MODELS).map((model) => {
                const isSelected = selectedGridModel === model.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleGridModelSelect(model.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400'
                        : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-display font-bold text-xs text-white">
                        {model.name}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center text-black flex-shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    {/* Visual Preview Box */}
                    <div className={`h-7 w-full rounded-lg bg-gradient-to-r ${model.previewBg} border ${model.previewBorder} flex items-center justify-center gap-1`}>
                      <span className="w-3.5 h-3.5 rounded bg-black/40 border border-white/20 text-[7px] flex items-center justify-center font-bold text-white">1</span>
                      <span className="w-3.5 h-3.5 rounded bg-black/40 border border-white/20 text-[7px] flex items-center justify-center font-bold text-white">2</span>
                      <span className="w-3.5 h-3.5 rounded bg-black/40 border border-white/20 text-[7px] flex items-center justify-center font-bold text-white">3</span>
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 block truncate">
                      {model.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid Background Themes (10 rich themes with preview & category filters) */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-gray-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                Grid Background Canvas Themes ({Object.keys(BACKGROUND_THEMES).length} Themes)
              </span>
              <span className="text-[10px] font-mono text-cyan-300 font-bold">
                Active: {BACKGROUND_THEMES[selectedBgTheme]?.name}
              </span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(['ALL', 'Space', 'Cyber', 'Gradient', 'Minimal'] as const).map((cat) => {
                const count = cat === 'ALL'
                  ? Object.keys(BACKGROUND_THEMES).length
                  : Object.values(BACKGROUND_THEMES).filter((t) => t.category === cat).length;
                const isCatActive = bgCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setBgCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isCatActive
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                        : 'bg-gray-900/60 text-gray-400 border border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Themes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(BACKGROUND_THEMES)
                .filter((theme) => bgCategoryFilter === 'ALL' || theme.category === bgCategoryFilter)
                .map((theme) => {
                  const isSelected = selectedBgTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => handleBgThemeSelect(theme.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                          : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-display font-bold text-xs text-white truncate max-w-[100px]">
                            {theme.name}
                          </span>
                          {isSelected ? (
                            <span className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-black flex-shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-black/60 text-gray-400 border border-gray-800">
                              {theme.category}
                            </span>
                          )}
                        </div>

                        {/* Visual Canvas & Matrix Mock Preview Box */}
                        <div
                          className={`h-11 w-full rounded-xl ${theme.previewBg} border ${theme.previewBorder} relative overflow-hidden flex items-center justify-center shadow-inner`}
                        >
                          {/* Ambient glow in preview */}
                          <div
                            className="absolute w-12 h-12 rounded-full blur-md opacity-70 pointer-events-none"
                            style={{ background: theme.ambientGlowColor }}
                          />
                          {/* Mini Grid board */}
                          <div className="relative z-10 grid grid-cols-3 gap-0.5 p-1 rounded-md bg-black/50 border border-white/10 shadow-sm">
                            <span className="w-2.5 h-2.5 rounded-[3px] bg-cyan-400/40 border border-cyan-300/40 text-[5px] flex items-center justify-center text-cyan-200 font-bold">1</span>
                            <span className="w-2.5 h-2.5 rounded-[3px] bg-white/20 border border-white/20 text-[5px] flex items-center justify-center text-gray-300 font-bold">2</span>
                            <span className="w-2.5 h-2.5 rounded-[3px] bg-amber-400/50 border border-amber-300/50 text-[5px] flex items-center justify-center text-amber-200 font-bold">★</span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[9px] text-gray-400 mt-1.5 block line-clamp-1 leading-tight">
                        {theme.description}
                      </span>
                    </button>
                  );
                })}
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
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${pal.from} ${pal.to} flex items-center justify-center transition-all cursor-pointer ${
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
              Game Preferences & Display
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={toggleSound}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                  !isMuted
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : 'bg-gray-900/50 border-gray-800 text-gray-400'
                }`}
              >
                {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="font-bold text-[11px]">Sound FX</span>
                <span className="font-mono text-[9px] uppercase font-bold text-gray-400">
                  {!isMuted ? 'ENABLED' : 'MUTED'}
                </span>
              </button>

              <button
                onClick={toggleVibration}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                  vibrationEnabled
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                    : 'bg-gray-900/50 border-gray-800 text-gray-400'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="font-bold text-[11px]">Haptics</span>
                <span className="font-mono text-[9px] uppercase font-bold text-gray-400">
                  {vibrationEnabled ? 'ACTIVE' : 'OFF'}
                </span>
              </button>

              <button
                onClick={toggleFullscreen}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                  isFullscreen
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-gray-900/50 border-gray-800 text-gray-400'
                }`}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                <span className="font-bold text-[11px]">Fullscreen</span>
                <span className="font-mono text-[9px] uppercase font-bold text-gray-400">
                  {isFullscreen ? 'ACTIVE' : 'WINDOWED'}
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
