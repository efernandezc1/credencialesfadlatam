import type { Scene } from './types';

export const SCENES: Scene[] = [
  { id: 'vision', weight: 1.0, fx: 'deep' },
  { id: 'integra', weight: 3.2, fx: 'deep' },
  { id: 'nosotros', weight: 0.85, fx: 'iris' },
  { id: 'industrias', weight: 1.6, fx: 'warp' },
  { id: 'operamos', weight: 0.85, fx: 'curtain' },
  { id: 'enfoque', weight: 0.9, fx: 'slices' },
  { id: 'servcards', weight: 1.5, fx: 'deep' },
  { id: 'generamos', weight: 0.85, fx: 'flip' },
  { id: 'resultados', weight: 1.0, fx: 'iris' },
  // TEMP oculto — reactivar Casos de éxito cuando corresponda
  // { id: 'casos', weight: 1.6, fx: 'slices' },
  { id: 'proceso', weight: 1.15, fx: 'deep' },
  { id: 'designthinking', weight: 0.9, fx: 'flip' },
  { id: 'partners', weight: 0.9, fx: 'slices' },
  { id: 'sincronizacion', weight: 1.0, fx: 'curtain' },
  { id: 'gestion', weight: 1.0, fx: 'iris' },
  { id: 'ecosistema', weight: 0.85, fx: 'warp' },
  { id: 'marcas', weight: 0.9, fx: 'curtain' },
  { id: 'finalcover', weight: 1.0, fx: 'arrival' },
];

export const TOTAL_WEIGHT = SCENES.reduce((s, p) => s + p.weight, 0);
export const SCENE_COUNT = SCENES.length;

/** Configuración del motor de scroll (compartida con el cliente) */
export const SCROLL_CONFIG = {
  introWeight: 1.4,
  scrollLength: 0.85, // recorrido por sección: menos rueda para avanzar
  enterEnd: 0.1,
  exitStart: 0.84,
  contentShowAt: 0.11,
  contentHideAt: 0.9,
  fastScrollThreshold: 0.05,
  introBlend: 0.015,
} as const;

export const SCENE_PALETTES = [
  ['#2a36e2', '#3348fd', '#5e41fa', '#803bf8', '#6f57fc'],
  ['#2a36e2', '#5e41fa', '#803bf8', '#ffffff', '#6f57fc'],
  ['#3348fd', '#803bf8', '#6f57fc', '#ffffff', '#5e41fa'],
  ['#5e41fa', '#2a36e2', '#6f57fc', '#ffffff', '#803bf8'],
  ['#803bf8', '#3348fd', '#2a36e2', '#ffffff', '#6f57fc'],
  ['#6f57fc', '#5e41fa', '#3348fd', '#ffffff', '#803bf8'],
] as const;

export const PARTICLE_COLORS = ['#2a36e2', '#3348fd', '#5e41fa', '#803bf8', '#6f57fc'] as const;
