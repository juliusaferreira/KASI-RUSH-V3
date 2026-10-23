import React from 'react';
import { SouthAfricanCity } from '../types/game';
import { CITIES } from '../game/constants';
import { MapPin, X, Check, Compass } from 'lucide-react';

interface CitySelectorModalProps {
  currentCity: SouthAfricanCity;
  onSelectCity: (city: SouthAfricanCity) => void;
  onClose: () => void;
}

export const CitySelectorModal: React.FC<CitySelectorModalProps> = ({
  currentCity,
  onSelectCity,
  onClose,
}) => {
  // Only the two active Kasi Rush routes are available to players.
  const cityList = [CITIES.soweto, CITIES.capetown];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-arcade text-amber-300 stroke-arcade-sm tracking-wide">
                SOUTH AFRICA TOUR
              </h2>
              <p className="text-xs text-slate-400">Choose your destination</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {cityList.map((c) => {
            const isSelected = c.id === currentCity;
            return (
              <button
                key={c.id}
                onClick={() => {
                  onSelectCity(c.id);
                  onClose();
                }}
                className={`group relative flex flex-col items-start p-3 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}

                <div className={`relative w-full aspect-[8/5] overflow-hidden rounded-xl border-[3px] mb-3 shadow-inner ${isSelected ? 'border-amber-300' : 'border-slate-500'}`}>
                  <img
                    src={c.id === 'soweto' ? '/assets/routes/soweto.svg' : '/assets/routes/capetown.svg'}
                    alt={`${c.name} destination preview`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute bottom-2 left-2 rounded-md bg-slate-950/80 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                    {isSelected ? 'Selected Route' : 'Tap to Select'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{c.province}</span>
                </div>

                <div className="text-xl font-arcade text-white stroke-arcade-sm mb-1">
                  {c.name}
                </div>

                <div className="text-xs font-semibold text-slate-300 mb-2">
                  {c.tagline}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                  {c.description}
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                  <span>🏛️ {c.landmarkName}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 border-t border-slate-800 pt-3">
          Surfing across South Africa • PRASA Trains, Metrorail & Iconic Townships
        </div>
      </div>
    </div>
  );
};
