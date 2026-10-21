// Runs inside a live page (browser-control evaluate): returns a static, script-free copy of what is on screen. Every CSS
// rule the page holds (runtime-injected ones included, read off the CSSOM), with url()s made absolute; the DOM cloned
// with img sources resolved to the one the browser picked, form state and scroll offsets written to attributes, and
// scripts, preloads and frames dropped. Nothing on the page is changed.
(async () => {
  const abs = (u, base) => { try { return new URL(u, base).href; } catch (e) { return u; } };
  const fixUrls = (text, base) => text.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => (u.startsWith('data:') ? m : `url("${abs(u, base)}")`));
  const css = [], blocked = [];
  const walk = (sheet) => {
    const base = sheet.href || location.href;
    let rules;
    try { rules = sheet.cssRules; } catch (e) { blocked.push(sheet.href); return; }
    for (const r of rules) {
      if (r instanceof CSSImportRule && r.styleSheet) { walk(r.styleSheet); continue; }
      css.push(fixUrls(r.cssText, base));
    }
  };
  for (const s of document.styleSheets) walk(s);
  for (const s of document.adoptedStyleSheets || []) walk(s);
  await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
  const live = [...document.querySelectorAll('*')];
  const clone = document.documentElement.cloneNode(true);
  const copy = [...clone.querySelectorAll('*')];
  const scrolls = [];
  live.forEach((n, k) => {
    const c = copy[k];
    if (!c) return;
    if (n.scrollTop || n.scrollLeft) { c.setAttribute('data-sb-scroll', `${n.scrollLeft},${n.scrollTop}`); scrolls.push({ k, top: n.scrollTop }); }
    if (n.tagName === 'IMG') { c.setAttribute('src', n.currentSrc || n.src); c.removeAttribute('srcset'); c.removeAttribute('sizes'); c.removeAttribute('loading'); }
    if (n.tagName === 'SOURCE') c.remove();
    if (n.tagName === 'INPUT') {
      if (n.type === 'checkbox' || n.type === 'radio') { if (n.checked) c.setAttribute('checked', ''); else c.removeAttribute('checked'); }
      else c.setAttribute('value', n.value);
    }
    if (n.tagName === 'A' && n.getAttribute('href')) c.setAttribute('href', n.href);
    if (n instanceof SVGElement && n.getAttribute('href') && !n.getAttribute('href').startsWith('#')) c.setAttribute('href', abs(n.getAttribute('href'), location.href));
    const st = c.getAttribute('style');
    if (st && st.includes('url(')) c.setAttribute('style', fixUrls(st, location.href));
  });
  clone.querySelectorAll('script, noscript, iframe, style, link, meta[http-equiv], template, base').forEach((n) => n.remove());
  return JSON.stringify({ url: location.href, title: document.title, htmlClass: document.documentElement.className, bodyClass: document.body.className,
    viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio }, blocked, scrolls: scrolls.length,
    css: css.join('\n'), html: clone.outerHTML });
})()
