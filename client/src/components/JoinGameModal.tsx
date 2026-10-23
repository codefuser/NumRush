import React, { useState } from 'react';
import { X, LogIn, AlertCircle, Key, User } from 'lucide-react';

interface JoinGameModalProps {
  initialCode?: string;
  onClose: () => void;
  onJoin: (roomCode: string) => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const JoinGameModal: React.FC<JoinGameModalProps> = ({
  initialCode = '',
  onClose,
  onJoin,
  isLoading,
  errorMessage,
}) => {
  const [code, setCode] = useState<string>(initialCode);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    let cleanCode = code.trim().toUpperCase();
    // If user pasted a URL, extract code
    if (cleanCode.includes('/join/')) {
      const parts = cleanCode.split('/join/');
      cleanCode = parts[parts.length - 1];
    } else if (cleanCode.includes('room=')) {
      const match = cleanCode.match(/room=([A-Z0-9-]+)/i);
      if (match) cleanCode = match[1];
    }

    // Auto prepend NR- if omitted
    if (!cleanCode.startsWith('NR-') && cleanCode.length === 5) {
      cleanCode = `NR-${cleanCode}`;
    }

    if (cleanCode.length < 5) {
      setLocalError('Please enter a valid room code (e.g. NR-7K2P9)');
      return;
    }

    onJoin(cleanCode);
  };

  const displayError = localError || errorMessage;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-sm bg-[#0F172A] border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(0,240,255,0.2)] cursor-default"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white">Join Room</h2>
            <p className="text-xs text-gray-400">Enter room ID or paste invite code</p>
          </div>
        </div>

        {displayError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Room ID / Code
            </label>
            <input
              type="text"
              placeholder="e.g. NR-7K2P9"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-black/60 border border-gray-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-lg font-mono tracking-widest text-white uppercase placeholder-gray-600 focus:outline-none transition-colors text-center"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 rounded-xl font-display font-black text-sm sm:text-base text-black bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:brightness-110 shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all tap-effect cursor-pointer"
          >
            {isLoading ? 'Entering Room...' : 'Enter Match Lobby'}
          </button>
        </form>
      </div>
    </div>
  );
};
