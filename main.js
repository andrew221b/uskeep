const root = document.documentElement;
const themeButton = document.querySelector('.theme-toggle');
const themeLabel = document.querySelector('.theme-label');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const motionReduced = matchMedia('(prefers-reduced-motion: reduce)');
const dataSaver = navigator.connection?.saveData === true;
let motionPaused = false;

function setTheme(theme, persist = false) {
  root.dataset.theme = theme;
  if (themeButton) themeButton.setAttribute('aria-pressed', String(theme === 'light'));
  if (themeLabel) themeLabel.textContent = theme === 'light' ? 'Dark' : 'Light';
  if (themeMeta) themeMeta.content = theme === 'light' ? '#f5f1e9' : '#171c21';
  if (persist) try { localStorage.setItem('uskeep-site-theme', theme); } catch { /* private browsing */ }
}
let savedTheme;
try { savedTheme = localStorage.getItem('uskeep-site-theme'); } catch { /* private browsing */ }
setTheme(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
themeButton?.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));

const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
menuButton?.addEventListener('click', () => {
  const open = !navLinks.classList.contains('is-open');
  navLinks.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
navLinks?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  navLinks.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open menu');
}));

const dots = [...document.querySelectorAll('.slide-dot')];
const frontPhone = document.querySelector('.hero-phone-wrap');
const rearPhone = document.querySelector('.phone-companion');
const phoneStage = document.querySelector('.hero-art');
const threadPaths = [...document.querySelectorAll('.hero-thread path')];
let currentSlide = 0;
let previewTimer;
let previewHovered = false;
let previewFocused = false;
let finishTransition = () => {};
let heroVisible = true;
const economyMotion = navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 3;
root.dataset.performanceTier = economyMotion ? 'economy' : 'full';
function phonePositions() {
  if (!frontPhone || !rearPhone) return;
  // Read layout once at setup/resize; animation frames only composite transforms.
  const dx = rearPhone.offsetLeft - frontPhone.offsetLeft;
  const dy = rearPhone.offsetTop - frontPhone.offsetTop;
  frontPhone.style.setProperty('--swap-x', dx + 'px');
  frontPhone.style.setProperty('--swap-y', dy + 'px');
  rearPhone.style.setProperty('--swap-x', -dx + 'px');
  rearPhone.style.setProperty('--swap-y', -dy + 'px');
}
phonePositions();
if (phoneStage && 'ResizeObserver' in window) new ResizeObserver(() => { finishTransition(); phonePositions(); }).observe(phoneStage);
function showSlide(index) {
  if (!frontPhone || !rearPhone) return;
  const next = (index + 2) % 2;
  if (next === currentSlide) return;
  finishTransition();
  const phones = [frontPhone, rearPhone];
  const before = phones.map(el => getComputedStyle(el).transform);
  currentSlide = next;
  phoneStage.classList.toggle('is-swapped', next === 1);
  const after = phones.map(el => getComputedStyle(el).transform);
  if (!motionReduced.matches && !dataSaver && !motionPaused) {
    const duration = economyMotion ? 950 : 1450;
    const animations = phones.map((el, i) => {
      const goesBack = (i === 0) === (next === 1);
      return el.animate([
        { transform: before[i], zIndex: goesBack ? 2 : 1 },
        { transform: `translate(${goesBack ? '12%' : '-12%'}, ${goesBack ? '-5%' : '5%'}) ` + before[i], zIndex: goesBack ? 2 : 1, offset: .25 },
        { transform: after[i], zIndex: goesBack ? 1 : 2 },
      ], { duration, easing: 'cubic-bezier(.45,0,.2,1)' });
    });
    threadPaths.forEach((path, i) => animations.push(path.animate([
      { transform: 'translate(0,0) rotate(0deg)', opacity: .6 },
      { transform: `translate(${i ? -9 : 9}px,${i ? 12 : -12}px) rotate(${next ? 1 : -1}deg)`, opacity: .9, offset: .5 },
      { transform: 'translate(0,0) rotate(0deg)', opacity: .6 },
    ], { duration, easing: 'cubic-bezier(.45,0,.2,1)' })));
    const cleanup = () => { animations.forEach(a => { a.onfinish = null; a.cancel(); }); finishTransition = () => {}; };
    finishTransition = cleanup;
    animations[0].onfinish = cleanup;
  }
  dots.forEach((dot, number) => {
    dot.classList.toggle('is-active', number === currentSlide);
    if (number === currentSlide) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });
}
function schedulePreview() {
  clearTimeout(previewTimer);
  if (!motionReduced.matches && !dataSaver && !motionPaused && frontPhone && rearPhone && !document.hidden && heroVisible && !previewHovered && !previewFocused) {
    previewTimer = setTimeout(() => { showSlide(currentSlide + 1); schedulePreview(); }, 5000);
  }
}
dots.forEach((dot) => dot.addEventListener('click', () => { showSlide(Number(dot.dataset.slide)); schedulePreview(); }));
const heroPreview = phoneStage;
heroPreview?.addEventListener('mouseenter', () => { previewHovered = true; schedulePreview(); });
heroPreview?.addEventListener('mouseleave', () => { previewHovered = false; schedulePreview(); });
heroPreview?.addEventListener('focusin', () => { previewFocused = true; schedulePreview(); });
heroPreview?.addEventListener('focusout', (event) => { if (!heroPreview.contains(event.relatedTarget)) { previewFocused = false; schedulePreview(); } });
if (heroPreview && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; schedulePreview(); }, { threshold: .1 }).observe(heroPreview);
}
document.addEventListener('visibilitychange', schedulePreview);
motionReduced.addEventListener?.('change', () => { if (motionReduced.matches) finishTransition(); schedulePreview(); });
schedulePreview();

