/* =========================================================
   1. PARTICLES — the 3D background behind the dark sections
   ========================================================= */
const Particles = (() => {
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');
  const COLORS = ['#f1ede4', '#f1ede4', '#e5242b', '#7d7a74'];
  const TAU = Math.PI * 2;

  let W = 0, H = 0, N = 1800, P = [];
  let rotY = 0, rotX = 0, spin = true, kick = 0;
  let spread = 1, spreadTarget = 1;
  let offX = 0, offXTarget = 0, alpha = 0, alphaTarget = 1, burst = 0;
  const mouse = { x: -9999, y: -9999, nx: 0, ny: 0 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function init() {
    resize();
    N = W < 700 ? 1000 : 1800;
    P = shapes.galaxy(N).map(([x, y, z], i) => ({
      x: x * 3, y: y * 3, z: z * 3, tx: x, ty: y, tz: z, ox: 0, oy: 0,
      c: i % COLORS.length, s: Math.random() * 1.3 + .5, k: Math.random() * .03 + .03
    }));
    addEventListener('resize', resize);
    addEventListener('pointermove', e => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      mouse.nx = e.clientX / W - .5; mouse.ny = e.clientY / H - .5;
    });
    document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    requestAnimationFrame(loop);
  }

  // Each shape returns n points, roughly inside [-1, 1]
  const shapes = {
    sphere(n) {
      const g = Math.PI * (3 - Math.sqrt(5));
      return Array.from({ length: n }, (_, i) => {
        const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = g * i;
        return [Math.cos(t) * r, y, Math.sin(t) * r];
      });
    },
    ring(n) {
      return Array.from({ length: n }, () => {
        const u = Math.random() * TAU, v = Math.random() * TAU, x = (1 + .22 * Math.cos(v)) * Math.cos(u);
        const y = .22 * Math.sin(v), z = (1 + .22 * Math.cos(v)) * Math.sin(u);
        return [x, y * Math.cos(1.1) - z * Math.sin(1.1), y * Math.sin(1.1) + z * Math.cos(1.1)];
      });
    },
    wave(n) {
      const side = Math.ceil(Math.sqrt(n));
      return Array.from({ length: n }, (_, i) => {
        const gx = (i % side) / side * 2 - 1, gz = Math.floor(i / side) / side * 2 - 1;
        return [gx * 1.7, Math.sin(gx * 3) * Math.cos(gz * 3) * .25 + .6, gz * 1.7];
      });
    },
    helix(n) {
      return Array.from({ length: n }, (_, i) => {
        const t = (i / n) * TAU * 3, s = i % 2 ? Math.PI : 0, r = Math.random() < .2 ? Math.random() * .45 : .45;
        return [Math.cos(t + s) * r, (i / n) * 2.4 - 1.2, Math.sin(t + s) * r];
      });
    },
    galaxy(n) {
      return Array.from({ length: n }, (_, i) => {
        const d = Math.pow(Math.random(), .7) * 1.5, a = (i % 3) / 3 * TAU + d * 3.2 + (Math.random() - .5) * .5;
        return [Math.cos(a) * d, (Math.random() - .5) * .12 * (1.5 - d), Math.sin(a) * d];
      });
    },
    // Rows of "posters", like a streaming homepage
    rows(n) {
      const cols = 7, rowsN = 4, w = .34, h = .5, gap = .08;
      const totalW = cols * w + (cols - 1) * gap, totalH = rowsN * h + (rowsN - 1) * gap * 2;
      return Array.from({ length: n }, () => {
        const c = Math.floor(Math.random() * cols), r = Math.floor(Math.random() * rowsN);
        const edge = Math.random() < .55;   // more points on the outlines
        let px = Math.random() * w, py = Math.random() * h;
        if (edge) { if (Math.random() < .5) px = Math.random() < .5 ? 0 : w; else py = Math.random() < .5 ? 0 : h; }
        return [-totalW / 2 + c * (w + gap) + px, -totalH / 2 + r * (h + gap * 2) + py, (r - 1.5) * .12];
      });
    },
    text(str, n) {
      const c = document.createElement('canvas'), w = 600, h = 300;
      c.width = w; c.height = h;
      const x = c.getContext('2d');
      x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = `${str.length > 2 ? 200 : 270}px Anton, Impact, sans-serif`;
      x.fillText(str, w / 2, h / 2 + 8);
      const data = x.getImageData(0, 0, w, h).data, hits = [];
      const big = str.length === 1 ? 1.8 : 1.2;
      for (let yy = 0; yy < h; yy += 3)
        for (let xx = 0; xx < w; xx += 3)
          if (data[(yy * w + xx) * 4 + 3] > 128) hits.push([(xx / w - .5) * 2.4 * big, (yy / h - .5) * 1.2 * big]);
      return Array.from({ length: n }, () => {
        const [px, py] = hits[Math.floor(Math.random() * hits.length)] || [0, 0];
        return [px + (Math.random() - .5) * .015, py + (Math.random() - .5) * .015, (Math.random() - .5) * .12];
      });
    }
  };

  function setShape(name, { px = 0, dim = 1 } = {}) {
    const flat = name.startsWith('text:') || name === 'rows';
    const pts = name.startsWith('text:') ? shapes.text(name.slice(5), N) : (shapes[name] || shapes.sphere)(N);
    pts.sort(() => Math.random() - .5);
    P.forEach((p, i) => { [p.tx, p.ty, p.tz] = pts[i]; });
    spin = !flat;
    if (flat) rotY = Math.atan2(Math.sin(rotY), Math.cos(rotY));   // unwind so it faces us
    offXTarget = px; alphaTarget = dim; burst = 1;
  }
  const hide = () => { alphaTarget = 0; };
  const nudge = dy => { kick += dy * .00004; };
  const setSpread = v => { spreadTarget = v; };
  const setOffset = v => { offXTarget = v; };

  function loop() {
    requestAnimationFrame(loop);
    alpha += (alphaTarget - alpha) * .06;
    offX += (offXTarget - offX) * .05;
    burst *= .94; kick *= .92;
    spread += (spreadTarget - spread) * .12;
    ctx.clearRect(0, 0, W, H);
    if (alpha < .01) return;

    if (spin) { rotY += .002 + mouse.nx * .008 + kick; rotX += (mouse.ny * .6 - rotX) * .03; }
    else { rotY += (mouse.nx * .45 - rotY) * .04; rotX += (mouse.ny * .3 + kick * 20 - rotX) * .04; }

    const scale = Math.min(W, H) * .34, fov = 3.2;
    const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
    const X0 = W / 2 + offX * W, Y0 = H / 2, R = 110;

    for (let ci = 0; ci < COLORS.length; ci++) {
      ctx.fillStyle = COLORS[ci];
      for (let i = ci; i < P.length; i += COLORS.length) {
        const p = P[i], k = p.k + burst * .02;
        p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; p.z += (p.tz - p.z) * k;
        const x1 = p.x * cy - p.z * sy, z1 = p.x * sy + p.z * cy;
        const y2 = p.y * cx - z1 * sx, z2 = p.y * sx + z1 * cx;
        const f = fov / (fov + z2 * spread);
        let X = X0 + x1 * spread * scale * f, Y = Y0 + y2 * spread * scale * f;

        const dx = X + p.ox - mouse.x, dy = Y + p.oy - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < R * R) { const d = Math.sqrt(d2) || 1, push = (1 - d / R) * 6; p.ox += dx / d * push; p.oy += dy / d * push; }
        p.ox *= .9; p.oy *= .9;

        const size = p.s * f * 1.3;
        ctx.globalAlpha = alpha * Math.max(.08, Math.min(1, (f - .6) * 1.4));
        ctx.fillRect(X + p.ox - size / 2, Y + p.oy - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
  }

  return { init, setShape, hide, nudge, setSpread, setOffset };
})();


/* =========================================================
   2. SECTIONS — setup
   ========================================================= */
const $ = id => document.getElementById(id);
const sections = [...document.querySelectorAll('.sec')];
const hsec = document.querySelector('.hscroll');
const intro = $('intro');
const track = hsec.querySelector('.track');
const jsec = document.querySelector('.journey-sec');
const jsteps = [...jsec.querySelectorAll('.jstep')];
$('jtotal').textContent = String(jsteps.length).padStart(2, '0');
jsteps.forEach(() => $('jbar').append(document.createElement('span')));
let active = -1;

sections.forEach(sec => {
  sec.querySelectorAll('.r').forEach((el, i) => el.style.setProperty('--d', i));
  sec.querySelectorAll('.split').forEach(splitLetters);
});

function splitLetters(el) {
  let ci = 0;
  (function walk(node) {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(word => {
          if (!word) return;
          if (/^\s+$/.test(word)) { frag.append(' '); return; }
          const w = document.createElement('span'); w.className = 'w';
          [...word].forEach(ch => {
            const c = document.createElement('span'); c.className = 'c';
            c.textContent = ch; c.style.setProperty('--ci', ci++);
            w.append(c);
          });
          frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
    });
  })(el);
}

// Side rail + counter
$('total').textContent = String(sections.length).padStart(2, '0');
const rail = $('rail');
sections.forEach((sec, i) => {
  const b = document.createElement('button');
  b.title = sec.dataset.label;
  b.setAttribute('aria-label', sec.dataset.label);
  b.addEventListener('click', () => scrollToY(topOf(sec)));
  rail.append(b);
});
document.querySelector('[data-go="0"]').addEventListener('click', e => { e.preventDefault(); scrollToY(0); });

// Marquee needs enough text to loop
document.querySelectorAll('[data-marquee]').forEach(m => { m.innerHTML += m.innerHTML; });

// Reveal sections as they enter the screen
const io = new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle('in', e.isIntersecting)), { threshold: .2 });
sections.forEach(s => io.observe(s));
// Tall horizontal section: reveal as soon as it's on screen
const tallIO = new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle('in', e.isIntersecting)), { threshold: 0 });
[hsec, jsec].forEach(s => tallIO.observe(s));

