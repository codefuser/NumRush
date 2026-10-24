import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Clock,
  Trophy,
  Volume2,
  VolumeX,
  LogOut,
  X,
  Crown,
  WifiOff,
  RotateCcw,
  Sparkles,
  Users,
} from 'lucide-react';
import type { RoomState, MatchState } from '../types/index.js';
import { Tile } from './Tile.js';
import { soundManager } from '../services/audio.js';
import { socketService } from '../services/socket.js';
import { gridThemeService, GridModelId, GRID_MODELS } from '../services/gridTheme.js';
import { backgroundThemeService, BackgroundThemeId, BACKGROUND_THEMES } from '../services/backgroundTheme.js';

interface GameScreenProps {
  room: RoomState;
  match: MatchState;
  currentPlayerId: string;
  countdownRemaining: number | null;
  serverRemainingSeconds: number;
  serverElapsedSeconds?: number;
  onClaimNumber: (number: number) => void;
  onLeaveRoom?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  room,
  match,
  currentPlayerId,
  countdownRemaining,
  serverRemainingSeconds,
  serverElapsedSeconds = 0,
  onClaimNumber,
  onLeaveRoom,
}) => {
  // Grid Theme and Canvas Background Theme states
  const [gridModelId, setGridModelId] = useState<GridModelId>(() => gridThemeService.getCurrentModelId());
  const [bgThemeId, setBgThemeId] = useState<BackgroundThemeId>(() => backgroundThemeService.getCurrentThemeId());

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<GridModelId>;
      if (customEvent.detail) {
        setGridModelId(customEvent.detail);
      }
    };
    const handleBgChange = (e: Event) => {
      const customEvent = e as CustomEvent<BackgroundThemeId>;
      if (customEvent.detail) {
        setBgThemeId(customEvent.detail);
      }
    };
    window.addEventListener('numrush:gridThemeChanged', handleThemeChange);
    window.addEventListener('numrush:bgThemeChanged', handleBgChange);
    return () => {
      window.removeEventListener('numrush:gridThemeChanged', handleThemeChange);
      window.removeEventListener('numrush:bgThemeChanged', handleBgChange);
    };
  }, []);

  const gridModel = GRID_MODELS[gridModelId] || GRID_MODELS.cyber;
  const bgTheme = BACKGROUND_THEMES[bgThemeId] || BACKGROUND_THEMES.cosmic;

  // Pan and Zoom Canvas State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isScoresOpen, setIsScoresOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted());
  const [socketStatus, setSocketStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => !!document.fullscreenElement);

  // Fullscreen event listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    return socketService.onStatusChange((status) => {
      setSocketStatus(status);
    });
  }, []);

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
  const lastTapCanvasTimeRef = useRef<number>(0);

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

  const isUnlimitedMode = !match.settings.durationSeconds || match.settings.durationSeconds <= 0;
  const isLowTime = !isUnlimitedMode && serverRemainingSeconds <= 30 && match.status === 'RUNNING';
  const totalNumbers = match.maxTarget - match.settings.numberRange.min + 1;
  const claimedCount = Object.keys(match.claimedMap).length;

  // Grid columns adapted for responsive screens & number count
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

    const scaleX = (vw - 32) / boardW;
    const scaleY = (vh - 32) / boardH;
    const idealZoom = Math.min(scaleX, scaleY, 1.2);
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
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, Math.round((z + 0.2) * 100) / 100));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, Math.round((z - 0.2) * 100) / 100));

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    setZoom((z) => Math.min(2.5, Math.max(0.4, Math.round((z + delta) * 100) / 100)));
  };

  // Double-tap or double-click to toggle between Fit and 1.4x zoom
  const handleCanvasDoubleClick = () => {
    const fitZoom = calculateFitZoom();
    if (Math.abs(zoom - fitZoom) < 0.15) {
      setZoom(Math.min(2.2, fitZoom * 1.45));
    } else {
      handleFitScreen();
    }
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
      const distance = Math.hypot(dx, dy);

      // Deadzone threshold for mobile touch taps (18px)
      if (distance > 18) {
        hasMovedRef.current = true;
        // Dynamic panning bounds so players can easily reach outer edges at high zoom
        const vw = viewportRef.current?.clientWidth || 600;
        const vh = viewportRef.current?.clientHeight || 600;
        const boardW = gridCols * tileSize + (gridCols - 1) * 8 + 32;
        const boardH = Math.ceil(totalNumbers / gridCols) * tileSize + 32;

        const maxPanX = Math.max(120, Math.round((boardW * zoom - vw) / 2) + 120);
        const maxPanY = Math.max(120, Math.round((boardH * zoom - vh) / 2) + 120);

        const nextX = Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.x + dx));
        const nextY = Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.y + dy));

        setPan({
          x: nextX,
          y: nextY,
        });
      }
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size === 0) {
      isDraggingRef.current = false;
      initialPinchDistRef.current = null;
      hasMovedRef.current = false;
    }
  };

  // Claim click handler
  const handleTileClaim = useCallback((num: number) => {
    onClaimNumber(num);
  }, [onClaimNumber]);

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Ranked players for scores modal and desktop side panel
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

      {/* 2. Responsive Game HUD Header */}
      <header className="bg-[#0B0F19]/95 border-b border-gray-800/80 px-3 sm:px-5 pt-[max(env(safe-area-inset-top),20px)] sm:pt-2.5 pb-2.5 flex items-center justify-between z-30 flex-shrink-0">
        {/* Left: Leave / Room code & Time */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onLeaveRoom && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to leave the active match?')) {
                  onLeaveRoom();
                }
              }}
              title="Exit Game"
              className="p-2 rounded-xl bg-gray-800/70 hover:bg-gray-700 text-gray-400 hover:text-white transition-all tap-effect cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-cyan-400 font-bold leading-none">
                {room.roomCode}
              </span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 hidden sm:inline">
                {isUnlimitedMode ? 'Complete Grid' : 'Time Challenge'}
              </span>
            </div>

            <div
              className={`flex items-center gap-1 font-mono font-bold text-xs mt-0.5 ${
                isUnlimitedMode
                  ? 'text-cyan-300'
                  : isLowTime
                  ? 'text-rose-400 animate-pulse'
                  : 'text-gray-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isUnlimitedMode
                  ? `Elapsed: ${formatTime(serverElapsedSeconds)}`
                  : formatTime(serverRemainingSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Offline / Reconnecting Warning with manual retry */}
        {socketStatus !== 'connected' && (
          <button
            onClick={() => socketService.reconnect()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-950/90 border border-rose-500/70 text-rose-300 text-[11px] font-mono font-bold animate-pulse hover:bg-rose-900 cursor-pointer"
            title="Click to reconnect immediately"
          >
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            <span>Reconnecting (Tap to Retry)</span>
          </button>
        )}

        {/* Center: BIG PROMINENT TARGET NUMBER TO HUNT */}
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-2xl bg-amber-500/15 border-2 border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <span className="text-[10px] sm:text-xs font-mono uppercase text-amber-300 font-black tracking-wider">
            FIND
          </span>
          <span className="font-display font-black text-2xl sm:text-3xl text-amber-400 tracking-tight drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]">
            {match.currentTarget <= match.maxTarget ? match.currentTarget : 'DONE'}
          </span>
        </div>

        {/* Right Actions: Scores, Fullscreen, Sound */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Scores Modal Button */}
          <button
            onClick={() => setIsScoresOpen(true)}
            className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{myPlayer?.score ?? 0} pts</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Hide Browser URL)'}
            className="p-2 rounded-xl bg-gray-900/90 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white transition-all tap-effect cursor-pointer"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-cyan-400" /> : <Maximize className="w-4 h-4 text-gray-300" />}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-2 rounded-xl bg-gray-900/90 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white transition-all tap-effect cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* 3. Main Body: Widescreen Canvas + Desktop Sidebar */}
      <div className="flex-1 relative flex flex-row overflow-hidden w-full h-full">
        {/* Centered Canvas Container */}
        <main
          ref={viewportRef}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={handleCanvasDoubleClick}
          className={`flex-1 relative w-full h-full overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors duration-500 ${bgTheme.canvasBg}`}
          style={{ touchAction: 'none', ...bgTheme.canvasStyle }}
        >
          {/* Ambient Back Glow */}
          <div
            className="absolute w-[500px] h-[500px] rounded-full pointer-events-none blur-3xl opacity-20 -z-0"
            style={{ background: bgTheme.ambientGlowColor }}
          />

          {/* Centered Matrix Card with Theme Styling */}
          <div
            ref={boardRef}
            className={`relative z-10 will-change-transform select-none p-3 sm:p-4 rounded-3xl border transition-all duration-150 ${gridModel.boardBg} ${gridModel.boardBorder}`}
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDraggingRef.current ? 'none' : 'transform 0.08s ease-out',
            }}
          >
            {/* Numbers Grid */}
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
                    gridModelId={gridModelId}
                  />
                );
              })}
            </div>
          </div>

          {/* Bottom Left Minimal Progress indicator */}
          <div className="absolute bottom-4 left-4 bg-[#111827]/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-gray-800 text-[11px] font-mono text-gray-300 z-20 pointer-events-none shadow-xl flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Claimed: <strong className="text-cyan-400">{claimedCount}</strong> / {totalNumbers}
            </span>
          </div>

          {/* Bottom Right Floating Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-[#111827]/95 backdrop-blur-md p-1.5 rounded-2xl border border-gray-800 shadow-2xl z-30">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 active:scale-95 text-gray-300 hover:text-white transition-all tap-effect cursor-pointer"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="text-[10px] font-mono font-bold text-gray-400 px-1 select-none">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 active:scale-95 text-gray-300 hover:text-white transition-all tap-effect cursor-pointer"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleFitScreen}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 active:scale-95 text-cyan-300 hover:text-cyan-100 transition-all tap-effect flex items-center gap-1 text-[11px] font-mono font-bold cursor-pointer"
              title="Center & Fit Board"
              aria-label="Center Board"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>Center</span>
            </button>
          </div>
        </main>

        {/* 4. Desktop Widescreen Standings Sidebar (Visible on Laptop / Desktop screens lg+) */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 bg-[#0B0F19]/90 border-l border-gray-800/80 p-4 z-20 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="font-display font-black text-sm text-white">Live Leaderboard</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
              {playersList.length} Players
            </span>
          </div>

          {/* Player Standings List */}
          <div className="space-y-2 flex-1">
            {playersList.map((player, idx) => {
              const isSelf = player.id === currentPlayerId;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isSelf
                      ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-100 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                      : 'bg-gray-900/40 border-gray-800/80 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-gray-500 font-bold text-xs w-4">
                      #{idx + 1}
                    </span>
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: player.color }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs truncate max-w-[110px]">
                          {player.displayName}
                        </span>
                        {isSelf && (
                          <span className="text-[8px] bg-cyan-400 text-black px-1 rounded font-black uppercase">
                            YOU
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="font-display font-black text-base text-cyan-400">
                    {player.score} <span className="text-[10px] text-gray-400 font-mono">pts</span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Progress Card */}
          <div className="mt-4 p-3 rounded-2xl bg-black/40 border border-gray-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-gray-400 font-mono text-[10px]">
              <span>Matrix Cleared</span>
              <span className="text-cyan-300 font-bold">
                {Math.round((claimedCount / totalNumbers) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.round((claimedCount / totalNumbers) * 100)}%` }}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* 5. Mobile Scores Sheet Modal */}
      {isScoresOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsScoresOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm bg-[#111827] border border-gray-800 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="font-display font-bold text-sm text-white">Live Match Scores</h3>
              </div>
              <button
                onClick={() => setIsScoresOpen(false)}
                className="p-1.5 rounded-xl bg-gray-800 text-gray-400 hover:text-white"
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
              className="w-full mt-4 py-3 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-bold text-cyan-300 cursor-pointer"
            >
              Resume Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
