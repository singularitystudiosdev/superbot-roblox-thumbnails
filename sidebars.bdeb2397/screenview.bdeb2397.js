// An open chat's computer view: Chrome full screen on the creative's 1470x919 desktop, scaled whole into the panel, built
// from the live view's own markup and classes (screen.af4c3c6b.js buildScreen, style.af4c3c6b.css .cc-*) so the two read
// as one product. One tab, the app superbot is working in: its favicon and title, its address in the bar, and the page
// itself, a real capture of that app's UI (screens/, screens/CREDITS.txt). The takeover's vignette wears the app's color
// (tint.bdeb2397.js), its band turning as the live one does, and Stop floats over it.
import { asset } from './parts.bdeb2397.js';
import { paletteOf } from './tint.bdeb2397.js';

const DESK_W = 1470;
// the live view's own icons (screen.af4c3c6b.js IC)
const IC = {
  x: '<svg viewBox="0 0 16 16"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>',
  plus: '<svg viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"/></svg>',
  back: '<svg viewBox="0 0 16 16"><path d="M13 8H3M7 4L3 8l4 4"/></svg>',
  fwd: '<svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
  reload: '<svg viewBox="0 0 16 16"><path d="M13 8a5 5 0 1 1-1.5-3.5M13 3v3h-3"/></svg>',
  tune: '<svg viewBox="0 0 16 16"><path d="M3 5h5.5M12.5 5H13M3 11h.5M7.5 11H13"/><circle cx="10.5" cy="5" r="1.6"/><circle cx="5.5" cy="11" r="1.6"/></svg>',
  more: '<svg viewBox="0 0 16 16"><path d="M8 3.5h.01M8 8h.01M8 12.5h.01"/></svg>',
};
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// the frame (.cc-frame) for a chat's screen: { app, fav, title, host, path, img }
export function screenHTML(s) {
  const stops = paletteOf(s.app).map((c, j) => `--tint-${j}:${c}`).join(';');
  return `<div class="cc-frame cv-frame">
    <div class="cc-view cv-view">
      <div class="cc-desk">
        <div class="cc-win">
          <div class="cc-strip">
            <span class="cc-lights"><i></i><i></i><i></i></span>
            <span class="cc-tabs"><span class="cc-tab is-on" data-state="page"><i class="cc-tbg"></i><span class="cc-fav"><img src="${asset(s.fav)}" alt="" width="16" height="16"></span><span class="cc-tt">${esc(s.title)}</span><span class="cc-x">${IC.x}</span></span></span>
            <span class="cc-plus">${IC.plus}</span>
          </div>
          <div class="cc-bar">
            <span class="cc-ic">${IC.back}</span><span class="cc-ic cc-dim">${IC.fwd}</span><span class="cc-ic cc-reload">${IC.reload}</span>
            <span class="cc-omni"><span class="cc-url cc-u-url"><span class="cc-ic">${IC.tune}</span><span><span class="cc-host">${esc(s.host)}</span><span class="cc-path">${esc(s.path)}</span></span></span></span>
            <i class="cc-me"></i><span class="cc-ic">${IC.more}</span>
          </div>
          <div class="cc-pages"><img class="cc-page cv-page" src="${asset(s.img)}" width="1470" height="837" alt="${esc(s.alt)}"></div>
        </div>
      </div>
      <i class="cc-edge cv-edge" style="${stops}" data-app="${esc(s.app)}"><i class="cc-soft"><i class="cc-band"></i></i></i>
    </div>
    <span class="cc-stop"><i></i>Stop</span>
  </div>`;
}

// the desktop scaled to the view's width, as the live view's fit() does; again whenever the panel resizes
export function fitScreens(root) {
  const fit = () => {
    for (const view of root.querySelectorAll('.cv-view')) {
      const k = view.clientWidth / DESK_W;
      if (k > 0) view.querySelector('.cc-desk').style.transform = `scale(${k.toFixed(5)})`;
    }
  };
  new ResizeObserver(fit).observe(root);
  return fit;
}
