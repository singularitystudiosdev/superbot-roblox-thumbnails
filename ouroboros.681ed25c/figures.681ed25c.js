// The ouroboros logos: the same dragon biting its tail (dragon.681ed25c.js) in the impossible logos' clay and colours
// (logos.4bc2a2d5), each with its own seamless loop. `poster` is the point in the loop (0 to 1) that stands for it still:
// the exported .png and the reduced-motion frame. `group` is its gallery section.
import { ouroborosFigure } from './dragon.681ed25c.js';

export const FIGURES = [
  { id: 'ouroboros-rainbow-cycle', group: 'rainbow', name: 'Rainbow tween', loop: 'The whole dragon tweens through the spectrum as it swallows its tail', make: () => ouroborosFigure({ period: 3.2, colour: 'cycle' }) },
  { id: 'ouroboros-rainbow-flow', group: 'rainbow', name: 'Rainbow flow', loop: 'A full rainbow runs down the body and into the jaws', make: () => ouroborosFigure({ period: 3.2, colour: 'flow' }) },
  { id: 'ouroboros-rainbow-stripes', group: 'rainbow', name: 'Rainbow stripes', loop: 'The spectrum wraps the body from back to belly', make: () => ouroborosFigure({ period: 3.2, colour: 'faces' }) },
  { id: 'ouroboros-rainbow-spin', group: 'rainbow', name: 'Rainbow spin', loop: 'The rainbow turns slowly round the centre, once every 32 seconds', make: () => ouroborosFigure({ period: 32, colour: 'spin', shifts: 20 }) },
  { id: 'ouroboros-rainbow-sweep', group: 'rainbow', name: 'Rainbow sweep', loop: 'Diagonal bands of colour slide across it', make: () => ouroborosFigure({ period: 3.2, colour: 'sweep' }) },
  { id: 'ouroboros-swallow', name: 'Ouroboros', loop: 'Swallows its tail forever, its spines running down into its jaws', make: () => ouroborosFigure({ period: 3.2 }) },
  { id: 'ouroboros-chomp', name: 'Chomp', loop: 'Bites down and pulls its tail in, one bite a loop', poster: 0.6, make: () => ouroborosFigure({ motion: 'chomp', period: 2.4 }) },
  { id: 'ouroboros-chase', name: 'Chase', loop: 'Slithers round after its own tail', make: () => ouroborosFigure({ motion: 'chase', period: 6.4 }) },
  { id: 'ouroboros-slither', name: 'Slither', loop: 'A wave runs down the body from the head', make: () => ouroborosFigure({ motion: 'slither', period: 3.2 }) },
  { id: 'ouroboros-gulp', name: 'Gulp', loop: 'A gulp runs from the throat round to the tail', poster: 0.3, make: () => ouroborosFigure({ motion: 'gulp', period: 3.2 }) },
  { id: 'ouroboros-light', name: 'Light', loop: 'A light runs down the body and back through the jaws', make: () => ouroborosFigure({ motion: 'band', period: 3.2 }) },
  { id: 'ouroboros-ripple', name: 'Ripple', loop: 'A ripple runs down the spines', make: () => ouroborosFigure({ motion: 'ripple', period: 2.4 }) },
  { id: 'ouroboros-turn', name: 'Turn', loop: 'Turns once about its axis, then rests', make: () => ouroborosFigure({ motion: 'turn', period: 4.8 }) },
  { id: 'ouroboros-build', name: 'Grow', loop: 'Grows round from the neck, bites its tail, holds, and draws back', poster: 0.6, make: () => ouroborosFigure({ motion: 'build', period: 4.8 }) },
];
