import { createContext, ReactNode, useContext, useEffect } from 'react';
import { LanguageCode } from '../types/game';

export interface LanguageOption {
  code: LanguageCode;
  nativeName: string;
  spanishName: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'es', nativeName: 'Español', spanishName: 'Español', flag: '🇨🇱' },
  { code: 'en', nativeName: 'English', spanishName: 'Inglés', flag: '🇺🇸' },
  { code: 'pt', nativeName: 'Português', spanishName: 'Portugués', flag: '🇧🇷' },
  { code: 'fr', nativeName: 'Français', spanishName: 'Francés', flag: '🇫🇷' },
  { code: 'de', nativeName: 'Deutsch', spanishName: 'Alemán', flag: '🇩🇪' },
  { code: 'it', nativeName: 'Italiano', spanishName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', nativeName: '日本語', spanishName: 'Japonés', flag: '🇯🇵' },
  { code: 'ko', nativeName: '한국어', spanishName: 'Coreano', flag: '🇰🇷' },
  { code: 'zh', nativeName: '中文', spanishName: 'Chino', flag: '🇨🇳' },
  { code: 'ru', nativeName: 'Русский', spanishName: 'Ruso', flag: '🇷🇺' },
  { code: 'ar', nativeName: 'العربية', spanishName: 'Árabe', flag: '🇸🇦' },
  { code: 'nl', nativeName: 'Nederlands', spanishName: 'Neerlandés', flag: '🇳🇱' },
];

export interface Translations {
  nav: {
    home: string;
    tracks: string;
    garage: string;
    online: string;
    settings: string;
    raceNow: string;
  };
  home: {
    heroTitle: string;
    heroDesc: string;
    exploreTracks: string;
    shopGarage: string;
    settingsSound: string;
    leaderboard: string;
    yourMoney: string;
    unlockedCars: string;
    tracksDriven: string;
    gameModes: string;
    modesSub: string;
    selectMode: string;
    featuredCircuits: string;
    viewAll900: string;
    raceHere: string;
    careerTitle: string;
    careerSub: string;
    careerDetail: string;
    onlineTitle: string;
    onlineSub: string;
    onlineDetail: string;
    timeTrialTitle: string;
    timeTrialSub: string;
    timeTrialDetail: string;
    quickRaceTitle: string;
    quickRaceSub: string;
    quickRaceDetail: string;
  };
  settings: {
    title: string;
    subtitle: string;
    saved: string;
    resetDefaults: string;
    languageTitle: string;
    languageDesc: string;
    activeLang: string;
    soundTitle: string;
    soundDesc: string;
    soundOn: string;
    soundOff: string;
    masterVol: string;
    masterVolDesc: string;
    engineVol: string;
    tiresVol: string;
    effectsVol: string;
    testEngine: string;
    testDrift: string;
    testEffects: string;
    keyboardTitle: string;
    keyboardDesc: string;
    pressKey: string;
    gamepadTitle: string;
    gamepadDesc: string;
    padConnected: string;
    padDisconnected: string;
    codesTitle: string;
    codesDesc: string;
    redeemBtn: string;
    trackHudTitle: string;
    trackHudDesc: string;
    hudOn: string;
    hudOff: string;
    hudTurnOff: string;
    hudTurnOn: string;
  };
  modes: {
    title: string;
    subtitle: string;
    quickrace: string;
    career: string;
    timetrial: string;
    online: string;
    leaderboard: string;
    tireWearTitle: string;
    tireWearHint: string;
    tireWearOnTitle: string;
    tireWearOnDesc: string;
    tireWearOffTitle: string;
    tireWearOffDesc: string;
    playerModeTitle: string;
    onePlayer: string;
    splitScreen: string;
    pilotName: string;
    pilot1Name: string;
    pilot2Name: string;
    pilot2Car: string;
    officialDistance: string;
    aiDifficulty: string;
    rookie: string;
    pro: string;
    legend: string;
    searchPlaceholder: string;
    tracksFound: string;
    prev: string;
    next: string;
    length: string;
    corners: string;
    yourRecord: string;
    baseRecord: string;
    firstPrize: string;
    launch2P: string;
    launch1P: string;
    launchTimeTrial: string;
  };
  garage: {
    title: string;
    teamTab: string;
    createTab: string;
    paintTab: string;
    setupTab: string;
    save: string;
    testTrack: string;
    buyCar: string;
    sellCar: string;
    equipped: string;
  };
  leaderboard: {
    title: string;
    subtitle: string;
    all: string;
    loading: string;
    empty: string;
    pos: string;
    driver: string;
    team: string;
    circuit: string;
    tire: string;
    mode: string;
    bestLap: string;
  };
  online: {
    loginTitle: string;
    loginTab: string;
    registerTab: string;
    username: string;
    password: string;
    repeatPassword: string;
    loginBtn: string;
    registerBtn: string;
    serversTitle: string;
    createRoom: string;
    logout: string;
  };
  race: {
    pauseTitle: string;
    resume: string;
    restart: string;
    exit: string;
    pits: string;
    tires: string;
    lap: string;
    sound: string;
    mute: string;
    hudShow: string;
    hudHide: string;
    tireGreen: string;
    tireYellow: string;
    tireRed: string;
  };
}

