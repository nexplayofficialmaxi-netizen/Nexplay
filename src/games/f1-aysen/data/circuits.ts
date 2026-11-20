import {
  BiomeType,
  CircuitDefinition,
  CircuitEnvironment,
  CircuitId,
  RegionCategory,
} from '../types/game';

const FEATURED_AYSEN_CIRCUITS: CircuitDefinition[] = [
  {
    id: 'coyhaique',
    index: 1,
    name: 'Circuito Urbano Coyhaique',
    shortName: 'Coyhaique Urbano',
    location: 'Coyhaique · Aysén, Chile',
    region: 'aysen',
    lengthKm: 4.24,
    corners: 11,
    difficulty: 'Media',
    description:
      'Trazado urbano veloz por el corazón de la capital regional. Combina rectas técnicas frente a edificios patagónicos, chicanas de 90° y vistas imponentes al Cerro Mackay.',
    trackWidth: 16,
    defaultLaps: 3,
    baseRecordMs: 31420,
    controlPoints: [
      [-140, 0.2, 160],
      [60, 0.2, 160],
      [210, 0.2, 145],
      [255, 1.5, 45],
      [195, 3.0, -70],
      [250, 4.0, -170],
      [130, 3.5, -245],
      [-20, 1.8, -195],
      [-95, 2.2, -255],
      [-235, 1.5, -185],
      [-210, 0.6, -40],
      [-255, 0.2, 85],
    ],
    environment: {
      type: 'urban',
      skyTop: '#1A3A5C',
      skyHorizon: '#94B8D7',
      fogColor: '#8FB2CE',
      fogDensity: 0.0011,
      sunColor: '#FFE8C2',
      sunIntensity: 1.9,
      groundColor: '#3B523B',
      mountainColor: '#485668',
      snowLineY: 42,
    },
  },
  {
    id: 'puerto_aysen',
    index: 2,
    name: 'Gran Premio Puerto Aysén',
    shortName: 'Puerto Aysén',
    location: 'Puerto Aysén · Puente Ibáñez, Chile',
    region: 'aysen',
    lengthKm: 4.82,
    corners: 13,
    difficulty: 'Alta',
    description:
      'Circuito ribereño que bordea las aguas turquesas del Río Aysén y cruza por un paso icónico inspirado en el Puente colgante Presidente Ibáñez entre bosques húmedos.',
    trackWidth: 15.5,
    defaultLaps: 3,
    baseRecordMs: 34850,
    controlPoints: [
      [-170, 0.4, 150],
      [30, 0.4, 150],
      [190, 5.5, 140],
      [270, 8.0, 20],
      [230, 2.0, -120],
      [95, 1.0, -90],
      [25, 1.2, -210],
      [-115, 2.5, -245],
      [-245, 1.8, -155],
      [-185, 0.8, -35],
      [-265, 0.4, 55],
    ],
    environment: {
      type: 'river',
      skyTop: '#15344E',
      skyHorizon: '#A8CBE0',
      fogColor: '#98BDCE',
      fogDensity: 0.0012,
      sunColor: '#FFF1D0',
      sunIntensity: 1.85,
      groundColor: '#2B4C3B',
      mountainColor: '#3C5361',
      snowLineY: 48,
      waterColor: '#16697A',
      waterLevel: -1.8,
    },
  },
  {
    id: 'cerro_castillo',
    index: 3,
    name: 'Carretera Austral — Cerro Castillo',
    shortName: 'Cerro Castillo',
    location: 'Villa Cerro Castillo · Ruta 7, Chile',
    region: 'aysen',
    lengthKm: 5.58,
    corners: 14,
    difficulty: 'Experto',
    description:
      'Velocidad pura sobre asfalto austral rodeado de agujas de granito nevadas y bosques de lengas. Exige frenadas precisas antes de las horquillas de alta montaña.',
    trackWidth: 15,
    defaultLaps: 3,
    baseRecordMs: 38290,
    controlPoints: [
      [-180, 0.5, 185],
      [90, 0.5, 185],
      [260, 2.5, 140],
      [295, 7.0, -15],
      [190, 10.5, -135],
      [260, 8.0, -255],
      [90, 4.5, -285],
      [-45, 7.5, -175],
      [-175, 5.5, -265],
      [-290, 3.0, -140],
      [-235, 1.5, 10],
      [-285, 0.5, 125],
    ],
    environment: {
      type: 'mountain',
      skyTop: '#102A4A',
      skyHorizon: '#C5DCF0',
      fogColor: '#B3CCE2',
      fogDensity: 0.001,
      sunColor: '#FFF5E0',
      sunIntensity: 2.0,
      groundColor: '#4A553B',
      mountainColor: '#505A66',
      snowLineY: 28,
    },
  },
  {
    id: 'lago_general_carrera',
    index: 4,
    name: 'Lago General Carrera — Mármol',
    shortName: 'Lago Gral. Carrera',
    location: 'Puerto Río Tranquilo · Aysén, Chile',
    region: 'aysen',
    lengthKm: 5.12,
    corners: 12,
    difficulty: 'Alta',
    description:
      'Trazado panorámico de curvas rápidas en S junto al segundo lago más grande de Sudamérica, enmarcado por farallones de mármol blanco y aguas glaciales.',
    trackWidth: 16.5,
    defaultLaps: 3,
    baseRecordMs: 35610,
    controlPoints: [
      [-150, 0.4, 170],
      [85, 0.4, 170],
      [250, 1.8, 120],
      [280, 3.5, -45],
      [170, 2.8, -165],
      [215, 4.2, -260],
      [45, 2.5, -270],
      [-65, 1.2, -160],
      [-185, 2.5, -230],
      [-275, 1.8, -100],
      [-245, 0.6, 55],
    ],
    environment: {
      type: 'lake',
      skyTop: '#143D66',
      skyHorizon: '#9EE0F5',
      fogColor: '#91CEE4',
      fogDensity: 0.001,
      sunColor: '#FFF4D6',
      sunIntensity: 2.05,
      groundColor: '#4D5C43',
      mountainColor: '#5B6A7A',
      snowLineY: 44,
      waterColor: '#0E9AA7',
      waterLevel: -1.6,
    },
  },
];

