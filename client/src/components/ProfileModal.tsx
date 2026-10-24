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
  Palette,
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
  ArrowUpRight,
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

type ProfileTab = 'STATS' | 'GRID_STYLES' | 'BG_THEMES' | 'SETTINGS';

const AVATAR_PALETTES = [
  { id: 'cyan', name: 'Cyber Cyan', from: 'from-cyan-400', via: 'via-sky-500', to: 'to-blue-600', ring: 'ring-cyan-400', hex: '#00F0FF' },
  { id: 'purple', name: 'Electric Violet', from: 'from-fuchsia-500', via: 'via-purple-600', to: 'to-indigo-600', ring: 'ring-purple-400', hex: '#A855F7' },
  { id: 'amber', name: 'Solar Amber', from: 'from-amber-400', via: 'via-orange-500', to: 'to-red-500', ring: 'ring-amber-400', hex: '#F59E0B' },
  { id: 'emerald', name: 'Matrix Emerald', from: 'from-emerald-400', via: 'via-teal-500', to: 'to-cyan-600', ring: 'ring-emerald-400', hex: '#10B981' },
  { id: 'rose', name: 'Neon Rose', from: 'from-rose-400', via: 'via-pink-500', to: 'to-purple-600', ring: 'ring-rose-400', hex: '#F43F5E' },
];

