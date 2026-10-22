// The youtube chat's Studio Analytics a week after the tests ("Version 2 won at 6.8%", "Average click-through now 5.6%"):
// the same Advanced mode table as its 'analytics' page (play-youtube.8889b4ff.js), lowest click-through first, with the
// winners kept: Sheet Pan Gnocchi on version 2 at 6.8%, every other video up, the channel at 5.6%; views up 71% as the
// chat says. Read in with play-youtube.8889b4ff.js (file input, Trusted Types policy) in the same Studio tab set up as that
// file says, then `window.__ytAfter()`: it swaps the analytics page's figures for these, stages it, and answers the
// staging's own answer plus the targets (CSS px). Nothing is saved, uploaded or changed; a reload undoes it.
(() => {
  const GN = 'Sheet Pan Gnocchi in 20 Minutes (One Pan!)';
  // [picture, title, length, impressions, click-through %, views, watch time (hours), subscribers]
  const AFTER = [
    ['yt-pasta', 'One Pot Lemon Orzo', '7:58', 38200, 4.9, 11136, 507.0, 14],
    ['yt-curry', '15-Minute Chickpea Curry (Pantry Dinner)', '9:12', 29100, 5.1, 15443, 675.7, 29],
    ['yt-tacos', 'Sheet Pan Tacos al Pastor', '10:33', 52900, 5.2, 19159, 1075.7, 35],
    ['yt-chili', 'Is This the Best Weeknight Chili?', '16:20', 66300, 5.3, 33177, 2164.7, 59],
    ['yt-salmon', 'Crispy Salmon with 5 Ingredients', '8:47', 71800, 5.5, 30712, 1852.5, 66],
    ['yt-ramen', '30-Minute Miso Ramen at Home', '14:05', 83500, 5.8, 44186, 2708.0, 93],
    ['yt-gnocchi-2', GN, '12:41', 61400, 6.8, 16878, 1028.8, 22],
  ];
  const literal = `[\n${AFTER.map(([img, t, len, imp, ctr, views, wt, subs]) => `      { img: '${img}', t: ${img === 'yt-gnocchi-2' ? 'GN' : JSON.stringify(t)}, len: '${len}', imp: ${imp}, ctr: ${ctr}, views: ${views}, wt: ${wt}, subs: ${subs} },`).join('\n')}\n    ]`;
  window.__ytAfter = () => {
    const src = window.__ytSrc.replace(/(const analytics = \(\) => \{[\s\S]*?const V = )\[[\s\S]*?\n {4}\];/, `$1${literal};`);
    if (src === window.__ytSrc) throw new Error('play-youtube analytics figures not found');
    window.PLAY = { page: 'analytics', gnocchi: 'yt-gnocchi-2' };
    const staged = (0, eval)(src);
    const c = (el) => { const b = el.getBoundingClientRect(); return [+(b.x + b.width / 2).toFixed(1), +(b.y + b.height / 2).toFixed(1)]; };
    const rows = [...document.querySelectorAll('#row-container')];
    const gn = rows.find((r) => r.querySelector('#entity-title-value')?.textContent.trim() === GN);
    return {
      staged,
      targets: {
        'total-ctr': c([...rows[0].children][3]),
        gnocchi: gn && c(gn.querySelector('#entity-title-value')),
        'gnocchi-ctr': gn && c([...gn.children][3]),
        row1: c(rows[1].querySelector('#entity-title-value')),
      },
    };
  };
})();
