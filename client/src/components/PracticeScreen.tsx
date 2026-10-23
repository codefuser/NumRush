import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  Trophy,
  Check,
  Target,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../services/audio.js';

interface PracticeScreenProps {
  onBack: () => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({ onBack }) => {
  // Settings & Status
  const [maxNumber, setMaxNumber] = useState<number>(50);
  const [gameMode, setGameMode] = useState<'COMPLETE_GRID' | 'TIME_ATTACK'>('COMPLETE_GRID');
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(180);

  const [grid, setGrid] = useState<number[]>([]);
  const [currentTarget, setCurrentTarget] = useState<number>(1);
  const [claimedSet, setClaimedSet] = useState<Set<number>>(new Set());
  const [correctClicks, setCorrectClicks] = useState<number>(0);
  const [wrongClicks, setWrongClicks] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted());

  // Interactive Pan / Zoom state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const viewportRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const hasMovedRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);
  const lastTargetTimestampRef = useRef<number>(Date.now());
  const reactionTimesRef = useRef<number[]>([]);

  // Start / Restart solo match
  const startNewSoloGame = useCallback(
    (max: number = maxNumber, mode: 'COMPLETE_GRID' | 'TIME_ATTACK' = gameMode) => {
      const numbers: number[] = [];
      for (let i = 1; i <= max; i++) numbers.push(i);

      // Fisher-Yates shuffle
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
      reactionTimesRef.current = [];
      lastTargetTimestampRef.current = Date.now();
      setIsStarted(true);
      setIsFinished(false);
      setPan({ x: 0, y: 0 });
      setZoom(1);
    },
    [maxNumber, gameMode]
  );

  useEffect(() => {
    startNewSoloGame(maxNumber, gameMode);
  }, []);