// The horizontal team section is as tall as its track is wide
function sizeHScroll() {
  const extra = Math.max(0, track.scrollWidth - innerWidth);
  hsec.style.height = `${innerHeight + extra}px`;
  // My path: about 3/4 of a screen of scrolling per step
  jsec.style.height = `${innerHeight * (1 + jsteps.length * .75)}px`;
}

const topOf = el => el.getBoundingClientRect().top + scrollY;


/* =========================================================
   3. SCROLL — active section, progress, parallax, horizontal
   ========================================================= */
let lastY = scrollY;

function onFrame() {
  const H = innerHeight, y = scrollY;
  Particles.nudge(y - lastY);
  lastY = y;

  // Intro: the counter loads as you scroll, particles gather into shape
  const ip = Math.min(1, Math.max(0, y / (intro.offsetHeight - H)));
  $('intro-num').textContent = String(Math.round(ip * 100)).padStart(3, '0');
  $('intro-bar').style.transform = `scaleX(${ip})`;
  $('intro-hint').textContent = ip >= 1 ? 'Loaded' : 'Scroll to load';
  document.body.classList.toggle('intro', ip < 1);
  Particles.setSpread(1 + (1 - ip) * 2.2);
  Particles.setOffset(ip < 1 ? 0 : parseFloat(sections[Math.max(0, active)].dataset.px || 0));

  // Which section is in the middle of the screen?
  let idx = active;
  sections.forEach((s, i) => {
    const r = s.getBoundingClientRect();
    if (r.top <= H * .5 && r.bottom > H * .5) idx = i;
  });
  if (idx !== active && idx >= 0) activate(idx);

  // Progress bar
  const max = document.documentElement.scrollHeight - H;
  $('bar').style.transform = `scaleX(${max > 0 ? y / max : 0})`;

  // Horizontal teams track
  const hr = hsec.getBoundingClientRect();
  const dist = hsec.offsetHeight - H;
  const p = dist > 0 ? Math.min(1, Math.max(0, -hr.top / dist)) : 0;
  track.style.transform = `translate3d(${-p * Math.max(0, track.scrollWidth - innerWidth)}px,0,0)`;

  // My path: show one step at a time
  const jr = jsec.getBoundingClientRect(), jdist = jsec.offsetHeight - H;
  const jp = Math.min(1, Math.max(0, -jr.top / jdist));
  const step = Math.min(jsteps.length - 1, Math.floor(jp * jsteps.length));
  jsteps.forEach((el, k) => { el.classList.toggle('on', k === step); el.classList.toggle('past', k < step); });
  [...$('jbar').children].forEach((b, k) => b.classList.toggle('on', k <= step));
  $('jcur').textContent = String(step + 1).padStart(2, '0');

  // Parallax
  document.querySelectorAll('[data-speed]').forEach(el => {
    const s = el.closest('.sec').getBoundingClientRect();
    el.style.translate = `0 ${(s.top + s.height / 2 - H / 2) * parseFloat(el.dataset.speed)}px`;
  });

  // Marquee drifts with scroll
  document.querySelectorAll('[data-marquee]').forEach(m => {
    const half = m.scrollWidth / 2;
    m.style.transform = `translate3d(${-((y * .35) % half)}px,0,0)`;
  });

  requestAnimationFrame(onFrame);
}

