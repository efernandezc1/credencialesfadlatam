/**
 * FAD LATAM — Credenciales FusionAgency
 * Experiencia inmersiva: Lenis + viewport fijo + escenas (estilo ibi.cash)
 * @see https://github.com/darkroomengineering/lenis
 */

gsap.registerPlugin(ScrollTrigger);

const COLORS = ['#8a4cff', '#ff3ea5', '#6aa3ff', '#ffffff', '#c77dff'];
const ALLSHAPES = [];
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SERVICES_DATA = [
  { n: '01', t: 'ESTRATEGIA & CONTENIDO DIGITAL', d: '<b>Estrategia digital integral</b>, conceptualización de campañas, producción de contenido, branding digital, contenido AI.', tags: ['ESTRATEGIA', 'CONTENIDO', 'BRANDING', 'AI'] },
  { n: '02', t: 'PRODUCCIÓN AUDIOVISUAL', d: 'Pre, producción y <b>post-producción</b>, storytelling visual, adaptaciones multiplataforma, hiperrealismo.', tags: ['VIDEO', 'STORYTELLING', 'POST', 'HIPERREALISMO'] },
  { n: '03', t: 'PAID MEDIA', d: 'Meta, Google, TikTok y LinkedIn ads, <b>lead generation</b>, optimización continua, dashboards en tiempo real.', tags: ['META', 'GOOGLE', 'TIKTOK', 'LEADS'] },
  { n: '04', t: 'INNOVACIÓN DIGITAL', d: 'Websites y landing pages, <b>e-commerce</b>, soluciones con AI.', tags: ['WEB', 'ECOMMERCE', 'AI'] },
];

const DESIGN_THINKING_FLOW = [
  ['START', 60], ['BRIEF', 70], ['DESIGN THINKING', 150, 1],
  ['Research', 80], ['Ideación', 90], ['Presentación', 95],
  ['DESIGN SPRINTS', 150, 1], ['Ejecución', 85], ['FINISH', 60],
];

const TOOLS_DATA = [
  ['⧉', 'Meta', '#0a84ff'], ['G', 'Google', '#ea4335'], ['▥', 'GA4', '#f9ab00'],
  ['M', 'Make', '#a855f7'], ['✳', 'Zapier', '#ff4f00'], ['☻', 'CRM', '#7b6cff'],
  ['◍', 'Looker', '#3aa0ff'], ['✶', 'Claude', '#d97757'], ['✦', 'AI Tools', '#ffffff'],
];

const BRANDS = [
  'FRANCESCO', 'Atom', 'VYVE', 'V&V', 'Miami Tax',
  'Kimsav', 'Overlay', 'Perú Sostenible', 'Vizy',
];

/**
 * Escenas post-intro — peso = duración relativa de scroll.
 * fx = transición de entrada/salida (ver TRANSITIONS):
 *   deep    → vuelo en profundidad (túnel z)
 *   curtain → cortina vertical con clip-path
 *   iris    → apertura circular desde el centro
 *   slices  → barrido lateral con skew
 *   flip    → volteo 3D (bisagra abajo/arriba)
 *   warp    → llega desde el espectador y se hunde al fondo
 */
const SCENES = [
  { id: 'vision', weight: 1.3, fx: 'deep' },
  { id: 'integra', weight: 2.4, fx: 'deep' },
  { id: 'nosotros', weight: 1, fx: 'iris' },
  { id: 'industrias', weight: 1.4, fx: 'warp' },
  { id: 'operamos', weight: 1, fx: 'curtain' },
  { id: 'enfoque', weight: 1.1, fx: 'slices' },
  { id: 'servcards', weight: 2.6, fx: 'deep' },
  { id: 'generamos', weight: 1, fx: 'flip' },
  { id: 'resultados', weight: 1.3, fx: 'iris' },
  { id: 'casos', weight: 1.6, fx: 'slices' },
  { id: 'proceso', weight: 1.1, fx: 'curtain' },
  { id: 'designthinking', weight: 1.1, fx: 'flip' },
  { id: 'partners', weight: 1.1, fx: 'slices' },
  { id: 'sincronizacion', weight: 1.2, fx: 'curtain' },
  { id: 'gestion', weight: 1.3, fx: 'iris' },
  { id: 'ecosistema', weight: 1, fx: 'warp' },
  { id: 'marcas', weight: 1.1, fx: 'curtain' },
  { id: 'finalcover', weight: 1.3, fx: 'arrival' },
];

const TOTAL_WEIGHT = SCENES.reduce((s, p) => s + p.weight, 0);
const INTRO_WEIGHT = 2.0;
const SCROLL_LENGTH = 1.85;
const ENTER_END = 0.1; // el panel llega más rápido
const EXIT_START = 0.84;
const CONTENT_SHOW_AT = 0.11; // llega vacío y sus elementos aparecen apenas aterriza
const CONTENT_HIDE_AT = 0.9;
const FAST_SCROLL_THRESHOLD = 0.05;
// Zona de mezcla intro→escenas corta: crossfade rápido, sin restos de la intro
const INTRO_BLEND = 0.015;

const SCENE_PALETTES = [
  ['#8a4cff', '#ff3ea5', '#6aa3ff', '#ffffff', '#c77dff'],
  ['#ff5e9a', '#b388ff', '#5dade2', '#f8c471', '#ea80fc'],
  ['#00d4aa', '#7c4dff', '#ff6b6b', '#ffe066', '#69f0ae'],
  ['#4fc3f7', '#ea80fc', '#ff8a65', '#fff59d', '#536dfe'],
  ['#69f0ae', '#536dfe', '#ff4081', '#e0e0e0', '#40c4ff'],
  ['#ffd54f', '#7e57c2', '#26a69a', '#ef5350', '#42a5f5'],
];

let lenis;
let scenePanels = [];
let introScrollTl;
let scrollTriggerRef;
let scrollParticleBox;
let particleTunnel;
let lastParticleProgress = 0;
let smoothTunnelProgress = 0;
const MAX_PARTICLES = 30;
const EDGE_PARTICLES = 4;
let lastFrameSceneProgress = 0;
let lastGlobalProgress = 0;
let maxExperienceProgress = 1;
let finalRushStarted = false;
let finalRushInterval = null;
const animatedPanels = new Set();
const panelPhase = new Map();

const CONTENT_LEAVES = [
  '.fx-words .w', '.fx-ch', '.rv', '.eyebrow2', '.num', '.kick',
  '.sech:not(.fx-words)', '.lead:not(.fx-words)', '.nh', '.dt-title',
  '.mk-title', '.mk-sub', '.ops-text', '.ih', '.indword:not(.ghost)',
  '.vis-sub', '.vis-body', '.vh b', '.vh .it', '.vis-img',
  '.ecard', '.gcard', '.rcard', '.pcard', '.case', '.tool', '.dt-c', '.team-bar',
  '.case h3', '.case .meta', '.ecard h3', '.ecard p', '.gcard h3', '.gcard p',
  '.pcard h3', '.pcard p',
  '.svcard.is-active .sv-title', '.svcard.is-active .sv-headline', '.svcard.is-active .sv-desc',
  '.svcard.is-active .sv-lead', '.svcard.is-active .sv-num', '.svcard.is-active .sv-tags',
  '.rcard .big', '.rcard .lbl', '.pt-text', '.sy-title', '.ge-title',
  '.fc-logo span', '.fc-cities', '.fc-url', '.iword',
].join(', ');

function getContentLeaves(inner) {
  if (!inner) return [];
  return [...inner.querySelectorAll(CONTENT_LEAVES)].filter(
    (el) => !el.closest('.svcard:not(.is-active)'),
  );
}

function hideInactiveServiceCards(inner) {
  if (!inner) return;
  inner.querySelectorAll('.svcard').forEach((card) => {
    if (!card.classList.contains('is-active')) {
      gsap.set(card, { opacity: 0, visibility: 'hidden', pointerEvents: 'none' });
    }
  });
}

function sceneProgressFromGlobal(globalProgress) {
  const introShare = INTRO_WEIGHT / (INTRO_WEIGHT + TOTAL_WEIGHT);
  return Math.max(0, (globalProgress - introShare) / (1 - introShare));
}

function getSceneSegment(index) {
  let acc = 0;
  for (let j = 0; j < index; j++) acc += SCENES[j].weight;
  const w = SCENES[index].weight;
  return { start: acc / TOTAL_WEIGHT, end: (acc + w) / TOTAL_WEIGHT };
}

function getLocalProgress(sceneProgress, index) {
  const { start, end } = getSceneSegment(index);
  return clamp((sceneProgress - start) / (end - start), 0, 1);
}

function findActiveSceneIndex(sceneProgress) {
  let acc = 0;
  for (let i = 0; i < SCENES.length; i++) {
    const start = acc / TOTAL_WEIGHT;
    const end = (acc + SCENES[i].weight) / TOTAL_WEIGHT;
    acc += SCENES[i].weight;
    if (sceneProgress >= start && sceneProgress < end) return i;
  }
  return SCENES.length - 1;
}

function isPanelAllowed(index, activeIndex, activeLocal) {
  if (index === activeIndex) return true;
  if (index === activeIndex - 1 && activeLocal < 0.3) return true;
  if (index === activeIndex + 1 && activeLocal > 0.7) return true;
  return false;
}

/** Detiene decode/type en curso y deja cada char con su texto original */
function killTextFX(inner) {
  if (!inner) return;
  inner.querySelectorAll('[data-wchars], [data-tchars]').forEach((el) => {
    if (el._decode) { el._decode.kill(); el._decode = null; }
    if (el._type) { el._type.kill(); el._type = null; }
  });
  inner.querySelectorAll('.c[data-orig], .ch[data-orig]').forEach((c) => {
    if (c.textContent !== c.dataset.orig) c.textContent = c.dataset.orig;
    c.classList.remove('c-hot');
  });
}

function hideContentLeaves(inner) {
  if (!inner) return;
  killTextFX(inner);
  gsap.set(getContentLeaves(inner), { opacity: 0, y: 28, scale: 0.94, filter: 'blur(3px)' });
  inner.querySelectorAll('.fx-words, .sech, .lead, .nh').forEach((el) => gsap.set(el, { opacity: 1 }));
}

