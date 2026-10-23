import React, { useState } from 'react';
import { User, Sparkles, Dices, ArrowRight } from 'lucide-react';
import { soundManager } from '../services/audio.js';

interface WelcomeNameModalProps {
  onSaveName: (name: string) => void;
}

const HUNTER_NAMES = [
  'CyberHunter',
  'NeonStriker',
  'ShadowSeeker',
  'NovaRush',
  'GridMaster',
  'FlashEye',
  'ApexHunter',
  'PulseStrike',
  'VoltRunner',
  'EchoChaser',
];

export const WelcomeNameModal: React.FC<WelcomeNameModalProps> = ({ onSaveName }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRandomize = () => {
    soundManager.playCorrect();
    const random = HUNTER_NAMES[Math.floor(Math.random() * HUNTER_NAMES.length)];
    const suffix = Math.floor(100 + Math.random() * 900);
    setName(`${random}_${suffix}`);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a username');
      return;
    }
    if (trimmed.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    if (trimmed.length > 16) {
      setError('Username cannot exceed 16 characters');
      return;
    }

    soundManager.playCorrect();
    onSaveName(trimmed);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      const fallback = name.trim() || `Hunter_${Math.floor(1000 + Math.random() * 9000)}`;
      onSaveName(fallback);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-sm bg-[#0D1424] border border-cyan-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col text-center cursor-default"
      >
        {/* Glow ambient */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-purple-600 mx-auto mb-4 flex items-center justify-center font-display font-black text-2xl text-black shadow-[0_0_25px_rgba(0,240,255,0.4)]">
          {name ? name.slice(0, 2).toUpperCase() : <User className="w-8 h-8 stroke-[2.5]" />}
        </div>

        <h2 className="font-display font-black text-2xl text-white tracking-wide">
          Welcome, Hunter!
        </h2>
        <p className="text-xs text-gray-400 mt-1 mb-5">
          Enter your callsign to enter the NumRush matrix and track your rank
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={name}
              maxLength={16}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter your hunter name..."
              className="w-full h-12 text-center font-display font-black text-base text-white bg-gray-900/90 border border-cyan-500/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner px-10"
              autoFocus
            />

            <button
              type="button"
              onClick={handleRandomize}
              title="Generate random name"
              className="absolute right-2.5 top-2.5 p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-cyan-400 transition-colors"
            >
              <Dices className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <p className="text-xs font-mono text-rose-400 font-bold -mt-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl font-display font-black text-sm text-black bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-400 hover:brightness-110 shadow-[0_0_25px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 tap-effect cursor-pointer"
          >
            <span>ENTER THE MATRIX</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </form>
      </div>
    </div>
  );
};
