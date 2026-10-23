import React from 'react';
import { Trophy, Crown, Target, Zap, WifiOff } from 'lucide-react';
import { Player, MatchState } from '../types/index.js';

interface LeaderboardSidePanelProps {
  players: Record<string, Player>;
  currentMatch: MatchState | null;
  currentPlayerId: string;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const LeaderboardSidePanel: React.FC<LeaderboardSidePanelProps> = ({
  players,
  currentMatch,
  currentPlayerId,
  isOpenMobile,
  onCloseMobile,
}) => {
  // Compute live rankings based on score, accuracy, and claims
  const rankedPlayers = Object.values(players).map((player) => {
    const stats = currentMatch?.playerStats[player.id];
    return {
      id: player.id,
      name: player.displayName,
      color: player.color,
      score: player.score,
      accuracy: stats?.accuracy ?? (player.correctClicks + player.wrongClicks > 0
        ? Math.round((player.correctClicks / (player.correctClicks + player.wrongClicks)) * 100)
        : 0),
      claimsCount: stats?.claims.length ?? 0,
      isConnected: player.isConnected,
      isYou: player.id === currentPlayerId,
      isHost: player.isHost,
    };
  });

  rankedPlayers.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.accuracy - a.accuracy;
  });

  const content = (
    <div className="flex flex-col h-full bg-surface-card border border-gray-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-display font-bold text-base text-gray-100">Live Leaderboard</h3>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800">
          {rankedPlayers.length} {rankedPlayers.length === 1 ? 'Player' : 'Players'}
        </span>
      </div>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {rankedPlayers.map((player, index) => {
          const rank = index + 1;
          const isFirst = rank === 1 && player.score > 0;

          return (
            <div
              key={player.id}
              className={`relative flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                player.isYou
                  ? 'bg-gradient-to-r from-cyan-950/40 to-surface-light/80 border-cyan-500/50 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                  : 'bg-surface-light/40 border-gray-800/80 hover:bg-surface-light/70'
              }`}
            >
              {/* Left: Rank & Color Avatar & Name */}
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Rank Badge */}
                <div className="flex items-center justify-center w-6 h-6 rounded-lg font-display font-bold text-xs">
                  {isFirst ? (
                    <Crown className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                  ) : (
                    <span className={rank <= 3 ? 'text-amber-200 font-extrabold' : 'text-gray-400'}>
                      #{rank}
                    </span>
                  )}
                </div>

                {/* Player Color Pip */}
                <div
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: player.color, boxShadow: `0 0 8px ${player.color}80` }}
                  title={`Color: ${player.color}`}
                />

                {/* Name & Indicators */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs sm:text-sm text-gray-200 truncate">
                      {player.name}
                    </span>
                    {player.isYou && (
                      <span className="text-[9px] font-mono font-bold bg-cyan-400 text-black px-1 rounded uppercase">
                        YOU
                      </span>
                    )}
                    {player.isHost && (
                      <span className="text-[9px] font-mono text-purple-300 bg-purple-900/60 px-1 rounded border border-purple-700">
                        HOST
                      </span>
                    )}
                    {!player.isConnected && (
                      <span title="Player Disconnected" className="flex items-center text-rose-400">
                        <WifiOff className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {player.accuracy}% acc • {player.claimsCount} claims
                  </span>
                </div>
              </div>

              {/* Right: Score */}
              <div className="flex flex-col items-end flex-shrink-0 pl-2">
                <span className="font-display font-black text-lg text-cyan-300">
                  {player.score}
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-mono">
                  pts
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop view (always visible side column) */}
      <div className="hidden lg:block w-72 h-full">{content}</div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-4/5 max-w-sm h-full p-4 flex flex-col bg-surface shadow-2xl">
            <button
              onClick={onCloseMobile}
              className="self-end mb-2 text-xs text-gray-400 hover:text-white px-3 py-1 bg-gray-800 rounded-lg"
            >
              Close
            </button>
            <div className="flex-1">{content}</div>
          </div>
        </div>
      )}
    </>
  );
};
