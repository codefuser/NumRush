import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Zap,
  Target,
  History,
  Edit2,
  Check,
  Volume2,
  VolumeX,
  Smartphone,
  Sparkles,
  Flame,
  Crown,
  LayoutGrid,
  Maximize,
  Minimize,
  Copy,
  CheckCheck,
  Settings,
  BarChart3,
  Layers,
  Award,
  Shield,
  Activity,
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

type ProfileTab = 'STATS' | 'TILES' | 'PATTERNS' | 'SETTINGS';

const AVATAR_PALETTES = [
  { id: 'cyan', name: 'Cyber Cyan', from: 'from-cyan-400', via: 'via-sky-500', to: 'to-blue-600', ring: 'ring-cyan-400' },
  { id: 'purple', name: 'Electric Violet', from: 'from-fuchsia-500', via: 'via-purple-600', to: 'to-indigo-600', ring: 'ring-purple-400' },
  { id: 'amber', name: 'Solar Amber', from: 'from-amber-400', via: 'via-orange-500', to: 'to-red-500', ring: 'ring-amber-400' },
  { id: 'emerald', name: 'Matrix Emerald', from: 'from-emerald-400', via: 'via-teal-500', to: 'to-cyan-600', ring: 'ring-emerald-400' },
  { id: 'rose', name: 'Neon Rose', from: 'from-rose-400', via: 'via-pink-500', to: 'to-purple-600', ring: 'ring-rose-400' },
];