  // Timer loop
  useEffect(() => {
    if (!isStarted || isFinished) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => {
        const next = s + 1;
        if (gameMode === 'TIME_ATTACK' && next >= timeLimitSeconds) {
          setIsFinished(true);
          soundManager.playVictory();
          return next;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isStarted, isFinished, gameMode, timeLimitSeconds]);

  // Click on tile
  const handleTileClick = (num: number) => {
    if (hasMovedRef.current) return;
    if (isFinished || claimedSet.has(num)) return;

    if (num === currentTarget) {
      soundManager.playCorrect();
      setCorrectClicks((c) => c + 1);

      const reactionTime = Date.now() - lastTargetTimestampRef.current;
      reactionTimesRef.current.push(reactionTime);
      lastTargetTimestampRef.current = Date.now();

      const nextClaimed = new Set(claimedSet);
      nextClaimed.add(num);
      setClaimedSet(nextClaimed);

      if (num === maxNumber) {
        setIsFinished(true);
        soundManager.playVictory();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        setCurrentTarget(num + 1);
      }
    } else {
      soundManager.playWrong();
      setWrongClicks((w) => w + 1);
    }
  };

  // Pointer Drag & Pinch Zoom Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((z) => Math.min(2.5, Math.max(0.4, Math.round((z + delta) * 100) / 100)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 1) {
      isDraggingRef.current = true;
      hasMovedRef.current = false;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { ...pan };
    } else if (activePointersRef.current.size === 2) {
      const points = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      initialPinchDistRef.current = dist;
      initialZoomRef.current = zoom;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2 && initialPinchDistRef.current) {
      const points = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const ratio = dist / initialPinchDistRef.current;
      setZoom(Math.min(2.5, Math.max(0.4, Math.round(initialZoomRef.current * ratio * 100) / 100)));
      hasMovedRef.current = true;
      return;
    }

    if (isDraggingRef.current && activePointersRef.current.size === 1) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        hasMovedRef.current = true;
      }

      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size === 0) {
      isDraggingRef.current = false;
      initialPinchDistRef.current = null;
    }
  };

  const handleFitScreen = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Metrics
  const totalClicks = correctClicks + wrongClicks;
  const accuracy = totalClicks > 0 ? Math.round((correctClicks / totalClicks) * 100) : 0;
  const avgReactionMs =
    reactionTimesRef.current.length > 0
      ? Math.round(
          reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length
        )
      : 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const gridCols = maxNumber <= 50 ? 10 : maxNumber <= 100 ? 10 : 15;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#070b13] text-gray-100 select-none overflow-hidden touch-none">
      {/* 1. Sleek Minimal Game HUD */}
      <header className="h-14 bg-[#0B0F19]/95 border-b border-gray-800/80 px-3 flex items-center justify-between z-30 flex-shrink-0">
        {/* Left: Back & Mode Picker */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            title="Back to Home"
            className="p-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            {[30, 50, 100, 150].map((count) => (
              <button
                key={count}
                onClick={() => {
                  setMaxNumber(count);
                  startNewSoloGame(count, gameMode);
                }}
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                  maxNumber === count
                    ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400'
                    : 'bg-gray-900/60 text-gray-400 border-gray-800'
                }`}
              >
                1–{count}
              </button>
            ))}
          </div>
        </div>

        {/* Center: TARGET NUMBER TO HUNT */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <span className="text-[10px] font-mono uppercase text-amber-300 font-semibold tracking-wider">
            FIND
          </span>
          <span className="font-display font-black text-2xl text-amber-400 tracking-tight">
            {isFinished ? 'DONE' : currentTarget}
          </span>
        </div>

        {/* Right: Time, Restart, Sound */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-900 border border-gray-800 text-xs font-mono text-cyan-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <button
            onClick={() => startNewSoloGame(maxNumber, gameMode)}
            title="Restart"
            className="p-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* 2. Interactive Pan & Zoom Game Canvas */}
      <main
        ref={viewportRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex-1 relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing bg-[#070b13]"
        style={{ touchAction: 'none' }}
      >
        {/* Floating Matrix */}
        <div
          ref={boardRef}
          className="absolute origin-center will-change-transform p-3"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDraggingRef.current ? 'none' : 'transform 0.08s ease-out',
            left: '50%',
            top: '50%',
            transformOrigin: '0 0',
            marginLeft: `-${(gridCols * 48) / 2}px`,
            marginTop: `-${(Math.ceil(maxNumber / gridCols) * 48) / 2}px`,
          }}
        >
          {/* Numbers Grid (NO TARGET HIGHLIGHT — player must search!) */}
          <div
            className="grid gap-1.5 select-none"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, minmax(42px, 48px))`,
            }}
          >
            {grid.map((num) => {
              const isClaimed = claimedSet.has(num);

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleTileClick(num)}
                  disabled={isClaimed}
                  className={`flex items-center justify-center aspect-square rounded-md sm:rounded-lg font-display font-semibold text-xs sm:text-sm select-none transition-colors duration-75 focus:outline-none ${
                    isClaimed
                      ? 'bg-emerald-950/40 border border-emerald-500/70 text-emerald-400 line-through opacity-70'
                      : 'bg-[#161f30] hover:bg-[#1e2a40] active:scale-95 border border-slate-800 text-gray-200 active:bg-cyan-900/40'
                  }`}
                >
                  {isClaimed ? (
                    <span className="flex items-center gap-0.5">
                      {num} <Check className="w-2.5 h-2.5 inline text-emerald-400" />
                    </span>
                  ) : (
                    num
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Floating Zoom Pills */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-[#111827]/85 backdrop-blur-md p-1 rounded-xl border border-gray-800 shadow-xl z-20">
          <button
            onClick={() => setZoom((z) => Math.max(0.4, Math.round((z - 0.15) * 100) / 100))}
            className="p-2 text-gray-300 hover:text-white rounded-lg active:bg-gray-700"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitScreen}
            className="px-2 py-1 text-[11px] font-mono text-cyan-300 hover:text-white rounded-lg active:bg-gray-700"
          >
            Fit
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.15) * 100) / 100))}
            className="p-2 text-gray-300 hover:text-white rounded-lg active:bg-gray-700"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Left Stats Pill */}
        <div className="absolute bottom-4 left-4 bg-[#111827]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-800 text-[11px] font-mono text-gray-400 z-20 pointer-events-none">
          Progress: <span className="text-cyan-400 font-bold">{claimedSet.size}</span>/{maxNumber} • Acc:{' '}
          <span className="text-emerald-400 font-bold">{accuracy}%</span>
        </div>
      </main>

      {/* 3. Solo Game Finished Overlay */}
      {isFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0F172A] border border-cyan-500/40 rounded-2xl p-6 text-center shadow-2xl">
            <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-2 animate-bounce" />
            <h2 className="font-display font-black text-2xl text-white mb-1">
              Solo Match Complete!
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Found all {maxNumber} numbers in sequence
            </p>

            <div className="grid grid-cols-3 gap-2 mb-5 text-center">
              <div className="p-2 rounded-xl bg-gray-900 border border-gray-800">
                <span className="text-[9px] text-gray-500 font-mono uppercase block">Time</span>
                <span className="font-display font-bold text-sm text-cyan-400">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-gray-900 border border-gray-800">
                <span className="text-[9px] text-gray-500 font-mono uppercase block">Accuracy</span>
                <span className="font-display font-bold text-sm text-emerald-400">
                  {accuracy}%
                </span>
              </div>

              <div className="p-2 rounded-xl bg-gray-900 border border-gray-800">
                <span className="text-[9px] text-gray-500 font-mono uppercase block">Reaction</span>
                <span className="font-display font-bold text-sm text-purple-400">
                  {avgReactionMs}ms
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200"
              >
                Back to Home
              </button>

              <button
                onClick={() => startNewSoloGame(maxNumber, gameMode)}
                className="flex-1 py-3 rounded-xl font-display font-bold text-xs text-black bg-cyan-400 hover:bg-cyan-300 shadow-md"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
