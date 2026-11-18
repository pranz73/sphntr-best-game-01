import { CONFIG } from './config.js';
import { createRandom } from './random.js';

const { width: W, height: H } = CONFIG.field;
const P = CONFIG.palette;
const TITLE_FONT = 'Georgia, "Times New Roman", serif';
const UI_FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function formatTime(seconds) {
  const total = Math.floor(seconds || 0);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const rng = createRandom(7);
  const stars = Array.from({ length: 92 }, () => ({
    x: rng.range(0, W), y: rng.range(0, H), r: rng.range(0.45, 1.8),
    phase: rng.range(0, Math.PI * 2), speed: rng.range(0.35, 1.4),
    color: rng.chance(0.32) ? '#ffd9a0' : '#9eafff', alpha: rng.range(0.13, 0.48),
  }));
  const nebulae = [
    { x: 210, y: 190, r: 250, color: 'rgba(79, 53, 143, 0.075)' },
    { x: 1050, y: 530, r: 300, color: 'rgba(24, 126, 125, 0.055)' },
    { x: 780, y: 150, r: 190, color: 'rgba(112, 59, 132, 0.045)' },
  ];

  function drawBackground(time) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0b1026');
    bg.addColorStop(1, '#171b3b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    for (const cloud of nebulae) {
      const glow = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.r);
      glow.addColorStop(0, cloud.color);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(cloud.x - cloud.r, cloud.y - cloud.r, cloud.r * 2, cloud.r * 2);
    }
    for (const star of stars) {
      const twinkle = 0.58 + 0.42 * Math.sin(time * star.speed + star.phase);
      ctx.globalAlpha = star.alpha * twinkle;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r * (0.8 + twinkle * 0.25), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.24, W / 2, H / 2, W * 0.7);
    vignette.addColorStop(0, 'rgba(2, 4, 16, 0)');
    vignette.addColorStop(1, 'rgba(2, 4, 16, 0.66)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  function drawMotes(motes, time) {
    for (const mote of motes) {
      const pulse = 1 + Math.sin(time * 3 + mote.phase) * 0.12;
      const radius = mote.radius * pulse;
      const glow = ctx.createRadialGradient(mote.x, mote.y, 0, mote.x, mote.y, radius * 4.6);
      glow.addColorStop(0, 'rgba(255, 217, 122, 0.7)');
      glow.addColorStop(0.3, 'rgba(255, 179, 71, 0.24)');
      glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(mote.x, mote.y, radius * 4.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.emberGold;
      ctx.beginPath(); ctx.arc(mote.x, mote.y, radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff6d5';
      ctx.beginPath(); ctx.arc(mote.x - radius * 0.22, mote.y - radius * 0.25, radius * 0.37, 0, Math.PI * 2); ctx.fill();
      if (mote.sparkle > 1.05) {
        ctx.strokeStyle = 'rgba(255, 239, 190, 0.82)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(mote.x - radius * 2.1, mote.y); ctx.lineTo(mote.x + radius * 2.1, mote.y);
        ctx.moveTo(mote.x, mote.y - radius * 2.1); ctx.lineTo(mote.x, mote.y + radius * 2.1); ctx.stroke();
      }
    }
  }

  function drawWisps(wisps, time) {
    for (const wisp of wisps) {
      const angle = Math.atan2(wisp.vy, wisp.vx);
      const flap = Math.sin(time * 8 + wisp.phase) * 0.27;
      ctx.save(); ctx.translate(wisp.x, wisp.y); ctx.rotate(angle);
      ctx.shadowColor = 'rgba(151, 130, 255, 0.82)'; ctx.shadowBlur = 38;
      ctx.fillStyle = 'rgba(13, 11, 34, 0.96)';
      ctx.beginPath(); ctx.ellipse(0, 0, wisp.radius * 0.66, wisp.radius * 0.48, 0, 0, Math.PI * 2); ctx.fill();
      for (const side of [-1, 1]) {
        ctx.save(); ctx.rotate(side * flap);
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.quadraticCurveTo(-wisp.radius * 0.7, -wisp.radius * 1.1, -wisp.radius * 1.45, -wisp.radius * 0.62);
        ctx.quadraticCurveTo(-wisp.radius * 1.2, wisp.radius * 0.1, -wisp.radius * 0.15, wisp.radius * 0.2);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(177, 158, 255, 0.82)'; ctx.lineWidth = 2.2;
        ctx.shadowColor = 'rgba(153, 132, 255, 0.95)'; ctx.shadowBlur = 14; ctx.stroke();
        ctx.restore();
      }
      ctx.shadowColor = P.wispEyeRed; ctx.shadowBlur = 10; ctx.fillStyle = P.wispEyeRed;
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.arc(wisp.radius * 0.25, side * wisp.radius * 0.19, Math.max(1.8, wisp.radius * 0.105), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawPlayer(world, time) {
    const player = world.player;
    const dashing = player.dashTime > 0;
    if (!dashing && player.invulnerableTime > 0 && Math.floor(time * 12.5) % 2 === 0) return;
    ctx.save();
    if (dashing) {
      ctx.translate(player.x, player.y);
      ctx.rotate(Math.atan2(player.vy, player.vx));
      ctx.translate(-player.x, -player.y);
    }
    for (let i = player.trail.length - 1; i >= 0; i--) {
      const point = player.trail[i];
      ctx.globalAlpha = Math.max(0, point.life / 0.24) * 0.26;
      ctx.fillStyle = P.playerTeal;
      ctx.beginPath(); ctx.arc(point.x, point.y, player.radius * (0.45 + point.life), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const haloRadius = 54 + (world.flame / CONFIG.flame.maximum) * 58;
    const halo = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, haloRadius);
    halo.addColorStop(0, 'rgba(255, 179, 71, 0.20)');
    halo.addColorStop(0.38, 'rgba(79, 227, 193, 0.10)');
    halo.addColorStop(1, 'rgba(79, 227, 193, 0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(player.x, player.y, haloRadius, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = P.playerTeal; ctx.shadowBlur = dashing ? 36 : 25;
    const core = ctx.createRadialGradient(player.x - 5, player.y - 6, 1, player.x, player.y, player.radius * 1.55);
    core.addColorStop(0, '#fff9df'); core.addColorStop(0.25, P.brightGold);
    core.addColorStop(0.58, P.emberGold); core.addColorStop(1, P.playerTeal);
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.ellipse(player.x, player.y, player.radius * (dashing ? 1.75 : 1), player.radius * (dashing ? 0.78 : 1), 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 13;
    const flicker = Math.sin(time * 20) * 3 + Math.sin(time * 13 + 2) * 2;
    ctx.fillStyle = P.brightGold;
    ctx.beginPath();
    ctx.moveTo(player.x - 6, player.y - player.radius * 0.55);
    ctx.quadraticCurveTo(player.x - 11, player.y - player.radius - 10 - flicker, player.x + 1, player.y - player.radius - 17 - flicker);
    ctx.quadraticCurveTo(player.x + 11, player.y - player.radius - 6, player.x + 5, player.y - player.radius * 0.45);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawParticles(world) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const particle of world.particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color; ctx.shadowColor = particle.color; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    for (const floater of world.floaters) {
      ctx.globalAlpha = Math.max(0, floater.life / floater.maxLife);
      ctx.fillStyle = P.brightGold; ctx.font = `700 19px ${UI_FONT}`; ctx.textAlign = 'center';
      ctx.shadowColor = P.emberGold; ctx.shadowBlur = 10; ctx.fillText(floater.text, floater.x, floater.y);
    }
    ctx.restore();
  }

  function drawHud(world, time) {
    const flameRatio = Math.max(0, Math.min(1, world.flame / CONFIG.flame.maximum));
    const pulse = 0.5 + Math.sin(time * 8) * 0.5;
    const x = 42, y = 34, width = 285, height = 58;
    ctx.save();
    roundedRect(ctx, x, y, width, height, 20);
    ctx.fillStyle = 'rgba(19, 26, 54, 0.94)'; ctx.fill();
    ctx.strokeStyle = flameRatio < 0.25 ? `rgba(255, 90, 90, ${0.55 + pulse * 0.4})` : 'rgba(154, 163, 199, 0.56)';
    ctx.lineWidth = 2; ctx.stroke();
    const bx = x + 55, by = y + 17, bw = 175, bh = 18;
    roundedRect(ctx, bx, by, bw, bh, 9); ctx.fillStyle = 'rgba(5, 8, 24, 0.88)'; ctx.fill();
    ctx.save(); roundedRect(ctx, bx, by, bw, bh, 9); ctx.clip();
    const fill = ctx.createLinearGradient(bx, by, bx + bw, by);
    fill.addColorStop(0, P.brightGold); fill.addColorStop(1, flameRatio < 0.25 ? P.wispEyeRed : P.emberGold);
    ctx.fillStyle = fill; ctx.fillRect(bx, by, bw * flameRatio, bh);
    ctx.restore();
    ctx.fillStyle = P.brightGold; ctx.shadowColor = P.emberGold; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(x + 29, y + 42); ctx.quadraticCurveTo(x + 13, y + 27, x + 29, y + 12);
    ctx.quadraticCurveTo(x + 46, y + 28, x + 29, y + 42); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = P.textCream; ctx.font = `700 15px ${UI_FONT}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.ceil(world.flame)}%`, x + width - 13, y + height / 2);

    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = P.textCream; ctx.font = `700 42px ${UI_FONT}`; ctx.fillText(String(world.score).padStart(6, '0'), W / 2, 22);
    ctx.fillStyle = P.mutedText; ctx.font = `600 11px ${UI_FONT}`; ctx.letterSpacing = '3px'; ctx.fillText('SCORE', W / 2, 67); ctx.letterSpacing = '0px';
    ctx.textAlign = 'right'; ctx.fillStyle = P.textCream; ctx.font = `600 22px ${UI_FONT}`; ctx.fillText(formatTime(world.elapsed), W - 44, 39);
    ctx.textAlign = 'left';
    if (world.combo >= 2) {
      ctx.fillStyle = P.brightGold; ctx.font = `700 16px ${UI_FONT}`;
      ctx.fillText(`COMBO x${world.combo}   ×${(1 + Math.min(world.combo, 40) * 0.1).toFixed(1)}`, x + 4, y + 72);
      ctx.fillStyle = 'rgba(255, 217, 122, 0.24)'; ctx.fillRect(x + 4, y + 96, 170, 3);
      ctx.fillStyle = P.emberGold; ctx.fillRect(x + 4, y + 96, 170 * Math.max(0, world.comboTimer / CONFIG.scoring.comboWindowSeconds), 3);
    }
    if (world.state === 'playing') {
      const ready = 1 - Math.min(1, world.player.dashCooldown / CONFIG.player.dashCooldown);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 11px ${UI_FONT}`;
      ctx.fillStyle = 'rgba(245, 234, 214, 0.62)'; ctx.fillText('DASH', W / 2, H - 39);
      roundedRect(ctx, W / 2 - 50, H - 28, 100, 5, 3); ctx.fillStyle = 'rgba(154, 163, 199, 0.25)'; ctx.fill();
      roundedRect(ctx, W / 2 - 50, H - 28, 100 * ready, 5, 3); ctx.fillStyle = P.playerTeal; ctx.fill();
    }
    ctx.restore();
  }

  function drawTitle(time) {
    ctx.fillStyle = 'rgba(4, 6, 20, 0.52)'; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, 315, 0, W / 2, 315, 350);
    glow.addColorStop(0, 'rgba(255, 179, 71, 0.18)'); glow.addColorStop(0.45, 'rgba(138, 124, 255, 0.07)');
    glow.addColorStop(1, 'rgba(11, 16, 38, 0)'); ctx.fillStyle = glow; ctx.fillRect(270, 40, 740, 590);
    const emberY = 142 + Math.sin(time * 2) * 6;
    ctx.save(); ctx.shadowColor = P.emberGold; ctx.shadowBlur = 35;
    const orb = ctx.createRadialGradient(W / 2 - 3, emberY - 4, 1, W / 2, emberY, 22);
    orb.addColorStop(0, '#fff8dc'); orb.addColorStop(0.4, P.brightGold); orb.addColorStop(1, P.playerTeal);
    ctx.fillStyle = orb; ctx.beginPath(); ctx.arc(W / 2, emberY, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = P.emberGold; ctx.beginPath(); ctx.moveTo(W / 2 - 5, emberY - 10);
    ctx.quadraticCurveTo(W / 2 - 8, emberY - 30 - Math.sin(time * 17) * 3, W / 2 + 2, emberY - 34);
    ctx.quadraticCurveTo(W / 2 + 11, emberY - 19, W / 2 + 5, emberY - 9); ctx.fill(); ctx.restore();
    const title = ctx.createLinearGradient(0, 183, 0, 250);
    title.addColorStop(0, '#fff1c1'); title.addColorStop(0.5, P.brightGold); title.addColorStop(1, P.emberGold);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 68px ${TITLE_FONT}`;
    ctx.shadowColor = 'rgba(255, 179, 71, 0.42)'; ctx.shadowBlur = 24; ctx.fillStyle = title;
    ctx.fillText('EMBERLIGHT', W / 2, 226); ctx.shadowBlur = 0;
    ctx.fillStyle = P.textCream; ctx.font = `italic 23px ${TITLE_FONT}`; ctx.fillText('Keep the flame alive.', W / 2, 282);
    ctx.fillStyle = 'rgba(245, 234, 214, 0.72)'; ctx.font = `500 17px ${UI_FONT}`;
    ctx.fillText('Move — WASD or arrow keys · steer with the mouse held down', W / 2, 378);
    ctx.fillText('Collect golden motes to feed the flame', W / 2, 414);
    ctx.fillText('Dash — Space or click · shadow wisps drain the flame', W / 2, 450);
    ctx.globalAlpha = Math.max(0.55, 0.58 + 0.42 * Math.sin(time * 3.4));
    ctx.fillStyle = P.brightGold; ctx.font = `700 17px ${UI_FONT}`;
    ctx.fillText('Press Enter or click to begin', W / 2, 536); ctx.globalAlpha = 1;
  }

  function drawGameOver(world, time) {
    ctx.fillStyle = 'rgba(3, 5, 18, 0.76)'; ctx.fillRect(0, 0, W, H);
    const panel = { x: 345, y: 125, w: 590, h: 470 };
    roundedRect(ctx, panel.x, panel.y, panel.w, panel.h, 26);
    ctx.fillStyle = 'rgba(19, 26, 54, 0.97)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255, 179, 71, 0.78)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = P.brightGold; ctx.font = `700 34px ${TITLE_FONT}`; ctx.fillText('The flame has gone out', W / 2, 190);
    ctx.fillStyle = P.mutedText; ctx.font = `500 12px ${UI_FONT}`; ctx.letterSpacing = '3px'; ctx.fillText('YOUR GARDEN REMEMBERS', W / 2, 229); ctx.letterSpacing = '0px';
    const rows = [
      ['Score', String(world.score)], ['Best combo', `x${world.bestCombo}`],
      ['Motes gathered', String(world.stats.motesCollected)], ['Time survived', formatTime(world.stats.timeSurvived)],
    ];
    ctx.font = `500 19px ${UI_FONT}`;
    rows.forEach(([label, value], i) => {
      const rowY = 286 + i * 48;
      ctx.textAlign = 'left'; ctx.fillStyle = P.mutedText; ctx.fillText(label, panel.x + 72, rowY);
      ctx.textAlign = 'right'; ctx.fillStyle = P.textCream; ctx.font = `700 20px ${UI_FONT}`; ctx.fillText(value, panel.x + panel.w - 72, rowY);
      ctx.font = `500 19px ${UI_FONT}`;
    });
    if (Number.isFinite(world.best)) {
      ctx.textAlign = 'center'; ctx.fillStyle = P.brightGold; ctx.font = `600 16px ${UI_FONT}`;
      ctx.fillText(`All-time best  ${world.best}`, W / 2, 484);
    }
    ctx.globalAlpha = Math.max(0.55, 0.58 + 0.42 * Math.sin(time * 3.2));
    ctx.textAlign = 'center'; ctx.fillStyle = P.brightGold; ctx.font = `700 17px ${UI_FONT}`;
    ctx.fillText('Press R or click to try again', W / 2, 543); ctx.globalAlpha = 1;
  }

  function draw(world, ui = {}) {
    if (!ctx) return;
    const time = ui.time || 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawBackground(time);
    ctx.save();
    if (world.shakeTime > 0) {
      const strength = world.shakeMagnitude * Math.min(1, world.shakeTime / 0.28);
      ctx.translate((Math.random() - 0.5) * strength, (Math.random() - 0.5) * strength);
    }
    drawMotes(world.motes, time);
    drawWisps(world.wisps, time);
    drawPlayer(world, time);
    drawParticles(world);
    ctx.restore();
    if (world.state === 'playing' || world.state === 'over') drawHud(world, time);
    if (world.state === 'title') drawTitle(time);
    else if (world.state === 'over') drawGameOver(world, time);
  }

  return { draw };
}
