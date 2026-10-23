import React, { useState } from 'react';
import { Check } from 'lucide-react';
import type { ClaimRecord } from '../types/index.js';

interface TileProps {
  number: number;
  claim?: ClaimRecord;
  disabled: boolean;
  onClaim: (number: number) => void;
}

export const Tile: React.FC<TileProps> = React.memo(
  ({ number, claim, disabled, onClaim }) => {
    const [isWrong, setIsWrong] = useState(false);

    const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (disabled || claim) return;

      onClaim(number);
    };

    // 1. Claimed tile (claimed by a player)
    if (claim) {
      return (
        <div
          data-number={number}
          className="relative flex items-center justify-center aspect-square rounded-md sm:rounded-lg font-display font-bold select-none text-white shadow-sm transition-all duration-200 overflow-hidden"
          style={{
            backgroundColor: `${claim.playerColor}30`,
            borderColor: claim.playerColor,
            borderWidth: '1.5px',
          }}
          title={`Claimed by ${claim.playerName}`}
        >
          {/* Winner initial badge */}
          <span
            className="absolute top-0 right-0 text-[7px] sm:text-[8px] font-mono px-1 rounded-bl text-black font-extrabold uppercase truncate max-w-[24px]"
            style={{ backgroundColor: claim.playerColor }}
          >
            {claim.playerName.slice(0, 2)}
          </span>

          <span className="text-xs sm:text-sm font-semibold opacity-60 line-through decoration-white/30">
            {number}
          </span>

          <Check className="w-2.5 h-2.5 absolute bottom-0.5 text-white/70" />
        </div>
      );
    }

    // 2. Wrong click feedback (temporary red flash & shake)
    if (isWrong) {
      return (
        <button
          type="button"
          data-number={number}
          className="flex items-center justify-center aspect-square rounded-md sm:rounded-lg font-display font-bold text-xs sm:text-sm text-rose-300 bg-rose-950 border border-rose-500 animate-shake focus:outline-none"
        >
          {number}
        </button>
      );
    }

    // 3. Normal Available Tile (NO TARGET HIGHLIGHT - players must visually search for the number!)
    return (
      <button
        type="button"
        data-number={number}
        onClick={handleClick}
        disabled={disabled}
        className={`flex items-center justify-center aspect-square rounded-md sm:rounded-lg font-display font-semibold text-xs sm:text-sm text-gray-200 bg-[#161f30] hover:bg-[#1e2a40] active:scale-95 border border-slate-800 hover:border-slate-600 transition-colors duration-75 select-none focus:outline-none ${
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:bg-cyan-900/40'
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
      prev.disabled === next.disabled &&
      prev.claim?.playerId === next.claim?.playerId
    );
  }
);
