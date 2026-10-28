import React, { useState, useEffect } from 'react';
import { X, LogIn, AlertCircle, Key, User, Radio, Users } from 'lucide-react';
import { api } from '../services/api.js';

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
  const [publicRooms, setPublicRooms] = useState<any[]>([]);

  useEffect(() => {
    const fetchRooms = () => {
      api.getActiveRooms().then((res) => {
        if (res && res.rooms) setPublicRooms(res.rooms);
      });
    };
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

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
        className="relative w-full max-w-md bg-[#0F172A] border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(0,240,255,0.2)] cursor-default max-h-[90vh] overflow-y-auto"
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
            <p className="text-xs text-gray-400">Enter room ID or select a live public room</p>
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

        {/* Live Public Rooms Section */}
        {publicRooms.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-display font-bold text-gray-300">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Live Public Rooms</span>
              </div>
              <span className="text-[10px] font-mono text-gray-500">
                {publicRooms.length} active
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {publicRooms.map((r) => {
                const isFull = r.isFull || (r.openSlots !== undefined && r.openSlots <= 0);
                const openSlots = r.openSlots !== undefined ? r.openSlots : Math.max(0, r.playerLimit - r.playerCount);

                return (
                  <div
                    key={r.id}
                    onClick={() => {
                      if (!isFull) {
                        setCode(r.roomCode);
                        onJoin(r.roomCode);
                      }
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isFull
                        ? 'bg-gray-900/40 border-gray-800/80 opacity-60 cursor-not-allowed'
                        : 'bg-black/40 border-gray-800 hover:border-cyan-400/50 hover:bg-cyan-950/20 cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-black text-xs text-white">
                          {r.roomCode}
                        </span>
                        <span className="text-[9px] font-mono px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                          1–{r.numberRange?.max || 50}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {r.playerCount} / {r.playerLimit} Players
                      </div>
                    </div>

                    <div>
                      {isFull ? (
                        <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                          Full
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                          {openSlots} Open
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
