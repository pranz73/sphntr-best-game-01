import { CONFIG } from './config.js';
import defaultRandom from './random.js';

const { width: FIELD_WIDTH, height: FIELD_HEIGHT } = CONFIG.field;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distanceSquared = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

function emit(world, name) {
  world.events.push(name);
}

function addParticles(world, x, y, count, colors, speedMin, speedMax, lifeMin, lifeMax) {
  const room = Math.max(0, 180 - world.particles.length);
  for (let i = 0; i < Math.min(count, room); i++) {
    const angle = world.rng.range(0, Math.PI * 2);
    const speed = world.rng.range(speedMin, speedMax);
    world.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: world.rng.range(2, 5),
      color: world.rng.pick(colors),
      life: world.rng.range(lifeMin, lifeMax),
      maxLife: lifeMax,
      drag: world.rng.range(1.2, 2.8),
    });
  }
}

function spawnMote(world, x, y) {
  const margin = 48;
  const angle = world.rng.range(0, Math.PI * 2);
  const speed = world.rng.range(CONFIG.mote.driftSpeedMin, CONFIG.mote.driftSpeedMax);
  world.motes.push({
    x: x ?? world.rng.range(margin, FIELD_WIDTH - margin),
    y: y ?? world.rng.range(margin, FIELD_HEIGHT - margin),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: CONFIG.mote.radius,
    phase: world.rng.range(0, Math.PI * 2),
    sparkle: world.rng.range(0.65, 1.35),
    wobble: world.rng.range(0.8, 1.8),
  });
}

function spawnWisp(world) {
  const edge = world.rng.int(0, 3);
  const margin = CONFIG.wisp.radius + 4;
  const x = edge < 2
    ? (edge === 0 ? margin : FIELD_WIDTH - margin)
    : world.rng.range(margin, FIELD_WIDTH - margin);
  const y = edge >= 2
    ? (edge === 2 ? margin : FIELD_HEIGHT - margin)
    : world.rng.range(margin, FIELD_HEIGHT - margin);
  const angle = Math.atan2(world.player.y - y, world.player.x - x);
  world.wisps.push({
    x, y,
    vx: Math.cos(angle) * world.rng.range(CONFIG.wisp.speedMin, CONFIG.wisp.speedMax),
    vy: Math.sin(angle) * world.rng.range(CONFIG.wisp.speedMin, CONFIG.wisp.speedMax),
    speed: world.rng.range(CONFIG.wisp.speedMin, CONFIG.wisp.speedMax),
    angle,
    radius: CONFIG.wisp.radius,
    phase: world.rng.range(0, Math.PI * 2),
    wobble: world.rng.range(0.7, 1.7),
    turnRate: world.rng.range(1.2, 2.1),
  });
}

function makePlayer() {
  return {
    x: FIELD_WIDTH / 2,
    y: FIELD_HEIGHT / 2,
    vx: 0,
    vy: 0,
    radius: CONFIG.player.radius,
    facing: -Math.PI / 2,
    dashTime: 0,
    dashCooldown: 0,
    invulnerableTime: 0,
    trail: [],
  };
}

export function createWorld(rng = defaultRandom) {
  return {
    rng,
    player: makePlayer(),
    flame: 70,
    score: 0,
    combo: 0,
    bestCombo: 0,
    comboTimer: 0,
    motes: [],
    wisps: [],
    particles: [],
    floaters: [],
    elapsed: 0,
    moteSpawnTimer: 0,
    wispSpawnTimer: 0,
    wispInterval: CONFIG.wisp.spawnIntervalStart,
    shakeTime: 0,
    shakeMagnitude: 0,
    state: 'title',
    stats: { motesCollected: 0, hitsTaken: 0, timeSurvived: 0 },
    events: [],
  };
}

export function startRun(world) {
  world.player = makePlayer();
  world.flame = 70;
  world.score = 0;
  world.combo = 0;
  world.bestCombo = 0;
  world.comboTimer = 0;
  world.motes = [];
  world.wisps = [];
  world.particles = [];
  world.floaters = [];
  world.elapsed = 0;
  world.moteSpawnTimer = 0;
  world.wispSpawnTimer = CONFIG.wisp.spawnIntervalStart;
  world.wispInterval = CONFIG.wisp.spawnIntervalStart;
  world.shakeTime = 0;
  world.shakeMagnitude = 0;
  world.stats = { motesCollected: 0, hitsTaken: 0, timeSurvived: 0 };
  world.events.length = 0;
  for (let i = 0; i < 8; i++) spawnMote(world);
  world.state = 'playing';
  emit(world, 'start');
  return world;
}