const ES: Translations = {
  nav: {
    home: 'Inicio',
    tracks: 'Pistas',
    garage: 'Garaje',
    online: 'Online',
    settings: 'Ajustes',
    raceNow: 'Correr Ahora',
  },
  home: {
    heroTitle: '¡La velocidad llega a la Patagonia!',
    heroDesc:
      'Compite en 900 pistas de Aysén y todas las regiones de Chile para ganar dinero, comprar monoplazas con distintos tamaños de ruedas, chasis y banderas, o crear y vender tus propios Fórmula 1.',
    exploreTracks: 'Explorar 900 Pistas',
    shopGarage: 'Tienda y Garaje',
    settingsSound: 'Ajustes y Sonido',
    leaderboard: 'Clasificación',
    yourMoney: 'Tu dinero',
    unlockedCars: 'F1 desbloqueados',
    tracksDriven: 'Pistas corridas',
    gameModes: 'Modos de Juego',
    modesSub: 'Sin descargas · Juega offline sin cuenta o inicia sesión para competir online',
    selectMode: 'Seleccionar modo',
    featuredCircuits: 'Circuitos Principales de la Región de Aysén',
    viewAll900: 'Ver las 900 pistas disponibles →',
    raceHere: 'Correr Aquí',
    careerTitle: 'Modo Carrera',
    careerSub: 'Campeonato Patagónico IA',
    careerDetail:
      'Compite contra 8 rivales de IA (9 autos en parrilla) en carreras oficiales a 3 vueltas, suma puntos y gana dinero para tu garaje.',
    onlineTitle: 'Modo Online',
    onlineSub: 'Requiere Iniciar Sesión',
    onlineDetail:
      'Inicia sesión solo para el modo multijugador, únete a servidores en tiempo real o crea salas en cualquiera de las 900 pistas.',
    timeTrialTitle: 'Contrarreloj',
    timeTrialSub: 'Vuelta Rápida y Récords',
    timeTrialDetail:
      'Pista libre para perfeccionar tus derrapes, marcar récords en la clasificación y ganar $3,500 por cada vuelta completada.',
    quickRaceTitle: 'Carrera Rápida',
    quickRaceSub: '900 Pistas · 3 Vueltas',
    quickRaceDetail:
      'Corre en cualquiera de las 900 pistas para ganar dinero, comprar nuevos Fórmula 1 y guardar todo tu progreso automáticamente.',
  },
  settings: {
    title: 'Ajustes de Idioma, Sonido y Controles',
    subtitle:
      'Elige tu idioma, ajusta el volumen del motor, derrapes y efectos, conecta tu mando o personaliza el teclado',
    saved: 'Configuración guardada',
    resetDefaults: 'Restablecer Predeterminados',
    languageTitle: 'Idioma del Juego',
    languageDesc: 'Selecciona entre 12 idiomas disponibles para todos los menús y la carrera',
    activeLang: 'Idioma activo',
    soundTitle: 'Sonido y Volumen',
    soundDesc: 'Regula el audio general, motor Fórmula 1, derrape de ruedas y avisos de pista o pits',
    soundOn: 'Sonido Activado (Silenciar)',
    soundOff: 'Sonido Silenciado (Activar)',
    masterVol: 'Volumen General',
    masterVolDesc: 'Controla todo el audio del simulador',
    engineVol: 'Motor F1',
    tiresVol: 'Derrape y Ruedas',
    effectsVol: 'Efectos (Pits y Semáforo)',
    testEngine: 'Probar Motor',
    testDrift: 'Probar Derrape',
    testEffects: 'Probar Efectos',
    keyboardTitle: 'Teclado',
    keyboardDesc: 'Haz clic en una tecla y presiona la nueva tecla que deseas asignar',
    pressKey: 'Presiona tecla...',
    gamepadTitle: 'Mando / Controlador',
    gamepadDesc: 'Compatible con Xbox, PlayStation, DualSense y controles USB',
    padConnected: 'Mando Conectado',
    padDisconnected: 'Sin Mando Detectado',
    codesTitle: 'Insertar Códigos F1',
    codesDesc: 'Ingresa códigos especiales de F1 Simulador Aysén para desbloquear recompensas',
    redeemBtn: 'Canjear Código',
    trackHudTitle: 'Información del F1 en Pista',
    trackHudDesc: 'Oculta los kilómetros (km/h), posición, marcha y barra de DRS durante la carrera',
    hudOn: 'Información Activada',
    hudOff: 'Información Desactivada',
    hudTurnOff: 'Desactivar Información en Pista',
    hudTurnOn: 'Activar Información en Pista',
  },
  modes: {
    title: 'Catálogo de 900 Pistas y Modos',
    subtitle: 'Carreras oficiales a 3 vueltas · Parrilla de 9 Fórmula 1 · Sin registro obligatorio',
    quickrace: 'Carrera Rápida',
    career: 'Modo Carrera',
    timetrial: 'Contrarreloj',
    online: 'Online',
    leaderboard: 'Clasificación',
    tireWearTitle: 'Ruedas antes de elegir el mapa',
    tireWearHint: 'Elige si las ruedas se desgastan en carrera o si se mantienen siempre nuevas',
    tireWearOnTitle: 'Con Ruedas Desgastadas',
    tireWearOnDesc: 'Verde → Amarillo → Rojo al correr o chocar rejas (pide Pits)',
    tireWearOffTitle: 'Sin Desgaste de Ruedas',
    tireWearOffDesc: 'Ruedas siempre nuevas al 100% durante toda la carrera',
    playerModeTitle: 'Modo de Jugadores en Pista',
    onePlayer: '1 Jugador',
    splitScreen: 'Multijugador · Mitad de Pantalla',
    pilotName: 'Nombre del Piloto',
    pilot1Name: 'Nombre Jugador 1 (Izq.)',
    pilot2Name: 'Nombre Jugador 2 (Mitad Derecha)',
    pilot2Car: 'Fórmula 1 del Jugador 2',
    officialDistance: 'Distancia Oficial',
    aiDifficulty: 'Dificultad IA',
    rookie: 'Novato',
    pro: 'Pro',
    legend: 'Leyenda',
    searchPlaceholder: 'Buscar pista en Chile (ej. Coyhaique, Puerto Varas, Punta Arenas, Atacama)...',
    tracksFound: 'pistas encontradas',
    prev: 'Anterior',
    next: 'Siguiente',
    length: 'Longitud',
    corners: 'Curvas',
    yourRecord: 'Tu Récord',
    baseRecord: 'Récord Base',
    firstPrize: 'Premio 1°',
    launch2P: 'Largar 2 Jugadores (Mitad de Pantalla · 9 F1)',
    launch1P: 'Largar Carrera (3 Vueltas · 9 F1)',
    launchTimeTrial: 'Iniciar Contrarreloj',
  },
  garage: {
    title: 'Garaje y Tienda de F1',
    teamTab: 'Comprar / Escudería',
    createTab: 'Crear F1',
    paintTab: 'Colores',
    setupTab: 'Ajuste Pista',
    save: 'Guardar Auto',
    testTrack: 'Probar en Pista',
    buyCar: 'Comprar F1',
    sellCar: 'Vender F1',
    equipped: 'Equipado',
  },
  leaderboard: {
    title: 'Clasificación de Pilotos',
    subtitle: 'Mejores tiempos de vuelta oficiales registrados en los circuitos',
    all: 'Todos',
    loading: 'Cargando tiempos oficiales...',
    empty: 'Aún no hay vueltas registradas en este circuito.',
    pos: 'Pos',
    driver: 'Piloto',
    team: 'Escudería',
    circuit: 'Circuito',
    tire: 'Neumático',
    mode: 'Modo',
    bestLap: 'Mejor Vuelta',
  },
  online: {
    loginTitle: 'Acceso Online (Nombre y Contraseña)',
    loginTab: 'Iniciar Sesión',
    registerTab: 'Crear Cuenta',
    username: 'Nombre de Piloto',
    password: 'Contraseña',
    repeatPassword: 'Repetir Contraseña',
    loginBtn: 'Entrar al Online',
    registerBtn: 'Crear Cuenta y Entrar',
    serversTitle: 'Servidores Multijugador Online',
    createRoom: 'Crear Sala',
    logout: 'Cerrar Sesión',
  },
  race: {
    pauseTitle: 'Carrera en Pausa',
    resume: 'Reanudar Carrera',
    restart: 'Reiniciar Carrera',
    exit: 'Salir al Menú',
    pits: 'Pits',
    tires: 'Ruedas',
    lap: 'Vuelta',
    sound: 'Sonido',
    mute: 'Silenciar',
    hudShow: 'Mostrar Info F1',
    hudHide: 'Ocultar Info F1',
    tireGreen: 'Ruedas Verdes · Óptimas',
    tireYellow: 'Ruedas Amarillas · Desgaste Medio',
    tireRed: '¡Ruedas Rojas! Ve a los Pits',
  },
};

