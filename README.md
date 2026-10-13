# Credenciales Fusion — FAD LATAM (Astro)

> **Para asistentes AI:** lee [`CLAUDE.md`](./CLAUDE.md) — estado del proyecto, arquitectura, deuda técnica y roadmap de mejoras.

Experiencia inmersiva con scroll: **Astro** (SSG) + **Lenis** + **GSAP** + **Three.js**.

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Arquitectura Astro

```
src/
  data/           # Contenido y config (fuente única de verdad)
  layouts/        # BaseLayout.astro
  pages/          # Rutas (index.astro)
  components/
    sections/     # Una sección = un componente (.astro)
    ui/           # Panel, Eyebrow, etc.
  scripts/        # JS cliente (scroll, WebGL) — empaquetado por Vite
  styles/         # CSS global
public/assets/    # Imágenes estáticas (eye.jpg)
```

### Buenas prácticas aplicadas

- **HTML → componentes `.astro`** (no HTML monolítico)
- **Contenido en `src/data/`** compartido entre plantillas y scripts
- **Scripts cliente** importados como módulos ES (`gsap`, `lenis`, `three` vía npm)
- **SSG**: Astro pre-renderiza el markup; el JS solo añade interactividad
- **`ExperienceClient.astro`**: punto único de hidratación del motor scroll

## Assets

Coloca `eye.jpg` en `public/assets/`.

## Legacy

`legacy/index.static.html` y `js/` en raíz son la versión pre-Astro (referencia).
