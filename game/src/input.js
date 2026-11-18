import { CONFIG } from './config.js';

const W = CONFIG.field.width;
const H = CONFIG.field.height;

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let pointer = { x: W / 2, y: H / 2, down: false };
  let pointerDashEdge = false;
  let pointerConfirmEdge = false;
  let pointerRestartEdge = false;

  const onKeyDown = (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (!held.has(key)) pressed.add(key);
    held.add(key);
  };
  const onKeyUp = (event) => held.delete(event.key.toLowerCase());
  const onBlur = () => { held.clear(); pointer.down = false; };
  const updatePointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width && rect.height) {
      pointer.x = (event.clientX - rect.left) / rect.width * W;
      pointer.y = (event.clientY - rect.top) / rect.height * H;
    }
  };
  const onPointerMove = (event) => updatePointer(event);
  const onPointerDown = (event) => {
    updatePointer(event);
    if (event.button !== 0) return;
    pointer.down = true;
    pointerDashEdge = pointerConfirmEdge = pointerRestartEdge = true;
    canvas.setPointerCapture?.(event.pointerId);
  };
  const onPointerUp = (event) => {
    updatePointer(event);
    if (event.button === 0) pointer.down = false;
  };
  const onPointerCancel = () => { pointer.down = false; };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);

  return {
    axes() {
      const mx = Number(held.has('d') || held.has('arrowright')) - Number(held.has('a') || held.has('arrowleft'));
      const my = Number(held.has('s') || held.has('arrowdown')) - Number(held.has('w') || held.has('arrowup'));
      const length = Math.hypot(mx, my);
      return length > 1 ? { mx: mx / length, my: my / length } : { mx, my };
    },
    pointer,
    consumeDash() {
      const result = pressed.has(' ') || pointerDashEdge;
      pressed.delete(' '); pointerDashEdge = false;
      return result;
    },
    consumeConfirm() {
      const result = pressed.has('enter') || pointerConfirmEdge;
      pressed.delete('enter'); pointerConfirmEdge = false;
      return result;
    },
    consumeRestart() {
      const result = pressed.has('r') || pointerRestartEdge;
      pressed.delete('r'); pointerRestartEdge = false;
      return result;
    },
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      held.clear(); pressed.clear();
    },
  };
}
