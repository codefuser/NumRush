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
  UserPlus,
  Flame,
  Zap,
  Target,
  Crown,
  Smile,
} from 'lucide-react';
import type { RoomState, Player } from '../types/index.js';
import { soundManager } from '../services/audio.js';
import { LeaveGameModal } from './LeaveGameModal.js';

interface LobbyScreenProps {
  room: RoomState;
  currentPlayerId: string;
  onSetReady: (isReady: boolean) => void;
  onStartGame: () => void;
  onLeaveRoom: (permanent: boolean) => void;
  onKickPlayer?: (targetPlayerId: string) => void;
}

const LOBBY_EMOTES = [
  { emoji: '🎯', label: 'Locked In' },
  { emoji: '⚡', label: 'Speed' },
  { emoji: '🔥', label: 'Hyped' },
  { emoji: '👑', label: 'Victory' },
  { emoji: '👋', label: 'Ready' },
];

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
  const [activeEmote, setActiveEmote] = useState<{ emoji: string; label: string } | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const playersList: Player[] = Object.values(room.players);
  const currentPlayer = room.players[currentPlayerId];
  const isHost = room.hostId === currentPlayerId;

  const totalSlots = Math.max(playersList.length, room.settings.playerLimit || 4);

  // Invite URL
  const inviteUrl = `${window.location.origin}?join=${room.roomCode}`;

  const copyCode = () => {
    soundManager.playCorrect();
    navigator.clipboard.writeText(room.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    soundManager.playCorrect();
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleEmoteClick = (emote: { emoji: string; label: string }) => {
    soundManager.playCorrect();
    setActiveEmote(emote);
    setTimeout(() => setActiveEmote(null), 2200);
  };

  const handleToggleReady = () => {
    if (!currentPlayer) return;
    soundManager.playCorrect();
    onSetReady(!currentPlayer.isReady);
  };

  const handleStart = () => {
    soundManager.playCorrect();
    onStartGame();
  };

  // Readiness validation
  const connectedPlayers = playersList.filter((p) => p.isConnected);
  const unreadyPlayers = connectedPlayers.filter((p) => !p.isHost && !p.isReady);
  const canStart = isHost && connectedPlayers.length >= 1 && unreadyPlayers.length === 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-4">
      {/* 1. Room Header Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#11192d] via-[#0E1626] to-[#0A0F1D] border border-cyan-500/30 p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[10px] uppercase tracking-widest mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Lobby Waiting • No Password Required
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wider flex items-center gap-2">
              ROOM: <span className="text-cyan-400 drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]">{room.roomCode}</span>
            </h1>
          </div>

          {/* Quick Share Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={copyCode}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900/90 hover:bg-gray-800 border border-gray-700 hover:border-cyan-400 text-xs font-semibold text-gray-200 transition-all active:scale-95 cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copiedCode ? 'Copied ID' : 'Copy Code'}</span>
            </button>

            <button
              onClick={copyLink}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-xs font-semibold text-cyan-300 transition-all active:scale-95 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
            </button>
          </div>
        </div>

        {/* Room Settings Overview Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5 pt-3 border-t border-gray-800/80 text-xs">
          <div className="p-2 rounded-xl bg-black/40 border border-gray-800/80 text-center">
            <span className="text-gray-400 block text-[9px] uppercase font-mono tracking-wider">Numbers</span>
            <span className="font-display font-black text-xs text-white">
              1 – {room.settings.numberRange.max} ({room.settings.numberRange.max - room.settings.numberRange.min + 1} tiles)
            </span>
          </div>

          <div className="p-2 rounded-xl bg-black/40 border border-gray-800/80 text-center">
            <span className="text-gray-400 block text-[9px] uppercase font-mono tracking-wider">Mode</span>
            <span className="font-display font-black text-xs text-cyan-400">
              {room.settings.gameMode === 'TIME_CHALLENGE' ? 'Time Challenge' : 'Complete Grid'}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-black/40 border border-gray-800/80 text-center">
            <span className="text-gray-400 block text-[9px] uppercase font-mono tracking-wider">Limit</span>
            <span className="font-display font-black text-xs text-amber-400">
              {room.settings.gameMode === 'COMPLETE_GRID' || !room.settings.durationSeconds || room.settings.durationSeconds <= 0 || room.settings.durationSeconds >= 86400
                ? 'Unlimited'
                : `${Math.round(room.settings.durationSeconds / 60)} Mins`}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-black/40 border border-gray-800/80 text-center">
            <span className="text-gray-400 block text-[9px] uppercase font-mono tracking-wider">Penalty</span>
            <span className="font-display font-black text-xs text-rose-400">
              {room.settings.wrongClickPenalty === 'NONE' ? 'Off' : '-1 Pt'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Emote Bar */}
      <div className="p-2.5 rounded-2xl bg-[#090E1A] border border-gray-800/90 flex items-center justify-between gap-2 shadow-inner">
        <span className="text-[10px] font-mono uppercase text-gray-400 font-bold tracking-wider hidden sm:inline pl-2">
          Reactions:
        </span>
        <div className="flex items-center justify-around flex-1 gap-1.5">
          {LOBBY_EMOTES.map((em, idx) => (
            <button
              key={idx}
              onClick={() => handleEmoteClick(em)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-cyan-500/40 text-xs transition-all active:scale-95 cursor-pointer"
            >
              <span className="text-sm">{em.emoji}</span>
              <span className="text-[10px] font-mono text-gray-300 font-bold">{em.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Interactive Players Slots Arena */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h2 className="font-display font-black text-base text-white">
              Player Arena ({playersList.length}/{room.settings.playerLimit})
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-gray-400">
            {unreadyPlayers.length > 0
              ? `${unreadyPlayers.length} not ready`
              : 'All players ready!'}
          </span>
        </div>

        {/* Dynamic Slots Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {Array.from({ length: totalSlots }).map((_, slotIndex) => {
            const player = playersList[slotIndex];

            // A. Filled Slot
            if (player) {
              const isSelf = player.id === currentPlayerId;

              return (
                <div
                  key={player.id}
                  className={`relative flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${
                    isSelf
                      ? 'bg-gradient-to-r from-[#111c38] to-[#0d162a] border-cyan-500/50 shadow-[0_0_20px_rgba(0,240,255,0.15)] ring-1 ring-cyan-500/30'
                      : 'bg-[#0E1524] border-gray-800/90 hover:border-gray-700'
                  }`}
                >
                  {/* Left: Avatar with Ring & Names */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center font-display font-black text-black shadow-md text-sm ring-2"
                        style={{
                          backgroundColor: player.color,
                          borderColor: player.color,
                        }}
                      >
                        {player.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0E1524] ${
                          player.isConnected
                            ? 'bg-emerald-400'
                            : player.isReserved
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-rose-500'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-black text-sm text-white truncate max-w-[130px]">
                          {player.displayName}
                        </span>
                        {isSelf && (
                          <span className="text-[9px] font-mono font-bold bg-cyan-400 text-black px-1.5 py-0.2 rounded-full uppercase">
                            YOU
                          </span>
                        )}
                        {player.isHost && (
                          <span className="text-[9px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-600/60 flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5 text-amber-400" /> HOST
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono block">
                        {player.isConnected
                          ? 'Ready for Hunt'
                          : player.isReserved
                          ? 'Spot Held (Rejoining...)'
                          : 'Reconnecting...'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Ready Badge & Host Kick Button */}
                  <div className="flex items-center gap-1.5">
                    {player.isHost ? (
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Host
                      </span>
                    ) : player.isReady ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                        <UserCheck className="w-3.5 h-3.5" /> Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-gray-900 text-gray-400 border border-gray-800">
                        <Clock className="w-3 h-3 text-amber-400" /> Waiting
                      </span>
                    )}

                    {isHost && !isSelf && onKickPlayer && (
                      <button
                        onClick={() => onKickPlayer(player.id)}
                        title="Remove Player"
                        className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Floating Emote for self */}
                  {isSelf && activeEmote && (
                    <div className="absolute -top-3 right-4 bg-gray-900 border border-cyan-400 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-lg animate-bounce flex items-center gap-1">
                      <span>{activeEmote.emoji}</span>
                      <span className="text-[10px] text-cyan-300">{activeEmote.label}</span>
                    </div>
                  )}
                </div>
              );
            }

            // B. Empty Waiting Slot
            return (
              <div
                key={`empty_${slotIndex}`}
                onClick={copyLink}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-dashed border-gray-800/90 hover:border-cyan-500/40 bg-black/20 hover:bg-cyan-500/5 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl border border-dashed border-gray-700 flex items-center justify-center text-gray-600 group-hover:text-cyan-400 group-hover:border-cyan-500/60 transition-colors">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-gray-500 group-hover:text-cyan-300 transition-colors block">
                      Slot #{slotIndex + 1} Empty
                    </span>
                    <span className="text-[10px] text-gray-600">
                      Tap to invite friend
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-gray-900/60 border border-gray-800 text-gray-400 group-hover:text-cyan-300 group-hover:border-cyan-500/40 transition-all">
                  + Invite
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Controls Action Bar */}
      <div className="rounded-3xl bg-[#0D1424] border border-gray-800 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <button
          onClick={() => setIsLeaveModalOpen(true)}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white text-xs font-display font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          Leave Room
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          {/* Non-host Ready Toggle Button */}
          {!isHost && currentPlayer && (
            <button
              onClick={handleToggleReady}
              className={`w-full sm:w-auto px-7 py-3.5 rounded-2xl font-display font-black text-sm transition-all active:scale-95 shadow-lg cursor-pointer ${
                currentPlayer.isReady
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse'
              }`}
            >
              {currentPlayer.isReady ? '✓ I AM READY' : 'CLICK WHEN READY'}
            </button>
          )}

          {/* Host Start Match Button */}
          {isHost && (
            <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
              <button
                onClick={handleStart}
                disabled={!canStart}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-display font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                  canStart
                    ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500 text-black shadow-[0_0_25px_rgba(0,240,255,0.4)] animate-pulse'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                Start Match
              </button>
              {!canStart && (
                <span className="text-[10px] font-mono text-amber-400/90 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  {unreadyPlayers.length > 0
                    ? `Waiting for ${unreadyPlayers.map((p) => p.displayName).join(', ')} to ready up`
                    : 'Waiting for players to join...'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Leave Game Modal */}
      <LeaveGameModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirmLeave={(permanent) => {
          setIsLeaveModalOpen(false);
          onLeaveRoom(permanent);
        }}
        isMatchActive={false}
        isHost={isHost}
      />
    </div>
  );
};
