import React from 'react';
import { RunStats, PowerupState, SouthAfricanCity } from '../types/game';
import { CITIES, JETPACK_DURATION, MAGNET_DURATION, SNEAKERS_DURATION, MULTIPLIER_DURATION, HOVERBOARD_DURATION } from '../game/constants';
import { Volume2, VolumeX, Pause, Shield, Zap, Compass } from 'lucide-react';

interface GameHUDProps {
  stats: RunStats;
  powerups: PowerupState;
  hasHoverboard: boolean;
  hoverboardTimer: number;
  city: SouthAfricanCity;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onActivateHoverboard: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  powerups,
  hasHoverboard,
  hoverboardTimer,
  city,
  isMuted,
  onToggleMute,
  onPause,
  onActivateHoverboard,
}) => {
  const currentCityConfig = CITIES[city];

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5">
      {/* Top Header Row */}
      <div className="flex items-start justify-between w-full">
        {/* Score & Multiplier */}
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 font-arcade text-xs sm:text-sm px-2.5 py-0.5 rounded-full font-black border-2 border-slate-900 shadow-md">
              x{stats.multiplier}
            </span>
            <span className="text-2xl sm:text-4xl font-arcade text-white stroke-arcade tracking-wider">
              {stats.score.toString().padStart(6, '0')}
            </span>
          </div>
          <div className="text-[11px] font-bold text-amber-300 drop-shadow">
            BEST: {stats.highScore.toLocaleString()}
          </div>
        </div>

        {/* City Tag in Center */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 border border-amber-500/60 rounded-full px-3 py-1 shadow-lg pointer-events-auto">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-arcade text-amber-300 tracking-wider">
            {currentCityConfig.name.toUpperCase()} · {currentCityConfig.province.toUpperCase()}
          </span>
        </div>

        {/* Coins & Quick Utilities */}
        <div className="flex flex-col items-end gap-2">
          {/* Golden Coin Counter */}
          <div className="flex items-center gap-2 bg-slate-900/80 border-2 border-yellow-500/80 rounded-full px-3 py-1 shadow-md">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="#facc15" stroke="#ca8a04" strokeWidth="2"/>
              <polygon points="12,5 14,9.5 19,10 15,13.5 16.5,18.5 12,15.5 7.5,18.5 9,13.5 5,10 10,9.5" fill="#fef08a"/>
            </svg>
            <span className="text-xl sm:text-2xl font-arcade text-yellow-300 stroke-arcade">
              {stats.coins}
            </span>
          </div>

          {/* Pause & Mute buttons */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onToggleMute}
              className="w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center active:scale-95 transition shadow"
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onPause}
              className="w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center active:scale-95 transition shadow"
              aria-label="Pause Game"
            >
              <Pause className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Powerup Timers (Left side stack) */}
      <div className="flex flex-col gap-2 max-w-[200px] mb-20 sm:mb-16">
        {powerups.jetpack > 0 && (
          <div className="bg-slate-900/85 border border-sky-400 rounded-lg p-2 shadow-lg flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs font-arcade text-sky-300">
              <span>🚀 JETPACK</span>
              <span>{powerups.jetpack.toFixed(1)}s</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-400 transition-all duration-100 rounded-full"
                style={{ width: `${(powerups.jetpack / JETPACK_DURATION) * 100}%` }}
              />
            </div>
          </div>
        )}

        {powerups.magnet > 0 && (
          <div className="bg-slate-900/85 border border-rose-400 rounded-lg p-2 shadow-lg flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs font-arcade text-rose-300">
              <span>🧲 COIN MAGNET</span>
              <span>{powerups.magnet.toFixed(1)}s</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all duration-100 rounded-full"
                style={{ width: `${(powerups.magnet / MAGNET_DURATION) * 100}%` }}
              />
            </div>
          </div>
        )}

        {powerups.sneakers > 0 && (
          <div className="bg-slate-900/85 border border-emerald-400 rounded-lg p-2 shadow-lg flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs font-arcade text-emerald-300">
              <span>👟 SUPER SNEAKERS</span>
              <span>{powerups.sneakers.toFixed(1)}s</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-100 rounded-full"
                style={{ width: `${(powerups.sneakers / SNEAKERS_DURATION) * 100}%` }}
              />
            </div>
          </div>
        )}

        {powerups.multiplier > 0 && (
          <div className="bg-slate-900/85 border border-amber-400 rounded-lg p-2 shadow-lg flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs font-arcade text-amber-300">
              <span>⭐ 2X MULTIPLIER</span>
              <span>{powerups.multiplier.toFixed(1)}s</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-100 rounded-full"
                style={{ width: `${(powerups.multiplier / MULTIPLIER_DURATION) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row: Hoverboard Activation Button */}
      <div className="flex items-end justify-end pointer-events-auto mb-28 sm:mb-20">
        <button
          onClick={onActivateHoverboard}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border-2 font-arcade text-sm transition-transform active:scale-90 shadow-xl ${
            hasHoverboard
              ? 'bg-emerald-600 border-emerald-300 text-white animate-pulse'
              : 'bg-slate-900/90 hover:bg-slate-800 border-amber-400 text-amber-300'
          }`}
          aria-label="Hoverboard Shield"
        >
          <Shield className="w-5 h-5" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
              {hasHoverboard ? 'PROTECTED' : 'DOUBLE TAP'}
            </span>
            <span className="text-sm">
              {hasHoverboard ? `${hoverboardTimer.toFixed(0)}s ACTIVE` : 'HOVERBOARD'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
