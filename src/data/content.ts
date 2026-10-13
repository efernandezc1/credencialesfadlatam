import type { Service } from './types';

export const siteMeta = {
  title: 'FAD LATAM — Marketing diseñado para crecer con data y tecnología',
  description: 'Credenciales FusionAgency — marketing digital con data, creatividad y tecnología.',
  brand: 'FAD LATAM',
  cities: 'Lima · Bogotá · Miami',
  url: 'FADLATAM.COM',
} as const;

export const navLinks = [
  { href: '#vision', label: 'Visión' },
  { href: '#servcards', label: 'Servicios' },
  { href: '#resultados', label: 'Resultados' },
  { href: '#contacto', label: 'Contacto' },
] as const;

/** Menú lateral — una entrada por cada escena en SCENES (17) */
export const sceneMenu = [
  { id: 'vision', label: 'Visión' },
  { id: 'integra', label: 'Integra' },
  { id: 'nosotros', label: 'Agencia' },
  { id: 'industrias', label: 'Industrias' },
  { id: 'operamos', label: 'Operamos' },
  { id: 'enfoque', label: 'Enfoque' },
  { id: 'servcards', label: 'Servicios' },
  { id: 'generamos', label: 'Generamos' },
  { id: 'resultados', label: 'Resultados' },
  { id: 'proceso', label: 'Proceso' },
  { id: 'designthinking', label: 'Design Thinking' },
  { id: 'partners', label: 'Diferenciación' },
  { id: 'sincronizacion', label: 'Sincronización' },
  { id: 'gestion', label: 'Gestión AI' },
  { id: 'ecosistema', label: 'Ecosistema' },
  { id: 'marcas', label: 'Clientes' },
  { id: 'finalcover', label: 'Cierre' },
] as const;

export const introPainCards = [
  'Canales desconectados.',
  'Contenido sin estrategia.',
  'Pauta sin trazabilidad.',
  'Métricas que no impactan en el negocio.',
] as const;

export const services: Service[] = [
  {
    n: '01',
    t: 'ESTRATEGIA & CONTENIDO',
    d: 'Estrategia digital integral, conceptualización de campañas, producción de contenido, branding digital, contenido AI.',
    tags: ['ESTRATEGIA', 'CONTENIDO', 'BRANDING', 'AI'],
  },
  {
    n: '02',
    t: 'PRODUCCIÓN AUDIOVISUAL',
    d: 'Pre, producción y post-producción, storytelling visual, adaptaciones multiplataforma, hiperrealismo.',
    tags: ['VIDEO', 'STORYTELLING', 'POST', 'HIPERREALISMO'],
  },
  {
    n: '03',
    t: 'PAID MEDIA',
    d: 'Meta, Google, TikTok y LinkedIn ads, lead generation, optimización continua, dashboards en tiempo real.',
    tags: ['META', 'GOOGLE', 'TIKTOK', 'LEADS'],
  },
  {
    n: '04',
    t: 'INNOVACIÓN DIGITAL',
    d: 'Websites y landing pages, e-commerce, soluciones con AI.',
    tags: ['WEB', 'ECOMMERCE', 'AI'],
  },
];

export const designThinkingFlow: [string, number, boolean?][] = [
  ['START', 60],
  ['BRIEF', 70],
  ['DESIGN THINKING', 150, true],
  ['Research', 80],
  ['Ideación', 90],
  ['Presentación', 95],
  ['DESIGN SPRINTS', 150, true],
  ['Ejecución', 85],
  ['FINISH', 60],
];

export const tools = [
  { icon: '/images/ecosistema/meta.svg', name: 'Meta' },
  { icon: '/images/ecosistema/google.svg', name: 'Google' },
  { icon: '/images/ecosistema/google_analitycs.svg', name: 'Google Analytics' },
  { icon: '/images/ecosistema/make.svg', name: 'Make' },
  { icon: '/images/ecosistema/zapier.svg', name: 'Zapier' },
  { icon: '/images/ecosistema/claude.svg', name: 'Claude' },
  { icon: '/images/ecosistema/data_studio.svg', name: 'Looker Studio' },
] as const;

export const brands = [
  '/images/marcas/logo_cliente_fusion_digital_1.svg',
  '/images/marcas/logo_cliente_fusion_digital_2.svg',
  '/images/marcas/logo_cliente_fusion_digital_3.svg',
  '/images/marcas/logo_cliente_fusion_digital_4.svg',
  '/images/marcas/logo_cliente_fusion_digital_5.svg',
  '/images/marcas/logo_cliente_fusion_digital_6.svg',
  '/images/marcas/logo_cliente_fusion_digital_7.svg',
] as const;

