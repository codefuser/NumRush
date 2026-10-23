import React, { useState } from 'react';
import { X, LogIn, AlertCircle, Key, User } from 'lucide-react';

interface JoinGameModalProps {
  initialCode?: string;
  onClose: () => void;
  onJoin: (roomCode: string, password?: string) => void;
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
  const [password, setPassword] = useState<string>('');
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

    onJoin(cleanCode, password.trim() || undefined);
  };

  const displayError = localError || errorMessage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-[#0F172A] border border-purple-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-2xl text-white">Join Room</h2>
            <p className="text-xs text-gray-400">Enter code or paste an invite link</p>
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
              Room Code
            </label>
            <input
              type="text"
              placeholder="e.g. NR-7K2P9"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-black/50 border border-gray-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-lg font-mono tracking-widest text-white uppercase placeholder-gray-600 focus:outline-none transition-colors"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Room Password (Optional)
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Leave blank if no password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
              />
              <Key className="w-4 h-4 text-gray-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3.5 rounded-xl font-display font-extrabold text-base text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:opacity-95 shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all tap-effect"
          >
            {isLoading ? 'Verifying & Entering...' : 'Join Game Lobby'}
          </button>
        </form>
      </div>
    </div>
  );
};