function ensureContentVisible(inner) {
  if (!inner) return;
  killTextFX(inner);
  inner.querySelectorAll('.fx-words, .sech, .lead, .nh, .ih, .dt-title').forEach((el) => {
    gsap.set(el, { opacity: 1, clearProps: 'transform,filter' });
  });
  gsap.set(getContentLeaves(inner), { opacity: 1, y: 0, x: 0, scale: 1, filter: 'none' });
  // chars de decode/type: visibles con su texto real
  const glyphs = inner.querySelectorAll('.c, .ch, .tc');
  if (glyphs.length) gsap.set(glyphs, { opacity: 1 });
  inner.querySelectorAll('.tw-cursor').forEach((c) => { c.style.opacity = 0; });
  hideInactiveServiceCards(inner);
}

function applyContentExit(inner, t) {
  if (!inner) return;
  const hide = clamp(t, 0, 1);
  gsap.set(getContentLeaves(inner), {
    opacity: 1 - hide,
    y: -hide * 36,
    scale: 1 - hide * 0.08,
    filter: hide > 0.2 ? `blur(${hide * 5}px)` : 'none',
    overwrite: 'auto',
  });
}

/* --------------------------------------------------------------------------
   Utilidades
   -------------------------------------------------------------------------- */

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function wrapPanelInner(panel) {
  if (panel._inner) return panel._inner;
  const skip = (el) => el.classList?.contains('bgfx') || el.classList?.contains('meteors');
  const inner = document.createElement('div');
  inner.className = 'panel-inner';
  [...panel.children].forEach((child) => {
    if (!skip(child)) inner.appendChild(child);
  });
  panel.appendChild(inner);
  panel._inner = inner;
  return inner;
}

const HOLD_Z = 190;
const ENTER_Z = 640;
const EXIT_Z = 520;

const easeOut3 = gsap.parseEase('power3.out');
const easeIn3 = gsap.parseEase('power3.in');

/** Divide el progreso local en fase enter / hold / exit con t normalizado */
function scenePhase(local) {
  if (local < ENTER_END) return { phase: 'enter', t: easeOut3(local / ENTER_END) };
  if (local < EXIT_START) return { phase: 'hold', t: (local - ENTER_END) / (EXIT_START - ENTER_END) };
  return { phase: 'exit', t: easeIn3((local - EXIT_START) / (1 - EXIT_START)) };
}

/* --------------------------------------------------------------------------
   TRANSITIONS — cada escena declara su propio lenguaje de entrada/salida.
   Todas devuelven { opacity, z, y, blur, rotX, rotY, skewX, scale, clip,
   origin }; renderScenes aplica el paquete completo. Sin vaivenes en hold:
   el reposo es estable y la personalidad vive en los umbrales.
   -------------------------------------------------------------------------- */

/** deep — vuelo en profundidad puro (el clásico del túnel, sin bamboleo) */
function fxDeep(local) {
  const { phase, t } = scenePhase(local);
  if (phase === 'enter') {
    return { opacity: t, z: -ENTER_Z + t * ENTER_Z, blur: (1 - t) * 9, rotX: 6 * (1 - t) };
  }
  if (phase === 'hold') {
    return { opacity: 1, z: t * HOLD_Z, rotX: -t * 2 };
  }
  return { opacity: 1 - t, z: HOLD_Z + t * EXIT_Z, blur: t * 11, rotX: -2 - t * 7 };
}

/** curtain — cortina: el contenido se revela de arriba a abajo con clip-path */
function fxCurtain(local) {
  const { phase, t } = scenePhase(local);
  if (phase === 'enter') {
    return {
      opacity: 1, z: -140 + t * 140, y: (1 - t) * -70, blur: (1 - t) * 4,
      clip: `inset(${(1 - t) * 100}% 0% 0% 0%)`,
    };
  }
  if (phase === 'hold') {
    return { opacity: 1, z: t * HOLD_Z * 0.7, clip: 'inset(0% 0% 0% 0%)' };
  }
  return {
    opacity: 1 - t * 0.5, z: HOLD_Z * 0.7 + t * 170, y: t * -60, blur: t * 6,
    clip: `inset(0% 0% ${t * 100}% 0%)`,
  };
}

/** iris — apertura circular desde el centro (y cierre al salir) */
function fxIris(local) {
  const { phase, t } = scenePhase(local);
  if (phase === 'enter') {
    return {
      opacity: 1, scale: 1.18 - t * 0.18, blur: (1 - t) * 6,
      clip: `circle(${t * 75}% at 50% 50%)`,
    };
  }
  if (phase === 'hold') {
    return { opacity: 1, z: t * HOLD_Z * 0.6 };
  }
  return {
    opacity: 1 - t * 0.35, scale: 1 + t * 0.14, blur: t * 7,
    clip: `circle(${(1 - t) * 75}% at 50% 50%)`,
  };
}

/** slices — barrido lateral con skew (firma "smooth scroll" moderna) */
function fxSlices(local) {
  const { phase, t } = scenePhase(local);
  if (phase === 'enter') {
    return {
      opacity: 1, z: -90 + t * 90, skewX: (1 - t) * -9, blur: (1 - t) * 5,
      clip: `inset(0% ${(1 - t) * 100}% 0% 0%)`,
    };
  }
  if (phase === 'hold') {
    return { opacity: 1, z: t * HOLD_Z * 0.65 };
  }
  return {
    opacity: 1 - t * 0.4, z: HOLD_Z * 0.65 + t * 120, skewX: t * 9, blur: t * 6,
    clip: `inset(0% 0% 0% ${t * 100}%)`,
  };
}

/** flip — volteo 3D: entra girando desde abajo, sale girando hacia arriba */
function fxFlip(local) {
  const { phase, t } = scenePhase(local);
  if (phase === 'enter') {
    return {
      opacity: t, z: -260 * (1 - t), rotX: -80 * (1 - t), blur: (1 - t) * 5,
      origin: '50% 100%',
    };
  }
  if (phase === 'hold') {
    return { opacity: 1, z: t * HOLD_Z * 0.7 };
  }
  return {
    opacity: 1 - t, z: HOLD_Z * 0.7 + t * 200, rotX: 62 * t, blur: t * 7,
    origin: '50% 0%',
  };
}

/** warp — llega gigante desde el espectador y al salir se hunde en el fondo */
function fxWarp(local) {
  const { phase, t } = scenePhase(local);
  if (phase === 'enter') {
    return { opacity: t, scale: 2.6 - 1.6 * t, z: 300 * (1 - t), blur: (1 - t) * 12 };
  }
  if (phase === 'hold') {
    return { opacity: 1, z: t * HOLD_Z * 0.5 };
  }
  return { opacity: 1 - t, scale: 1 - 0.55 * t, z: HOLD_Z * 0.5 - t * 430, blur: t * 10 };
}

/** arrival — destino final: entra en profundidad y se queda anclado al centro */
function fxArrival(local) {
  const { phase, t } = scenePhase(local);
  if (phase === 'enter') {
    return { opacity: t, z: -ENTER_Z + t * ENTER_Z, blur: (1 - t) * 9, rotX: 6 * (1 - t) };
  }
  return { opacity: 1, z: 0 };
}

const TRANSITIONS = {
  deep: fxDeep, curtain: fxCurtain, iris: fxIris,
  slices: fxSlices, flip: fxFlip, warp: fxWarp, arrival: fxArrival,
};

/* --------------------------------------------------------------------------
   Lenis — integración oficial GSAP
   -------------------------------------------------------------------------- */

