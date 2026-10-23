import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface OnScreenControlsProps {
  onLeft: () => void;
  onRight: () => void;
  onJump: () => void;
  onSlide: () => void;
}

export const OnScreenControls: React.FC<OnScreenControlsProps> = ({
  onLeft,
  onRight,
  onJump,
  onSlide,
}) => {
  return (
    <div className="absolute bottom-4 inset-x-0 px-4 flex justify-between items-center pointer-events-none select-none">
      {/* Left / Right lateral buttons (Left thumb) */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={onLeft}
          className="w-14 h-14 rounded-2xl bg-slate-900/60 active:bg-amber-500/80 border-2 border-slate-600/80 active:border-amber-300 text-white flex items-center justify-center transition shadow-lg active:scale-95"
          aria-label="Move Left"
        >
          <ArrowLeft className="w-7 h-7" />
        </button>
        <button
          onClick={onRight}
          className="w-14 h-14 rounded-2xl bg-slate-900/60 active:bg-amber-500/80 border-2 border-slate-600/80 active:border-amber-300 text-white flex items-center justify-center transition shadow-lg active:scale-95"
          aria-label="Move Right"
        >
          <ArrowRight className="w-7 h-7" />
        </button>
      </div>

      {/* Jump / Slide vertical buttons (Right thumb) */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={onSlide}
          className="w-14 h-14 rounded-2xl bg-slate-900/60 active:bg-sky-500/80 border-2 border-slate-600/80 active:border-sky-300 text-white flex flex-col items-center justify-center transition shadow-lg active:scale-95"
          aria-label="Slide or Roll"
        >
          <ArrowDown className="w-6 h-6" />
          <span className="text-[9px] font-arcade uppercase tracking-wider">ROLL</span>
        </button>
        <button
          onClick={onJump}
          className="w-16 h-16 rounded-2xl bg-amber-500/80 active:bg-amber-400 border-2 border-amber-300 text-slate-950 flex flex-col items-center justify-center transition shadow-xl active:scale-95 font-black"
          aria-label="Jump"
        >
          <ArrowUp className="w-7 h-7 stroke-[3]" />
          <span className="text-[10px] font-arcade uppercase tracking-wider">JUMP</span>
        </button>
      </div>
    </div>
  );
};
