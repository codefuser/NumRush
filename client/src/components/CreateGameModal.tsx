import React, { useState } from 'react';
import { X, Sliders, Clock, ShieldAlert, Sparkles, ChevronRight } from 'lucide-react';
import type { RoomSettings, GameMode, WrongClickPenalty } from '../types/index.js';

interface CreateGameModalProps {
  onClose: () => void;
  onCreateRoom: (settings: RoomSettings) => void;
  isLoading: boolean;
}

export const CreateGameModal: React.FC<CreateGameModalProps> = ({ onClose, onCreateRoom, isLoading }) => {
  const [rangePreset, setRangePreset] = useState<string>('150');
  const [customMin, setCustomMin] = useState<number>(1);
  const [customMax, setCustomMax] = useState<number>(150);

  const [playerLimit, setPlayerLimit] = useState<number>(4);
  const [countdown, setCountdown] = useState<number>(5);
  const [gameMode, setGameMode] = useState<GameMode>('TIME_CHALLENGE');
  const [durationPreset, setDurationPreset] = useState<number>(180);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [wrongClickPenalty, setWrongClickPenalty] = useState<WrongClickPenalty>('NONE');

  const [error, setError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let min = 1;
    let max = 150;

    if (rangePreset === 'custom') {
      min = customMin;
      max = customMax;
      if (min < 1) {
        setError('Minimum number must be 1 or higher');
        return;
      }
      if (max <= min) {
        setError('Maximum number must be greater than minimum');
        return;
      }
      if (max - min + 1 < 5) {
        setError('Grid must contain at least 5 numbers');
        return;
      }
      if (max > 500) {
        setError('Maximum number cannot exceed 500');
        return;
      }
    } else {
      max = parseInt(rangePreset, 10);
    }

    const settings: RoomSettings = {
      numberRange: { min, max },
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

  const getRangeCount = () => {
    if (rangePreset === 'custom') return Math.max(0, customMax - customMin + 1);
    return parseInt(rangePreset, 10);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0F172A] border border-cyan-500/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-white">Create Match</h2>
              <span className="text-[11px] text-gray-400">Configure your multiplayer game</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-800 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2 flex-shrink-0">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleCreate} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Number Range */}
          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Number Range ({getRangeCount()} Numbers)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {['50', '100', '150', '200', '300', 'custom'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRangePreset(val)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                    rangePreset === val
                      ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 font-bold'
                      : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {val === 'custom' ? 'Custom' : `1–${val}`}
                </button>
              ))}
            </div>

            {rangePreset === 'custom' && (
              <div className="mt-2 flex items-center gap-2 p-2 bg-black/40 rounded-xl border border-gray-800">
                <div className="flex-1">
                  <span className="text-[10px] text-gray-400 block mb-0.5">Min (≥ 1)</span>
                  <input
                    type="number"
                    min="1"
                    max="490"
                    value={customMin}
                    onChange={(e) => setCustomMin(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <span className="text-gray-500 mt-3 text-xs">to</span>
                <div className="flex-1">
                  <span className="text-[10px] text-gray-400 block mb-0.5">Max (≤ 500)</span>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={customMax}
                    onChange={(e) => setCustomMax(parseInt(e.target.value, 10) || 50)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Game Mode */}
          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Game Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGameMode('TIME_CHALLENGE')}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  gameMode === 'TIME_CHALLENGE'
                    ? 'bg-purple-500/25 text-purple-300 border-purple-400'
                    : 'bg-gray-900/60 text-gray-400 border-gray-800'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  Time Challenge
                </div>
                <div className="text-[10px] opacity-75 mt-0.5">Most points in time</div>
              </button>

              <button
                type="button"
                onClick={() => setGameMode('COMPLETE_GRID')}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  gameMode === 'COMPLETE_GRID'
                    ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400'
                    : 'bg-gray-900/60 text-gray-400 border-gray-800'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Complete Grid
                </div>
                <div className="text-[10px] opacity-75 mt-0.5">Play until all found</div>
              </button>
            </div>
          </div>

          {/* Duration & Capacity (side by side) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Duration
              </label>
              <div className="grid grid-cols-4 gap-1">
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
                    className={`py-1.5 text-center rounded-lg text-xs font-semibold border ${
                      durationPreset === item.sec
                        ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400'
                        : 'bg-gray-900/60 text-gray-400 border-gray-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Player Limit
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[2, 4, 10].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setPlayerLimit(count)}
                    className={`py-1.5 text-center rounded-lg text-xs font-semibold border ${
                      playerLimit === count
                        ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400'
                        : 'bg-gray-900/60 text-gray-400 border-gray-800'
                    }`}
                  >
                    {count}P
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Countdown & Penalty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Countdown
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[5, 10, 30].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setCountdown(sec)}
                    className={`py-1.5 text-center rounded-lg text-xs font-semibold border ${
                      countdown === sec
                        ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400'
                        : 'bg-gray-900/60 text-gray-400 border-gray-800'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Mistake Penalty
              </label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setWrongClickPenalty('NONE')}
                  className={`py-1.5 text-center rounded-lg text-xs font-semibold border ${
                    wrongClickPenalty === 'NONE'
                      ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400'
                      : 'bg-gray-900/60 text-gray-400 border-gray-800'
                  }`}
                >
                  Off
                </button>
                <button
                  type="button"
                  onClick={() => setWrongClickPenalty('SCORE')}
                  className={`py-1.5 text-center rounded-lg text-xs font-semibold border ${
                    wrongClickPenalty === 'SCORE'
                      ? 'bg-rose-500/25 text-rose-300 border-rose-400'
                      : 'bg-gray-900/60 text-gray-400 border-gray-800'
                  }`}
                >
                  -1 Pt
                </button>
              </div>
            </div>
          </div>

          {/* Private room toggle */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded bg-gray-900 border-gray-700 text-cyan-500 focus:ring-0"
              />
              Private Match (Only friends with code can join)
            </label>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-display font-extrabold text-sm sm:text-base text-black bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-400 hover:opacity-95 shadow-lg transition-all tap-effect flex items-center justify-center gap-2"
            >
              {isLoading ? 'Creating Room...' : 'Create Room & Enter'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
