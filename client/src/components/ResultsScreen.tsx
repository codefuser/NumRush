import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Crown,
  RotateCcw,
  Home,
  Users,
  Share2,
  Check,
  Target,
  Zap,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { MatchResults, RoomState } from '../types/index.js';
import { soundManager } from '../services/audio.js';

interface ResultsScreenProps {
  results: MatchResults;
  room: RoomState;
  currentPlayerId: string;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
  onReturnHome: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  results,
  room,
  currentPlayerId,
  onPlayAgain,
  onReturnToLobby,
  onReturnHome,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);
  const isHost = room.hostId === currentPlayerId;
  const isWinner = results.winner?.playerId === currentPlayerId && !results.isTie;

  useEffect(() => {
    // Play victory sound fanfare
    soundManager.playVictory();

    // Launch celebratory confetti
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00F0FF', '#8B5CF6', '#F59E0B', '#10B981'],
    });

    const interval = setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 400);

    return () => clearTimeout(interval);
  }, []);

  const handleShare = () => {
    const summary = `🏆 NumRush Match Results!
Room: ${room.roomCode}
Winner: ${results.winner?.displayName || 'Tie'} (${results.winner?.score || 0} pts)
Mode: ${results.gameMode}
Play at: ${window.location.origin}`;

    navigator.clipboard.writeText(summary);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-5 pb-24 space-y-4 overflow-x-hidden">
      {/* 1. Winner Celebration Banner */}
      <div className="bg-[#0F172A] border border-cyan-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center relative overflow-hidden shadow-xl">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-400 mb-3 shadow-lg">
          <Crown className="w-8 h-8 fill-amber-400" />
        </div>

        <h1 className="font-display font-black text-2xl sm:text-4xl text-white mb-1.5">
          {results.isTie ? (
            <span className="text-amber-300">It's a Tie!</span>
          ) : isWinner ? (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
              VICTORY! YOU WON!
            </span>
          ) : (
            <span>
              <span className="text-cyan-400">{results.winner?.displayName}</span> Wins!
            </span>
          )}
        </h1>

        <p className="text-xs text-gray-300 max-w-sm mx-auto">
          {results.winner
            ? `Winner scored ${results.winner.score} pts with ${results.winner.accuracy}% accuracy.`
            : 'Match completed with equal scores.'}
        </p>

        {/* Match Quick Specs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[10px] font-mono text-gray-400">
          <span className="px-2.5 py-0.5 rounded-full bg-black/50 border border-gray-800">
            Duration: {results.durationSeconds}s
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-black/50 border border-gray-800">
            Claimed: {results.claimedNumbers} / {results.totalNumbers}
          </span>
        </div>
      </div>

      {/* 2. Final Standings: Responsive Card Layout for Mobile (<sm) */}
      <div className="block sm:hidden space-y-2">
        <div className="flex items-center gap-2 px-1 text-sm font-display font-bold text-white">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Final Standings</span>
        </div>

        {results.rankings.map((player) => {
          const isSelf = player.playerId === currentPlayerId;

          return (
            <div
              key={player.playerId}
              className={`p-3 rounded-2xl border transition-all ${
                isSelf
                  ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                  : 'bg-[#0F172A] border-gray-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-black/40 font-display font-black text-xs text-gray-300">
                    {player.rank === 1 ? (
                      <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ) : (
                      `#${player.rank}`
                    )}
                  </div>
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="font-semibold text-white text-xs truncate max-w-[140px]">
                    {player.displayName}
                  </span>
                  {isSelf && (
                    <span className="text-[8px] font-mono bg-cyan-400 text-black px-1 rounded uppercase font-bold">
                      YOU
                    </span>
                  )}
                </div>

                <div className="font-display font-black text-base text-cyan-400">
                  {player.score} <span className="text-[10px] font-mono font-normal text-gray-400">pts</span>
                </div>
              </div>

              {/* Stat Chips */}
              <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-gray-800/80 text-[10px] font-mono text-center">
                <div className="bg-black/30 rounded-lg py-1 px-1">
                  <span className="text-gray-500 block text-[8px]">CLAIMS</span>
                  <span className="text-gray-200 font-bold">{player.claimsCount}</span>
                </div>
                <div className="bg-black/30 rounded-lg py-1 px-1">
                  <span className="text-gray-500 block text-[8px]">CLICKS</span>
                  <span className="text-emerald-400 font-bold">{player.correctClicks}</span>/
                  <span className="text-rose-400 font-bold">{player.wrongClicks}</span>
                </div>
                <div className="bg-black/30 rounded-lg py-1 px-1">
                  <span className="text-gray-500 block text-[8px]">ACCURACY</span>
                  <span className="text-cyan-300 font-bold">{player.accuracy}%</span>
                </div>
                <div className="bg-black/30 rounded-lg py-1 px-1">
                  <span className="text-gray-500 block text-[8px]">REACTION</span>
                  <span className="text-amber-300 font-bold">{player.avgReactionTimeMs}ms</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2b. Final Standings: Full Table for Tablets & Desktop (sm and up) */}
      <div className="hidden sm:block bg-[#0F172A] border border-gray-800 rounded-2xl p-4 sm:p-6 overflow-x-auto">
        <h2 className="font-display font-bold text-base text-white mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Final Leaderboard
        </h2>

        <table className="w-full min-w-[550px] text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 uppercase text-[10px] font-mono tracking-wider">
              <th className="pb-3 pl-2">Rank</th>
              <th className="pb-3">Player</th>
              <th className="pb-3 text-right">Score</th>
              <th className="pb-3 text-right">Claims</th>
              <th className="pb-3 text-right">Clicks (C / W)</th>
              <th className="pb-3 text-right">Accuracy</th>
              <th className="pb-3 text-right pr-2">Reaction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-medium">
            {results.rankings.map((player) => {
              const isSelf = player.playerId === currentPlayerId;

              return (
                <tr
                  key={player.playerId}
                  className={`transition-colors ${
                    isSelf
                      ? 'bg-cyan-500/10 text-cyan-200'
                      : 'hover:bg-slate-800/40 text-gray-300'
                  }`}
                >
                  <td className="py-3.5 pl-2">
                    <div className="flex items-center gap-1.5 font-display font-bold text-base">
                      {player.rank === 1 ? (
                        <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ) : (
                        <span className="text-gray-500">#{player.rank}</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="font-semibold text-white truncate max-w-[160px]">
                        {player.displayName}
                      </span>
                      {isSelf && (
                        <span className="text-[9px] font-mono bg-cyan-400 text-black px-1 rounded uppercase font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 text-right font-display font-black text-lg text-cyan-400">
                    {player.score}
                  </td>

                  <td className="py-3.5 text-right font-mono text-gray-300">
                    {player.claimsCount}
                  </td>

                  <td className="py-3.5 text-right font-mono text-gray-400">
                    <span className="text-emerald-400">{player.correctClicks}</span> /{' '}
                    <span className="text-rose-400">{player.wrongClicks}</span>
                  </td>

                  <td className="py-3.5 text-right font-mono font-bold text-gray-200">
                    {player.accuracy}%
                  </td>

                  <td className="py-3.5 text-right pr-2 font-mono text-gray-400">
                    {player.avgReactionTimeMs}ms
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Action Buttons - Stacked on Mobile, Flex on Desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        {/* Host Play Again Button (Top on mobile for quick rematch!) */}
        {isHost && (
          <button
            onClick={onPlayAgain}
            className="w-full sm:w-auto order-1 sm:order-2 px-8 py-3.5 rounded-xl font-display font-extrabold text-sm sm:text-base text-black bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-400 hover:opacity-95 shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all tap-effect flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again (New Grid)
          </button>
        )}

        <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 order-2 sm:order-1">
          <button
            onClick={onReturnHome}
            className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-xs font-semibold text-gray-300 hover:text-white transition-colors tap-effect"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <button
            onClick={onReturnToLobby}
            className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-xs font-semibold text-gray-300 hover:text-white transition-colors tap-effect"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Lobby</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 text-xs font-semibold text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 transition-colors tap-effect"
          >
            {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedShare ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
