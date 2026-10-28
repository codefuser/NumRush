import React from 'react';
import { LogOut, RotateCcw, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface LeaveGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLeave: (permanent: boolean) => void;
  isMatchActive?: boolean;
  isHost?: boolean;
}

export const LeaveGameModal: React.FC<LeaveGameModalProps> = ({
  isOpen,
  onClose,
  onConfirmLeave,
  isMatchActive = false,
  isHost = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0D1527] border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,240,255,0.2)] cursor-default"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white">
              {isMatchActive ? 'Leave Active Game?' : 'Leave Room?'}
            </h2>
            <p className="text-xs text-gray-400">
              Choose whether you plan to come back or leave permanently
            </p>
          </div>
        </div>

        {/* Informative Host notice */}
        {isHost && (
          <div className="mb-4 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200/90 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Host Guarantee:</strong> If you choose &quot;I&apos;ll Rejoin Later&quot;, your host privileges and room ownership are automatically restored when you return!
            </span>
          </div>
        )}

        {/* Options */}
        <div className="space-y-3 mt-2">
          {/* Option 1: Temporary Leave (Reserve spot) */}
          <button
            onClick={() => onConfirmLeave(false)}
            className="w-full text-left p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent hover:from-amber-500/25 border border-amber-500/40 hover:border-amber-400 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 group-hover:scale-105 transition-transform">
                  <RotateCcw className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <div className="font-display font-black text-sm text-white group-hover:text-amber-300 transition-colors">
                    I&apos;ll Rejoin Later (Hold My Spot)
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                    Keep your spot reserved. Strangers cannot take your slot while you&apos;re away.
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-1 rounded-lg border border-amber-500/30">
                Hold Spot
              </span>
            </div>
          </button>

          {/* Option 2: Permanent Leave (Free spot) */}
          <button
            onClick={() => onConfirmLeave(true)}
            className="w-full text-left p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-red-500/5 to-transparent hover:from-rose-500/20 border border-rose-500/30 hover:border-rose-500/60 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 group-hover:scale-105 transition-transform">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display font-black text-sm text-white group-hover:text-rose-300 transition-colors">
                    Leave Permanently (Free My Spot)
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                    Completely exit room. Your slot will be opened for other players to join.
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-1 rounded-lg border border-rose-500/30">
                Free Spot
              </span>
            </div>
          </button>
        </div>

        {/* Cancel Button */}
        <div className="mt-4 pt-3 border-t border-gray-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-xs font-display font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            Cancel & Stay in Match
          </button>
        </div>
      </div>
    </div>
  );
};
