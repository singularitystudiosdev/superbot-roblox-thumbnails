// A figure that rolls like an odometer (the credits row, sidebar-tools.854d0793.js): each digit is a column of 0 to 9
// three times over, the middle run showing it, so a digit rolls by place value through the ones between, down as the
// figure falls (0 to 7 by 9 and 8) and up as it rises, and only the digits that changed move. A figure that gains or
// loses a place, or a viewer who asks for reduced motion, gets the new value at once. References: NumberFlow's
// trend (https://number-flow.barvian.me) and torph's rolling number (https://torph.dev); the timing is design-motion's
// quick band with torph's curve, on transform only.
const H = 1.3; // em: a digit's line, the column's height, the strip's step
const ROLL = { duration: 250, easing: 'cubic-bezier(0.19, 1, 0.22, 1)' };
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
const at = (p) => `translateY(${-p * H}em)`;

export function odometer(host) {
  host.style.setProperty('--od-h', `${H}em`);
  host.setAttribute('aria-hidden', 'true');
  let text = '';

  function build(next) {
    host.replaceChildren(...[...next].map((ch) => {
      const cell = document.createElement('span');
      if (!/\d/.test(ch)) return Object.assign(cell, { className: 'od-sep', textContent: ch });
      cell.className = 'od-d';
      cell.innerHTML = `<span class="od-strip">${'0123456789'.repeat(3).replace(/\d/g, '<i>$&</i>')}</span>`;
      cell.firstChild.style.transform = at(10 + Number(ch));
      return cell;
    }));
  }

  function roll(strip, from, to, down) {
    const steps = down ? (from - to + 10) % 10 : (to - from + 10) % 10;
    const end = 10 + from + (down ? -steps : steps);
    strip.getAnimations().forEach((a) => a.finish());
    // the strip rests on the middle run; the roll ends on the same digit a run above or below it
    strip.style.transform = at(10 + to);
    strip.animate([{ transform: at(10 + from) }, { transform: at(end) }], ROLL);
  }

  return {
    set(value) {
      const next = new Intl.NumberFormat('en-US').format(value);
      host.dataset.value = next;
      if (next === text) return;
      const prev = text;
      text = next;
      if (prev.length !== next.length || REDUCED.matches) return build(next);
      const down = Number(next.replace(/\D/g, '')) < Number(prev.replace(/\D/g, ''));
      [...next].forEach((ch, i) => {
        if (ch !== prev[i] && /\d/.test(ch)) roll(host.children[i].firstChild, Number(prev[i]), Number(ch), down);
      });
    },
  };
}