const EN: Translations = {
  nav: {
    home: 'Home',
    tracks: 'Tracks',
    garage: 'Garage',
    online: 'Online',
    settings: 'Settings',
    raceNow: 'Race Now',
  },
  home: {
    heroTitle: 'Speed arrives in Patagonia!',
    heroDesc:
      'Compete across 900 circuits in Aysén and all regions of Chile to earn cash, buy Formula 1 cars with different wheel sizes, bodies and flags, or build and sell your own F1.',
    exploreTracks: 'Explore 900 Tracks',
    shopGarage: 'Shop & Garage',
    settingsSound: 'Settings & Sound',
    leaderboard: 'Leaderboard',
    yourMoney: 'Your cash',
    unlockedCars: 'F1 unlocked',
    tracksDriven: 'Tracks raced',
    gameModes: 'Game Modes',
    modesSub: 'No downloads · Play offline or sign in to race online',
    selectMode: 'Select mode',
    featuredCircuits: 'Featured Aysén Region Circuits',
    viewAll900: 'Browse all 900 tracks →',
    raceHere: 'Race Here',
    careerTitle: 'Career Mode',
    careerSub: 'AI Patagonia Championship',
    careerDetail:
      'Race against 8 AI rivals (9 F1 cars on grid) in 3-lap official races, score points and earn money for your garage.',
    onlineTitle: 'Online Mode',
    onlineSub: 'Login Required',
    onlineDetail:
      'Sign in for multiplayer only, join real-time servers or host rooms on any of the 900 tracks.',
    timeTrialTitle: 'Time Trial',
    timeTrialSub: 'Hotlap & Records',
    timeTrialDetail:
      'Open track to master drifting, set leaderboard records and earn $3,500 per completed lap.',
    quickRaceTitle: 'Quick Race',
    quickRaceSub: '900 Tracks · 3 Laps',
    quickRaceDetail:
      'Race on any of the 900 tracks to earn cash, buy new Formula 1 cars and save all progress automatically.',
  },
  settings: {
    title: 'Language, Sound & Control Settings',
    subtitle:
      'Pick your language, adjust engine, drift & effects volume, connect a controller or customize keys',
    saved: 'Settings saved',
    resetDefaults: 'Reset Defaults',
    languageTitle: 'Game Language',
    languageDesc: 'Choose from 12 available languages for menus and race HUD',
    activeLang: 'Active language',
    soundTitle: 'Sound & Volume',
    soundDesc: 'Adjust master audio, F1 engine, tire drift screech and pit/race effects',
    soundOn: 'Sound On (Mute)',
    soundOff: 'Muted (Unmute)',
    masterVol: 'Master Volume',
    masterVolDesc: 'Controls all simulator audio',
    engineVol: 'F1 Engine',
    tiresVol: 'Drift & Tires',
    effectsVol: 'Effects (Pits & Lights)',
    testEngine: 'Test Engine',
    testDrift: 'Test Drift',
    testEffects: 'Test Effects',
    keyboardTitle: 'Keyboard',
    keyboardDesc: 'Click any binding and press the new key to assign',
    pressKey: 'Press key...',
    gamepadTitle: 'Controller / Gamepad',
    gamepadDesc: 'Supports Xbox, PlayStation, DualSense and USB controllers',
    padConnected: 'Controller Connected',
    padDisconnected: 'No Controller Detected',
    codesTitle: 'Enter F1 Codes',
    codesDesc: 'Enter special F1 Simulator Aysén promo codes to unlock rewards',
    redeemBtn: 'Redeem Code',
    trackHudTitle: 'On-Track F1 Telemetry',
    trackHudDesc: 'Hide speed (km/h), position, gear and DRS bar during races',
    hudOn: 'Telemetry Enabled',
    hudOff: 'Telemetry Disabled',
    hudTurnOff: 'Hide On-Track Info',
    hudTurnOn: 'Show On-Track Info',
  },
  modes: {
    title: '900 Tracks & Game Modes',
    subtitle: 'Official 3-lap races · 9 Formula 1 grid · No account needed',
    quickrace: 'Quick Race',
    career: 'Career Mode',
    timetrial: 'Time Trial',
    online: 'Online',
    leaderboard: 'Leaderboard',
    tireWearTitle: 'Tire Wear before choosing the map',
    tireWearHint: 'Choose whether tires wear down during the race or stay 100% fresh',
    tireWearOnTitle: 'Worn Tires Enabled',
    tireWearOnDesc: 'Green → Yellow → Red while racing or hitting fences (Pit stop needed)',
    tireWearOffTitle: 'No Tire Wear',
    tireWearOffDesc: 'Tires stay 100% green and fresh for the entire race',
    playerModeTitle: 'On-Track Player Mode',
    onePlayer: '1 Player',
    splitScreen: 'Split-Screen Multiplayer',
    pilotName: 'Driver Name',
    pilot1Name: 'Player 1 Name (Left)',
    pilot2Name: 'Player 2 Name (Right Half)',
    pilot2Car: 'Player 2 Formula 1',
    officialDistance: 'Official Distance',
    aiDifficulty: 'AI Difficulty',
    rookie: 'Rookie',
    pro: 'Pro',
    legend: 'Legend',
    searchPlaceholder: 'Search track in Chile (e.g. Coyhaique, Puerto Varas, Atacama)...',
    tracksFound: 'tracks found',
    prev: 'Previous',
    next: 'Next',
    length: 'Length',
    corners: 'Corners',
    yourRecord: 'Your Best',
    baseRecord: 'Track Record',
    firstPrize: '1st Prize',
    launch2P: 'Start 2-Player Split-Screen (9 F1)',
    launch1P: 'Start Race (3 Laps · 9 F1)',
    launchTimeTrial: 'Start Time Trial',
  },
  garage: {
    title: 'F1 Garage & Dealership',
    teamTab: 'Buy / Teams',
    createTab: 'Create F1',
    paintTab: 'Colors',
    setupTab: 'Track Setup',
    save: 'Save Car',
    testTrack: 'Test on Track',
    buyCar: 'Buy F1',
    sellCar: 'Sell F1',
    equipped: 'Equipped',
  },
  leaderboard: {
    title: 'Driver Leaderboard',
    subtitle: 'Official fastest lap times recorded on the circuits',
    all: 'All',
    loading: 'Loading official times...',
    empty: 'No lap times recorded on this circuit yet.',
    pos: 'Pos',
    driver: 'Driver',
    team: 'Team',
    circuit: 'Circuit',
    tire: 'Tire',
    mode: 'Mode',
    bestLap: 'Best Lap',
  },
  online: {
    loginTitle: 'Online Sign In (Username & Password)',
    loginTab: 'Sign In',
    registerTab: 'Create Account',
    username: 'Driver Name',
    password: 'Password',
    repeatPassword: 'Repeat Password',
    loginBtn: 'Enter Online',
    registerBtn: 'Register & Enter',
    serversTitle: 'Online Multiplayer Servers',
    createRoom: 'Create Room',
    logout: 'Sign Out',
  },
  race: {
    pauseTitle: 'Race Paused',
    resume: 'Resume Race',
    restart: 'Restart Race',
    exit: 'Exit to Menu',
    pits: 'Pits',
    tires: 'Tires',
    lap: 'Lap',
    sound: 'Sound',
    mute: 'Mute',
    hudShow: 'Show F1 Info',
    hudHide: 'Hide F1 Info',
    tireGreen: 'Green Tires · Optimal',
    tireYellow: 'Yellow Tires · Medium Wear',
    tireRed: 'Red Tires! Pit Now',
  },
};

