import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Trophy, User } from 'lucide-react';
import { soundManager } from '../services/audio.js';
import { socketService } from '../services/socket.js';
import type { Screen } from '../types/index.js';

interface HeaderProps {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
  playerDisplayName: string;
}

export const Header: React.FC<HeaderProps> = ({ setScreen, playerDisplayName }) => {
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
    <header className="w-full bg-[#0B0F19] border-b border-gray-800/80 px-4 py-3 flex items-center justify-between">
      {/* Brand Logo */}
      <div 
        onClick={() => setScreen('HOME')} 
        className="flex items-center gap-2 cursor-pointer select-none"
      >
        <img 
          src="/logo.svg" 
          alt="NumRush" 
          className="w-7 h-7" 
        />
        <span className="font-display font-black text-lg tracking-wider text-cyan-400">
          NUMRUSH
        </span>
      </div>

      {/* Right Actions: Sound, Profile, Status */}
      <div className="flex items-center gap-2">
        {/* Connection Status Indicator */}
        <div 
          title={`Status: ${connStatus}`}
          className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono bg-gray-900 border border-gray-800"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${
            connStatus === 'connected' ? 'bg-emerald-400' : connStatus === 'connecting' ? 'bg-amber-400 animate-ping' : 'bg-rose-500'
          }`} />
          <span className="text-gray-400 hidden sm:inline">{connStatus.toUpperCase()}</span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          title={isMuted ? 'Unmute' : 'Mute'}
          className="p-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-gray-300 hover:text-cyan-400 transition-colors"
          aria-label="Sound Toggle"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Profile */}
        <button
          onClick={() => setScreen('PROFILE')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-xs text-gray-300 transition-colors"
        >
          <User className="w-3.5 h-3.5 text-cyan-400" />
          <span className="max-w-[80px] truncate">{playerDisplayName || 'Player'}</span>
        </button>
      </div>
    </header>
  );
};
