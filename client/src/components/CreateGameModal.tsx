import React, { useState } from 'react';
import { X, Sliders, Clock, ShieldAlert, Sparkles, Plus, Minus, Lock, Globe, Users } from 'lucide-react';
import type { RoomSettings, GameMode, WrongClickPenalty } from '../types/index.js';
import { soundManager } from '../services/audio.js';

interface CreateGameModalProps {
  onClose: () => void;
  onCreateRoom: (settings: RoomSettings) => void;
  isLoading: boolean;
}

export const CreateGameModal: React.FC<CreateGameModalProps> = ({ onClose, onCreateRoom, isLoading }) => {
  const [rangePreset, setRangePreset] = useState<number | 'custom'>(100);
  const [customCount, setCustomCount] = useState<number>(100);

  const [playerLimit, setPlayerLimit] = useState<number>(4);
  const [gameMode, setGameMode] = useState<GameMode>('TIME_CHALLENGE');
  const [durationPreset, setDurationPreset] = useState<number>(180);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(5);
  const [wrongClickPenalty, setWrongClickPenalty] = useState<WrongClickPenalty>('NONE');

  const [error, setError] = useState<string | null>(null);

  const effectiveMax = rangePreset === 'custom' ? Math.min(300, Math.max(10, customCount || 50)) : rangePreset;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    soundManager.playCorrect();

    const settings: RoomSettings = {
      numberRange: { min: 1, max: effectiveMax },
      playerLimit,
      countdownSeconds: countdown,
      gameMode,
      durationSeconds: durationPreset,
      isPrivate,
      wrongClickPenalty,
      allowLateJoin: false,
      allowSpectators: false,
      soundEnabled: true,
    };

    onCreateRoom(settings);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-md bg-[#0D1424] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,240,255,0.2)] my-auto max-h-[92vh] flex flex-col cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-base sm:text-lg text-white">
                Create Match
              </h2>
              <span className="text-[11px] text-gray-400">
                Configure your multiplayer room
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2 flex-shrink-0">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleCreate} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* 1. Target Number Range */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono uppercase text-cyan-400 font-bold tracking-wider">
                Target Number Range
              </label>
              <span className="text-xs font-mono font-bold text-amber-400">
                1 – {effectiveMax} tiles
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[50, 100, 150].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRangePreset(val)}
                  className={`py-2 rounded-xl text-xs font-display font-black border transition-all text-center cursor-pointer ${
                    rangePreset === val
                      ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  1–{val}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setRangePreset('custom')}
                className={`py-2 rounded-xl text-xs font-display font-black border transition-all text-center cursor-pointer ${
                  rangePreset === 'custom'
                    ? 'bg-amber-500/25 text-amber-300 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:border-gray-700'
                }`}
              >
                Custom
              </button>
            </div>

            {/* Custom Input */}
            {rangePreset === 'custom' && (
              <div className="mt-2.5 p-3 rounded-2xl bg-black/40 border border-amber-500/40 animate-fade-in">
                <span className="text-[10px] font-mono text-gray-400 block mb-1.5">
                  Enter target count (10 – 300):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomCount((v) => Math.max(10, v - 10))}
                    className="w-9 h-9 rounded-xl bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-300 flex items-center justify-center font-bold active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min={10}
                      max={300}
                      value={customCount || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setCustomCount(isNaN(val) ? 0 : Math.min(300, Math.max(1, val)));
                      }}
                      className="w-full h-9 text-center font-display font-black text-sm text-amber-400 bg-gray-900/80 border border-amber-500/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-gray-500 pointer-events-none">
                      tiles
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCustomCount((v) => Math.min(300, v + 10))}
                    className="w-9 h-9 rounded-xl bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-300 flex items-center justify-center font-bold active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Player Capacity Limit (2 to 10 players) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono uppercase text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Player Limit
              </label>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {playerLimit} Players Max
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setPlayerLimit((p) => Math.max(2, p - 1))}
                className="w-10 h-10 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 flex items-center justify-center font-bold border border-gray-700 active:scale-95 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex-1 py-2 text-center bg-gray-900/90 border border-cyan-500/40 rounded-xl text-sm font-display font-black text-white shadow-inner">
                {playerLimit} Players Max (2–10)
              </div>

              <button
                type="button"
                onClick={() => setPlayerLimit((p) => Math.min(10, p + 1))}
                className="w-10 h-10 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 flex items-center justify-center font-bold border border-gray-700 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Chips Row */}
            <div className="grid grid-cols-5 sm:grid-cols-9 gap-1">
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setPlayerLimit(count)}
                  className={`py-1 text-center rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                    playerLimit === count
                      ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400'
                      : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {count}P
                </button>
              ))}
            </div>
          </div>

          {/* 3. Game Mode & Duration */}
          <div>
            <label className="text-[11px] font-mono uppercase text-cyan-400 font-bold tracking-wider block mb-2">
              Game Mode
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGameMode('TIME_CHALLENGE')}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  gameMode === 'TIME_CHALLENGE'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm'
                    : 'bg-gray-900/60 text-gray-400 border-gray-800'
                }`}
              >
                <div className="flex items-center gap-1.5 font-display font-black text-xs text-white mb-0.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Time Challenge
                </div>
                <div className="text-[10px] text-gray-400">Score highest within time</div>
              </button>

              <button
                type="button"
                onClick={() => setGameMode('COMPLETE_GRID')}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  gameMode === 'COMPLETE_GRID'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm'
                    : 'bg-gray-900/60 text-gray-400 border-gray-800'
                }`}
              >
                <div className="flex items-center gap-1.5 font-display font-black text-xs text-white mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Complete Grid
                </div>
                <div className="text-[10px] text-gray-400">Hunt until all cleared</div>
              </button>
            </div>

            {/* Duration Selector (for Time Challenge) */}
            {gameMode === 'TIME_CHALLENGE' && (
              <div className="mt-2.5 flex items-center gap-2 p-2 rounded-xl bg-gray-900/60 border border-gray-800">
                <span className="text-xs text-gray-400 font-mono">Duration:</span>
                {[
                  { label: '1m', sec: 60 },
                  { label: '3m', sec: 180 },
                  { label: '5m', sec: 300 },
                  { label: '10m', sec: 600 },
                ].map((item) => (
                  <button
                    key={item.sec}
                    type="button"
                    onClick={() => setDurationPreset(item.sec)}
                    className={`flex-1 py-1 text-center rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                      durationPreset === item.sec
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                        : 'bg-gray-800/40 text-gray-400 border-gray-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Room Privacy Toggle */}
          <div className="p-3 rounded-2xl bg-[#11192d]/70 border border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPrivate ? (
                <Lock className="w-4 h-4 text-amber-400" />
              ) : (
                <Globe className="w-4 h-4 text-cyan-400" />
              )}
              <div>
                <div className="font-display font-bold text-xs text-white">
                  {isPrivate ? 'Private Room' : 'Public Room'}
                </div>
                <div className="text-[10px] text-gray-400">
                  {isPrivate ? 'Only friends with room code can join' : 'Listed in public live lobbies'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold border transition-colors cursor-pointer ${
                isPrivate
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              }`}
            >
              {isPrivate ? 'Private' : 'Public'}
            </button>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl font-display font-black text-sm text-black bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-400 hover:brightness-110 shadow-[0_0_25px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 tap-effect cursor-pointer disabled:opacity-50"
            >
              <Users className="w-4 h-4 stroke-[2.5]" />
              {isLoading ? 'Creating Room...' : `Create Room (1–${effectiveMax})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