const PT: Translations = {
  ...EN,
  nav: { home: 'Início', tracks: 'Pistas', garage: 'Garagem', online: 'Online', settings: 'Ajustes', raceNow: 'Correr Agora' },
  home: {
    ...EN.home,
    heroTitle: 'A velocidade chega à Patagônia!',
    exploreTracks: 'Explorar 900 Pistas',
    shopGarage: 'Loja e Garagem',
    settingsSound: 'Ajustes e Som',
    leaderboard: 'Classificação',
    yourMoney: 'Seu dinheiro',
    unlockedCars: 'F1 desbloqueados',
    tracksDriven: 'Pistas corridas',
    gameModes: 'Modos de Jogo',
    selectMode: 'Selecionar modo',
    raceHere: 'Correr Aqui',
    careerTitle: 'Modo Carreira',
    onlineTitle: 'Modo Online',
    timeTrialTitle: 'Contrarrelógio',
    quickRaceTitle: 'Corrida Rápida',
  },
  settings: {
    ...EN.settings,
    title: 'Ajustes de Idioma, Som e Controles',
    saved: 'Configuração salva',
    resetDefaults: 'Restaurar Padrão',
    languageTitle: 'Idioma do Jogo',
    languageDesc: 'Escolha entre 12 idiomas disponíveis para os menus e corrida',
    activeLang: 'Idioma ativo',
    soundTitle: 'Som e Volume',
    soundOn: 'Som Ligado (Silenciar)',
    soundOff: 'Silenciado (Ativar)',
    masterVol: 'Volume Geral',
    engineVol: 'Motor F1',
    tiresVol: 'Derrapagem e Pneus',
    effectsVol: 'Efeitos (Pits e Luzes)',
    testEngine: 'Testar Motor',
    testDrift: 'Testar Derrapagem',
    testEffects: 'Testar Efeitos',
    keyboardTitle: 'Teclado',
    gamepadTitle: 'Controle / Gamepad',
    codesTitle: 'Inserir Códigos F1',
    trackHudTitle: 'Informação na Pista',
    hudTurnOff: 'Ocultar Info na Pista',
    hudTurnOn: 'Mostrar Info na Pista',
  },
  modes: {
    ...EN.modes,
    title: 'Catálogo de 900 Pistas e Modos',
    quickrace: 'Corrida Rápida',
    career: 'Modo Carreira',
    timetrial: 'Contrarrelógio',
    leaderboard: 'Classificação',
    tireWearTitle: 'Desgaste dos Pneus antes do mapa',
    tireWearHint: 'Escolha se os pneus desgastam na corrida ou ficam sempre novos',
    tireWearOnTitle: 'Com Desgaste de Pneus',
    tireWearOnDesc: 'Verde → Amarelo → Vermelho ao correr ou bater nas grades (pede Pits)',
    tireWearOffTitle: 'Sem Desgaste de Pneus',
    tireWearOffDesc: 'Pneus sempre novos a 100% durante toda a corrida',
    playerModeTitle: 'Modo de Jogadores na Pista',
    onePlayer: '1 Jogador',
    splitScreen: 'Multijogador · Tela Dividida',
    pilotName: 'Nome do Piloto',
    aiDifficulty: 'Dificuldade IA',
    rookie: 'Novato',
    pro: 'Pro',
    legend: 'Lenda',
    tracksFound: 'pistas encontradas',
    prev: 'Anterior',
    next: 'Próxima',
    launch2P: 'Largar 2 Jogadores (Tela Dividida · 9 F1)',
    launch1P: 'Largar Corrida (3 Voltas · 9 F1)',
    launchTimeTrial: 'Iniciar Contrarrelógio',
  },
  race: {
    ...EN.race,
    pauseTitle: 'Corrida Pausada',
    resume: 'Retomar Corrida',
    restart: 'Reiniciar Corrida',
    exit: 'Sair ao Menu',
    tires: 'Pneus',
    lap: 'Volta',
    sound: 'Som',
    mute: 'Silenciar',
    tireGreen: 'Pneus Verdes · Ótimos',
    tireYellow: 'Pneus Amarelos · Desgaste Médio',
    tireRed: 'Pneus Vermelhos! Vá aos Pits',
  },
};

const FR: Translations = {
  ...EN,
  nav: { home: 'Accueil', tracks: 'Circuits', garage: 'Garage', online: 'En ligne', settings: 'Paramètres', raceNow: 'Courir' },
  home: {
    ...EN.home,
    heroTitle: 'La vitesse arrive en Patagonie !',
    exploreTracks: 'Explorer 900 Circuits',
    shopGarage: 'Boutique & Garage',
    settingsSound: 'Paramètres & Son',
    leaderboard: 'Classement',
    yourMoney: 'Votre argent',
    unlockedCars: 'F1 débloquées',
    tracksDriven: 'Circuits courus',
    gameModes: 'Modes de Jeu',
    selectMode: 'Choisir ce mode',
    raceHere: 'Courir Ici',
    careerTitle: 'Mode Carrière',
    onlineTitle: 'Mode En Ligne',
    timeTrialTitle: 'Contre-la-montre',
    quickRaceTitle: 'Course Rapide',
  },
  settings: {
    ...EN.settings,
    title: 'Paramètres de Langue, Son et Contrôles',
    saved: 'Paramètres enregistrés',
    resetDefaults: 'Réinitialiser',
    languageTitle: 'Langue du Jeu',
    languageDesc: 'Choisissez parmi 12 langues disponibles pour les menus et la course',
    activeLang: 'Langue active',
    soundTitle: 'Son et Volume',
    soundOn: 'Son Activé (Couper)',
    soundOff: 'Muet (Activer)',
    masterVol: 'Volume Général',
    engineVol: 'Moteur F1',
    tiresVol: 'Dérapage & Pneus',
    effectsVol: 'Effets (Stands & Feux)',
    testEngine: 'Tester Moteur',
    testDrift: 'Tester Dérapage',
    testEffects: 'Tester Effets',
    keyboardTitle: 'Clavier',
    gamepadTitle: 'Manette',
    codesTitle: 'Codes F1',
    trackHudTitle: 'Affichage F1 en Piste',
    hudTurnOff: 'Masquer Infos Piste',
    hudTurnOn: 'Afficher Infos Piste',
  },
  modes: {
    ...EN.modes,
    title: '900 Circuits & Modes de Jeu',
    quickrace: 'Course Rapide',
    career: 'Mode Carrière',
    timetrial: 'Contre-la-montre',
    online: 'En ligne',
    leaderboard: 'Classement',
    tireWearTitle: 'Usure des pneus avant de choisir la carte',
    tireWearHint: 'Choisissez si les pneus s’usent en course ou restent toujours neufs',
    tireWearOnTitle: 'Pneus Usés Activés',
    tireWearOnDesc: 'Vert → Jaune → Rouge en roulant ou heurtant les barrières (Stands)',
    tireWearOffTitle: 'Sans Usure des Pneus',
    tireWearOffDesc: 'Pneus toujours à 100% pendant toute la course',
    playerModeTitle: 'Joueurs en Piste',
    onePlayer: '1 Joueur',
    splitScreen: 'Multijoueur · Écran Scindé',
    pilotName: 'Nom du Pilote',
    aiDifficulty: 'Difficulté IA',
    rookie: 'Débutant',
    pro: 'Pro',
    legend: 'Légende',
    tracksFound: 'circuits trouvés',
    prev: 'Précédent',
    next: 'Suivant',
    launch2P: 'Départ 2 Joueurs (Écran Scindé · 9 F1)',
    launch1P: 'Départ Course (3 Tours · 9 F1)',
    launchTimeTrial: 'Lancer Contre-la-montre',
  },
  race: {
    ...EN.race,
    pauseTitle: 'Course en Pause',
    resume: 'Reprendre',
    restart: 'Recommencer',
    exit: 'Quitter au Menu',
    pits: 'Stands',
    tires: 'Pneus',
    lap: 'Tour',
    sound: 'Son',
    mute: 'Muet',
    tireGreen: 'Pneus Verts · Optimaux',
    tireYellow: 'Pneus Jaunes · Usure Moyenne',
    tireRed: 'Pneus Rouges ! Aux Stands',
  },
};

