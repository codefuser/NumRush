import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Trophy,
  Clock,
  Target,
  Users,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { RoomState, MatchState } from '../types/index.js';
import { Tile } from './Tile.js';
import { LeaderboardSidePanel } from './LeaderboardSidePanel.js';
import { soundManager } from '../services/audio.js';

interface GameScreenProps {
  room: RoomState;
  match: MatchState;
  currentPlayerId: string;
  countdownRemaining: number | null;
  serverRemainingSeconds: number;
  onClaimNumber: (number: number) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  room,
  match,
  currentPlayerId,
  countdownRemaining,
  serverRemainingSeconds,
  onClaimNumber,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMobileLeaderboardOpen, setIsMobileLeaderboardOpen] = useState<boolean>(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Sound triggers on target changes
  const prevTargetRef = useRef<number>(match.currentTarget);
  useEffect(() => {
    if (match.currentTarget !== prevTargetRef.current) {
      if (prevTargetRef.current !== 0) {
        soundManager.playTargetPing();
      }
      prevTargetRef.current = match.currentTarget;
    }
  }, [match.currentTarget]);

  // Audio countdown ticks
  useEffect(() => {
    if (countdownRemaining !== null) {
      if (countdownRemaining > 0) {
        soundManager.playCountdown(false);
      } else if (countdownRemaining === 0) {
        soundManager.playCountdown(true);
      }
    }
  }, [countdownRemaining]);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.8, Math.round((z + 0.15) * 100) / 100));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.6, Math.round((z - 0.15) * 100) / 100));
  const handleResetZoom = () => setZoomLevel(1);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Timer formatting
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = serverRemainingSeconds <= 30 && match.status === 'RUNNING';

  // Progress metrics
  const totalNumbers = match.maxTarget - match.settings.numberRange.min + 1;
  const claimedCount = Object.keys(match.claimedMap).length;
  const progressPercent = Math.min(100, Math.round((claimedCount / totalNumbers) * 100));

  // Determine grid column layout based on number count
  const getGridColsClass = () => {
    if (totalNumbers <= 50) return 'grid-cols-5 sm:grid-cols-8 md:grid-cols-10';
    if (totalNumbers <= 100) return 'grid-cols-6 sm:grid-cols-10 md:grid-cols-12';
    if (totalNumbers <= 200) return 'grid-cols-8 sm:grid-cols-12 md:grid-cols-15';
    return 'grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20';
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-60px)] max-w-7xl mx-auto px-2 sm:px-4 py-2 overflow-hidden">
      {/* 1. Countdown Overlay */}
      {countdownRemaining !== null && countdownRemaining >= 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-lg">
          <div className="text-center animate-bounce">
            <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 block mb-2">
              Match Starting In
            </span>
            <div className="font-display font-black text-8xl sm:text-9xl text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 drop-shadow-[0_0_35px_rgba(245,158,11,0.8)]">
              {countdownRemaining === 0 ? 'GO!' : countdownRemaining}
            </div>
            <p className="text-sm text-gray-300 mt-4">
              Get ready! First target is <span className="text-amber-400 font-bold">{match.currentTarget}</span>
            </p>
          </div>
        </div>
      )}

      {/* 2. Top Game Status Bar */}
      <div className="glass-panel rounded-2xl px-4 py-2.5 mb-2.5 flex items-center justify-between gap-3 shadow-md flex-shrink-0">
        {/* Room Code */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs font-mono hidden sm:inline">ROOM</span>
          <span className="font-display font-bold text-sm sm:text-base text-cyan-400">
            {room.roomCode}
          </span>
        </div>

        {/* Authoritative Timer */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono font-bold text-sm sm:text-base transition-colors ${
            isLowTime
              ? 'bg-rose-950/80 text-rose-300 border border-rose-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]'
              : 'bg-black/50 text-cyan-300 border border-cyan-500/30'
          }`}
        >
          <Clock className={`w-4 h-4 ${isLowTime ? 'text-rose-400' : 'text-cyan-400'}`} />
          <span>{formatTime(serverRemainingSeconds)}</span>
        </div>

        {/* Mobile Leaderboard Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileLeaderboardOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-light text-xs font-semibold text-amber-300 border border-amber-500/30 tap-effect"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Scores</span>
          </button>
        </div>
      </div>

      {/* 3. Sticky Target Banner & Progress Indicator */}
      <div className="glass-panel-glow rounded-2xl px-4 py-3 mb-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0 shadow-lg">
        {/* Target Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-600/20 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse">
            <Target className="w-5 h-5 text-amber-400 animate-spin-slow" />
            <span className="text-xs font-mono uppercase text-amber-300 tracking-wider">FIND</span>
            <span className="font-display font-black text-2xl sm:text-3xl text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.9)]">
              {match.currentTarget <= match.maxTarget ? match.currentTarget : 'DONE'}
            </span>
          </div>

          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-gray-200">
              Sequence Target
            </span>
            <span className="text-[11px] text-gray-400 font-mono">
              Spots 1 → {match.maxTarget}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 max-w-md w-full">
          <div className="flex justify-between text-xs text-gray-400 font-mono mb-1">
            <span>Progress: {claimedCount} / {totalNumbers}</span>
            <span className="text-cyan-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-gray-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(0,240,255,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Main Gameplay Area (Grid + Side Leaderboard) */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        {/* Number Grid Viewport */}
        <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden p-2 sm:p-3 relative">
          {/* Zoom & Viewport Controls Toolbar */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800/80 text-xs">
            <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
              Grid Viewport ({Math.round(zoomLevel * 100)}%)
            </span>

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-1.5 rounded-lg bg-surface-light hover:bg-gray-700 text-gray-300 hover:text-white transition-colors tap-effect"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                onClick={handleResetZoom}
                title="Reset Zoom"
                className="px-2 py-1 rounded-lg bg-surface-light hover:bg-gray-700 text-xs font-mono text-gray-300 hover:text-white transition-colors tap-effect"
                aria-label="Reset Zoom"
              >
                100%
              </button>

              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-1.5 rounded-lg bg-surface-light hover:bg-gray-700 text-gray-300 hover:text-white transition-colors tap-effect"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                onClick={toggleFullscreen}
                title="Fullscreen Toggle"
                className="p-1.5 rounded-lg bg-surface-light hover:bg-gray-700 text-gray-300 hover:text-white transition-colors tap-effect ml-1"
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Interactive Scrollable Grid Container */}
          <div
            ref={gridContainerRef}
            className="flex-1 overflow-y-auto overflow-x-auto p-1 sm:p-2 rounded-xl bg-black/40 border border-gray-800/60"
            style={{
              scrollBehavior: 'smooth',
            }}
          >
            <div
              className={`grid ${getGridColsClass()} gap-1.5 sm:gap-2 transition-transform duration-150 origin-top-left`}
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left',
                width: zoomLevel !== 1 ? `${100 / zoomLevel}%` : '100%',
              }}
            >
              {match.shuffledGrid.map((num) => {
                const isTarget = num === match.currentTarget && match.status === 'RUNNING';
                const claim = match.claimedMap[num];

                return (
                  <Tile
                    key={num}
                    number={num}
                    isTarget={isTarget}
                    claim={claim}
                    disabled={match.status !== 'RUNNING'}
                    onClaim={onClaimNumber}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Leaderboard Side Panel (Desktop & Mobile Drawer) */}
        <LeaderboardSidePanel
          players={room.players}
          currentMatch={match}
          currentPlayerId={currentPlayerId}
          isOpenMobile={isMobileLeaderboardOpen}
          onCloseMobile={() => setIsMobileLeaderboardOpen(false)}
        />
      </div>
    </div>
  );
};
