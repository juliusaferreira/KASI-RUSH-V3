import React from 'react';
import { Play, RotateCcw, Home, User, MapPin, Volume2, VolumeX } from 'lucide-react';
import { SouthAfricanCity, CharacterInfo } from '../types/game';
import { CITIES, CHARACTERS } from '../game/constants';

interface PauseModalProps {
  city: SouthAfricanCity;
  currentCharacter: string;
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onChangeCharacter: () => void;
  onChangeCity: () => void;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  city,
  currentCharacter,
  isMuted,
  onResume,
  onRestart,
  onMainMenu,
  onChangeCharacter,
  onChangeCity,
  onToggleMute,
}) => {
  const currentCityConfig = CITIES[city];
  const charInfo: CharacterInfo | undefined = CHARACTERS.find((c) => c.id === currentCharacter) || CHARACTERS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 select-none">
      <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center text-center gap-3.5 text-white animate-in fade-in zoom-in-95 duration-150">
        <h2 className="text-3xl font-arcade text-amber-300 stroke-arcade tracking-wider">
          PAUSED
        </h2>

        {/* Current Active Info Chips */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <div className="text-[11px] bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-full text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentCityConfig.name}</span>
          </div>

          <div className="text-[11px] bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-full text-slate-300 font-bold tracking-wider flex items-center gap-1.5 shadow">
            <span>{charInfo.avatarEmoji || '🏃'}</span>
            <span className="text-amber-300">{charInfo.name}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 w-full mt-1">
          {/* Resume */}
          <button
            onClick={onResume}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-arcade text-lg tracking-wider border border-emerald-200 shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>RESUME</span>
          </button>

          {/* Change Character */}
          <button
            onClick={onChangeCharacter}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-sm tracking-wider border border-yellow-200 shadow active:scale-95 transition flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4 stroke-[2.5]" />
            <span>CHANGE CHARACTER</span>
          </button>

          {/* Restart */}
          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider border border-slate-700 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>Restart Run</span>
          </button>

          {/* Return to Main Menu */}
          <button
            onClick={onMainMenu}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-200 hover:text-red-300 font-bold text-xs uppercase tracking-wider border border-slate-700 hover:border-red-500/50 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span>Main Menu</span>
          </button>

          {/* Switch City & Audio Settings in bottom row */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={onChangeCity}
              className="py-2 px-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] uppercase tracking-wider transition border border-slate-700 flex items-center justify-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Switch City</span>
            </button>

            <button
              onClick={onToggleMute}
              className="py-2 px-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-[11px] flex items-center justify-center gap-1.5 transition border border-slate-700"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isMuted ? 'Muted' : 'Sound On'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