const PLACE_SEEDS: Array<{
  city: string;
  country: string;
  region: RegionCategory;
  biome: BiomeType;
}> = [
  // Región de Aysén del General Carlos Ibáñez del Campo
  { city: 'Puerto Chacabuco', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'river' },
  { city: 'Puerto Cisnes', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'lake' },
  { city: 'Cochrane', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'mountain' },
  { city: 'Chile Chico', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'lake' },
  { city: 'Caleta Tortel', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'river' },
  { city: 'Villa O’Higgins', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'mountain' },
  { city: 'Puerto Guadal', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'lake' },
  { city: 'Balmaceda', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'mountain' },
  { city: 'Puyuhuapi', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'river' },
  { city: 'La Junta', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'river' },
  { city: 'Puerto Bertrand', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'river' },
  { city: 'Bahía Murta', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'lake' },
  { city: 'Villa Mañihuales', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'mountain' },
  { city: 'El Blanco', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'mountain' },
  { city: 'Melinka', country: 'Guaitecas · Aysén, Chile', region: 'aysen', biome: 'lake' },
  { city: 'Raúl Marín Balmaceda', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'river' },
  { city: 'Puerto Aguirre', country: 'Islas Huichas · Aysén, Chile', region: 'aysen', biome: 'lake' },
  { city: 'Lago Verde', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'mountain' },
  { city: 'Ñirehuao', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'mountain' },
  { city: 'Villa Amengual', country: 'Región de Aysén, Chile', region: 'aysen', biome: 'river' },

  // Región de Los Lagos y Región de Los Ríos
  { city: 'Puerto Montt Costanera', country: 'Región de Los Lagos, Chile', region: 'los_lagos', biome: 'urban' },
  { city: 'Puerto Varas Llanquihue', country: 'Región de Los Lagos, Chile', region: 'los_lagos', biome: 'lake' },
  { city: 'Frutillar Teatro del Lago', country: 'Región de Los Lagos, Chile', region: 'los_lagos', biome: 'lake' },
  { city: 'Castro Palafitos Chiloé', country: 'Región de Los Lagos, Chile', region: 'los_lagos', biome: 'river' },
  { city: 'Ancud Golfo de Quetalmahue', country: 'Región de Los Lagos, Chile', region: 'los_lagos', biome: 'lake' },
  { city: 'Osorno Volcán Puyehue', country: 'Región de Los Lagos, Chile', region: 'los_lagos', biome: 'mountain' },
  { city: 'Chaitén Parque Pumalín', country: 'Región de Los Lagos, Chile', region: 'los_lagos', biome: 'mountain' },
  { city: 'Futaleufú Río Turquesa', country: 'Región de Los Lagos, Chile', region: 'los_lagos', biome: 'river' },
  { city: 'Valdivia Calle-Calle', country: 'Región de Los Ríos, Chile', region: 'los_lagos', biome: 'river' },
  { city: 'Lago Ranco Futrono', country: 'Región de Los Ríos, Chile', region: 'los_lagos', biome: 'lake' },
  { city: 'Panguipulli Siete Lagos', country: 'Región de Los Ríos, Chile', region: 'los_lagos', biome: 'lake' },
  { city: 'Niebla Fuerte Costero', country: 'Región de Los Ríos, Chile', region: 'los_lagos', biome: 'urban' },

  // Región de Magallanes y de la Antártica Chilena
  { city: 'Punta Arenas Estrecho', country: 'Región de Magallanes, Chile', region: 'magallanes', biome: 'urban' },
  { city: 'Puerto Natales Fiordo', country: 'Región de Magallanes, Chile', region: 'magallanes', biome: 'lake' },
  { city: 'Torres del Paine Macizo', country: 'Región de Magallanes, Chile', region: 'magallanes', biome: 'mountain' },
  { city: 'Porvenir Tierra del Fuego', country: 'Región de Magallanes, Chile', region: 'magallanes', biome: 'lake' },
  { city: 'Puerto Williams Navarino', country: 'Región de Magallanes, Chile', region: 'magallanes', biome: 'mountain' },
  { city: 'Cabo Froward Austral', country: 'Región de Magallanes, Chile', region: 'magallanes', biome: 'mountain' },
  { city: 'Pali Aike Cráteres', country: 'Región de Magallanes, Chile', region: 'magallanes', biome: 'desert' },
  { city: 'Cerro Sombrero', country: 'Región de Magallanes, Chile', region: 'magallanes', biome: 'night' },

  // Regiones de La Araucanía, Biobío, Ñuble y Maule
  { city: 'Temuco Cerro Ñielol', country: 'Región de La Araucanía, Chile', region: 'araucania_biobio', biome: 'urban' },
  { city: 'Pucón Volcán Villarrica', country: 'Región de La Araucanía, Chile', region: 'araucania_biobio', biome: 'mountain' },
  { city: 'Villarrica Lago Sur', country: 'Región de La Araucanía, Chile', region: 'araucania_biobio', biome: 'lake' },
  { city: 'Malalcahuello Lonquimay', country: 'Región de La Araucanía, Chile', region: 'araucania_biobio', biome: 'mountain' },
  { city: 'Concepción Desembocadura', country: 'Región del Biobío, Chile', region: 'araucania_biobio', biome: 'river' },
  { city: 'Talcahuano Bahía', country: 'Región del Biobío, Chile', region: 'araucania_biobio', biome: 'night' },
  { city: 'Los Ángeles Salto del Laja', country: 'Región del Biobío, Chile', region: 'araucania_biobio', biome: 'river' },
  { city: 'Chillán Nevados', country: 'Región de Ñuble, Chile', region: 'araucania_biobio', biome: 'mountain' },
  { city: 'Talca Río Claro', country: 'Región del Maule, Chile', region: 'araucania_biobio', biome: 'urban' },
  { city: 'Constitución Dunas Costeras', country: 'Región del Maule, Chile', region: 'araucania_biobio', biome: 'lake' },

  // Regiones Metropolitana, Valparaíso, O’Higgins y Norte de Chile
  { city: 'Santiago Parque O’Higgins', country: 'Región Metropolitana, Chile', region: 'centro_norte', biome: 'urban' },
  { city: 'Farellones Cordillera', country: 'Región Metropolitana, Chile', region: 'centro_norte', biome: 'mountain' },
  { city: 'Valparaíso Cerros y Puerto', country: 'Región de Valparaíso, Chile', region: 'centro_norte', biome: 'urban' },
  { city: 'Viña del Mar Avenida Perú', country: 'Región de Valparaíso, Chile', region: 'centro_norte', biome: 'night' },
  { city: 'Rancagua Coya Cordillera', country: 'Región de O’Higgins, Chile', region: 'centro_norte', biome: 'mountain' },
  { city: 'La Serena Faro Monumental', country: 'Región de Coquimbo, Chile', region: 'centro_norte', biome: 'lake' },
  { city: 'Valle del Elqui Vicuña', country: 'Región de Coquimbo, Chile', region: 'centro_norte', biome: 'night' },
  { city: 'Copiapó Dunas de Atacama', country: 'Región de Atacama, Chile', region: 'centro_norte', biome: 'desert' },
  { city: 'Bahía Inglesa Caldera', country: 'Región de Atacama, Chile', region: 'centro_norte', biome: 'lake' },
  { city: 'San Pedro de Atacama', country: 'Región de Antofagasta, Chile', region: 'centro_norte', biome: 'desert' },
  { city: 'Antofagasta La Portada', country: 'Región de Antofagasta, Chile', region: 'centro_norte', biome: 'desert' },
  { city: 'Iquique Playa Cavancha', country: 'Región de Tarapacá, Chile', region: 'centro_norte', biome: 'night' },
  { city: 'Arica Morro Histórico', country: 'Región de Arica y Parinacota, Chile', region: 'centro_norte', biome: 'desert' },
];

