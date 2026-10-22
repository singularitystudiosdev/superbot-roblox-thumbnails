// The profile photo's editor (settings.854d0793.js), as Discord's Edit Image: the picked photo under a circle, dragged
// to move it, zoomed by the slider, the wheel, a pinch or + and -, turned a quarter at a time; Apply crops what the
// circle holds to a square of the size asked for. A modal over Settings at its scale, as Billing's are
// (settings.854d0793.css .st-crop); Cancel, its ×, Escape or a press on its backdrop leave the photo as it was.
import { lu } from './parts.bdeb2397.js';

const MAX_ZOOM = 4;
const NUDGE = 8, NUDGE_FAR = 32; // layout px an arrow key moves the photo, and with Shift
const KEY_ZOOM = 1.1; // + and - zoom by this much a press
const WHEEL = 0.0015, PINCH_WHEEL = 0.01; // zoom per px of wheel: a mouse wheel, a trackpad pinch (it comes as ctrl+wheel)
const LINE = 16; // px a wheel line stands for (Firefox reports lines)

export const photoCropHTML = () => `<dialog class="st-modal st-crop" tabindex="-1" aria-labelledby="st-crop-h" aria-describedby="st-crop-d">
    <form class="st-modal-form" novalidate>
      <h3 class="st-modal-h" id="st-crop-h">Edit photo</h3>
      <button class="st-close sb-tool st-modal-x" type="button" aria-label="Close">${lu('x')}</button>
      <p class="st-hint st-modal-d" id="st-crop-d">Drag the photo to move it and zoom with the slider. What is inside the circle becomes your photo.</p>
      <div class="st-crop-stage" tabindex="0" role="group" aria-label="Photo position" aria-describedby="st-crop-keys">
        <img class="st-crop-img" alt="" draggable="false">
        <i class="st-crop-ring"></i>
      </div>
      <p class="st-vh" id="st-crop-keys">The arrow keys move the photo, plus and minus zoom it.</p>
      <div class="st-crop-bar">
        <div class="st-crop-slide">${lu('image', 'sb-lu st-crop-small')}<input class="st-crop-zoom" type="range" min="1" max="${MAX_ZOOM}" step="0.01" value="1" aria-label="Zoom">${lu('image', 'sb-lu st-crop-big')}</div>
        <button class="sb-tool st-crop-turn" type="button" aria-label="Rotate a quarter turn clockwise">${lu('rotateCwSquare')}</button>
      </div>
      <div class="st-actions"><button class="st-link st-crop-reset" type="button">Reset</button><button class="sb-btn-ghost st-cancel" type="button">Cancel</button><button class="sb-btn-primary" type="submit">Apply</button></div>
    </form>
  </dialog>`;

