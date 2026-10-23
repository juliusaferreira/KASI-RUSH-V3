import React from 'react';
import { SouthAfricanCity } from '../types/game';
import { CITIES } from '../game/constants';
import { PWAInstallButton } from './PWAInstallButton';
import { Play, Compass, User, Trophy, Shield, Volume2, VolumeX } from 'lucide-react';

interface TitleScreenProps {
  city: SouthAfricanCity;
  highScore: number;
  totalCoins: number;
  isMuted: boolean;
  onStart: () => void;
  onOpenCitySelector: () => void;
  onOpenCharacterModal: () => void;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  city,
  highScore,
  totalCoins,
  isMuted,
  onStart,
  onOpenCitySelector,
  onOpenCharacterModal,
  onToggleMute,
}) => {
  const currentCityConfig = CITIES[city];

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between items-center p-4 sm:p-6 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/80 pointer-events-auto select-none">
      {/* Top Bar: Stats & Install on Android */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        {/* High Score Badge */}
        <div className="flex items-center gap-2 bg-slate-900/80 border-2 border-amber-500/80 px-3.5 py-1.5 rounded-full shadow-lg">
          <Trophy className="w-4 h-4 text-amber-400" />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-bold text-slate-400 uppercase">HIGH SCORE</span>
            <span className="font-arcade text-sm text-amber-300">
              {highScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Center: Total Coins */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 border-2 border-yellow-500/80 px-3 py-1.5 rounded-full shadow-lg">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#facc15" stroke="#ca8a04" strokeWidth="2"/>
            <polygon points="12,5 14,9.5 19,10 15,13.5 16.5,18.5 12,15.5 7.5,18.5 9,13.5 5,10 10,9.5" fill="#fef08a"/>
          </svg>
          <span className="font-arcade text-sm text-yellow-300">
            {totalCoins.toLocaleString()}
          </span>
        </div>

        {/* Right: Audio Toggle & Android PWA Install */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center transition shadow"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <PWAInstallButton />
        </div>
      </div>

      {/* Center: Title & City Emblem Lockup */}
      <div className="flex flex-col items-center text-center gap-3 my-auto">
        {/* Kasi Rush South Africa Title SVG Lockup */}
        <div className="relative flex flex-col items-center">
          {/* World Tour Ribbon */}
          <div className="bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600 px-5 py-1 rounded-full text-slate-950 font-arcade text-xs tracking-widest font-black uppercase shadow-lg border border-amber-200 -mb-2 z-10">
            SOUTH AFRICA TOUR
          </div>

          <div className="flex flex-col items-center">
            <h1 className="text-5xl sm:text-7xl font-arcade text-white stroke-arcade-lg tracking-wider text-shadow-arcade transform -rotate-1">
              KASI
            </h1>
            <h1 className="text-5xl sm:text-7xl font-arcade text-amber-400 stroke-arcade-lg tracking-wider text-shadow-arcade transform rotate-1 -mt-3 sm:-mt-5">
              RUSH
            </h1>
          </div>

          {/* Current City Banner with quick change button */}
          <button
            onClick={onOpenCitySelector}
            aria-label="Change South Africa City"
            className="mt-2 flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border-2 border-emerald-400/80 px-4 py-1.5 rounded-full shadow-xl transition active:scale-95 group"
          >
            <Compass className="w-4 h-4 text-emerald-400 group-hover:rotate-45 transition-transform" />
            <span className="text-xs sm:text-sm font-arcade text-emerald-300 tracking-wider">
              {currentCityConfig.name.toUpperCase()} · {currentCityConfig.province.toUpperCase()}
            </span>
            <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-black">
              CHANGE
            </span>
          </button>
          <span className="text-[11px] text-slate-300 font-semibold drop-shadow mt-1">
            {currentCityConfig.tagline}
          </span>
        </div>

        {/* Big Tap to Run Button */}
        <button
          data-start="true"
          onClick={onStart}
          className="mt-4 px-10 sm:px-14 py-4 sm:py-5 rounded-3xl bg-gradient-to-r from-emerald-500 via-amber-400 to-yellow-400 hover:from-emerald-400 hover:to-yellow-300 text-slate-950 font-arcade text-2xl sm:text-3xl tracking-widest border-4 border-yellow-200 shadow-2xl transition-transform active:scale-90 flex items-center justify-center gap-3 animate-pulse"
        >
          <Play className="w-8 h-8 fill-slate-950 stroke-[3]" />
          <span>TAP TO RUN</span>
        </button>
      </div>

      {/* Bottom Bar: Character / Board Select & Control Hints */}
      <div className="w-full max-w-lg flex flex-col items-center gap-3">
        {/* Customize Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCharacterModal}
            className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border-2 border-slate-700 px-4 py-2 rounded-2xl shadow-lg transition active:scale-95"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-arcade text-white">CHARACTERS</span>
          </button>

          <button
            onClick={onOpenCharacterModal}
            className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border-2 border-slate-700 px-4 py-2 rounded-2xl shadow-lg transition active:scale-95"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-arcade text-white">HOVERBOARDS</span>
          </button>
        </div>

        {/* Clean borderless control hint */}
        <p className="text-[11px] sm:text-xs text-slate-300 font-medium tracking-wide drop-shadow text-center">
          Swipe / WASD to Dodge · Space to Jump · Double Tap for Hoverboard
        </p>
      </div>
    </div>
  );
};
