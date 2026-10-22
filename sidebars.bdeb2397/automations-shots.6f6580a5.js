// A card's thumbnail: a small preview of what that automation makes or does (its spec in
// automations-shot-specs.6f6580a5.js), drawn as markup over the card's tint. One template per kind of output: an A/B
// pair, a gallery, a chart, a list, a document, messages, notifications, a calendar, clips cut from a video, an edit
// timeline, one image in several sizes, a waveform, code with a review note, a board and a sheet. Decorative: the
// card's title and description already say it, so the preview is hidden from assistive tech.
import { APPS } from './apps.6f6580a5.js';
import { SHOTS } from './automations-shot-specs.6f6580a5.js';
import { esc } from './parts.bdeb2397.js';

const href = (path) => new URL(path, import.meta.url).href;
const rbx = (file) => href(`../rbx/assets/${file}`);
const iter = (n) => href(`../img/iter/iter-${n}.webp`);

// ROB IT's own images (../img/CREDITS.txt): its thumbnails, the AI iterations on them, its icon, badges and an avatar,
// and the icons of three other games Roblox showed beside it
const IMG = {
  vaultCrew: rbx('11c779beff20d2.webp'), vaultHeist: rbx('7d845c7485b985.webp'), vaultDial: rbx('d0624696be2811.webp'),
  sleepGuard: rbx('de34075a235bc0.webp'), diamondRope: rbx('31d0a6cdb1dac6.webp'), halloween: rbx('6a870bc1f466fa.webp'),
  cashGrab: rbx('841bdbf6b2bd6b.webp'), museum: rbx('cd3cce6d08bc20.webp'), diamondCash: rbx('ef155944d306ae.webp'),
  goldVault: rbx('a3def5f381990d.webp'),
  iter1: iter(1), iter2: iter(2), iter3: iter(3), iter4: iter(4), iter5: iter(5), iter6: iter(6),
  icon: rbx('f1b41460f53a3a.webp'), avatar: rbx('4a151415c6c9e5.webp'),
  badge1: rbx('a92792ef7ff8a1.webp'), badge5: rbx('3b277d9c70ea51.webp'), badge10: rbx('e5aea4db7da1c5.webp'),
  gDig: rbx('9433d58ca3aea9.webp'), gPrison: rbx('83f12cbdae7756.webp'), gChase: rbx('f8ab55fec0082a.webp'),
};
// Fluent 3D emoji: this page's set (./auto.6f6580a5), or the creative's own (../img/fx) for the ones it already has
const SHARED_FX = new Set(['trophy']);
const fxSrc = (name) => href(SHARED_FX.has(name) ? `../img/fx/${name}.png` : `./auto.6f6580a5/${name}.png`);

// lucide (https://lucide.dev, ISC)
const LU = {
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
};
const lu = (name, cls = 'sh-lu') => `<svg class="${cls}" viewBox="0 0 24 24">${LU[name]}</svg>`;

function src(key) {
  if (!IMG[key]) throw new Error(`no image "${key}" for an automation thumbnail`);
  return IMG[key];
}
const pic = (key, cls, style) => `<img class="${cls}" src="${src(key)}" alt="" draggable="false"${style ? ` style="${esc(style)}"` : ''}>`;
const emoji = (name, cls) => `<img class="${cls}" src="${fxSrc(name)}" alt="" draggable="false">`;

// an app's brand glyph on its brand color; a light brand (Unity's white, Mailchimp's yellow) takes an ink glyph
function isLight(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4;
}
export function logo(id, cls = '') {
  const app = APPS[id];
  if (!app) throw new Error(`no app "${id}"`);
  return `<span class="au-logo${isLight(app.hex) ? ' is-light' : ''}${cls ? ` ${cls}` : ''}" style="--brand:${app.hex}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="${app.path}"/></svg></span>`;
}

// who sent a message or a notification: an app's glyph, an image, an emoji, or an initial
function avatar(r) {
  if (r.app) return logo(r.app, 'sh-av');
  if (r.img) return pic(r.img, 'sh-av sh-av-img');
  if (r.fx) return emoji(r.fx, 'sh-av sh-av-fx');
  return `<span class="sh-av sh-init">${esc(r.init)}</span>`;
}

const win = (inner, { title, foot, cls = '' } = {}) => `<div class="sh-win ${cls}">${title ? `<p class="sh-title">${esc(title)}</p>` : ''}${inner}${foot ? `<p class="sh-foot">${esc(foot)}</p>` : ''}</div>`;
const tone = (t) => (t ? ` is-${t}` : '');