const DE: Translations = {
  ...EN,
  nav: { home: 'Start', tracks: 'Strecken', garage: 'Garage', online: 'Online', settings: 'Einstellungen', raceNow: 'Jetzt Fahren' },
  home: {
    ...EN.home,
    heroTitle: 'Geschwindigkeit erreicht Patagonien!',
    exploreTracks: '900 Strecken Entdecken',
    shopGarage: 'Shop & Garage',
    settingsSound: 'Einstellungen & Ton',
    leaderboard: 'Bestenliste',
    yourMoney: 'Dein Geld',
    unlockedCars: 'F1 Freigeschaltet',
    tracksDriven: 'Strecken Gefahren',
    gameModes: 'Spielmodi',
    selectMode: 'Modus wählen',
    raceHere: 'Hier Fahren',
    careerTitle: 'Karrieremodus',
    onlineTitle: 'Online-Modus',
    timeTrialTitle: 'Zeitfahren',
    quickRaceTitle: 'Schnelles Rennen',
  },
  settings: {
    ...EN.settings,
    title: 'Sprach-, Ton- & Steuerungseinstellungen',
    saved: 'Gespeichert',
    resetDefaults: 'Zurücksetzen',
    languageTitle: 'Spielsprache',
    languageDesc: 'Wähle aus 12 verfügbaren Sprachen für Menüs und Rennen',
    activeLang: 'Aktive Sprache',
    soundTitle: 'Ton & Lautstärke',
    soundOn: 'Ton Ein (Stumm)',
    soundOff: 'Stumm (Aktivieren)',
    masterVol: 'Gesamtlautstärke',
    engineVol: 'F1-Motor',
    tiresVol: 'Drift & Reifen',
    effectsVol: 'Effekte (Box & Ampel)',
    testEngine: 'Motor Testen',
    testDrift: 'Drift Testen',
    testEffects: 'Effekte Testen',
    keyboardTitle: 'Tastatur',
    gamepadTitle: 'Controller / Gamepad',
    codesTitle: 'F1-Codes Eingeben',
    trackHudTitle: 'F1-Streckenanzeige',
    hudTurnOff: 'Streckeninfo Ausblenden',
    hudTurnOn: 'Streckeninfo Anzeigen',
  },
  modes: {
    ...EN.modes,
    title: '900 Strecken & Spielmodi',
    quickrace: 'Schnelles Rennen',
    career: 'Karriere',
    timetrial: 'Zeitfahren',
    leaderboard: 'Bestenliste',
    tireWearTitle: 'Reifenverschleiß vor der Streckenwahl',
    tireWearHint: 'Wähle, ob sich die Reifen abnutzen oder immer neu bleiben',
    tireWearOnTitle: 'Mit Reifenverschleiß',
    tireWearOnDesc: 'Grün → Gelb → Rot beim Fahren oder Leitplankenkontakt (Boxenstopp)',
    tireWearOffTitle: 'Ohne Reifenverschleiß',
    tireWearOffDesc: 'Reifen bleiben das ganze Rennen über bei 100%',
    playerModeTitle: 'Spielermodus',
    onePlayer: '1 Spieler',
    splitScreen: 'Mehrspieler · Geteilter Bildschirm',
    pilotName: 'Fahrername',
    aiDifficulty: 'KI-Schwierigkeit',
    rookie: 'Anfänger',
    pro: 'Profi',
    legend: 'Legende',
    tracksFound: 'Strecken gefunden',
    prev: 'Zurück',
    next: 'Weiter',
    launch2P: '2 Spieler Starten (Geteilter Bildschirm · 9 F1)',
    launch1P: 'Rennen Starten (3 Runden · 9 F1)',
    launchTimeTrial: 'Zeitfahren Starten',
  },
  race: {
    ...EN.race,
    pauseTitle: 'Rennen Pausiert',
    resume: 'Fortsetzen',
    restart: 'Neustart',
    exit: 'Zum Menü',
    pits: 'Box',
    tires: 'Reifen',
    lap: 'Runde',
    sound: 'Ton',
    mute: 'Stumm',
    tireGreen: 'Grüne Reifen · Optimal',
    tireYellow: 'Gelbe Reifen · Mittlerer Verschleiß',
    tireRed: 'Rote Reifen! Ab in die Box',
  },
};

const IT: Translations = {
  ...EN,
  nav: { home: 'Home', tracks: 'Piste', garage: 'Garage', online: 'Online', settings: 'Impostazioni', raceNow: 'Corri Ora' },
  home: {
    ...EN.home,
    heroTitle: 'La velocità arriva in Patagonia!',
    exploreTracks: 'Esplora 900 Piste',
    shopGarage: 'Negozio e Garage',
    settingsSound: 'Impostazioni e Audio',
    leaderboard: 'Classifica',
    yourMoney: 'I tuoi crediti',
    unlockedCars: 'F1 sbloccate',
    tracksDriven: 'Piste corse',
    gameModes: 'Modalità di Gioco',
    selectMode: 'Seleziona modalità',
    raceHere: 'Corri Qui',
    careerTitle: 'Modalità Carriera',
    onlineTitle: 'Modalità Online',
    timeTrialTitle: 'Prova a Tempo',
    quickRaceTitle: 'Gara Veloce',
  },
  settings: {
    ...EN.settings,
    title: 'Impostazioni Lingua, Audio e Controlli',
    saved: 'Impostazioni salvate',
    resetDefaults: 'Ripristina Predefiniti',
    languageTitle: 'Lingua del Gioco',
    languageDesc: 'Scegli tra 12 lingue disponibili per menu e gara',
    activeLang: 'Lingua attiva',
    soundTitle: 'Audio e Volume',
    soundOn: 'Audio Attivo (Muto)',
    soundOff: 'Muto (Attiva)',
    masterVol: 'Volume Generale',
    engineVol: 'Motore F1',
    tiresVol: 'Derapata e Gomme',
    effectsVol: 'Effetti (Box e Semaforo)',
    testEngine: 'Prova Motore',
    testDrift: 'Prova Derapata',
    testEffects: 'Prova Effetti',
    keyboardTitle: 'Tastiera',
    gamepadTitle: 'Controller / Pad',
    codesTitle: 'Codici F1',
    trackHudTitle: 'Info F1 in Pista',
    hudTurnOff: 'Nascondi Info Pista',
    hudTurnOn: 'Mostra Info Pista',
  },
  modes: {
    ...EN.modes,
    title: '900 Piste e Modalità',
    quickrace: 'Gara Veloce',
    career: 'Carriera',
    timetrial: 'Prova a Tempo',
    leaderboard: 'Classifica',
    tireWearTitle: 'Usura Gomme prima della mappa',
    tireWearHint: 'Scegli se le gomme si consumano in gara o restano sempre nuove',
    tireWearOnTitle: 'Con Usura Gomme',
    tireWearOnDesc: 'Verde → Giallo → Rosso correndo o urtando le barriere (Box)',
    tireWearOffTitle: 'Senza Usura Gomme',
    tireWearOffDesc: 'Gomme sempre nuove al 100% per tutta la gara',
    playerModeTitle: 'Giocatori in Pista',
    onePlayer: '1 Giocatore',
    splitScreen: 'Multigiocatore · Schermo Diviso',
    pilotName: 'Nome Pilota',
    aiDifficulty: 'Difficoltà IA',
    rookie: 'Principiante',
    pro: 'Pro',
    legend: 'Leggenda',
    tracksFound: 'piste trovate',
    prev: 'Precedente',
    next: 'Successiva',
    launch2P: 'Avvia 2 Giocatori (Schermo Diviso · 9 F1)',
    launch1P: 'Avvia Gara (3 Giri · 9 F1)',
    launchTimeTrial: 'Avvia Prova a Tempo',
  },
  race: {
    ...EN.race,
    pauseTitle: 'Gara in Pausa',
    resume: 'Riprendi',
    restart: 'Ricomincia',
    exit: 'Esci al Menu',
    pits: 'Box',
    tires: 'Gomme',
    lap: 'Giro',
    sound: 'Audio',
    mute: 'Muto',
    tireGreen: 'Gomme Verdi · Ottimali',
    tireYellow: 'Gomme Gialle · Usura Media',
    tireRed: 'Gomme Rosse! Vai ai Box',
  },
};

