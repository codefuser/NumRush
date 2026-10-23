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

  // Grid columns adapted for number count
  const getGridCols = () => {
    if (totalNumbers <= 50) return 10;
    if (totalNumbers <= 100) return 10;
    if (totalNumbers <= 200) return 15;
    return 20;
  };

  const gridCols = getGridCols();

  // Reset / Fit to Screen
  const handleFitScreen = useCallback(() => {
    if (!viewportRef.current || !boardRef.current) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const vp = viewportRef.current.getBoundingClientRect();
    const board = boardRef.current.getBoundingClientRect();

    const naturalWidth = board.width / zoom;
    const naturalHeight = board.height / zoom;

    const scaleX = (vp.width - 24) / naturalWidth;
    const scaleY = (vp.height - 24) / naturalHeight;
    const bestScale = Math.max(0.4, Math.min(1.2, Math.min(scaleX, scaleY)));

    setZoom(Math.round(bestScale * 100) / 100);
    setPan({ x: 0, y: 0 });
  }, [zoom]);

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
      {/* 1. Countdown Overlay */}
      {countdownRemaining !== null && countdownRemaining >= 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
          <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 block mb-2">
            Game Starting
          </span>
          <div className="font-display font-black text-8xl sm:text-9xl text-amber-400 drop-shadow-[0_0_30px_rgba(245,158,11,0.8)]">
            {countdownRemaining === 0 ? 'GO!' : countdownRemaining}
          </div>
          <p className="text-xs text-gray-300 mt-4 font-mono">
            Search for number <span className="text-amber-400 font-bold">{match.currentTarget}</span>
          </p>
        </div>
      )}

      {/* 2. Minimal Native Game Top HUD */}
      <header className="h-14 bg-[#0B0F19]/95 border-b border-gray-800/80 px-3 flex items-center justify-between z-30 flex-shrink-0">
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

      {/* 3. Infinite Pan & Zoom Canvas (Zero Margin, Native Touch Scrolling & Dragging) */}
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
        {/* Floating Pan/Zoom Matrix */}
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
            marginTop: `-${(Math.ceil(totalNumbers / gridCols) * 48) / 2}px`,
          }}
        >
          {/* Numbers Grid (All unclaimed numbers look identical so players must search!) */}
          <div
            className="grid gap-1.5 select-none"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, minmax(42px, 48px))`,
            }}
          >
            {match.shuffledGrid.map((num) => {
              const claim = match.claimedMap[num];
              return (
                <Tile
                  key={num}
                  number={num}
                  claim={claim}
                  disabled={match.status !== 'RUNNING'}
                  onClaim={handleTileClaim}
                />
              );
            })}
          </div>
        </div>

        {/* 4. Minimal Floating Controls (Bottom Corner) */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-[#111827]/85 backdrop-blur-md p-1 rounded-xl border border-gray-800 shadow-xl z-20">
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 text-gray-300 hover:text-white rounded-lg active:bg-gray-700"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleFitScreen}
            title="Fit to Screen"
            className="px-2 py-1 text-[11px] font-mono text-cyan-300 hover:text-white rounded-lg active:bg-gray-700"
          >
            Fit
          </button>

          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 text-gray-300 hover:text-white rounded-lg active:bg-gray-700"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
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