function initLenis() {
  if (REDUCED_MOTION || typeof Lenis === 'undefined') {
    window.addEventListener('scroll', onNativeScroll, { passive: true });
    return;
  }

  lenis = new Lenis({
    duration: 1.35,
    easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.62,
    touchMultiplier: 1.15,
    syncTouch: true,
    anchors: false,
  });

  lenis.on('scroll', onLenisScroll);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function onLenisScroll() {
  ScrollTrigger.update();
  clampScrollAtEnd();
}

function onNativeScroll() {
  ScrollTrigger.update();
  const limit = document.documentElement.scrollHeight - innerHeight;
  const progress = limit > 0 ? scrollY / limit : 0;
  updateScrollUI(progress, scrollY);
}

function updateScrollUI(progress, scroll) {
  const bar = document.getElementById('scroll-progress-bar');
  if (bar) bar.style.width = `${progress * 100}%`;

  const hint = document.getElementById('scroll-hint');
  if (hint) hint.classList.toggle('is-hidden', scroll > 100);
}

function updateBackground(globalProgress, scrollDelta = 0) {
  updateScrollParticles(globalProgress);
  if (typeof Galaxy !== 'undefined') {
    Galaxy.setProgress(globalProgress);
    Galaxy.setVelocity(scrollDelta);
  }
}

function renderIntro(t) {
  const intro = document.getElementById('intro');
  const stage = document.getElementById('stage');
  if (!intro || !introScrollTl) return;

  gsap.set(intro, { visibility: 'visible', opacity: 1, zIndex: 20 });
  if (stage) {
    stage.classList.remove('is-active');
    gsap.set(stage, { visibility: 'hidden' });
  }
  introScrollTl.progress(clamp(t, 0, 1));
}

function calcMaxExperienceProgress() {
  const introShare = INTRO_WEIGHT / (INTRO_WEIGHT + TOTAL_WEIGHT);
  let acc = 0;
  for (let i = 0; i < SCENES.length - 1; i++) acc += SCENES[i].weight;
  const finalStart = acc / TOTAL_WEIGHT;
  const finalW = SCENES[SCENES.length - 1].weight / TOTAL_WEIGHT;
  // se frena a mitad del hold: el contenido ya está centrado y estable
  const stopLocal = 0.55;
  const sceneP = finalStart + finalW * stopLocal;
  return introShare + sceneP * (1 - introShare);
}

function clampScrollAtEnd() {
  if (!lenis || !scrollTriggerRef) return;
  const maxScroll = scrollTriggerRef.start + maxExperienceProgress * (scrollTriggerRef.end - scrollTriggerRef.start);
  if (lenis.scroll > maxScroll + 1) {
    lenis.scrollTo(maxScroll, { immediate: true });
  }
}

function applyContentProgress(inner, show, dir) {
  if (!inner || REDUCED_MOTION) return;
  applyContentExit(inner, dir === 'exit' ? show : 1 - show);
}

function updateExperience(globalProgress) {
  const totalW = INTRO_WEIGHT + TOTAL_WEIGHT;
  const introShare = INTRO_WEIGHT / totalW;
  const blend = INTRO_BLEND;

  if (globalProgress < introShare - blend) {
    renderIntro(globalProgress / introShare);
    scenePanels.forEach((p) => gsap.set(p, { visibility: 'hidden', opacity: 0 }));
    updateSceneCounter(0);
  } else if (globalProgress < introShare + blend) {
    const t = clamp((globalProgress - (introShare - blend)) / (blend * 2), 0, 1);
    // La intro se queda en su estado final (sin rebobinar: rebobinarla traía
    // de vuelta el "FAD" a pantalla) y solo se desvanece encima de la escena 1.
    renderIntro(1);
    gsap.set('#intro', { visibility: 'visible', opacity: 1 - t, zIndex: 20 - t * 15 });
    const stage = document.getElementById('stage');
    if (stage) {
      stage.classList.add('is-active');
      gsap.set(stage, { visibility: 'visible', opacity: t });
    }
    const sceneP = sceneProgressFromGlobal(globalProgress);
    renderScenes(sceneP, false);
    gsap.set(scenePanels[0], { opacity: t, visibility: 'visible', zIndex: 10 });
    if (scenePanels[0]?._inner) {
      gsap.set(scenePanels[0]._inner, { scale: 0.78 + t * 0.22, opacity: 1, force3D: true });
      ensureContentVisible(scenePanels[0]._inner);
      const visImg = scenePanels[0].querySelector('.vis-img');
      if (visImg) gsap.set(visImg, { opacity: Math.max(0.35, t), scale: 0.9 + t * 0.1, force3D: true });
    }
    updateSceneCounter(0);
  } else {
    gsap.set('#intro', { visibility: 'hidden', opacity: 0 });
    const stage = document.getElementById('stage');
    if (stage) {
      stage.classList.add('is-active');
      gsap.set(stage, { visibility: 'visible', opacity: 1 });
    }
    if (introScrollTl) introScrollTl.progress(1);
    renderScenes(sceneProgressFromGlobal(globalProgress), globalProgress < lastGlobalProgress);
  }

  const scrollDelta = globalProgress - lastGlobalProgress;
  lastGlobalProgress = globalProgress;
  updateBackground(globalProgress, scrollDelta);
  clampScrollAtEnd();
}

function updateSceneCounter(activeIndex) {
  const cur = document.getElementById('scene-current');
  const tot = document.getElementById('scene-total');
  if (cur) cur.textContent = pad2(activeIndex + 1);
  if (tot) tot.textContent = pad2(SCENES.length);
  for (let i = 0; i < sideLinks.length; i++) {
    sideLinks[i].classList.toggle('is-on', +sideLinks[i].dataset.idx === activeIndex);
  }
}

/* --------------------------------------------------------------------------
   Motor inmersivo — viewport fijo, sin pin GSAP
   -------------------------------------------------------------------------- */

function renderScenes(sceneProgress, scrollingBack = false) {
  let activeIdx = findActiveSceneIndex(sceneProgress);
  const activeLocal = getLocalProgress(sceneProgress, activeIdx);
  const signedDelta = sceneProgress - lastFrameSceneProgress;
  const scrollSpeed = Math.abs(signedDelta);
  const fastScroll = scrollSpeed > FAST_SCROLL_THRESHOLD;

  scenePanels.forEach((panel, i) => {
    const id = SCENES[i].id;
    const { start: segStart, end: segEnd } = getSceneSegment(i);

    if (!isPanelAllowed(i, activeIdx, activeLocal)) {
      gsap.set(panel, { visibility: 'hidden', opacity: 0, zIndex: 0, pointerEvents: 'none' });
      panelPhase.set(id, 'hidden');
      animatedPanels.delete(id);
      killIdleFloat(panel._inner);
      if (id === 'finalcover') stopFinalRush();
      if (id === 'integra') stopIntegraCycle(panel);
      if (id === 'gestion') resetGestion(panel);
      if (id === 'resultados') resetCounters(panel);
      return;
    }

    let local = clamp((sceneProgress - segStart) / (segEnd - segStart), 0, 1);
    // finalcover: el texto espera — primero la pantalla se llena de estrellas fugaces
    const contentShowAt = id === 'vision' ? 0 : (id === 'finalcover' ? 0.34 : CONTENT_SHOW_AT);
    const fx = (TRANSITIONS[SCENES[i].fx] || fxDeep)(local);
    const depthZ = fx.z || 0;
    const blur = fx.blur || 0;

    const inner = panel._inner;
    const bg = panel.querySelector('.bgfx');
    const baseOpacity = fx.opacity ?? 1;
    const panelOpacity = i === activeIdx ? baseOpacity : baseOpacity * 0.45;

    panel.classList.toggle('is-active-scene', i === activeIdx && panelOpacity > 0.4);

    gsap.set(panel, {
      visibility: panelOpacity > 0.02 ? 'visible' : 'hidden',
      opacity: panelOpacity,
      scale: 1,
      filter: 'none',
      zIndex: i === activeIdx ? 20 : 10 + i,
      pointerEvents: i === activeIdx && panelOpacity > 0.4 ? 'auto' : 'none',
      force3D: true,
    });

    gsap.set(inner, {
      z: depthZ,
      y: fx.y || 0,
      rotationY: fx.rotY || 0,
      rotationX: fx.rotX || 0,
      skewX: fx.skewX || 0,
      skewY: 0,
      scale: fx.scale ?? 1,
      opacity: 1,
      clipPath: fx.clip || 'none',
      filter: blur > 0.12 ? `blur(${blur}px)` : 'none',
      transformOrigin: fx.origin || '50% 50%',
      force3D: true,
    });

    // El fondo vive en un plano fijo más atrás y se mueve a una fracción de
    // la profundidad del contenido: capa lenta detrás vs. capa rápida
    // delante = parallax real de profundidad, no solo un scale plano.
    if (bg) gsap.set(bg, { z: -320 + depthZ * 0.35, scale: 1, opacity: 0.2, force3D: true });

    // Las estrellas fugaces del cierre arrancan apenas la portada asoma,
    // antes de que el texto entre siquiera.
    if (id === 'finalcover' && panelOpacity > 0.02) startFinalRush();

    if (local > CONTENT_HIDE_AT) {
      panelPhase.set(id, 'exit');
      killIdleFloat(inner);
      applyContentExit(inner, (local - CONTENT_HIDE_AT) / (1 - CONTENT_HIDE_AT));
      animatedPanels.delete(id);
    } else if (local < contentShowAt) {
      panelPhase.set(id, scrollingBack ? 'exit' : 'enter');
      killIdleFloat(inner);
      if (id === 'vision' && i === activeIdx) ensureContentVisible(inner);
      else hideContentLeaves(inner);
      animatedPanels.delete(id);
    } else {
      panelPhase.set(id, 'hold');
      // Ojo: ensureContentVisible() debe llamarse UNA sola vez, justo antes
      // de lanzar playPanelEnter (no en cada frame). gsap .from() calcula el
      // valor final ("to") leyendo el estilo inline actual del elemento en
      // el momento en que se crea el tween: si en ese instante seguía en el
      // estado oculto (puesto por hideContentLeaves), la animación termina
      // yendo "de 0 a 0" y el contenido nunca se muestra. Por eso primero se
      // deja el elemento en su estado final visible y recién ahí se arma el
      // tween .from(), que lo relee correcto y anima desde oculto hacia ahí.
      // Llamarlo en cada frame (como antes) sí rompía la animación de otra
      // forma: el gsap.set() repetido pisaba el tween ya en curso.
      if (!animatedPanels.has(id)) {
        animatedPanels.add(id);
        if (!REDUCED_MOTION && !fastScroll) {
          ensureContentVisible(inner);
          playPanelEnter(panel, id);
        } else {
          ensureContentVisible(inner);
        }
      }
      const holdT = clamp((local - contentShowAt) / (CONTENT_HIDE_AT - contentShowAt), 0, 1);
      applyHoldParallax(inner, holdT);
    }

    runSceneLogic(panel, id, local, fastScroll, contentShowAt);
  });

  lastFrameSceneProgress = sceneProgress;
  updateSceneCounter(activeIdx);
}

/* Capas internas del parallax de hold: títulos suben, grillas bajan.
   Usa yPercent para no pisar el `y` del idle-float ni de los tweens enter. */
const PAR_UP = '.sech, .nh, .lead, .dt-title, .mk-title, .ge-title, .sy-title, .eyebrow2, .num, .kick';
const PAR_DOWN = '.ecards, .gcards, .rcards, .pcards, .dt-steps, .pt-items, .tools, .team-bar, .eco-list, .dash';

function applyHoldParallax(inner, t) {
  if (!inner || REDUCED_MOTION) return;
  const up = inner.querySelectorAll(PAR_UP);
  const down = inner.querySelectorAll(PAR_DOWN);
  if (up.length) gsap.set(up, { yPercent: -t * 7, force3D: true });
  if (down.length) gsap.set(down, { yPercent: t * 5, force3D: true });
}

function runSceneLogic(panel, id, local, fastScroll = false, contentShowAt = CONTENT_SHOW_AT) {
  if (local < contentShowAt || local > CONTENT_HIDE_AT) return;
  const hold = (local - contentShowAt) / (CONTENT_HIDE_AT - contentShowAt);

  switch (id) {
    case 'vision': {
      const img = panel.querySelector('.vis-img');
      if (img) {
        img.style.clipPath = 'none';
        const t = fastScroll ? 1 : gsap.parseEase('power2.out')(hold);
        gsap.set(img, { scale: 0.82 + t * 0.18, opacity: t, transformOrigin: '50% 20%', force3D: true });
      }
      break;
    }
    /* integra: la O se abre y cicla palabras sola (startIntegraCycle) */
    case 'industrias': {
      const w = panel.querySelector('#indWord');
      const g = panel.querySelector('#indGhost');
      const txt = hold < 0.46 ? 'REAL ESTATE' : 'GASTRONOMÍA';
      if (w) w.textContent = txt;
      if (g) g.textContent = txt;
      break;
    }
    case 'servcards': {
      const cards = [...panel.querySelectorAll('.svcard')];
      const idx = Math.min(cards.length - 1, Math.floor(hold * cards.length));
      cards.forEach((c, ci) => {
        const active = ci === idx;
        c.classList.toggle('is-active', active);
        gsap.set(c, {
          opacity: active ? 1 : 0,
          visibility: active ? 'visible' : 'hidden',
          pointerEvents: active ? 'auto' : 'none',
          scale: active ? 1 : 0.98,
        });
      });
      panel.querySelectorAll('.sv-dot').forEach((dot, di) => {
        dot.classList.toggle('is-on', di === idx);
      });
      break;
    }
    case 'resultados':
      if (hold > 0.12) runCounters(panel);
      break;
    case 'gestion':
      if (hold > 0.18) runGestion(panel);
      break;
    default:
      break;
  }
}

function initScrollEngine() {
  const driver = document.getElementById('scroll-driver');
  const stage = document.getElementById('stage');
  if (!driver || !stage) return;

  scenePanels = SCENES.map(({ id }) => {
    const el = document.getElementById(id);
    if (!el) return null;
    el.classList.add('panel');
    wrapPanelInner(el);
    return el;
  }).filter(Boolean);

  if (!scenePanels.length) return;

  const tot = document.getElementById('scene-total');
  if (tot) tot.textContent = pad2(scenePanels.length);

  maxExperienceProgress = calcMaxExperienceProgress();
  driver.style.height = `${(INTRO_WEIGHT + TOTAL_WEIGHT) * SCROLL_LENGTH * 100}vh`;

  if (REDUCED_MOTION) {
    renderIntro(0);
    scenePanels.forEach((p, i) => {
      gsap.set(p, { visibility: i === 0 ? 'visible' : 'hidden', opacity: i === 0 ? 1 : 0 });
    });
    return;
  }

  scrollTriggerRef = ScrollTrigger.create({
    trigger: driver,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1.05,
    invalidateOnRefresh: true,
    onUpdate(self) {
      updateExperience(self.progress);
      updateScrollUI(self.progress, lenis?.scroll ?? window.scrollY);
    },
  });

  updateExperience(0);
}

function scrollToScene(index) {
  const driver = document.getElementById('scroll-driver');
  const trigger = scrollTriggerRef || ScrollTrigger.getAll().find((t) => t.trigger === driver);
  if (!trigger || !lenis) return;

  const totalW = INTRO_WEIGHT + TOTAL_WEIGHT;
  const introShare = INTRO_WEIGHT / totalW;
  let acc = 0;
  for (let i = 0; i < index; i++) acc += SCENES[i].weight;
  const sceneP = (acc + SCENES[index].weight * 0.42) / TOTAL_WEIGHT;
  const globalP = introShare + sceneP * (1 - introShare);
  const target = trigger.start + globalP * (trigger.end - trigger.start);
  lenis.scrollTo(target, { duration: 2.4 });
}

function initSceneNav() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href')?.slice(1);
      if (!id) return;
      const idx = SCENES.findIndex((s) => s.id === id);
      if (idx < 0) return;
      e.preventDefault();
      scrollToScene(idx);
    });
  });
}

