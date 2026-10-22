// A message the viewer sent, drawn as the live chat draws the user's (style.af4c3c6b.css .cm-u): the text in its grey
// bubble on the right, line breaks kept, a library automation it names a link to it, and any files sent with it above,
// a photo as its thumbnail.
import { esc } from './parts.bdeb2397.js';
import { ic } from './icons.854d0793.js';
import { sizeText } from './composer.854d0793.js';
import { linkRefs } from './automation-refs.3c255b31.js';

const fileHTML = (f) => (f.thumb
  ? `<li class="cu-pic"><img src="${f.thumb}" alt="${esc(f.name)}" width="120" height="90"></li>`
  : `<li class="cu-file">${ic('file', 'sb-lu cu-file-ic')}<span><b>${esc(f.name)}</b><small>${esc(sizeText(f.size))}</small></span></li>`);

export const userBubble = (m) => `<div class="cm cm-u cu">${m.files?.length ? `<ul class="cu-files" aria-label="Files sent">${m.files.map(fileHTML).join('')}</ul>` : ''}${m.u ? `<span>${linkRefs(esc(m.u))}</span>` : ''}</div>`;