const wayRail = document.querySelector('.three-ways');
if (wayRail) {
  if (motionReduced.matches || dataSaver || !('IntersectionObserver' in window)) wayRail.classList.add('is-threaded');
  else {
    const railObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { wayRail.classList.add('is-threaded'); railObserver.disconnect(); }
    }, { threshold: .3 });
    railObserver.observe(wayRail);
  }
}

const scatteredWord = document.querySelector('.hero .scattered-word');
const motionToggle = document.querySelector('.motion-toggle');
const replayButton = document.querySelector('.intro-replay');
let wordVisible = true;
function updateWordMotion() {
  const active = !motionPaused && !motionReduced.matches && !dataSaver && !document.hidden && wordVisible;
  // Keep the offset composition when motion stops; never snap the word straight.
  scatteredWord?.classList.add('is-gathering');
  scatteredWord?.classList.toggle('is-resting', !active);
  root.toggleAttribute('data-motion-paused', !active);
  if (motionToggle) {
    motionToggle.textContent = motionPaused ? 'Resume motion' : 'Pause motion';
    motionToggle.setAttribute('aria-pressed', String(motionPaused));
  }
}
if (scatteredWord && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => { wordVisible = entry.isIntersecting; updateWordMotion(); }, { threshold: .1 }).observe(scatteredWord);
}
document.addEventListener('visibilitychange', updateWordMotion);
motionReduced.addEventListener('change', updateWordMotion);
updateWordMotion();
for (const link of document.querySelectorAll('[data-store]')) {
  const key = link.dataset.store === 'ios' ? 'appStoreUrl' : 'playStoreUrl';
  const value = document.body.dataset[key];
  if (value && /^https:\/\//i.test(value)) {
    link.href = value;
    link.removeAttribute('aria-disabled');
    link.removeAttribute('tabindex');
    link.removeAttribute('title');
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  } else {
    link.addEventListener('click', (event) => event.preventDefault());
  }
}

