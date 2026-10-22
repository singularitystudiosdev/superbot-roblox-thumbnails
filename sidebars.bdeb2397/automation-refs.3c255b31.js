// A library automation named in what the viewer writes, as a press on a popular automation in New chat puts "Use the
// Roblox Icon Optimizer automation" in the field: its name shows as a link wherever the words do (the composer's field
// and every sent message), and a press on it opens the automation in full as its card in the Automations tab does
// (automation-detail.71c311e9.js; automations-view.03378ba4.js answers a press on any a.am-ref on the page). The link's
// own address is the tab's key for it (?tab=automations&automation=<id>), so it opens there in a new tab too.
import { AUTOMATIONS } from './automations.03378ba4.js';
import { esc } from './parts.bdeb2397.js';

const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// the names, matched in escaped text, in any case, as whole words; the longest first, so a name inside a longer one
// never takes its place
const byName = new Map(AUTOMATIONS.map((a) => [esc(a.title).toLowerCase(), a]));
const NAMES = byName.size ? new RegExp(`(?<!\\w)(?:${[...byName.keys()].sort((x, y) => y.length - x.length).map(reEsc).join('|')})(?!\\w)`, 'gi') : null;
// a tag, or a link with what it holds: a name is never looked for in either
const TAGS = /(<a\b[^>]*>[\s\S]*?<\/a>|<[^>]*>)/i;

function refHref(id) {
  const q = new URLSearchParams(location.search);
  q.delete('chat');
  q.set('tab', 'automations');
  q.set('automation', id);
  return `?${q}`;
}
const refHTML = (a, name) => `<a class="cm-link am-ref" href="${esc(refHref(a.id))}" data-automation="${esc(a.id)}" aria-haspopup="dialog">${name}</a>`;

// `html` is escaped text, with links in it already or not
export function linkRefs(html) {
  if (!NAMES) return html;
  return html.split(TAGS).map((part, i) => (i % 2 ? part : part.replace(NAMES, (name) => refHTML(byName.get(name.toLowerCase()), name)))).join('');
}

// The composer's field is a textarea, which holds no link: while a name is in it, a copy of its text lies over it with
// the name a link, the only part of the copy that takes a press, and the field's own lettering goes clear under it
// (chat-ui.854d0793.css .rc-refs). The copy scrolls with the field. `paint` after every change to the field's text.
export function mirrorRefs(field) {
  const mirror = document.createElement('div');
  mirror.className = 'rc-refs';
  mirror.hidden = true;
  field.after(mirror);
  const sync = () => { mirror.scrollTop = field.scrollTop; };
  function paint() {
    const text = esc(field.value), html = linkRefs(text);
    const on = html !== text;
    mirror.hidden = !on;
    field.classList.toggle('has-refs', on);
    if (!on) { mirror.replaceChildren(); return; }
    // a line break at the end holds a line in the field, so it does in the copy
    mirror.innerHTML = `${html}\u200b`;
    // the words round the names are read in the field; only the links are the copy's own
    for (const n of [...mirror.childNodes]) {
      if (n.nodeType !== Node.TEXT_NODE) continue;
      const span = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');
      n.replaceWith(span);
      span.append(n);
    }
    sync();
  }
  field.addEventListener('scroll', sync);
  return { paint };
}