const JA: Translations = {
  ...EN,
  nav: { home: 'ホーム', tracks: 'コース', garage: 'ガレージ', online: 'オンライン', settings: '設定', raceNow: '今すぐレース' },
  home: {
    ...EN.home,
    heroTitle: 'パタゴニアにF1のスピードが到来！',
    exploreTracks: '900コースを見る',
    shopGarage: 'ショップ＆ガレージ',
    settingsSound: '設定＆サウンド',
    leaderboard: 'ランキング',
    yourMoney: '所持金',
    unlockedCars: '所有F1マシン',
    tracksDriven: '走行コース',
    gameModes: 'ゲームモード',
    selectMode: 'モード選択',
    raceHere: 'ここでレース',
    careerTitle: 'キャリアモード',
    onlineTitle: 'オンライン',
    timeTrialTitle: 'タイムアタック',
    quickRaceTitle: 'クイックレース',
  },
  settings: {
    ...EN.settings,
    title: '言語・サウンド・操作設定',
    saved: '保存しました',
    resetDefaults: '初期設定に戻す',
    languageTitle: '言語設定',
    languageDesc: '12言語からゲーム全体の表示言語を選択できます',
    activeLang: '現在の言語',
    soundTitle: 'サウンド・音量',
    soundOn: 'サウンドON（ミュート）',
    soundOff: 'ミュート中（解除）',
    masterVol: 'マスター音量',
    engineVol: 'F1エンジン音',
    tiresVol: 'ドリフト＆タイヤ音',
    effectsVol: '効果音（ピット＆シグナル）',
    testEngine: 'エンジン試聴',
    testDrift: 'ドリフト試聴',
    testEffects: '効果音試聴',
    keyboardTitle: 'キーボード',
    gamepadTitle: 'コントローラー',
    codesTitle: 'F1コード入力',
    trackHudTitle: 'コース上F1情報表示',
    hudTurnOff: 'コース情報を非表示',
    hudTurnOn: 'コース情報を表示',
  },
  modes: {
    ...EN.modes,
    title: '900コース＆モード選択',
    quickrace: 'クイックレース',
    career: 'キャリア',
    timetrial: 'タイムアタック',
    leaderboard: 'ランキング',
    tireWearTitle: 'コース選択前のタイヤ摩耗設定',
    tireWearHint: 'レース中にタイヤが摩耗するかどうかを選べます',
    tireWearOnTitle: 'タイヤ摩耗あり',
    tireWearOnDesc: '緑 → 黄 → 赤と摩耗し、ピットインが必要になります',
    tireWearOffTitle: 'タイヤ摩耗なし',
    tireWearOffDesc: 'レース中ずっと100%新品タイヤで走行します',
    playerModeTitle: 'プレイ人数',
    onePlayer: '1人プレイ',
    splitScreen: '2人対戦・画面分割',
    pilotName: 'ドライバー名',
    aiDifficulty: 'AI難易度',
    rookie: 'ルーキー',
    pro: 'プロ',
    legend: 'レジェンド',
    tracksFound: 'コース',
    prev: '前へ',
    next: '次へ',
    launch2P: '2人でスタート（画面分割 · 9台）',
    launch1P: 'レース開始（3周 · 9台）',
    launchTimeTrial: 'タイムアタック開始',
  },
  race: {
    ...EN.race,
    pauseTitle: '一時停止中',
    resume: 'レースに戻る',
    restart: 'やり直す',
    exit: 'メニューへ戻る',
    pits: 'ピット',
    tires: 'タイヤ',
    lap: '周回',
    sound: '音量',
    mute: '消音',
    tireGreen: 'グリーンタイヤ・良好',
    tireYellow: 'イエロータイヤ・摩耗中',
    tireRed: 'レッドタイヤ！ピットイン必須',
  },
};

const KO: Translations = {
  ...EN,
  nav: { home: '홈', tracks: '트랙', garage: '차고', online: '온라인', settings: '설정', raceNow: '바로 레이스' },
  home: {
    ...EN.home,
    heroTitle: '파타고니아에 F1 속도가 찾아온다!',
    exploreTracks: '900개 트랙 보기',
    shopGarage: '상점 & 차고',
    settingsSound: '설정 & 사운드',
    leaderboard: '순위표',
    yourMoney: '보유 자금',
    unlockedCars: '보유 F1',
    tracksDriven: '완주 트랙',
    gameModes: '게임 모드',
    selectMode: '모드 선택',
    raceHere: '여기서 달리기',
    careerTitle: '커리어 모드',
    onlineTitle: '온라인 모드',
    timeTrialTitle: '타임 어택',
    quickRaceTitle: '빠른 레이스',
  },
  settings: {
    ...EN.settings,
    title: '언어, 사운드 및 조작 설정',
    saved: '설정이 저장됨',
    resetDefaults: '기본값 복원',
    languageTitle: '게임 언어',
    languageDesc: '12개 지원 언어 중 원하는 언어를 선택하세요',
    activeLang: '현재 언어',
    soundTitle: '사운드 및 볼륨',
    soundOn: '소리 켜짐 (음소거)',
    soundOff: '음소거됨 (켜기)',
    masterVol: '전체 볼륨',
    engineVol: 'F1 엔진',
    tiresVol: '드리프트 & 타이어',
    effectsVol: '효과음 (피트 & 신호등)',
    testEngine: '엔진 테스트',
    testDrift: '드리프트 테스트',
    testEffects: '효과음 테스트',
    keyboardTitle: '키보드',
    gamepadTitle: '컨트롤러',
    codesTitle: 'F1 코드 입력',
    trackHudTitle: '트랙 HUD 정보',
    hudTurnOff: '트랙 정보 숨기기',
    hudTurnOn: '트랙 정보 보이기',
  },
  modes: {
    ...EN.modes,
    title: '900개 트랙 및 모드',
    quickrace: '빠른 레이스',
    career: '커리어',
    timetrial: '타임 어택',
    leaderboard: '순위표',
    tireWearTitle: '맵 선택 전 타이어 마모 설정',
    tireWearHint: '레이스 중 타이어 마모 여부를 선택하세요',
    tireWearOnTitle: '타이어 마모 사용',
    tireWearOnDesc: '주행 및 충돌 시 초록 → 노랑 → 빨강으로 마모 (피트스탑 필요)',
    tireWearOffTitle: '타이어 마모 없음',
    tireWearOffDesc: '레이스 내내 타이어 상태 100% 유지',
    playerModeTitle: '플레이어 모드',
    onePlayer: '1인 플레이',
    splitScreen: '2인 화면 분할 멀티플레이',
    pilotName: '드라이버 이름',
    aiDifficulty: 'AI 난이도',
    rookie: '루키',
    pro: '프로',
    legend: '레전드',
    tracksFound: '개 트랙',
    prev: '이전',
    next: '다음',
    launch2P: '2인 레이스 시작 (화면 분할 · 9대)',
    launch1P: '레이스 시작 (3랩 · 9대)',
    launchTimeTrial: '타임 어택 시작',
  },
  race: {
    ...EN.race,
    pauseTitle: '일시 정지',
    resume: '계속하기',
    restart: '다시 시작',
    exit: '메뉴로 나가기',
    pits: '피트',
    tires: '타이어',
    lap: '랩',
    sound: '소리',
    mute: '음소거',
    tireGreen: '그린 타이어 · 최상',
    tireYellow: '옐로우 타이어 · 중간 마모',
    tireRed: '레드 타이어! 피트로 이동',
  },
};