function activate(i) {
  active = i;
  const s = sections[i], mode = s.dataset.mode;
  document.body.classList.toggle('mode-fun', mode === 'fun');
  document.body.classList.toggle('mode-learn', mode === 'learn');
  if (mode === 'fun') Particles.setShape(s.dataset.shape || 'sphere', { px: parseFloat(s.dataset.px || 0), dim: parseFloat(s.dataset.dim || 1) });
  else Particles.hide();
  $('cur').textContent = String(i + 1).padStart(2, '0');
  $('label').textContent = s.dataset.label;
  [...rail.children].forEach((b, j) => b.classList.toggle('on', j === i));
  history.replaceState(null, '', '#' + (i + 1));
  updateNotes();
}


/* =========================================================
   4. NAVIGATION — arrows / clicker jump between stops,
      mouse wheel + trackpad scroll freely
   ========================================================= */
function stops() {
  const H = innerHeight, list = [0];
  sections.forEach(s => {
    const top = Math.round(topOf(s));
    list.push(top);
    if (s === hsec) {
      const dist = s.offsetHeight - H, n = Math.max(1, Math.round(dist / (innerWidth * .45)));
      for (let k = 1; k <= n; k++) list.push(Math.round(top + dist * k / n));
    } else if (s === jsec) {
      const dist = s.offsetHeight - H, n = jsteps.length;
      for (let k = 1; k < n; k++) list.push(Math.round(top + dist * k / n) + 2);
    } else if (s.offsetHeight > H * 1.2) {
      list.push(Math.round(top + s.offsetHeight - H));   // tall section: also stop at its bottom
    }
  });
  return list;
}

