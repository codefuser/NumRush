import React, { useEffect, useState } from 'react';
import { X, Trophy, Crown, Medal, Flame } from 'lucide-react';
import { api } from '../services/api.js';
import { PersistentPlayerStats } from '../types/index.js';

interface LeaderboardModalProps {
  onClose: () => void;
  currentUserId: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose, currentUserId }) => {
  const [leaderboard, setLeaderboard] = useState<PersistentPlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeaderboard().then((data) => {
      setLeaderboard(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-surface border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-surface-light text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 flex-shrink-0">
          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-2xl text-white">Global Leaderboard</h2>
            <p className="text-xs text-gray-400">Top ranked NumRush number hunters worldwide</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400 font-mono">
              Loading rankings...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No official multiplayer matches recorded yet. Be the first to win!
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((player, index) => {
                const rank = index + 1;
                const isSelf = player.playerId === currentUserId;

                return (
                  <div
                    key={player.playerId}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isSelf
                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                        : 'bg-surface-light/40 border-gray-800'
                    }`}
                  >
                    {/* Rank & Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 flex items-center justify-center font-display font-bold text-sm">
                        {rank === 1 ? (
                          <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
                        ) : rank === 2 ? (
                          <Medal className="w-5 h-5 text-gray-300" />
                        ) : rank === 3 ? (
                          <Medal className="w-5 h-5 text-amber-600" />
                        ) : (
                          <span className="text-gray-500 text-xs">#{rank}</span>
                        )}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-white truncate max-w-[150px] sm:max-w-[200px]">
                            {player.displayName}
                          </span>
                          {isSelf && (
                            <span className="text-[9px] font-mono bg-cyan-400 text-black px-1 rounded uppercase font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {player.totalMatches} matches • {player.avgAccuracy}% avg accuracy
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="font-display font-bold text-base text-amber-300">
                          {player.wins}
                        </div>
                        <span className="text-[9px] text-gray-500 uppercase font-mono">Wins</span>
                      </div>
                      <div>
                        <div className="font-display font-bold text-base text-cyan-400">
                          {player.totalPoints}
                        </div>
                        <span className="text-[9px] text-gray-500 uppercase font-mono">Points</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
