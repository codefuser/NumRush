import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ShieldCheck, Wifi, WifiOff, Trophy, User, HelpCircle, Gamepad2 } from 'lucide-react';
import { soundManager } from '../services/audio.js';
import { socketService } from '../services/socket.js';
import { Screen } from '../types/index.js';

interface HeaderProps {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
  playerDisplayName: string;
}

export const Header: React.FC<HeaderProps> = ({ currentScreen, setScreen, playerDisplayName }) => {
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());
  const [connStatus, setConnStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  useEffect(() => {
    const unsubscribe = socketService.onStatusChange((status) => {
      setConnStatus(status);
    });
    return unsubscribe;
  }, []);

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-gray-800/80 px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => setScreen('HOME')} 
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <img 
            src="/logo.svg" 
            alt="NumRush Logo" 
            className="w-8 h-8 group-hover:scale-105 transition-transform drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" 
          />
          <div className="flex flex-col">
            <span className="font-display font-black text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500">
              NUMRUSH
            </span>
            <span className="text-[10px] text-cyan-400/80 tracking-widest uppercase font-mono hidden sm:inline -mt-1">
              Multiplayer Hunt
            </span>
          </div>
        </div>

        {/* Center Navigation Links (Hidden on small screens) */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-light/40 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setScreen('HOME')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              currentScreen === 'HOME' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-300 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            Home
          </button>
          <button
            onClick={() => setScreen('HOW_TO_PLAY')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              currentScreen === 'HOW_TO_PLAY' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-300 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            How to Play
          </button>
          <button
            onClick={() => setScreen('LEADERBOARD')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              currentScreen === 'LEADERBOARD' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-300 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Leaderboard
          </button>
          <button
            onClick={() => setScreen('PROFILE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              currentScreen === 'PROFILE' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-300 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Profile
          </button>
        </nav>

        {/* Right Action Icons: Status, Sound, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection Status Indicator */}
          <div 
            title={`Server: ${connStatus}`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-gray-900/80 border border-gray-800"
          >
            {connStatus === 'connected' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 hidden xs:inline">ONLINE</span>
              </>
            ) : connStatus === 'connecting' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-amber-400 hidden xs:inline">CONNECTING</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-400 hidden xs:inline">OFFLINE</span>
              </>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Game Sounds' : 'Mute Game Sounds'}
            className="p-2 rounded-lg bg-surface-light/60 hover:bg-surface-light text-gray-300 hover:text-cyan-400 border border-gray-800 transition-colors tap-effect"
            aria-label="Sound Toggle"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* User Button */}
          <button
            onClick={() => setScreen('PROFILE')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-900/40 to-cyan-900/40 hover:from-purple-900/60 hover:to-cyan-900/60 border border-purple-500/30 text-xs font-medium text-purple-200 transition-all tap-effect"
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span className="max-w-[90px] truncate">{playerDisplayName || 'Player'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