export function updateWorld(world, input = {}, dt = 0) {
  if (world.state !== 'playing') return world;
  dt = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.05);

  const player = world.player;
  const mx = clamp(input.mx || 0, -1, 1);
  const my = clamp(input.my || 0, -1, 1);
  const inputLength = Math.hypot(mx, my);
  const dx = inputLength > 0 ? mx / inputLength : 0;
  const dy = inputLength > 0 ? my / inputLength : 0;
  if (inputLength > 0) player.facing = Math.atan2(dy, dx);

  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.dashTime = Math.max(0, player.dashTime - dt);
  player.invulnerableTime = Math.max(0, player.invulnerableTime - dt);
  if (input.dash && inputLength > 0 && player.dashCooldown <= 0) {
    player.vx = dx * CONFIG.player.dashSpeed;
    player.vy = dy * CONFIG.player.dashSpeed;
    player.dashTime = CONFIG.player.dashDuration;
    player.dashCooldown = CONFIG.player.dashCooldown;
    player.invulnerableTime = CONFIG.player.dashDuration + 0.12;
    addParticles(world, player.x, player.y, 10, [CONFIG.palette.playerTeal, CONFIG.palette.brightGold], 35, 150, 0.2, 0.42);
    emit(world, 'dash');
  }

  const maxSpeed = player.dashTime > 0 ? CONFIG.player.dashSpeed : CONFIG.player.baseSpeed;
  const acceleration = inputLength > 0 ? 1500 : 1050;
  player.vx += (dx * (inputLength > 0 ? maxSpeed : 0) - player.vx) * Math.min(1, acceleration * dt / Math.max(maxSpeed, 1));
  player.vy += (dy * (inputLength > 0 ? maxSpeed : 0) - player.vy) * Math.min(1, acceleration * dt / Math.max(maxSpeed, 1));
  const speed = Math.hypot(player.vx, player.vy);
  if (speed > maxSpeed && player.dashTime <= 0) {
    player.vx = player.vx / speed * maxSpeed;
    player.vy = player.vy / speed * maxSpeed;
  }
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  const edge = player.radius;
  if (player.x < edge || player.x > FIELD_WIDTH - edge) player.vx *= -0.22;
  if (player.y < edge || player.y > FIELD_HEIGHT - edge) player.vy *= -0.22;
  player.x = clamp(player.x, edge, FIELD_WIDTH - edge);
  player.y = clamp(player.y, edge, FIELD_HEIGHT - edge);
  player.trail.unshift({ x: player.x, y: player.y, life: 0.24 });
  if (player.trail.length > 7) player.trail.length = 7;
  for (const point of player.trail) point.life -= dt;
  player.trail = player.trail.filter((point) => point.life > 0);

  world.elapsed += dt;
  world.stats.timeSurvived = world.elapsed;
  world.flame = Math.max(0, world.flame - CONFIG.flame.decayPerSecond * dt);
  world.comboTimer = Math.max(0, world.comboTimer - dt);
  if (world.comboTimer <= 0) world.combo = 0;
  world.moteSpawnTimer -= dt;
  if (world.moteSpawnTimer <= 0 && world.motes.length < CONFIG.mote.cap) {
    spawnMote(world);
    world.moteSpawnTimer = CONFIG.mote.spawnInterval;
  }
  world.wispInterval = Math.max(
    CONFIG.wisp.spawnIntervalMinimum,
    CONFIG.wisp.spawnIntervalStart - world.elapsed * CONFIG.wisp.spawnIntervalShrinkPerSecond,
  );
  world.wispSpawnTimer -= dt;
  if (world.wispSpawnTimer <= 0 && world.wisps.length < CONFIG.wisp.cap) {
    spawnWisp(world);
    world.wispSpawnTimer = world.wispInterval;
  }

  for (const mote of world.motes) {
    mote.phase += dt * mote.wobble;
    mote.x += (mote.vx + Math.sin(mote.phase) * 9) * dt;
    mote.y += (mote.vy + Math.cos(mote.phase * 0.8) * 9) * dt;
    const margin = mote.radius + 10;
    if (mote.x < margin || mote.x > FIELD_WIDTH - margin) mote.vx *= -1;
    if (mote.y < margin || mote.y > FIELD_HEIGHT - margin) mote.vy *= -1;
    mote.x = clamp(mote.x, margin, FIELD_WIDTH - margin);
    mote.y = clamp(mote.y, margin, FIELD_HEIGHT - margin);
  }

  for (let i = world.motes.length - 1; i >= 0; i--) {
    const mote = world.motes[i];
    if (distanceSquared(player, mote) > (player.radius + mote.radius) ** 2) continue;
    world.motes.splice(i, 1);
    world.combo = world.comboTimer > 0 ? world.combo + 1 : 1;
    world.bestCombo = Math.max(world.bestCombo, world.combo);
    world.comboTimer = CONFIG.scoring.comboWindowSeconds;
    const points = Math.round(CONFIG.scoring.pointsPerMote * (1 + Math.min(world.combo, 40) * 0.1));
    world.score += points;
    world.flame = Math.min(CONFIG.flame.maximum, world.flame + CONFIG.flame.gainedPerMote);
    world.stats.motesCollected++;
    world.floaters.push({ x: mote.x, y: mote.y - 8, text: `+${points}`, life: 0.9, maxLife: 0.9 });
    addParticles(world, mote.x, mote.y, CONFIG.particles.pickupBurstCount, [CONFIG.palette.emberGold, CONFIG.palette.brightGold], 35, 150, 0.25, 0.6);
    emit(world, 'pickup');
  }

  for (const wisp of world.wisps) {
    wisp.phase += dt * wisp.wobble;
    const targetAngle = Math.atan2(player.y - wisp.y, player.x - wisp.x);
    let turn = Math.atan2(Math.sin(targetAngle - wisp.angle), Math.cos(targetAngle - wisp.angle));
    turn = clamp(turn, -wisp.turnRate * dt, wisp.turnRate * dt);
    wisp.angle += turn;
    const targetVx = Math.cos(wisp.angle) * wisp.speed + Math.sin(wisp.phase) * 13;
    const targetVy = Math.sin(wisp.angle) * wisp.speed + Math.cos(wisp.phase * 0.9) * 13;
    wisp.vx += (targetVx - wisp.vx) * Math.min(1, 2.5 * dt);
    wisp.vy += (targetVy - wisp.vy) * Math.min(1, 2.5 * dt);
    wisp.x = clamp(wisp.x + wisp.vx * dt, wisp.radius, FIELD_WIDTH - wisp.radius);
    wisp.y = clamp(wisp.y + wisp.vy * dt, wisp.radius, FIELD_HEIGHT - wisp.radius);
  }

  if (player.invulnerableTime <= 0) {
    for (let i = world.wisps.length - 1; i >= 0; i--) {
      const wisp = world.wisps[i];
      if (distanceSquared(player, wisp) > (player.radius + wisp.radius) ** 2) continue;
      world.wisps.splice(i, 1);
      world.flame = Math.max(0, world.flame - CONFIG.flame.lostPerWispHit);
      world.combo = 0;
      world.comboTimer = 0;
      world.stats.hitsTaken++;
      player.invulnerableTime = 1;
      world.shakeTime = 0.28;
      world.shakeMagnitude = 10;
      addParticles(world, wisp.x, wisp.y, CONFIG.particles.hitBurstCount, [CONFIG.palette.wispViolet, CONFIG.palette.wispEyeRed, CONFIG.palette.emberGold], 45, 210, 0.3, 0.75);
      emit(world, 'hit');
      break;
    }
  }

  for (let i = world.particles.length - 1; i >= 0; i--) {
    const particle = world.particles[i];
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    const damping = Math.max(0, 1 - particle.drag * dt);
    particle.vx *= damping;
    particle.vy *= damping;
    if (particle.life <= 0) world.particles.splice(i, 1);
  }
  for (let i = world.floaters.length - 1; i >= 0; i--) {
    const floater = world.floaters[i];
    floater.life -= dt;
    floater.y -= 34 * dt;
    if (floater.life <= 0) world.floaters.splice(i, 1);
  }
  world.shakeTime = Math.max(0, world.shakeTime - dt);

  if (world.flame <= 0) {
    world.state = 'over';
    world.stats.timeSurvived = world.elapsed;
    addParticles(world, player.x, player.y, 36, [CONFIG.palette.emberGold, CONFIG.palette.brightGold, CONFIG.palette.wispEyeRed], 45, 250, 0.45, 1.1);
    emit(world, 'out');
  }
  return world;
}
