import { SouthAfricanCity, CityConfig, CharacterInfo, HoverboardInfo } from '../types/game';

export const LANE_WIDTH = 2.6; // distance between tracks in Three.js world units
export const LANES = [-LANE_WIDTH, 0, LANE_WIDTH]; // Left, Center, Right

export const BASE_SPEED = 22; // units per second forward
export const MAX_SPEED = 42;
export const SPEED_ACCELERATION = 0.25; // per second

export const JUMP_VELOCITY = 13.5;
export const SNEAKER_JUMP_VELOCITY = 19.0;
export const GRAVITY = 36.0;

export const ROLL_DURATION = 0.7; // seconds
export const HOVERBOARD_DURATION = 30.0; // seconds
export const JETPACK_DURATION = 8.0;
export const MAGNET_DURATION = 12.0;
export const SNEAKERS_DURATION = 14.0;
export const MULTIPLIER_DURATION = 15.0;

export const JETPACK_HEIGHT = 10.5;
export const TRAIN_HEIGHT = 3.6;
export const TRAIN_LENGTH = 28.0;
export const BARRIER_LOW_HEIGHT = 1.3;
export const BARRIER_HIGH_HEIGHT = 2.4;

export const CITIES: Record<SouthAfricanCity, CityConfig> = {
  soweto: {
    id: 'soweto',
    name: 'Soweto',
    province: 'Gauteng',
    tagline: 'Kasi Vibes & Orlando Towers',
    themeColor: '#eab308',
    skyColor: '#38bdf8',
    horizonColor: '#fef08a',
    fogColor: '#fde047',
    trackColor: '#475569',
    trainPrimaryColor: 0xeab308, // PRASA yellow
    trainSecondaryColor: 0x1e293b, // Dark charcoal
    landmarkName: 'Orlando Cooling Towers',
    description: 'Surf through the world-famous township with vibrant graffiti art, bustling streets, and the colorful Orlando Towers painted in rainbow murals!'
  },
  durban: {
    id: 'durban',
    name: 'Durban',
    province: 'KwaZulu-Natal',
    tagline: 'Golden Mile & Tropical Coast',
    themeColor: '#06b6d4',
    skyColor: '#0ea5e9',
    horizonColor: '#67e8f9',
    fogColor: '#a5f3fc',
    trackColor: '#334155',
    trainPrimaryColor: 0x0284c7, // Coastal Blue
    trainSecondaryColor: 0xffffff, // White
    landmarkName: 'Moses Mabhida Arch & Palms',
    description: 'Sprint along the sub-tropical Golden Mile, flanked by tall swaying palms, Indian Ocean breakers, and the soaring Moses Mabhida Stadium arch!'
  },
  capetown: {
    id: 'capetown',
    name: 'Cape Town',
    province: 'Western Cape',
    tagline: 'Table Mountain & Bo-Kaap',
    themeColor: '#ec4899',
    skyColor: '#60a5fa',
    horizonColor: '#f472b6',
    fogColor: '#fbcfe8',
    trackColor: '#374151',
    trainPrimaryColor: 0xec4899, // Vibrant Bo-Kaap magenta
    trainSecondaryColor: 0x38bdf8, // Bo-Kaap cyan
    landmarkName: 'Table Mountain & Bo-Kaap',
    description: 'Run through colorful Bo-Kaap pastel streets against the legendary flat-topped silhouette of Table Mountain and fresh Atlantic winds!'
  },
  nelspruit: {
    id: 'nelspruit',
    name: 'Nelspruit',
    province: 'Mpumalanga',
    tagline: 'Lowveld Streets & Green Hills',
    themeColor: '#84cc16',
    skyColor: '#7dd3fc',
    horizonColor: '#fef3c7',
    fogColor: '#d9f99d',
    trackColor: '#475569',
    trainPrimaryColor: 0x22c55e,
    trainSecondaryColor: 0xfbbf24,
    landmarkName: 'Lowveld Hills',
    description: 'Explore the warm Lowveld with colorful Nelspruit buildings, market stalls and green mountain scenery!',
  },
  eastern_cape: {
    id: 'eastern_cape',
    name: 'Eastern Cape',
    province: 'Wild Coast',
    tagline: 'Wild Coast & Rolling Hills',
    themeColor: '#10b981',
    skyColor: '#34d399',
    horizonColor: '#a7f3d0',
    fogColor: '#d1fae5',
    trackColor: '#27272a',
    trainPrimaryColor: 0x059669, // Forest Emerald
    trainSecondaryColor: 0xf59e0b, // Ochre gold
    landmarkName: 'Xhosa Rondavels & Ocean Cliffs',
    description: 'Navigate scenic railway tracks curving along emerald green rolling hills, traditional thatched rondavels, and dramatic Wild Coast sea cliffs!'
  }
};