/* --------------------------------------------------------------------------
   Fondo y partículas
   -------------------------------------------------------------------------- */

function getPaletteForProgress(p) {
  const idx = Math.min(SCENES.length - 1, Math.floor(p * SCENES.length * 1.05));
  return SCENE_PALETTES[idx % SCENE_PALETTES.length];
}

function pickPaletteColor(palette) {
  return palette[(Math.random() * palette.length) | 0];
}

// Partículas deliberadamente tenues: son ambiente de fondo, no deben competir
// con el texto. El techo de opacidad es bajo (~0.4) y se atenúa aún más cerca.
function particleOpacityFromZ(z) {
  const DIM = 0.42;
  if (z < -1150) return 0;
  if (z < -880) return ((z + 1150) / 270) * DIM;
  if (z > 340) return Math.max(0, 1 - (z - 340) / 260) * DIM;
  return (0.5 + clamp((z + 880) / 1220, 0, 1) * 0.5) * DIM;
}

function particleScaleFromZ(z) {
  return 0.12 + clamp((z + 950) / 1350, 0, 1) * 1.75;
}

function addOneShape(box, opts = {}) {
  const depth = opts.depth ?? Math.random();
  let left;
  let top;

  if (opts.edge != null) {
    const pad = 4 + Math.random() * 10;
    switch (opts.edge) {
      case 0: left = pad + Math.random() * (100 - pad * 2); top = pad + Math.random() * 6; break;
      case 1: left = 100 - pad - Math.random() * 6; top = pad + Math.random() * (100 - pad * 2); break;
      case 2: left = pad + Math.random() * (100 - pad * 2); top = 100 - pad - Math.random() * 6; break;
      default: left = pad + Math.random() * 6; top = pad + Math.random() * (100 - pad * 2); break;
    }
  } else {
    const angle = Math.random() * Math.PI * 2;
    const radius = 18 + Math.random() * 62;
    left = 50 + Math.cos(angle) * radius * 0.42;
    top = 50 + Math.sin(angle) * radius * 0.34;
  }

  const size = 4 + Math.random() * (depth > 0.55 ? 15 : 10);
  const palette = opts.colors || COLORS;
  const color = Array.isArray(palette) ? pickPaletteColor(palette) : COLORS[(Math.random() * COLORS.length) | 0];
  const isCircle = Math.random() > 0.32;
  const isFilled = Math.random() > 0.35;

  const wrap = document.createElement('div');
  wrap.className = 'sh sh-3d';
  wrap.dataset.depth = depth.toFixed(3);
  wrap.style.cssText = `width:${size}px;height:${size}px;left:${left}%;top:${top}%`;

  const inner = document.createElement('i');
  inner.style.borderRadius = isCircle ? '50%' : '3px';
  // opacidad y glow bajos: el fondo no debe tapar el texto
  const op = 0.16 + depth * 0.2;
  inner.style.cssText = isFilled
    ? `background:${color};box-shadow:0 0 7px ${color}80;opacity:${op}`
    : `border:1px solid ${color};box-shadow:none;opacity:${op + 0.08}`;

  wrap.appendChild(inner);
  box.appendChild(wrap);

  const spawnZ = opts.spawnZ ?? (-720 + depth * 900);
  wrap.dataset.scrollZ = String(spawnZ);
  const startOp = particleOpacityFromZ(spawnZ);
  gsap.set(wrap, {
    z: spawnZ,
    scale: particleScaleFromZ(spawnZ),
    opacity: startOp,
    force3D: true,
  });

  if (!opts.noDrift) {
    gsap.to(wrap, {
      x: (Math.random() - 0.5) * 140,
      y: (Math.random() - 0.5) * 140,
      rotation: (Math.random() - 0.5) * 70,
      duration: 3.5 + Math.random() * 5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: Math.random() * 1.8,
    });
  }

  ALLSHAPES.push({ wrap, inner, depth });
  return wrap;
}

function addEdgeParticles(box, count = EDGE_PARTICLES) {
  for (let i = 0; i < count; i++) {
    addOneShape(box, { edge: i % 4, depth: 0.35 + Math.random() * 0.55 });
  }
}

function addShapes(box, count) {
  for (let i = 0; i < count; i++) addOneShape(box);
}

