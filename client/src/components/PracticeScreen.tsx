import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Volume2,
  VolumeX,
  Check,
  Target,
  Play,
  RotateCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../services/audio.js';
import { soloStorage } from '../services/soloStorage.js';
import { api } from '../services/api.js';
import type { SoloGameConfig } from './SoloSetupModal.js';

interface PracticeScreenProps {
  config?: SoloGameConfig;
  userId?: string;
  displayName?: string;
  onBack: () => void;
  onChangeSettings?: () => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  config = { maxNumber: 50, gameMode: 'COMPLETE_GRID', timeLimitSeconds: 180 },
  userId,
  displayName,
  onBack,
  onChangeSettings,
}) => {
  const maxNumber = config.maxNumber;
  const gameMode = config.gameMode;
  const timeLimitSeconds = config.timeLimitSeconds;

  const [grid, setGrid] = useState<number[]>([]);
  const [currentTarget, setCurrentTarget] = useState<number>(1);
  const [claimedSet, setClaimedSet] = useState<Set<number>>(new Set());
  const [correctClicks, setCorrectClicks] = useState<number>(0);
  const [wrongClicks, setWrongClicks] = useState<number>(0);
  const [wrongNumFlash, setWrongNumFlash] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(() => (config.resumeSaved ? null : 3));
  const [isStarted, setIsStarted] = useState<boolean>(() => !!config.resumeSaved);
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

  // Columns & Sizing
  const gridCols =
    maxNumber <= 30 ? 5 :
    maxNumber <= 50 ? 5 :
    maxNumber <= 75 ? 6 :
    maxNumber <= 100 ? 8 : 10;

  const tileSize = maxNumber <= 50 ? 54 : maxNumber <= 100 ? 44 : 38;

  // Auto-fit helper
  const calculateFitZoom = useCallback(() => {
    if (!viewportRef.current) return 1;
    const vw = viewportRef.current.clientWidth;
    const vh = viewportRef.current.clientHeight;

    const gap = 8;
    const totalCols = gridCols;
    const totalRows = Math.ceil(maxNumber / totalCols);

    const boardW = totalCols * tileSize + (totalCols - 1) * gap + 32;
    const boardH = totalRows * tileSize + (totalRows - 1) * gap + 32;

    const scaleX = (vw - 20) / boardW;
    const scaleY = (vh - 20) / boardH;
    const idealZoom = Math.min(scaleX, scaleY, 1.15);
    return Math.max(0.35, Math.round(idealZoom * 100) / 100);
  }, [maxNumber, gridCols, tileSize]);

  // Audio cues on countdown
  useEffect(() => {
    if (countdownRemaining !== null) {
      if (countdownRemaining > 0) {
        soundManager.playCountdown(false);
      } else if (countdownRemaining === 0) {
        soundManager.playCountdown(true);
      }
    }
  }, [countdownRemaining]);

  // Countdown timer loop
  useEffect(() => {
    if (countdownRemaining === null) return;
    if (countdownRemaining > 0) {
      const timer = setTimeout(() => {
        setCountdownRemaining(countdownRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdownRemaining === 0) {
      const timer = setTimeout(() => {
        setCountdownRemaining(null);
        setIsStarted(true);
        lastTargetTimestampRef.current = Date.now();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [countdownRemaining]);

  // Start fresh solo match
  const startNewSoloGame = useCallback(() => {
    soloStorage.clearSavedGame();

    const numbers: number[] = [];
    for (let i = 1; i <= maxNumber; i++) numbers.push(i);

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
    setWrongNumFlash(null);
    setElapsedSeconds(0);
    reactionTimesRef.current = [];
    lastTargetTimestampRef.current = Date.now();
    setIsStarted(false);
    setIsFinished(false);
    setCountdownRemaining(3);
    setPan({ x: 0, y: 0 });

    const fitScale = calculateFitZoom();
    setZoom(fitScale);
  }, [maxNumber, calculateFitZoom]);

  // Initialize or resume on mount
  useEffect(() => {
    if (config.resumeSaved) {
      const saved = soloStorage.getSavedGame();
      if (saved && saved.grid && saved.grid.length === maxNumber) {
        setGrid(saved.grid);
        setCurrentTarget(saved.currentTarget);
        setClaimedSet(new Set(saved.claimedNumbers));
        setElapsedSeconds(saved.elapsedSeconds);
        setCorrectClicks(saved.correctClicks || 0);
        setWrongClicks(saved.wrongClicks || 0);
        reactionTimesRef.current = saved.reactionTimes || [];
        lastTargetTimestampRef.current = Date.now();
        setIsStarted(true);
        setIsFinished(false);
        setCountdownRemaining(null);
        setPan({ x: 0, y: 0 });
        setZoom(calculateFitZoom());
        return;
      }
    }

    // Otherwise start fresh
    startNewSoloGame();
  }, [config.resumeSaved, maxNumber, startNewSoloGame, calculateFitZoom]);

  // Window resize auto-fit listener
  useEffect(() => {
    const handleResize = () => {
      if (!isDraggingRef.current) {
        setZoom(calculateFitZoom());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateFitZoom]);

  // Timer loop & auto-save
  useEffect(() => {
    if (!isStarted || isFinished) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => {
        const next = s + 1;
        if (gameMode === 'TIME_ATTACK' && next >= timeLimitSeconds) {
          setIsFinished(true);
          soundManager.playVictory();
          soloStorage.clearSavedGame();
          if (userId) {
            api.recordSoloMatch({
              playerId: userId,
              displayName: displayName || 'Hunter',
              score: correctClicks,
              won: correctClicks >= maxNumber,
              accuracy: Math.round((correctClicks / (correctClicks + wrongClicks || 1)) * 100) || 100,
              avgReactionTimeMs: 800,
              gameMode: 'SOLO_TIME_ATTACK',
            });
          }
          return next;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isStarted, isFinished, gameMode, timeLimitSeconds, userId, displayName, correctClicks, wrongClicks, maxNumber]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Click on a tile
  const handleTileClick = (num: number) => {
    if (hasMovedRef.current || isFinished || !isStarted || countdownRemaining !== null) return;

    if (num === currentTarget) {
      soundManager.playCorrect();
      const nextCorrect = correctClicks + 1;
      setCorrectClicks(nextCorrect);

      const reactionTime = Date.now() - lastTargetTimestampRef.current;
      reactionTimesRef.current.push(reactionTime);
      lastTargetTimestampRef.current = Date.now();

      const nextClaimed = new Set(claimedSet);
      nextClaimed.add(num);
      setClaimedSet(nextClaimed);

      if (num === maxNumber) {
        setIsFinished(true);
        soundManager.playVictory();
        soloStorage.clearSavedGame();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });

        const totalAttempts = nextCorrect + wrongClicks;
        const accuracy = Math.round((nextCorrect / totalAttempts) * 100) || 100;
        const avgReaction =
          reactionTimesRef.current.length > 0
            ? Math.round(reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length)
            : 800;

        if (userId) {
          api.recordSoloMatch({
            playerId: userId,
            displayName: displayName || 'Hunter',
            score: maxNumber,
            won: true,
            accuracy,
            avgReactionTimeMs: avgReaction,
            gameMode: 'SOLO_GRID',
          });
        }
      } else {
        const nextTarget = num + 1;
        setCurrentTarget(nextTarget);

        // Auto-save progress
        soloStorage.saveGame({
          maxNumber,
          gameMode,
          timeLimitSeconds,
          grid,
          currentTarget: nextTarget,
          claimedNumbers: Array.from(nextClaimed),
          elapsedSeconds,
          correctClicks: nextCorrect,
          wrongClicks,
          reactionTimes: reactionTimesRef.current,
          savedAt: Date.now(),
        });
      }
    } else {
      soundManager.playWrong();
      setWrongClicks((w) => w + 1);
      setWrongNumFlash(num);
      setTimeout(() => {
        setWrongNumFlash((cur) => (cur === num ? null : cur));
      }, 350);
    }
  };

  // Back handler - ensure saved state is persisted
  const handleBack = () => {
    if (!isFinished && currentTarget > 1 && currentTarget <= maxNumber) {
      soloStorage.saveGame({
        maxNumber,
        gameMode,
        timeLimitSeconds,
        grid,
        currentTarget,
        claimedNumbers: Array.from(claimedSet),
        elapsedSeconds,
        correctClicks,
        wrongClicks,
        reactionTimes: reactionTimesRef.current,
        savedAt: Date.now(),
      });
    }
    onBack();
  };

  // Pointer Drag & Pinch Zoom Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((z) => Math.min(2.5, Math.max(0.35, Math.round((z + delta) * 100) / 100)));
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
      setZoom(Math.min(2.5, Math.max(0.35, Math.round(initialZoomRef.current * ratio * 100) / 100)));
      hasMovedRef.current = true;
      return;
    }

    if (isDraggingRef.current && activePointersRef.current.size === 1) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const distance = Math.hypot(dx, dy);

      if (distance > 18) {
        hasMovedRef.current = true;
        const maxPanX = viewportRef.current ? Math.round(viewportRef.current.clientWidth * 0.45) : 350;
        const maxPanY = viewportRef.current ? Math.round(viewportRef.current.clientHeight * 0.45) : 350;
        const nextX = Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.x + dx));
        const nextY = Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.y + dy));

        setPan({
          x: nextX,
          y: nextY,
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size === 0) {
      isDraggingRef.current = false;
      initialPinchDistRef.current = null;
      hasMovedRef.current = false;
    }
  };

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const totalAttempts = correctClicks + wrongClicks;
  const accuracy = totalAttempts > 0 ? Math.round((correctClicks / totalAttempts) * 100) : 100;
  const avgReactionMs =
    reactionTimesRef.current.length > 0
      ? Math.round(reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length)
      : 0;

  const isCountingDown = countdownRemaining !== null && countdownRemaining > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#070b13] text-gray-100 select-none overflow-hidden touch-none">
      {/* 0. Center Countdown Overlay */}
      {countdownRemaining !== null && countdownRemaining >= 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070b13]/95 backdrop-blur-md animate-fade-in select-none">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold block animate-pulse">
              {countdownRemaining === 0 ? 'START HUNTING!' : 'SOLO HUNT STARTING'}
            </span>

            <div className="relative inline-flex items-center justify-center">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 border-amber-500/30 flex items-center justify-center bg-black/60 shadow-[0_0_50px_rgba(245,158,11,0.3)]">
                <span
                  key={countdownRemaining}
                  className={`font-display font-black tracking-tight animate-ping-once ${
                    countdownRemaining === 0
                      ? 'text-5xl sm:text-6xl text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.9)]'
                      : 'text-7xl sm:text-8xl text-amber-400 drop-shadow-[0_0_30px_rgba(245,158,11,0.9)]'
                  }`}
                >
                  {countdownRemaining === 0 ? 'GO!' : countdownRemaining}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-300 font-mono">
              First Target: <span className="text-amber-400 font-bold text-sm">#1</span>
            </p>
          </div>
        </div>
      )}

      {/* 1. Ultra Minimal HUD (Zero excess elements, mobile-safe) */}
      <header className="bg-[#0B0F19]/95 border-b border-gray-800/80 px-3 pt-[max(env(safe-area-inset-top),28px)] sm:pt-3 pb-2.5 flex items-center justify-between z-30 flex-shrink-0">
        {/* Left: Back */}
        <button
          onClick={handleBack}
          title="Return to Menu"
          className="p-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors tap-effect"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Center: FIND TARGET NUMBER (Clear and unmistakable) */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <span className="text-[10px] font-mono uppercase text-amber-300 font-semibold tracking-wider">
            FIND
          </span>
          <span className="font-display font-black text-2xl text-amber-400 tracking-tight">
            {isFinished ? 'DONE' : currentTarget}
          </span>
        </div>

        {/* Right: Elapsed Time, Restart, Sound */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs font-mono text-cyan-300 font-bold">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <button
            onClick={startNewSoloGame}
            title="Start New Game"
            className="p-2 rounded-xl bg-gray-800/70 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors tap-effect"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="p-2 rounded-xl bg-gray-800/70 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors tap-effect"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* 2. Centered Game Canvas with Smooth Pan & Pinch-Zoom */}
      <main
        ref={viewportRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex-1 relative w-full h-full overflow-hidden flex items-center justify-center bg-[#070b13] cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        {/* Centered Matrix Card */}
        <div
          ref={boardRef}
          className="relative will-change-transform select-none p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 shadow-2xl backdrop-blur-sm"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDraggingRef.current ? 'none' : 'transform 0.08s ease-out',
          }}
        >
          {/* Numbers Grid (NO TARGET HIGHLIGHT — Players must search! Numbers masked during countdown) */}
          <div
            className="grid gap-2 select-none"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, minmax(${tileSize - 6}px, ${tileSize}px))`,
            }}
          >
            {grid.map((num) => {
              const isClaimed = claimedSet.has(num);
              const isWrongFlash = wrongNumFlash === num;

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleTileClick(num)}
                  disabled={isClaimed || isCountingDown}
                  className={`flex items-center justify-center aspect-square rounded-xl font-display font-black text-sm sm:text-base select-none transition-all duration-75 focus:outline-none ${
                    isCountingDown
                      ? 'bg-gradient-to-b from-[#131B2A] to-[#0A0F1A] border border-cyan-500/20 text-cyan-500/30'
                      : isWrongFlash
                      ? 'bg-rose-950 border-2 border-rose-500 text-rose-300 animate-shake shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : isClaimed
                      ? 'bg-[#080E1A]/80 border border-emerald-500/30 text-emerald-500/40 line-through opacity-45 scale-[0.97]'
                      : 'bg-gradient-to-b from-[#1C263B] to-[#0E1726] hover:from-[#24314C] hover:to-[#131F33] active:scale-95 active:brightness-125 border border-slate-700/80 hover:border-cyan-400 text-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
                  }`}
                >
                  {isCountingDown ? (
                    <span className="w-2 h-2 rounded-full bg-cyan-500/20" />
                  ) : isClaimed ? (
                    <span className="flex items-center gap-0.5">
                      {num}
                      <Check className="w-2.5 h-2.5 inline text-emerald-400 ml-0.5" />
                    </span>
                  ) : (
                    num
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Minimal Progress pill */}
        <div className="absolute bottom-3 left-3 bg-[#0F172A]/85 backdrop-blur-md px-3 py-1 rounded-xl border border-gray-800 text-[11px] font-mono text-gray-400 z-20 pointer-events-none shadow-md">
          {claimedSet.size} / {maxNumber}
        </div>
      </main>

      {/* 3. Solo Game Finished Overlay */}
      {isFinished && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) onBack();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#0D1424] border border-cyan-500/40 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(0,240,255,0.2)] cursor-default"
          >
            <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-2 animate-bounce" />
            <h2 className="font-display font-black text-2xl text-white mb-1">
              Solo Match Complete!
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Found all {maxNumber} numbers in sequence
            </p>

            <div className="grid grid-cols-3 gap-2 mb-6 text-center">
              <div className="p-2.5 rounded-2xl bg-gray-900/80 border border-gray-800">
                <span className="text-[9px] text-gray-400 font-mono uppercase block">Time</span>
                <span className="font-display font-black text-sm text-cyan-400">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-gray-900/80 border border-gray-800">
                <span className="text-[9px] text-gray-400 font-mono uppercase block">Accuracy</span>
                <span className="font-display font-black text-sm text-emerald-400">
                  {accuracy}%
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-gray-900/80 border border-gray-800">
                <span className="text-[9px] text-gray-400 font-mono uppercase block">Reaction</span>
                <span className="font-display font-black text-sm text-purple-400">
                  {avgReactionMs}ms
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={startNewSoloGame}
                className="w-full py-3 rounded-2xl font-display font-black text-xs text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 shadow-lg cursor-pointer"
              >
                Play Again (1 – {maxNumber})
              </button>

              {onChangeSettings && (
                <button
                  onClick={onChangeSettings}
                  className="w-full py-2.5 rounded-2xl bg-gray-800/80 hover:bg-gray-700 text-xs font-semibold text-gray-300 border border-gray-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5 text-cyan-400" />
                  Change Range & Rules
                </button>
              )}

              <button
                onClick={onBack}
                className="w-full py-2.5 rounded-2xl text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
