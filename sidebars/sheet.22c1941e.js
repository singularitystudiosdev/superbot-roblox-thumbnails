// The contact sheet: every chat-list variant at one moment of the spot (?t=, 12s by default, after the prompt is sent;
// ?t=1 shows the list before it).
import { buildSchedule } from '../schedule.af4c3c6b.js';
import { el, esc } from '../lib.af4c3c6b.js';
import { VARIANTS, buildSidebar, paintSidebar } from './sidebar.22c1941e.js';

const S = buildSchedule();
const params = new URLSearchParams(location.search);
const t = params.has('t') ? Number(params.get('t')) : 12;
const sheet = document.querySelector('.sheet');

VARIANTS.forEach((v, i) => {
  const n = i + 1;
  const fig = el(`<figure class="sheet-item"><div class="sheet-frame"></div><figcaption><b>${n}. ${esc(v.name)}</b></figcaption></figure>`);
  sheet.append(fig);
  paintSidebar(buildSidebar(fig.querySelector('.sheet-frame'), n, '../'), S, t);
});