// `size`: the side in px of the square Apply makes. edit(file, opener) opens it on that file and settles with the
// cropped photo as a JPEG data URL, or null when it is closed without Apply, focus back on `opener`; it rejects when
// the file is not a picture
export function wirePhotoCrop(dlg, size) {
  const form = dlg.querySelector('form'), stage = dlg.querySelector('.st-crop-stage'), img = dlg.querySelector('.st-crop-img');
  const ring = dlg.querySelector('.st-crop-ring'), zoom = dlg.querySelector('.st-crop-zoom');
  // zoom, the photo's centre in layout px from the circle's, quarter turns clockwise, layout px per photo px at zoom 1
  const v = { z: 1, x: 0, y: 0, turn: 0, base: 1 };
  let url = '', result = null, settle = null, back = null;

  const px = (el) => parseFloat(getComputedStyle(el).width); // layout px, before Settings' scale
  const side = () => px(ring);
  const scale = () => stage.getBoundingClientRect().width / px(stage); // screen px per layout px
  const fromCentre = (x, y) => {
    const b = stage.getBoundingClientRect(), k = scale();
    return [(x - b.left - b.width / 2) / k, (y - b.top - b.height / 2) / k];
  };

  // the photo never leaves the circle uncovered: it moves only as far as its edge allows
  function paint() {
    const turned = v.turn % 2 === 1, s = v.base * v.z;
    const w = (turned ? img.naturalHeight : img.naturalWidth) * s, h = (turned ? img.naturalWidth : img.naturalHeight) * s;
    const mx = Math.max(0, (w - side()) / 2), my = Math.max(0, (h - side()) / 2);
    v.x = Math.min(mx, Math.max(-mx, v.x));
    v.y = Math.min(my, Math.max(-my, v.y));
    img.style.transform = `translate(${v.x.toFixed(2)}px, ${v.y.toFixed(2)}px) rotate(${v.turn * 90}deg) scale(${v.z.toFixed(4)})`;
    zoom.value = String(v.z);
    zoom.setAttribute('aria-valuetext', `${Math.round(v.z * 100)}%`);
  }
  // zoom to z, keeping the point (layout px from the circle's centre) under the pointer where it is
  function zoomTo(z, cx = 0, cy = 0) {
    const next = Math.min(MAX_ZOOM, Math.max(1, z)), r = next / v.z;
    v.x = cx - (cx - v.x) * r;
    v.y = cy - (cy - v.y) * r;
    v.z = next;
    paint();
  }
  function reset() { Object.assign(v, { z: 1, x: 0, y: 0, turn: 0 }); paint(); }

  // one pointer drags the photo, two pinch it around their midpoint
  const pointers = new Map();
  let spread = 0;
  const gap = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) spread = gap();
    stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    Object.assign(p, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) { const k = scale(); v.x += dx / k; v.y += dy / k; paint(); return; }
    const [a, b] = [...pointers.values()], next = gap();
    zoomTo(v.z * (next / spread), ...fromCentre((a.x + b.x) / 2, (a.y + b.y) / 2));
    spread = next;
  });
  const lift = (e) => {
    pointers.delete(e.pointerId);
    spread = pointers.size === 2 ? gap() : 0;
    if (!pointers.size) stage.classList.remove('is-dragging');
  };
  stage.addEventListener('pointerup', lift);
  stage.addEventListener('pointercancel', lift);
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const dy = e.deltaY * (e.deltaMode === 1 ? LINE : 1);
    zoomTo(v.z * Math.exp(-dy * (e.ctrlKey ? PINCH_WHEEL : WHEEL)), ...fromCentre(e.clientX, e.clientY));
  }, { passive: false });
  stage.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? NUDGE_FAR : NUDGE;
    const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (move) { v.x += move[0]; v.y += move[1]; paint(); }
    else if (e.key === '+' || e.key === '=') zoomTo(v.z * KEY_ZOOM);
    else if (e.key === '-' || e.key === '_') zoomTo(v.z / KEY_ZOOM);
    else return;
    e.preventDefault();
  });
  zoom.addEventListener('input', () => zoomTo(Number(zoom.value)));
  // a quarter turn about the circle's centre, so what is under the circle stays under it
  dlg.querySelector('.st-crop-turn').addEventListener('click', () => {
    Object.assign(v, { turn: (v.turn + 1) % 4, x: -v.y, y: v.x });
    paint();
  });
  dlg.querySelector('.st-crop-reset').addEventListener('click', reset);

  // Apply: the square the circle sits in, drawn as the photo is shown, at `size` px a side
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const canvas = Object.assign(document.createElement('canvas'), { width: size, height: size });
    const g = canvas.getContext('2d'), q = size / side(), s = v.base * v.z * q;
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    // a transparent PNG lands on the dialog's white rather than JPEG's black
    g.fillStyle = getComputedStyle(dlg).getPropertyValue('--surface');
    g.fillRect(0, 0, size, size);
    g.imageSmoothingQuality = 'high';
    g.translate(size / 2 + v.x * q, size / 2 + v.y * q);
    g.rotate((v.turn * Math.PI) / 2);
    g.drawImage(img, -w / 2, -h / 2, w, h);
    result = canvas.toDataURL('image/jpeg', 0.86);
    dlg.close();
  });
  const shut = () => dlg.close();
  dlg.querySelector('.st-modal-x').addEventListener('click', shut);
  dlg.querySelector('.st-cancel').addEventListener('click', shut);
  // a press that starts and ends on the backdrop closes it; a drag let go out there does not
  let downOnBackdrop = false;
  dlg.addEventListener('pointerdown', (e) => { downOnBackdrop = e.target === dlg; });
  dlg.addEventListener('click', (e) => { if (e.target === dlg && downOnBackdrop) shut(); });
  dlg.addEventListener('close', () => {
    URL.revokeObjectURL(url);
    img.removeAttribute('src');
    pointers.clear();
    stage.classList.remove('is-dragging');
    settle?.(result);
    settle = null;
    back?.focus();
  });

  async function edit(file, opener) {
    url = URL.createObjectURL(file);
    img.src = url;
    try {
      await img.decode();
    } catch (e) {
      URL.revokeObjectURL(url);
      img.removeAttribute('src');
      throw e;
    }
    back = opener;
    result = null;
    dlg.showModal();
    // laid out once open: at zoom 1 the photo's shorter side spans the circle
    v.base = side() / Math.min(img.naturalWidth, img.naturalHeight);
    const w = img.naturalWidth * v.base, h = img.naturalHeight * v.base;
    Object.assign(img.style, { width: `${w}px`, height: `${h}px`, marginLeft: `${-w / 2}px`, marginTop: `${-h / 2}px` });
    reset();
    // opened with nothing in it focused, as Billing's modals are: Tab reaches the photo first
    dlg.focus();
    return new Promise((resolve) => { settle = resolve; });
  }
  return { edit };
}
