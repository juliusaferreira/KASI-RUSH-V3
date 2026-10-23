export type SouthAfricanCity = 'soweto' | 'durban' | 'capetown' | 'nelspruit' | 'eastern_cape';

export interface CityConfig {
  id: SouthAfricanCity;
  name: string;
  province: string;
  tagline: string;
  themeColor: string;
  skyColor: string;
  horizonColor: string;
  fogColor: string;
  trackColor: string;
  trainPrimaryColor: number;
  trainSecondaryColor: number;
  landmarkName: string;
  description: string;
}

export type PowerupType = 'sneakers' | 'magnet' | 'jetpack' | 'multiplier';

export interface PowerupState {
  sneakers: number; // time remaining in seconds
  magnet: number;
  jetpack: number;
  multiplier: number;
}

export type GameStatus = 'title' | 'playing' | 'paused' | 'gameover';

export interface PlayerState {
  lane: number; // -1 = Left, 0 = Center, 1 = Right
  targetLane: number;
  x: number;
  y: number;
  z: number;
  isJumping: boolean;
  isRolling: boolean;
  jumpVelocity: number;
  rollTimer: number;
  isOnTrain: boolean;
  currentTrainY: number;
  hasHoverboard: boolean;
  hoverboardTimer: number;
  stumbleTimer: number; // inspector catches up when > 0
}

export interface Obstacle {
  id: number;
  type: 'train' | 'barrier_low' | 'barrier_high' | 'ramp';
  lane: number; // -1, 0, 1
  z: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  speed?: number; // for moving oncoming trains!
}

export interface Collectible {
  id: number;
  type: 'coin' | PowerupType | 'mystery_box';
  lane: number;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

export type CharacterId =
  | 'skeleton'
  | 'skullface';

export type ComicSplashStyle = 'boom' | 'pow' | 'wow' | 'zoom' | 'kapow' | 'power';

export interface ComicSplashEvent {
  id: string;
  text: string;
  style: ComicSplashStyle;
  x?: number;
  y?: number;
  rotation: number;
}

export interface RunStats {
  score: number;
  coins: number;
  distance: number;
  multiplier: number;
  highScore: number;
  totalCoins: number;
}

export interface CharacterInfo {
  id: CharacterId | string;
  name: string;
  nickname: string;
  comicTagline: string;
  outfitColor: string;
  accentColor: string;
  avatarEmoji: string;
  avatarImage?: string;
  unlocked: boolean;
  cost: number;
}

export interface HoverboardInfo {
  id: string;
  name: string;
  theme: string;
  color: string;
  trailColor: string;
  deckImage?: string;
  modelUrl?: string;
  speedMultiplier?: number;
  powerupDurationMultiplier?: number;
  canTrainJump?: boolean;
  canBlockObstacle?: boolean;
  smashSmallObstacles?: boolean;
  unlocked: boolean;
  cost: number;
}

