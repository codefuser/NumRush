import React, { useState, useEffect } from 'react';
import { Sparkles, Shield, Zap } from 'lucide-react';

interface LoadingScreenProps {
  onLoaded: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Matrix Engine...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const steps = [
      { at: 20, text: 'Loading Visual & Audio Assets...' },
      { at: 50, text: 'Synchronizing Hunter Network...' },
      { at: 80, text: 'Calibrating Shuffled Grid...' },
      { at: 100, text: 'Ready to Strike!' },
    ];

    const startTime = Date.now();
    const duration = 1600; // 1.6s

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      for (let i = steps.length - 1; i >= 0; i--) {
        if (pct >= steps[i].at) {
          setStatusText(steps[i].text);
          break;
        }
      }

      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            onLoaded();
          }, 350);
        }, 200);
      }
    }, 40);

    return () => clearInterval(timer);
  }, [onLoaded]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 bg-[#080D1A] text-white select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,240,255,0.12)_0%,rgba(139,92,246,0.06)_40%,transparent_70%)] pointer-events-none" />

      {/* Top spacing */}
      <div className="pt-8 sm:pt-4 flex items-center gap-1.5 opacity-60 font-mono text-[11px] text-cyan-300 tracking-widest uppercase">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
        <span>Multiplayer Number Hunt</span>
      </div>

      {/* Center Hero Logo & Title */}
      <div className="flex flex-col items-center text-center my-auto">
        {/* Animated Glowing Hex Logo */}
        <div className="relative mb-5">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-cyan-400 via-purple-600 to-rose-500 p-[3px] shadow-[0_0_50px_rgba(0,240,255,0.4)] animate-pulse">
            <div className="w-full h-full rounded-[22px] bg-[#0A0F1E] flex items-center justify-center p-3">
              <img
                src="/logo.svg"
                alt="NumRush"
                className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]"
              />
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center text-xs font-black shadow-lg">
            1
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display font-black text-3xl sm:text-4xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 drop-shadow-[0_0_25px_rgba(0,240,255,0.3)]">
          NUMRUSH
        </h1>

        <p className="font-mono text-xs sm:text-sm text-gray-400 tracking-widest uppercase mt-1">
          Spot. <span className="text-amber-400 font-bold">Strike First.</span>
        </p>
      </div>

      {/* Bottom Loading Progress Bar */}
      <div className="w-full max-w-xs mb-8 flex flex-col items-center">
        {/* Status text */}
        <div className="flex items-center justify-between w-full text-[11px] font-mono text-gray-400 mb-2">
          <span className="text-cyan-300 truncate max-w-[200px]">{statusText}</span>
          <span className="text-amber-400 font-bold">{progress}%</span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-2 rounded-full bg-gray-900 border border-gray-800 p-0.5 overflow-hidden shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400 transition-all duration-75 shadow-[0_0_12px_rgba(0,240,255,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="text-[10px] font-mono text-gray-500 mt-3 tracking-wider">
          v1.0.0 • Production Build
        </span>
      </div>
    </div>
  );
};