// Two colored stars become the actual mark, then travel to its measured nav position.
// Content stays usable throughout; scrolling, tapping or reducing motion ends the scene.
let finishIntro = () => {};
const heroArt = document.querySelector('.hero-art');
const navMark = document.querySelector('.site-header .brand-icon');
const introImage = new Image();
introImage.src = '/assets/brand/uskeep-mark.png';
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const clamp = (t) => Math.max(0, Math.min(1, t));
const activeAnimations = new Set();
function animateHero() {
  if (motionPaused || motionReduced.matches || dataSaver) return;
  const pose = (el) => getComputedStyle(el).transform;
  const items = [
    ['.phone-companion', [{ transform: 'translateY(24px) ' + pose(rearPhone), opacity: .5 }, { transform: pose(rearPhone), opacity: 1 }], 0],
    ['.hero-phone-wrap', [{ transform: 'translateY(32px) ' + pose(frontPhone), opacity: .5 }, { transform: pose(frontPhone), opacity: 1 }], 90],
    ['.hero-thread', [{ strokeDashoffset: 1500, opacity: 0 }, { strokeDashoffset: 0, opacity: 1 }], 150],
  ];
  for (const [selector, frames, delay] of items) {
    const el = document.querySelector(selector);
    if (!el?.animate) continue;
    const animation = el.animate(frames, { duration: 1250, delay, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' });
    activeAnimations.add(animation);
    animation.onfinish = () => activeAnimations.delete(animation);
  }
}
async function playIntro() {
  finishIntro();
  if (!heroArt || !navMark || motionReduced.matches || dataSaver || motionPaused || document.hidden || scrollY > 80) return;
  try { await introImage.decode(); } catch { animateHero(); return; }
  if (motionReduced.matches || motionPaused || document.hidden || scrollY > 80) return;
  const sample = document.createElement('canvas');
  sample.width = sample.height = 100;
  const sampleContext = sample.getContext('2d', { willReadFrequently: true });
  if (!sampleContext) return;
  sampleContext.drawImage(introImage, 0, 0, 100, 100);
  let pixels;
  try { pixels = sampleContext.getImageData(0, 0, 100, 100).data; } catch { animateHero(); return; }
  const overlay = document.createElement('div');
  clearTimeout(previewTimer);
  overlay.className = 'brand-intro';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = '<canvas></canvas><img class="intro-mark" src="/assets/brand/uskeep-mark.png" alt=""><span class="intro-caption">A little closer. A lot more together.</span>';
  document.body.append(overlay);
  const canvas = overlay.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) { overlay.remove(); return; }
  const mark = overlay.querySelector('.intro-mark');
  const width = innerWidth, height = innerHeight, cx = width / 2, cy = height / 2;
  const size = Math.min(220, width * .44);
  const ratio = Math.min(devicePixelRatio || 1, economyMotion ? 1 : 2);
  const starColors = root.dataset.theme === 'light' ? ['#5c7080', '#973f53'] : ['#a9c2d0', '#e6a3af'];
  canvas.width = width * ratio; canvas.height = height * ratio;
  ctx.scale(ratio, ratio);
  Object.assign(mark.style, { left: cx - size / 2 + 'px', top: cy - size / 2 + 'px', width: size + 'px', height: size + 'px' });
  const points = [];
  for (let y = 8; y < 94; y += economyMotion ? 6 : 4) for (let x = 8; x < 94; x += economyMotion ? 6 : 4) {
    const i = (y * 100 + x) * 4;
    const [r, g, b, a] = pixels.slice(i, i + 4);
    if (a < 100 || Math.min(r, g, b) > 195 || r + g + b > 570) continue;
    const rose = r > b * 1.12;
    points.push({ x: cx + (x / 100 - .5) * size, y: cy + (y / 100 - .5) * size, rose, color: starColors[rose ? 1 : 0], n: points.length });
  }
  let raf, started, finished = false, revealed = false;
  const cancelEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    overlay.remove();
    navMark.style.visibility = '';
    if (replayButton) replayButton.disabled = false;
    cancelEvents.forEach((name) => document.removeEventListener(name, finish));
    window.removeEventListener('resize', finish);
    window.removeEventListener('scroll', finish);
    document.removeEventListener('visibilitychange', finish);
    motionReduced.removeEventListener('change', finish);
    if (finishIntro === finish) finishIntro = () => {};
    schedulePreview();
  }
  finishIntro = finish;
  navMark.style.visibility = 'hidden';
  if (replayButton) replayButton.disabled = true;
  cancelEvents.forEach((name) => document.addEventListener(name, finish, { passive: true }));
  window.addEventListener('resize', finish, { passive: true });
  window.addEventListener('scroll', finish, { passive: true });
  document.addEventListener('visibilitychange', finish);
  motionReduced.addEventListener('change', finish);
  function star(x, y, radius, color, alpha, angle = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = alpha; ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, r = i % 2 ? radius * .24 : radius;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function frame(now) {
    started ??= now;
    const t = now - started;
    ctx.clearRect(0, 0, width, height);
    const spread = Math.min(width * .31, 260);
    const gather = easeOut(clamp((t - 380) / 1220));
    const dissolve = 1 - clamp((t - 1450) / 350);
    for (const p of points) {
      const side = p.rose ? 1 : -1;
      const angle = p.n * 2.399;
      const radius = 28 + p.n % 61;
      const sx = cx + side * spread + Math.cos(angle) * radius;
      const sy = cy + side * 52 + Math.sin(angle) * radius;
      const arc = Math.sin(gather * Math.PI) * side;
      star(sx + (p.x - sx) * gather, sy + (p.y - sy) * gather - arc * 100,
        2 + (1 - gather) * (p.n % 3), p.color, clamp((t - 250) / 350) * dissolve, (1 - gather) * angle);
    }
    for (const side of [-1, 1]) {
      const approach = easeOut(clamp(t / 1150));
      star(cx + side * spread * (1 - approach), cy + side * 52 * (1 - approach),
        24 * (1 - clamp((t - 400) / 650)), starColors[side < 0 ? 0 : 1], 1, side * t / 1000);
    }
    mark.style.opacity = String(clamp((t - 1450) / 350));
    if (t > 1850) {
      if (!revealed) { revealed = true; overlay.classList.add('is-departing'); animateHero(); }
      const target = navMark.getBoundingClientRect();
      const flight = easeOut(clamp((t - 1850) / 1000));
      const dx = target.left + target.width / 2 - cx;
      const dy = target.top + target.height / 2 - cy;
      mark.style.transform = 'translate(' + dx * flight + 'px,' + (dy * flight - Math.sin(flight * Math.PI) * 60) + 'px) scale(' + (1 + (target.width / size - 1) * flight) + ')';
    }
    if (t < 2900) raf = requestAnimationFrame(frame);
    else finish();
  }
  raf = requestAnimationFrame(frame);
}
if (heroArt) {
  document.querySelector('.motion-controls').hidden = false;
  motionToggle.addEventListener('click', () => {
    motionPaused = !motionPaused;
    if (motionPaused) {
      finishIntro();
      activeAnimations.forEach((animation) => animation.cancel());
      activeAnimations.clear();
      clearTimeout(previewTimer);
      finishTransition();
    } else schedulePreview();
    updateWordMotion();
  });
  replayButton.addEventListener('click', () => {
    motionPaused = false; updateWordMotion(); playIntro();
  });
  motionReduced.addEventListener('change', () => {
    if (motionReduced.matches) {
      finishIntro();
      activeAnimations.forEach((animation) => animation.cancel());
      activeAnimations.clear();
    }
    replayButton.disabled = motionReduced.matches || dataSaver;
  });
  replayButton.disabled = motionReduced.matches || dataSaver;
  let internalArrival = false;
  try {
    internalArrival = sessionStorage.getItem('uskeep-page-navigation') === 'true';
    sessionStorage.removeItem('uskeep-page-navigation');
  } catch { /* private browsing */ }
  if (!internalArrival && !location.hash) playIntro();
}

// Keep regular links, browser history, downloads and new-tab behavior native.
// Cross-document View Transitions preserve the header; unsupported browsers use
// normal navigation with a short CSS arrival on the content only.
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
  const destination = new URL(link.href);
  if (destination.origin !== location.origin || destination.pathname === location.pathname) return;
  finishIntro();
  try { sessionStorage.setItem('uskeep-page-navigation', 'true'); } catch { /* private browsing */ }
});
window.addEventListener('pageswap', (event) => {
  finishIntro();
  if (motionReduced.matches || motionPaused) event.viewTransition?.skipTransition();
});
window.addEventListener('pagereveal', (event) => {
  if (motionReduced.matches || motionPaused) event.viewTransition?.skipTransition();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navLinks?.classList.contains('is-open')) {
    navLinks.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    menuButton.focus();
  }
});

