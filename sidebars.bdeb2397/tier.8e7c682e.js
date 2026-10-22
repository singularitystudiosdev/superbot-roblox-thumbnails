// The effort picker's tier, drawn as the ouroboro mark (the logos' Impossible infinity, mark.901bc0c7.js) in a ranked metal:
// Low in silver, Medium in gold, High in diamond, each a still poster (fx/tier-<id>.8e7c682e.png, drawn by
// tools/tier-posters.8e7c682e.mjs), and Max in the logos' Rainbow flow, a full rainbow running round the band as it rolls,
// live as the sidebar's mark is (its poster until the renderer has loaded, and under reduced motion).
// <sb-tier tier="high"> shows a tier; every composer's effort chip holds one (composer.854d0793.js).
import { clayFigure, liveFigure, FigureElement } from './mark.901bc0c7.js';

// the clay's ramp for each, from deep (turned from the light) to light (facing it); Max's rainbow sets its own
export const TIERS = {
  low: { clay: { deep: '#3f444b', base: '#a2a8b0', light: '#f8f9fb' } }, // silver: cool greys to a white sheen
  medium: { clay: { deep: '#8a560b', base: '#e2a82a', light: '#fff1bb' } }, // gold
  high: { clay: { deep: '#2b7cc2', base: '#93def9', light: '#ffffff' } }, // diamond: ice blue to white
  max: { rainbow: 'flow' }, // engine.4bc2a2d5.js COLOURS
};
const FALLBACK = 'high'; // store.854d0793.js's effort before one is picked

export const tierPoster = (id) => new URL(`./fx/tier-${id}.8e7c682e.png`, import.meta.url).href;
export const tierFigure = (FIGURES, { COLOURS }, id) => clayFigure(FIGURES, TIERS[id].clay ?? {}, TIERS[id].rainbow ? COLOURS.indexOf(TIERS[id].rainbow) : 0);

const rainbow = liveFigure((FIGURES, engine) => tierFigure(FIGURES, engine, 'max'));

class SbTier extends FigureElement {
  static observedAttributes = ['tier'];
  connectedCallback() { this.paint(); }
  disconnectedCallback() { rainbow.delete(this); }
  attributeChangedCallback() { if (this.isConnected) this.paint(); }

  // its poster; Max rolls over it from the next frame
  paint() {
    const id = Object.hasOwn(TIERS, this.getAttribute('tier')) ? this.getAttribute('tier') : FALLBACK;
    if (id === this.shown) return;
    this.shown = id;
    rainbow.delete(this);
    this.replaceChildren(Object.assign(document.createElement('img'), { src: tierPoster(id), alt: '', width: 96, height: 96, draggable: false }));
    if (id === 'max') rainbow.add(this);
  }
}

customElements.get('sb-tier') ?? customElements.define('sb-tier', SbTier);

export const tierHTML = (id, cls = '') => `<sb-tier class="${cls}" tier="${id}" aria-hidden="true"></sb-tier>`;
