/**
 * FAD LATAM — Motor de experiencia (cliente)
 * Lenis + GSAP ScrollTrigger + escenas inmersivas
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Galaxy } from '../galaxy.js';
import {
  SCENES,
  TOTAL_WEIGHT,
  SCROLL_CONFIG,
  SCENE_PALETTES,
  PARTICLE_COLORS,
} from '../../data/scenes.ts';
import {
  services as SERVICES_DATA,
  designThinkingFlow as DESIGN_THINKING_FLOW,
  tools as TOOLS_DATA,
  brands as BRANDS,
} from '../../data/content.ts';

gsap.registerPlugin(ScrollTrigger);

const COLORS = [...PARTICLE_COLORS];
const ALLSHAPES = [];
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const {
  introWeight: INTRO_WEIGHT,
  scrollLength: SCROLL_LENGTH,
  enterEnd: ENTER_END,
  exitStart: EXIT_START,
  contentShowAt: CONTENT_SHOW_AT,
  contentHideAt: CONTENT_HIDE_AT,
  fastScrollThreshold: FAST_SCROLL_THRESHOLD,
  introBlend: INTRO_BLEND,
} = SCROLL_CONFIG;

let lenis;
let scenePanels = [];
let introScrollTl;
let scrollTriggerRef;
let scrollParticleBox;
let particleTunnel;
let lastParticleProgress = 0;
let smoothTunnelProgress = 0;
const MAX_PARTICLES = 18;
const EDGE_PARTICLES = 8;
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
  '.mk-title', '.mk-sub', '.ops-text', '.ih', '.ind-track',
  '.vis-sub', '.vis-body', '.vh b', '.vh .it', '.vis-img',
  '.ecard', '.gcard', '.rcard', '.pcard', '.eco-cap', '.case', '.tool', '.dt-c', '.team-bar',
  '.case h3', '.case .meta', '.ecard h3', '.ecard p', '.gcard h3', '.gcard p',
  '.pcard h3', '.pcard p', '.eco-cap h3', '.eco-cap p',
  '.svcard .sv-headline', '.svcard .sv-lead', '.svcard .sv-num', '.svcard .sv-tags',
  '.rcard .big', '.rcard .lbl', '.pt-text', '.sy-title', '.ge-title',
  '.fc-logo', '.fc-url', '.iword-slot',
].join(', ');

function getContentLeaves(inner) {
  if (!inner) return [];
  return [...inner.querySelectorAll(CONTENT_LEAVES)].filter((el) => !el.classList.contains('sv-eyebrow'));
}

function hideInactiveServiceCards(inner) {
  if (!inner) return;
  inner.querySelectorAll('.svcard').forEach((card) => {
    gsap.set(card, { opacity: 1, visibility: 'visible', pointerEvents: 'auto' });
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
    gsap.set(c, { y: 0, filter: 'none' });
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
  inner.querySelectorAll('.sv-eyebrow').forEach((el) => {
    gsap.set(el, { opacity: 1, y: 0, scale: 1, filter: 'none', clearProps: 'transform' });
  });
  gsap.set(getContentLeaves(inner), { opacity: 1, y: 0, x: 0, scale: 1, filter: 'none' });
  // chars de decode/type: visibles con su texto real
  const glyphs = inner.querySelectorAll('.c, .ch, .tc');
  if (glyphs.length) gsap.set(glyphs, { opacity: 1, y: 0, filter: 'none' });
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
  const skip = (el) => el.classList?.contains('bgfx')
    || el.classList?.contains('meteors')
    || el.classList?.contains('spotlights');
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
      clip: `inset(${(1 - t) * 42}% 0% 0% 0%)`,
    };
  }
  if (phase === 'hold') {
    return { opacity: 1, z: t * HOLD_Z * 0.7, clip: 'inset(0% 0% 0% 0%)' };
  }
  return {
    opacity: 1 - t * 0.5, z: HOLD_Z * 0.7 + t * 170, y: t * -60, blur: t * 6,
    clip: `inset(0% 0% ${t * 42}% 0%)`,
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
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1.2,
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

function updateIsotipo(globalProgress) {
  const el = document.getElementById('universe-isotipo');
  if (!el) return;
  // Se acerca / crece con el recorrido (sustituye al planeta WebGL)
  const p = clamp(globalProgress, 0, 1);
  const scale = 0.72 + p * 0.55;
  const x = 18 - p * 8;
  const y = Math.sin(p * Math.PI * 2) * 2.5;
  const opacity = 0.08 + p * 0.1; // tenue en todas las pantallas
  el.style.setProperty('--iso-x', `${x}%`);
  el.style.setProperty('--iso-y', `${y}%`);
  el.style.setProperty('--iso-scale', scale.toFixed(3));
  el.style.opacity = String(opacity);
}

function updateBackground(globalProgress, scrollDelta = 0) {
  updateScrollParticles(globalProgress);
  updateIsotipo(globalProgress);
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
  const p = clamp(t, 0, 1);
  introScrollTl.progress(p);
  syncIntroVideoUi(p);
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
  const introShare = INTRO_WEIGHT / (INTRO_WEIGHT + TOTAL_WEIGHT);
  const onIntro = lastGlobalProgress < introShare * 0.85;
  if (cur) cur.textContent = pad2(activeIndex + 1);
  if (tot) tot.textContent = pad2(SCENES.length);
  // Menú = las 17 escenas; en intro ninguna queda activa
  sideLinks.forEach((link) => {
    const idx = Number(link.dataset.idx);
    link.classList.toggle('is-on', !onIntro && idx === activeIndex);
  });
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
      if (id === 'finalcover') { stopFinalRush(); resetSpotlights(panel); }
      if (id === 'integra') resetIntegraWords(panel);
      if (id === 'industrias') stopIndustriasCycle(panel);
      if (id === 'servcards') stopServcardsAuto();
      if (id === 'gestion') resetGestion(panel);
      if (id === 'resultados') resetCounters(panel);
      return;
    }

    let local = clamp((sceneProgress - segStart) / (segEnd - segStart), 0, 1);
    // finalcover: el texto espera — primero la pantalla se llena de estrellas fugaces
    const contentShowAt = (id === 'vision' || id === 'proceso') ? 0 : (id === 'finalcover' ? 0.34 : CONTENT_SHOW_AT);
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
    // Zoom interno del fondo: escala con el progreso local de la escena
    // (1 -> 1.5) ademas del parallax z; asi el universo "se acerca" al avanzar.
    if (bg) {
      gsap.set(bg, {
        z: -320 + depthZ * 0.7,
        scale: 1 + local * 0.5,
        opacity: 0.3,
        force3D: true,
      });
    }

    // Las estrellas fugaces del cierre arrancan apenas la portada asoma,
    // antes de que el texto entre siquiera; los reflectores barren desde el
    // canto derecho y convergen sobre el nombre.
    if (id === 'finalcover' && panelOpacity > 0.02) {
      startFinalRush();
      updateSpotlights(panel, local, contentShowAt);
    }

    if (local > CONTENT_HIDE_AT) {
      panelPhase.set(id, 'exit');
      killIdleFloat(inner);
      applyContentExit(inner, (local - CONTENT_HIDE_AT) / (1 - CONTENT_HIDE_AT));
      animatedPanels.delete(id);
      if (id === 'integra') resetIntegraWords(panel);
      if (id === 'industrias') stopIndustriasCycle(panel);
      if (id === 'servcards') stopServcardsAuto();
      if (id === 'gestion') resetGestion(panel);
      if (id === 'resultados') resetCounters(panel);
    } else if (local < contentShowAt) {
      panelPhase.set(id, scrollingBack ? 'exit' : 'enter');
      killIdleFloat(inner);
      if (id === 'vision' && i === activeIdx) ensureContentVisible(inner);
      else hideContentLeaves(inner);
      animatedPanels.delete(id);
      if (id === 'integra') resetIntegraWords(panel);
      if (id === 'industrias') stopIndustriasCycle(panel);
      if (id === 'servcards') stopServcardsAuto();
      if (id === 'gestion') resetGestion(panel);
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
const PAR_DOWN = '.ecards, .gcards, .rcards, .pcards, .dt-steps, .pt-items, .tools, .team-bar, .eco-caps, .dash';

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
    case 'integra':
      updateIntegraWords(panel, hold, fastScroll);
      break;
    case 'industrias':
      updateIndustriasWords(panel, hold, fastScroll);
      break;
    /* servcards: rail horizontal — ver playServcardsEnter */
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
    scrub: 0.85,
    invalidateOnRefresh: true,
    onUpdate(self) {
      updateExperience(self.progress);
      updateScrollUI(self.progress, lenis?.scroll ?? window.scrollY);
    },
  });

  updateExperience(0);
}

