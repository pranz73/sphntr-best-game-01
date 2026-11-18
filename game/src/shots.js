import { createRandom } from './random.js';
import { createWorld, startRun } from './world.js';

const points = [
  [176, 150], [354, 245], [510, 468], [682, 214],
  [842, 390], [1050, 176], [960, 578], [250, 560],
  [590, 590], [1120, 390],
];

function mote(rng, x, y) {
  const angle = rng.range(0, Math.PI * 2);
  const speed = rng.range(12, 42);
  return {
    x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    radius: 8, phase: rng.range(0, Math.PI * 2), sparkle: rng.range(0.65, 1.35),
    wobble: rng.range(0.8, 1.8),
  };
}

function wisp(rng, x, y, targetX, targetY) {
  const angle = Math.atan2(targetY - y, targetX - x);
  const speed = rng.range(48, 88);
  return {
    x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, speed,
    angle, radius: 19, phase: rng.range(0, Math.PI * 2), wobble: rng.range(0.7, 1.7),
    turnRate: rng.range(1.2, 2.1),
  };
}

function particle(rng, x, y, color, angle, speed, life) {
  return {
    x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    radius: rng.range(2, 5), color, life, maxLife: life,
    drag: rng.range(1.2, 2.8),
  };
}

export function applyShot(name, seed) {
  const rng = createRandom(seed);
  const world = createWorld(rng);
  if (name !== 'start' && name !== 'play' && name !== 'end') name = 'start';

  if (name === 'start') {
    world.motes = points.slice(0, 10).map(([x, y]) => mote(rng, x, y));
    return world;
  }

  startRun(world);
  if (name === 'play') {
    world.elapsed = 47;
    world.score = 1240;
    world.combo = 6;
    world.comboTimer = 1.6;
    world.bestCombo = 9;
    world.flame = 68;
    world.motes = points.slice(0, 10).map(([x, y]) => mote(rng, x, y));
    world.player.x = 430;
    world.player.y = 400;
    world.player.vx = 145;
    world.player.vy = -12;
    world.player.facing = Math.atan2(world.player.vy, world.player.vx);
    world.player.trail = [
      { x: 410, y: 402, life: 0.23 },
      { x: 391, y: 404, life: 0.15 },
      { x: 375, y: 405, life: 0.08 },
    ];
    world.wisps = [
      wisp(rng, 880, 250, world.player.x, world.player.y),
      wisp(rng, 730, 54, world.player.x, world.player.y),
      wisp(rng, 1180, 590, world.player.x, world.player.y),
    ];
    world.particles = Array.from({ length: 9 }, (_, i) => particle(
      rng, 560, 330, i % 2 ? '#ffd97a' : '#ffb347', rng.range(0, Math.PI * 2), rng.range(18, 90), rng.range(0.24, 0.55),
    ));
    world.floaters = [{ x: 560, y: 300, text: '+120', life: 0.72, maxLife: 0.9 }];
    world.events.length = 0;
    return world;
  }

  world.state = 'over';
  world.flame = 0;
  world.score = 3860;
  world.bestCombo = 14;
  world.elapsed = 96;
  world.stats = { motesCollected: 41, hitsTaken: 3, timeSurvived: 96 };
  world.best = 5120;
  world.player.x = 640;
  world.player.y = 380;
  world.motes = points.slice(1, 5).map(([x, y]) => mote(rng, x, y));
  world.wisps = [wisp(rng, 1060, 120, world.player.x, world.player.y)];
  world.particles = Array.from({ length: 26 }, (_, i) => particle(
    rng, 640, 380, i % 3 ? '#ffb347' : '#ffd97a', (i / 26) * Math.PI * 2, rng.range(35, 160), rng.range(0.25, 0.8),
  ));
  world.events.length = 0;
  return world;
}