export const CHARACTERS: CharacterInfo[] = [
  {
    id: 'skeleton',
    name: 'Mr. Bones',
    nickname: 'Crypt Cruiser',
    comicTagline: 'Animated comic skeleton with rattling ribcage & glowing eyes!',
    outfitColor: '#f8fafc',
    accentColor: '#0f172a',
    avatarEmoji: '💀',
    unlocked: true,
    cost: 0
  },
  {
    id: 'skullface',
    name: 'Skullface',
    nickname: 'Street Reaper',
    comicTagline: 'Skeleton hoodie, snapback cap & toxic skull hoverboard!',
    outfitColor: '#18181b',
    accentColor: '#84cc16',
    avatarEmoji: '💀',
    avatarImage: '/assets/aistudio/character_main_reference_75b51531.png',
    unlocked: true,
    cost: 0
  }
];

export const HOVERBOARDS: HoverboardInfo[] = [
  {
    id: 'kasi_cruiser',
    name: 'Kasi Cruiser',
    theme: 'Custom 3D Township Deck',
    color: '#f59e0b',
    trailColor: '#ef4444',
    modelUrl: '/assets/models/kasi_cruiser.glb',
    speedMultiplier: 1.0,
    powerupDurationMultiplier: 1.05,
    canTrainJump: true,
    canBlockObstacle: true,
    unlocked: true,
    cost: 0
  },
  {
    id: 'bmx_bicycle',
    name: 'BMX Cruiser',
    theme: '3D Freestyle Bike (+15% Speed)',
    color: '#ef4444',
    trailColor: '#38bdf8',
    modelUrl: '/assets/models/bmx_bicycle.glb',
    speedMultiplier: 1.15,
    powerupDurationMultiplier: 1.15,
    canTrainJump: true,
    unlocked: true,
    cost: 0
  },
  {
    id: 'electric_scooter',
    name: 'E-Scooter',
    theme: '3D Electric Scooter (+20% Speed)',
    color: '#10b981',
    trailColor: '#22c55e',
    modelUrl: '/assets/models/electric_scooter.glb',
    speedMultiplier: 1.2,
    powerupDurationMultiplier: 1.2,
    canTrainJump: true,
    smashSmallObstacles: true,
    unlocked: true,
    cost: 0
  },
  {
    id: 'skull_skateboard',
    name: 'Toxic Skull',
    theme: 'Acid Green & Skull Graphic',
    color: '#84cc16',
    trailColor: '#a3e635',
    deckImage: '/assets/aistudio/hoverboard_reference_726f507f.png',
    unlocked: true,
    cost: 0
  },
  {
    id: 'mzansi_rainbow',
    name: 'Mzansi Star',
    theme: 'South African Flag',
    color: '#059669',
    trailColor: '#f59e0b',
    unlocked: true,
    cost: 0
  },
  {
    id: 'durban_wave',
    name: 'Durban Surf',
    theme: 'Ocean Turquoise',
    color: '#0284c7',
    trailColor: '#38bdf8',
    unlocked: true,
    cost: 0
  },
  {
    id: 'zulu_shield',
    name: 'Warrior Shield',
    theme: 'Traditional Cowhide',
    color: '#78350f',
    trailColor: '#ffffff',
    unlocked: true,
    cost: 0
  },
  {
    id: 'kasi_quantum',
    name: 'Quantum Speed',
    theme: 'Minibus Taxi Chrome',
    color: '#f8fafc',
    trailColor: '#ef4444',
    unlocked: true,
    cost: 0
  }
];
