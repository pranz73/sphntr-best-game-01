// All gameplay tuning lives here so the feel can be adjusted without hunting
// through update and rendering code.
export const CONFIG = {
  // The simulation and drawing use this fixed landscape play field; the canvas
  // can scale it to fit the player's viewport.
  field: {
    width: 1280,
    height: 720,
  },

  // Ember movement and the short burst used to escape or reach a distant mote.
  player: {
    radius: 15,
    baseSpeed: 265,
    dashSpeed: 760,
    dashDuration: 0.16,
    dashCooldown: 1.05,
  },

  // The lantern slowly fades; motes replenish it, while wisps tear away a chunk.
  flame: {
    maximum: 100,
    decayPerSecond: 3.15,
    gainedPerMote: 14,
    lostPerWispHit: 22,
  },

  // Light motes wander through the garden and provide the main score source.
  mote: {
    radius: 8,
    driftSpeedMin: 12,
    driftSpeedMax: 42,
    spawnInterval: 0.82,
    cap: 24,
  },

  // More wisps arrive as the run continues, tightening the survival pressure.
  wisp: {
    radius: 24,
    speedMin: 48,
    speedMax: 88,
    spawnIntervalStart: 3.4,
    spawnIntervalMinimum: 0.72,
    spawnIntervalShrinkPerSecond: 0.025,
    cap: 18,
  },

  // A mote collected within this window extends the combo multiplier.
  scoring: {
    comboWindowSeconds: 3.2,
    pointsPerMote: 100,
  },

  // Visual burst sizes for a mote pickup and a damaging wisp collision.
  particles: {
    pickupBurstCount: 14,
    hitBurstCount: 22,
  },

  // Shared colors for the night garden and its lantern-lit inhabitants.
  palette: {
    background: '#0b1026',
    deepPanel: '#131a36',
    emberGold: '#ffb347',
    brightGold: '#ffd97a',
    playerTeal: '#4fe3c1',
    wispViolet: '#8a7cff',
    wispEyeRed: '#ff5a5a',
    textCream: '#f5ead6',
    mutedText: '#9aa3c7',
  },
};
