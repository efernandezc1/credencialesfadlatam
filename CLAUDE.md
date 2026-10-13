# CLAUDE.md — Credenciales Fusion (FAD LATAM)

Documento de contexto para asistentes AI (Claude, Cursor, etc.). Léelo antes de modificar el proyecto.

---

## Qué es este proyecto

**Credencial web inmersiva** para FAD LATAM / FusionAgency: presentación de agencia de marketing digital con scroll cinematográfico, inspirada en experiencias tipo [ibi.cash](https://www.ibi.cash).

- **Viewport fijo** — no hay scroll vertical perceptible del contenido
- **18 capítulos** post-intro navegables por scroll (Lenis + GSAP ScrollTrigger)
- **Fondo universo** — WebGL (Three.js) + partículas CSS sincronizadas al scroll
- **Transiciones por sección** — deep, iris, curtain, slices, flip, warp, arrival
- **Sin video** — inmersión vía partículas, zoom en contenido y animaciones de texto

**Cliente:** FAD LATAM · Lima · Bogotá · Miami  
**Ruta local:** `C:\wamp64\www\credencialesFusion\`

---

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Framework | **Astro 7** (SSG estático) |
| Scroll suave | **Lenis 1.3** |
| Animaciones | **GSAP 3.15** + ScrollTrigger |
| Universo 3D | **Three.js 0.185** (`src/scripts/galaxy.js`) |
| Estilos | CSS monolítico (`src/styles/global.css`, ~2650 líneas) |
| Runtime | Node >= 22.12 |

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run preview
```

---

## Arquitectura Astro (estado actual)

```
src/
├── data/
│   ├── scenes.ts      # SCENES[], SCROLL_CONFIG, paletas partículas
│   ├── content.ts     # servicios, casos, marcas, tools, intro, nav
│   └── types.ts       # Scene, Service, NavLink
├── layouts/
│   └── BaseLayout.astro
├── pages/
│   └── index.astro    # Composición principal (única ruta)
├── components/
│   ├── SiteChrome.astro      # header, partículas DOM, contador, hint
│   ├── Intro.astro           # intro animada (portal, pain, result)
│   ├── Stage.astro           # compositor de 18 secciones
│   ├── ExperienceClient.astro # <script> que carga el motor JS
│   ├── ui/
│   │   ├── Panel.astro       # wrapper <section> con data-fx / data-transition
│   │   └── Eyebrow.astro
│   └── sections/             # 18 componentes (.astro), uno por capítulo
├── scripts/
│   ├── experience/main.js    # ⚠️ Motor principal (~1830 líneas)
│   └── galaxy.js             # Universo WebGL
└── styles/
    └── global.css

public/
└── assets/                   # ⚠️ Falta eye.jpg (referenciado en CSS)
```

### Flujo de renderizado

1. **Build Astro** pre-renderiza todo el HTML de secciones en `dist/index.html`
2. **`ExperienceClient.astro`** importa `main.js` como módulo ES (Vite lo empaqueta con gsap/lenis/three)
3. **`init()`** en `main.js` al `DOMContentLoaded`:
   - Inicia Galaxy (WebGL canvas `#galaxy-canvas`)
   - Crea partículas CSS en `#universe-particles`
   - Envuelve cada panel en `.panel-inner` (`wrapPanelInner`)
   - Configura Lenis + ScrollTrigger sobre `#scroll-driver`
   - `updateExperience(globalProgress)` → intro crossfade + `renderScenes()` + partículas

### Fuente de verdad de datos

| Dato | Archivo | Consumido por |
|------|---------|---------------|
| Escenas, pesos, scroll config | `src/data/scenes.ts` | Astro + `main.js` (import) |
| Contenido editorial | `src/data/content.ts` | Componentes Astro + `main.js` |
| IDs de sección | Deben coincidir entre `SCENES[].id` y `Panel id=` | Crítico |

---

## Las 18 secciones (orden fijo)

Definidas en `src/data/scenes.ts` → renderizadas en `Stage.astro`:

| # | id | Peso scroll | FX transición | Componente |
|---|-----|-------------|---------------|------------|
| 1 | vision | 1.3 | deep | VisionSection |
| 2 | integra | 2.4 | deep | IntegraSection |
| 3 | nosotros | 1.0 | iris | NosotrosSection |
| 4 | industrias | 1.4 | warp | IndustriasSection |
| 5 | operamos | 1.0 | curtain | OperamosSection |
| 6 | enfoque | 1.1 | slices | EnfoqueSection |
| 7 | servcards | 2.6 | deep | ServCardsSection |
| 8 | generamos | 1.0 | flip | GeneramosSection |
| 9 | resultados | 1.3 | iris | ResultadosSection |
| 10 | casos | 1.6 | slices | CasosSection |
| 11 | proceso | 1.1 | curtain | ProcesoSection |
| 12 | designthinking | 1.1 | flip | DesignThinkingSection |
| 13 | partners | 1.1 | slices | PartnersSection |
| 14 | sincronizacion | 1.2 | curtain | SincronizacionSection |
| 15 | gestion | 1.3 | iris | GestionSection |
| 16 | ecosistema | 1.0 | warp | EcosistemaSection |
| 17 | marcas | 1.1 | curtain | MarcasSection |
| 18 | finalcover | 1.3 | arrival | FinalCoverSection |

**Intro** (pre-escenas): peso `INTRO_WEIGHT = 2.0` en `SCROLL_CONFIG`.

---

## Motor de scroll — conceptos clave

### Progreso

```
globalProgress (0→1) sobre #scroll-driver
├── introShare = INTRO_WEIGHT / (INTRO_WEIGHT + TOTAL_WEIGHT)
├── [0 .. introShare]           → renderIntro()
└── [introShare .. 1]           → sceneProgress → renderScenes()
```

### Fases por panel (`local` 0→1 dentro de cada escena)

- **enter** (`local < ENTER_END`) — zoom in, contenido oculto
- **hold** (`ENTER_END .. EXIT_START`) — contenido visible, lógica de escena
- **exit** (`local > EXIT_START`) — zoom out, fade contenido

Constantes en `SCROLL_CONFIG` (`src/data/scenes.ts`).

### Visibilidad de paneles

Solo se muestran paneles **activos ± vecino** (`isPanelAllowed()`). Evita superposición de secciones.

### Contenido visible

- `ensureContentVisible()` / `hideContentLeaves()` — opacidad en **hojas** del DOM, no en padres+hijos a la vez (bug histórico de texto parcial)
- `.svcard` — solo `.is-active` visible; inactivas `visibility:hidden`
- Servicios, tools, design thinking, marcas — **pre-renderizados en Astro**; JS tiene fallbacks (`if (box.children.length) return`)

### Efectos especiales por escena (JS)

- **integra** — palabras cíclicas en `.iword`, animación O partida
- **industrias** — REAL ESTATE ↔ GASTRONOMÍA
- **servcards** — carousel por scroll (1 card activa)
- **resultados** — counters animados
- **gestion** — gauge + barras
- **marcas** — órbita 3D de `.mk-card` (pre-renderizados en Astro)
- **finalcover** — estrellas `.rush-star`, scroll bloqueado al ~88%

---

## Archivos legacy (NO editar salvo migración explícita)

| Ruta | Notas |
|------|-------|
| `legacy/index.static.html` | HTML pre-Astro |
| `js/main.js` | Copia antigua (~2099 líneas); **canónico:** `src/scripts/experience/main.js` |
| `js/galaxy.js`, `css/styles.css` | Duplicados pre-migración |
| `public/js/*` | **Obsoletos** — el build usa `src/scripts/` empaquetado por Vite |
| `v2/`, `v3/` | Iteraciones anteriores descartadas |
| `astro-tmp/` | Scaffold temporal (ignorar) |

---

## Problemas conocidos / deuda técnica

### Críticos

1. **`public/assets/eye.jpg` ausente** — CSS referencia `/assets/eye.jpg` para Visión e Integra. Colocar imagen o actualizar rutas.
2. **Duplicación `js/` vs `src/scripts/`** — riesgo de editar el archivo equivocado. Eliminar `public/js/` y `js/` raíz cuando se confirme estabilidad.
3. **`main.js` monolítico (~1830 líneas)** — difícil de mantener; mezcla motor scroll, partículas, UI, intro, efectos.

### UX reportados por el cliente (historial)

- Scroll aún puede sentirse rápido/sensible en algunos dispositivos
- Visión tardaba en aparecer (mitigado: intro más corto, crossfade)
- Superposición de secciones (mitigado: `isPanelAllowed`)
- Texto fantasma en servicios (mitigado: solo `.svcard.is-active` visible)
- Zoom/partículas del universo — iteraciones en curso; cliente quiere sensación de navegación espacial más marcada

### Build / perf

- Chunk JS **> 500 kB** post-minify (three + gsap + main) — considerar code-splitting
- Sin tests automatizados
- Scripts en **JS plano**, no TypeScript (data sí es TS)
- `SincronizacionSection.astro` — tabla dashboard hardcodeada, no en `content.ts`
- `PartnersSection` — placeholder "COLOCAR INSIGNIA PARTNERS"
- Sin `prefers-reduced-motion` completo en Astro (parcial en JS)

---

## Qué se puede mejorar (roadmap sugerido)

### Prioridad alta

- [ ] **Refactorizar `main.js`** en módulos: `scroll-engine.js`, `particles.js`, `transitions.js`, `scene-logic.js`, `intro.js`
- [ ] **Eliminar legacy** (`js/`, `public/js/`, `v2/`, `v3/`, `astro-tmp/`)
- [ ] **Añadir `eye.jpg`** o placeholder en `public/assets/`
- [ ] **Mover contenido hardcodeado** de Sincronización/Gestión/Partners a `content.ts`
- [ ] **TypeScript** en scripts de experiencia (`main.ts`, `galaxy.ts`)

### Prioridad media — Astro best practices

- [ ] **Content Collections** de Astro para casos, servicios, testimonios (JSON/YAML + schema Zod)
- [ ] **Componentes UI** reutilizables: `Card.astro`, `Counter.astro`, `SectionHeader.astro`, `GradText.astro`
- [ ] **`data-transition`** en Panel — hoy el FX viene de `scenes.ts` en JS, no del atributo HTML (duplicación conceptual con `bgIntensity`)
- [ ] **Islands** — evaluar si algún widget necesita hidratación parcial (probablemente no; todo es client-side post-load)
- [ ] **SEO**: Open Graph, favicon, `astro.config` `site` + `base` para deploy en subcarpeta WAMP (`/credencialesFusion/`)

### Prioridad media — experiencia

- [ ] Afinar **SCROLL_CONFIG** (sensibilidad Lenis, scrub, pesos por sección)
- [ ] **Servicios estilo Lenis** — tipografía grande, una card limpia (parcialmente hecho)
- [ ] **Visión** — mismo tratamiento tipográfico moderno
- [ ] Partículas: más contraste entre secciones (paletas ya en `SCENE_PALETTES`)
- [ ] **Accesibilidad**: navegación teclado existe (`initKeyboardNav`); falta focus visible, aria-live en contador

### Prioridad baja

- [ ] Tests E2E (Playwright): scroll llega a cada `#id`, contenido visible en hold
- [ ] Lighthouse / performance budget
- [ ] i18n (contenido solo ES)
- [ ] CMS headless (Sanity/Contentful) si el cliente edita contenido frecuente
- [ ] PWA / offline (poco relevante para credencial)

---

## Convenciones al modificar

### DO

- Editar contenido en **`src/data/content.ts`** y secciones en **`src/components/sections/`**
- Editar lógica scroll/animación en **`src/scripts/experience/main.js`**
- Editar estilos en **`src/styles/global.css`**
- Mantener **`SCENES[].id`** sincronizado con `Panel id=` en componentes
- Probar con `npm run dev` y `npm run build` tras cambios
- Preferir **Astro para markup**, JS solo para comportamiento

### DON'T

- No editar `js/main.js` raíz ni `public/js/` (obsoletos)
- No añadir HTML crudo en `index.astro` — usar componentes
- No animar opacidad en **padre e hijo** simultáneamente (`.sech` + `.fx-words .w`)
- No poner `.svcard` inactivas con `opacity: 0.12` — usar `visibility: hidden`
- No commitear sin que el usuario lo pida
- No crear archivos markdown extra salvo este CLAUDE.md / README.md

### Añadir una nueva sección

1. Añadir entrada en `src/data/scenes.ts` → `SCENES[]`
2. Crear `src/components/sections/NuevaSection.astro` con `<Panel id="nueva" ...>`
3. Importar y colocar en `src/components/Stage.astro` en el orden deseado
4. Si necesita lógica scroll: case en `runSceneLogic()` en `main.js`
5. Estilos en `global.css` bajo `#nueva { ... }`

---

## Deploy

### Astro (recomendado)

```bash
npm run build
# Servir contenido de dist/
```

### WAMP

Opción A: copiar `dist/` a `www/credencialesFusion/`  
Opción B: configurar `base: '/credencialesFusion/'` en `astro.config.mjs` antes del build

### Desarrollo

`npm run dev` en puerto **4321** (no requiere WAMP)

---

## Referencia rápida de IDs DOM

```
#universe-particles / #galaxy-canvas
#experience
  #intro → #portal, #shapes, .pain, .result
  #stage → 18× section.panel
#scroll-driver          ← altura genera scroll virtual
#scroll-progress-bar
#scene-current / #scene-total
#svStage / #svDots       ← servicios
#mkOrbit                 ← marcas
#meteors                 ← finalcover
#contacto                ← anchor footer
```

---

## Historial de evolución (contexto)

1. Empezó como HTML estático estilo ibi.cash
2. Iteraciones: Lenis, GSAP pins, partículas CSS, Three.js (alternó con CSS)
3. Problemas resueltos: secciones superpuestas por layout, texto invisible, tarjetas servicios fantasma
4. **Migrado a Astro** — componentes por sección, data layer, scripts empaquetados npm
5. Estado actual: **funcional**, deuda en monolito JS y limpieza legacy

---

*Última actualización: julio 2026 — revisar tras cambios mayores en arquitectura o SCENES.*
