import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Clock,
  Trophy,
  Volume2,
  VolumeX,
  LogOut,
  X,
  Crown,
} from 'lucide-react';
import type { RoomState, MatchState } from '../types/index.js';
import { Tile } from './Tile.js';
import { soundManager } from '../services/audio.js';

interface GameScreenProps {
  room: RoomState;
  match: MatchState;
  currentPlayerId: string;
  countdownRemaining: number | null;
  serverRemainingSeconds: number;
  onClaimNumber: (number: number) => void;
  onLeaveRoom?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  room,
  match,
  currentPlayerId,
  countdownRemaining,
  serverRemainingSeconds,
  onClaimNumber,
  onLeaveRoom,
}) => {
  // Pan and Zoom Canvas State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isScoresOpen, setIsScoresOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted());

  const viewportRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Drag / Pan Tracking
  const isDraggingRef = useRef<boolean>(false);
  const hasMovedRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);

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

  // Audio cue when target changes
  const prevTargetRef = useRef<number>(match.currentTarget);
  useEffect(() => {
    if (match.currentTarget !== prevTargetRef.current) {
      if (prevTargetRef.current !== 0) {
        soundManager.playTargetPing();
      }
      prevTargetRef.current = match.currentTarget;
    }
  }, [match.currentTarget]);

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = serverRemainingSeconds <= 30 && match.status === 'RUNNING';
  const totalNumbers = match.maxTarget - match.settings.numberRange.min + 1;
  const claimedCount = Object.keys(match.claimedMap).length;

  // Grid columns adapted for mobile screens & number count
  const getGridCols = () => {
    if (totalNumbers <= 30) return 5;
    if (totalNumbers <= 50) return 5;
    if (totalNumbers <= 75) return 6;
    if (totalNumbers <= 100) return 8;
    if (totalNumbers <= 200) return 10;
    return 12;
  };

  const gridCols = getGridCols();
  const tileSize = totalNumbers <= 50 ? 54 : totalNumbers <= 100 ? 44 : 38;

  // Auto-fit calculations
  const calculateFitZoom = useCallback(() => {
    if (!viewportRef.current) return 1;
    const vw = viewportRef.current.clientWidth;
    const vh = viewportRef.current.clientHeight;

    const gap = 8;
    const totalCols = gridCols;
    const totalRows = Math.ceil(totalNumbers / totalCols);

    const boardW = totalCols * tileSize + (totalCols - 1) * gap + 32;
    const boardH = totalRows * tileSize + (totalRows - 1) * gap + 32;

    const scaleX = (vw - 24) / boardW;
    const scaleY = (vh - 24) / boardH;
    const idealZoom = Math.min(scaleX, scaleY, 1.15);
    return Math.max(0.35, Math.round(idealZoom * 100) / 100);
  }, [totalNumbers, gridCols, tileSize]);

  // Initial fit on match start
  useEffect(() => {
    const fitZoom = calculateFitZoom();
    setZoom(fitZoom);
    setPan({ x: 0, y: 0 });
  }, [calculateFitZoom]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (!isDraggingRef.current) {
        setZoom(calculateFitZoom());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateFitZoom]);

  // Reset / Fit to Screen
  const handleFitScreen = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(calculateFitZoom());
  }, [calculateFitZoom]);

  // Zoom Helpers
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, Math.round((z + 0.15) * 100) / 100));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, Math.round((z - 0.15) * 100) / 100));

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((z) => Math.min(2.5, Math.max(0.4, Math.round((z + delta) * 100) / 100)));
  };

  // Pointer Down (Mouse or Touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 1) {
      isDraggingRef.current = true;
      hasMovedRef.current = false;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { ...pan };
    } else if (activePointersRef.current.size === 2) {
      // Start Pinch-to-zoom
      const points = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      initialPinchDistRef.current = dist;
      initialZoomRef.current = zoom;
    }
  };

  // Pointer Move (Panning or Pinching)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2 && initialPinchDistRef.current) {
      // 2 fingers: Pinch to Zoom
      const points = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const ratio = dist / initialPinchDistRef.current;
      const nextZoom = Math.min(2.5, Math.max(0.4, Math.round(initialZoomRef.current * ratio * 100) / 100));
      setZoom(nextZoom);
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

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size === 0) {
      isDraggingRef.current = false;
      initialPinchDistRef.current = null;
    }
  };

  // Claim click handler: only trigger if user wasn't dragging/panning
  const handleTileClaim = (num: number) => {
    if (hasMovedRef.current) return;
    onClaimNumber(num);
  };

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Ranked players for scores modal
  const playersList = Object.values(room.players).sort((a, b) => b.score - a.score);
  const myPlayer = room.players[currentPlayerId];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#070b13] text-gray-100 select-none overflow-hidden touch-none">
      {/* 1. Center Countdown Overlay */}
      {countdownRemaining !== null && countdownRemaining >= 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070b13]/95 backdrop-blur-md animate-fade-in select-none">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold block animate-pulse">
              {countdownRemaining === 0 ? 'MATRIX UNLOCKED!' : 'PREPARING MATRIX HUNT'}
            </span>

            <div className="relative inline-flex items-center justify-center">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 border-cyan-500/30 flex items-center justify-center bg-black/60 shadow-[0_0_50px_rgba(0,240,255,0.3)]">
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
              First Target: <span className="text-amber-400 font-bold text-sm">#{match.currentTarget}</span>
            </p>
          </div>
        </div>
      )}

      {/* 2. Minimal Native Game Top HUD */}
      <header className="bg-[#0B0F19]/95 border-b border-gray-800/80 px-3 pt-[max(env(safe-area-inset-top),28px)] sm:pt-3 pb-2.5 flex items-center justify-between z-30 flex-shrink-0">
        {/* Left: Leave / Room code & Time */}
        <div className="flex items-center gap-2">
          {onLeaveRoom && (
            <button
              onClick={onLeaveRoom}
              title="Exit Game"
              className="p-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-cyan-400/90 leading-none">
              {room.roomCode}
            </span>
            <div className={`flex items-center gap-1 font-mono font-bold text-xs ${isLowTime ? 'text-rose-400 animate-pulse' : 'text-gray-300'}`}>
              <Clock className="w-3 h-3" />
              <span>{formatTime(serverRemainingSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Center: TARGET NUMBER TO HUNT (Clear, prominent, non-distracting) */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <span className="text-[10px] font-mono uppercase text-amber-300 font-semibold tracking-wider">
            FIND
          </span>
          <span className="font-display font-black text-2xl text-amber-400 tracking-tight">
            {match.currentTarget <= match.maxTarget ? match.currentTarget : 'DONE'}
          </span>
        </div>

        {/* Right: Scores Toggle & Sound */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsScoresOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{myPlayer?.score ?? 0} pts</span>
          </button>

          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* 3. Centered Pan & Zoom Canvas */}
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
          {/* Numbers Grid (All unclaimed numbers look identical so players must search!) */}
          <div
            className="grid gap-2 select-none"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, minmax(${tileSize - 6}px, ${tileSize}px))`,
            }}
          >
            {match.shuffledGrid.map((num) => {
              const claim = match.claimedMap[num];
              const isCountingDown = countdownRemaining !== null && countdownRemaining > 0;
              return (
                <Tile
                  key={num}
                  number={num}
                  claim={claim}
                  disabled={match.status !== 'RUNNING' || isCountingDown}
                  onClaim={handleTileClaim}
                  isMasked={isCountingDown}
                />
              );
            })}
          </div>
        </div>


        {/* Bottom Left Minimal Progress indicator */}
        <div className="absolute bottom-4 left-4 bg-[#111827]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-800 text-[11px] font-mono text-gray-400 z-20 pointer-events-none">
          Claimed: <span className="text-cyan-400 font-bold">{claimedCount}</span> / {totalNumbers}
        </div>
      </main>

      {/* 5. Minimal Scores Sheet Modal */}
      {isScoresOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="font-display font-bold text-sm text-white">Live Match Scores</h3>
              </div>
              <button
                onClick={() => setIsScoresOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {playersList.map((player, idx) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                    player.id === currentPlayerId
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                      : 'bg-gray-900/40 border-gray-800 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-gray-500 font-bold w-4">#{idx + 1}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="font-semibold truncate max-w-[120px]">
                      {player.displayName}
                    </span>
                    {player.id === currentPlayerId && (
                      <span className="text-[8px] bg-cyan-400 text-black px-1 rounded font-bold uppercase">
                        YOU
                      </span>
                    )}
                  </div>

                  <span className="font-display font-black text-sm text-cyan-400">
                    {player.score} pts
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsScoresOpen(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-white"
            >
              Back to Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