function addBlobs(layer) {
  const b1 = document.createElement('div');
  b1.className = 'blob';
  b1.style.cssText = 'width:42vw;height:42vw;left:-10vw;top:10%;background:rgba(255,40,150,.35)';
  const b2 = document.createElement('div');
  b2.className = 'blob';
  b2.style.cssText = 'width:38vw;height:38vw;right:-8vw;bottom:-4vw;background:rgba(120,50,230,.35)';
  layer.appendChild(b1);
  layer.appendChild(b2);
  gsap.to(b1, { x: '14vw', y: '6vh', scale: 1.15, duration: 11, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to(b2, { x: '-12vw', y: '-5vh', scale: 1.1, duration: 13, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

function initGlobalUniverse() {
  const layer = document.getElementById('universe-particles');
  if (!layer) return;

  addBlobs(layer);

  particleTunnel = document.createElement('div');
  particleTunnel.className = 'particle-tunnel';

  const rings = document.createElement('div');
  rings.className = 'tunnel-rings';
  for (let i = 0; i < 10; i++) {
    const ring = document.createElement('div');
    ring.className = 'tunnel-ring';
    ring.style.setProperty('--ring-i', String(i));
    rings.appendChild(ring);
  }
  particleTunnel.appendChild(rings);

  const shapes = document.createElement('div');
  shapes.className = 'fxshapes global-shapes';
  particleTunnel.appendChild(shapes);
  layer.appendChild(particleTunnel);

  scrollParticleBox = shapes;
  const startPalette = getPaletteForProgress(0);
  for (let i = 0; i < 11; i++) {
    addOneShape(shapes, {
      depth: Math.random(),
      colors: startPalette,
      spawnZ: -900 - Math.random() * 700,
    });
  }
  addEdgeParticles(shapes, 4);
}

function updateScrollParticles(progress) {
  if (!particleTunnel || REDUCED_MOTION) return;

  const delta = progress - lastParticleProgress;
  lastParticleProgress = progress;
  smoothTunnelProgress += (progress - smoothTunnelProgress) * 0.1;
  const p = smoothTunnelProgress;
  const absDelta = Math.abs(delta);
  const forward = delta >= 0;
  const palette = getPaletteForProgress(p);

  const warpScale = 1 + Math.min(absDelta * 38, 0.24);
  gsap.set(particleTunnel, {
    z: 0,
    scale: warpScale,
    rotationZ: p * 5 + delta * 120,
    force3D: true,
    transformOrigin: '50% 50%',
  });

  gsap.set('#universe-particles .blob', {
    scale: 1 + p * 0.07 + absDelta * 14,
    opacity: 0.2 + p * 0.12,
    force3D: true,
  });

  particleTunnel.querySelectorAll('.tunnel-ring').forEach((ring, i) => {
    let z = -820 + i * 95 + p * 1500 + delta * 3200;
    while (z > 420) z -= 1100;
    while (z < -1100) z += 1100;
    const depthT = clamp((z + 900) / 1200, 0, 1);
    gsap.set(ring, {
      z,
      opacity: 0.03 + depthT * 0.16,
      scale: 0.65 + depthT * 0.55,
      force3D: true,
    });
  });

  if (scrollParticleBox) {
    const toRemove = [];

    scrollParticleBox.querySelectorAll('.sh-3d').forEach((wrap) => {
      let z = parseFloat(wrap.dataset.scrollZ || '-800');
      z += delta * 2600;
      wrap.dataset.scrollZ = String(z);

      if (z > 580 || z < -1300) {
        toRemove.push(wrap);
        return;
      }

      gsap.set(wrap, {
        z,
        opacity: particleOpacityFromZ(z),
        scale: particleScaleFromZ(z),
        force3D: true,
      });
    });

    toRemove.forEach((wrap) => {
      gsap.to(wrap, { opacity: 0, duration: 0.12, onComplete: () => wrap.remove() });
    });

    if (absDelta > 0.00012) {
      const spawnN = forward
        ? Math.min(5, 1 + Math.floor(absDelta * 10000))
        : Math.min(2, Math.floor(absDelta * 5000));
      for (let i = 0; i < spawnN; i++) {
        if (scrollParticleBox.children.length >= MAX_PARTICLES) break;
        addOneShape(scrollParticleBox, {
          depth: 0.15 + Math.random() * 0.85,
          colors: palette,
          spawnZ: forward ? (-1250 - Math.random() * 450) : (-950 - Math.random() * 350),
          edge: Math.random() > 0.72 ? Math.floor(Math.random() * 4) : undefined,
          noDrift: Math.random() > 0.45,
        });
      }
    }

    const minCount = 10 + Math.floor(p * 14);
    while (scrollParticleBox.children.length < minCount && scrollParticleBox.children.length < MAX_PARTICLES) {
      addOneShape(scrollParticleBox, {
        depth: Math.random(),
        colors: palette,
        spawnZ: -1150 - Math.random() * 550,
        noDrift: Math.random() > 0.6,
      });
    }
  }

  gsap.set('#stage .stage-ring', { opacity: 0.35 + p * 0.15, force3D: true });
}

function splitChars(el) {
  if (el.dataset.splitChars) return;
  el.dataset.splitChars = '1';
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (!node.textContent.trim()) return;
    const frag = document.createDocumentFragment();
    [...node.textContent].forEach((ch) => {
      if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
      const c = document.createElement('span');
      c.className = 'ch';
      c.textContent = ch;
      frag.appendChild(c);
    });
    node.parentNode.replaceChild(frag, node);
  });
}

function splitFxWords(el) {
  if (el.dataset.split) return;
  el.dataset.split = '1';
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (!node.textContent.trim()) return;
    const parts = node.textContent.split(/(\s+)/);
    const frag = document.createDocumentFragment();
    parts.forEach((part) => {
      if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
      else if (part) {
        const w = document.createElement('span');
        w.className = 'w';
        w.textContent = part;
        frag.appendChild(w);
      }
    });
    node.parentNode.replaceChild(frag, node);
  });
}

/* --------------------------------------------------------------------------
   Texto generativo — decode-wave en títulos + typewriter en párrafos
   -------------------------------------------------------------------------- */

/** Títulos que se descifran letra a letra (frente de onda con glow) */
const DECODE_SELECTOR = '.sech, .nh, .lead, .sy-title, .ge-title, .mk-title, .dt-title, .sv-headline';

/** Párrafos que se escriben a máquina (preservan <b> y spans internos) */
const TYPE_SELECTOR = [
  '.kick', '.ops-text', '.pt-text', '.sy-text', '.ge-text', '.team-bar p',
  '.case .meta', '.ecard p', '.gcard p', '.pcard p', '.rcard .lbl',
  '.dt-step p', '.sv-lead', '.eco-list li', '.pt-item p', '.sy-tool p',
].join(', ');

const DECODE_GLYPHS = 'ABCDEFGHKMNPRSTUVWXYZ023456789#$%&@*+=<>/\\';

/** Divide cada palabra (.w) de un título en caracteres (.c) */
function splitWordChars(el) {
  if (el.dataset.wchars) return;
  el.dataset.wchars = '1';
  // títulos sin word-split previo (p. ej. generados por JS): char-split directo
  if (!el.querySelector('.w') && !el.querySelector('.ch')) splitChars(el);
  el.querySelectorAll('.w').forEach((w) => {
    const text = w.textContent;
    w.textContent = '';
    [...text].forEach((ch) => {
      const c = document.createElement('span');
      c.className = 'c';
      c.textContent = ch;
      c.dataset.orig = ch;
      w.appendChild(c);
    });
  });
  // títulos char-split directos (.ch) también guardan su original
  el.querySelectorAll('.ch').forEach((c) => { c.dataset.orig = c.textContent; });
}

/** Divide los nodos de texto de un párrafo en spans .tc (mantiene markup) */
function splitTypeChars(el) {
  if (el.dataset.tchars) return;
  el.dataset.tchars = '1';
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (!node.textContent.trim()) return;
    const frag = document.createDocumentFragment();
    [...node.textContent].forEach((ch) => {
      if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
      const c = document.createElement('span');
      c.className = 'tc';
      c.textContent = ch;
      frag.appendChild(c);
    });
    node.parentNode.replaceChild(frag, node);
  });
}

/**
 * Decode-wave: un frente de onda recorre el título; en el frente cada
 * letra cicla glifos aleatorios con glow rosa y detrás queda el texto real.
 */
function decodeTitle(el, dur) {
  const chars = [...el.querySelectorAll('.c, .ch')];
  if (!chars.length) return;
  chars.forEach((c) => { if (!c.dataset.orig) c.dataset.orig = c.textContent; });
  gsap.set(chars, { opacity: 0 });
  const obj = { p: 0 };
  const FRONT = 4;
  if (el._decode) el._decode.kill();
  el._decode = gsap.to(obj, {
    p: 1,
    duration: dur || Math.min(1.15, 0.28 + chars.length * 0.019),
    ease: 'power1.inOut',
    onUpdate() {
      const front = obj.p * (chars.length + FRONT);
      for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        const orig = c.dataset.orig;
        if (i < front - FRONT) {
          if (c.textContent !== orig) c.textContent = orig;
          c.style.opacity = 1;
          c.classList.remove('c-hot');
        } else if (i < front) {
          c.style.opacity = 1;
          c.classList.add('c-hot');
          if (orig.trim()) c.textContent = DECODE_GLYPHS[(Math.random() * DECODE_GLYPHS.length) | 0];
        } else {
          c.style.opacity = 0;
        }
      }
    },
    onComplete() {
      chars.forEach((c) => {
        c.textContent = c.dataset.orig;
        c.style.opacity = 1;
        c.classList.remove('c-hot');
      });
      el._decode = null;
    },
  });
}

/** Escritura a máquina por revelado de chars (mantiene <b>/<span>) + caret */
function typeChars(el, delay = 0) {
  const chars = el.querySelectorAll('.tc');
  if (!chars.length) return;
  if (el._type) el._type.kill();
  gsap.set(chars, { opacity: 0 });
  gsap.set(el, { opacity: 1 });

  let caret = el.querySelector(':scope > .tw-cursor');
  if (!caret) {
    caret = document.createElement('span');
    caret.className = 'tw-cursor';
    caret.textContent = '|';
    el.appendChild(caret);
  }
  caret.style.opacity = 1;

  el._type = gsap.to(chars, {
    opacity: 1,
    duration: 0.01,
    stagger: Math.min(0.014, 1.1 / chars.length),
    delay,
    ease: 'none',
    onComplete() {
      gsap.to(caret, { opacity: 0, duration: 0.2, delay: 0.5 });
      el._type = null;
    },
  });
}

/** Barrido holográfico que cruza la tarjeta al aterrizar (clip propio) */
function scanSweep(card) {
  if (!card.classList.contains('glare-host')) return;
  const clip = document.createElement('div');
  clip.className = 'sweep-clip';
  const s = document.createElement('div');
  s.className = 'scan-sweep';
  clip.appendChild(s);
  card.appendChild(clip);
  gsap.fromTo(s, { top: '-50%', opacity: 1 }, {
    top: '115%',
    opacity: 0.4,
    duration: 0.72,
    ease: 'power2.inOut',
    onComplete: () => clip.remove(),
  });
}

function prepareTextAnimations() {
  if (REDUCED_MOTION) return;
  // mk/dt-title también se parten primero en palabras (.w inline-block):
  // así el wrap de línea nunca corta una palabra por la mitad ("CON FÍAN")
  document.querySelectorAll('#stage .fx-words, #stage .mk-title, #stage .dt-title').forEach(splitFxWords);
  document.querySelectorAll(DECODE_SELECTOR.split(', ').map((s) => `#stage ${s}`).join(', ')).forEach(splitWordChars);
  document.querySelectorAll(TYPE_SELECTOR.split(', ').map((s) => `#stage ${s}:not(.typewriter)`).join(', ')).forEach(splitTypeChars);
  document.querySelectorAll('#stage .vh span').forEach((span) => {
    span.classList.add('fx-ch');
  });
  scenePanels.forEach((panel) => {
    if (panel._inner) hideContentLeaves(panel._inner);
  });
}

function runTypewriter(el, delay = 0) {
  if (el.dataset.typed) return;
  el.dataset.typed = '1';
  const full = (el.dataset.full || el.textContent).trim();
  el.textContent = '';
  el.classList.add('is-typing');
  const textNode = document.createTextNode('');
  const cursor = document.createElement('span');
  cursor.className = 'tw-cursor';
  cursor.textContent = '|';
  el.appendChild(textNode);
  el.appendChild(cursor);
  const obj = { n: 0 };
  gsap.to(obj, {
    n: full.length,
    duration: full.length * 0.045,
    delay,
    ease: 'none',
    onUpdate() {
      textNode.textContent = full.slice(0, Math.round(obj.n));
    },
    onComplete() {
      el.classList.remove('is-typing');
      gsap.to(cursor, { opacity: 0, duration: 0.25, repeat: 5, yoyo: true });
    },
  });
}

