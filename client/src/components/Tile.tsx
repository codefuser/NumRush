import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { ClaimRecord } from '../types/index.js';

interface TileProps {
  number: number;
  isTarget: boolean;
  claim?: ClaimRecord;
  disabled: boolean;
  onClaim: (number: number) => void;
}

export const Tile: React.FC<TileProps> = React.memo(
  ({ number, isTarget, claim, disabled, onClaim }) => {
    const [isWrong, setIsWrong] = useState(false);

    const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (disabled || claim) return;

      if (!isTarget) {
        setIsWrong(true);
        setTimeout(() => setIsWrong(false), 450);
      }

      onClaim(number);
    };

    // State 1: Claimed tile
    if (claim) {
      return (
        <div
          data-number={number}
          className="relative flex flex-col items-center justify-center aspect-square rounded-lg font-display font-bold select-none text-white shadow-md transition-all duration-300 transform scale-95 overflow-hidden"
          style={{
            backgroundColor: `${claim.playerColor}33`, // 20% opacity
            borderColor: claim.playerColor,
            borderWidth: '2px',
            boxShadow: `0 0 12px ${claim.playerColor}40`,
          }}
          title={`Claimed by ${claim.playerName}`}
        >
          {/* Top-right mini initial badge */}
          <span
            className="absolute top-0.5 right-0.5 text-[8px] font-mono px-1 py-0.2 rounded-bl text-black font-extrabold uppercase truncate max-w-[28px]"
            style={{ backgroundColor: claim.playerColor }}
          >
            {claim.playerName.slice(0, 2)}
          </span>

          {/* Number text */}
          <span className="text-base sm:text-lg opacity-90 line-through decoration-white/40">{number}</span>

          {/* Mini Check Icon */}
          <Check className="w-3 h-3 absolute bottom-0.5 text-white/80" />
        </div>
      );
    }

    // State 2: Active Target
    if (isTarget) {
      return (
        <button
          type="button"
          data-number={number}
          onClick={handleClick}
          disabled={disabled}
          className="relative flex items-center justify-center aspect-square rounded-lg font-display font-black text-lg sm:text-xl text-amber-300 bg-gradient-to-br from-amber-500/25 to-yellow-600/30 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-target-beacon z-20 tap-effect transition-all focus:outline-none focus:ring-2 focus:ring-amber-300"
          aria-label={`Target Number ${number}`}
        >
          {/* Beacon pulse circle */}
          <span className="absolute -inset-1 rounded-lg border border-amber-400/60 animate-ping pointer-events-none" />
          <span className="relative z-10 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">{number}</span>
        </button>
      );
    }

    // State 3: Wrong click feedback
    if (isWrong) {
      return (
        <button
          type="button"
          data-number={number}
          className="flex items-center justify-center aspect-square rounded-lg font-display font-bold text-base sm:text-lg text-rose-300 bg-rose-950/80 border-2 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-shake z-10 focus:outline-none"
        >
          {number}
        </button>
      );
    }

    // State 4: Available normal tile
    return (
      <button
        type="button"
        data-number={number}
        onClick={handleClick}
        disabled={disabled}
        className={`flex items-center justify-center aspect-square rounded-lg font-display font-semibold text-sm sm:text-base text-gray-200 bg-surface-light/50 hover:bg-surface-light/90 border border-gray-800/90 hover:border-cyan-500/50 hover:text-cyan-300 hover:shadow-[0_0_10px_rgba(0,240,255,0.2)] active:scale-95 transition-all duration-100 select-none tap-effect focus:outline-none focus:ring-1 focus:ring-cyan-400/50 ${
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
        }`}
        aria-label={`Number ${number}`}
      >
        {number}
      </button>
    );
  },
  (prev, next) => {
    return (
      prev.number === next.number &&
      prev.isTarget === next.isTarget &&
      prev.disabled === next.disabled &&
      prev.claim?.playerId === next.claim?.playerId
    );
  }
);