const ZH: Translations = {
  ...EN,
  nav: { home: '首页', tracks: '赛道', garage: '车库', online: '联机', settings: '设置', raceNow: '立即比赛' },
  home: {
    ...EN.home,
    heroTitle: '极速降临巴塔哥尼亚！',
    exploreTracks: '探索 900 条赛道',
    shopGarage: '商店与车库',
    settingsSound: '设置与声音',
    leaderboard: '排行榜',
    yourMoney: '你的资金',
    unlockedCars: '已解锁赛车',
    tracksDriven: '已跑赛道',
    gameModes: '游戏模式',
    selectMode: '选择模式',
    raceHere: '在此比赛',
    careerTitle: '生涯模式',
    onlineTitle: '联机模式',
    timeTrialTitle: '计时赛',
    quickRaceTitle: '快速比赛',
  },
  settings: {
    ...EN.settings,
    title: '语言、声音与控制设置',
    saved: '设置已保存',
    resetDefaults: '恢复默认',
    languageTitle: '游戏语言',
    languageDesc: '从 12 种语言中选择菜单和比赛界面语言',
    activeLang: '当前语言',
    soundTitle: '声音与音量',
    soundOn: '声音开启（静音）',
    soundOff: '已静音（开启）',
    masterVol: '主音量',
    engineVol: 'F1 引擎声',
    tiresVol: '漂移与轮胎声',
    effectsVol: '音效（进站与信号灯）',
    testEngine: '试听引擎',
    testDrift: '试听漂移',
    testEffects: '试听音效',
    keyboardTitle: '键盘',
    gamepadTitle: '手柄控制器',
    codesTitle: '输入 F1 兑换码',
    trackHudTitle: '赛道 F1 信息显示',
    hudTurnOff: '隐藏赛道信息',
    hudTurnOn: '显示赛道信息',
  },
  modes: {
    ...EN.modes,
    title: '900 条赛道与模式',
    quickrace: '快速比赛',
    career: '生涯模式',
    timetrial: '计时赛',
    leaderboard: '排行榜',
    tireWearTitle: '选图前设置轮胎磨损',
    tireWearHint: '选择比赛中轮胎是否会磨损，或全程保持全新状态',
    tireWearOnTitle: '开启轮胎磨损',
    tireWearOnDesc: '行驶或撞击护栏后从绿 → 黄 → 红磨损（需进站换胎）',
    tireWearOffTitle: '关闭轮胎磨损',
    tireWearOffDesc: '整场比赛轮胎始终保持 100% 全新',
    playerModeTitle: '玩家模式',
    onePlayer: '单人模式',
    splitScreen: '双人分屏多人模式',
    pilotName: '车手名称',
    aiDifficulty: 'AI 难度',
    rookie: '新手',
    pro: '专业',
    legend: '传奇',
    tracksFound: '条赛道',
    prev: '上一页',
    next: '下一页',
    launch2P: '开始双人分屏比赛（9 辆 F1）',
    launch1P: '开始比赛（3 圈 · 9 辆 F1）',
    launchTimeTrial: '开始计时赛',
  },
  race: {
    ...EN.race,
    pauseTitle: '比赛已暂停',
    resume: '继续比赛',
    restart: '重新开始',
    exit: '返回菜单',
    pits: '维修站',
    tires: '轮胎',
    lap: '圈数',
    sound: '声音',
    mute: '静音',
    tireGreen: '绿色轮胎 · 状态极佳',
    tireYellow: '黄色轮胎 · 中度磨损',
    tireRed: '红色轮胎！请立即进站',
  },
};

const RU: Translations = {
  ...EN,
  nav: { home: 'Главная', tracks: 'Трассы', garage: 'Гараж', online: 'Онлайн', settings: 'Настройки', raceNow: 'В гонку' },
  home: {
    ...EN.home,
    heroTitle: 'Скорость приходит в Патагонию!',
    exploreTracks: '900 Трасс',
    shopGarage: 'Магазин и Гараж',
    settingsSound: 'Настройки и Звук',
    leaderboard: 'Таблица лидеров',
    yourMoney: 'Ваш баланс',
    unlockedCars: 'Открыто F1',
    tracksDriven: 'Пройдено трасс',
    gameModes: 'Режимы игры',
    selectMode: 'Выбрать режим',
    raceHere: 'Гонять здесь',
    careerTitle: 'Карьера',
    onlineTitle: 'Онлайн',
    timeTrialTitle: 'Гонка на время',
    quickRaceTitle: 'Быстрая гонка',
  },
  settings: {
    ...EN.settings,
    title: 'Язык, звук и управление',
    saved: 'Настройки сохранены',
    resetDefaults: 'Сбросить настройки',
    languageTitle: 'Язык игры',
    languageDesc: 'Выберите один из 12 доступных языков интерфейса',
    activeLang: 'Выбранный язык',
    soundTitle: 'Звук и громкость',
    soundOn: 'Звук включён (Выкл.)',
    soundOff: 'Без звука (Вкл.)',
    masterVol: 'Общая громкость',
    engineVol: 'Двигатель F1',
    tiresVol: 'Дрифт и шины',
    effectsVol: 'Эффекты (Пит-стоп и огни)',
    testEngine: 'Тест двигателя',
    testDrift: 'Тест дрифта',
    testEffects: 'Тест эффектов',
    keyboardTitle: 'Клавиатура',
    gamepadTitle: 'Геймпад / Контроллер',
    codesTitle: 'Промокоды F1',
    trackHudTitle: 'Телеметрия на трассе',
    hudTurnOff: 'Скрыть инфо F1',
    hudTurnOn: 'Показать инфо F1',
  },
  modes: {
    ...EN.modes,
    title: '900 трасс и режимы',
    quickrace: 'Быстрая гонка',
    career: 'Карьера',
    timetrial: 'На время',
    leaderboard: 'Лидеры',
    tireWearTitle: 'Износ шин перед выбором карты',
    tireWearHint: 'Выберите, будут ли шины изнашиваться в гонке',
    tireWearOnTitle: 'С износом шин',
    tireWearOnDesc: 'Зелёные → Жёлтые → Красные от езды и ударов (нужен пит-стоп)',
    tireWearOffTitle: 'Без износа шин',
    tireWearOffDesc: 'Шины всегда 100% новые всю гонку',
    playerModeTitle: 'Режим игроков',
    onePlayer: '1 игрок',
    splitScreen: '2 игрока · Разделённый экран',
    pilotName: 'Имя пилота',
    aiDifficulty: 'Сложность ИИ',
    rookie: 'Новичок',
    pro: 'Профи',
    legend: 'Легенда',
    tracksFound: 'трасс найдено',
    prev: 'Назад',
    next: 'Вперёд',
    launch2P: 'Старт 2 игрока (Экран пополам · 9 F1)',
    launch1P: 'Старт гонки (3 круга · 9 F1)',
    launchTimeTrial: 'Начать заезд на время',
  },
  race: {
    ...EN.race,
    pauseTitle: 'Пауза',
    resume: 'Продолжить',
    restart: 'Заново',
    exit: 'В меню',
    pits: 'Пит-стоп',
    tires: 'Шины',
    lap: 'Круг',
    sound: 'Звук',
    mute: 'Без звука',
    tireGreen: 'Зелёные шины · Отлично',
    tireYellow: 'Жёлтые шины · Средний износ',
    tireRed: 'Красные шины! В боксы',
  },
};

