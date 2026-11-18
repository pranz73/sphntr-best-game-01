import { CONFIG } from './config.js';
import { createWorld, startRun, updateWorld } from './world.js';
import { createRenderer } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.querySelector('#game');
const status = document.querySelector('#status') || document.querySelector('#game-status');

if (canvas) {
  canvas.width = CONFIG.field.width;
  canvas.height = CONFIG.field.height;
  let world = createWorld();
  const renderer = createRenderer(canvas);
  const input = createInput(canvas);
  const audio = createAudio();
  let lastFrame = 0;
  let lastStatusUpdate = 0;

  function updateStatus(now, force = false) {
    if (!status || (!force && now - lastStatusUpdate < 250)) return;
    lastStatusUpdate = now;
    if (world.state === 'over') {
      status.textContent = `The flame has gone out. Score ${world.score}. Best combo ${world.bestCombo}. Motes gathered ${world.stats.motesCollected}. Time survived ${Math.floor(world.stats.timeSurvived)} seconds.`;
    } else if (world.state === 'playing') {
      status.textContent = `Flame ${Math.ceil(world.flame)} percent. Score ${world.score}. Combo ${world.combo}.`;
    } else {
      status.textContent = 'Emberlight. Keep your lantern flame alive. Collect golden motes, dodge shadow wisps, and dash to escape.';
    }
  }

  function playEvents() {
    for (const event of world.events) {
      if (typeof event === 'string') audio.play(event);
      else if (event && typeof event.name === 'string') audio.play(event.name, event.opt || event.options || {});
    }
    world.events.length = 0;
  }

  const query = new URLSearchParams(location.search);
  if (query.has('shot')) {
    const parsedSeed = query.has('seed') ? Number(query.get('seed')) : 1;
    const seed = Number.isFinite(parsedSeed) ? parsedSeed : 1;
    world = applyShot(query.get('shot'), seed);
    renderer.draw(world, { time: 1.35 });
    updateStatus(performance.now(), true);
    window.__emberReady = true;
  } else {
    function frame(timestamp) {
      const dt = lastFrame === 0 ? 0 : Math.min(1 / 30, Math.max(0, (timestamp - lastFrame) / 1000));
      lastFrame = timestamp;
      const now = performance.now();

      if (world.state === 'title') {
        if (input.consumeConfirm()) {
          startRun(world);
          input.consumeDash();
          input.consumeRestart();
          world.events.length = 0;
          audio.play('start');
          updateStatus(now, true);
        }
      } else if (world.state === 'playing') {
        let { mx, my } = input.axes();
        if (input.pointer.down) {
          const dx = input.pointer.x - world.player.x;
          const dy = input.pointer.y - world.player.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 18) { mx = dx / distance; my = dy / distance; }
          else { mx = 0; my = 0; }
        }
        updateWorld(world, { mx, my, dash: input.consumeDash() }, dt);
        // Discard transition-only edges so a click or key press cannot be replayed later.
        input.consumeConfirm();
        input.consumeRestart();
        playEvents();
        if (world.state === 'over') {
          world.best = Math.max(world.best || 0, world.score);
          updateStatus(now, true);
        }
      } else if (world.state === 'over' && input.consumeRestart()) {
        startRun(world);
        input.consumeConfirm();
        input.consumeDash();
        world.events.length = 0;
        audio.play('start');
        updateStatus(now, true);
      }

      renderer.draw(world, { time: timestamp / 1000 });
      updateStatus(now);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
}
