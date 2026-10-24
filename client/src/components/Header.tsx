import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { soundManager } from '../services/audio.js';
import type { Screen } from '../types/index.js';

interface HeaderProps {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
  playerDisplayName: string;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ setScreen, playerDisplayName, onOpenProfile }) => {
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => !!document.fullscreenElement);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } catch {}
  };

  return (
    <header className="w-full bg-[#0B0F19] border-b border-gray-800/80 px-4 pt-[max(env(safe-area-inset-top),28px)] sm:pt-3.5 pb-3 flex items-center justify-between select-none">
      {/* Brand Logo */}
      <div 
        onClick={() => setScreen('HOME')} 
        className="flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform"
      >
        <img 
          src="/logo.svg" 
          alt="NumRush" 
          className="w-7 h-7 drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]" 
        />
        <span className="font-display font-black text-lg tracking-wider text-cyan-400">
          NUMRUSH
        </span>
      </div>

      {/* Right Actions: Fullscreen, Sound & Profile Avatar */}
      <div className="flex items-center gap-2">
        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Hide Browser URL Bar)'}
          className="p-2 rounded-xl bg-gray-900/90 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
          aria-label="Fullscreen Toggle"
        >
          {isFullscreen ? <Minimize className="w-4 h-4 text-cyan-400" /> : <Maximize className="w-4 h-4 text-gray-300" />}
        </button>

        {/* Sound Toggle Button */}
        <button
          onClick={toggleSound}
          title={isMuted ? 'Unmute' : 'Mute'}
          className="p-2 rounded-xl bg-gray-900/90 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-cyan-400 transition-all active:scale-95 cursor-pointer"
          aria-label="Sound Toggle"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Professional Profile Avatar Badge */}
        <button
          onClick={onOpenProfile}
          title="Hunter Profile & Settings"
          className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-gradient-to-r from-gray-900 to-[#11192d] border border-cyan-500/30 hover:border-cyan-400 text-xs text-gray-200 transition-all active:scale-95 shadow-sm group cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-purple-600 flex items-center justify-center font-display font-black text-[10px] text-black shadow-inner ring-1 ring-cyan-400/50">
            {(playerDisplayName || 'P').slice(0, 2).toUpperCase()}
          </div>
          <span className="max-w-[80px] truncate font-display font-bold text-[11px] group-hover:text-cyan-300 transition-colors">
            {playerDisplayName || 'Hunter'}
          </span>
        </button>
      </div>
    </header>
  );
};
