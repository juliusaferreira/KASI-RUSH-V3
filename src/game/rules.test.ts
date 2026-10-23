import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getLaneX,
  clampLane,
  updateVerticalPhysics,
  checkAABBIntersect,
  calculateRunScore,
  tickPowerupTimers,
  evaluateObstacleCollision,
  getTrackCurveX,
  getTrackCurveAngle,
} from './rules';
import { LANE_WIDTH } from './constants';
import { Obstacle } from '../types/game';

test('track curvature stability at player position z = 0', () => {
  // Across various distances (0, 100, 500, 2500m), displacement and angle at z = 0 MUST be 0
  const testDistances = [0, 50, 100, 345.6, 1200, 5000];
  for (const dist of testDistances) {
    const curveX0 = getTrackCurveX(0, dist);
    const angle0 = getTrackCurveAngle(0, dist);
    assert.ok(Math.abs(curveX0) < 1e-9, `curveX at z=0 must be 0, got ${curveX0} at distance ${dist}`);
    assert.ok(Math.abs(angle0) < 1e-9, `angle at z=0 must be 0, got ${angle0} at distance ${dist}`);
  }
});

test('track curvature creates smooth bends ahead of player', () => {
  // At distance 100, looking ahead into z = -50 and z = -100
  const dist = 100;
  const xNear = getTrackCurveX(-30, dist);
  const xFar = getTrackCurveX(-100, dist);
  const angleFar = getTrackCurveAngle(-100, dist);

  // Values should be non-infinite, smooth, and within realistic railway corridor limits (under 30m)
  assert.ok(Number.isFinite(xNear));
  assert.ok(Number.isFinite(xFar));
  assert.ok(Math.abs(xNear) < 15, 'near bend displacement within bounds');
  assert.ok(Math.abs(xFar) < 30, 'far bend displacement within bounds');
});

test('track curvature stability and distinct curves across all 5 South African cities', () => {
  const cities: ('soweto' | 'durban' | 'capetown' | 'nelspruit' | 'eastern_cape')[] = [
    'soweto',
    'durban',
    'capetown',
    'nelspruit',
    'eastern_cape',
  ];

  // 1. Stability at z = 0 across all cities
  for (const city of cities) {
    for (const dist of [0, 50, 150, 800, 2400]) {
      const cx0 = getTrackCurveX(0, dist, city);
      const angle0 = getTrackCurveAngle(0, dist, city);
      assert.ok(Math.abs(cx0) < 1e-9, `${city} curve at z=0 must be 0, got ${cx0}`);
      assert.ok(Math.abs(angle0) < 1e-9, `${city} angle at z=0 must be 0, got ${angle0}`);
    }
  }

  // 2. Each city produces unique, distinct curve paths ahead
  const dist = 350;
  const zAhead = -60;
  const sowetoX = getTrackCurveX(zAhead, dist, 'soweto');
  const durbanX = getTrackCurveX(zAhead, dist, 'durban');
  const capeTownX = getTrackCurveX(zAhead, dist, 'capetown');
  const easternCapeX = getTrackCurveX(zAhead, dist, 'eastern_cape');

  // Verify that the curves are not identical copies
  assert.notEqual(sowetoX.toFixed(3), durbanX.toFixed(3), 'Soweto and Durban must have distinct curves');
  assert.notEqual(durbanX.toFixed(3), capeTownX.toFixed(3), 'Durban and Cape Town must have distinct curves');
  assert.notEqual(capeTownX.toFixed(3), easternCapeX.toFixed(3), 'Cape Town and Eastern Cape must have distinct curves');
});


test('lane calculations and clamping', () => {
  assert.equal(clampLane(-2), -1);
  assert.equal(clampLane(-1), -1);
  assert.equal(clampLane(0), 0);
  assert.equal(clampLane(1), 1);
  assert.equal(clampLane(5), 1);

  assert.equal(getLaneX(-1), -LANE_WIDTH);
  assert.equal(getLaneX(0), 0);
  assert.equal(getLaneX(1), LANE_WIDTH);
});

test('vertical physics jumps and lands at ground level', () => {
  let y = 0;
  let vy = 15;
  const dt = 0.05;

  // Jump upwards
  const step1 = updateVerticalPhysics(y, vy, dt, 0);
  assert.ok(step1.y > 0, 'player ascends after initial impulse');
  assert.ok(step1.vy < 15, 'gravity slows ascent');
  assert.equal(step1.isGrounded, false);

  // Fall downwards to ground
  const stepFall = updateVerticalPhysics(0.1, -10, dt, 0);
  assert.equal(stepFall.y, 0, 'lands flush on ground');
  assert.equal(stepFall.vy, 0, 'vertical speed zeroed on landing');
  assert.equal(stepFall.isGrounded, true);
});