const RANK_TIERS = [
  { id: 'novice', title: 'Novice Hunter', minWins: 0, icon: Target, color: 'text-gray-300', border: 'border-gray-500/40', bg: 'bg-gray-500/10' },
  { id: 'pro', title: 'Pro Hunter', minWins: 3, icon: Zap, color: 'text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-500/10' },
  { id: 'elite', title: 'Elite Hunter', minWins: 10, icon: Award, color: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/10' },
  { id: 'master', title: 'Master Hunter', minWins: 25, icon: Flame, color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/10' },
  { id: 'grandmaster', title: 'Grandmaster', minWins: 50, icon: Crown, color: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-500/10' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  userId,
  currentName,
  onUpdateName,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('STATS');
  const [stats, setStats] = useState<PersistentPlayerStats>(() => {
    return playerStatsService.getLocalStats(userId, currentName);
  });
  const [history, setHistory] = useState<any[]>(() => {
    return playerStatsService.getLocalHistory(userId);
  });

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);

  const [selectedGridModel, setSelectedGridModel] = useState<GridModelId>(() => gridThemeService.getCurrentModelId());
  const [selectedBgTheme, setSelectedBgTheme] = useState<BackgroundThemeId>(() => backgroundThemeService.getCurrentThemeId());
  const [patternFilter, setPatternFilter] = useState<'ALL' | 'Cyber' | 'Geometric' | 'Space' | 'Retro' | 'Minimal'>('ALL');

  const [vibrationEnabled, setVibrationEnabled] = useState(() => {
    return localStorage.getItem('numrush_vibration') !== 'false';
  });

  const [selectedPalette, setSelectedPalette] = useState(() => {
    return localStorage.getItem('numrush_avatar_palette') || 'cyan';
  });

  useEffect(() => {
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

    const updated = { ...stats, displayName: trimmed };
    playerStatsService.saveLocalStats(updated);
    setStats(updated);

    await api.updateProfile(userId, trimmed);
    setIsEditing(false);
    setSaving(false);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    soundManager.playCorrect();
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
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
      navigator.vibrate(60);
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
  const avgReactionTimeMs = stats?.avgReactionTimeMs ?? 0;

  // Rank Tier computation
  let currentTierIndex = 0;
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (wins >= RANK_TIERS[i].minWins) {
      currentTierIndex = i;
      break;
    }
  }
  const currentTier = RANK_TIERS[currentTierIndex];
  const nextTier = RANK_TIERS[Math.min(RANK_TIERS.length - 1, currentTierIndex + 1)];
  const isMaxRank = currentTierIndex === RANK_TIERS.length - 1;

  const winsInCurrentTier = wins - currentTier.minWins;
  const winsRequiredForNext = nextTier.minWins - currentTier.minWins;
  const progressPct = isMaxRank
    ? 100
    : Math.min(100, Math.max(0, Math.round((winsInCurrentTier / winsRequiredForNext) * 100)));

  const activePalette = AVATAR_PALETTES.find((p) => p.id === selectedPalette) || AVATAR_PALETTES[0];
  const TierIcon = currentTier.icon;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fade-in cursor-pointer select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl xl:max-w-4xl bg-[#090E1A]/95 border border-cyan-500/25 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] ring-1 ring-white/10 flex flex-col h-[92vh] max-h-[820px] overflow-hidden cursor-default transition-all"
      >
        {/* ========================================================= */}
        {/* 1. COMPACT PROFESSIONAL HEADER BAR                        */}
        {/* ========================================================= */}
        <div className="bg-gradient-to-r from-[#0D1527] via-[#101B33] to-[#0A101F] border-b border-gray-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
            <h2 className="font-display font-black text-sm sm:text-base text-white tracking-wide truncate">
              Player Hub & Customization
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer border border-gray-700/60 shadow-sm flex-shrink-0"
            aria-label="Close Profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* 2. PLAYER IDENTITY & QUICK STATS HERO BANNER              */}
        {/* ========================================================= */}
        <div className="bg-[#0B1224]/80 px-4 sm:px-6 py-3.5 border-b border-gray-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          {/* Left: Avatar & Callsign */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${activePalette.from} ${activePalette.via} ${activePalette.to} flex items-center justify-center font-display font-black text-lg sm:text-xl text-black shadow-lg ring-2 ${activePalette.ring} ring-offset-2 ring-offset-[#0B1224]`}
              >
                {currentName.slice(0, 2).toUpperCase()}
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0B1224]"
                title="Synchronized"
              />
            </div>

            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="flex items-center gap-1.5 max-w-xs">
                  <input
                    type="text"
                    value={nameInput}
                    maxLength={18}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="bg-black/70 border border-cyan-400 rounded-xl px-2.5 py-1 text-xs sm:text-sm text-white focus:outline-none font-bold w-full shadow-inner"
                    autoFocus
                    placeholder="Enter callsign..."
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="p-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-base sm:text-lg text-white truncate">
                    {currentName}
                  </span>
                  <button
                    onClick={() => {
                      setNameInput(currentName);
                      setIsEditing(true);
                    }}
                    className="p-1 rounded text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer"
                    title="Edit Name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold border ${currentTier.bg} ${currentTier.border} ${currentTier.color}`}
                >
                  <TierIcon className="w-2.5 h-2.5" />
                  <span>{currentTier.title}</span>
                </span>

                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-gray-900/90 hover:bg-gray-800 border border-gray-800 text-[9px] font-mono text-gray-400 transition-colors cursor-pointer"
                  title="Copy ID"
                >
                  {copiedId ? (
                    <span className="text-emerald-300 font-bold">Copied!</span>
                  ) : (
                    <span>ID: {userId.slice(0, 8)}</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Quick Stat Badges */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 flex-shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-gray-800/80 text-center">
              <span className="text-[9px] font-mono uppercase text-gray-400 block leading-tight">Wins</span>
              <span className="font-display font-black text-sm text-amber-400">{wins}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-gray-800/80 text-center">
              <span className="text-[9px] font-mono uppercase text-gray-400 block leading-tight">Win Rate</span>
              <span className="font-display font-black text-sm text-cyan-300">{winRate}%</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-gray-800/80 text-center">
              <span className="text-[9px] font-mono uppercase text-gray-400 block leading-tight">Best</span>
              <span className="font-display font-black text-sm text-purple-400">{bestScore}</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. ROBUST 4-COLUMN SEGMENTED CONTROL (NO OVERFLOW EVER)    */}
        {/* ========================================================= */}
        <div className="px-3 sm:px-6 py-2.5 bg-[#070B14] border-b border-gray-800/80 flex-shrink-0">
          <div className="grid grid-cols-4 p-1 rounded-2xl bg-black/60 border border-gray-800/90 gap-1">
            {[
              { id: 'STATS' as ProfileTab, label: 'Stats', icon: BarChart3 },
              { id: 'TILES' as ProfileTab, label: 'Tiles', icon: LayoutGrid },
              { id: 'PATTERNS' as ProfileTab, label: 'Patterns', icon: Layers },
              { id: 'SETTINGS' as ProfileTab, label: 'Settings', icon: Settings },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundManager.playCorrect();
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-display font-bold text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_15px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400/40'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                  <span className="text-[11px] sm:text-xs truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. SCROLLABLE TAB CONTENT BODY                            */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* ======================================================= */}
          {/* TAB 1: STATS & CAREER PROGRESS                          */}
          {/* ======================================================= */}
          {activeTab === 'STATS' && (
            <div className="space-y-5 animate-fade-in">
              {/* Stepper Progress Card */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-[#0D1527] to-[#0A0F1D] border border-cyan-500/25 shadow-lg">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Rank Tier Progression</span>
                  </div>
                  <span className="font-mono text-cyan-300 font-bold text-[11px]">
                    {isMaxRank ? 'Grandmaster Max Tier' : `${wins} / ${nextTier.minWins} Wins (${nextTier.title})`}
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-black/60 border border-gray-800 overflow-hidden mb-3.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-400 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(0,240,255,0.6)]"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="grid grid-cols-5 gap-1 text-center">
                  {RANK_TIERS.map((tier) => {
                    const isPassed = wins >= tier.minWins;
                    const isCurrent = currentTier.id === tier.id;
                    const NodeIcon = tier.icon;
                    return (
                      <div key={tier.id} className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                            isCurrent
                              ? 'bg-amber-400 text-black font-black ring-4 ring-amber-400/30 scale-105'
                              : isPassed
                              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                              : 'bg-gray-800/80 text-gray-500 border border-gray-700'
                          }`}
                        >
                          <NodeIcon className="w-3.5 h-3.5" />
                        </div>
                        <span
                          className={`text-[9px] sm:text-[11px] font-bold mt-1 truncate max-w-full ${
                            isCurrent ? 'text-amber-300' : isPassed ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          {tier.title.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4 Performance Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-[#0D1424] border border-gray-800 text-center">
                  <span className="text-[9px] uppercase font-mono text-gray-400 block mb-1">Matches</span>
                  <span className="font-display font-black text-xl sm:text-2xl text-white">{totalMatches}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0D1424] border border-gray-800 text-center">
                  <span className="text-[9px] uppercase font-mono text-gray-400 block mb-1">Victories</span>
                  <span className="font-display font-black text-xl sm:text-2xl text-amber-400">{wins}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0D1424] border border-gray-800 text-center">
                  <span className="text-[9px] uppercase font-mono text-gray-400 block mb-1">Win Rate</span>
                  <span className="font-display font-black text-xl sm:text-2xl text-cyan-300">{winRate}%</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0D1424] border border-gray-800 text-center">
                  <span className="text-[9px] uppercase font-mono text-gray-400 block mb-1">Best Score</span>
                  <span className="font-display font-black text-xl sm:text-2xl text-purple-400">{bestScore}</span>
                </div>
              </div>

              {/* Accuracy & Speed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-black/40 border border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Click Precision Accuracy</span>
                  <span className="font-display font-black text-emerald-400 text-sm">
                    {avgAccuracy > 0 ? `${avgAccuracy}%` : '100%'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Avg Reaction Latency</span>
                  <span className="font-display font-black text-sky-400 text-sm">
                    {avgReactionTimeMs > 0 ? `${avgReactionTimeMs}ms` : '380ms'}
                  </span>
                </div>
              </div>

              {/* Recent History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase text-gray-400 font-bold flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                    Recent Battle Log
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">Latest 10 games</span>
                </div>

                {history.length === 0 ? (
                  <div className="p-5 text-center rounded-2xl bg-black/30 border border-gray-800 text-gray-400 text-xs">
                    No matches played yet. Start a game to build your record!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {history.slice(0, 10).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1424] border border-gray-800/80 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono uppercase ${
                              item.won
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-gray-800 text-gray-400'
                            }`}
                          >
                            {item.won ? 'VICTORY' : `RANK #${item.rank || 2}`}
                          </span>
                          <span className="text-gray-300 font-semibold text-[11px]">
                            {item.gameMode === 'TIME_CHALLENGE' ? 'Time Challenge' : 'Complete Grid'}
                          </span>
                        </div>

                        <span className="font-display font-black text-cyan-400 text-xs">
                          +{item.score} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 2: TILE MODELS (6 STYLES WITH PREVIEW)              */}
          {/* ======================================================= */}
          {activeTab === 'TILES' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-1 border-b border-gray-800">
                <div>
                  <h3 className="font-display font-black text-sm sm:text-base text-white">
                    Grid Tile Models (6 Styles)
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Tactile styling, borders, and visual effects for number tiles.
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold text-cyan-300 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40">
                  {GRID_MODELS[selectedGridModel]?.name}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.values(GRID_MODELS).map((model) => {
                  const isSelected = selectedGridModel === model.id;
                  return (
                    <div
                      key={model.id}
                      onClick={() => handleGridModelSelect(model.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                        isSelected
                          ? 'bg-gradient-to-b from-[#101F3B] to-[#0A1324] border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400'
                          : 'bg-[#0D1424] border-gray-800 hover:border-gray-700 hover:bg-[#111A30]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-display font-bold text-xs sm:text-sm text-white group-hover:text-cyan-300 transition-colors">
                            {model.name}
                          </span>
                          {isSelected && (
                            <span className="px-2 py-0.2 rounded-full bg-cyan-400 text-black text-[9px] font-black uppercase flex items-center gap-1 shadow-sm">
                              <Check className="w-3 h-3 stroke-[3]" /> Active
                            </span>
                          )}
                        </div>

                        {/* Interactive Sample Board Preview */}
                        <div
                          className={`p-2.5 rounded-xl ${model.boardBg} border ${model.boardBorder} mb-2.5 flex items-center justify-center gap-2 shadow-inner`}
                        >
                          {[1, 2, 3, 4].map((n) => (
                            <div
                              key={n}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-black text-xs transition-transform group-hover:scale-105 ${
                                n === 3
                                  ? 'bg-amber-400 text-black border-2 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                  : n === 1
                                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50'
                                  : 'bg-black/50 text-gray-200 border border-white/10'
                              }`}
                            >
                              {n}
                            </div>
                          ))}
                        </div>

                        <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                          {model.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGridModelSelect(model.id);
                        }}
                        className={`w-full mt-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-cyan-400 text-black cursor-default'
                            : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 group-hover:text-white cursor-pointer'
                        }`}
                      >
                        {isSelected ? 'Currently Selected' : 'Choose Model'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 3: GRID BACKGROUND PATTERNS (10 RICH PATTERNS)       */}
          {/* ======================================================= */}
          {activeTab === 'PATTERNS' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-1 border-b border-gray-800">
                <div>
                  <h3 className="font-display font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                    Grid Background Patterns (10 Themes)
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Real geometric patterns, tech wireframes, and honeycomb grids behind the board.
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40">
                  {BACKGROUND_THEMES[selectedBgTheme]?.name}
                </span>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {(['ALL', 'Cyber', 'Geometric', 'Space', 'Retro', 'Minimal'] as const).map((cat) => {
                  const count =
                    cat === 'ALL'
                      ? Object.keys(BACKGROUND_THEMES).length
                      : Object.values(BACKGROUND_THEMES).filter((t) => t.category === cat).length;
                  const isCatActive = patternFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        soundManager.playCorrect();
                        setPatternFilter(cat);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-display font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isCatActive
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                          : 'bg-gray-900/90 text-gray-400 border border-gray-800 hover:border-gray-700 hover:text-gray-200'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Pattern Gallery Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.values(BACKGROUND_THEMES)
                  .filter((theme) => patternFilter === 'ALL' || theme.category === patternFilter)
                  .map((theme) => {
                    const isSelected = selectedBgTheme === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => handleBgThemeSelect(theme.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                          isSelected
                            ? 'bg-gradient-to-b from-[#1C140E] to-[#0E0A07] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-400'
                            : 'bg-[#0D1424] border-gray-800 hover:border-gray-700 hover:bg-[#111A30]'
                        }`}
                      >
                        <div>
                          {/* Title & Badge */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-display font-black text-xs sm:text-sm text-white group-hover:text-amber-300 transition-colors truncate max-w-[150px]">
                              {theme.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-black/60 text-gray-300 border border-gray-800">
                                {theme.category}
                              </span>
                              {isSelected && (
                                <span className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-black shadow-xs">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Pattern Subtitle */}
                          <span className="text-[10px] font-mono text-cyan-400 block mb-2 truncate">
                            {theme.patternType}
                          </span>

                          {/* REAL PATTERN PREVIEW WINDOW */}
                          <div
                            className={`h-28 w-full rounded-xl ${theme.previewBg} border ${theme.previewBorder} relative overflow-hidden flex items-center justify-center shadow-inner mb-2`}
                            style={theme.canvasStyle}
                          >
                            {/* Ambient Glow behind pattern */}
                            <div
                              className="absolute w-24 h-24 rounded-full blur-xl opacity-75 pointer-events-none"
                              style={{ background: theme.ambientGlowColor }}
                            />

                            {/* Mini Matrix board in front of pattern */}
                            <div className="relative z-10 grid grid-cols-4 gap-1 p-1.5 rounded-xl bg-black/70 border border-white/15 shadow-xl backdrop-blur-xs">
                              {[1, 2, 3, 4].map((num) => (
                                <span
                                  key={num}
                                  className={`w-4 h-4 rounded-md text-[8px] flex items-center justify-center font-bold ${
                                    num === 3
                                      ? 'bg-amber-400 text-black shadow-xs'
                                      : 'bg-white/20 text-gray-200 border border-white/10'
                                  }`}
                                >
                                  {num}
                                </span>
                              ))}
                            </div>
                          </div>

                          <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                            {theme.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBgThemeSelect(theme.id);
                          }}
                          className={`w-full mt-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-amber-400 text-black cursor-default'
                              : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 group-hover:text-white cursor-pointer'
                          }`}
                        >
                          {isSelected ? 'Active Pattern' : 'Apply Pattern'}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 4: SETTINGS & HARDWARE PREFERENCES                  */}
          {/* ======================================================= */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
              {/* Avatar Palette */}
              <div className="p-4 rounded-3xl bg-black/40 border border-gray-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-display font-bold text-white">Avatar Identity Palette</span>
                  <span className="font-mono text-cyan-300 font-bold">{activePalette.name}</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {AVATAR_PALETTES.map((pal) => {
                    const isSelected = selectedPalette === pal.id;
                    return (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() => handlePaletteSelect(pal.id)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                            : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br ${pal.from} ${pal.to} flex items-center justify-center ${
                            isSelected ? 'ring-2 ring-white scale-105' : 'opacity-80'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                        </div>
                        <span className="text-[10px] font-bold text-gray-300 truncate w-full">
                          {pal.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Sound */}
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    !isMuted
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200'
                      : 'bg-black/40 border-gray-800 text-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 rounded-lg bg-black/40">
                      {!isMuted ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
                    </div>
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.2 rounded-full font-bold ${
                        !isMuted ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {!isMuted ? 'ON' : 'MUTED'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs sm:text-sm text-white">Audio FX</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Game sound effects</p>
                  </div>
                </button>

                {/* Haptics */}
                <button
                  type="button"
                  onClick={toggleVibration}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    vibrationEnabled
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-200'
                      : 'bg-black/40 border-gray-800 text-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 rounded-lg bg-black/40">
                      <Smartphone className={`w-4 h-4 ${vibrationEnabled ? 'text-purple-400' : 'text-gray-400'}`} />
                    </div>
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.2 rounded-full font-bold ${
                        vibrationEnabled ? 'bg-purple-400 text-black' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {vibrationEnabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs sm:text-sm text-white">Haptics</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Mobile vibration tap</p>
                  </div>
                </button>

                {/* Fullscreen */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isFullscreen
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                      : 'bg-black/40 border-gray-800 text-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 rounded-lg bg-black/40">
                      {isFullscreen ? <Minimize className="w-4 h-4 text-amber-400" /> : <Maximize className="w-4 h-4 text-gray-400" />}
                    </div>
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.2 rounded-full font-bold ${
                        isFullscreen ? 'bg-amber-400 text-black' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {isFullscreen ? 'ACTIVE' : 'WINDOWED'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs sm:text-sm text-white">Fullscreen</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Hide browser URL header</p>
                  </div>
                </button>
              </div>

              {/* Status */}
              <div className="p-3.5 rounded-2xl bg-black/30 border border-gray-800 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Storage: Synced with Browser & Cloud</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold text-[11px]">ACTIVE</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