let anim = null, animTarget = null;
function scrollToY(to) {
  to = Math.max(0, Math.min(to, document.documentElement.scrollHeight - innerHeight));
  cancelAnimationFrame(anim);
  const from = scrollY, d = to - from, dur = Math.min(1300, Math.max(650, Math.abs(d) * .6)), t0 = performance.now();
  animTarget = to;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  (function step(now) {
    const t = Math.min(1, (now - t0) / dur);
    scrollTo(0, from + d * ease(t));
    if (t < 1) anim = requestAnimationFrame(step); else animTarget = null;
  })(t0);
}
['wheel', 'touchstart'].forEach(ev => addEventListener(ev, () => { cancelAnimationFrame(anim); animTarget = null; }, { passive: true }));

function go(dir) {
  const y = animTarget ?? scrollY, list = stops();
  const target = dir > 0 ? list.find(s => s > y + 4) : [...list].reverse().find(s => s < y - 4);
  if (target !== undefined) scrollToY(target);
  else if (dir > 0) scrollToY(document.documentElement.scrollHeight);
}

document.addEventListener('keydown', e => {
  const onButton = e.target.closest?.('button, a');
  const k = e.key;
  if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(k) || (k === ' ' && !onButton)) { e.preventDefault(); go(1); }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(k)) { e.preventDefault(); go(-1); }
  else if (k === 'Home') { e.preventDefault(); scrollToY(0); }
  else if (k === 'End') { e.preventDefault(); scrollToY(document.documentElement.scrollHeight); }
  else if (k.toLowerCase() === 'n') toggleNotes();
  else if (k.toLowerCase() === 'f') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
  else if (k.toLowerCase() === 'h') document.body.classList.toggle('hide-fills');
});

