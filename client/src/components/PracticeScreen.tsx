import React, { useState, useEffect, useRef } from 'react';
import { Target, Clock, ArrowLeft, RotateCcw, Trophy, Check, Sparkles } from 'lucide-react';
import { soundManager } from '../services/audio.js';

interface PracticeScreenProps {
  onBack: () => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({ onBack }) => {
  const [maxNumber, setMaxNumber] = useState<number>(30);
  const [grid, setGrid] = useState<number[]>([]);
  const [currentTarget, setCurrentTarget] = useState<number>(1);
  const [claimedSet, setClaimedSet] = useState<Set<number>>(new Set());
  const [correctClicks, setCorrectClicks] = useState<number>(0);
  const [wrongClicks, setWrongClicks] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Shuffle local grid
  const startNewPractice = (max: number = maxNumber) => {
    const numbers: number[] = [];
    for (let i = 1; i <= max; i++) numbers.push(i);

    // Fisher-Yates
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    setGrid(numbers);
    setCurrentTarget(1);
    setClaimedSet(new Set());
    setCorrectClicks(0);
    setWrongClicks(0);
    setElapsedSeconds(0);
    setIsStarted(true);
    setIsFinished(false);
  };

  useEffect(() => {
    startNewPractice(maxNumber);
  }, [maxNumber]);

  // Local Practice Timer
  useEffect(() => {
    if (!isStarted || isFinished) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isStarted, isFinished]);

  const handleTileClick = (num: number) => {
    if (isFinished || claimedSet.has(num)) return;

    if (num === currentTarget) {
      soundManager.playCorrect();
      setCorrectClicks((c) => c + 1);
      const nextClaimed = new Set(claimedSet);
      nextClaimed.add(num);
      setClaimedSet(nextClaimed);

      if (num === maxNumber) {
        setIsFinished(true);
        soundManager.playVictory();
      } else {
        setCurrentTarget(num + 1);
      }
    } else {
      soundManager.playWrong();
      setWrongClicks((w) => w + 1);
    }
  };

  const totalClicks = correctClicks + wrongClicks;
  const accuracy = totalClicks > 0 ? Math.round((correctClicks / totalClicks) * 100) : 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-light hover:bg-gray-700 text-xs text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-2">
          {[
            { label: 'Easy (30)', count: 30 },
            { label: 'Medium (50)', count: 50 },
            { label: 'Hard (100)', count: 100 },
          ].map((mode) => (
            <button
              key={mode.count}
              onClick={() => {
                setMaxNumber(mode.count);
                startNewPractice(mode.count);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                maxNumber === mode.count
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                  : 'bg-surface-light text-gray-400 border-gray-800'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="glass-panel rounded-2xl p-4 mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300">
            <Target className="w-4 h-4" />
            <span className="text-xs font-mono uppercase">TARGET:</span>
            <span className="font-display font-black text-xl">
              {isFinished ? 'DONE' : currentTarget}
            </span>
          </div>

          <div className="hidden sm:flex flex-col text-xs font-mono text-gray-400">
            <span>Accuracy: <strong className="text-cyan-400">{accuracy}%</strong></span>
            <span>Progress: {claimedSet.size} / {maxNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-gray-800 text-xs font-mono text-gray-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <button
            onClick={() => startNewPractice(maxNumber)}
            title="Restart Practice"
            className="p-2 rounded-xl bg-surface-light hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Finished Summary Overlay */}
      {isFinished ? (
        <div className="glass-panel-glow rounded-3xl p-8 text-center my-6">
          <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-3 animate-spin-slow" />
          <h2 className="font-display font-black text-3xl text-white mb-2">Practice Complete!</h2>
          <p className="text-sm text-gray-300 mb-6">
            Completed 1 to {maxNumber} in <strong>{formatTime(elapsedSeconds)}</strong> with{' '}
            <strong>{accuracy}%</strong> accuracy.
          </p>

          <button
            onClick={() => startNewPractice(maxNumber)}
            className="px-6 py-3 rounded-xl font-display font-bold text-sm text-black bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all tap-effect"
          >
            Practice Again
          </button>
        </div>
      ) : (
        /* Practice Grid */
        <div className="glass-panel rounded-2xl p-3 sm:p-4 bg-black/40 border border-gray-800">
          <div
            className={`grid ${
              maxNumber <= 30
                ? 'grid-cols-5 sm:grid-cols-6'
                : maxNumber <= 50
                ? 'grid-cols-5 sm:grid-cols-10'
                : 'grid-cols-8 sm:grid-cols-10 md:grid-cols-12'
            } gap-2`}
          >
            {grid.map((num) => {
              const isTarget = num === currentTarget;
              const isClaimed = claimedSet.has(num);

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleTileClick(num)}
                  disabled={isClaimed}
                  className={`aspect-square rounded-xl font-display font-bold text-base sm:text-lg flex items-center justify-center transition-all tap-effect ${
                    isClaimed
                      ? 'bg-emerald-950/60 border-2 border-emerald-500 text-emerald-300 opacity-70 line-through'
                      : isTarget
                      ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse'
                      : 'bg-surface-light/60 border border-gray-800 text-gray-200 hover:border-cyan-500/50 hover:text-cyan-300'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