const AR: Translations = {
  ...EN,
  nav: { home: 'الرئيسية', tracks: 'الحلبات', garage: 'المرآب', online: 'أونلاين', settings: 'الإعدادات', raceNow: 'ابدأ السباق' },
  home: {
    ...EN.home,
    heroTitle: 'السرعة تصل إلى باتاغونيا!',
    exploreTracks: 'استكشف 900 حلبة',
    shopGarage: 'المتجر والمرآب',
    settingsSound: 'الإعدادات والصوت',
    leaderboard: 'لوحة الصدارة',
    yourMoney: 'رصيدك',
    unlockedCars: 'سيارات F1',
    tracksDriven: 'حلبات منجزة',
    gameModes: 'أوضاع اللعب',
    selectMode: 'اختر الوضع',
    raceHere: 'تسابق هنا',
    careerTitle: 'وضع المسيرة',
    onlineTitle: 'اللعب أونلاين',
    timeTrialTitle: 'سباق الزمن',
    quickRaceTitle: 'سباق سريع',
  },
  settings: {
    ...EN.settings,
    title: 'إعدادات اللغة والصوت والتحكم',
    saved: 'تم حفظ الإعدادات',
    resetDefaults: 'استعادة الافتراضي',
    languageTitle: 'لغة اللعبة',
    languageDesc: 'اختر من بين 12 لغة متاحة للقوائم والسباق',
    activeLang: 'اللغة الحالية',
    soundTitle: 'الصوت ومستوى الصوت',
    soundOn: 'الصوت مفعّل (كتم)',
    soundOff: 'مكتوم (تفعيل)',
    masterVol: 'الصوت العام',
    engineVol: 'محرك F1',
    tiresVol: 'الانجراف والإطارات',
    effectsVol: 'المؤثرات (الصيانة والإشارة)',
    testEngine: 'تجربة المحرك',
    testDrift: 'تجربة الانجراف',
    testEffects: 'تجربة المؤثرات',
    keyboardTitle: 'لوحة المفاتيح',
    gamepadTitle: 'ذراع التحكم',
    codesTitle: 'أكواد F1',
    trackHudTitle: 'معلومات السباق',
    hudTurnOff: 'إخفاء معلومات F1',
    hudTurnOn: 'إظهار معلومات F1',
  },
  modes: {
    ...EN.modes,
    title: '900 حلبة وأوضاع السباق',
    quickrace: 'سباق سريع',
    career: 'المسيرة',
    timetrial: 'سباق الزمن',
    leaderboard: 'الصدارة',
    tireWearTitle: 'تآكل الإطارات قبل اختيار الخريطة',
    tireWearHint: 'اختر ما إذا كانت الإطارات تتآكل أثناء السباق أم تبقى جديدة دائماً',
    tireWearOnTitle: 'تفعيل تآكل الإطارات',
    tireWearOnDesc: 'أخضر ← أصفر ← أحمر مع القيادة والاصطدام (يحتاج صيانة)',
    tireWearOffTitle: 'بدون تآكل الإطارات',
    tireWearOffDesc: 'الإطارات تبقى جديدة بنسبة 100% طوال السباق',
    playerModeTitle: 'وضع اللاعبين',
    onePlayer: 'لاعب واحد',
    splitScreen: 'لاعبان · شاشة مقسومة',
    pilotName: 'اسم السائق',
    aiDifficulty: 'صعوبة الذكاء',
    rookie: 'مبتدئ',
    pro: 'محترف',
    legend: 'أسطوري',
    tracksFound: 'حلبة',
    prev: 'السابق',
    next: 'التالي',
    launch2P: 'ابدأ سباق لاعبين (شاشة مقسومة · 9 سيارات)',
    launch1P: 'ابدأ السباق (3 لفات · 9 سيارات)',
    launchTimeTrial: 'ابدأ سباق الزمن',
  },
  race: {
    ...EN.race,
    pauseTitle: 'إيقاف مؤقت',
    resume: 'استئناف',
    restart: 'إعادة السباق',
    exit: 'الخروج للقائمة',
    pits: 'الصيانة',
    tires: 'الإطارات',
    lap: 'لفة',
    sound: 'الصوت',
    mute: 'كتم',
    tireGreen: 'إطارات خضراء · ممتازة',
    tireYellow: 'إطارات صفراء · تآكل متوسط',
    tireRed: 'إطارات حمراء! ادخل الصيانة',
  },
};

const NL: Translations = {
  ...EN,
  nav: { home: 'Start', tracks: 'Circuits', garage: 'Garage', online: 'Online', settings: 'Instellingen', raceNow: 'Nu Racen' },
  home: {
    ...EN.home,
    heroTitle: 'Snelheid komt naar Patagonië!',
    exploreTracks: 'Verken 900 Circuits',
    shopGarage: 'Winkel & Garage',
    settingsSound: 'Instellingen & Geluid',
    leaderboard: 'Klassement',
    yourMoney: 'Jouw geld',
    unlockedCars: 'F1 vrijgespeeld',
    tracksDriven: 'Circuits gereden',
    gameModes: 'Spelmodi',
    selectMode: 'Kies modus',
    raceHere: 'Hier Racen',
    careerTitle: 'Carrière',
    onlineTitle: 'Online Modus',
    timeTrialTitle: 'Tijdrit',
    quickRaceTitle: 'Snelle Race',
  },
  settings: {
    ...EN.settings,
    title: 'Taal-, Geluids- & Besturingsinstellingen',
    saved: 'Opgeslagen',
    resetDefaults: 'Standaard herstellen',
    languageTitle: 'Speltaal',
    languageDesc: 'Kies uit 12 beschikbare talen voor alle menu’s en de race',
    activeLang: 'Actieve taal',
    soundTitle: 'Geluid & Volume',
    soundOn: 'Geluid Aan (Dempen)',
    soundOff: 'Gedempt (Aanzetten)',
    masterVol: 'Hoofdvolume',
    engineVol: 'F1-Motor',
    tiresVol: 'Drift & Banden',
    effectsVol: 'Effecten (Pits & Lichten)',
    testEngine: 'Test Motor',
    testDrift: 'Test Drift',
    testEffects: 'Test Effecten',
    keyboardTitle: 'Toetsenbord',
    gamepadTitle: 'Controller / Gamepad',
    codesTitle: 'F1-Codes Invoeren',
    trackHudTitle: 'F1-Info op Circuit',
    hudTurnOff: 'Verberg Circuit-info',
    hudTurnOn: 'Toon Circuit-info',
  },
  modes: {
    ...EN.modes,
    title: '900 Circuits & Spelmodi',
    quickrace: 'Snelle Race',
    career: 'Carrière',
    timetrial: 'Tijdrit',
    leaderboard: 'Klassement',
    tireWearTitle: 'Bandenslijtage vóór het kiezen van de kaart',
    tireWearHint: 'Kies of banden tijdens de race slijten of altijd nieuw blijven',
    tireWearOnTitle: 'Met Bandenslijtage',
    tireWearOnDesc: 'Groen → Geel → Rood tijdens rijden of botsen (Pitstop nodig)',
    tireWearOffTitle: 'Zonder Bandenslijtage',
    tireWearOffDesc: 'Banden blijven de hele race 100% nieuw',
    playerModeTitle: 'Spelermodus',
    onePlayer: '1 Speler',
    splitScreen: 'Multiplayer · Gesplitst Scherm',
    pilotName: 'Coureursnaam',
    aiDifficulty: 'AI-Moeilijkheid',
    rookie: 'Beginner',
    pro: 'Pro',
    legend: 'Legende',
    tracksFound: 'circuits gevonden',
    prev: 'Vorige',
    next: 'Volgende',
    launch2P: 'Start 2 Spelers (Gesplitst Scherm · 9 F1)',
    launch1P: 'Start Race (3 Ronden · 9 F1)',
    launchTimeTrial: 'Start Tijdrit',
  },
  race: {
    ...EN.race,
    pauseTitle: 'Race Gepauzeerd',
    resume: 'Hervatten',
    restart: 'Opnieuw Starten',
    exit: 'Terug naar Menu',
    pits: 'Pits',
    tires: 'Banden',
    lap: 'Ronde',
    sound: 'Geluid',
    mute: 'Dempen',
    tireGreen: 'Groene Banden · Optimaal',
    tireYellow: 'Gele Banden · Gemiddelde Slijtage',
    tireRed: 'Rode Banden! Ga naar de Pits',
  },
};

const DICTIONARY: Record<LanguageCode, Translations> = {
  es: ES,
  en: EN,
  pt: PT,
  fr: FR,
  de: DE,
  it: IT,
  ja: JA,
  ko: KO,
  zh: ZH,
  ru: RU,
  ar: AR,
  nl: NL,
};

interface I18nContextValue {
  language: LanguageCode;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue>({
  language: 'es',
  t: ES,
});

export function I18nProvider({
  language,
  children,
}: {
  language: LanguageCode;
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = DICTIONARY[language] ?? ES;

  return (
    <I18nContext.Provider value={{ language, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
