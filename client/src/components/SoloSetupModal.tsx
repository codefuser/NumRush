import React, { useState, useEffect } from 'react';
import { X, Target, Play, RotateCcw, Plus, Minus, Clock } from 'lucide-react';
import { soundManager } from '../services/audio.js';
import { soloStorage, SavedSoloGame } from '../services/soloStorage.js';

export interface SoloGameConfig {
  maxNumber: number;
  gameMode: 'COMPLETE_GRID' | 'TIME_ATTACK';
  timeLimitSeconds: number;
  resumeSaved?: boolean;
}

interface SoloSetupModalProps {
  onClose: () => void;
  onStartGame: (config: SoloGameConfig) => void;
}

export const SoloSetupModal: React.FC<SoloSetupModalProps> = ({ onClose, onStartGame }) => {
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(50);
  const [customValue, setCustomValue] = useState<number>(75);
  const [gameMode, setGameMode] = useState<'COMPLETE_GRID' | 'TIME_ATTACK'>('COMPLETE_GRID');
  const [timeLimit, setTimeLimit] = useState<number>(120);
  const [savedGame, setSavedGame] = useState<SavedSoloGame | null>(null);

  useEffect(() => {
    const saved = soloStorage.getSavedGame();
    if (saved && saved.currentTarget <= saved.maxNumber) {
      setSavedGame(saved);
    }
  }, []);

  const effectiveMax = selectedPreset === 'custom' ? Math.min(200, Math.max(10, customValue || 50)) : selectedPreset;

  const handleStartNew = () => {
    soundManager.playCorrect();
    soloStorage.clearSavedGame();
    onStartGame({
      maxNumber: effectiveMax,
      gameMode,
      timeLimitSeconds: timeLimit,
      resumeSaved: false,
    });
  };

  const handleResume = () => {
    if (!savedGame) return;
    soundManager.playCorrect();
    onStartGame({
      maxNumber: savedGame.maxNumber,
      gameMode: savedGame.gameMode,
      timeLimitSeconds: savedGame.timeLimitSeconds,
      resumeSaved: true,
    });
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setCustomValue(Math.min(200, Math.max(1, val)));
    } else {
      setCustomValue(0);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-sm bg-[#0D1424] border border-cyan-500/30 rounded-3xl p-5 shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Target className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-display font-black text-base text-white">
                Solo Practice Setup
              </h2>
              <span className="text-[10px] font-mono text-gray-400">
                Choose target numbers & rules
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

        {/* 1. Saved Match Resume Card (If active game exists) */}
        {savedGame && (
          <div className="mt-3.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-display font-black text-white">
                  Saved Match Found
                </span>
              </div>
              <p className="text-[10px] font-mono text-amber-300/90 mt-0.5">
                Current target: #{savedGame.currentTarget} of {savedGame.maxNumber}
              </p>
            </div>

            <button
              onClick={handleResume}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-display font-black flex items-center gap-1 tap-effect shadow-md cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Resume
            </button>
          </div>
        )}

        {/* 2. Target Range Presets */}
        <div className="mt-4">
          <label className="text-[11px] font-mono uppercase text-cyan-400 font-bold tracking-wider block mb-2">
            Select Number Range
          </label>

          <div className="grid grid-cols-5 gap-1.5">
            {[30, 50, 100, 150].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setSelectedPreset(num)}
                className={`py-2 rounded-xl font-display font-black text-xs border transition-all text-center ${
                  selectedPreset === num
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                    : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                1–{num}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setSelectedPreset('custom')}
              className={`py-2 rounded-xl font-display font-black text-xs border transition-all text-center ${
                selectedPreset === 'custom'
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Theme-Styled Custom Number Input */}
          {selectedPreset === 'custom' && (
            <div className="mt-3 p-3 rounded-2xl bg-black/40 border border-amber-500/40 animate-fade-in">
              <span className="text-[10px] font-mono text-gray-400 block mb-1.5">
                Enter target count (10 – 200):
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomValue((v) => Math.max(10, v - 5))}
                  className="w-10 h-10 rounded-xl bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-300 flex items-center justify-center font-bold active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={customValue || ''}
                    onChange={handleCustomChange}
                    placeholder="e.g. 75"
                    className="w-full h-10 text-center font-display font-black text-base text-amber-400 bg-gray-900/80 border border-amber-500/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-mono text-gray-500 pointer-events-none">
                    tiles
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setCustomValue((v) => Math.min(200, v + 5))}
                  className="w-10 h-10 rounded-xl bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-300 flex items-center justify-center font-bold active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Jump Chips */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/80">
                <span className="text-[9px] font-mono text-gray-500">Quick:</span>
                {[25, 60, 75, 120].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCustomValue(val)}
                    className="px-2 py-0.5 rounded-lg bg-gray-900 border border-gray-800 text-[10px] font-mono text-gray-300 hover:text-white"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Objective Pill Selector */}
        <div className="mt-4">
          <label className="text-[11px] font-mono uppercase text-cyan-400 font-bold tracking-wider block mb-2">
            Game Objective
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGameMode('COMPLETE_GRID')}
              className={`py-2 px-3 rounded-xl border text-xs font-display font-bold transition-all text-center ${
                gameMode === 'COMPLETE_GRID'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                  : 'bg-gray-900/60 border-gray-800 text-gray-400'
              }`}
            >
              Complete Grid (1–{effectiveMax})
            </button>

            <button
              type="button"
              onClick={() => setGameMode('TIME_ATTACK')}
              className={`py-2 px-3 rounded-xl border text-xs font-display font-bold transition-all text-center flex items-center justify-center gap-1 ${
                gameMode === 'TIME_ATTACK'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                  : 'bg-gray-900/60 border-gray-800 text-gray-400'
              }`}
            >
              <Clock className="w-3 h-3" />
              Time Attack
            </button>
          </div>

          {gameMode === 'TIME_ATTACK' && (
            <div className="mt-2 flex items-center justify-center gap-2 p-1.5 rounded-xl bg-gray-900/60 border border-gray-800">
              <span className="text-[10px] text-gray-400 font-mono">Duration:</span>
              {[60, 120, 180].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setTimeLimit(sec)}
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                    timeLimit === sec
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. Action Buttons */}
        <div className="mt-5 pt-3 border-t border-gray-800 space-y-2">
          <button
            onClick={handleStartNew}
            className="w-full py-3 px-4 rounded-2xl font-display font-black text-sm text-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 tap-effect cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black stroke-none" />
            {savedGame ? `Start New Game (1 – ${effectiveMax})` : `Start Solo Hunt (1 – ${effectiveMax})`}
          </button>
        </div>
      </div>
    </div>
  );
};
