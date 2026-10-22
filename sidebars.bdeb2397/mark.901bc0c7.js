// The ouroboro mark, live: the Impossible infinity of the logos (../logos.4bc2a2d5, infinity-roll), its band rolling
// through the eight a quarter turn every 3.6 seconds as on the logos page, in grey rather than the swatch's orange. A mark
// (parts.bdeb2397.js mark()) shows its poster frame (fx/mark.901bc0c7.png, tools/mark-poster.901bc0c7.mjs) until the
// renderer has loaded, then rolls. One WebGL renderer draws the figure each frame for every mark on the page, so the
// sheet's eleven sidebars hold one context between them. Reduced motion keeps the poster, as the logos page keeps its
// still. The figure's three.js comes in by the page's import map ("three").
// `liveFigure` is that loop for any figure: the effort picker's Max infinity (tier.8e7c682e.js) rolls on one of its own.
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FIGURE = 'infinity-roll';
const SIZE = 96; // px drawn, as every fx icon: the mark is 19px at the creative's scale, so this stays sharp at 2x zoomed
// the clay's ramp (engine.4bc2a2d5.js PALETTE, keyed the same) in the sidebar's greys (tokens.bdeb2397.css)
export const GREY = { deep: '#48484a', base: '#8e8e93', light: '#d1d1d6', glow: '#8e8e93' };

// the logos page's figure, its clay recoloured: clayMaterial holds each PALETTE colour in a uniform named after its key
// (deep as uDeep), and its colour mode (engine.4bc2a2d5.js COLOURS) in uMode, so `mode` turns it into one of the
// rainbows, which then ignore the palette
export function clayFigure(FIGURES, palette, mode = 0) {
  const figure = FIGURES.find((f) => f.id === FIGURE).make();
  const { uniforms } = figure.object.material;
  for (const [key, hex] of Object.entries(palette)) uniforms[`u${key[0].toUpperCase()}${key.slice(1)}`].value.set(hex);
  uniforms.uMode.value = mode;
  return figure;
}
export const greyFigure = (FIGURES) => clayFigure(FIGURES, GREY);

// one renderer drawing `make(FIGURES, engine)` for every element added to it; if it cannot load, the posters stay
export function liveFigure(make) {
  const shown = new Set();
  let live = null, loading = null, frame = 0;

  function load() {
    loading ??= Promise.all([import('../logos.4bc2a2d5/figures.4bc2a2d5.js'), import('../logos.4bc2a2d5/engine.4bc2a2d5.js')])
      .then(([{ FIGURES }, engine]) => {
        const canvas = document.createElement('canvas');
        canvas.setAttribute('aria-hidden', 'true');
        live = { canvas, view: engine.mount(canvas, make(FIGURES, engine), { size: SIZE, pixelRatio: 1 }) };
        if (shown.size) frame = requestAnimationFrame(tick);
      })
      .catch((err) => console.error('superbot mark: the live logo did not load, so the poster stays', err));
  }

  // the loop runs on the page's clock from load, as the logos page's does, so the first frame is the poster's. The first
  // element shows the renderer's own canvas; only the others copy it, as reading a WebGL frame back stalls the GPU
  function tick(now) {
    live.view.renderAt(now / 1000);
    const [first, ...rest] = shown;
    first?.hold(live.canvas);
    for (const m of rest) m.copy(live.canvas);
    frame = shown.size ? requestAnimationFrame(tick) : 0;
  }

  return {
    add(el) {
      if (REDUCED) return;
      shown.add(el);
      if (!live) load();
      else if (!frame) frame = requestAnimationFrame(tick);
    },
    delete: (el) => shown.delete(el),
  };
}

// an element a live figure draws into: its poster until the first frame
export class FigureElement extends HTMLElement {
  // the first frame swaps the poster for a canvas, the same size in the same box: the renderer's own, moved here
  hold(source) {
    if (source.parentNode !== this) this.replaceChildren(source);
  }

  // or one of this element's, the figure copied in; it was drawn this frame, so the renderer's buffer still holds it
  copy(source) {
    if (!this.ctx) {
      const canvas = Object.assign(document.createElement('canvas'), { width: SIZE, height: SIZE });
      canvas.setAttribute('aria-hidden', 'true');
      this.ctx = canvas.getContext('2d');
    }
    if (this.ctx.canvas.parentNode !== this) this.replaceChildren(this.ctx.canvas);
    this.ctx.clearRect(0, 0, SIZE, SIZE);
    this.ctx.drawImage(source, 0, 0);
  }
}

const marks = liveFigure(greyFigure);
class SbMark extends FigureElement {
  connectedCallback() { marks.add(this); }
  disconnectedCallback() { marks.delete(this); }
}

customElements.get('sb-mark') ?? customElements.define('sb-mark', SbMark);
