import { LANE_WIDTH, GRAVITY } from './constants';
import { PowerupState, PowerupType, Obstacle } from '../types/game';

/**
 * Returns the 3D X coordinate for a given lane index (-1 = Left, 0 = Center, 1 = Right).
 */
export function getLaneX(laneIndex: number): number {
  const clamped = clampLane(laneIndex);
  return clamped * LANE_WIDTH;
}

/**
 * Clamps lane index to [-1, 1].
 */
export function clampLane(laneIndex: number): number {
  return Math.max(-1, Math.min(1, Math.round(laneIndex)));
}

import { SouthAfricanCity } from '../types/game';

/**
 * Global track bend trajectory based on distance traveled s and city location.
 * Each environment features its own bespoke road curvature:
 * - Soweto: energetic township rail yard curves with quick switches
 * - Durban: broad, gentle sweeping tropical coastal ocean S-curves
 * - Cape Town: winding mountain-pass curves around Table Mountain's massif
 * - Eastern Cape: dramatic canyon and rolling green hill switchbacks
 */
export function getTrackCenter(s: number, city?: SouthAfricanCity): number {
  if (city === 'durban') {
    // Gentle sweeping ocean beach curves
    return 18.0 * Math.sin(s * 0.0045) + 7.5 * Math.sin(s * 0.011 + 0.8);
  }
  if (city === 'capetown') {
    // Majestic winding mountain-pass curves
    return 15.0 * Math.sin(s * 0.006) + 9.0 * Math.cos(s * 0.016 + 1.1);
  }
  if (city === 'nelspruit') {
    return 12.0 * Math.sin(s * 0.005) + 5.0 * Math.sin(s * 0.018 + 0.6);
  }
  if (city === 'eastern_cape') {
    // Dramatic canyon switchbacks and steep hill curves
    return 13.0 * Math.sin(s * 0.008) + 8.5 * Math.sin(s * 0.024 + 1.2) + 4.5 * Math.sin(s * 0.05 + 2.0);
  }
  // Soweto / default: fast township rail-yard switches
  return (
    14.0 * Math.sin(s * 0.007) +
    8.0 * Math.sin(s * 0.015 + 1.0) +
    3.5 * Math.sin(s * 0.032 + 2.2)
  );
}

/**
 * First derivative of global track center with respect to distance s (d/ds).
 */
export function getTrackCenterDerivative(s: number, city?: SouthAfricanCity): number {
  if (city === 'durban') {
    return 18.0 * 0.0045 * Math.cos(s * 0.0045) + 7.5 * 0.011 * Math.cos(s * 0.011 + 0.8);
  }
  if (city === 'capetown') {
    return 15.0 * 0.006 * Math.cos(s * 0.006) - 9.0 * 0.016 * Math.sin(s * 0.016 + 1.1);
  }
  if (city === 'nelspruit') {
    return 12.0 * 0.005 * Math.cos(s * 0.005) + 5.0 * 0.018 * Math.cos(s * 0.018 + 0.6);
  }
  if (city === 'eastern_cape') {
    return 13.0 * 0.008 * Math.cos(s * 0.008) + 8.5 * 0.024 * Math.cos(s * 0.024 + 1.2) + 4.5 * 0.05 * Math.cos(s * 0.05 + 2.0);
  }
  return (
    14.0 * 0.007 * Math.cos(s * 0.007) +
    8.0 * 0.015 * Math.cos(s * 0.015 + 1.0) +
    3.5 * 0.032 * Math.cos(s * 0.032 + 2.2)
  );
}

/**
 * Returns the track curve lateral X displacement at relative coordinate z
 * given the player's current traveled distance D and city environment.
 * 
 * At z = 0 (player's feet):
 * displacement is ALWAYS 0 and its derivative d/dz is 0, ensuring that
 * the 3 lanes at the player's immediate position are completely stable
 * and aligned with standard lane coordinates.
 * 
 * For z < 0 (ahead into the distance):
 * displacement curves smoothly left and right, unrolling toward the player.
 */
export function getTrackCurveX(z: number, currentDistance: number, city?: SouthAfricanCity): number {
  const s = currentDistance - z;
  const s0 = currentDistance;
  return getTrackCenter(s, city) - getTrackCenter(s0, city) + getTrackCenterDerivative(s0, city) * z;
}

/**
 * Returns the tangent angle (in radians) of the track curve at relative coordinate z.
 * Angle 0 means pointing straight down the -Z axis.
 * Negative angle turns right (+X), positive angle turns left (-X).
 */
export function getTrackCurveAngle(z: number, currentDistance: number, city?: SouthAfricanCity): number {
  const s = currentDistance - z;
  const s0 = currentDistance;
  const dXdz = -getTrackCenterDerivative(s, city) + getTrackCenterDerivative(s0, city);
  return Math.atan(dXdz);
}


/**
 * Advances player vertical jump/gravity physics.
 */
export function updateVerticalPhysics(
  currentY: number,
  velocityY: number,
  dt: number,
  groundY: number = 0
): { y: number; vy: number; isGrounded: boolean } {
  let newVy = velocityY - GRAVITY * dt;
  let newY = currentY + newVy * dt;

  if (newY <= groundY) {
    newY = groundY;
    newVy = 0;
    return { y: newY, vy: 0, isGrounded: true };
  }

  return { y: newY, vy: newVy, isGrounded: false };
}

