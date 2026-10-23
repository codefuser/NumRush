import React, { useState, useEffect } from 'react';
import { X, User, Trophy, Zap, Target, History, Edit2, Check, Award } from 'lucide-react';
import { api } from '../services/api.js';
import { PersistentPlayerStats } from '../types/index.js';

interface ProfileModalProps {
  userId: string;
  currentName: string;
  onUpdateName: (name: string) => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  userId,
  currentName,
  onUpdateName,
  onClose,
}) => {
  const [stats, setStats] = useState<PersistentPlayerStats | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(currentName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getProfile(userId).then((res) => {
      if (res) setStats(res);
    });
    api.getHistory(userId).then((res) => {
      setHistory(res);
    });
  }, [userId]);

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setSaving(true);
    await api.updateProfile(userId, trimmed);
    onUpdateName(trimmed);
    setIsEditing(false);
    setSaving(false);
  };

  const winRate =
    stats && stats.totalMatches > 0
      ? Math.round((stats.wins / stats.totalMatches) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-surface border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(139,92,246,0.15)] max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-surface-light text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-800 flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center font-display font-black text-2xl text-black shadow-lg">
            {currentName.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  maxLength={20}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-black/50 border border-cyan-400 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="p-2 rounded-lg bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-2xl text-white truncate">
                  {currentName}
                </h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-400 hover:text-cyan-400 transition-colors"
                  title="Edit Display Name"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Player ID: {userId.slice(0, 8)}...
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 flex-shrink-0">
          <div className="p-3 rounded-2xl bg-surface-light/40 border border-gray-800 text-center">
            <span className="text-[10px] uppercase font-mono text-gray-400 block mb-1">
              Total Matches
            </span>
            <span className="font-display font-black text-xl text-white">
              {stats?.totalMatches ?? 0}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-surface-light/40 border border-gray-800 text-center">
            <span className="text-[10px] uppercase font-mono text-gray-400 block mb-1">
              Wins / Win Rate
            </span>
            <span className="font-display font-black text-xl text-amber-400">
              {stats?.wins ?? 0}{' '}
              <span className="text-xs font-normal text-amber-300">({winRate}%)</span>
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-surface-light/40 border border-gray-800 text-center">
            <span className="text-[10px] uppercase font-mono text-gray-400 block mb-1">
              Best Score
            </span>
            <span className="font-display font-black text-xl text-cyan-400">
              {stats?.bestScore ?? 0}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-surface-light/40 border border-gray-800 text-center">
            <span className="text-[10px] uppercase font-mono text-gray-400 block mb-1">
              Avg Accuracy
            </span>
            <span className="font-display font-black text-xl text-emerald-400">
              {stats?.avgAccuracy ?? 0}%
            </span>
          </div>
        </div>

        {/* Match History Section */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="font-display font-bold text-sm text-gray-200">Recent Matches</h3>
          </div>

          {history.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400 bg-black/20 rounded-2xl border border-gray-800">
              No recent matches found. Start a game to build your record!
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-light/30 border border-gray-800/80 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        item.won
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {item.won ? 'VICTORY' : `RANK #${item.rank}`}
                    </span>
                    <span className="font-semibold text-gray-200">
                      {item.gameMode === 'TIME_CHALLENGE' ? 'Time Challenge' : 'Complete Grid'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-gray-400">
                    <span className="text-cyan-400 font-bold">{item.score} pts</span>
                    <span>{item.accuracy}% acc</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
