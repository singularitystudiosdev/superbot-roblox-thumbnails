// Lays the figures out (figures.4bc2a2d5.js), each in its group's section, and plays every loop on one clock. With reduced motion each shows its
// poster frame and plays only while the pointer is on it.
import { FIGURES } from './figures.4bc2a2d5.js';
import { mount } from './engine.4bc2a2d5.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const views = [];

for (const fig of FIGURES) {
  const item = document.createElement('li');
  item.className = 'lg-item';
  item.innerHTML = `<div class="lg-well"><canvas role="img" aria-label="${fig.name}, ${fig.loop.toLowerCase()}"></canvas></div>
    <h3 class="lg-name">${fig.name}</h3><p class="lg-loop">${fig.loop}</p>${fig.note ? `<p class="lg-note">${fig.note}</p>` : ''}
    <p class="lg-files">${['webm', 'gif', 'mp4'].map((ext) => `<a href="out/${fig.id}.${ext}" download>${ext === 'webm' ? 'WebM' : ext.toUpperCase()}</a>`).join('')}</p>`;
  document.querySelector(`.lg-grid[data-group="${fig.group ?? 'orange'}"]`).append(item);
  const canvas = item.querySelector('canvas');
  const view = mount(canvas, fig.make(), { size: canvas.clientWidth, pixelRatio: Math.min(2, devicePixelRatio) });
  const entry = { view, playing: !REDUCED, start: 0 };
  const still = () => view.renderAt((fig.poster ?? 0) * view.period);
  if (REDUCED) {
    still();
    item.addEventListener('pointerenter', () => { entry.playing = true; entry.start = performance.now(); });
    item.addEventListener('pointerleave', () => { entry.playing = false; still(); });
  }
  views.push(entry);
}

const tick = (now) => {
  for (const v of views) if (v.playing) v.view.renderAt((now - v.start) / 1000);
  requestAnimationFrame(tick);
};
requestAnimationFrame(tick);