export interface BoundingBox3D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

/**
 * Standard 3D Axis-Aligned Bounding Box intersection.
 */
export function checkAABBIntersect(a: BoundingBox3D, b: BoundingBox3D): boolean {
  return (
    a.minX <= b.maxX &&
    a.maxX >= b.minX &&
    a.minY <= b.maxY &&
    a.maxY >= b.minY &&
    a.minZ <= b.maxZ &&
    a.maxZ >= b.minZ
  );
}

/**
 * Calculates current run score based on distance, coins collected, and multiplier.
 */
export function calculateRunScore(
  distance: number,
  coins: number,
  baseMultiplier: number,
  is2xActive: boolean
): number {
  const effMultiplier = is2xActive ? baseMultiplier * 2 : baseMultiplier;
  const distancePoints = Math.floor(distance * 1.5 * effMultiplier);
  const coinPoints = coins * 60;
  return distancePoints + coinPoints;
}

/**
 * Decrements active powerup timers by delta time.
 */
export function tickPowerupTimers(powerups: PowerupState, dt: number): PowerupState {
  return {
    sneakers: Math.max(0, powerups.sneakers - dt),
    magnet: Math.max(0, powerups.magnet - dt),
    jetpack: Math.max(0, powerups.jetpack - dt),
    multiplier: Math.max(0, powerups.multiplier - dt),
  };
}

/**
 * Evaluates player collision with a specific obstacle.
 * Returns:
 * - hit: true if collision occurs
 * - outcome: 'crash' (lethal), 'stumble' (warning), or 'roof_land' (safely on top of train)
 */
export function evaluateObstacleCollision(
  player: {
    x: number;
    y: number;
    z: number;
    isRolling: boolean;
    isJumping: boolean;
    vy: number;
  },
  obstacle: Obstacle
): { hit: boolean; outcome: 'none' | 'crash' | 'stumble' | 'roof_land'; landingY?: number } {
  // Player bounds:
  const playerRadius = 0.55;
  const playerHeight = player.isRolling ? 0.9 : 1.9;
  const playerBox: BoundingBox3D = {
    minX: player.x - playerRadius,
    maxX: player.x + playerRadius,
    minY: player.y,
    maxY: player.y + playerHeight,
    minZ: player.z - 0.45,
    maxZ: player.z + 0.45,
  };

  const obsBox: BoundingBox3D = {
    minX: getLaneX(obstacle.lane) - obstacle.width / 2,
    maxX: getLaneX(obstacle.lane) + obstacle.width / 2,
    minY: obstacle.y,
    maxY: obstacle.y + obstacle.height,
    minZ: obstacle.z - obstacle.depth / 2,
    maxZ: obstacle.z + obstacle.depth / 2,
  };

  // Handle Train
  if (obstacle.type === 'train') {
    const trainTopY = obstacle.y + obstacle.height;
    const xOverlap = playerBox.minX <= obsBox.maxX && playerBox.maxX >= obsBox.minX;
    const zOverlap = playerBox.minZ <= obsBox.maxZ && playerBox.maxZ >= obsBox.minZ;

    if (xOverlap && zOverlap) {
      // If player is on or landing onto the roof (within 0.5 units above or below train top)
      if (player.y >= trainTopY - 0.35 && player.y <= trainTopY + 1.2 && player.vy <= 0.5) {
        return { hit: true, outcome: 'roof_land', landingY: trainTopY };
      }
    }

    if (!checkAABBIntersect(playerBox, obsBox)) {
      return { hit: false, outcome: 'none' };
    }

    // Grazing side of train while switching lanes:
    const playerCenterX = player.x;
    const obsCenterX = getLaneX(obstacle.lane);
    const lateralDiff = Math.abs(playerCenterX - obsCenterX);
    if (lateralDiff > obstacle.width / 2 - 0.25) {
      return { hit: true, outcome: 'stumble' };
    }
    // Direct frontal collision with train
    return { hit: true, outcome: 'crash' };
  }

  if (!checkAABBIntersect(playerBox, obsBox)) {
    return { hit: false, outcome: 'none' };
  }

  // Handle Low Barrier (Jumpable)
  if (obstacle.type === 'barrier_low') {
    if (player.y > obstacle.height - 0.2) {
      // Cleared by jumping over
      return { hit: false, outcome: 'none' };
    }
    return { hit: true, outcome: 'crash' };
  }

  // Handle High Barrier (Slide under)
  if (obstacle.type === 'barrier_high') {
    const clearanceHeight = 1.25;
    // If rolling and under clearance:
    if (player.isRolling && player.y + playerHeight <= clearanceHeight + 0.1) {
      return { hit: false, outcome: 'none' };
    }
    return { hit: true, outcome: 'crash' };
  }

  // Ramp obstacle
  if (obstacle.type === 'ramp') {
    const progress = (obstacle.z + obstacle.depth / 2 - player.z) / obstacle.depth;
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const rampHeight = obstacle.height * clampedProgress;
    return { hit: true, outcome: 'roof_land', landingY: rampHeight };
  }

  return { hit: true, outcome: 'crash' };
}
