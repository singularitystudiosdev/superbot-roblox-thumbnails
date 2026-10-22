// The takeover vignette wears the color of the chat's task, the same from the moment superbot takes the computer to
// the end of the loop: Roblox's logo blue in the live chat (it works on a Roblox game), and in every other chat the
// app its task is done in (screens.bdeb2397.js `app`). It never changes mid-run, whatever page or New Tab is on screen.

// each palette: the base, a lighter, a deeper and a lightest shade, the order the conic band runs through them
const PALETTES = {
  // the creative's own (style.af4c3c6b.css .cc-band, from computer.ba3976b6.css)
  superbot: ['#fd9e43', '#ffb769', '#f68a2c', '#ffc185'],
  // Roblox's logo blue, read off its favicon (img/fav/roblox.png, #335fff), with shades built the way the orange's are
  roblox: ['#335fff', '#6f8dff', '#2149e8', '#a3b6ff'],
  // the apps the other chats work in (screens.bdeb2397.js), each from its favicon (screens/fav), its shades 30% and 55%
  // toward white and 10% toward black; Gmail's four-color mark gives its red
  gmail: ['#ea4335', '#f07b72', '#d33c30', '#f6aaa4'],
  youtube: ['#ff0033', '#ff4d70', '#e6002e', '#ff8ca3'],
  calendar: ['#3274f7', '#709ef9', '#2d68de', '#a3c0fb'],
  flights: ['#12a0e6', '#59bdee', '#1090cf', '#94d4f4'],
  hotels: ['#4285f4', '#7baaf7', '#3b78dc', '#aac8fa'],
  craigslist: ['#8707d0', '#ab51de', '#7a06bb', '#c98fea'],
  vividseats: ['#be4294', '#d27bb4', '#ab3b85', '#e2aacf'],
  ubereats: ['#06c167', '#51d495', '#05ae5d', '#8fe3bb'],
  // the haircut chat's booking site (plays/haircut/fav-fresha.png), read the same way
  fresha: ['#5d42ea', '#8e7bf0', '#543bd3', '#b6aaf6'],
  // the Lisbon chat's train (plays/lisbon/fav-cp.png, Comboios de Portugal)
  cp: ['#388344', '#74a87c', '#32763d', '#a5c7ab'],
};
// an app's palette, superbot's orange for one without its own (screenview.bdeb2397.js tints a chat's screen with it)
export const paletteOf = (app) => PALETTES[app] ?? PALETTES.superbot;

// paints the vignette's four stops onto `edge` (a view's .cc-edge) once, in `app`'s colors, for the whole run
export function tintEdge(edge, app) {
  paletteOf(app).forEach((c, j) => edge.style.setProperty(`--tint-${j}`, c));
  edge.dataset.app = app;
}