// a steady pseudo-random series per label, so a card's chart is the same on every render
function levels(seed, n, shape) {
  let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rnd = () => (h = (Math.imul(h, 1103515245) + 12345) >>> 0) / 2 ** 32;
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1), noise = rnd() - 0.5;
    if (shape === 'spike') return i === n - 3 ? 0.95 : 0.25 + noise * 0.12;
    if (shape === 'down') return (t < 0.72 ? 0.72 : 0.72 - (t - 0.72) * 2.2) + noise * 0.1;
    if (shape === 'wave') return 0.25 + rnd() * 0.75 * Math.sin(Math.PI * (0.15 + t * 0.7));
    return 0.18 + t * 0.62 + noise * 0.18;
  }).map((v) => Math.min(1, Math.max(0.05, v)));
}

const T = {
  pair(s) {
    const tile = (x, key) => `<figure class="sh-tile${s.win === key ? ' is-win' : ''}">${pic(x.img, 'sh-media', x.filter && `filter:${x.filter}`)}${s.win === key ? `<span class="sh-badge">${emoji('trophy', 'sh-fx')}Winner</span>` : ''}<figcaption>${x.title ? `<b>${esc(x.title)}</b>` : ''}${esc(x.label)}</figcaption></figure>`;
    return `<div class="sh-pair">${tile(s.a, 'a')}${s.win ? '' : lu('arrow', 'sh-lu sh-arrow')}${tile(s.b, 'b')}</div>`;
  },
  gallery(s) {
    // the tile keeps its shape; a frame's own move (a turn, a bounce, a palette) is the picture's alone
    const item = (x, i) => `<figure class="sh-gi${i === s.pick ? ' is-pick' : ''}"><span class="sh-gbox">${x.img ? pic(x.img, 'sh-media', x.style) : emoji(x.fx, 'sh-media sh-media-fx')}</span>${i === s.pick ? `<span class="sh-check">${lu('check')}</span>` : ''}${x.cap ? `<figcaption>${esc(x.cap)}</figcaption>` : ''}</figure>`;
    return `<div class="sh-gal is-${s.shape}">${s.items.map(item).join('')}</div>${s.label ? `<span class="sh-chip">${esc(s.label)}</span>` : ''}`;
  },
  chart(s) {
    const pts = levels(s.label, 14, s.trend);
    const xy = pts.map((v, i) => `${((i / (pts.length - 1)) * 100).toFixed(1)},${(40 - v * 36).toFixed(1)}`).join(' ');
    const plot = s.kind === 'bars'
      ? `<div class="sh-bars">${pts.map((v, i) => `<i${i === pts.length - 1 ? ' class="is-now"' : ''} style="height:${Math.round(v * 100)}%"></i>`).join('')}</div>`
      : `<svg class="sh-plot" viewBox="0 0 100 40" preserveAspectRatio="none"><polygon points="0,40 ${xy} 100,40"/><polyline points="${xy}"/></svg>`;
    return win(`<p class="sh-label">${esc(s.label)}</p><p class="sh-big">${esc(s.value)}</p><p class="sh-delta">${esc(s.delta)}</p>${plot}`, { cls: s.trend === 'up' ? 'is-ok' : 'is-bad' });
  },
  list(s) {
    const lead = (r) => {
      if (s.lead === 'check') return `<span class="sh-box">${r.done ? lu('check') : ''}</span>`;
      if (s.lead === 'file') return lu('file', 'sh-lu sh-lead sh-file');
      if (s.lead === 'app') return logo(s.app, 'sh-lead');
      if (s.lead === 'img') return pic(r.img, 'sh-lead sh-lead-img');
      if (s.lead === 'fx') return emoji(r.fx, 'sh-lead');
      return `<span class="sh-lead sh-init">${esc(r.init)}</span>`;
    };
    const row = (r) => `<li class="sh-row${r.done ? ' is-done' : ''}">${lead(r)}<span class="sh-t"><b>${esc(r.name)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span>${r.old ? `<s>${esc(r.old)}</s>` : ''}${r.value ? `<em class="sh-v${tone(r.tone)}">${esc(r.value)}</em>` : ''}</li>`;
    return win(`<ul class="sh-list">${s.rows.map(row).join('')}</ul>`, s);
  },
  doc(s) {
    const lines = (s.lines ?? []).map((l) => `<p class="sh-text">${esc(l)}</p>`).join('');
    const tags = s.tags ? `<p class="sh-tags">${s.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</p>` : '';
    return win(`${s.img ? pic(s.img, 'sh-banner') : ''}<p class="sh-h">${esc(s.title)}</p>${lines}${tags}${s.cta ? `<span class="sh-cta">${esc(s.cta)}</span>` : ''}`);
  },
  msg(s) {
    const row = (r) => `<li class="sh-msg${r.me ? ' is-me' : ''}${r.bad ? ' is-bad' : ''}">${avatar(r)}<span class="sh-bubble"><b>${esc(r.who)}${r.tag ? `<em class="sh-tag">${esc(r.tag)}</em>` : ''}</b><span>${esc(r.text)}</span>${r.img ? pic(r.img, 'sh-attach') : ''}</span></li>`;
    return win(`<ul class="sh-msgs">${s.rows.map(row).join('')}</ul>`);
  },
  alert(s) {
    return `<ul class="sh-alerts">${s.rows.map((r) => `<li class="sh-toast">${avatar(r)}<span class="sh-t"><b>${esc(r.title)}</b><small>${esc(r.text)}</small></span><time>${esc(r.time)}</time></li>`).join('')}</ul>`;
  },
  cal(s) {
    const day = (d, i) => `<div class="sh-day"><b>${esc(d)}</b>${s.ev.filter(([at]) => at === i).map(([, text]) => `<span class="sh-ev">${esc(text)}</span>`).join('')}</div>`;
    return win(`<div class="sh-cal">${s.days.map(day).join('')}</div>`, s);
  },
  clips(s) {
    const short = (x, i) => `<figure class="sh-short">${pic(s.img, 'sh-media', `object-position:${x}% 50%`)}${i === 0 ? `<figcaption>${esc(s.cap)}</figcaption>` : ''}</figure>`;
    return `<div class="sh-clips"><figure class="sh-long">${pic(s.img, 'sh-media')}<figcaption>12:48</figcaption></figure>${lu('arrow', 'sh-lu sh-arrow')}${[28, 72].map(short).join('')}</div>`;
  },
  timeline(s) {
    const clips = s.imgs.map((k, i) => `<span class="sh-clip" style="flex:${[3, 2, 4, 2][i % 4]}">${pic(k, 'sh-media')}</span>`).join('');
    const audio = levels(s.label, 40, 'wave').map((v) => `<i style="height:${Math.round(v * 100)}%"></i>`).join('');
    return win(`<div class="sh-tl"><div class="sh-track">${clips}</div><div class="sh-track sh-audio">${audio}</div><i class="sh-head"></i></div>`, { title: s.label });
  },
  sizes(s) {
    return `<div class="sh-sizes">${s.frames.map(([ratio, label]) => `<figure><span class="sh-frame" style="aspect-ratio:${ratio}">${pic(s.img, 'sh-media')}</span><figcaption>${esc(label)}</figcaption></figure>`).join('')}</div>`;
  },
  wave(s) {
    const lv = levels(s.title, 56, 'wave');
    const svg = (noisy) => `<svg class="sh-wave${noisy ? ' is-noisy' : ''}" viewBox="0 0 112 24" preserveAspectRatio="none">${lv.map((v, i) => { const h = Math.max(1, (noisy ? Math.max(v, 0.45) : v) * 22); return `<rect x="${i * 2}" y="${((24 - h) / 2).toFixed(1)}" width="1.2" height="${h.toFixed(1)}"/>`; }).join('')}</svg>`;
    const body = s.clean ? `<p class="sh-label">Before</p>${svg(true)}<p class="sh-label">After</p>${svg(false)}` : `<div class="sh-wavebox${s.loop ? ' is-loop' : ''}">${svg(false)}</div>`;
    return win(`<p class="sh-h">${esc(s.title)}</p>${body}<p class="sh-label">${esc(s.meta)}</p>`);
  },
  code(s) {
    const lines = s.lines.map((l, i) => `<li${i === s.hl ? ' class="is-hl"' : ''}><i>${i + 1}</i><code>${esc(l)}</code></li>`).join('');
    return win(`<p class="sh-title sh-path">${lu('file')}${esc(s.file)}</p><ol class="sh-code">${lines}</ol><p class="sh-note">${logo('github', 'sh-av')}<span>${esc(s.note)}</span></p>`);
  },
  board(s) {
    return `<div class="sh-board">${s.cols.map(([name, cards]) => `<div class="sh-col"><b>${esc(name)}</b>${cards.map((c) => `<span class="sh-card">${esc(c)}</span>`).join('')}</div>`).join('')}</div>`;
  },
  table(s) {
    const head = `<tr>${s.cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr>`;
    const body = s.rows.map((r, i) => `<tr${i === s.flag ? ' class="is-flag"' : ''}>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
    return win(`<table class="sh-table"><thead>${head}</thead><tbody>${body}</tbody></table>`);
  },
};

export function shot(a) {
  const s = SHOTS[a.id];
  if (!s) throw new Error(`no thumbnail spec for the automation "${a.id}"`);
  if (!T[s.t]) throw new Error(`no thumbnail template "${s.t}" (automation "${a.id}")`);
  return `<div class="sh" data-t="${s.t}" aria-hidden="true">${T[s.t](s)}</div>`;
}