const VARIANT_SUFFIXES = [
  'Gran Premio',
  'Autódromo Regional',
  'Trazado Urbano',
  'Circuito Austral',
  'Sector Cordillera',
  'Copa Chile F1',
  'Trazado Nocturno',
  'Sprint Costero',
  'Circuito Bahía',
  'Ruta Panorámica',
  'Anillo Bicentenario',
  'Circuito Veloz',
];

function seededRand(seed: number): number {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function getBiomeEnvironment(biome: BiomeType, seed: number): CircuitEnvironment {
  if (biome === 'night') {
    return {
      type: 'night',
      skyTop: '#04070E',
      skyHorizon: '#142038',
      fogColor: '#0E1729',
      fogDensity: 0.0014,
      sunColor: '#93C5FD',
      sunIntensity: 1.35,
      groundColor: '#1E242E',
      mountainColor: '#252F3F',
      snowLineY: 54,
    };
  }
  if (biome === 'desert') {
    return {
      type: 'desert',
      skyTop: '#2E5A88',
      skyHorizon: '#F2C58B',
      fogColor: '#E5BC87',
      fogDensity: 0.0009,
      sunColor: '#FFE4A8',
      sunIntensity: 2.15,
      groundColor: '#9A7B52',
      mountainColor: '#7C5D41',
      snowLineY: 90,
    };
  }
  if (biome === 'lake') {
    return {
      type: 'lake',
      skyTop: '#143D66',
      skyHorizon: '#9EE0F5',
      fogColor: '#91CEE4',
      fogDensity: 0.001,
      sunColor: '#FFF4D6',
      sunIntensity: 1.95,
      groundColor: '#445C40',
      mountainColor: '#566779',
      snowLineY: 42,
      waterColor: seededRand(seed) > 0.5 ? '#0E9AA7' : '#1D6FA5',
      waterLevel: -1.6,
    };
  }
  if (biome === 'river') {
    return {
      type: 'river',
      skyTop: '#15344E',
      skyHorizon: '#A8CBE0',
      fogColor: '#98BDCE',
      fogDensity: 0.0011,
      sunColor: '#FFF1D0',
      sunIntensity: 1.85,
      groundColor: '#2B4C3B',
      mountainColor: '#3C5361',
      snowLineY: 46,
      waterColor: '#16697A',
      waterLevel: -1.8,
    };
  }
  if (biome === 'mountain') {
    return {
      type: 'mountain',
      skyTop: '#102A4A',
      skyHorizon: '#C5DCF0',
      fogColor: '#B3CCE2',
      fogDensity: 0.001,
      sunColor: '#FFF5E0',
      sunIntensity: 2.0,
      groundColor: '#4A553B',
      mountainColor: '#505A66',
      snowLineY: 28,
    };
  }
  return {
    type: 'urban',
    skyTop: '#1A3A5C',
    skyHorizon: '#94B8D7',
    fogColor: '#8FB2CE',
    fogDensity: 0.0011,
    sunColor: '#FFE8C2',
    sunIntensity: 1.9,
    groundColor: '#3B523B',
    mountainColor: '#485668',
    snowLineY: 44,
  };
}

function generateTrackControlPoints(
  seed: number,
  biome: BiomeType
): [number, number, number][] {
  const numPts = 12;
  const baseRadiusX = 215 + seededRand(seed + 1) * 75;
  const baseRadiusZ = 185 + seededRand(seed + 2) * 75;
  const amp2 = 25 + seededRand(seed + 3) * 45;
  const amp3 = 20 + seededRand(seed + 4) * 40;
  const amp4 = 12 + seededRand(seed + 5) * 28;
  const phase2 = seededRand(seed + 6) * Math.PI * 2;
  const phase3 = seededRand(seed + 7) * Math.PI * 2;
  const phase4 = seededRand(seed + 8) * Math.PI * 2;
  const elevAmp = biome === 'mountain' ? 11.0 : biome === 'urban' ? 2.5 : 5.5;

  const pts: [number, number, number][] = [];
  for (let i = 0; i < numPts; i++) {
    const a = (i / numPts) * Math.PI * 2;
    const radialMod =
      1 +
      (amp2 / 240) * Math.cos(2 * a + phase2) +
      (amp3 / 240) * Math.sin(3 * a + phase3) +
      (amp4 / 240) * Math.cos(4 * a + phase4);

    // Keep start/finish straight relatively flat on the first two points
    const isStartZone = i === 0 || i === 1 || i === numPts - 1;
    const y = isStartZone
      ? 0.3
      : Math.max(
          0.3,
          (Math.sin(a * 2 + phase2) * 0.5 + 0.5) * elevAmp
        );

    const x = Math.cos(a) * baseRadiusX * radialMod;
    const z = Math.sin(a) * baseRadiusZ * radialMod;
    pts.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10, Math.round(z * 10) / 10]);
  }
  return pts;
}

