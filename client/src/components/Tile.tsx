import React, { useState } from 'react';
import { Check } from 'lucide-react';
import type { ClaimRecord } from '../types/index.js';

interface TileProps {
  number: number;
  claim?: ClaimRecord;
  disabled: boolean;
  onClaim: (number: number) => void;
  isMasked?: boolean;
}

export const Tile: React.FC<TileProps> = React.memo(
  ({ number, claim, disabled, onClaim, isMasked }) => {
    const [isWrong, setIsWrong] = useState(false);

    const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (disabled || claim || isMasked) return;
      onClaim(number);
    };

    // 0. Masked tile during initial countdown
    if (isMasked) {
      return (
        <div
          className="flex items-center justify-center aspect-square rounded-xl bg-gradient-to-b from-[#131B2A] to-[#0A0F1A] border border-cyan-500/20 text-cyan-500/30 select-none shadow-inner transition-opacity duration-300"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-500/20" />
        </div>
      );
    }

    // 1. Claimed tile (claimed by a player in multiplayer)
    if (claim) {
      return (
        <div
          data-number={number}
          className="relative flex items-center justify-center aspect-square rounded-xl font-display font-bold select-none text-white shadow-sm transition-all duration-200 overflow-hidden"
          style={{
            backgroundColor: `${claim.playerColor}25`,
            borderColor: claim.playerColor,
            borderWidth: '1.5px',
          }}
          title={`Claimed by ${claim.playerName}`}
        >
          {/* Winner initial badge */}
          <span
            className="absolute top-0 right-0 text-[7px] sm:text-[8px] font-mono px-1 rounded-bl text-black font-black uppercase truncate max-w-[24px]"
            style={{ backgroundColor: claim.playerColor }}
          >
            {claim.playerName.slice(0, 2)}
          </span>

          <span className="text-xs sm:text-sm font-semibold opacity-50 line-through decoration-white/40">
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
          className="flex items-center justify-center aspect-square rounded-xl font-display font-black text-xs sm:text-base text-rose-300 bg-rose-950 border-2 border-rose-500 animate-shake shadow-[0_0_15px_rgba(244,63,94,0.4)] focus:outline-none"
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
        className={`flex items-center justify-center aspect-square rounded-xl font-display font-black text-xs sm:text-base text-slate-100 bg-gradient-to-b from-[#1C263B] to-[#0E1726] hover:from-[#24314C] hover:to-[#131F33] border border-slate-700/80 hover:border-cyan-400 active:scale-95 active:brightness-125 transition-all duration-75 select-none focus:outline-none shadow-[0_2px_8px_rgba(0,0,0,0.4)] ${
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
      prev.isMasked === next.isMasked &&
      prev.claim?.playerId === next.claim?.playerId
    );
  }
);
