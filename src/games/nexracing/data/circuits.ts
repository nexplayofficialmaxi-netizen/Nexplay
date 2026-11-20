import { CircuitSpec, TrackWaypoint } from '../types/game';

function makeStadiumOvalWaypoints(
  straightHalf: number,
  radiusZ: number,
  turnBank: number,
): TrackWaypoint[] {
  const diag = radiusZ * 0.7071;
  const entryBank = turnBank * 0.42;
  return [
    { x: 0, y: 0, z: radiusZ, bank: 0 },
    { x: straightHalf, y: 0, z: radiusZ, bank: 0 },
    { x: straightHalf + diag, y: 0, z: diag, bank: entryBank },
    { x: straightHalf + radiusZ, y: 0, z: 0, bank: turnBank },
    { x: straightHalf + diag, y: 0, z: -diag, bank: entryBank },
    { x: straightHalf, y: 0, z: -radiusZ, bank: 0 },
    { x: 0, y: 0, z: -radiusZ, bank: 0 },
    { x: -straightHalf, y: 0, z: -radiusZ, bank: 0 },
    { x: -straightHalf - diag, y: 0, z: -diag, bank: entryBank },
    { x: -straightHalf - radiusZ, y: 0, z: 0, bank: turnBank },
    { x: -straightHalf - diag, y: 0, z: diag, bank: entryBank },
    { x: -straightHalf, y: 0, z: radiusZ, bank: 0 },
  ];
}

export const CIRCUITS: CircuitSpec[] = [
  {
    id: 'daytona-superspeedway',
    name: 'Daytona International Speedway',
    location: 'Daytona Beach, Florida (EE.UU.)',
    type: 'Superspeedway',
    lengthKm: 4.02,
    defaultLaps: 5,
    maxBankingDeg: 31,
    trackWidth: 28,
    difficulty: 'Fácil',
    theme: 'daytona_day',
    isNight: false,
    recordLapMs: 22180,
    description:
      'La catedral de NASCAR. Óvalo perfecto de 2.5 millas con rectas limpias y curvas peraltadas a 31° diseñadas para correr en pelotón compacto a máxima velocidad.',
    waypoints: makeStadiumOvalWaypoints(145, 190, 0.48),
  },
  {
    id: 'talladega-superspeedway',
    name: 'Talladega Superspeedway',
    location: 'Lincoln, Alabama (EE.UU.)',
    type: 'Superspeedway',
    lengthKm: 4.28,
    defaultLaps: 5,
    maxBankingDeg: 33,
    trackWidth: 30,
    difficulty: 'Media',
    theme: 'talladega_sunset',
    isNight: false,
    recordLapMs: 23450,
    description:
      'El óvalo más largo y rápido del calendario NASCAR (2.66 millas). Peralte extremo de 33°, cuatro carriles en paralelo y riesgo constante del clásico "Big One".',
    waypoints: makeStadiumOvalWaypoints(165, 210, 0.52),
  },
  {
    id: 'charlotte-night',
    name: 'Charlotte Motor Speedway (Noche)',
    location: 'Concord, Carolina del Norte (EE.UU.)',
    type: 'Quad-Oval Nocturno',
    lengthKm: 2.41,
    defaultLaps: 6,
    maxBankingDeg: 24,
    trackWidth: 26,
    difficulty: 'Media',
    theme: 'charlotte_night',
    isNight: true,
    recordLapMs: 18420,
    description:
      'Carrera nocturna bajo miles de reflectores LED y tribunas repletas. Óvalo rápido de 1.5 millas con rectas limpias y 24° de peralte.',
    waypoints: makeStadiumOvalWaypoints(120, 160, 0.39),
  },
  {
    id: 'bristol-night',
    name: 'Bristol Motor Speedway (Noche)',
    location: 'Bristol, Tennessee (EE.UU.)',
    type: 'Short Track Nocturno',
    lengthKm: 0.86,
    defaultLaps: 8,
    maxBankingDeg: 28,
    trackWidth: 25,
    difficulty: 'Alta',
    theme: 'bristol_night',
    isNight: true,
    recordLapMs: 13250,
    description:
      'El legendario "Último Gran Coliseo". Short track nocturno en forma de óvalo cerrado rodeado de graderías gigantes donde cada roce desata un accidente.',
    waypoints: makeStadiumOvalWaypoints(95, 125, 0.45),
  },
];
