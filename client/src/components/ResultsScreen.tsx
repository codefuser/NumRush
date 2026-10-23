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
import { MatchResults, RoomState } from '../types/index.js';
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 1. Winner Celebration Banner */}
      <div className="glass-panel-glow rounded-3xl p-8 text-center relative overflow-hidden mb-8">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-amber-500/20 border-2 border-amber-400 text-amber-400 mb-4 shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-bounce">
          <Crown className="w-10 h-10 fill-amber-400" />
        </div>

        <h1 className="font-display font-black text-4xl sm:text-5xl text-white mb-2">
          {results.isTie ? (
            <span className="text-amber-300">It's a Tie!</span>
          ) : isWinner ? (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400">
              VICTORY! YOU WON!
            </span>
          ) : (
            <span>
              <span className="text-cyan-400">{results.winner?.displayName}</span> Wins!
            </span>
          )}
        </h1>

        <p className="text-sm text-gray-300 max-w-lg mx-auto">
          {results.winner
            ? `Top hunter claimed ${results.winner.score} points with ${results.winner.accuracy}% accuracy.`
            : 'Match completed with equal scores.'}
        </p>

        {/* Match Quick Specs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs font-mono text-gray-400">
          <span className="px-3 py-1 rounded-full bg-black/40 border border-gray-800">
            Duration: {results.durationSeconds}s
          </span>
          <span className="px-3 py-1 rounded-full bg-black/40 border border-gray-800">
            Claimed: {results.claimedNumbers} / {results.totalNumbers}
          </span>
          <span className="px-3 py-1 rounded-full bg-black/40 border border-gray-800">
            ID: {results.matchId.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* 2. Final Standings Table */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 overflow-x-auto">
        <h2 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Final Leaderboard & Statistics
        </h2>

        <table className="w-full text-left text-xs sm:text-sm">
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
                      : 'hover:bg-surface-light/40 text-gray-300'
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3.5 pl-2">
                    <div className="flex items-center gap-1.5 font-display font-bold text-base">
                      {player.rank === 1 ? (
                        <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ) : (
                        <span className="text-gray-500">#{player.rank}</span>
                      )}
                    </div>
                  </td>

                  {/* Player Name & Color */}
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="font-semibold text-white truncate max-w-[120px] sm:max-w-[200px]">
                        {player.displayName}
                      </span>
                      {isSelf && (
                        <span className="text-[9px] font-mono bg-cyan-400 text-black px-1 rounded uppercase font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Score */}
                  <td className="py-3.5 text-right font-display font-black text-lg text-cyan-400">
                    {player.score}
                  </td>

                  {/* Claims */}
                  <td className="py-3.5 text-right font-mono text-gray-300">
                    {player.claimsCount}
                  </td>

                  {/* Clicks */}
                  <td className="py-3.5 text-right font-mono text-gray-400">
                    <span className="text-emerald-400">{player.correctClicks}</span> /{' '}
                    <span className="text-rose-400">{player.wrongClicks}</span>
                  </td>

                  {/* Accuracy */}
                  <td className="py-3.5 text-right font-mono font-bold text-gray-200">
                    {player.accuracy}%
                  </td>

                  {/* Reaction Time */}
                  <td className="py-3.5 text-right pr-2 font-mono text-gray-400">
                    {player.avgReactionTimeMs}ms
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onReturnHome}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-light hover:bg-gray-700 text-xs font-semibold text-gray-300 hover:text-white transition-colors tap-effect"
          >
            <Home className="w-4 h-4" />
            Home
          </button>

          <button
            onClick={onReturnToLobby}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-light hover:bg-gray-700 text-xs font-semibold text-gray-300 hover:text-white transition-colors tap-effect"
          >
            <Users className="w-4 h-4" />
            Lobby
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-light hover:bg-gray-700 text-xs font-semibold text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 transition-colors tap-effect"
          >
            {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            {copiedShare ? 'Copied to Clipboard!' : 'Share Results'}
          </button>
        </div>

        {/* Host Play Again Button */}
        {isHost && (
          <button
            onClick={onPlayAgain}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-display font-extrabold text-sm sm:text-base text-black bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-400 hover:opacity-95 shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all tap-effect flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again (New Grid)
          </button>
        )}
      </div>
    </div>
  );
};