const RANK_TIERS = [
  { id: 'novice', title: 'Novice Hunter', minWins: 0, nextMin: 3, icon: Target, color: 'text-gray-300', border: 'border-gray-500/40', bg: 'bg-gray-500/10' },
  { id: 'pro', title: 'Pro Hunter', minWins: 3, nextMin: 10, icon: Zap, color: 'text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-500/10' },
  { id: 'elite', title: 'Elite Hunter', minWins: 10, nextMin: 25, icon: Award, color: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/10' },
  { id: 'master', title: 'Master Hunter', minWins: 25, nextMin: 50, icon: Flame, color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/10' },
  { id: 'grandmaster', title: 'Grandmaster', minWins: 50, nextMin: 100, icon: Crown, color: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-500/10' },
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
  const [bgCategoryFilter, setBgCategoryFilter] = useState<'ALL' | 'Space' | 'Cyber' | 'Gradient' | 'Minimal'>('ALL');

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

  // Current Rank Tier computation
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fade-in cursor-pointer select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl xl:max-w-5xl bg-[#090E1A]/95 border border-cyan-500/25 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.9)] ring-1 ring-white/10 flex flex-col h-[90vh] max-h-[820px] overflow-hidden cursor-default transition-all"
      >
        {/* 1. Header Hero Banner */}
        <div className="relative bg-gradient-to-r from-[#0E1628] via-[#111B32] to-[#0A101E] border-b border-gray-800/80 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
          {/* Subtle Ambient Top Glow */}
          <div className="absolute top-0 left-1/4 w-96 h-20 bg-cyan-500/10 blur-3xl pointer-events-none -z-0" />

          {/* Player Identity */}
          <div className="relative z-10 flex items-center gap-3.5 sm:gap-4 min-w-0">
            {/* Avatar with customized gradient & status indicator */}
            <div className="relative flex-shrink-0">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${activePalette.from} ${activePalette.via} ${activePalette.to} flex items-center justify-center font-display font-black text-xl sm:text-2xl text-black shadow-lg ring-2 ${activePalette.ring} ring-offset-2 ring-offset-[#090E1A]`}
              >
                {currentName.slice(0, 2).toUpperCase()}
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#090E1A] shadow-sm"
                title="Online & Synchronized"
              />
            </div>

            {/* Callsign & Tier Details */}
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    type="text"
                    value={nameInput}
                    maxLength={18}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="bg-black/70 border border-cyan-400 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none font-bold w-full shadow-inner"
                    autoFocus
                    placeholder="Enter callsign..."
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="p-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold transition-all active:scale-95 cursor-pointer shadow-md"
                    title="Save callsign"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-black text-lg sm:text-2xl text-white tracking-wide truncate">
                    {currentName}
                  </h1>
                  <button
                    onClick={() => {
                      setNameInput(currentName);
                      setIsEditing(true);
                    }}
                    className="p-1 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/5 transition-all cursor-pointer"
                    title="Edit Callsign"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-1">
                {/* Tier Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${currentTier.bg} ${currentTier.border} ${currentTier.color} shadow-sm`}
                >
                  <TierIcon className="w-3 h-3" />
                  <span>{currentTier.title}</span>
                </span>

                {/* Copyable Player ID */}
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-[10px] font-mono text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                  title="Click to copy Player ID"
                >
                  {copiedId ? (
                    <>
                      <CheckCheck className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-gray-500" />
                      <span>ID: {userId.slice(0, 8)}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Header Summary Pills & Close */}
          <div className="relative z-10 flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/60">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-gray-800/80 text-center">
                <span className="text-[9px] uppercase font-mono tracking-wider text-gray-400 block">Victories</span>
                <span className="font-display font-black text-sm text-amber-400">{wins}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-gray-800/80 text-center">
                <span className="text-[9px] uppercase font-mono tracking-wider text-gray-400 block">Win Rate</span>
                <span className="font-display font-black text-sm text-cyan-400">{winRate}%</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer border border-gray-700/60 shadow-md ml-1"
              aria-label="Close Profile"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Professional Horizontal Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-2 pb-0 border-b border-gray-800/80 bg-[#070B14]/80 flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
          {[
            { id: 'STATS' as ProfileTab, label: 'Career & Stats', icon: BarChart3, badge: `${totalMatches} Matches` },
            { id: 'GRID_STYLES' as ProfileTab, label: 'Grid Models', icon: LayoutGrid, badge: '6 Styles' },
            { id: 'BG_THEMES' as ProfileTab, label: 'Canvas Themes', icon: Palette, badge: '10 Themes' },
            { id: 'SETTINGS' as ProfileTab, label: 'Preferences', icon: Settings },
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
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-2xl font-display font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer relative ${
                  isActive
                    ? 'text-cyan-300 bg-cyan-950/40 border-t-2 border-x border-cyan-500/40 border-b-transparent shadow-[0_-5px_15px_rgba(0,240,255,0.1)]'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border-t-2 border-transparent'
                }`}
              >
                <TabIcon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold hidden md:inline ${
                      isActive ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                )}
              </button>
            );
          })}
        </div>

        {/* 3. Main Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ========================================================= */}
          {/* TAB 1: CAREER & STATS OVERVIEW                           */}
          {/* ========================================================= */}
          {activeTab === 'STATS' && (
            <div className="space-y-6 animate-fade-in">
              {/* Rank Tier Progress Stepper Banner */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#0D1527] to-[#0A0F1D] border border-cyan-500/25 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="font-display font-bold text-sm text-white">
                      Hunter Tier Progression
                    </span>
                  </div>
                  <span className="text-xs font-mono text-cyan-300 font-bold">
                    {isMaxRank
                      ? 'Maximum Rank Achieved (Grandmaster)'
                      : `${wins} / ${nextTier.minWins} Wins to reach ${nextTier.title}`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full bg-black/60 border border-gray-800 overflow-hidden mb-4 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-400 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(0,240,255,0.6)]"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Stepper Milestones */}
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {RANK_TIERS.map((tier, idx) => {
                    const isPassed = wins >= tier.minWins;
                    const isCurrent = currentTier.id === tier.id;
                    const NodeIcon = tier.icon;
                    return (
                      <div key={tier.id} className="text-center flex flex-col items-center">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                            isCurrent
                              ? 'bg-amber-400 text-black font-black ring-4 ring-amber-400/30 scale-110 shadow-lg'
                              : isPassed
                              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60'
                              : 'bg-gray-800/80 text-gray-500 border border-gray-700/60'
                          }`}
                        >
                          <NodeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs font-bold mt-1.5 truncate max-w-full block ${
                            isCurrent ? 'text-amber-300' : isPassed ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          {tier.title.split(' ')[0]}
                        </span>
                        <span className="text-[9px] font-mono text-gray-500 hidden sm:block">
                          {tier.minWins}+ Wins
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Career Performance Cards Grid */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold mb-3 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Career Performance Metrics
                </h3>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Matches */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-[#11192C] to-[#0A0F1D] border border-gray-800/80 hover:border-cyan-500/40 transition-all shadow-md">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                      <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Matches</span>
                      <Target className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="font-display font-black text-2xl sm:text-3xl text-white">
                      {totalMatches}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">Total games completed</span>
                  </div>

                  {/* Victories */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-[#11192C] to-[#0A0F1D] border border-gray-800/80 hover:border-amber-500/40 transition-all shadow-md">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                      <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Victories</span>
                      <Trophy className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="font-display font-black text-2xl sm:text-3xl text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                      {wins}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">Rank #1 match wins</span>
                  </div>

                  {/* Win Rate */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-[#11192C] to-[#0A0F1D] border border-gray-800/80 hover:border-cyan-500/40 transition-all shadow-md">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                      <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Win Rate</span>
                      <Zap className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="font-display font-black text-2xl sm:text-3xl text-cyan-300 drop-shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                      {winRate}%
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">Overall match win ratio</span>
                  </div>

                  {/* Best Score */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-[#11192C] to-[#0A0F1D] border border-gray-800/80 hover:border-purple-500/40 transition-all shadow-md">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                      <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Best Score</span>
                      <Flame className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="font-display font-black text-2xl sm:text-3xl text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                      {bestScore}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">Highest points in a match</span>
                  </div>
                </div>

                {/* Additional Precision Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-gray-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                        %
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-200 block">Hunting Precision Accuracy</span>
                        <span className="text-[10px] text-gray-400">Correct clicks vs misclicks</span>
                      </div>
                    </div>
                    <span className="font-display font-black text-lg text-emerald-400">
                      {avgAccuracy > 0 ? `${avgAccuracy}%` : '100%'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/40 border border-gray-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold">
                        ⚡
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-200 block">Average Reaction Latency</span>
                        <span className="text-[10px] text-gray-400">Time per valid number claim</span>
                      </div>
                    </div>
                    <span className="font-display font-black text-lg text-sky-400">
                      {avgReactionTimeMs > 0 ? `${avgReactionTimeMs}ms` : '380ms'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Match History Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                    Recent Battle Log
                  </h3>
                  <span className="text-[10px] font-mono text-gray-400">
                    Showing latest {Math.min(history.length, 10)} records
                  </span>
                </div>

                {history.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-black/30 border border-gray-800/80 text-gray-400 text-xs space-y-1">
                    <p className="font-semibold text-gray-300">No match records logged yet</p>
                    <p className="text-[11px] text-gray-500">Play a multiplayer match or solo practice round to build your career history!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {history.slice(0, 10).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#0D1424]/80 border border-gray-800 hover:border-gray-700 transition-all text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono tracking-wider uppercase ${
                              item.won
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                : 'bg-gray-800 text-gray-400 border border-gray-700'
                            }`}
                          >
                            {item.won ? 'VICTORY' : `RANK #${item.rank || 2}`}
                          </span>

                          <div>
                            <span className="font-bold text-gray-200 block">
                              {item.gameMode === 'TIME_CHALLENGE' ? 'Time Challenge Match' : 'Complete Grid Matrix'}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {item.accuracy ? `${item.accuracy}% Accuracy` : 'Completed match'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-display font-black text-sm text-cyan-400 block">
                            +{item.score} pts
                          </span>
                          <span className="text-[9px] font-mono text-gray-500">Verified</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: GRID DESIGN MODELS (TILE STYLES)                   */}
          {/* ========================================================= */}
          {activeTab === 'GRID_STYLES' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-800/80">
                <div>
                  <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-cyan-400" />
                    Grid Tile Models
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Select the visual architecture, borders, and tactile colors of number tiles.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-300 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 self-start sm:self-auto">
                  Active: {GRID_MODELS[selectedGridModel]?.name}
                </span>
              </div>

              {/* Grid Models Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {Object.values(GRID_MODELS).map((model) => {
                  const isSelected = selectedGridModel === model.id;
                  return (
                    <div
                      key={model.id}
                      onClick={() => handleGridModelSelect(model.id)}
                      className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                        isSelected
                          ? 'bg-gradient-to-b from-[#101F3B] to-[#0A1324] border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400 scale-[1.01]'
                          : 'bg-[#0D1424]/90 border-gray-800/90 hover:border-gray-700 hover:bg-[#111A30]'
                      }`}
                    >
                      <div>
                        {/* Header with Title and Active Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-display font-black text-sm text-white group-hover:text-cyan-300 transition-colors">
                            {model.name}
                          </span>
                          {isSelected ? (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-400 text-black text-[10px] font-black uppercase flex items-center gap-1 shadow-md">
                              <Check className="w-3 h-3 stroke-[3]" /> Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-gray-500 group-hover:text-gray-400">
                              Tap to Apply
                            </span>
                          )}
                        </div>

                        {/* Interactive Board Mock Preview */}
                        <div
                          className={`p-3 rounded-2xl ${model.boardBg} border ${model.boardBorder} mb-3 flex items-center justify-center gap-2 shadow-inner`}
                        >
                          {[1, 2, 3, 4].map((n) => (
                            <div
                              key={n}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-black text-sm transition-transform group-hover:scale-105 ${
                                n === 3
                                  ? 'bg-amber-400 text-black border-2 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                                  : n === 1
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                                  : 'bg-black/40 text-gray-200 border border-white/10'
                              }`}
                            >
                              {n}
                            </div>
                          ))}
                        </div>

                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {model.description}
                        </p>
                      </div>

                      {/* Action status */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGridModelSelect(model.id);
                        }}
                        className={`w-full mt-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-cyan-400 text-black shadow-md cursor-default'
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

          {/* ========================================================= */}
          {/* TAB 3: CANVAS BACKGROUND THEMES (10 RICH THEMES)          */}
          {/* ========================================================= */}
          {activeTab === 'BG_THEMES' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-800/80">
                <div>
                  <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-400" />
                    Atmospheric Canvas Environments ({Object.keys(BACKGROUND_THEMES).length} Themes)
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Sets the atmospheric background & ambient lighting for your game board.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-500/40 self-start sm:self-auto">
                  Active: {BACKGROUND_THEMES[selectedBgTheme]?.name}
                </span>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {(['ALL', 'Space', 'Cyber', 'Gradient', 'Minimal'] as const).map((cat) => {
                  const count =
                    cat === 'ALL'
                      ? Object.keys(BACKGROUND_THEMES).length
                      : Object.values(BACKGROUND_THEMES).filter((t) => t.category === cat).length;
                  const isCatActive = bgCategoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        soundManager.playCorrect();
                        setBgCategoryFilter(cat);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isCatActive
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                          : 'bg-gray-900/80 text-gray-400 border border-gray-800 hover:border-gray-700 hover:text-gray-200'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Themes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {Object.values(BACKGROUND_THEMES)
                  .filter((theme) => bgCategoryFilter === 'ALL' || theme.category === bgCategoryFilter)
                  .map((theme) => {
                    const isSelected = selectedBgTheme === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => handleBgThemeSelect(theme.id)}
                        className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                          isSelected
                            ? 'bg-gradient-to-b from-[#1E1610] to-[#0D0B0A] border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-400 scale-[1.01]'
                            : 'bg-[#0D1424]/90 border-gray-800/90 hover:border-gray-700 hover:bg-[#111A30]'
                        }`}
                      >
                        <div>
                          {/* Header */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-display font-black text-sm text-white group-hover:text-amber-300 transition-colors truncate max-w-[140px]">
                              {theme.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-black/60 text-gray-300 border border-gray-800">
                                {theme.category}
                              </span>
                              {isSelected && (
                                <span className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-black shadow-sm">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Canvas & Ambient Glow Preview Window */}
                          <div
                            className={`h-24 w-full rounded-2xl ${theme.previewBg} border ${theme.previewBorder} relative overflow-hidden flex items-center justify-center shadow-inner my-2.5 transition-transform group-hover:scale-[1.02]`}
                          >
                            {/* Ambient Glow Aura */}
                            <div
                              className="absolute w-24 h-24 rounded-full blur-xl opacity-80 pointer-events-none"
                              style={{ background: theme.ambientGlowColor }}
                            />

                            {/* Mini Matrix Preview */}
                            <div className="relative z-10 grid grid-cols-4 gap-1 p-1.5 rounded-xl bg-black/60 border border-white/10 shadow-lg backdrop-blur-xs">
                              {[1, 2, 3, 4].map((num) => (
                                <span
                                  key={num}
                                  className={`w-4 h-4 rounded-md text-[8px] flex items-center justify-center font-bold ${
                                    num === 3
                                      ? 'bg-amber-400 text-black shadow-xs'
                                      : 'bg-white/15 text-gray-300 border border-white/10'
                                  }`}
                                >
                                  {num}
                                </span>
                              ))}
                            </div>
                          </div>

                          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                            {theme.description}
                          </p>
                        </div>

                        {/* Action status */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBgThemeSelect(theme.id);
                          }}
                          className={`w-full mt-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-amber-400 text-black shadow-md cursor-default'
                              : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 group-hover:text-white cursor-pointer'
                          }`}
                        >
                          {isSelected ? 'Current Environment' : 'Apply Environment'}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: PREFERENCES & SETTINGS                             */}
          {/* ========================================================= */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
              {/* Avatar Cyber Palette Customizer */}
              <div className="p-4 sm:p-5 rounded-3xl bg-black/40 border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-sm text-white">Avatar Identity Palette</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Select your player avatar gradient glow
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {activePalette.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                  {AVATAR_PALETTES.map((pal) => {
                    const isSelected = selectedPalette === pal.id;
                    return (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() => handlePaletteSelect(pal.id)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                            : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pal.from} ${pal.to} flex items-center justify-center shadow-md ${
                            isSelected ? 'ring-2 ring-white scale-105' : 'opacity-80'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 text-black stroke-[3]" />}
                        </div>
                        <span className="text-xs font-bold text-gray-200">{pal.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hardware & Display Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Sound FX */}
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`p-4 rounded-3xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    !isMuted
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200'
                      : 'bg-black/40 border-gray-800 text-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-black/40">
                      {!isMuted ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-rose-400" />}
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                        !isMuted ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {!isMuted ? 'ON' : 'MUTED'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-white">Audio & FX</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Target pings & clicks</p>
                  </div>
                </button>

                {/* Haptic Vibrate */}
                <button
                  type="button"
                  onClick={toggleVibration}
                  className={`p-4 rounded-3xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    vibrationEnabled
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-200'
                      : 'bg-black/40 border-gray-800 text-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-black/40">
                      <Smartphone className={`w-5 h-5 ${vibrationEnabled ? 'text-purple-400' : 'text-gray-400'}`} />
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                        vibrationEnabled ? 'bg-purple-400 text-black' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {vibrationEnabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-white">Haptics</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Mobile vibration pulse</p>
                  </div>
                </button>

                {/* Fullscreen Mode */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className={`p-4 rounded-3xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isFullscreen
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                      : 'bg-black/40 border-gray-800 text-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-black/40">
                      {isFullscreen ? <Minimize className="w-5 h-5 text-amber-400" /> : <Maximize className="w-5 h-5 text-gray-400" />}
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                        isFullscreen ? 'bg-amber-400 text-black' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {isFullscreen ? 'ACTIVE' : 'WINDOWED'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-white">Fullscreen</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Hide browser URL header</p>
                  </div>
                </button>
              </div>

              {/* Data & Security Pill */}
              <div className="p-4 rounded-2xl bg-black/30 border border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Permanent Career Storage Synced with Browser & Cloud</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">STATUS: READY</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
