import React, { useState } from 'react';
import { X, Sliders, Users, Clock, ShieldAlert, Sparkles, Check, ChevronRight } from 'lucide-react';
import type { RoomSettings, GameMode, WrongClickPenalty } from '../types/index.js';

interface CreateGameModalProps {
  onClose: () => void;
  onCreateRoom: (settings: RoomSettings) => void;
  isLoading: boolean;
}

export const CreateGameModal: React.FC<CreateGameModalProps> = ({ onClose, onCreateRoom, isLoading }) => {
  // Preset selections or custom
  const [rangePreset, setRangePreset] = useState<string>('150');
  const [customMin, setCustomMin] = useState<number>(1);
  const [customMax, setCustomMax] = useState<number>(150);

  const [playerLimit, setPlayerLimit] = useState<number>(4);
  const [countdown, setCountdown] = useState<number>(5);
  const [gameMode, setGameMode] = useState<GameMode>('TIME_CHALLENGE');
  const [durationPreset, setDurationPreset] = useState<number>(180); // 3 minutes
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [roomPassword, setRoomPassword] = useState<string>('');
  const [wrongClickPenalty, setWrongClickPenalty] = useState<WrongClickPenalty>('NONE');
  const [allowLateJoin, setAllowLateJoin] = useState<boolean>(false);
  const [allowSpectators, setAllowSpectators] = useState<boolean>(false);

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
      password: roomPassword.trim() || undefined,
      wrongClickPenalty,
      allowLateJoin,
      allowSpectators,
      soundEnabled: true,
    };

    onCreateRoom(settings);
  };

  const getRangeCount = () => {
    if (rangePreset === 'custom') return Math.max(0, customMax - customMin + 1);
    return parseInt(rangePreset, 10);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-surface border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.15)] my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-surface-light text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-2xl text-white">Create New Match</h2>
            <p className="text-xs text-gray-400">Configure your multiplayer hunt room & game rules</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Section 1: Number Range */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Number Range ({getRangeCount()} Numbers)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {['50', '100', '150', '200', '300', 'custom'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRangePreset(val)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    rangePreset === val
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                      : 'bg-surface-light/50 text-gray-400 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {val === 'custom' ? 'Custom' : `1–${val}`}
                </button>
              ))}
            </div>

            {rangePreset === 'custom' && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-surface-light/40 rounded-xl border border-gray-800">
                <div className="flex-1">
                  <span className="text-[10px] text-gray-400 block mb-1">Min (≥ 1)</span>
                  <input
                    type="number"
                    min="1"
                    max="490"
                    value={customMin}
                    onChange={(e) => setCustomMin(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-black/40 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <span className="text-gray-500 mt-4">to</span>
                <div className="flex-1">
                  <span className="text-[10px] text-gray-400 block mb-1">Max (≤ 500)</span>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={customMax}
                    onChange={(e) => setCustomMax(parseInt(e.target.value, 10) || 50)}
                    className="w-full bg-black/40 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Game Mode & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Game Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGameMode('TIME_CHALLENGE')}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    gameMode === 'TIME_CHALLENGE'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-400 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                      : 'bg-surface-light/50 text-gray-400 border-gray-800'
                  }`}
                >
                  <Clock className="w-4 h-4 mb-1 text-purple-400" />
                  <div className="font-bold text-xs">Time Challenge</div>
                  <div className="text-[10px] opacity-75">Highest score when time expires</div>
                </button>
                <button
                  type="button"
                  onClick={() => setGameMode('COMPLETE_GRID')}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    gameMode === 'COMPLETE_GRID'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                      : 'bg-surface-light/50 text-gray-400 border-gray-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 mb-1 text-cyan-400" />
                  <div className="font-bold text-xs">Complete Grid</div>
                  <div className="text-[10px] opacity-75">Play until all targets claimed</div>
                </button>
              </div>
            </div>

            {/* Time Duration */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
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
                    className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-all ${
                      durationPreset === item.sec
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                        : 'bg-surface-light/50 text-gray-400 border-gray-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Player Limit & Countdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Player Capacity ({playerLimit} Players)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '2 Players', count: 2 },
                  { label: '4 Players', count: 4 },
                  { label: '10 Players', count: 10 },
                ].map((p) => (
                  <button
                    key={p.count}
                    type="button"
                    onClick={() => setPlayerLimit(p.count)}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-all ${
                      playerLimit === p.count
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                        : 'bg-surface-light/50 text-gray-400 border-gray-800'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Start Countdown
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '5 Sec', sec: 5 },
                  { label: '10 Sec', sec: 10 },
                  { label: '30 Sec', sec: 30 },
                ].map((c) => (
                  <button
                    key={c.sec}
                    type="button"
                    onClick={() => setCountdown(c.sec)}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-all ${
                      countdown === c.sec
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                        : 'bg-surface-light/50 text-gray-400 border-gray-800'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Optional Rules & Penalty */}
          <div className="p-4 bg-surface-light/30 rounded-2xl border border-gray-800 space-y-3">
            <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Optional Rules & Penalties
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setWrongClickPenalty('NONE')}
                className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border ${
                  wrongClickPenalty === 'NONE'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                    : 'bg-surface-light/40 text-gray-400 border-gray-800'
                }`}
              >
                No Penalty
              </button>
              <button
                type="button"
                onClick={() => setWrongClickPenalty('SCORE')}
                className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border ${
                  wrongClickPenalty === 'SCORE'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400'
                    : 'bg-surface-light/40 text-gray-400 border-gray-800'
                }`}
              >
                -1 Score on Mistake
              </button>
              <button
                type="button"
                onClick={() => setWrongClickPenalty('TIME')}
                className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border ${
                  wrongClickPenalty === 'TIME'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                    : 'bg-surface-light/40 text-gray-400 border-gray-800'
                }`}
              >
                Click Lockout
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded bg-gray-900 border-gray-700 text-cyan-500 focus:ring-0"
                />
                Private Room (Hidden from public list)
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={allowLateJoin}
                  onChange={(e) => setAllowLateJoin(e.target.checked)}
                  className="rounded bg-gray-900 border-gray-700 text-cyan-500 focus:ring-0"
                />
                Allow Late Joining
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl font-display font-extrabold text-base text-black bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-400 hover:opacity-95 shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all tap-effect flex items-center justify-center gap-2"
          >
            {isLoading ? 'Creating Room...' : 'Create Room & Enter Lobby'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
