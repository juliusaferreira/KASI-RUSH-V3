import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CHARACTERS, HOVERBOARDS } from '../game/constants';
import { CharacterInfo, HoverboardInfo } from '../types/game';
import { User, Shield, Check, Lock, X, Upload, Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface CharacterModalProps {
  totalCoins: number;
  currentCharacter: string;
  currentHoverboard: string;
  onSelectCharacter: (char: CharacterInfo) => void;
  onSelectHoverboard: (board: HoverboardInfo) => void;
  onImportCustomModel?: (gltfScene: THREE.Group, animations: THREE.AnimationClip[], name: string) => void;
  onClose: () => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  totalCoins,
  currentCharacter,
  currentHoverboard,
  onSelectCharacter,
  onSelectHoverboard,
  onImportCustomModel,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'surfers' | 'boards'>('surfers');
  const [customModelName, setCustomModelName] = useState<string | null>(null);
  const [loadingModel, setLoadingModel] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingModel(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      if (!arrayBuffer) {
        setLoadingModel(false);
        setUploadError('Failed to read file buffer.');
        return;
      }

      const loader = new GLTFLoader();
      loader.parse(
        arrayBuffer,
        '',
        (gltf) => {
          setLoadingModel(false);
          const cleanName = file.name.replace(/\.[^/.]+$/, '');
          setCustomModelName(cleanName);
          onImportCustomModel?.(gltf.scene, gltf.animations, cleanName);
        },
        (error) => {
          setLoadingModel(false);
          setUploadError('Could not parse .glb model. Ensure it is a valid glTF 2.0 binary file.');
          console.error('GLTF parse error:', error);
        }
      );
    };

    reader.onerror = () => {
      setLoadingModel(false);
      setUploadError('File reading failed. Please try again.');
    };

    reader.readAsArrayBuffer(file);
    // Reset file input so re-selecting same file works
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-white max-h-[90vh] overflow-y-auto">
        {/* Header & Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('surfers')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-arcade text-xs sm:text-sm transition ${
                activeTab === 'surfers'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <User className="w-4 h-4" />
              <span>SURFERS</span>
            </button>
            <button
              onClick={() => setActiveTab('boards')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-arcade text-xs sm:text-sm transition ${
                activeTab === 'boards'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>BOARDS</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab 1: Surfers */}
        {activeTab === 'surfers' && (
          <div className="flex flex-col gap-4">
            {/* Custom 3D Model Import Banner */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-emerald-500/15 border-2 border-amber-400/50 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                  <span className="font-arcade text-xs sm:text-sm text-amber-300 stroke-arcade-sm">
                    IMPORT CUSTOM 3D RUNNER (.GLB)
                  </span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".glb,.gltf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loadingModel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-arcade text-xs font-black transition active:scale-95 shadow disabled:opacity-50"
                >
                  {loadingModel ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>PARSING...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>SELECT .GLB FILE</span>
                    </>
                  )}
                </button>
              </div>

              {customModelName ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Custom 3D Runner Active: <strong>{customModelName}</strong> (Rigged & Scaled!)
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Select any <strong>.glb</strong> or <strong>.gltf</strong> model from your computer (Blender, Mixamo, Sketchfab). It will automatically be normalized to runner scale with full running physics and gear!
                </p>
              )}

              {uploadError && (
                <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/70 border border-rose-500/40 px-3 py-1.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {CHARACTERS.map((char) => {
                const isSelected = char.id === currentCharacter;
                return (
                  <button
                    key={char.id}
                    onClick={() => {
                      onSelectCharacter(char);
                    }}
                    className={`flex flex-col items-center p-4 rounded-2xl border-2 text-center transition-all active:scale-95 relative ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 shadow-lg'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Character Avatar Icon */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-2 border-2 shadow-inner overflow-hidden text-3xl"
                      style={{ backgroundColor: char.outfitColor, borderColor: char.accentColor }}
                    >
                      {char.avatarImage ? (
                        <img src={char.avatarImage} alt={char.name} className="w-full h-full object-cover object-top scale-110" />
                      ) : (
                        <span>{char.avatarEmoji || '🏃'}</span>
                      )}
                    </div>

                    <div className="font-arcade text-base text-white stroke-arcade-sm">
                      {char.name}
                    </div>
                    <div className="text-[11px] font-semibold text-amber-300 mb-1">
                      {char.nickname}
                    </div>
                    <div className="text-[10px] text-slate-300 font-medium px-2 py-0.5 rounded bg-slate-950/40 line-clamp-2">
                      {char.comicTagline}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Hoverboards */}
        {activeTab === 'boards' && (
          <div className="grid grid-cols-2 gap-3.5">
            {HOVERBOARDS.map((board) => {
              const isSelected = board.id === currentHoverboard;
              return (
                <button
                  key={board.id}
                  onClick={() => {
                    onSelectHoverboard(board);
                  }}
                  className={`flex flex-col items-center p-4 rounded-2xl border-2 text-center transition-all active:scale-95 relative ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-400 shadow-lg'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Board Graphic */}
                  <div
                    className="w-20 h-10 rounded-full flex items-center justify-center mb-2 border-2 shadow-lg overflow-hidden"
                    style={{ backgroundColor: board.color, borderColor: board.trailColor }}
                  >
                    {board.deckImage ? (
                      <img src={board.deckImage} alt={board.name} className="w-full h-full object-cover" />
                    ) : board.id === 'bmx_bicycle' ? (
                      <span className="text-xl">🚲</span>
                    ) : board.id === 'electric_scooter' ? (
                      <span className="text-xl">🛴</span>
                    ) : board.id === 'kasi_cruiser' ? (
                      <span className="text-xl">🛹</span>
                    ) : (
                      <span className="text-xs font-black tracking-widest text-white drop-shadow">
                        SURF
                      </span>
                    )}
                  </div>

                  <div className="font-arcade text-base text-white stroke-arcade-sm">
                    {board.name}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-300">
                    {board.theme}
                  </div>
                  {board.modelUrl && (
                    <span className="mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ★ REAL 3D RIDE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="text-center text-xs text-slate-400 border-t border-slate-800 pt-3 flex justify-between items-center">
          <span>Tap to equip your runner & board</span>
          <span className="text-amber-400 font-bold">Total Coins: {totalCoins}</span>
        </div>
      </div>
    </div>
  );
};
