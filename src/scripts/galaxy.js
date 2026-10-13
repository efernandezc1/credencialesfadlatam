/**
 * Universo WebGL — estrellas, nebulosas, planeta wireframe
 */
import * as THREE from 'three';

const Galaxy = (() => {
  let renderer;
  let scene;
  let camera;
  let stars;
  let nebulas;
  let planet;
  let planetRing;
  let softTex;
  let canvas;
  let ready = false;
  let targetProgress = 0;
  let smoothProgress = 0;
  let mouseX = 0;
  let mouseY = 0;
  let smoothMX = 0;
  let smoothMY = 0;
  let velocity = 0;        // velocidad de scroll normalizada (delta por frame)
  let smoothVel = 0;
  let rafId = 0;
  const bursts = [];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CAM_START = 40;
  const CAM_END = -1200;
  const FOV_BASE = 50;
  const FOV_WARP = 74;

  function createSoftTexture() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.2)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }

  const PALETTE = [
    [1, 1, 1], [1, 0.6, 0.75], [0.68, 0.47, 1], [0.55, 0.72, 1], [1, 0.85, 0.95],
  ];

  function makeLayer(count, spread, depth, size, opacity) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.62;
      pos[i * 3 + 2] = -Math.random() * depth;
      const c = PALETTE[(Math.random() * PALETTE.length) | 0];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size,
      map: softTex,
      alphaMap: softTex,
      vertexColors: true,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    return new THREE.Points(geo, mat);
  }

  function createStars() {
    const group = new THREE.Group();
    group.add(makeLayer(700, 1400, 1900, 3.2, 0.85));
    group.add(makeLayer(260, 1000, 1500, 6, 0.9));
    group.add(makeLayer(60, 700, 1100, 11, 0.95));
    return group;
  }

  /* ------------------------------------------------------------------
     Nebulosas: manchas de gas de color a distintas profundidades.
     Sprites aditivos enormes y tenues; giran lentísimo y dan volumen
     de "nube cósmica" real detrás de las estrellas.
     ------------------------------------------------------------------ */
  const NEBULA_COLORS = [0x2a36e2, 0x3348fd, 0x5e41fa, 0x803bf8, 0x6f57fc];

  function createNebulas() {
    const group = new THREE.Group();
    for (let i = 0; i < 10; i++) {
      const mat = new THREE.SpriteMaterial({
        map: softTex,
        color: NEBULA_COLORS[i % NEBULA_COLORS.length],
        transparent: true,
        opacity: 0.08 + Math.random() * 0.1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sp = new THREE.Sprite(mat);
      const s = 380 + Math.random() * 620;
      sp.scale.set(s, s * (0.55 + Math.random() * 0.5), 1);
      sp.position.set(
        (Math.random() - 0.5) * 1300,
        (Math.random() - 0.5) * 700,
        -150 - Math.random() * 1700,
      );
      sp.userData.baseOp = mat.opacity;
      sp.userData.pulse = 0.5 + Math.random() * 1.2;
      group.add(sp);
    }
    return group;
  }

  /* Planeta 3D retirado — el Isotipo animado vive en #universe-isotipo (DOM). */
  function createPlanet() {
    return null;
  }

  /* ------------------------------------------------------------------
     Burst: explosión de partículas 3D en el punto del click.
     ------------------------------------------------------------------ */
  function burst(clientX, clientY) {
    if (!ready || reduced) return;
    const ndcX = (clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(clientY / window.innerHeight) * 2 + 1;

    // proyecta el click a un plano ~300 unidades delante de la cámara
    const dist = 300;
    const vFov = (camera.fov * Math.PI) / 180;
    const h = 2 * Math.tan(vFov / 2) * dist;
    const w = h * camera.aspect;
    const origin = new THREE.Vector3(
      camera.position.x + ndcX * w * 0.5,
      camera.position.y + ndcY * h * 0.5,
      camera.position.z - dist,
    );

    const count = 26;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vel = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = origin.x;
      pos[i * 3 + 1] = origin.y;
      pos[i * 3 + 2] = origin.z;
      const c = PALETTE[(Math.random() * PALETTE.length) | 0];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 2.2 + Math.random() * 4.5;
      vel.push(new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed * 1.6,
      ));
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 9,
      map: softTex,
      alphaMap: softTex,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    bursts.push({ points, vel, life: 1 });
  }

  function updateBursts() {
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.life -= 0.022;
      const attr = b.points.geometry.getAttribute('position');
      for (let j = 0; j < b.vel.length; j++) {
        attr.array[j * 3] += b.vel[j].x;
        attr.array[j * 3 + 1] += b.vel[j].y;
        attr.array[j * 3 + 2] += b.vel[j].z;
        b.vel[j].multiplyScalar(0.965);
      }
      attr.needsUpdate = true;
      b.points.material.opacity = Math.max(0, b.life);
      if (b.life <= 0) {
        scene.remove(b.points);
        b.points.geometry.dispose();
        b.points.material.dispose();
        bursts.splice(i, 1);
      }
    }
  }

  function onResize() {
    if (!renderer || !camera) return;
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  function onMouseMove(e) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  function init() {
    if (typeof THREE === 'undefined') return false;
    canvas = document.getElementById('galaxy-canvas');
    if (!canvas) return false;

    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      return false;
    }

    softTex = createSoftTexture();
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(FOV_BASE, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.set(0, 0, CAM_START);
    onResize();

    planet = createPlanet();
    if (planet) scene.add(planet);

    window.addEventListener('resize', onResize);

    ready = true;
    canvas.classList.add('is-ready');
    tick();
    return true;
  }

  function setProgress(p) {
    targetProgress = Math.max(0, Math.min(1, p));
  }

  /** delta de scroll por frame — alimenta el warp (FOV + roll + estiramiento) */
  function setVelocity(v) {
    velocity = Math.max(-1, Math.min(1, v * 60));
  }

  function tick() {
    if (!ready) return;
    const t = performance.now();
    smoothProgress += (targetProgress - smoothProgress) * (reduced ? 1 : 0.06);
    smoothVel += (velocity - smoothVel) * 0.08;
    velocity *= 0.86;
    // cámara: vuelo estable por scroll (sin parallax de mouse — el fondo
    // no debe moverse con el cursor)
    camera.position.z = CAM_START + (CAM_END - CAM_START) * smoothProgress;
    camera.position.x = 0;
    camera.position.y = 0;
    camera.rotation.z = 0;
    camera.lookAt(0, 0, camera.position.z - 300);

    // warp: al scrollear rápido el FOV se abre (sensación de hipervelocidad)
    const warp = Math.min(1, Math.abs(smoothVel) * 2.2);
    const fov = FOV_BASE + (FOV_WARP - FOV_BASE) * warp;
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    if (nebulas) {
      nebulas.rotation.z = t * 0.000012;
      nebulas.children.forEach((sp, i) => {
        sp.material.opacity = sp.userData.baseOp * (1 + Math.sin(t * 0.0004 * sp.userData.pulse + i) * 0.35);
      });
    }

    if (planet) {
      planet.rotation.y = t * 0.00016;
      planet.rotation.x = Math.sin(t * 0.00008) * 0.24;
      // el planeta respira y flota por su cuenta (sin seguir al mouse)
      planet.position.y = -60 + Math.sin(t * 0.0005) * 9;
      const s = 1 + Math.sin(t * 0.0006) * 0.04;
      planet.scale.set(s, s, s);
    }

    updateBursts();
    renderer.render(scene, camera);
  }

  function startLoop() {
    if (rafId) return;
    const loop = () => { tick(); rafId = requestAnimationFrame(loop); };
    rafId = requestAnimationFrame(loop);
  }

  return { init, setProgress, setVelocity, burst, tick, startLoop };
})();

export { Galaxy };