test('3D AABB intersection', () => {
  const boxA = { minX: -1, maxX: 1, minY: 0, maxY: 2, minZ: -1, maxZ: 1 };
  const boxB = { minX: 0.5, maxX: 2, minY: 0.5, maxY: 1.5, minZ: 0, maxZ: 2 };
  const boxC = { minX: 5, maxX: 7, minY: 0, maxY: 2, minZ: -1, maxZ: 1 };

  assert.equal(checkAABBIntersect(boxA, boxB), true, 'overlapping boxes intersect');
  assert.equal(checkAABBIntersect(boxA, boxC), false, 'disjoint boxes do not intersect');
});

test('score calculation with distance, coins, and 2x multiplier', () => {
  const normalScore = calculateRunScore(100, 10, 10, false);
  // distance * 1.5 * 10 + 10 * 60 = 1500 + 600 = 2100
  assert.equal(normalScore, 2100);

  const doubledScore = calculateRunScore(100, 10, 10, true);
  // distance * 1.5 * 20 + 10 * 60 = 3000 + 600 = 3600
  assert.equal(doubledScore, 3600);
});

test('tickPowerupTimers decrements and clamps at zero', () => {
  const initial = { sneakers: 2.0, magnet: 0.5, jetpack: 0.0, multiplier: 5.0 };
  const ticked = tickPowerupTimers(initial, 1.0);

  assert.equal(ticked.sneakers, 1.0);
  assert.equal(ticked.magnet, 0.0);
  assert.equal(ticked.jetpack, 0.0);
  assert.equal(ticked.multiplier, 4.0);
});

test('low barrier jumping clears collision, while standing crashes', () => {
  const barrier: Obstacle = {
    id: 1,
    type: 'barrier_low',
    lane: 0,
    z: 10,
    y: 0,
    width: 2.0,
    height: 1.3,
    depth: 0.5,
  };

  // Player standing on ground at barrier location
  const standingPlayer = { x: 0, y: 0, z: 10, isRolling: false, isJumping: false, vy: 0 };
  const standingResult = evaluateObstacleCollision(standingPlayer, barrier);
  assert.equal(standingResult.hit, true);
  assert.equal(standingResult.outcome, 'crash');

  // Player jumping over the barrier (y = 1.8 > 1.3)
  const jumpingPlayer = { x: 0, y: 1.8, z: 10, isRolling: false, isJumping: true, vy: 2 };
  const jumpingResult = evaluateObstacleCollision(jumpingPlayer, barrier);
  assert.equal(jumpingResult.hit, false);
  assert.equal(jumpingResult.outcome, 'none');
});

test('high barrier rolling clears collision, while standing crashes', () => {
  const highBarrier: Obstacle = {
    id: 2,
    type: 'barrier_high',
    lane: 0,
    z: 20,
    y: 0,
    width: 2.2,
    height: 2.4,
    depth: 0.5,
  };

  // Player standing runs into high warning sign
  const standingPlayer = { x: 0, y: 0, z: 20, isRolling: false, isJumping: false, vy: 0 };
  const standingResult = evaluateObstacleCollision(standingPlayer, highBarrier);
  assert.equal(standingResult.hit, true);
  assert.equal(standingResult.outcome, 'crash');

  // Player sliding underneath
  const slidingPlayer = { x: 0, y: 0, z: 20, isRolling: true, isJumping: false, vy: 0 };
  const slidingResult = evaluateObstacleCollision(slidingPlayer, highBarrier);
  assert.equal(slidingResult.hit, false);
  assert.equal(slidingResult.outcome, 'none');
});

test('train roof landing lands player on top', () => {
  const train: Obstacle = {
    id: 3,
    type: 'train',
    lane: 0,
    z: 30,
    y: 0,
    width: 2.4,
    height: 3.6,
    depth: 25,
  };

  // Player jumping down onto the roof of the train
  const fallingPlayer = { x: 0, y: 3.7, z: 30, isRolling: false, isJumping: true, vy: -1.0 };
  const result = evaluateObstacleCollision(fallingPlayer, train);
  assert.equal(result.hit, true);
  assert.equal(result.outcome, 'roof_land');
  assert.equal(result.landingY, 3.6);
});
