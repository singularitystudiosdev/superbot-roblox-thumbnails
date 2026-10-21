// The ten ways the sidebar lists the chats. One registry: every variant shares the envelope (shell.bdeb2397.js: the
// wordmark, the nav, the footer) and supplies only `body`, the scrolling middle, built from parts.bdeb2397.js.
import { CHATS, PROJECTS, STATUS, LIVE } from './chats.bdeb2397.js';
import { esc, fx, lu, row, list, section, projectsSection, statusDot, time, chatsIn } from './parts.bdeb2397.js';

const BUCKETS = ['Today', 'Yesterday', 'Earlier'];
const LANES = ['running', 'needs', 'scheduled', 'done'];
const rows = (chats, opts) => chats.map((c) => row(c, typeof opts === 'function' ? opts(c) : opts)).join('');
const thumbOf = (src) => `<img class="sb-thumb" src="${src}" alt="" width="56" height="32">`;
// a chat with no picture of its own gets its icon on a white tile of the thumbnail's size
const tileOf = (chat) => (chat.thumb ? thumbOf(chat.thumb) : `<span class="sb-thumb is-tile">${fx(chat.fx)}</span>`);
const pill = (chat) => `<span class="sb-pill">${chat.id === 'thumbs' ? fx('trophy', 'sb-ic sb-ic-pill') : lu('trendUp', 'sb-lu sb-lu-pill')}${esc(chat.metric)}</span>`;

export const VARIANTS = [
  {
    name: 'Icon list',
    idea: 'The Manus list as it is: a 3D icon and the title. A dot marks a chat that is still working (orange) or waiting on you (black).',
    body: () => projectsSection() + section('Chats', list(rows(CHATS))),
  },
  {
    name: 'Status icons',
    idea: 'The icon shows what the chat is doing (working, needs you, scheduled, done), and the time sits on the right.',
    body: () => projectsSection() + section('Chats', list(rows(CHATS, (c) => ({
      lead: `${fx(STATUS[c.status].fx)}<span class="sb-vh">${STATUS[c.status].label}</span>`,
      trail: time(c),
    })))),
  },
  {
    name: 'Two-line preview',
    idea: 'Each chat shows its latest line under the title, like a mail inbox, with the time on the right.',
    body: () => projectsSection() + section('Chats', list(rows(CHATS, (c) => ({
      cls: 'is-2', sub: esc(c.preview), trail: `<span class="sb-end">${time(c)}${statusDot(c)}</span>`,
    })))),
  },
  {
    name: 'Date buckets',
    idea: "The superbot desktop app's folds: Pinned, Today, Yesterday and Earlier, each with a count, and older chats folded away.",
    body: () => {
      const pinned = CHATS.filter((c) => c.pinned);
      const loose = CHATS.filter((c) => !c.pinned);
      return section('Pinned', list(rows(pinned)), { fold: true, count: pinned.length })
        + BUCKETS.map((b) => {
          const inB = loose.filter((c) => c.bucket === b);
          return section(b, list(rows(inB)), { fold: true, open: b !== 'Earlier', count: inB.length });
        }).join('')
        + projectsSection({ fold: true, open: false, count: PROJECTS.length, action: '' });
    },
  },
  {
    name: 'Status lanes',
    idea: 'Chats sorted by what they need: Working, Needs you, Scheduled, then Done folded away.',
    body: () => LANES.map((s) => {
      const inLane = CHATS.filter((c) => c.status === s);
      return section(STATUS[s].label, list(rows(inLane, (c) => ({ trail: time(c) }))), { fold: true, open: s !== 'done', count: inLane.length, icon: STATUS[s].fx });
    }).join('') + projectsSection({ fold: true, open: false, count: PROJECTS.length, action: '' }),
  },
  {
    name: 'Project tree',
    idea: 'Chats live inside their projects: ROB IT opens to its chats on a guide line, Next game stays folded.',
    body: () => {
      const newProject = `<li><a class="sb-row is-ghost" href="#new-project">${lu('folderPlus', 'sb-lu sb-lu-row')}<span class="sb-t"><span class="sb-title">New project</span></span></a></li>`;
      const tree = PROJECTS.map((p, i) => {
        const inP = chatsIn(p.id);
        const head = `<summary class="sb-row is-node">${lu('chevronDown', 'sb-lu sb-chev')}${fx(p.fx)}<span class="sb-t"><span class="sb-title">${esc(p.name)}</span></span><span class="sb-time">${inP.length}</span></summary>`;
        return `<li><details${i === 0 ? ' open' : ''}>${head}${list(rows(inP), 'sb-tree')}</details></li>`;
      }).join('');
      return section('Projects', list(newProject + tree));
    },
  },
  {
    name: 'Result thumbnails',
    idea: "Each chat leads with what it made last (a thumbnail, a frame), or its icon when it has no picture yet.",
    body: () => projectsSection() + section('Chats', list(rows(CHATS, (c) => ({
      cls: 'is-2 is-pic', lead: tileOf(c), sub: `${STATUS[c.status].label}, ${esc(c.time.toLowerCase() === 'now' ? 'now' : c.time)}`,
    })))),
  },
  {
    name: 'Scoreboard',
    idea: 'Chats with a number show it on the right, so you see results without opening anything. The best one gets the trophy.',
    body: () => projectsSection() + section('Chats', list(rows(CHATS, (c) => ({
      trail: c.metric ? pill(c) : statusDot(c) || time(c),
    })))),
  },
  {
    name: 'Pinned shelf',
    idea: 'Pinned chats become big icons on a shelf at the top, and everything else is a plain Recents list under it.',
    body: () => {
      const tiles = CHATS.filter((c) => c.pinned).map((c) => `<li><a class="sb-tile" href="#${c.id}"${c.active ? ' aria-current="page"' : ''}>${fx(c.fx, 'sb-ic sb-ic-tile')}<span class="sb-tile-t">${esc(c.title)}</span>${statusDot(c)}</a></li>`).join('');
      return section('Pinned', `<ul class="sb-tiles">${tiles}</ul>`) + projectsSection()
        + section('Recents', list(rows(CHATS.filter((c) => !c.pinned), (c) => ({ trail: time(c) }))));
    },
  },
  {
    name: 'Live card',
    idea: 'The open chat expands into a card with its current step, its last three iterations and the best result so far.',
    body: () => {
      const live = CHATS.find((c) => c.active);
      const strip = LIVE.strip.map((src) => thumbOf(src)).join('');
      const card = `<li><a class="sb-live" href="#${live.id}" aria-current="page">`
        + `<span class="sb-live-h">${fx(live.fx)}<span class="sb-title">${esc(live.title)}</span></span>`
        + `<span class="sb-live-s"><i class="sb-dot is-run" aria-hidden="true"></i>${STATUS.running.label}<span class="sb-live-step">${esc(LIVE.step)}</span></span>`
        + `<span class="sb-live-strip">${strip}</span>`
        + `<span class="sb-live-best">${fx('trophy')}${esc(LIVE.best)}</span></a></li>`;
      return projectsSection() + section('Chats', list(card + rows(CHATS.filter((c) => !c.active))));
    },
  },
];
