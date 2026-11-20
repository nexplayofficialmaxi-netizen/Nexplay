import React from 'react';

interface NexPlayLogoProps {
  compact?: boolean;
}

export const NexPlayLogo: React.FC<NexPlayLogoProps> = ({ compact = false }) => {
  return (
    <div className="flex items-center gap-3 select-none whitespace-nowrap shrink-0">
      {/* NexPlay Geometric Emblem */}
      <svg
        width={compact ? 32 : 40}
        height={compact ? 32 : 40}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <polygon points="4,6 18,6 28,20 18,34 4,34 14,20" fill="#E11D48" />
        <polygon points="20,6 30,6 36,15 26,15" fill="#F8FAFC" />
        <polygon points="26,25 36,25 30,34 20,34" fill="#38BDF8" />
      </svg>

      <div className="flex flex-col leading-none">
        <span className="font-display text-2xl font-extrabold tracking-tight text-white">
          AYSÉN <span className="text-rose-500">NASCAR</span>
        </span>
        {!compact && (
          <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-400">
            NEXPLAY CHILE
          </span>
        )}
      </div>
    </div>
  );
};