function scrollToIntro() {
  const driver = document.getElementById('scroll-driver');
  const trigger = scrollTriggerRef || ScrollTrigger.getAll().find((t) => t.trigger === driver);
  if (!trigger || !lenis) return;
  lenis.scrollTo(trigger.start, { duration: 2.4 });
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
      if (id === 'intro') {
        e.preventDefault();
        scrollToIntro();
        return;
      }
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

// Isotipos de ambiente: blancos visibles sobre el degradado.
function particleOpacityFromZ(z) {
  if (z < -1150) return 0.18;
  if (z < -880) return 0.2 + ((z + 1150) / 270) * 0.12;
  if (z > 340) return Math.max(0.14, 1 - (z - 340) / 320) * 0.32;
  return 0.22 + clamp((z + 880) / 1220, 0, 1) * 0.18;
}

function particleScaleFromZ(z) {
  return 0.12 + clamp((z + 950) / 1350, 0, 1) * 1.75;
}

// Misma URL animada en todos → el browser comparte el decode; se ve el loop del isotipo
const ISOTIPO_PARTICLE_SRC = '/images/logos/Isotipo_fadlatam_slow.webp';

function addOneShape(box, opts = {}) {
  const depth = opts.depth ?? Math.random();
  let left;
  let top;

  if (opts.edge != null) {
    const pad = 2 + Math.random() * 8;
    switch (opts.edge) {
      case 0: left = pad + Math.random() * (100 - pad * 2); top = pad + Math.random() * 14; break;
      case 1: left = 100 - pad - Math.random() * 14; top = pad + Math.random() * (100 - pad * 2); break;
      case 2: left = pad + Math.random() * (100 - pad * 2); top = 100 - pad - Math.random() * 14; break;
      default: left = pad + Math.random() * 14; top = pad + Math.random() * (100 - pad * 2); break;
    }
  } else {
    // Dispersión amplia por todo el viewport (evita agruparse al centro)
    left = 3 + Math.random() * 94;
    top = 4 + Math.random() * 92;
  }

  // Tamaños variados: pequeños / medios / grandes
  const sizeRoll = Math.random();
  let size;
  if (sizeRoll < 0.45) size = 22 + Math.random() * 28;
  else if (sizeRoll < 0.8) size = 48 + Math.random() * 36;
  else size = 84 + Math.random() * 52;

  // Opacidad base distinta por partícula (legible en blanco)
  const opMul = 0.55 + Math.random() * 0.4;

  const wrap = document.createElement('div');
  wrap.className = 'sh sh-3d sh-iso-wrap';
  wrap.dataset.depth = depth.toFixed(3);
  wrap.dataset.opMul = opMul.toFixed(3);
  const bobDur = (7 + Math.random() * 6).toFixed(2);
  const bobDelay = (Math.random() * 5).toFixed(2);
  wrap.style.cssText = `width:${size}px;height:${size}px;left:${left}%;top:${top}%;--iso-bob-dur:${bobDur}s;--iso-bob-delay:${bobDelay}s`;

  const inner = document.createElement('img');
  inner.className = 'sh-iso';
  inner.src = ISOTIPO_PARTICLE_SRC;
  inner.alt = '';
  inner.decoding = 'async';
  inner.draggable = false;

  wrap.appendChild(inner);
  box.appendChild(wrap);

  const spawnZ = opts.spawnZ ?? (-720 + depth * 900);
  wrap.dataset.scrollZ = String(spawnZ);
  const startOp = particleOpacityFromZ(spawnZ) * opMul;
  gsap.set(wrap, {
    z: spawnZ,
    scale: particleScaleFromZ(spawnZ),
    opacity: startOp,
    force3D: true,
  });

  // Movimiento orbital suave siempre activo (independiente del scroll)
  gsap.to(wrap, {
    x: (Math.random() - 0.5) * 240,
    y: (Math.random() - 0.5) * 200,
    rotation: (Math.random() - 0.5) * 28,
    duration: 5 + Math.random() * 7,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
    delay: Math.random() * 0.4,
  });

  ALLSHAPES.push({ wrap, inner, depth, opMul });
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
  b1.style.cssText = 'width:42vw;height:42vw;left:-10vw;top:10%;background:rgba(42,54,226,.4)';
  const b2 = document.createElement('div');
  b2.className = 'blob';
  b2.style.cssText = 'width:38vw;height:38vw;right:-8vw;bottom:-4vw;background:rgba(128,59,248,.4)';
  layer.appendChild(b1);
  layer.appendChild(b2);
  gsap.to(b1, { x: '14vw', y: '6vh', scale: 1.15, duration: 11, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to(b2, { x: '-12vw', y: '-5vh', scale: 1.1, duration: 13, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

function initGlobalUniverse() {
  const layer = document.getElementById('universe-particles');
  if (!layer) return;

  particleTunnel = document.createElement('div');
  particleTunnel.className = 'particle-tunnel';

  const shapes = document.createElement('div');
  shapes.className = 'fxshapes global-shapes';
  particleTunnel.appendChild(shapes);
  layer.appendChild(particleTunnel);

  scrollParticleBox = shapes;
  const startPalette = getPaletteForProgress(0);
  for (let i = 0; i < 10; i++) {
    addOneShape(shapes, {
      depth: Math.random(),
      colors: startPalette,
      spawnZ: -280 + Math.random() * 420,
    });
  }
  addEdgeParticles(shapes, EDGE_PARTICLES);
}

function updateScrollParticles(progress) {
  if (!particleTunnel || REDUCED_MOTION) return;

  const delta = progress - lastParticleProgress;
  lastParticleProgress = progress;
  smoothTunnelProgress += (progress - smoothTunnelProgress) * 0.1;
  const p = smoothTunnelProgress;
  const absDelta = Math.abs(delta);
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
    scrollParticleBox.querySelectorAll('.sh-3d').forEach((wrap) => {
      let z = parseFloat(wrap.dataset.scrollZ || '-200');
      z += delta * 1800;
      while (z > 480) z -= 1400;
      while (z < -1100) z += 1400;
      wrap.dataset.scrollZ = String(z);

      const opMul = parseFloat(wrap.dataset.opMul || '1');
      gsap.set(wrap, {
        z,
        opacity: particleOpacityFromZ(z) * opMul,
        scale: particleScaleFromZ(z),
        force3D: true,
      });
    });

    const minCount = 12;
    while (scrollParticleBox.children.length < minCount && scrollParticleBox.children.length < MAX_PARTICLES) {
      addOneShape(scrollParticleBox, {
        depth: Math.random(),
        colors: palette,
        spawnZ: -220 + Math.random() * 380,
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
  '.dt-step p', '.sv-lead', '.eco-cap p', '.pt-item p', '.sy-tool p',
].join(', ');

const DECODE_MAX_DURATION = 1.05;

/**
 * Reveal suave de títulos: fade + leve blur/y por carácter.
 * Sin glifos aleatorios ni glow agresivo en el frente de onda.
 */
function decodeTitle(el, dur) {
  const chars = [...el.querySelectorAll('.c, .ch')];
  if (!chars.length) return;
  chars.forEach((c) => {
    if (!c.dataset.orig) c.dataset.orig = c.textContent;
    c.textContent = c.dataset.orig;
    c.classList.remove('c-hot');
  });
  if (el._decode) el._decode.kill();
  gsap.set(chars, { opacity: 0, y: 5, filter: 'blur(3px)' });
  const maxDur = dur || DECODE_MAX_DURATION;
  const stagger = Math.min(0.014, maxDur / Math.max(chars.length, 1));
  el._decode = gsap.to(chars, {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: 0.38,
    stagger,
    ease: 'power2.out',
    onComplete: () => { el._decode = null; },
  });
}

/** Divide cada palabra (.w) de un título en caracteres (.c) */
function splitWordChars(el) {
  if (el.dataset.wchars) return;
  el.dataset.wchars = '1';
  // Primero palabras (.w): el wrap solo ocurre entre espacios, no a mitad de palabra
  if (!el.querySelector('.w') && !el.querySelector('.ch')) splitFxWords(el);
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

  const labels = inner.querySelectorAll('.eyebrow2:not(.sv-eyebrow), .num, .mk-sub');
  const decodeEls = inner.querySelectorAll(DECODE_SELECTOR);
  const lines = inner.querySelectorAll('.fx-ch');
  const typeEls = inner.querySelectorAll(TYPE_SELECTOR);
  const blocks = inner.querySelectorAll('.ecard, .gcard, .rcard, .pcard, .eco-cap, .case, .tool, .dt-c, .team-bar, .pt-item, .sy-tool, .gm, .dt-step, .ge-pill, .dash, .rv:not(.ecard):not(.gcard):not(.rcard):not(.pcard):not(.eco-cap):not(.case):not(.tool):not(.team-bar):not(.pt-item):not(.sy-tool):not(.gm):not(.dt-step):not(.ge-pill):not(.dash)');
  const plain = inner.querySelectorAll('.vis-sub:not(.typewriter), .ih');

  /* 0 — solo los chars de decode/typing se ocultan a mano (los revela un
     callback, no un .from()). Las tarjetas/planos NO se tocan aquí: sus
     .from() con immediateRender:true ya leen el estado visible que dejó
     ensureContentVisible() como destino y aplican el estado oculto en este
     mismo tick. Si los pusiéramos a opacity:0 antes, el .from() leería 0
     como destino y animaría "de 0 a 0" (nunca aparecerían). */
  decodeEls.forEach((el) => {
    const cs = el.querySelectorAll('.c, .ch');
    if (cs.length) gsap.set(cs, { opacity: 0, y: 5, filter: 'blur(3px)' });
  });
  typeEls.forEach((el) => {
    const cs = el.querySelectorAll('.tc');
    if (cs.length) gsap.set(cs, { opacity: 0 });
  });

  /* 1 — etiquetas de sección: entrada suave */
  if (labels.length) {
    tl.from(labels, {
      opacity: 0, y: 22, scale: 0.97, letterSpacing: '0.14em', duration: 0.62, stagger: 0.06, ease: 'power2.out',
    }, 0);
  }

  /* 2 — títulos: reveal suave letra a letra */
  decodeEls.forEach((el, i) => {
    const words = el.querySelectorAll('.w');
    if (words.length) gsap.set(words, { opacity: 1, y: 0, x: 0, scale: 1, filter: 'none' });
    tl.add(() => decodeTitle(el), 0.08 + i * 0.06);
  });

  /* 3 — líneas de la visión */
  if (lines.length) {
    tl.from(lines, {
      opacity: 0, y: 44, z: -70, rotationX: -22, scale: 0.94, transformOrigin: '50% 100%',
      duration: 0.82, stagger: 0.1, ease: 'power2.out',
    }, 0.06);
  }

  plain.forEach((el) => tl.from(el, {
    opacity: 0, y: 28, scale: 0.98, filter: 'blur(4px)', duration: 0.72, ease: 'power2.out',
  }, 0.14));

  /* 4 — tarjetas: aterrizan con movimiento más contenido */
  const CARD_EACH = 0.1;
  const CARD_START = 0.18;
  if (blocks.length) {
    tl.from(blocks, {
      opacity: 0,
      y: 44,
      z: -100,
      rotationY: (i) => (i % 2 === 0 ? -24 : 24),
      transformOrigin: (i) => (i % 2 === 0 ? '0% 50%' : '100% 50%'),
      scale: 0.94,
      filter: 'blur(5px)',
      duration: 0.62,
      stagger: CARD_EACH,
      ease: 'power2.out',
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
  if (id === 'servcards') playServcardsEnter(inner, tl);
  if (id === 'integra') resetIntegraWords(panel);
  if (id === 'industrias') startIndustriasCycle(panel);
  if (id === 'gestion') tl.add(() => runGestion(panel), CARD_START + 0.55);
  tl.eventCallback('onComplete', () => {
    playIdleFloat(inner);
    settleCardDepth(inner);
    if (id === 'servcards') startServcardsAuto();
  });
}

const TILT_SELECTOR = '.ecard, .gcard, .pcard, .eco-cap, .rcard, .case, .tool, .pt-item, .sy-tool, .gm, .dt-step, .pcard2, .svcard';

// Deja cada tarjeta reposando en su propio plano de profundidad (no todas
// pegadas al mismo z) para que la grilla se sienta un espacio 3D real,
// listo para que el tilt del mouse las mueva desde ahí.
function settleCardDepth(inner) {
  if (REDUCED_MOTION) return;
  const cards = inner.querySelectorAll(TILT_SELECTOR);
  cards.forEach((c, i) => {
    if (c._depthSet) return;
    c._depthSet = true;
    const isEcoTool = c.classList.contains('tool') && c.closest('#ecosistema');
    gsap.set(c, {
      z: isEcoTool ? 0 : (i % 2 === 0 ? 22 : -22),
      rotationY: isEcoTool ? 0 : (i % 2 === 0 ? -2.5 : 2.5),
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
  const isEcoTool = card.classList.contains('tool') && card.closest('#ecosistema');
  const idx = [...card.parentNode.children].indexOf(card);
  const base = card._depthSet && !isEcoTool ? (idx % 2 === 0 ? 22 : -22) : 0;
  const baseRotY = card._depthSet && !isEcoTool ? (idx % 2 === 0 ? -2.5 : 2.5) : 0;
  gsap.to(card, {
    rotationY: baseRotY, rotationX: 0, z: base, scale: 1,
    duration: 0.7, ease: 'power3.out', overwrite: 'auto',
  });
}

const IDLE_FLOAT_SELECTOR = '.sech, .nh, .lead, .dt-title, .mk-title, .sv-headline, .ih, .vh b';

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
      y: '+=5',
      duration: 4.2 + (i % 3) * 0.6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: i * 0.2,
    });
  });
}

function initSceneBackgrounds() {
  /* Fondo único: imagen en #page-bg. Sin blobs ni gradientes por sección. */
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
  TOOLS_DATA.forEach((tool) => {
    const d = document.createElement('div');
    d.className = 'tool';
    d.innerHTML = `<div class="tile"><img src="${tool.icon}" alt="" width="40" height="40" decoding="async" /></div><span>${tool.name}</span>`;
    box.appendChild(d);
  });
}

function initServicesCards() {
  const stage = document.getElementById('svStage');
  if (!stage || stage.children.length) return;

  SERVICES_DATA.forEach((s) => {
    const c = document.createElement('article');
    c.className = 'svcard';
    c.setAttribute('role', 'listitem');
    c.innerHTML = `
      <div class="sv-card-inner">
        <span class="sv-num">${s.n}</span>
        <h2 class="sv-headline">${s.t}</h2>
        <p class="sv-lead">${s.d.replace(/<\/?b>/g, '')}</p>
        <ul class="sv-tags">${s.tags.map((t) => `<li>${t}</li>`).join('')}</ul>
      </div>`;
    stage.appendChild(c);
  });
}

function playServcardsEnter(inner, tl) {
  const eyebrow = inner.querySelector('.sv-eyebrow');
  const cards = [...inner.querySelectorAll('.svcard')];
  const hint = inner.querySelector('.sv-scroll-hint');

  if (eyebrow) {
    gsap.set(eyebrow, { opacity: 1 });
    tl.from(eyebrow, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' }, 0);
  }
  if (cards.length) {
    tl.from(cards, {
      opacity: 0,
      y: 48,
      x: 32,
      scale: 0.94,
      filter: 'blur(8px)',
      duration: 0.7,
      stagger: 0.11,
      ease: 'power3.out',
    }, 0.12);
    cards.forEach((card, i) => {
      tl.add(() => scanSweep(card), 0.38 + i * 0.11);
    });
  }
  if (hint) {
    tl.from(hint, { opacity: 0, y: 10, duration: 0.5, ease: 'power2.out' }, 0.55);
  }
  const dots = inner.querySelector('#svDots');
  if (dots) {
    tl.from(dots.querySelectorAll('.sv-dot'), {
      opacity: 0,
      y: 8,
      duration: 0.4,
      stagger: 0.06,
      ease: 'power2.out',
    }, 0.62);
  }
}

let servcardsAutoTimer = null;
let servcardsAutoPaused = false;
let servcardsCardIdx = 0;
let servcardsRailBound = false;

function getServcardsRail() {
  return document.querySelector('#servcards .sv-rail');
}

function updateServcardsDots(index) {
  document.querySelectorAll('#svDots .sv-dot').forEach((dot, i) => {
    dot.classList.toggle('is-on', i === index);
    dot.setAttribute('aria-current', i === index ? 'true' : 'false');
  });
}

function syncServcardsDotFromScroll() {
  const rail = getServcardsRail();
  if (!rail) return;
  const cards = [...rail.querySelectorAll('.svcard')];
  if (!cards.length) return;
  const pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
  const probe = rail.scrollLeft + pad + 24;
  let idx = 0;
  cards.forEach((card, i) => {
    if (card.offsetLeft <= probe) idx = i;
  });
  servcardsCardIdx = idx;
  updateServcardsDots(idx);
}

function scrollServcardTo(index, { animate = true, pauseAuto = false } = {}) {
  const rail = getServcardsRail();
  if (!rail) return;
  const cards = rail.querySelectorAll('.svcard');
  const card = cards[index];
  if (!card) return;

  const pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
  const target = Math.max(0, card.offsetLeft - pad);
  servcardsCardIdx = index;

  if (pauseAuto) {
    servcardsAutoPaused = true;
    clearTimeout(rail._wheelResume);
    rail._wheelResume = setTimeout(() => { servcardsAutoPaused = false; }, 3200);
  }

  if (animate && !REDUCED_MOTION) {
    gsap.to(rail, {
      scrollLeft: target,
      duration: 0.85,
      ease: 'power2.inOut',
      overwrite: 'auto',
      onUpdate: () => syncServcardsDotFromScroll(),
      onComplete: () => updateServcardsDots(index),
    });
  } else {
    rail.scrollLeft = target;
    updateServcardsDots(index);
  }
}

function stopServcardsAuto(resetScroll = true) {
  if (servcardsAutoTimer) clearInterval(servcardsAutoTimer);
  servcardsAutoTimer = null;
  servcardsAutoPaused = false;
  servcardsCardIdx = 0;
  if (resetScroll) {
    const rail = getServcardsRail();
    if (rail) {
      gsap.set(rail, { scrollLeft: 0 });
      updateServcardsDots(0);
    }
  }
}

function startServcardsAuto() {
  if (servcardsAutoTimer) clearInterval(servcardsAutoTimer);
  servcardsAutoTimer = null;
  servcardsAutoPaused = false;
  if (REDUCED_MOTION) return;

  const rail = getServcardsRail();
  if (!rail || rail.scrollWidth <= rail.clientWidth + 4) return;

  servcardsAutoTimer = setInterval(() => {
    if (servcardsAutoPaused) return;
    const cards = rail.querySelectorAll('.svcard');
    if (!cards.length) return;
    scrollServcardTo((servcardsCardIdx + 1) % cards.length);
  }, 4200);
}

function initServcardsRail() {
  const rail = getServcardsRail();
  if (!rail || servcardsRailBound) return;
  servcardsRailBound = true;

  const dotsNav = document.getElementById('svDots');
  dotsNav?.querySelectorAll('.sv-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = Number(dot.dataset.idx);
      if (!Number.isNaN(idx)) scrollServcardTo(idx, { pauseAuto: true });
    });
  });

  // Solo gestos horizontales (trackpad / shift+rueda) mueven el rail.
  // La rueda vertical la deja Lenis → no se queda atrapada la sección.
  rail.addEventListener('wheel', (e) => {
    if (rail.scrollWidth <= rail.clientWidth) return;
    const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
    if (!horizontal) return;

    const dx = e.shiftKey ? e.deltaY : e.deltaX;
    if (!dx) return;

    e.preventDefault();
    e.stopPropagation();
    servcardsAutoPaused = true;
    rail.scrollLeft += dx * 0.9;
    syncServcardsDotFromScroll();
    clearTimeout(rail._wheelResume);
    rail._wheelResume = setTimeout(() => { servcardsAutoPaused = false; }, 2400);
  }, { passive: false });

  rail.addEventListener('scroll', () => {
    clearTimeout(rail._scrollSync);
    rail._scrollSync = setTimeout(syncServcardsDotFromScroll, 60);
  }, { passive: true });

  rail.addEventListener('mouseenter', () => { servcardsAutoPaused = true; });
  rail.addEventListener('mouseleave', () => { servcardsAutoPaused = false; });

  rail.querySelectorAll('.svcard').forEach((card) => {
    card.classList.add('glare-host');
    card.addEventListener('mouseenter', () => { servcardsAutoPaused = true; });
    card.addEventListener('mouseleave', () => {
      if (!rail.matches(':hover')) servcardsAutoPaused = false;
    });
  });

  updateServcardsDots(0);
}

/* --------------------------------------------------------------------------
   Intro
   -------------------------------------------------------------------------- */

function initIntroVideo() {
  const video = document.getElementById('intro-video');
  if (!video) return;
  video.muted = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  try { video.load(); } catch { /* ignore */ }
}

function playIntroVideo(video, portal) {
  if (!video || !portal) return;
  video.muted = true;
  const p = video.play();
  if (p?.catch) p.catch(() => {});
  portal.classList.add('is-playing');
  portal.setAttribute('aria-hidden', 'false');
}

function syncIntroVideoUi(t) {
  const portal = document.getElementById('portal');
  const video = document.getElementById('intro-video');
  if (!portal) return;
  // Portal ya grande y aún visible → reproduce solo con el scroll
  const ready = t > 0.14 && t < 0.74;
  portal.classList.toggle('is-ready', ready);

  if (!video) return;

  if (t < 0.06) {
    portal.classList.remove('is-playing');
    video.pause();
    try { video.currentTime = 0; } catch { /* ignore */ }
    return;
  }

  if (ready) {
    if (video.paused || !portal.classList.contains('is-playing')) {
      playIntroVideo(video, portal);
    }
    return;
  }

  // Fuera de la ventana del portal: pausa (al volver a entrar, el scroll lo reanuda)
  if (!video.paused) video.pause();
}

function initIntro() {
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.tagline', { opacity: 0, scale: 0.94, duration: 1.1 })
    .from('.logo', { opacity: 0, scale: 0.92, duration: 1.1 }, '-=.7')
    .from('.baseline', { scaleX: 0, transformOrigin: 'left', duration: 1.1 }, '-=.7');

  initIntroVideo();

  // Portal vertical (portrait ~9:16) hasta el fill final.
  // ease:'none': scrub continuo (evitar min()/clamp en props animadas).
  introScrollTl = gsap.timeline({ paused: true })
    .to('.logo', { opacity: 0, scale: 0.88, ease: 'none' }, 0)
    .to('.tagline, .baseline', { opacity: 0, duration: 0.35, ease: 'none' }, 0)
    .fromTo('#portal',
      { width: '0vw', height: '0vh', borderRadius: '0px', opacity: 1 },
      { width: '22vw', height: '62vh', borderRadius: '0px', ease: 'none', duration: 0.28 },
      0)
    .to('#portal', {
      width: '32vw',
      height: '84vh',
      borderRadius: '0px',
      ease: 'none',
      duration: 0.26,
    }, 0.28)
    .to('#portal', {
      width: '110vw',
      height: '110vh',
      borderRadius: '0px',
      ease: 'none',
      duration: 0.2,
    }, 0.54)
    .to('.cover-bg, #coverFx', { opacity: 0, duration: 0.28, ease: 'none' }, 0.2)
    .to('.shapes', { opacity: 1, duration: 0.35, ease: 'none' }, 0.25)
    .to('#portal', { opacity: 0, duration: 0.28, ease: 'none' }, 0.74)
    .fromTo('.pain', { scale: 1.12, opacity: 0 }, { scale: 1, opacity: 1, ease: 'none', duration: 0.14 }, 0.7)
    .to('.pain', { scale: 2, opacity: 0, ease: 'none', duration: 0.12 }, 0.84)
    .fromTo('.result', { scale: 0.55, opacity: 0 }, { scale: 1, opacity: 1, ease: 'none', duration: 0.12 }, 0.86)
    .to('.result', { scale: 2.2, opacity: 0, ease: 'none', duration: 0.12 }, 0.98);
}

/* --------------------------------------------------------------------------
   Helpers escenas
   -------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------
   Industrias — REAL ESTATE ↔ GASTRONOMÍA por scroll o flechas ←/→
   -------------------------------------------------------------------------- */

const INDUSTRIAS_WORDS = ['REAL ESTATE', 'GASTRONOMÍA'];
const INDUSTRIAS_DEPTH_DUR = 0.45;

function getIndustriaLayers(panel) {
  return {
    a: panel.querySelector('#indWordA'),
    b: panel.querySelector('#indWordB'),
  };
}

function getActiveIndWord(panel) {
  return panel.querySelector('.indword.is-active') || panel.querySelector('#indWordA');
}

function getIdleIndWord(panel) {
  const { a, b } = getIndustriaLayers(panel);
  if (!a || !b) return null;
  return a.classList.contains('is-active') ? b : a;
}

function transitionIndustriaTo(panel, nextIdx, animate = true) {
  if (!panel._industriasOn) return;
  const n = INDUSTRIAS_WORDS.length;
  nextIdx = clamp(nextIdx, 0, n - 1);
  if (panel._industriasIdx === nextIdx && panel._industriasReady) return;

  const active = getActiveIndWord(panel);
  const next = getIdleIndWord(panel);
  if (!active || !next) return;

  if (!animate || REDUCED_MOTION) {
    if (panel._industriasTL) { panel._industriasTL.kill(); panel._industriasTL = null; }
    active.classList.remove('is-active');
    next.classList.add('is-active');
    next.textContent = INDUSTRIAS_WORDS[nextIdx];
    active.textContent = INDUSTRIAS_WORDS[panel._industriasIdx ?? 0];
    gsap.set(active, { opacity: 0, visibility: 'hidden', scale: 1, z: 0, filter: 'none', xPercent: -50, yPercent: -50 });
    gsap.set(next, { opacity: 1, visibility: 'visible', scale: 1, z: 0, filter: 'none', xPercent: -50, yPercent: -50 });
    active.setAttribute('aria-hidden', 'true');
    next.setAttribute('aria-hidden', 'false');
    panel._industriasIdx = nextIdx;
    panel._industriasReady = true;
    return;
  }

  next.textContent = INDUSTRIAS_WORDS[nextIdx];
  next.setAttribute('aria-hidden', 'false');
  active.setAttribute('aria-hidden', 'true');

  gsap.set(next, {
    opacity: 0,
    scale: 1.28,
    z: 260,
    xPercent: -50,
    yPercent: -50,
    filter: 'blur(10px)',
    transformOrigin: '50% 50%',
    visibility: 'visible',
    force3D: true,
  });

  if (panel._industriasTL) panel._industriasTL.kill();
  panel._industriasTL = gsap.timeline({
    onComplete: () => {
      active.classList.remove('is-active');
      next.classList.add('is-active');
      panel._industriasIdx = nextIdx;
      panel._industriasReady = true;
      gsap.set(active, { clearProps: 'transform,filter,opacity' });
      active.style.opacity = '0';
      active.style.visibility = 'hidden';
      next.style.visibility = 'visible';
    },
  })
    .to(active, {
      opacity: 0,
      scale: 0.68,
      z: -300,
      xPercent: -50,
      yPercent: -50,
      filter: 'blur(8px)',
      duration: INDUSTRIAS_DEPTH_DUR,
      ease: 'power2.in',
    }, 0)
    .to(next, {
      opacity: 1,
      scale: 1,
      z: 0,
      xPercent: -50,
      yPercent: -50,
      filter: 'blur(0px)',
      duration: INDUSTRIAS_DEPTH_DUR,
      ease: 'power2.out',
    }, 0.1);
}

/** Flecha ←/→ en Industrias. false = ya no hay más en esa dirección. */
function stepIndustriaWord(dir) {
  const panel = document.getElementById('industrias');
  if (!panel?._industriasOn) return false;
  const n = INDUSTRIAS_WORDS.length;
  const idx = panel._industriasIdx ?? 0;
  const next = idx + dir;
  if (next < 0 || next >= n) return false;
  panel._industriasManual = true;
  transitionIndustriaTo(panel, next, true);
  return true;
}

function updateIndustriasWords(panel, hold, fastScroll = false) {
  if (!panel._industriasOn) return;
  if (panel._industriasManual) return;

  const START = 0.28;
  const END = 0.72;
  let t = 0;
  if (hold <= START) t = 0;
  else if (hold >= END) t = 1;
  else t = (hold - START) / (END - START);

  const idx = t < 0.5 ? 0 : 1;
  if (idx === (panel._industriasIdx ?? 0) && panel._industriasReady) return;
  transitionIndustriaTo(panel, idx, !fastScroll && !REDUCED_MOTION);
}

function startIndustriasCycle(panel) {
  if (panel._industriasOn) return;
  const { a, b } = getIndustriaLayers(panel);
  if (!a || !b) return;

  panel._industriasOn = true;
  panel._industriasIdx = 0;
  panel._industriasReady = true;
  panel._industriasManual = false;

  a.textContent = INDUSTRIAS_WORDS[0];
  b.textContent = INDUSTRIAS_WORDS[1];
  a.classList.add('is-active');
  b.classList.remove('is-active');
  a.setAttribute('aria-hidden', 'false');
  b.setAttribute('aria-hidden', 'true');

  gsap.set(a, {
    opacity: 1, scale: 1, z: 0, xPercent: -50, yPercent: -50,
    filter: 'none', visibility: 'visible', force3D: true,
  });
  gsap.set(b, {
    opacity: 0, scale: 1, z: 0, xPercent: -50, yPercent: -50,
    filter: 'none', visibility: 'hidden', force3D: true,
  });
}

function stopIndustriasCycle(panel) {
  if (!panel._industriasOn) return;
  panel._industriasOn = false;
  panel._industriasManual = false;
  panel._industriasReady = false;
  if (panel._industriasTL) { panel._industriasTL.kill(); panel._industriasTL = null; }
  if (panel._industriasCall) { panel._industriasCall.kill(); panel._industriasCall = null; }

  const { a, b } = getIndustriaLayers(panel);
  if (a) {
    a.textContent = INDUSTRIAS_WORDS[0];
    a.classList.add('is-active');
    gsap.set(a, { opacity: 1, scale: 1, z: 0, filter: 'none', visibility: 'visible', clearProps: 'transform' });
    a.setAttribute('aria-hidden', 'false');
  }
  if (b) {
    b.textContent = INDUSTRIAS_WORDS[1];
    b.classList.remove('is-active');
    gsap.set(b, { opacity: 0, visibility: 'hidden', clearProps: 'transform' });
    b.setAttribute('aria-hidden', 'true');
  }
  panel._industriasIdx = 0;
}

/* --------------------------------------------------------------------------
   Integra — 4 líneas tipográficas; la 4ª cicla por scroll
   (ESTRATEGIA → CONOCIMIENTO → DISEÑO → DESARROLLO) con wipe vertical.
   -------------------------------------------------------------------------- */

const INTEGRA_WORDS = ['ESTRATEGIA', 'CONOCIMIENTO', 'DISEÑO', 'DESARROLLO'];

function resetIntegraWords(panel) {
  const track = panel.querySelector('.iword-track');
  if (!track) return;
  panel._integraIdx = 0;
  panel._integraReady = false;
  panel._integraManual = false;
  gsap.killTweensOf(track);
  gsap.set(track, { y: 0 });
}

function setIntegraWordIndex(panel, idx, animate = true) {
  const track = panel.querySelector('.iword-track');
  const item = track?.querySelector('.iword-item');
  if (!track || !item) return;
  const n = INTEGRA_WORDS.length;
  const next = ((idx % n) + n) % n;
  panel._integraIdx = next;
  panel._integraReady = true;
  // Altura redondeada: evita subpíxeles que dejan ver el borde de la siguiente palabra
  const itemH = Math.round(item.offsetHeight || item.getBoundingClientRect().height || 1);
  const y = -next * itemH;
  gsap.killTweensOf(track);
  if (!animate || REDUCED_MOTION) {
    gsap.set(track, { y, force3D: true });
    return;
  }
  gsap.to(track, {
    y,
    duration: 0.55,
    ease: 'power3.inOut',
    overwrite: 'auto',
    force3D: true,
  });
}

/** Flecha ←/→ en Integra: cicla palabras. false = ya no hay más en esa dirección. */
function stepIntegraWord(dir) {
  const panel = document.getElementById('integra');
  if (!panel) return false;
  const n = INTEGRA_WORDS.length;
  const idx = panel._integraIdx ?? 0;
  const next = idx + dir;
  if (next < 0 || next >= n) return false;
  panel._integraManual = true;
  setIntegraWordIndex(panel, next, true);
  return true;
}

function updateIntegraWords(panel, hold, fastScroll = false) {
  const track = panel.querySelector('.iword-track');
  const item = track?.querySelector('.iword-item');
  if (!track || !item) return;
  const n = INTEGRA_WORDS.length;
  if (n < 2) return;

  // Control manual por teclado: no pisar con el scroll
  if (panel._integraManual) return;

  // Más recorrido por palabra: entra/sale con margen amplio
  const START = 0.12;
  const END = 0.92;
  let t = 0;
  if (hold <= START) t = 0;
  else if (hold >= END) t = 1;
  else t = (hold - START) / (END - START);

  if (!panel._integraReady) {
    if (fastScroll || hold < START + 0.06) {
      gsap.killTweensOf(track);
      gsap.set(track, { y: 0 });
      panel._integraIdx = 0;
      return;
    }
    panel._integraReady = true;
  }

  // floor + sticky: cada palabra ocupa ~1/n del hold (no salta con round)
  const idx = Math.min(n - 1, Math.floor(t * n * 0.999));

  // Scroll rápido: no animar el carrusel intermedio
  if (fastScroll || REDUCED_MOTION) {
    if (panel._integraIdx !== idx) setIntegraWordIndex(panel, idx, false);
    return;
  }

  if (panel._integraIdx === idx) return;
  setIntegraWordIndex(panel, idx, true);
}

/* Resets para que los efectos de carga se repitan en cada visita */
function resetGestion() {
  /* mocks HTML reemplazados por capturas */
}

function runGestion() {
  /* mocks HTML reemplazados por capturas */
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
      scale: 1.5,
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

/* --------------------------------------------------------------------------
   Reflectores del cierre — proyector en el borde inferior: los haces nacen
   juntos del mismo punto y abren en abanico hacia FAD LATAM.
   Focos suaves de fondo (sin chispas). El scroll solo controla la apertura.
   -------------------------------------------------------------------------- */

// Abanico inclinado desde 18/18 hacia el extremo opuesto (arriba-izquierda)
// 0° = vertical; negativo = hacia la izquierda / toda la pantalla
const BEAM_FAN = [
  { base: -88, swing: 3.8, speed: 0.00095, phase: 0 },
  { base: -80, swing: 4.2, speed: 0.00082, phase: 0.9 },
  { base: -72, swing: 4.6, speed: 0.00110, phase: 1.8 },
  { base: -64, swing: 4.8, speed: 0.00088, phase: 2.7 },
  { base: -56, swing: 5.0, speed: 0.00125, phase: 3.6 },
  { base: -48, swing: 5.2, speed: 0.00092, phase: 4.5 },
  { base: -40, swing: 5.0, speed: 0.00105, phase: 0.4 },
  { base: -32, swing: 4.8, speed: 0.00086, phase: 1.3 },
  { base: -24, swing: 4.6, speed: 0.00118, phase: 2.2 },
  { base: -16, swing: 4.2, speed: 0.00090, phase: 3.1 },
  { base: -8,  swing: 3.8, speed: 0.00102, phase: 4.0 },
  { base: 0,   swing: 3.4, speed: 0.00084, phase: 5.0 },
];

const FOCO_PULSE = [
  { speed: 0.0011, phase: 0.2, amp: 0.22 },
  { speed: 0.00085, phase: 1.7, amp: 0.26 },
  { speed: 0.00135, phase: 3.4, amp: 0.2 },
];

let spotPanel = null;

function spotlightTick() {
  const panel = spotPanel;
  if (!panel || !panel._beams) return;
  const t = performance.now();
  const sweep = panel._spotSweep ?? 0;
  const fadeIn = panel._spotFade ?? 0;

  for (let i = 0; i < panel._beams.length; i++) {
    const f = BEAM_FAN[i] || BEAM_FAN[0];
    const roam = Math.sin(t * f.speed + f.phase) * f.swing
      + Math.sin(t * f.speed * 2.2 + f.phase * 1.5) * (f.swing * 0.22);
    // al entrar: abanico cerrado → abierto (cubre toda la pantalla)
    const spread = 0.55 + sweep * 0.55;
    const breath = 0.78
      + Math.sin(t * 0.0048 + f.phase) * 0.12
      + Math.sin(t * 0.0018 + f.phase * 2.1) * 0.08;
    gsap.set(panel._beams[i], {
      rotation: (f.base + roam) * spread,
      opacity: fadeIn * (0.18 + sweep * 0.2) * breath,
      force3D: true,
    });
  }

  if (panel._flare) {
    const pulse = 1 + Math.sin(t * 0.0038) * 0.12 + Math.sin(t * 0.009) * 0.06;
    gsap.set(panel._flare, {
      opacity: fadeIn * (0.16 + sweep * 0.18) * (0.75 + Math.sin(t * 0.006) * 0.2),
      scale: pulse,
      force3D: true,
    });
  }

  // Focos de fondo: destellos amplios y lentos
  if (panel._focos?.length) {
    panel._focos.forEach((el, i) => {
      const p = FOCO_PULSE[i] || FOCO_PULSE[0];
      const wave = 0.55 + Math.sin(t * p.speed + p.phase) * p.amp
        + Math.sin(t * p.speed * 0.45 + p.phase * 2) * (p.amp * 0.4);
      const scale = 0.92 + Math.sin(t * p.speed * 0.7 + p.phase) * 0.12;
      gsap.set(el, {
        opacity: fadeIn * wave * (0.16 + sweep * 0.22),
        scale,
        force3D: true,
      });
    });
  }
}

function updateSpotlights(panel, local, contentShowAt) {
  if (REDUCED_MOTION) return;
  if (!panel._beams) {
    panel._beams = [...panel.querySelectorAll('.spotlights .beam')];
    panel._flare = panel.querySelector('.spotlights .beam-flare');
    panel._focos = [...panel.querySelectorAll('.spotlights .foco')];
  }
  if (!panel._beams.length) return;

  panel._spotSweep = easeOut3(clamp(local / contentShowAt, 0, 1));
  panel._spotFade = clamp(local / 0.05, 0, 1);

  if (!spotPanel) {
    spotPanel = panel;
    gsap.ticker.add(spotlightTick);
  }

  if (local >= contentShowAt && !panel._beamHit) {
    panel._beamHit = true;
    gsap.fromTo('#finalcover .spotlights', { filter: 'brightness(1)' }, {
      filter: 'brightness(1.7)', duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.inOut',
    });
  } else if (local < contentShowAt * 0.6) {
    panel._beamHit = false;
  }
}

function resetSpotlights(panel) {
  panel._beamHit = false;
  if (spotPanel) {
    gsap.ticker.remove(spotlightTick);
    spotPanel = null;
  }
  if (panel._beams) gsap.set(panel._beams, { opacity: 0 });
  if (panel._flare) gsap.set(panel._flare, { opacity: 0 });
  if (panel._focos) gsap.set(panel._focos, { opacity: 0 });
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
   Menú lateral — markup pre-renderizado (SideMenu.astro), apertura CSS puro
   (:hover en #side-nav). Aquí solo: cierre tras click + estado activo.
   La navegación la maneja initSceneNav (a[href^="#"] → scrollToScene).
   -------------------------------------------------------------------------- */

let sideLinks = [];

function initSideMenu() {
  const menu = document.getElementById('side-menu');
  if (!menu) return;
  sideLinks = [...menu.querySelectorAll('a')];
  // Visibilidad: CSS (:hover / :focus-within en #side-nav). Activo: .is-on
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
  const cursor = document.getElementById('cursor');
  if (!cursor) return;
  if (window.matchMedia('(hover: none)').matches) return;

  gsap.set(cursor, { x: innerWidth / 2, y: innerHeight / 2 });
  cursor.classList.add('is-on');

  window.addEventListener('mousemove', (e) => {
    gsap.to(cursor, {
      x: e.clientX,
      y: e.clientY,
      duration: REDUCED_MOTION ? 0 : 0.18,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  });

  const hoverSel = 'a, button, [role="button"], .sv-dot, .mk-card, .ecard, .pcard, .tool, .ge-pill';
  document.querySelectorAll(hoverSel).forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
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
  /* insignia partners eliminada */
}

/** Torbellino de marcas: anillo 3D girando alrededor del título, arrastrable */
function initMarcasOrbit() {
  const orbit = document.getElementById('mkOrbit');
  if (!orbit) return;
  const cards = [...orbit.querySelectorAll('.mk-card')];
  if (!cards.length) return;
  const stage = orbit.parentElement;
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
      rot += 0.1 * dt; // giro base continuo (más lento)
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
const GROW_SELECTOR = '.cic, .ric, .pic, .tic, .gn, .dt-c, .tool .tile, .pcard2 .o, .eco-cap-n, .mk-dots i, .sv-dot';

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
    const introShare = INTRO_WEIGHT / (INTRO_WEIGHT + TOTAL_WEIGHT);
    const onIntro = lastGlobalProgress < introShare;
    e.preventDefault();

    // Desde la intro, abajo/derecha entra a la PRIMERA escena (visión),
    // no a la segunda: sceneProgress=0 ya “parece” visión y +1 la saltaba.
    if (onIntro) {
      if (dir > 0) scrollToScene(0);
      else scrollToIntro();
      return;
    }

    const sceneP = sceneProgressFromGlobal(lastGlobalProgress);
    const current = findActiveSceneIndex(sceneP);
    const local = getLocalProgress(sceneP, current);
    const sceneId = SCENES[current]?.id;

    // Integra / Industrias: ← / → ciclan palabras (scroll también lo hace)
    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      const wordDir = e.key === 'ArrowRight' ? 1 : -1;
      if (sceneId === 'integra' && stepIntegraWord(wordDir)) return;
      if (sceneId === 'industrias' && stepIndustriaWord(wordDir)) return;
    }

    if (dir > 0) {
      // Si acabamos de entrar a la escena, ir al hold de ESTA (no saltar la siguiente)
      if (local < 0.38) {
        scrollToScene(current);
        return;
      }
      scrollToScene(clamp(current + 1, 0, SCENES.length - 1));
      return;
    }

    if (current === 0 && local < 0.38) {
      scrollToIntro();
      return;
    }
    scrollToScene(clamp(current - 1, 0, SCENES.length - 1));
  });
}

function initKbdHint() {
  const btn = document.getElementById('kbd-hint-btn');
  const panel = document.getElementById('kbd-hint-panel');
  if (!btn || !panel) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = panel.hasAttribute('hidden');
    if (open) {
      panel.removeAttribute('hidden');
      btn.setAttribute('aria-expanded', 'true');
    } else {
      panel.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('click', (e) => {
    if (!panel.hasAttribute('hidden') && !e.target.closest('#kbd-hint')) {
      panel.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* --------------------------------------------------------------------------
   Init
   -------------------------------------------------------------------------- */

function init() {
  // Desktop only — en mobile solo se muestra #mobile-gate
  if (window.matchMedia('(max-width: 1024px)').matches) {
    document.documentElement.classList.add('is-mobile-gated');
    const block = (e) => e.preventDefault();
    document.addEventListener('touchmove', block, { passive: false });
    document.addEventListener('wheel', block, { passive: false });
    document.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
        e.preventDefault();
      }
    });
    return;
  }

  if (!REDUCED_MOTION) {
    Galaxy.init();
    Galaxy.startLoop();
  }
  initGlobalUniverse();
  updateIsotipo(0);
  initSceneBackgrounds();
  buildDesignThinkingFlow();
  buildToolsGrid();
  initServicesCards();
  initServcardsRail();
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
  initKbdHint();
  initLenis();
  ScrollTrigger.refresh();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