// The same everyday records change from scattered fragments to an ordered home.
const gatherButton = document.querySelector('.gather-life');
const lifeDesk = document.querySelector('.desk-stage');
if (gatherButton && lifeDesk) {
  gatherButton.hidden = false;
  gatherButton.addEventListener('click', () => {
    const gathered = lifeDesk.classList.toggle('is-collected');
    gatherButton.setAttribute('aria-pressed', String(gathered));
    gatherButton.firstChild.textContent = gathered ? 'See the before ' : 'Bring it together ';
    document.querySelector('.desk-status').textContent = gathered
      ? 'Same life. Everything in its place.' : 'Familiar? Give every detail a home.';
  });
}

const featureTabs = document.querySelector('.feature-tabs');
if (featureTabs) {
  const buttons = [...featureTabs.querySelectorAll('button')];
  const panels = buttons.map((button) => document.getElementById(button.getAttribute('aria-controls')));
  const marker = document.createElement('span');
  marker.className = 'feature-tab-marker';
  marker.setAttribute('aria-hidden', 'true');
  featureTabs.prepend(marker);
  featureTabs.setAttribute('role', 'tablist');
  let selected = 0;
  let panelAnimation;
  const placeMarker = () => {
    const button = buttons[selected];
    marker.style.height = button.offsetHeight + 'px';
    marker.style.transform = 'translate(' + button.offsetLeft + 'px, ' + button.offsetTop + 'px) scaleX(' + button.offsetWidth / 100 + ')';
  };
  function selectFeature(index, animate = true) {
    panelAnimation?.cancel();
    selected = index;
    buttons.forEach((button, i) => {
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
      panels[i].setAttribute('role', 'tabpanel');
      panels[i].tabIndex = 0;
      panels[i].hidden = i !== index;
    });
    placeMarker();
    if (animate && !motionReduced.matches && !motionPaused && !dataSaver) {
      const scene = panels[index].querySelector('.feature-scene');
      panelAnimation = scene.animate([
        { clipPath: 'inset(0 0 0 7% round 16px)', opacity: .3, transform: 'translateX(15px)' },
        { clipPath: 'inset(0 0 0 0 round 16px)', opacity: 1, transform: 'translateX(0)' },
      ], { duration: 550, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => selectFeature(index));
    button.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      if (next === undefined) return;
      event.preventDefault(); selectFeature(next); buttons[next].focus();
    });
  });
  selectFeature(0, false);
  if ('ResizeObserver' in window) new ResizeObserver(placeMarker).observe(featureTabs);
  else window.addEventListener('resize', placeMarker);
  motionReduced.addEventListener('change', () => panelAnimation?.cancel());
}
