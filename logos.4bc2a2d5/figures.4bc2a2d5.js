// The logos: an impossible figure each, after the owner's references (the cube-built Penrose triangle, the tribar,
// the impossible ring, square and infinity), in the swatch's orange, each with its own seamless loop. `poster` is the
// point in the loop (0 to 1) that stands for it still: the exported .png and the reduced-motion frame. `note`: how close
// the AI platforms' own marks come to it (350 marks in LobeHub icons 2.1.0, compared side by side, 2026-10-21).
import { latticeFigure } from './lattice.4bc2a2d5.js';
import { sweepFigure } from './sweep.4bc2a2d5.js';

// a hexagon whose short and long sides alternate (2 and 5 cubes): it closes on screen three cubes nearer the eye. The
// walk starts on a long side, where its joint reads as an interlock rather than a notch
const HEXAGON = '5y 2Z 5x 2Y 5z 2X';

export const FIGURES = [
  // the untaken pentagon in the rainbow (`group`: the gallery section; the rest are the orange set)
  { id: 'pentagon-rainbow-cycle', group: 'rainbow', name: 'Rainbow tween', loop: 'The whole band tweens through the spectrum as it rolls', make: () => sweepFigure({ path: 'pentagon', half: 0.21, period: 3.2, colour: 'cycle' }) },
  { id: 'pentagon-rainbow-flow', group: 'rainbow', name: 'Rainbow flow', loop: 'A full rainbow runs round the band', make: () => sweepFigure({ path: 'pentagon', half: 0.21, period: 3.2, colour: 'flow' }) },
  { id: 'pentagon-rainbow-faces', group: 'rainbow', name: 'Rainbow faces', loop: 'Each side of the band its own colour, rolling with the twist', make: () => sweepFigure({ path: 'pentagon', half: 0.21, period: 3.2, colour: 'faces' }) },
  { id: 'pentagon-rainbow-spin', group: 'rainbow', name: 'Rainbow spin', loop: 'The rainbow turns slowly round the centre, once every 32 seconds', make: () => sweepFigure({ path: 'pentagon', half: 0.21, period: 32, colour: 'spin' }) }, // ten times the others' loop, as the owner asked
  { id: 'pentagon-rainbow-sweep', group: 'rainbow', name: 'Rainbow sweep', loop: 'Diagonal bands of colour slide across it', make: () => sweepFigure({ path: 'pentagon', half: 0.21, period: 3.2, colour: 'sweep' }) },
  // the one shape no AI platform's mark takes (350 AI brand marks checked, LobeHub icons 2.1.0, 2026-10-21)
  { id: 'pentagon-roll', name: 'Impossible pentagon', loop: 'The band rolls round the pentagon', note: 'No AI mark of the 350 checked uses a pentagon', make: () => sweepFigure({ path: 'pentagon', half: 0.21, period: 3.2 }) },
  { id: 'penrose-wave', name: 'Penrose cubes', loop: 'A wave runs round the cubes', make: () => latticeFigure({ path: '5y 5x 5z', style: 'cubes', motion: 'wave', period: 2.4 }) },
  { id: 'penrose-reveal', name: 'Penrose turn', loop: 'Turns once, comes apart, closes again', make: () => latticeFigure({ path: '4y 4x 4z', style: 'smooth', motion: 'reveal', period: 4.8 }) },
  { id: 'penrose-band', name: 'Penrose light', loop: 'A light runs round through the joint', make: () => latticeFigure({ path: '4y 4x 4z', style: 'smooth', motion: 'band', period: 2.8 }) },
  { id: 'hexagon-build', name: 'Hexagon build', loop: 'Cubes pop in, hold, and leave in order', poster: 0.6, make: () => latticeFigure({ path: HEXAGON, style: 'cubes', motion: 'build', period: 3.6 }) },
  { id: 'hexagon-band', name: 'Hexagon light', loop: 'A light runs round the hexagon', make: () => latticeFigure({ path: HEXAGON, style: 'smooth', motion: 'band', period: 3.2 }) },
  { id: 'bowtie-wave', name: 'Twin Penrose', loop: 'A wave runs through both triangles', make: () => latticeFigure({ path: '4y 4x 4z 4Y 4X 4Z', style: 'cubes', motion: 'wave', period: 3 }) },
  { id: 'ring-roll', name: 'Impossible ring', loop: 'The band rolls round the ring', note: 'Taken: GreenPT, Kling and Qingyan use rings', make: () => sweepFigure({ path: 'ring', half: 0.3, period: 3.2 }) },
  { id: 'triangle-roll', name: 'Rolling tribar', loop: 'The band rolls round the triangle', note: 'Nearest: Flux and Black Forest Labs, a sharp triangle outline', make: () => sweepFigure({ path: 'triangle', half: 0.21, period: 3.2 }) },
  { id: 'diamond-roll', name: 'Impossible diamond', loop: 'The band rolls round the diamond', note: 'Near: Gradio, CodeGeeX and fal', make: () => sweepFigure({ path: 'diamond', half: 0.21, period: 3.2 }) },
  { id: 'infinity-roll', name: 'Impossible infinity', loop: 'The band rolls through the eight', note: 'Taken: Meta, Langfuse, Lepton AI and MetaGPT', make: () => sweepFigure({ path: 'infinity', half: 0.17, period: 3.6 }) },
];