function playPanelEnter(panel, id) {
  // renderScenes ya gestiona animatedPanels; aquí solo se respeta reduced-motion
  if (REDUCED_MOTION) return;
  const inner = panel._inner || panel;
  // immediateRender:true => el estado "oculto" del .from() se aplica en este
  // mismo tick síncrono (no en el siguiente frame). Sin esto, ensureContentVisible
  // deja el contenido visible un frame => flash "se ve, desaparece y anima".
  const tl = gsap.timeline({ defaults: { ease: 'power3.out', immediateRender: true } });

  const labels = inner.querySelectorAll('.eyebrow2, .num, .mk-sub');
  const decodeEls = inner.querySelectorAll(DECODE_SELECTOR);
  const lines = inner.querySelectorAll('.fx-ch');
  const typeEls = inner.querySelectorAll(TYPE_SELECTOR);
  const blocks = inner.querySelectorAll('.ecard, .gcard, .rcard, .pcard, .case, .tool, .dt-c, .team-bar, .pt-item, .sy-tool, .gm, .dt-step, .ge-pill, .dash, .rv:not(.ecard):not(.gcard):not(.rcard):not(.pcard):not(.case):not(.tool):not(.team-bar):not(.pt-item):not(.sy-tool):not(.gm):not(.dt-step):not(.ge-pill):not(.dash)');
  const plain = inner.querySelectorAll('.indword:not(.ghost), .vis-sub:not(.typewriter), .ih');

  /* 0 — solo los chars de decode/typing se ocultan a mano (los revela un
     callback, no un .from()). Las tarjetas/planos NO se tocan aquí: sus
     .from() con immediateRender:true ya leen el estado visible que dejó
     ensureContentVisible() como destino y aplican el estado oculto en este
     mismo tick. Si los pusiéramos a opacity:0 antes, el .from() leería 0
     como destino y animaría "de 0 a 0" (nunca aparecerían). */
  decodeEls.forEach((el) => {
    const cs = el.querySelectorAll('.c, .ch');
    if (cs.length) gsap.set(cs, { opacity: 0 });
  });
  typeEls.forEach((el) => {
    const cs = el.querySelectorAll('.tc');
    if (cs.length) gsap.set(cs, { opacity: 0 });
  });

  /* 1 — etiquetas de sección: caen del espacio con tracking abierto */
  if (labels.length) {
    tl.from(labels, {
      opacity: 0, y: 70, scale: 0.7, letterSpacing: '38px', duration: 0.9, stagger: 0.09, ease: 'power4.out',
    }, 0);
  }

  /* 2 — títulos: decode-wave letra a letra (los .w quedan estables debajo) */
  decodeEls.forEach((el, i) => {
    const words = el.querySelectorAll('.w');
    if (words.length) gsap.set(words, { opacity: 1, y: 0, x: 0, scale: 1, filter: 'none' });
    tl.add(() => decodeTitle(el), 0.05 + i * 0.12);
  });

  /* 3 — líneas de la visión (bisagra 3D, se mantiene) */
  if (lines.length) {
    tl.from(lines, {
      opacity: 0, y: 160, z: -220, rotationX: -100, scale: 0.7, transformOrigin: '50% 100%',
      duration: 1.05, stagger: 0.16, ease: 'back.out(2)',
    }, 0.05);
  }

  plain.forEach((el) => tl.from(el, {
    opacity: 0, y: 90, scale: 0.75, filter: 'blur(10px)', duration: 0.95, ease: 'power4.out',
  }, 0.12));

  /* 4 — tarjetas: aterrizan UNA A UNA (flip lateral alternado + barrido
     holográfico al tocar suelo; su texto se teclea justo después) */
  const CARD_EACH = 0.11;
  const CARD_START = 0.16;
  if (blocks.length) {
    tl.from(blocks, {
      opacity: 0,
      y: 90,
      z: -240,
      rotationY: (i) => (i % 2 === 0 ? -72 : 72),
      transformOrigin: (i) => (i % 2 === 0 ? '0% 50%' : '100% 50%'),
      scale: 0.62,
      filter: 'blur(10px)',
      duration: 0.7,
      stagger: CARD_EACH,
      ease: 'back.out(1.6)',
    }, CARD_START);
    blocks.forEach((b, i) => {
      tl.add(() => scanSweep(b), CARD_START + 0.3 + i * CARD_EACH);
    });
  }

  /* 5 — párrafos: escritura a máquina (después del decode del título;
     los de tarjetas arrancan cuando su tarjeta ya aterrizó) */
  typeEls.forEach((el, i) => {
    const inCard = el.closest('.ecard, .gcard, .rcard, .pcard, .case, .team-bar, .pt-item, .sy-tool, .gm, .dt-step');
    const at = inCard
      ? CARD_START + 0.34 + [...blocks].indexOf(inCard) * CARD_EACH
      : 0.32 + i * 0.09;
    tl.add(() => typeChars(el), Math.max(0.22, at));
  });

  inner.querySelectorAll('.typewriter:not([data-typed])').forEach((el, i) => runTypewriter(el, 0.4 + i * 0.25));
  if (id === 'integra') startIntegraCycle(panel);
  tl.eventCallback('onComplete', () => {
    playIdleFloat(inner);
    settleCardDepth(inner);
  });
}

const TILT_SELECTOR = '.ecard, .gcard, .pcard, .rcard, .case, .tool, .pt-item, .sy-tool, .gm, .dt-step, .pcard2';

// Deja cada tarjeta reposando en su propio plano de profundidad (no todas
// pegadas al mismo z) para que la grilla se sienta un espacio 3D real,
// listo para que el tilt del mouse las mueva desde ahí.
function settleCardDepth(inner) {
  if (REDUCED_MOTION) return;
  const cards = inner.querySelectorAll(TILT_SELECTOR);
  cards.forEach((c, i) => {
    if (c._depthSet) return;
    c._depthSet = true;
    gsap.set(c, {
      z: i % 2 === 0 ? 22 : -22,
      rotationY: i % 2 === 0 ? -2.5 : 2.5,
      transformPerspective: 900,
    });
  });
}

function initCardTilt3D() {
  if (REDUCED_MOTION) return;
  let hovered = null;

  document.querySelectorAll(TILT_SELECTOR).forEach((el) => el.classList.add('glare-host'));

  window.addEventListener('mousemove', (e) => {
    const card = e.target.closest ? e.target.closest(TILT_SELECTOR) : null;
    if (card !== hovered) {
      if (hovered) resetCardTilt(hovered);
      hovered = card;
    }
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
    card.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
    gsap.to(card, {
      rotationY: px * 12,
      rotationX: -py * 12,
      z: 34,
      scale: 1.025,
      duration: 0.5,
      ease: 'power2.out',
      transformPerspective: 900,
      overwrite: 'auto',
    });
  });
}

function resetCardTilt(card) {
  const base = card._depthSet ? ([...card.parentNode.children].indexOf(card) % 2 === 0 ? 22 : -22) : 0;
  const baseRotY = card._depthSet ? ([...card.parentNode.children].indexOf(card) % 2 === 0 ? -2.5 : 2.5) : 0;
  gsap.to(card, {
    rotationY: baseRotY, rotationX: 0, z: base, scale: 1,
    duration: 0.7, ease: 'power3.out', overwrite: 'auto',
  });
}

const IDLE_FLOAT_SELECTOR = '.sech, .nh, .lead, .dt-title, .mk-title, .sv-headline, .ih, .vh b, .indword:not(.ghost)';

function killIdleFloat(inner) {
  if (!inner) return;
  inner.querySelectorAll(IDLE_FLOAT_SELECTOR).forEach((el) => {
    if (el._idleFloat) {
      el._idleFloat.kill();
      el._idleFloat = null;
      gsap.set(el, { y: 0 });
    }
  });
}

function playIdleFloat(inner) {
  if (REDUCED_MOTION) return;
  const targets = inner.querySelectorAll(IDLE_FLOAT_SELECTOR);
  targets.forEach((el, i) => {
    if (el._idleFloat) return;
    el._idleFloat = gsap.to(el, {
      y: '+=10',
      duration: 3.4 + (i % 3) * 0.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: i * 0.15,
    });
  });
}

function initSceneBackgrounds() {
  document.querySelectorAll('.scene[data-fx], #vision, #integra, #industrias, #finalcover').forEach((section) => {
    if (section.querySelector('.bgfx')) return;
    const bg = document.createElement('div');
    bg.className = 'bgfx';
    addBlobs(bg);
    const shapes = document.createElement('div');
    shapes.className = 'fxshapes';
    bg.appendChild(shapes);
    section.insertBefore(bg, section.firstChild);
    addShapes(shapes, section.dataset.fx ? +section.dataset.fx + 3 : 4);
  });
  const coverFx = document.getElementById('coverFx');
  if (coverFx) {
    addBlobs(coverFx);
    coverFx.classList.add('bgfx');
  }
  addShapes(document.getElementById('shapes'), 16);
  addShapes(document.getElementById('ishapes'), 12);
}

/* --------------------------------------------------------------------------
   Contenido dinámico
   -------------------------------------------------------------------------- */

function buildDesignThinkingFlow() {
  const box = document.getElementById('dtFlow');
  if (!box || box.children.length) return;
  DESIGN_THINKING_FLOW.forEach(([label, size, isBig]) => {
    const c = document.createElement('div');
    c.className = `dt-c${isBig ? ' big' : ''}`;
    c.style.width = c.style.height = `${size}px`;
    c.textContent = label;
    box.appendChild(c);
  });
}

function buildToolsGrid() {
  const box = document.getElementById('tools');
  if (!box || box.children.length) return;
  TOOLS_DATA.forEach(([icon, name, color]) => {
    const d = document.createElement('div');
    d.className = 'tool';
    d.innerHTML = `<div class="tile" style="color:${color}">${icon}</div><span>${name}</span>`;
    box.appendChild(d);
  });
}

function initServicesCards() {
  const stage = document.getElementById('svStage');
  const dots = document.getElementById('svDots');
  if (!stage || stage.children.length) return;

  SERVICES_DATA.forEach((s, idx) => {
    const c = document.createElement('div');
    c.className = 'svcard' + (idx === 0 ? ' is-active' : '');
    c.innerHTML = `
      <div class="sv-card-inner">
        <span class="sv-num">${s.n}</span>
        <h2 class="sv-headline">${s.t}</h2>
        <p class="sv-lead">${s.d.replace(/<\/?b>/g, '')}</p>
        <ul class="sv-tags">${s.tags.map((t) => `<li>${t}</li>`).join('')}</ul>
      </div>`;
    stage.appendChild(c);
  });

  if (dots) {
    dots.innerHTML = SERVICES_DATA.map((_, i) =>
      `<span class="sv-dot${i === 0 ? ' is-on' : ''}" aria-hidden="true"></span>`,
    ).join('');
  }
}

/* --------------------------------------------------------------------------
   Intro
   -------------------------------------------------------------------------- */

