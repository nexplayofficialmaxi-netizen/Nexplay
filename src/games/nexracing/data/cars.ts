import { StockCarSpec } from '../types/game';

export const STOCK_CARS: StockCarSpec[] = [
  {
    id: 'nexplay-07',
    name: 'NexPlay Gen-7 Stock V8',
    team: 'NexPlay Motorsports',
    sponsor: 'NEXPLAY',
    defaultNumber: '07',
    primaryColor: '#E11D48',
    secondaryColor: '#0F172A',
    accentColor: '#38BDF8',
    pattern: 'apex',
    stats: {
      topSpeed: 93,
      acceleration: 91,
      handling: 90,
      braking: 88,
    },
    description:
      'Stock car Next-Gen V8 oficial de NexPlay. Balance perfecto de carga aerodinámica para superspeedways y short tracks NASCAR.',
  },
  {
    id: 'cup-24',
    name: 'Hendrix Aero 24',
    team: 'Carolina Speed Team',
    sponsor: 'SUNOCO',
    defaultNumber: '24',
    primaryColor: '#2563EB',
    secondaryColor: '#FACC15',
    accentColor: '#F8FAFC',
    pattern: 'flames',
    stats: {
      topSpeed: 96,
      acceleration: 89,
      handling: 87,
      braking: 86,
    },
    description:
      'Chasis optimizado para rebufo y velocidad punta en Daytona y Talladega con paquete de baja resistencia al aire.',
  },
  {
    id: 'cup-88',
    name: 'Mountain Interceptor 88',
    team: 'Appalachian Racing',
    sponsor: 'GOODWRENCH',
    defaultNumber: '88',
    primaryColor: '#090B10',
    secondaryColor: '#DC2626',
    accentColor: '#F8FAFC',
    pattern: 'stripes',
    stats: {
      topSpeed: 91,
      acceleration: 95,
      handling: 89,
      braking: 90,
    },
    description:
      'Torque agresivo de salida en relanzamientos y aceleración instantánea al salir de los peraltes.',
  },
  {
    id: 'cup-11',
    name: 'Thunder Coliseum 11',
    team: 'FedEx Cup Garage',
    sponsor: 'NEXRACING',
    defaultNumber: '11',
    primaryColor: '#7C3AED',
    secondaryColor: '#111827',
    accentColor: '#F97316',
    pattern: 'chevron',
    stats: {
      topSpeed: 89,
      acceleration: 90,
      handling: 96,
      braking: 94,
    },
    description:
      'Configuración especial de short track para Bristol y Charlotte. Máximo agarre lateral y estabilidad en tráfico cerrado.',
  },
  {
    id: 'cup-42',
    name: 'Coastal Surge 42',
    team: 'Daytona Heritage',
    sponsor: 'GOODYEAR',
    defaultNumber: '42',
    primaryColor: '#0284C7',
    secondaryColor: '#0F172A',
    accentColor: '#FDE047',
    pattern: 'dual',
    stats: {
      topSpeed: 93,
      acceleration: 92,
      handling: 88,
      braking: 87,
    },
    description:
      'Stock car equilibrado de gran respuesta en cambios de carril hasta los 500 km/h.',
  },
  {
    id: 'cup-99',
    name: 'Trackhouse Apex 99',
    team: 'Charlotte Night Ops',
    sponsor: 'MOBIL 1',
    defaultNumber: '99',
    primaryColor: '#F97316',
    secondaryColor: '#18181B',
    accentColor: '#F8FAFC',
    pattern: 'apex',
    stats: {
      topSpeed: 95,
      acceleration: 90,
      handling: 88,
      braking: 89,
    },
    description:
      'Motor V8 de competición nocturna construido para resistir choques duros y peleas lado a lado.',
  },
];

export const AI_DRIVER_NAMES = [
  { name: 'K. Larson', number: '05', team: 'Carolina Speed', color: '#2563EB' },
  { name: 'D. Hamlin', number: '11', team: 'Virginia Racing', color: '#7C3AED' },
  { name: 'C. Elliott', number: '09', team: 'Dawsonville Cup', color: '#1D4ED8' },
  { name: 'J. Logano', number: '22', team: 'Shell Pennzoil', color: '#EAB308' },
  { name: 'R. Blaney', number: '12', team: 'Penske Stock', color: '#F97316' },
  { name: 'K. Busch', number: '08', team: 'RCR Racing', color: '#DC2626' },
  { name: 'T. Reddick', number: '45', team: '23XI Cup', color: '#10B981' },
  { name: 'W. Byron', number: '24', team: 'Liberty Motors', color: '#EF4444' },
  { name: 'B. Keselowski', number: '06', team: 'RFK Racing', color: '#06B6D4' },
  { name: 'C. Bell', number: '20', team: 'Dewalt Stock', color: '#F59E0B' },
  { name: 'M. Truex', number: '19', team: 'Bass Pro Cup', color: '#EA580C' },
];

export const LIVERY_SWATCHES = [
  '#E11D48', // Crimson
  '#DC2626', // NASCAR Red
  '#F97316', // Pennzoil Orange
  '#D97706', // Copper Gold
  '#EAB308', // Daytona Yellow
  '#10B981', // Interstate Green
  '#0284C7', // Sky Cyan
  '#2563EB', // Cobalt Blue
  '#7C3AED', // Purple
  '#F8FAFC', // White
  '#1E293B', // Slate
  '#090B10', // Carbon Black
];