// Speaker notes
const notesEl = $('notes');
function toggleNotes() { notesEl.hidden = !notesEl.hidden; updateNotes(); }
function updateNotes() {
  if (notesEl.hidden || active < 0) return;
  notesEl.textContent = sections[active].querySelector('.notes')?.textContent.trim() || 'No notes here.';
}


/* =========================================================
   5. PHOTOS — show the photo, or a placeholder if it's missing
   ========================================================= */
document.querySelectorAll('.photo[data-src]').forEach(fig => {
  const img = new Image();
  img.alt = fig.dataset.label || '';
  img.onload = () => { if (fig.dataset.pos) img.style.objectPosition = fig.dataset.pos; fig.append(img); };
  img.onerror = () => { fig.innerHTML = `<span class="ph"><b>${fig.dataset.label || 'Photo'}</b><span class="mono">add ${fig.dataset.src}</span></span>`; };
  img.src = fig.dataset.src;
});


// My path: a photo replaces the graphic if you add one
document.querySelectorAll('.jart[data-src]').forEach(fig => {
  const img = new Image();
  img.alt = '';
  img.onload = () => fig.append(img);
  img.src = fig.dataset.src;
});


/* =========================================================
   6. CURSOR
   ========================================================= */
(() => {
  const cur = $('cursor'), dot = cur.querySelector('.dot'), ring = cur.querySelector('.ring');
  let x = -100, y = -100, rx = -100, ry = -100;
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; });
  document.addEventListener('pointerover', e => cur.classList.toggle('hover', !!e.target.closest('button, a')));
  (function tick() {
    rx += (x - rx) * .18; ry += (y - ry) * .18;
    dot.style.transform = `translate(${x - 3}px, ${y - 3}px)`;
    const half = ring.offsetWidth / 2;
    ring.style.transform = `translate(${rx - half}px, ${ry - half}px)`;
    requestAnimationFrame(tick);
  })();
})();


/* =========================================================
   7. INTERACTIVES
   ========================================================= */

// Engineering cycle: highlight one step at a time, then loop
(() => {
  const steps = [...$('cycle').children];
  let i = 0;
  setInterval(() => {
    steps.forEach((s, j) => s.classList.toggle('on', j === i));
    i = (i + 1) % steps.length;
  }, 1400);
})();

// Image personalization: same show, a different image for each viewer
(() => {
  const shown = $('shown'), pool = $('pool');
  for (let k = 1; k <= 9; k++) {
    const src = `photos/st-${k}.jpg`;
    shown.insertAdjacentHTML('beforeend', `<img src="${src}" data-k="${k}" alt="Stranger Things artwork ${k}">`);
    pool.insertAdjacentHTML('beforeend', `<img src="${src}" data-k="${k}" alt="">`);
  }
  function pick(k) {
    document.querySelectorAll('#viewers button').forEach(b => b.classList.toggle('on', b.dataset.img === k));
    [...shown.children, ...pool.children].forEach(img => img.classList.toggle('on', img.dataset.k === k));
  }
  document.querySelectorAll('#viewers button').forEach(b => b.addEventListener('click', () => pick(b.dataset.img)));
  pick('2');
})();


/* =========================================================
   8. START
   ========================================================= */
history.scrollRestoration = 'manual';
Particles.init();
sizeHScroll();
addEventListener('resize', sizeHScroll);
document.fonts?.ready.then(sizeHScroll);
requestAnimationFrame(onFrame);

const fromHash = parseInt(location.hash.slice(1), 10);
activate(0);
document.body.classList.add('intro');
if (fromHash > 1 && sections[fromHash - 1]) scrollTo(0, topOf(sections[fromHash - 1]));
