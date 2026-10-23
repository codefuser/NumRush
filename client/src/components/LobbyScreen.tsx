import React, { useState } from 'react';
import {
  Copy,
  Check,
  Share2,
  Users,
  Shield,
  Play,
  LogOut,
  Clock,
  Sparkles,
  UserCheck,
  UserX,
  AlertTriangle,
} from 'lucide-react';
import { RoomState, Player } from '../types/index.js';

interface LobbyScreenProps {
  room: RoomState;
  currentPlayerId: string;
  onSetReady: (isReady: boolean) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onKickPlayer?: (targetPlayerId: string) => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  room,
  currentPlayerId,
  onSetReady,
  onStartGame,
  onLeaveRoom,
  onKickPlayer,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const playersList: Player[] = Object.values(room.players);
  const currentPlayer = room.players[currentPlayerId];
  const isHost = room.hostId === currentPlayerId;

  // Real configured invite URL
  const inviteUrl = `${window.location.origin}?join=${room.roomCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Readiness validation
  const connectedPlayers = playersList.filter((p) => p.isConnected);
  const unreadyPlayers = connectedPlayers.filter((p) => !p.isHost && !p.isReady);
  const canStart = isHost && connectedPlayers.length >= 1 && unreadyPlayers.length === 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Room Header Card */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Multiplayer Lobby
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-wider">
              ROOM: <span className="text-cyan-400">{room.roomCode}</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Share the code or link with friends to join the match.
            </p>
          </div>

          {/* Action buttons: Copy Code & Link */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-light border border-gray-700 hover:border-cyan-400 text-xs font-semibold text-gray-200 hover:text-white transition-all tap-effect"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              {copiedCode ? 'Copied Code!' : 'Copy Code'}
            </button>

            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 text-xs font-semibold text-cyan-300 transition-all tap-effect"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              {copiedLink ? 'Link Copied!' : 'Share Invite Link'}
            </button>
          </div>
        </div>

        {/* Room Settings Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-800/80 text-xs">
          <div className="p-2.5 rounded-xl bg-black/40 border border-gray-800">
            <span className="text-gray-400 block text-[10px] uppercase font-mono">Numbers</span>
            <span className="font-display font-bold text-gray-100">
              {room.settings.numberRange.min} – {room.settings.numberRange.max} ({room.settings.numberRange.max - room.settings.numberRange.min + 1} tiles)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-gray-800">
            <span className="text-gray-400 block text-[10px] uppercase font-mono">Mode</span>
            <span className="font-display font-bold text-gray-100">
              {room.settings.gameMode === 'TIME_CHALLENGE' ? 'Time Challenge' : 'Complete Grid'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-gray-800">
            <span className="text-gray-400 block text-[10px] uppercase font-mono">Time Limit</span>
            <span className="font-display font-bold text-gray-100">
              {Math.round(room.settings.durationSeconds / 60)} Minutes
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-gray-800">
            <span className="text-gray-400 block text-[10px] uppercase font-mono">Penalty</span>
            <span className="font-display font-bold text-gray-100">
              {room.settings.wrongClickPenalty === 'NONE'
                ? 'None'
                : room.settings.wrongClickPenalty === 'SCORE'
                ? '-1 Score'
                : 'Lockout'}
            </span>
          </div>
        </div>
      </div>

      {/* Players List Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display font-bold text-xl text-white">
              Players ({playersList.length}/{room.settings.playerLimit})
            </h2>
          </div>
          <span className="text-xs text-gray-400">
            {unreadyPlayers.length > 0
              ? `${unreadyPlayers.length} not ready`
              : 'All players ready!'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {playersList.map((player) => {
            const isSelf = player.id === currentPlayerId;

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isSelf
                    ? 'bg-surface-light/80 border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                    : 'bg-surface-light/40 border-gray-800'
                }`}
              >
                {/* Left: Avatar & Name */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-extrabold text-black shadow-md text-sm"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.displayName.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-gray-100 truncate max-w-[140px]">
                        {player.displayName}
                      </span>
                      {isSelf && (
                        <span className="text-[9px] font-mono font-bold bg-cyan-400 text-black px-1 rounded uppercase">
                          YOU
                        </span>
                      )}
                      {player.isHost && (
                        <span className="text-[9px] font-mono text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800 flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" /> HOST
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {player.isConnected ? 'Connected' : 'Disconnected (reconnecting...)'}
                    </span>
                  </div>
                </div>

                {/* Right: Ready state indicator & Kick option */}
                <div className="flex items-center gap-2">
                  {player.isHost ? (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Host
                    </span>
                  ) : player.isReady ? (
                    <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <UserCheck className="w-3.5 h-3.5" /> Ready
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                      <Clock className="w-3.5 h-3.5" /> Not Ready
                    </span>
                  )}

                  {isHost && !isSelf && onKickPlayer && (
                    <button
                      onClick={() => onKickPlayer(player.id)}
                      title="Kick Player"
                      className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Actions Bottom Bar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onLeaveRoom}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors tap-effect"
        >
          <LogOut className="w-4 h-4" />
          Leave Room
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Non-host Ready Toggle */}
          {!isHost && currentPlayer && (
            <button
              onClick={() => onSetReady(!currentPlayer.isReady)}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-display font-bold text-sm transition-all tap-effect ${
                currentPlayer.isReady
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-surface-light border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20'
              }`}
            >
              {currentPlayer.isReady ? '✓ I am Ready' : 'Click when Ready'}
            </button>
          )}

          {/* Host Start Match Button */}
          {isHost && (
            <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
              <button
                onClick={onStartGame}
                disabled={!canStart}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-display font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all tap-effect ${
                  canStart
                    ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500 text-black shadow-[0_0_25px_rgba(0,240,255,0.5)] cursor-pointer'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                Start Match
              </button>
              {!canStart && (
                <span className="text-[11px] text-amber-400/90 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {unreadyPlayers.length > 0
                    ? `Waiting for ${unreadyPlayers.map((p) => p.displayName).join(', ')} to be ready`
                    : 'Need at least 1 player to start'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
