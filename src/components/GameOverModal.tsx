import React, { useEffect } from 'react';
import { RunStats, SouthAfricanCity } from '../types/game';
import { CITIES } from '../game/constants';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, MapPin, Home, User } from 'lucide-react';

interface GameOverModalProps {
  stats: RunStats;
  city: SouthAfricanCity;
  onPlayAgain: () => void;
  onChangeCity: () => void;
  onMainMenu: () => void;
  onChangeCharacter: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  city,
  onPlayAgain,
  onChangeCity,
  onMainMenu,
  onChangeCharacter,
}) => {
  const isNewHighScore = stats.score >= stats.highScore && stats.score > 0;
  const currentCityConfig = CITIES[city];

  useEffect(() => {
    if (isNewHighScore) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#ffffff'],
        });
      } catch (e) {
        // ignore in headless
      }
    }
  }, [isNewHighScore]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 select-none">
      <div className="w-full max-w-sm bg-slate-900 border-4 border-amber-500 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-4 text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header Tag */}
        <div className="bg-red-600 text-white font-arcade text-lg sm:text-xl px-6 py-1.5 rounded-full border-2 border-red-300 shadow-lg tracking-wider">
          CAUGHT BY INSPECTOR!
        </div>

        {/* Location Stamp */}
        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold uppercase tracking-wider">
          <MapPin className="w-3.5 h-3.5" />
          <span>{currentCityConfig.name} · {currentCityConfig.province}</span>
        </div>

        {/* High Score Alert */}
        {isNewHighScore && (
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 bg-amber-500/20 border border-amber-400 px-3 py-1 rounded-full animate-bounce">
            <Trophy className="w-4 h-4" />
            <span>NEW HIGH SCORE!</span>
          </div>
        )}

        {/* Big Score Card */}
        <div className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col gap-1 shadow-inner">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            RUN SCORE
          </span>
          <span className="text-4xl font-arcade text-amber-400 stroke-arcade tracking-wider">
            {stats.score.toLocaleString()}
          </span>
          <div className="flex justify-between items-center text-xs text-slate-300 border-t border-slate-700/80 pt-2 mt-2">
            <span>High Score:</span>
            <span className="font-bold text-white font-arcade">
              {stats.highScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Run Stats Tiles */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">COINS</span>
            <div className="flex items-center gap-1.5 text-xl font-arcade text-yellow-300 stroke-arcade-sm">
              <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="#facc15" stroke="#ca8a04" strokeWidth="2"/>
                <polygon points="12,5 14,9.5 19,10 15,13.5 16.5,18.5 12,15.5 7.5,18.5 9,13.5 5,10 10,9.5" fill="#fef08a"/>
              </svg>
              <span>+{stats.coins}</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">DISTANCE</span>
            <div className="text-xl font-arcade text-sky-300 stroke-arcade-sm">
              {stats.distance}m
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 w-full mt-2">
          <button
            data-start="true"
            onClick={onPlayAgain}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-arcade text-xl tracking-wider border-2 border-yellow-200 shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-6 h-6 stroke-[3]" />
            <span>RUN AGAIN</span>
          </button>

          <button
            onClick={onChangeCharacter}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-sm tracking-wider border border-yellow-200 shadow active:scale-95 transition flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4 stroke-[2.5]" />
            <span>CHANGE CHARACTER</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-200 hover:text-red-300 font-bold text-xs uppercase tracking-wider border border-slate-700 hover:border-red-500/50 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span>MAIN MENU</span>
          </button>

          <button
            onClick={onChangeCity}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition border border-slate-700"
          >
            Switch South Africa City
          </button>
        </div>
      </div>
    </div>
  );
};
