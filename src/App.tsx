/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GameEngine } from './game/GameEngine';
import { SouthAfricanCity, RunStats, PowerupState, CharacterInfo, CharacterId, HoverboardInfo, GameStatus } from './types/game';
import { CHARACTERS, HOVERBOARDS } from './game/constants';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { OnScreenControls } from './components/OnScreenControls';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { CitySelectorModal } from './components/CitySelectorModal';
import { CharacterModal } from './components/CharacterModal';
import { sound } from './audio/soundManager';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI State Machine
  const [gameState, setGameState] = useState<GameStatus>('title');
  const [city, setCity] = useState<SouthAfricanCity>('soweto');
  const [character, setCharacter] = useState<string>(() => {
    const saved = localStorage.getItem('mzansi_character');
    return saved === 'skullface' || saved === 'skeleton' ? saved : 'skeleton';
  });
  const [hoverboard, setHoverboard] = useState<string>('mzansi_rainbow');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals
  const [showCityModal, setShowCityModal] = useState<boolean>(false);
  const [showCharModal, setShowCharModal] = useState<boolean>(false);

  // Run Stats
  const [stats, setStats] = useState<RunStats>({
    score: 0,
    coins: 0,
    distance: 0,
    multiplier: 10,
    highScore: parseInt(localStorage.getItem('mzansi_high_score') || '0', 10),
    totalCoins: parseInt(localStorage.getItem('mzansi_total_coins') || '0', 10),
  });

  // Powerups State
  const [powerups, setPowerups] = useState<PowerupState>({
    sneakers: 0,
    magnet: 0,
    jetpack: 0,
    multiplier: 0,
  });
  const [hasHoverboard, setHasHoverboard] = useState<boolean>(false);
  const [hoverboardTimer, setHoverboardTimer] = useState<number>(0);

  // Sync state to body dataset
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Handle Score and Powerup Updates from Engine
  const handleScoreUpdate = useCallback((newStats: RunStats) => {
    setStats(newStats);
  }, []);

  const handlePowerupUpdate = useCallback((newPowerups: PowerupState, boardActive: boolean, boardTime: number) => {
    setPowerups(newPowerups);
    setHasHoverboard(boardActive);
    setHoverboardTimer(boardTime);
  }, []);

  const handleGameOver = useCallback((finalStats: RunStats) => {
    setStats(finalStats);
    setGameState('gameover');
  }, []);

  // Initialize GameEngine once
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new GameEngine(mountRef.current, city, {
      onScoreUpdate: handleScoreUpdate,
      onPowerupUpdate: handlePowerupUpdate,
      onGameOver: handleGameOver,
    });
    engineRef.current = engine;

    const savedChar = localStorage.getItem('mzansi_character');
    const initialChar: CharacterId = savedChar === 'skullface' || savedChar === 'skeleton' ? savedChar : 'skeleton';
    const charInfo = CHARACTERS.find((c) => c.id === initialChar);
    engine.setCharacter(initialChar, charInfo?.outfitColor);

    const initialBoard = localStorage.getItem('mzansi_hoverboard') || 'kasi_cruiser';
    engine.setHoverboard(initialBoard);

    // Check autostart query parameter (Ultra Mode requirement)
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setGameState('playing');
      engine.start();
    } else {
      engine.renderTitleFrame();
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []); // Run once on mount

  // Update city if changed
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setCity(city);
    }
  }, [city]);

  // Handle Start Run
  const handleStartRun = useCallback(() => {
    setGameState('playing');
    if (engineRef.current) {
      engineRef.current.start();
    }
  }, []);

  // Handle Pause
  const handlePause = useCallback(() => {
    setGameState('paused');
    if (engineRef.current) {
      engineRef.current.pause();
    }
  }, []);

  // Handle Resume
  const handleResume = useCallback(() => {
    setGameState('playing');
    if (engineRef.current) {
      engineRef.current.resume();
    }
  }, []);

  // Handle Restart
  const handleRestart = useCallback(() => {
    setGameState('playing');
    if (engineRef.current) {
      engineRef.current.start();
    }
  }, []);

  // Handle Return to Main Menu
  const handleReturnToMainMenu = useCallback(() => {
    setGameState('title');
    if (engineRef.current) {
      engineRef.current.returnToMainMenu();
    }
  }, []);

  // Keyboard Handlers for global shortcuts (Space/Enter to start, Esc/P to pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartRun();
        }
      } else if (gameState === 'playing') {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          handlePause();
        }
      } else if (gameState === 'paused') {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          handleResume();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleStartRun, handlePause, handleResume]);

  const handleToggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleSelectCharacter = useCallback((char: CharacterInfo) => {
    setCharacter(char.id);
    localStorage.setItem('mzansi_character', char.id);
    if (engineRef.current) {
      engineRef.current.setCharacter(char.id as any, char.outfitColor);
    }
  }, []);

  const handleImportCustomModel = useCallback(
    (gltfScene: THREE.Group, animations: THREE.AnimationClip[], name: string) => {
      setCharacter('custom' as any);
      if (engineRef.current) {
        engineRef.current.setCustomGltfModel(gltfScene, animations, name);
      }
    },
    []
  );

  const handleSelectHoverboard = useCallback((board: HoverboardInfo) => {
    setHoverboard(board.id);
    localStorage.setItem('mzansi_hoverboard', board.id);
    if (engineRef.current) {
      engineRef.current.setHoverboard(board.id);
    }
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Title Screen */}
      {gameState === 'title' && (
        <TitleScreen
          city={city}
          highScore={stats.highScore}
          totalCoins={stats.totalCoins}
          isMuted={isMuted}
          onStart={handleStartRun}
          onOpenCitySelector={() => setShowCityModal(true)}
          onOpenCharacterModal={() => setShowCharModal(true)}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Live In-Game HUD */}
      {gameState === 'playing' && (
        <>
          <GameHUD
            stats={stats}
            powerups={powerups}
            hasHoverboard={hasHoverboard}
            hoverboardTimer={hoverboardTimer}
            city={city}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onPause={handlePause}
            onActivateHoverboard={() => engineRef.current?.activateHoverboard()}
          />
          {/* On-screen touch buttons for Android */}
          <OnScreenControls
            onLeft={() => engineRef.current?.moveLane(-1)}
            onRight={() => engineRef.current?.moveLane(1)}
            onJump={() => engineRef.current?.jump()}
            onSlide={() => engineRef.current?.roll()}
          />
        </>
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          city={city}
          currentCharacter={character}
          isMuted={isMuted}
          onResume={handleResume}
          onRestart={handleRestart}
          onMainMenu={handleReturnToMainMenu}
          onChangeCharacter={() => setShowCharModal(true)}
          onChangeCity={() => setShowCityModal(true)}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={stats}
          city={city}
          onPlayAgain={handleStartRun}
          onMainMenu={handleReturnToMainMenu}
          onChangeCharacter={() => setShowCharModal(true)}
          onChangeCity={() => setShowCityModal(true)}
        />
      )}

      {/* South Africa City Selector Modal */}
      {showCityModal && (
        <CitySelectorModal
          currentCity={city}
          onSelectCity={(newCity) => setCity(newCity)}
          onClose={() => setShowCityModal(false)}
        />
      )}

      {/* Character & Board Customization Modal */}
      {showCharModal && (
        <CharacterModal
          totalCoins={stats.totalCoins}
          currentCharacter={character}
          currentHoverboard={hoverboard}
          onSelectCharacter={handleSelectCharacter}
          onSelectHoverboard={handleSelectHoverboard}
          onImportCustomModel={handleImportCustomModel}
          onClose={() => setShowCharModal(false)}
        />
      )}
    </div>
  );
}