function initIntro() {
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.tagline', { opacity: 0, scale: 0.94, duration: 1.1 })
    .from('.logo', { opacity: 0, scale: 0.92, duration: 1.1 }, '-=.7')
    .from('.cities', { opacity: 0, scale: 0.94, duration: 0.9 }, '-=.6')
    .from('.baseline', { scaleX: 0, transformOrigin: 'left', duration: 1.1 }, '-=.7');

  introScrollTl = gsap.timeline({ paused: true })
    // -320/320: en pantallas anchas la fuente clampa a 210px y ±175% del
    // propio ancho no basta para sacar las letras del viewport
    .to('#fad', { xPercent: -320, ease: 'power2.in' }, 0)
    .to('#latam', { xPercent: 320, ease: 'power2.in' }, 0)
    .to('.tagline, .cities, .baseline', { opacity: 0, duration: 0.4 }, 0)
    .fromTo('#portal', { width: 0, height: 0, borderRadius: '42px' }, { width: '340px', height: '560px', borderRadius: '38px', ease: 'power2.out' }, 0)
    .to('#portal', { width: '110vw', height: '110vh', borderRadius: '0', ease: 'power2.inOut' }, 0.34)
    .to('.cover-bg, #coverFx', { opacity: 0, duration: 0.3 }, 0.42)
    .to('.shapes', { opacity: 1, duration: 0.4 }, 0.4)
    .to('#portal', { opacity: 0, duration: 0.35 }, 0.52)
    .fromTo('.pain', { scale: 1.12, opacity: 0 }, { scale: 1, opacity: 1, ease: 'power2.out' }, 0.5)
    .to('.pain', { scale: 2, opacity: 0, ease: 'power2.in' }, 0.74)
    .fromTo('.result', { scale: 0.55, opacity: 0 }, { scale: 1, opacity: 1, ease: 'power2.out' }, 0.76)
    .to('.result', { scale: 2.2, opacity: 0, ease: 'power2.in' }, 0.94);
}

/* --------------------------------------------------------------------------
   Helpers escenas
   -------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------
   Integra — la O de INTEGRAMOS se parte en dos mitades y entre ellas
   aparece una palabra que cicla sola (estrategia → conocimiento → …)
   -------------------------------------------------------------------------- */

const INTEGRA_WORDS = ['ESTRATEGIA', 'CONOCIMIENTO', 'DISEÑO', 'DESARROLLO'];

function measureIword(iword, text) {
  const prevW = iword.style.width;
  const prevText = iword.textContent;
  iword.textContent = text;
  iword.style.width = 'auto';
  const w = iword.offsetWidth;
  iword.style.width = prevW;
  iword.textContent = prevText;
  return w;
}

function startIntegraCycle(panel) {
  if (REDUCED_MOTION || panel._integraOn) return;
  const iword = panel.querySelector('.iword');
  const halves = panel.querySelectorAll('.oh');
  if (!iword) return;
  panel._integraOn = true;
  let idx = 0;

  iword.textContent = INTEGRA_WORDS[0];
  const openW = measureIword(iword, INTEGRA_WORDS[0]);

  // apertura: las mitades de la O laten y el hueco se expande revelando la palabra
  panel._integraOpen = gsap.timeline({ delay: 0.55 })
    .fromTo(halves, { scaleX: 1 }, {
      scaleX: 1.3, yoyo: true, repeat: 1, duration: 0.16, ease: 'power2.inOut', transformOrigin: '50% 50%',
    }, 0)
    .to(iword, { width: openW, opacity: 1, duration: 0.6, ease: 'power3.inOut' }, 0.12);

  const swap = () => {
    const next = INTEGRA_WORDS[(idx + 1) % INTEGRA_WORDS.length];
    idx = (idx + 1) % INTEGRA_WORDS.length;
    const w = measureIword(iword, next);
    gsap.timeline()
      .to(iword, { opacity: 0.12, filter: 'blur(7px)', yPercent: -26, duration: 0.16, ease: 'power2.in' })
      .add(() => { iword.textContent = next; })
      .to(iword, { width: w, duration: 0.3, ease: 'power3.inOut' }, '<')
      .fromTo(iword, { yPercent: 30 }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.32, ease: 'power3.out' });
    panel._integraCall = gsap.delayedCall(2.1, swap);
  };
  panel._integraCall = gsap.delayedCall(2.4, swap);
}

function stopIntegraCycle(panel) {
  if (!panel._integraOn) return;
  panel._integraOn = false;
  if (panel._integraOpen) { panel._integraOpen.kill(); panel._integraOpen = null; }
  if (panel._integraCall) { panel._integraCall.kill(); panel._integraCall = null; }
  const iword = panel.querySelector('.iword');
  if (iword) gsap.set(iword, { width: 0, opacity: 0, yPercent: 0, filter: 'none' });
}

/* Resets para que los efectos de carga se repitan en cada visita */
function resetGestion(panel) {
  const needle = panel.querySelector('.needle');
  if (needle) delete needle.dataset.done;
  panel.querySelectorAll('.barfill').forEach((b) => gsap.set(b, { width: '0%' }));
  const gv = panel.querySelector('.gv');
  if (gv) gv.textContent = '0.0';
}

function resetCounters(panel) {
  panel.querySelectorAll('.counter').forEach((el) => {
    delete el.dataset.counted;
    el.textContent = (el.dataset.prefix || '') + '0' + (el.dataset.suffix || '');
  });
}

function runCounters(panel) {
  panel.querySelectorAll('.counter').forEach((el) => {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const end = +el.dataset.count;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 2.2, ease: 'power2.out',
      onUpdate() { el.textContent = prefix + Math.round(obj.v) + suffix; },
    });
  });
}

function runGestion(panel) {
  const needle = panel.querySelector('.needle');
  if (!needle || needle.dataset.done) return;
  needle.dataset.done = '1';
  // carga visible: aguja lenta con rebote y barras escalonadas
  gsap.fromTo(needle, { rotation: -90 }, { rotation: 41, duration: 2.2, ease: 'power3.inOut' });
  const gv = panel.querySelector('.gv');
  const o = { v: 0 };
  gsap.to(o, { v: 7.3, duration: 2.2, ease: 'power3.inOut', onUpdate() { gv.textContent = o.v.toFixed(1); } });
  panel.querySelectorAll('.barfill').forEach((b, i) => {
    gsap.fromTo(b, { width: '0%' }, { width: b.dataset.w, duration: 1.5, delay: 0.25 + i * 0.3, ease: 'power2.inOut' });
  });
}

let meteorsStarted = false;

/** Capa fija a nivel body: las estrellas no dependen de la opacidad del panel */
function getMeteorLayer() {
  let layer = document.getElementById('meteor-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'meteor-layer';
    document.body.appendChild(layer);
  }
  return layer;
}

function spawnRushStar() {
  if (REDUCED_MOTION) return;
  const box = getMeteorLayer();

  const edge = Math.floor(Math.random() * 4);
  const m = document.createElement('div');
  m.className = 'rush-star';

  const pad = 40;
  const cx = innerWidth * (0.42 + Math.random() * 0.16);
  const cy = innerHeight * (0.38 + Math.random() * 0.18);
  let sx;
  let sy;
  let angle;

  switch (edge) {
    case 0: sx = Math.random() * innerWidth; sy = -pad; angle = 75 + Math.random() * 30; break;
    case 1: sx = innerWidth + pad; sy = Math.random() * innerHeight; angle = 155 + Math.random() * 30; break;
    case 2: sx = Math.random() * innerWidth; sy = innerHeight + pad; angle = 255 + Math.random() * 30; break;
    default: sx = -pad; sy = Math.random() * innerHeight; angle = 25 + Math.random() * 30; break;
  }

  const len = 80 + Math.random() * 160;
  m.style.left = `${sx}px`;
  m.style.top = `${sy}px`;
  m.style.width = `${len}px`;
  m.style.transform = `rotate(${angle}deg)`;

  box.appendChild(m);

  const dx = cx - sx;
  const dy = cy - sy;

  gsap.timeline({ onComplete: () => m.remove() })
    .fromTo(m, { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 0.12 })
    .to(m, {
      x: dx,
      y: dy,
      scale: 2.8,
      opacity: 0,
      duration: 0.75 + Math.random() * 0.35,
      ease: 'power2.in',
    }, 0);
}

function startFinalRush() {
  if (finalRushStarted || REDUCED_MOTION) return;
  finalRushStarted = true;
  // ráfaga inicial densa: las estrellas dominan la pantalla ANTES del texto
  for (let i = 0; i < 12; i++) setTimeout(spawnRushStar, i * 90);
  finalRushInterval = setInterval(spawnRushStar, 420 + Math.random() * 300);
}

function stopFinalRush() {
  if (!finalRushStarted) return;
  finalRushStarted = false;
  if (finalRushInterval) {
    clearInterval(finalRushInterval);
    finalRushInterval = null;
  }
}

/* --------------------------------------------------------------------------
   Menú lateral — aparece al acercar el mouse al borde izquierdo
   -------------------------------------------------------------------------- */

const MENU_ITEMS = [
  ['vision', 'Visión'], ['integra', 'Integramos'], ['nosotros', 'Nosotros'],
  ['industrias', 'Industrias'], ['operamos', 'Operamos'], ['enfoque', 'Enfoque'],
  ['servcards', 'Servicios'], ['generamos', 'Sistema'], ['resultados', 'Resultados'],
  ['casos', 'Casos de éxito'], ['proceso', 'Proceso'], ['designthinking', 'Design thinking'],
  ['partners', 'Partners'], ['sincronizacion', 'Data en vivo'], ['gestion', 'Gestión AI'],
  ['ecosistema', 'Ecosistema'], ['marcas', 'Marcas'], ['finalcover', 'Cierre'],
];
let sideLinks = [];
let sideOpen = false;