function buildAll900Circuits(): CircuitDefinition[] {
  const list: CircuitDefinition[] = [...FEATURED_AYSEN_CIRCUITS];
  const TOTAL = 900;

  for (let i = FEATURED_AYSEN_CIRCUITS.length; i < TOTAL; i++) {
    const idx = i + 1; // 5..900
    const place = PLACE_SEEDS[i % PLACE_SEEDS.length];
    const variantIdx = Math.floor(i / PLACE_SEEDS.length);
    const variant = VARIANT_SUFFIXES[variantIdx % VARIANT_SUFFIXES.length];
    const sectorNum = Math.floor(variantIdx / VARIANT_SUFFIXES.length) + 1;

    const biome: BiomeType =
      variant === 'Trazado Nocturno' ? 'night' : place.biome;

    const nameSuffix = sectorNum > 1 ? ` ${sectorNum}` : '';
    const name = `${place.city} — ${variant}${nameSuffix}`;
    const shortName = `${place.city}${sectorNum > 1 ? ` #${idx}` : ''}`;

    const seed = idx * 37.13;
    const lengthKm = Math.round((3.6 + seededRand(seed + 11) * 3.2) * 100) / 100;
    const corners = 9 + Math.floor(seededRand(seed + 12) * 10);
    const diffRoll = seededRand(seed + 13);
    const difficulty: CircuitDefinition['difficulty'] =
      diffRoll < 0.38 ? 'Media' : diffRoll < 0.78 ? 'Alta' : 'Experto';
    const baseRecordMs = Math.round(28500 + lengthKm * 3200 + corners * 180);

    list.push({
      id: `track-${idx}`,
      index: idx,
      name,
      shortName,
      location: `${place.city} · ${place.country}`,
      region: place.region,
      lengthKm,
      corners,
      difficulty,
      description: `Circuito #${idx} en ${place.city} (${place.country}). ${corners} curvas de alta exigencia sobre trazado ${
        biome === 'night'
          ? 'nocturno iluminado'
          : biome === 'mountain'
            ? 'de alta montaña'
            : biome === 'desert'
              ? 'desértico veloz'
              : biome === 'lake'
                ? 'lacustre panorámico'
                : biome === 'river'
                  ? 'fluvial entre bosques'
                  : 'urbano técnico'
      }.`,
      trackWidth: 15.5 + (seededRand(seed + 14) > 0.5 ? 1 : 0),
      defaultLaps: 3,
      controlPoints: generateTrackControlPoints(seed, biome),
      environment: getBiomeEnvironment(biome, seed),
      baseRecordMs,
    });
  }

  return list;
}

export const CIRCUITS: CircuitDefinition[] = buildAll900Circuits();

export const FEATURED_CIRCUITS: CircuitDefinition[] = CIRCUITS.slice(0, 4);

const CIRCUIT_MAP = new Map<string, CircuitDefinition>(
  CIRCUITS.map((c) => [c.id, c])
);

export function getCircuitById(id: CircuitId): CircuitDefinition {
  return CIRCUIT_MAP.get(id) ?? CIRCUITS[0];
}
