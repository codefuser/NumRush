import React from 'react';
import { X, HelpCircle, Target, Brain, Award, ShieldAlert } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-surface border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.15)] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-surface-light text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-2xl text-white">How to Play NumRush</h2>
            <p className="text-xs text-gray-400">Master the rules of the competitive number hunt</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-gray-300">
          <div className="p-4 rounded-2xl bg-surface-light/40 border border-gray-800">
            <div className="flex items-center gap-2 font-display font-bold text-base text-cyan-400 mb-1">
              <Target className="w-4 h-4" />
              1. The Sequential Hunt
            </div>
            <p>
              The target sequence starts at <strong>1</strong> and ascends strictly: <strong>1 → 2 → 3 → 4 ... → N</strong>.
              All players in the room share the exact same shuffled grid and the same current target.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-light/40 border border-gray-800">
            <div className="flex items-center gap-2 font-display font-bold text-base text-amber-400 mb-1">
              <Award className="w-4 h-4" />
              2. First Valid Claim Wins
            </div>
            <p>
              The first player to spot and click the active target claims the point! The number is marked with that player's color, and the target immediately advances for everyone. Subsequent clicks on an already claimed number award no points.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-light/40 border border-gray-800">
            <div className="flex items-center gap-2 font-display font-bold text-base text-purple-400 mb-1">
              <Brain className="w-4 h-4" />
              3. Visual Memory Strategy
            </div>
            <p>
              The grid never reshuffles during gameplay. While scanning for the current target, memorize the positions of upcoming numbers (e.g. 15, 23, 40). When they become active, claim them instantly before your rivals!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-light/40 border border-gray-800">
            <div className="flex items-center gap-2 font-display font-bold text-base text-rose-400 mb-1">
              <ShieldAlert className="w-4 h-4" />
              4. Server-Authoritative Fair Play
            </div>
            <p>
              All scoring and validation happen securely on the game server. In cases where multiple players click within milliseconds, the server receipt order is the tie-breaker to ensure exactly one winner per target.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3.5 rounded-xl font-display font-bold text-sm text-black bg-cyan-400 hover:bg-cyan-300 transition-colors tap-effect"
        >
          Got It, Let's Play!
        </button>
      </div>
    </div>
  );
};