function initSideMenu() {
  const hint = document.createElement('div');
  hint.id = 'side-hint';
  const menu = document.createElement('nav');
  menu.id = 'side-menu';
  menu.innerHTML = MENU_ITEMS.map(([id, label]) => {
    const idx = SCENES.findIndex((s) => s.id === id);
    return `<a data-idx="${idx}"><i>${pad2(idx + 1)}</i><span>${label}</span></a>`;
  }).join('');
  document.body.appendChild(hint);
  document.body.appendChild(menu);
  sideLinks = [...menu.querySelectorAll('a')];
  gsap.set(menu, { xPercent: -102 });

  const show = () => {
    if (sideOpen) return;
    sideOpen = true;
    gsap.to(menu, { xPercent: 0, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
    gsap.fromTo(sideLinks, { x: -22, opacity: 0 }, {
      x: 0, opacity: 1, duration: 0.4, stagger: 0.022, ease: 'power2.out', overwrite: 'auto',
    });
    gsap.to(hint, { opacity: 0, duration: 0.25 });
  };
  const hide = () => {
    if (!sideOpen) return;
    sideOpen = false;
    gsap.to(menu, { xPercent: -102, duration: 0.4, ease: 'power3.in', overwrite: 'auto' });
    gsap.to(hint, { opacity: 0.55, duration: 0.3, delay: 0.2 });
  };

  window.addEventListener('mousemove', (e) => {
    if (!sideOpen && e.clientX <= 24) show();
  });
  menu.addEventListener('mouseleave', hide);

  sideLinks.forEach((a) => {
    a.addEventListener('click', () => {
      const idx = +a.dataset.idx;
      if (idx >= 0) scrollToScene(idx);
      hide();
    });
  });
}

function initHeader() {
  const header = document.getElementById('site-header');
  const driver = document.getElementById('scroll-driver');
  if (!header || !driver) return;
  const introShare = INTRO_WEIGHT / (INTRO_WEIGHT + TOTAL_WEIGHT);
  ScrollTrigger.create({
    trigger: driver,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate(self) {
      header.classList.toggle('is-visible', self.progress > introShare * 0.85);
    },
  });
}

function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow || REDUCED_MOTION) return;
  gsap.set(glow, { x: innerWidth / 2, y: innerHeight / 2 });
  window.addEventListener('mousemove', (e) => {
    gsap.to(glow, { x: e.clientX, y: e.clientY, duration: 0.55, ease: 'power2.out', overwrite: 'auto' });
  });
}

function initAmbientMotion() {
  if (REDUCED_MOTION) return;
  gsap.utils.toArray('.fxshapes, #shapes, #ishapes, .global-shapes').forEach((el, i) => {
    gsap.to(el, {
      x: (i % 2 ? 1 : -1) * 18,
      y: (i % 3 ? 1 : -1) * 14,
      duration: 9 + i,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  });
}

// Parallax del mouse deshabilitado: el fondo debe sentirse estable.
// La interactividad del cursor vive en elementos puntuales (tilt de
// tarjetas, hover-grow, magnetismo), no en mover el mundo entero.
function initMouseParallax() { /* intencionalmente vacío */ }

function initPartnersSweep() {
  gsap.to('.pt-box .sweep', { left: '130%', duration: 2.4, repeat: -1, ease: 'power1.inOut', repeatDelay: 1 });
}

/** Torbellino de marcas: anillo 3D girando alrededor del título, arrastrable */
function initMarcasOrbit() {
  const orbit = document.getElementById('mkOrbit');
  if (!orbit) return;
  const stage = orbit.parentElement;
  const cards = BRANDS.map((b) => {
    const d = document.createElement('div');
    d.className = 'mk-card';
    d.innerHTML = `<b>${b}</b>`;
    orbit.appendChild(d);
    return d;
  });
  const N = cards.length;
  let rot = 0;
  let vel = 0;
  let dragging = false;
  let lastPX = 0;
  let R = Math.min(innerWidth * 0.36, 560);
  window.addEventListener('resize', () => { R = Math.min(innerWidth * 0.36, 560); });

  gsap.ticker.add(() => {
    const dt = gsap.ticker.deltaRatio(60);
    if (!dragging) {
      rot += 0.22 * dt; // giro base continuo
      rot += vel;
      vel *= 0.94;
    }
    for (let i = 0; i < N; i++) {
      const a = (i / N) * 360 + rot;
      const rad = (a * Math.PI) / 180;
      const depth = (Math.cos(rad) + 1) / 2; // 1 = frente, 0 = detrás del título
      // billboard: la tarjeta orbita pero siempre mira al espectador
      cards[i].style.transform = `translate(-50%,-50%) rotateY(${a}deg) translateZ(${R}px) rotateY(${-a}deg)`;
      cards[i].style.opacity = (0.14 + depth * 0.86).toFixed(3);
      cards[i].style.zIndex = String(10 + Math.round(depth * 20));
      cards[i].style.filter = depth < 0.35 ? 'blur(1.5px)' : 'none';
    }
  });

  stage.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastPX = e.clientX;
    vel = 0;
    stage.classList.add('is-dragging');
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastPX;
    lastPX = e.clientX;
    rot += dx * 0.25;
    vel = dx * 0.12;
  });
  window.addEventListener('pointerup', () => {
    dragging = false;
    stage.classList.remove('is-dragging');
  });
}

/* --------------------------------------------------------------------------
   Capa interactiva — magnetismo, click FX, scramble, teclado
   -------------------------------------------------------------------------- */

const MAGNETIC_SELECTOR = '.site-nav a, .site-brand, .tool .tile, .ge-pill';

function initMagnetic() {
  if (REDUCED_MOTION) return;
  document.querySelectorAll(MAGNETIC_SELECTOR).forEach((el) => {
    el.classList.add('magnetic');
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: dx * 0.35, y: dy * 0.35, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
    });
  });
}

function spawnRipple(x, y) {
  for (let i = 0; i < 2; i++) {
    const r = document.createElement('div');
    r.className = `click-ripple${i ? ' r2' : ''}`;
    r.style.left = `${x}px`;
    r.style.top = `${y}px`;
    document.body.appendChild(r);
    gsap.fromTo(r, { scale: 0.4, opacity: 1 }, {
      scale: 5.5 + i * 3.5,
      opacity: 0,
      duration: 0.7 + i * 0.25,
      ease: 'power2.out',
      delay: i * 0.06,
      onComplete: () => r.remove(),
    });
  }
}

function spawnBurstDots(x, y) {
  for (let i = 0; i < 10; i++) {
    const d = document.createElement('div');
    d.className = 'burst-dot';
    const color = COLORS[(Math.random() * COLORS.length) | 0];
    d.style.left = `${x}px`;
    d.style.top = `${y}px`;
    d.style.background = color;
    d.style.boxShadow = `0 0 10px ${color}`;
    document.body.appendChild(d);
    const a = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 90;
    gsap.to(d, {
      x: Math.cos(a) * dist,
      y: Math.sin(a) * dist - 18,
      scale: Math.random() * 0.5,
      opacity: 0,
      duration: 0.55 + Math.random() * 0.4,
      ease: 'power2.out',
      onComplete: () => d.remove(),
    });
  }
}

function initClickFX() {
  if (REDUCED_MOTION) return;
  window.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    spawnRipple(e.clientX, e.clientY);
    spawnBurstDots(e.clientX, e.clientY);
    if (typeof Galaxy !== 'undefined') Galaxy.burst(e.clientX, e.clientY);
  });
}

/* Círculos e iconos que crecen elásticos al hover, emitiendo un anillo */
const GROW_SELECTOR = '.cic, .ric, .pic, .tic, .gn, .dt-c, .tool .tile, .pcard2 .o, .eco-list .dot, .mk-dots i, .sv-dot';

function emitHoverRing(el) {
  const r = el.getBoundingClientRect();
  const ring = document.createElement('div');
  ring.className = 'hover-ring';
  const size = Math.max(r.width, r.height);
  ring.style.left = `${r.left + r.width / 2}px`;
  ring.style.top = `${r.top + r.height / 2}px`;
  ring.style.width = `${size}px`;
  ring.style.height = `${size}px`;
  document.body.appendChild(ring);
  gsap.fromTo(ring, { xPercent: -50, yPercent: -50, scale: 0.85, opacity: 0.9 }, {
    xPercent: -50,
    yPercent: -50,
    scale: 2.3,
    opacity: 0,
    duration: 0.7,
    ease: 'power2.out',
    onComplete: () => ring.remove(),
  });
}

function initHoverGrow() {
  if (REDUCED_MOTION) return;
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest ? e.target.closest(GROW_SELECTOR) : null;
    if (!el || el._grown) return;
    el._grown = true;
    gsap.to(el, { scale: 1.22, duration: 0.6, ease: 'elastic.out(1.1, 0.42)', overwrite: 'auto' });
    emitHoverRing(el);
  });
  document.addEventListener('mouseout', (e) => {
    const el = e.target.closest ? e.target.closest(GROW_SELECTOR) : null;
    if (!el || !el._grown) return;
    if (e.relatedTarget && el.contains(e.relatedTarget)) return;
    el._grown = false;
    gsap.to(el, { scale: 1, duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
  });
}

const SCRAMBLE_CHARS = '!<>-_\\/[]{}=+*^?#$%&@';

function scrambleOnce(el) {
  if (el._scrambling) return;
  el._scrambling = true;
  const original = el.dataset.original || el.textContent;
  el.dataset.original = original;
  const obj = { p: 0 };
  gsap.to(obj, {
    p: 1,
    duration: 0.6,
    ease: 'none',
    onUpdate() {
      const reveal = Math.floor(obj.p * original.length);
      let out = '';
      for (let i = 0; i < original.length; i++) {
        if (original[i] === ' ') { out += ' '; continue; }
        out += i < reveal ? original[i] : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
      }
      el.textContent = out;
    },
    onComplete() {
      el.textContent = original;
      el._scrambling = false;
    },
  });
}

function initScramble() {
  if (REDUCED_MOTION) return;
  document.querySelectorAll('.case h3, .site-nav a').forEach((el) => {
    el.classList.add('scramble-live');
    el.addEventListener('mouseenter', () => scrambleOnce(el));
  });
}

function initKeyboardNav() {
  window.addEventListener('keydown', (e) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'];
    if (!keys.includes(e.key)) return;
    const dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
    const sceneP = sceneProgressFromGlobal(lastGlobalProgress);
    const idx = clamp(findActiveSceneIndex(sceneP) + dir, 0, SCENES.length - 1);
    e.preventDefault();
    scrollToScene(idx);
  });
}

/* --------------------------------------------------------------------------
   Init
   -------------------------------------------------------------------------- */

function init() {
  if (!REDUCED_MOTION && typeof Galaxy !== 'undefined') {
    Galaxy.init();
    Galaxy.startLoop();
  }
  initGlobalUniverse();
  initSceneBackgrounds();
  buildDesignThinkingFlow();
  buildToolsGrid();
  initServicesCards();
  initIntro();
  initScrollEngine();
  prepareTextAnimations();
  initSceneNav();
  initHeader();
  initPartnersSweep();
  initMarcasOrbit();
  initSideMenu();
  initCursorGlow();
  initAmbientMotion();
  initMouseParallax();
  initCardTilt3D();
  initMagnetic();
  initClickFX();
  initScramble();
  initHoverGrow();
  initKeyboardNav();
  initLenis();
  ScrollTrigger.refresh();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