export const enfoqueCards = [
  { icon: 'mdi:chart-bar', title: 'Decisiones basadas en data', text: 'Cada acción responde a métricas reales y comportamiento del usuario.' },
  { icon: 'mdi:pencil-outline', title: 'Creatividad orientada a performance', text: 'Contenido diseñado no solo para comunicar, sino para convertir.' },
  { icon: 'mdi:robot-outline', title: 'Automatización e inteligencia artificial', text: 'Procesos y herramientas que mejoran eficiencia y escalabilidad.' },
] as const;

export const generamosCards = [
  { n: '01', icon: 'mdi:chart-donut', title: 'Medimos', text: 'Tracking, atribución y dashboards en tiempo real.' },
  { n: '02', icon: 'mdi:swap-horizontal', title: 'Optimizamos', text: 'Automatización de procesos y decisiones basadas en data.' },
  { n: '03', icon: 'mdi:trending-up', title: 'Escalamos', text: 'AI aplicada a contenido, audiencias y optimización de campañas.' },
] as const;

export const resultadosStats = [
  { icon: 'mdi:account-outline', count: 82, prefix: '+', suffix: 'k', label: 'Leads generados' },
  { icon: 'mdi:currency-usd', count: 52, prefix: '-', suffix: '%', label: 'Reducción en costo por lead' },
  { icon: 'mdi:target', count: 39, prefix: '+', suffix: '%', label: 'Sobre meta de separación' },
  { icon: 'mdi:trending-up', count: 50, prefix: '+', suffix: '%', label: 'Crecimiento en captación de leads' },
] as const;

export const casos = [
  { name: 'V&V', meta: 'Performance inmobiliario · estrategia, optimización continua y dashboard.' },
  { name: 'ATOM', meta: 'Real estate & branding · contenido estratégico, pauta y sitio web.' },
  { name: 'VIDARQ', meta: 'Performance inmobiliario · contenido orientado a ventas y reporting.' },
  { name: 'FRANCESCO', meta: 'Gastronomía & marketing 360 · reservas, audiovisual y sitio web.' },
  { name: 'VERY VIZY', meta: 'Contenido & performance · lead generation y sitio web.' },
] as const;

export const procesoSteps = [
  { n: '01', icon: 'mdi:magnify', title: 'Diagnóstico', text: 'Análisis de negocio, audiencia y oportunidades.' },
  { n: '02', icon: 'mdi:target', title: 'Estrategia', text: 'Definición de objetivos, canales y plan de crecimiento.' },
  { n: '03', icon: 'mdi:rocket-launch-outline', title: 'Implementación', text: 'Contenido, pauta, automatización y activaciones.' },
  { n: '04', icon: 'mdi:chart-timeline-variant', title: 'Optimización', text: 'Monitoreo, análisis y mejora continua basada en performance.' },
] as const;

export const designSteps = [
  'Empezamos investigando tu marca. Aquí toda la información necesaria para que el equipo formule conclusiones.',
  'Usamos los insights para crear el plan estratégico y la propuesta que cumpla los objetivos.',
  'Te exponemos la propuesta, la idea creativa y cómo sería su ejecución, con su presupuesto.',
  'Dividimos el proyecto en sprints para marcar la pauta, los tiempos y los entregables.',
] as const;

export const partnersItems = [
  { icon: 'mdi:chart-bar', title: 'Data', span: 'driven marketing', text: 'Toma de decisiones basadas en datos y experiencia de los equipos.' },
  { icon: 'mdi:shield-check-outline', title: 'Transparencia', span: 'de inversión', text: 'Libre acceso a plataformas publicitarias y paneles en tiempo real.' },
  { icon: 'mdi:lightbulb-on-outline', title: 'Best', span: 'practices', text: 'Alineados con los requerimientos de calidad de las plataformas publicitarias.' },
  { icon: 'mdi:medal-outline', title: 'Programas', span: 'para socios', text: 'Meta Business Partner y Google Partner, con asistencia y capacitaciones exclusivas.' },
] as const;

export const syncTools = [
  { icon: 'mdi:cloud-sync-outline', title: 'Windsor', text: 'Conexión y sincronización automática de datos publicitarios desde múltiples plataformas.' },
  { icon: 'mdi:robot-outline', title: 'Claude', text: 'Análisis con AI: lectura de métricas, detección de tendencias y hallazgos accionables.' },
  { icon: 'mdi:view-dashboard-outline', title: 'SaaS', text: 'Paneles en la nube, en semi tiempo real y con acceso directo para cada cliente.' },
] as const;

export const ecoList = [
  { n: '01', title: 'Automatizar procesos', text: 'Flujos conectados que ahorran tiempo y reducen error operativo.' },
  { n: '02', title: 'Medir comportamiento', text: 'Lectura continua de audiencias, canales y señales de conversión.' },
  { n: '03', title: 'Optimizar inversión', text: 'Presupuesto que se ajusta con data, no con suposiciones.' },
  { n: '04', title: 'Tomar decisiones', text: 'Paneles en vivo para actuar en el momento correcto.' },
] as const;
