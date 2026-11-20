export type Language = 'es' | 'en' | 'pt';
export type ThemeMode = 'dark' | 'light';
export type AccentColor = 'emerald' | 'blue' | 'cyan' | 'amber' | 'red';

export type EcosystemCategory = 'todos' | 'software' | 'juegos' | 'multimedia' | 'servicios';

export interface EcosystemPillar {
  id: string;
  index: string;
  category: Exclude<EcosystemCategory, 'todos'>;
  categoryLabel: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  targetSection: string;
  ctaLabel: string;
  allowConsult: boolean;
  inquiryTopic?: string;
  featuredImage?: string;
  featuredAlt?: string;
  pageOverview: string;
  pageCapabilities: {title: string; detail: string}[];
}

export interface GameTitle {
  id: 'f1-simulador-aysen' | 'nexracing-nascar' | 'simulador-truck-aysen';
  name: string;
  discipline: string;
  releaseDate: string;
  tagline: string;
  description: string;
  image?: string;
  imageAlt?: string;
  playableApp?: 'f1-aysen' | 'nexracing';
  playCtaLabel?: string;
  specs: {
    label: string;
    value: string;
  }[];
  modes: {
    id: string;
    name: string;
    detail: string;
  }[];
}

export const IMAGES = {
  f1Aysen: '/src/assets/images/f1_simulador_track_1794863110078.jpg',
  nexRacing: '/src/assets/images/nexracing_stockcar_1794863110251.jpg',
  truckAysen: '/src/assets/images/truck_aysen_clean_1794962105196.jpg',
} as const;

export const ACCENT_OPTIONS: {
  id: AccentColor;
  swatch: string;
  labels: Record<Language, string>;
}[] = [
  {id: 'emerald', swatch: '#10b981', labels: {es: 'Esmeralda', en: 'Emerald', pt: 'Esmeralda'}},
  {id: 'blue', swatch: '#2563eb', labels: {es: 'Azul', en: 'Blue', pt: 'Azul'}},
  {id: 'cyan', swatch: '#06b6d4', labels: {es: 'Cian', en: 'Cyan', pt: 'Ciano'}},
  {id: 'amber', swatch: '#f59e0b', labels: {es: 'Ámbar', en: 'Amber', pt: 'Âmbar'}},
  {id: 'red', swatch: '#dc2626', labels: {es: 'Rojo', en: 'Red', pt: 'Vermelho'}},
];

export const LANGUAGE_OPTIONS: {id: Language; label: string; native: string}[] = [
  {id: 'es', label: 'Español', native: 'Español'},
  {id: 'en', label: 'English', native: 'English'},
  {id: 'pt', label: 'Português', native: 'Português'},
];

export interface LocalizedContent {
  nav: {
    ecosystem: string;
    nexos: string;
    games: string;
    mission: string;
    settings: string;
    contact: string;
    account: string;
    openMenu: string;
    closeMenu: string;
  };
  auth: {
    optionalBadge: string;
    titleSignedOut: string;
    titleSignedIn: string;
    subtitleSignedOut: string;
    subtitleSignedIn: string;
    loginTab: string;
    registerTab: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    loginSubmit: string;
    registerSubmit: string;
    continueGuest: string;
    logoutButton: string;
    signedInAs: string;
    errShort: string;
    errMismatch: string;
    errNetwork: string;
  };
  hero: {
    kicker: string;
    headline: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    pillarsStrip: {kicker: string; title: string; text: string}[];
  };
  ecosystem: {
    kicker: string;
    title: string;
    subtitle: string;
    filters: {id: EcosystemCategory; label: string}[];
    pillars: EcosystemPillar[];
    showDetails: string;
    detailsVisible: string;
    focusLabel: string;
    focusHeadingSuffix: string;
    consultAbout: string;
    openPageLabel: string;
    backToPortalLabel: string;
    switchAreaLabel: string;
    highlightsTitle: string;
    capabilitiesTitle: string;
  };
  nexos: {
    kicker: string;
    title: string;
    subtitle: string;
    imageCaptionKicker: string;
    unavailableTitle: string;
    unavailableDescription: string;
    unavailableNote: string;
    plannedTitle: string;
    plannedBullets: string[];
  };
  games: {
    kicker: string;
    title: string;
    subtitle: string;
    modesLabel: string;
    projectPrefix: string;
    ctaPrefix: string;
    items: GameTitle[];
  };
  missionContact: {
    missionKicker: string;
    missionTitle: string;
    missionBody: string;
    originLabel: string;
    originText: string;
    visionLabel: string;
    visionText: string;
    directMailLabel: string;
    contactKicker: string;
    contactTitle: string;
    contactSubtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    topicLabel: string;
    topics: {id: string; label: string}[];
    messageLabel: string;
    messagePlaceholder: string;
    teamNote: string;
    submitButton: string;
    successTitle: string;
    successBodyPrefix: string;
    successBodyMiddle: string;
    successReset: string;
    errName: string;
    errMessage: string;
  };
  settings: {
    title: string;
    subtitle: string;
    close: string;
    themeLabel: string;
    themeDark: string;
    themeLight: string;
    accentLabel: string;
    languageLabel: string;
    resetDefaults: string;
    done: string;
  };
  footer: {
    tagline: string;
  };
}

export const CONTENT: Record<Language, LocalizedContent> = {
  es: {
    nav: {
      ecosystem: 'Ecosistema',
      nexos: 'NexOS',
      games: 'Juegos',
      mission: 'Misión',
      settings: 'Ajustes',
      contact: 'Contacto',
      account: 'Cuenta',
      openMenu: 'Abrir menú',
      closeMenu: 'Cerrar menú',
    },
    auth: {
      optionalBadge: 'Cuenta opcional · Sin registro obligatorio',
      titleSignedOut: 'Cuenta NexPlay',
      titleSignedIn: 'Sesión activa en NexPlay',
      subtitleSignedOut:
        'Puedes iniciar sesión o crear una cuenta en NexPlay, pero no es obligatorio para navegar ni para jugar.',
      subtitleSignedIn:
        'Tu cuenta opcional de NexPlay está conectada. Puedes seguir explorando o cerrar sesión cuando quieras.',
      loginTab: 'Iniciar sesión',
      registerTab: 'Crear cuenta',
      usernameLabel: 'Nombre de usuario',
      usernamePlaceholder: 'Ej: piloto_aysen',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Mínimo 4 caracteres',
      confirmPasswordLabel: 'Confirmar contraseña',
      confirmPasswordPlaceholder: 'Repite tu contraseña',
      loginSubmit: 'Iniciar sesión',
      registerSubmit: 'Crear cuenta',
      continueGuest: 'Continuar sin cuenta',
      logoutButton: 'Cerrar sesión',
      signedInAs: 'Conectado como',
      errShort: 'Ingresa un usuario (mín. 2 caracteres) y contraseña (mín. 4 caracteres).',
      errMismatch: 'Las contraseñas no coinciden.',
      errNetwork: 'No se pudo conectar con el servidor de cuentas.',
    },
    hero: {
      kicker: 'Proyecto chileno · Tecnología y entretenimiento',
      headline: 'La tecnología y la diversión en un solo lugar.',
      description:
        '¡Bienvenidos a NexPlay! Somos un proyecto tecnológico y de entretenimiento nacido en Chile que busca crear nuevas experiencias para el mundo digital: F1 Simulador Aysén y Aysén NASCAR jugables en línea, simulación de camiones, soporte técnico, producciones audiovisuales e innovación.',
      primaryCta: 'Explorar videojuegos',
      secondaryCta: 'Ver estado de NexOS',
      pillarsStrip: [
        {
          kicker: 'Sistemas operativos',
          title: 'NexOS',
          text: 'Actualmente no hay sistemas operativos de NexOS disponibles.',
        },
        {
          kicker: 'Videojuegos · Jugables ahora',
          title: 'F1 Aysén, Aysén NASCAR & Truck',
          text: 'Corre ya en F1 3D, compite en óvalos NASCAR V8 o sigue Truck Aysén.',
        },
        {
          kicker: 'Asistencia directa',
          title: 'Soporte técnico',
          text: 'Ayuda práctica y soluciones tecnológicas para sistemas y equipamiento.',
        },
        {
          kicker: 'Entretenimiento e I+D',
          title: 'Series, películas e innovación',
          text: 'Nuevos proyectos audiovisuales y prototipos digitales hechos en Chile.',
        },
      ],
    },
    ecosystem: {
      kicker: 'Ecosistema en crecimiento',
      title: 'Mucho más que una sola plataforma',
      subtitle:
        'NexPlay integra videojuegos, asistencia técnica, creación audiovisual e innovación bajo una misma visión digital.',
      filters: [
        {id: 'todos', label: 'Todo el ecosistema'},
        {id: 'software', label: 'Sistemas'},
        {id: 'juegos', label: 'Videojuegos'},
        {id: 'multimedia', label: 'Audiovisual'},
        {id: 'servicios', label: 'Soporte'},
      ],
      showDetails: 'Ver resumen',
      detailsVisible: 'Resumen visible abajo',
      focusLabel: 'En foco',
      focusHeadingSuffix: 'capacidades principales',
      consultAbout: 'Consultar sobre',
      openPageLabel: 'Abrir página dedicada',
      backToPortalLabel: 'Volver a NexPlay',
      switchAreaLabel: 'Áreas del ecosistema',
      highlightsTitle: 'Puntos clave',
      capabilitiesTitle: 'Qué incluye esta área',
      pillars: [
        {
          id: 'sistemas-operativos',
          index: '01.',
          category: 'software',
          categoryLabel: 'Sistemas operativos',
          title: 'Familia NexOS',
          subtitle: 'Sin sistemas operativos disponibles por ahora',
          description:
            'Aunque NexOS forma parte de la visión del ecosistema NexPlay, actualmente no hay sistemas operativos de NexOS disponibles para descarga ni consulta.',
          highlights: [
            'No hay versiones ni distribuciones de NexOS publicadas actualmente',
            'Sección informativa sin soporte de consultas activas',
            'El foco actual de videojuegos está puesto en Simulador Truck Aysén',
          ],
          targetSection: '#nexos',
          ctaLabel: 'Abrir página de NexOS',
          allowConsult: false,
          pageOverview:
            'Familia NexOS concentra la información oficial sobre los sistemas operativos del proyecto. Por ahora no existe ninguna distribución disponible ni se aceptan solicitudes técnicas para NexOS.',
          pageCapabilities: [
            {
              title: 'Sin descargas publicadas',
              detail: 'No hay imágenes ISO, instaladores ni versiones preliminares de NexOS disponibles actualmente.',
            },
            {
              title: 'Consultas cerradas',
              detail: 'El canal de consultas sobre NexOS permanece deshabilitado hasta nuevo aviso.',
            },
            {
              title: 'Enfoque activo',
              detail: 'El desarrollo activo del estudio se centra en F1 Simulador Aysén, Aysén NASCAR y Simulador Truck Aysén.',
            },
          ],
        },
        {
          id: 'videojuegos',
          index: '02.',
          category: 'juegos',
          categoryLabel: 'Entretenimiento · Videojuegos',
          title: 'F1 Aysén, Aysén NASCAR y Truck Aysén',
          subtitle: 'Simulación de F1, Stock Cars NASCAR V8 y transporte pesado',
          description:
            'Juega ahora mismo a F1 Simulador Aysén (900 pistas) y Aysén NASCAR (óvalos peraltados con 16 autos y rebufo) en tu navegador, además de nuestro Simulador Truck Aysén.',
          highlights: [
            'F1 Simulador Aysén jugable ahora: 900 pistas, garaje 3D, 2 jugadores y online',
            'Aysén NASCAR jugable ahora: óvalos con 31° de peralte, 16 stock cars V8 y Copa',
            'Simulador Truck Aysén en desarrollo con rutas por la Carretera Austral',
          ],
          targetSection: '#juegos',
          ctaLabel: 'Abrir página de Videojuegos',
          allowConsult: true,
          inquiryTopic: 'F1 Simulador Aysén',
          pageOverview:
            'La división de videojuegos de NexPlay reúne simuladores 3D nacidos en Chile y jugables directamente desde el navegador, junto al desarrollo de transporte pesado en la Patagonia.',
          pageCapabilities: [
            {
              title: 'F1 Simulador Aysén (Jugable)',
              detail: '900 circuitos patagónicos, garaje 3D, trayectoria, pantalla dividida y salas online en tiempo real.',
            },
            {
              title: 'Aysén NASCAR (Jugable)',
              detail: 'Stock cars V8 Next-Gen, pelotón de 16 autos, rebufo, Copa Aysén NASCAR y multijugador online.',
            },
            {
              title: 'Simulador Truck Aysén (En desarrollo)',
              detail: 'Transporte de carga pesada por la Carretera Austral, pasos de montaña y clima austral.',
            },
          ],
        },
        {
          id: 'soporte-tecnico',
          index: '03.',
          category: 'servicios',
          categoryLabel: 'Servicios · Asistencia',
          title: 'Soporte técnico',
          subtitle: 'Ayuda directa y soluciones reales en tecnología',
          description:
            'Acompañamos a usuarios y entusiastas con orientación práctica para resolver fallos, optimizar equipos y mantener sus herramientas funcionando sin tropiezos.',
          highlights: [
            'Diagnóstico de software y optimización de rendimiento',
            'Asesoría en configuración y compatibilidad de hardware',
            'Atención cercana y clara desde nuestro equipo en Chile',
          ],
          targetSection: '#contacto',
          ctaLabel: 'Abrir página de Soporte',
          allowConsult: true,
          inquiryTopic: 'Soporte técnico',
          pageOverview:
            'El área de Soporte técnico de NexPlay entrega orientación directa y clara para diagnosticar problemas en software, mejorar la estabilidad del equipo y asesorar configuraciones de hardware.',
          pageCapabilities: [
            {
              title: 'Diagnóstico y rendimiento',
              detail: 'Revisión de cuellos de botella, procesos en segundo plano y configuración del sistema.',
            },
            {
              title: 'Asesoría de hardware',
              detail: 'Recomendaciones prácticas de compatibilidad, periféricos de simulación y armado.',
            },
            {
              title: 'Atención sin barreras',
              detail: 'Puedes enviarnos tu consulta sin ingresar correo usando el formulario directo de contacto.',
            },
          ],
        },
        {
          id: 'series-peliculas',
          index: '04.',
          category: 'multimedia',
          categoryLabel: 'Audiovisual · Series y películas',
          title: 'Series y películas',
          subtitle: 'Nuevos proyectos de entretenimiento original',
          description:
            'Expandimos nuestra visión creativa hacia el formato audiovisual con historias, producciones independientes y proyectos cinematográficos pensados para conectar con nuevas audiencias.',
          highlights: [
            'Desarrollo de guiones y conceptos originales de acción y ciencia ficción',
            'Producción digital, edición y montaje propio dentro del estudio',
            'Integración narrativa con los universos creativos de NexPlay',
          ],
          targetSection: '#contacto',
          ctaLabel: 'Abrir página Audiovisual',
          allowConsult: true,
          inquiryTopic: 'Series y películas',
          pageOverview:
            'NexPlay Studios explora narrativas originales de acción, aventura y ciencia ficción creadas desde Chile con montaje digital propio e identidad conectada con nuestros proyectos interactivos.',
          pageCapabilities: [
            {
              title: 'Guion y desarrollo visual',
              detail: 'Creación de mundos, personajes y arcos narrativos originales con sello propio.',
            },
            {
              title: 'Postproducción en estudio',
              detail: 'Edición, sonido y composición digital trabajados de manera independiente.',
            },
            {
              title: 'Universo conectado',
              detail: 'Historias que dialogan con la estética tecnológica y automotriz de NexPlay.',
            },
          ],
        },
        {
          id: 'innovacion',
          index: '05.',
          category: 'software',
          categoryLabel: 'Futuro · Investigación y diseño',
          title: 'Innovación continua',
          subtitle: 'Nuevas ideas, prototipos y experiencias digitales',
          description:
            'Un espacio permanente donde exploramos herramientas, interfaces y conceptos interactivos que impulsan la siguiente generación de proyectos nacidos en Chile.',
          highlights: [
            'Exploración constante de herramientas interactivas y motores gráficos',
            'Espacio abierto para proponer ideas y colaboraciones',
            'Visión de largo plazo para llevar proyectos locales más lejos',
          ],
          targetSection: '#contacto',
          ctaLabel: 'Abrir página de Innovación',
          allowConsult: true,
          inquiryTopic: 'Innovación',
          pageOverview:
            'Nuestro laboratorio de Innovación continua prueba nuevas tecnologías web, motores 3D y conceptos de experiencia digital para dar forma a futuros lanzamientos de NexPlay.',
          pageCapabilities: [
            {
              title: 'Prototipos WebGL y simulación',
              detail: 'Pruebas constantes de físicas de vehículos, iluminación y rendimiento en navegador.',
            },
            {
              title: 'Diseño de interfaces',
              detail: 'Iteración continua sobre usabilidad, accesibilidad y personalización multi-tema.',
            },
            {
              title: 'Colaboración abierta',
              detail: 'Recibimos propuestas, ideas y feedback de la comunidad para próximos experimentos.',
            },
          ],
        },
      ],
    },
    nexos: {
      kicker: 'Sistemas operativos',
      title: 'Estado de NexOS',
      subtitle:
        'Información actualizada sobre la disponibilidad de sistemas operativos dentro del proyecto NexPlay.',
      imageCaptionKicker: 'Aviso oficial',
      unavailableTitle: 'No hay sistemas operativos de NexOS',
      unavailableDescription:
        'Por el momento no existe ningún sistema operativo de NexOS disponible para descarga, instalación ni consulta técnica.',
      unavailableNote:
        'Las consultas sobre NexOS están deshabilitadas hasta nuevo aviso. Te invitamos a conocer nuestro proyecto Simulador Truck Aysén y las áreas activas del ecosistema.',
      plannedTitle: 'Qué debes saber',
      plannedBullets: [
        'No hay versiones ni distribuciones de NexOS activas actualmente.',
        'No se atienden solicitudes o consultas sobre NexOS desde el sitio.',
        'El soporte técnico y el desarrollo de Simulador Truck Aysén siguen activos.',
      ],
    },
    games: {
      kicker: 'Videojuegos de NexPlay',
      title: 'Simulación nacida en Aysén',
      subtitle:
        'Juega directamente en línea a F1 Simulador Aysén by NexPlay o explora nuestro simulador de camiones en desarrollo.',
      modesLabel: 'Modos y características',
      projectPrefix: 'Juego',
      ctaPrefix: 'Consultar sobre',
      items: [
        {
          id: 'f1-simulador-aysen',
          name: 'F1 Simulador Aysén',
          discipline: 'Fórmula 1 3D · Región de Aysén',
          releaseDate: 'Disponible ahora · Jugable en NexPlay',
          tagline: 'Compite en 900 circuitos patagónicos 3D con garaje, carrera y multijugador online.',
          description:
            'Ponte al volante de un monoplaza en Coyhaique, Puerto Aysén, Cerro Castillo, Lago General Carrera y cientos de trazados generados. Personaliza tu escudería en el garaje 3D, juega a pantalla dividida o compite en salas online en tiempo real.',
          image: IMAGES.f1Aysen,
          imageAlt: 'Monoplaza de F1 Simulador Aysén compitiendo en circuito de la Patagonia',
          playableApp: 'f1-aysen',
          playCtaLabel: 'Jugar F1 Simulador Aysén',
          specs: [
            {label: 'Categoría', value: 'Simulador F1 3D (WebGL)'},
            {label: 'Circuitos', value: '900 pistas jugables'},
            {label: 'Estado actual', value: 'Disponible ahora'},
            {label: 'Modos', value: 'Trayectoria, 2P y Online'},
          ],
          modes: [
            {
              id: 'carrera-trayectoria',
              name: 'Trayectoria y Rápida',
              detail: 'Disputa temporadas en Aysén, gana créditos por podio y desbloquea nuevos monoplazas.',
            },
            {
              id: 'garaje-3d',
              name: 'Garaje 3D y Contrarreloj',
              detail: 'Configura pintura, aerodinámica, compuestos de neumáticos y registra tu mejor vuelta.',
            },
            {
              id: 'online-splitscreen',
              name: 'Online y 2 Jugadores',
              detail: 'Crea o únete a salas multijugador con chat en vivo o corre en pantalla dividida local.',
            },
          ],
        },
        {
          id: 'nexracing-nascar',
          name: 'Aysén NASCAR',
          discipline: 'Stock Car V8 · Óvalos y Roval',
          releaseDate: 'Disponible ahora · Jugable en NexPlay',
          tagline: 'Corre puerta a puerta en óvalos peraltados con rebufo, pelotón de 16 autos y sonido V8.',
          description:
            'Ponte al mando de un Stock Car Next-Gen en Aysén Superspeedway (31° de peralte), Atacama Night 400 bajo reflectores, Patagonia Bullring y Cordillera Roval. Personaliza tu dorsal y pintura en el Garaje 3D y disputa la Copa Aysén NASCAR.',
          image: IMAGES.nexRacing,
          imageAlt: 'Stock cars de Aysén NASCAR compitiendo en óvalo nocturno iluminado',
          playableApp: 'nexracing',
          playCtaLabel: 'Jugar Aysén NASCAR',
          specs: [
            {label: 'Categoría', value: 'NASCAR Stock Car 3D'},
            {label: 'Circuitos', value: '4 óvalos y roval peraltados'},
            {label: 'Estado actual', value: 'Disponible ahora'},
            {label: 'Modos', value: 'Carrera 16 autos, Copa y Crono'},
          ],
          modes: [
            {
              id: 'pack-racing',
              name: 'Pelotón y Rebufo',
              detail: 'Salida lanzada en doble fila con 16 autos, succión aerodinámica (draft) y Pit Road activo.',
            },
            {
              id: 'copa-nexracing',
              name: 'Copa Aysén NASCAR',
              detail: 'Campeonato oficial de 4 fechas con tabla de posiciones, puntuación NASCAR y premios.',
            },
            {
              id: 'taller-v8',
              name: 'Taller de Pintura 3D',
              detail: 'Edita dorsal, diseño de carrocería, colores y paquete aerodinámico en tiempo real.',
            },
          ],
        },
        {
          id: 'simulador-truck-aysen',
          name: 'Simulador Truck Aysén',
          discipline: 'Transporte pesado · Región de Aysén',
          releaseDate: 'En desarrollo · Próximamente',
          tagline: 'Conduce camiones de carga por las rutas extremas de la Región de Aysén.',
          description:
            'Recorre la Carretera Austral, pendientes de montaña, puentes sobre ríos glaciales y tramos entre Coyhaique y Puerto Aysén transportando carga pesada bajo clima patagónico.',
          image: IMAGES.truckAysen,
          imageAlt: 'Camión de carga recorriendo carretera de montaña en la Región de Aysén',
          specs: [
            {label: 'Categoría', value: 'Simulación de camiones'},
            {label: 'Ambientación', value: 'Región de Aysén, Chile'},
            {label: 'Estado actual', value: 'En desarrollo'},
            {label: 'Enfoque', value: 'Carga pesada y rutas australes'},
          ],
          modes: [
            {
              id: 'carretera-austral',
              name: 'Carretera Austral',
              detail: 'Entregas de larga distancia conectando localidades y pasos de montaña en Aysén.',
            },
            {
              id: 'carga-pesada',
              name: 'Carga pesada',
              detail: 'Controla el peso del remolque, freno motor y marchas bajas en subidas exigentes.',
            },
            {
              id: 'clima-patagonico',
              name: 'Clima austral',
              detail: 'Enfrenta lluvia intensa, neblina costera y calzada resbaladiza en rutas patagónicas.',
            },
          ],
        },
      ],
    },
    missionContact: {
      missionKicker: 'Nuestra misión',
      missionTitle: 'Llevar nuestras ideas cada vez más lejos',
      missionBody:
        'Crear tecnología, videojuegos y experiencias digitales para todos, construyendo desde Chile un espacio abierto donde las ideas, la simulación y el entretenimiento conviven con propósito.',
      originLabel: 'Origen',
      originText: 'Un proyecto nacido en Chile, con grandes sueños',
      visionLabel: 'Visión',
      visionText: 'NexPlay — El futuro comienza aquí',
      directMailLabel: 'Correo directo',
      contactKicker: 'Soporte técnico y contacto',
      contactTitle: 'Envíanos tu consulta directamente',
      contactSubtitle:
        'No necesitas ingresar correo electrónico. Indícanos tu nombre, el área de interés y tu mensaje.',
      nameLabel: 'Nombre',
      namePlaceholder: 'Tu nombre',
      topicLabel: 'Área de interés',
      topics: [
        {id: 'Soporte técnico', label: 'Soporte técnico'},
        {id: 'F1 Simulador Aysén', label: 'F1 Simulador Aysén'},
        {id: 'Aysén NASCAR', label: 'Aysén NASCAR'},
        {id: 'Simulador Truck Aysén', label: 'Simulador Truck Aysén'},
        {id: 'Videojuegos', label: 'Videojuegos'},
        {id: 'Series y películas', label: 'Series y películas'},
        {id: 'Innovación', label: 'Innovación'},
      ],
      messageLabel: 'Mensaje',
      messagePlaceholder: 'Cuéntanos en qué podemos ayudarte o qué proyecto te interesa...',
      teamNote: 'Atención directa desde el equipo NexPlay Chile',
      submitButton: 'Enviar mensaje',
      successTitle: 'Mensaje enviado correctamente',
      successBodyPrefix: 'Gracias,',
      successBodyMiddle: 'Registramos tu mensaje sobre',
      successReset: 'Enviar otra consulta',
      errName: 'Por favor, ingresa tu nombre completo.',
      errMessage: 'Cuéntanos brevemente tu consulta (mínimo 10 caracteres).',
    },
    settings: {
      title: 'Ajustes de experiencia',
      subtitle: 'Personaliza el color de la interfaz y elige tu idioma preferido.',
      close: 'Cerrar',
      themeLabel: 'Apariencia',
      themeDark: 'Oscuro',
      themeLight: 'Claro',
      accentLabel: 'Color de acento',
      languageLabel: 'Idioma',
      resetDefaults: 'Restablecer valores',
      done: 'Listo',
    },
    footer: {
      tagline: 'Hecho en Chile · Tecnología y entretenimiento en un solo lugar',
    },
  },
  en: {
    nav: {
      ecosystem: 'Ecosystem',
      nexos: 'NexOS',
      games: 'Games',
      mission: 'Mission',
      settings: 'Settings',
      contact: 'Contact',
      account: 'Account',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
    },
    auth: {
      optionalBadge: 'Optional account · No sign-up required',
      titleSignedOut: 'NexPlay Account',
      titleSignedIn: 'Signed in to NexPlay',
      subtitleSignedOut:
        'You can sign in or create a NexPlay account, though it is completely optional to browse or play.',
      subtitleSignedIn:
        'Your optional NexPlay account is connected. Keep exploring or sign out anytime.',
      loginTab: 'Sign in',
      registerTab: 'Create account',
      usernameLabel: 'Username',
      usernamePlaceholder: 'e.g. aysen_driver',
      passwordLabel: 'Password',
      passwordPlaceholder: 'At least 4 characters',
      confirmPasswordLabel: 'Confirm password',
      confirmPasswordPlaceholder: 'Repeat your password',
      loginSubmit: 'Sign in',
      registerSubmit: 'Create account',
      continueGuest: 'Continue without account',
      logoutButton: 'Sign out',
      signedInAs: 'Signed in as',
      errShort: 'Enter a username (min 2 chars) and password (min 4 chars).',
      errMismatch: 'Passwords do not match.',
      errNetwork: 'Could not reach the account server.',
    },
    hero: {
      kicker: 'Chilean project · Technology and entertainment',
      headline: 'Technology and entertainment in one place.',
      description:
        'Welcome to NexPlay! We are a Chilean technology and entertainment project building new digital experiences: playable F1 Simulador Aysén & Aysén NASCAR, truck simulation, technical support, series and films, and continuous innovation.',
      primaryCta: 'Explore games',
      secondaryCta: 'Check NexOS status',
      pillarsStrip: [
        {
          kicker: 'Operating systems',
          title: 'NexOS',
          text: 'There are currently no NexOS operating systems available.',
        },
        {
          kicker: 'Video games · Playable now',
          title: 'F1 Aysén, Aysén NASCAR & Truck',
          text: 'Race 900 3D F1 tracks or V8 NASCAR banked ovals right now.',
        },
        {
          kicker: 'Direct assistance',
          title: 'Technical support',
          text: 'Practical help and real solutions for systems and hardware.',
        },
        {
          kicker: 'Entertainment & R&D',
          title: 'Series, films & innovation',
          text: 'Original audiovisual stories and digital prototypes made in Chile.',
        },
      ],
    },
    ecosystem: {
      kicker: 'Growing ecosystem',
      title: 'Much more than a single platform',
      subtitle:
        'NexPlay brings together truck simulation, technical support, audiovisual storytelling, and innovation under one digital vision.',
      filters: [
        {id: 'todos', label: 'All areas'},
        {id: 'software', label: 'Systems'},
        {id: 'juegos', label: 'Video games'},
        {id: 'multimedia', label: 'Audiovisual'},
        {id: 'servicios', label: 'Support'},
      ],
      showDetails: 'View summary',
      detailsVisible: 'Summary shown below',
      focusLabel: 'In focus',
      focusHeadingSuffix: 'key highlights',
      consultAbout: 'Inquire about',
      openPageLabel: 'Open dedicated page',
      backToPortalLabel: 'Back to NexPlay',
      switchAreaLabel: 'Ecosystem areas',
      highlightsTitle: 'Key highlights',
      capabilitiesTitle: 'What this area includes',
      pillars: [
        {
          id: 'sistemas-operativos',
          index: '01.',
          category: 'software',
          categoryLabel: 'Operating systems',
          title: 'NexOS Family',
          subtitle: 'No operating systems available at this time',
          description:
            'While NexOS is part of the broader NexPlay vision, there are currently no NexOS operating systems available for download or inquiry.',
          highlights: [
            'No NexOS builds or distributions are published right now',
            'Informational section only with inquiries disabled',
            'Current game development focus is on Simulador Truck Aysén',
          ],
          targetSection: '#nexos',
          ctaLabel: 'Open NexOS page',
          allowConsult: false,
          pageOverview:
            'The NexOS Family page gathers the official status for operating systems within NexPlay. There are currently no published distributions and technical requests for NexOS remain closed.',
          pageCapabilities: [
            {
              title: 'No builds published',
              detail: 'No ISO images, installers, or preview builds of NexOS are available at this time.',
            },
            {
              title: 'Inquiries closed',
              detail: 'Support and consultation inquiries for NexOS remain disabled until further notice.',
            },
            {
              title: 'Active focus',
              detail: 'Active studio work is focused on F1 Simulador Aysén, Aysén NASCAR, and Simulador Truck Aysén.',
            },
          ],
        },
        {
          id: 'videojuegos',
          index: '02.',
          category: 'juegos',
          categoryLabel: 'Entertainment · Video games',
          title: 'F1 Aysén, Aysén NASCAR & Truck',
          subtitle: '3D Formula 1, V8 Stock Cars, and heavy trucking',
          description:
            'Launch F1 Simulador Aysén (900 tracks) and Aysén NASCAR (banked ovals with 16-car packs & drafting) right in your browser, alongside Simulador Truck Aysén.',
          highlights: [
            'F1 Simulador Aysén playable now: 900 circuits, 3D garage, 2P & online',
            'Aysén NASCAR playable now: 31° banked ovals, 16 V8 stock cars & Cup mode',
            'Simulador Truck Aysén in development along the Carretera Austral',
          ],
          targetSection: '#juegos',
          ctaLabel: 'Open Video Games page',
          allowConsult: true,
          inquiryTopic: 'F1 Simulador Aysén',
          pageOverview:
            'NexPlay Games brings together Chilean-built 3D simulators playable directly in your browser alongside heavy-trucking development in southern Patagonia.',
          pageCapabilities: [
            {
              title: 'F1 Simulador Aysén (Playable)',
              detail: '900 Patagonian circuits, 3D garage, career mode, split-screen, and live online rooms.',
            },
            {
              title: 'Aysén NASCAR (Playable)',
              detail: 'Next-Gen V8 stock cars, 16-car pack drafting, Aysén NASCAR Cup, and online multiplayer.',
            },
            {
              title: 'Simulador Truck Aysén (In development)',
              detail: 'Heavy freight transport across the Carretera Austral, mountain passes, and southern weather.',
            },
          ],
        },
        {
          id: 'soporte-tecnico',
          index: '03.',
          category: 'servicios',
          categoryLabel: 'Services · Assistance',
          title: 'Technical support',
          subtitle: 'Direct help and practical tech solutions',
          description:
            'We help users troubleshoot software issues, tune hardware setups, and keep their devices running smoothly.',
          highlights: [
            'Software diagnostics and performance optimization',
            'Hardware setup and compatibility guidance',
            'Friendly, clear support from our team in Chile',
          ],
          targetSection: '#contacto',
          ctaLabel: 'Open Support page',
          allowConsult: true,
          inquiryTopic: 'Soporte técnico',
          pageOverview:
            'NexPlay Technical Support provides direct, practical guidance to diagnose software issues, improve system stability, and tune hardware setups.',
          pageCapabilities: [
            {
              title: 'Diagnostics & tuning',
              detail: 'Identify bottlenecks, background overhead, and system settings for smoother performance.',
            },
            {
              title: 'Hardware guidance',
              detail: 'Practical compatibility recommendations for simulation peripherals and PC builds.',
            },
            {
              title: 'Frictionless contact',
              detail: 'Reach our team directly through the portal contact form without requiring an email field.',
            },
          ],
        },
        {
          id: 'series-peliculas',
          index: '04.',
          category: 'multimedia',
          categoryLabel: 'Audiovisual · Series & films',
          title: 'Series and films',
          subtitle: 'Original entertainment productions',
          description:
            'We extend our creative work into film and series with independent stories and in-house digital post-production.',
          highlights: [
            'Original action and sci-fi scripts in development',
            'In-house editing, color grading, and digital production',
            'Connected storytelling across NexPlay worlds',
          ],
          targetSection: '#contacto',
          ctaLabel: 'Open Audiovisual page',
          allowConsult: true,
          inquiryTopic: 'Series y películas',
          pageOverview:
            'NexPlay Studios explores original action, adventure, and sci-fi stories crafted in Chile with independent digital editing and visual identity.',
          pageCapabilities: [
            {
              title: 'Scripts & worldbuilding',
              detail: 'Original characters, scripts, and visual worlds designed from the ground up.',
            },
            {
              title: 'In-house post-production',
              detail: 'Independent video editing, sound design, and digital compositing.',
            },
            {
              title: 'Connected universe',
              detail: 'Stories tied to the technology and motorsport spirit of NexPlay.',
            },
          ],
        },
        {
          id: 'innovacion',
          index: '05.',
          category: 'software',
          categoryLabel: 'Future · Research & design',
          title: 'Continuous innovation',
          subtitle: 'New ideas, prototypes, and digital concepts',
          description:
            'A dedicated lab where we test interactive tools, interfaces, and creative concepts that push Chilean tech forward.',
          highlights: [
            'Ongoing exploration of interactive engines and tools',
            'Open space to pitch ideas and collaborations',
            'Long-term commitment to taking local ideas further',
          ],
          targetSection: '#contacto',
          ctaLabel: 'Open Innovation page',
          allowConsult: true,
          inquiryTopic: 'Innovación',
          pageOverview:
            'Our Continuous Innovation lab tests new web technologies, 3D engines, and digital experience ideas that shape future NexPlay releases.',
          pageCapabilities: [
            {
              title: 'WebGL & simulation prototypes',
              detail: 'Ongoing experimentation with vehicle physics, lighting, and browser performance.',
            },
            {
              title: 'Interface design',
              detail: 'Continuous iteration on usability, accessibility, and multi-theme customization.',
            },
            {
              title: 'Open collaboration',
              detail: 'Community ideas and proposals are always welcome for upcoming experiments.',
            },
          ],
        },
      ],
    },
    nexos: {
      kicker: 'Operating systems',
      title: 'NexOS Status',
      subtitle: 'Current availability notice for operating systems within the NexPlay project.',
      imageCaptionKicker: 'Official notice',
      unavailableTitle: 'There are no NexOS operating systems',
      unavailableDescription:
        'At this time, there are no NexOS operating systems available for download, installation, or technical consultation.',
      unavailableNote:
        'Inquiries for NexOS are currently closed. Explore Simulador Truck Aysén and our active areas below.',
      plannedTitle: 'Current status',
      plannedBullets: [
        'No active NexOS distributions or releases exist right now.',
        'NexOS consultation requests are disabled.',
        'Technical support and Simulador Truck Aysén development remain active.',
      ],
    },
    games: {
      kicker: 'NexPlay Video Games',
      title: 'Simulation born in Aysén',
      subtitle:
        'Play F1 Simulador Aysén by NexPlay directly in your browser or follow our heavy-trucking simulator in development.',
      modesLabel: 'Modes & features',
      projectPrefix: 'Game',
      ctaPrefix: 'Ask about',
      items: [
        {
          id: 'f1-simulador-aysen',
          name: 'F1 Simulador Aysén',
          discipline: '3D Formula 1 · Aysén Region',
          releaseDate: 'Available now · Playable in NexPlay',
          tagline: 'Race across 900 Patagonian 3D circuits with a custom garage, career, and online multiplayer.',
          description:
            'Take the wheel across Coyhaique, Puerto Aysén, Cerro Castillo, Lago General Carrera, and hundreds of procedurally crafted tracks. Customize your car in the 3D garage, race split-screen, or join live online rooms.',
          image: IMAGES.f1Aysen,
          imageAlt: 'F1 Simulador Aysén open-wheel car racing on a Patagonian circuit',
          playableApp: 'f1-aysen',
          playCtaLabel: 'Play F1 Simulador Aysén',
          specs: [
            {label: 'Category', value: '3D F1 Simulator (WebGL)'},
            {label: 'Circuits', value: '900 playable tracks'},
            {label: 'Current status', value: 'Available now'},
            {label: 'Modes', value: 'Career, 2P & Online'},
          ],
          modes: [
            {
              id: 'carrera-trayectoria',
              name: 'Career & Quick Race',
              detail: 'Compete across Aysén championships, earn podium credits, and unlock new cars.',
            },
            {
              id: 'garaje-3d',
              name: '3D Garage & Time Trial',
              detail: 'Tune livery, aero, tire compounds, and post best lap times on the leaderboard.',
            },
            {
              id: 'online-splitscreen',
              name: 'Online & 2 Players',
              detail: 'Host or join real-time multiplayer rooms with chat or race local split-screen.',
            },
          ],
        },
        {
          id: 'nexracing-nascar',
          name: 'Aysén NASCAR',
          discipline: 'V8 Stock Car · Banked Ovals & Roval',
          releaseDate: 'Available now · Playable in NexPlay',
          tagline: 'Door-to-door pack racing on high-banked ovals with slipstream drafting and V8 roar.',
          description:
            'Drive Next-Gen Stock Cars across Aysén Superspeedway (31° banking), floodlit Atacama Night 400, Patagonia Bullring, and Cordillera Roval. Customize your number and paint in the 3D garage and chase the Aysén NASCAR Cup.',
          image: IMAGES.nexRacing,
          imageAlt: 'Aysén NASCAR stock cars racing at night under oval floodlights',
          playableApp: 'nexracing',
          playCtaLabel: 'Play Aysén NASCAR',
          specs: [
            {label: 'Category', value: '3D NASCAR Stock Car'},
            {label: 'Circuits', value: '4 banked ovals & roval'},
            {label: 'Current status', value: 'Available now'},
            {label: 'Modes', value: '16-Car Pack, Cup & Crono'},
          ],
          modes: [
            {
              id: 'pack-racing',
              name: 'Pack & Drafting',
              detail: 'Double-file rolling starts with 16 cars, slipstream boost, and live Pit Road service.',
            },
            {
              id: 'copa-nexracing',
              name: 'Aysén NASCAR Cup',
              detail: 'Official 4-race championship schedule with full NASCAR points standings.',
            },
            {
              id: 'taller-v8',
              name: '3D Paint Booth',
              detail: 'Customize car number, livery pattern, colors, and aero package live.',
            },
          ],
        },
        {
          id: 'simulador-truck-aysen',
          name: 'Simulador Truck Aysén',
          discipline: 'Heavy Trucking · Aysén Region',
          releaseDate: 'In development · Coming soon',
          tagline: 'Drive heavy freight trucks across the extreme routes of the Aysén Region.',
          description:
            'Haul cargo along the Carretera Austral, steep mountain passes, glacial river bridges, and winding roads between Coyhaique and Puerto Aysén in southern Patagonia.',
          image: IMAGES.truckAysen,
          imageAlt: 'Heavy cargo truck driving on a mountain highway in the Aysén Region',
          specs: [
            {label: 'Category', value: 'Truck simulation'},
            {label: 'Setting', value: 'Aysén Region, Chile'},
            {label: 'Current status', value: 'In development'},
            {label: 'Focus', value: 'Heavy cargo & southern routes'},
          ],
          modes: [
            {
              id: 'carretera-austral',
              name: 'Carretera Austral',
              detail: 'Long-haul freight deliveries connecting remote Patagonian towns and mountain passes.',
            },
            {
              id: 'carga-pesada',
              name: 'Heavy Cargo',
              detail: 'Manage trailer weight, engine braking, and low gears on steep climbs.',
            },
            {
              id: 'clima-patagonico',
              name: 'Southern Weather',
              detail: 'Navigate heavy rain, coastal fog, and slick tarmac across Patagonian highways.',
            },
          ],
        },
      ],
    },
    missionContact: {
      missionKicker: 'Our mission',
      missionTitle: 'Taking our ideas further every day',
      missionBody:
        'Creating technology, video games, and digital experiences for everyone—building from Chile an open project where ideas, simulation, and entertainment come together.',
      originLabel: 'Origin',
      originText: 'A project born in Chile, with big dreams',
      visionLabel: 'Vision',
      visionText: 'NexPlay — The future starts here',
      directMailLabel: 'Direct email',
      contactKicker: 'Technical support & contact',
      contactTitle: 'Send us your inquiry directly',
      contactSubtitle:
        'No email address is required. Just share your name, area of interest, and your message.',
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      topicLabel: 'Area of interest',
      topics: [
        {id: 'Soporte técnico', label: 'Technical support'},
        {id: 'F1 Simulador Aysén', label: 'F1 Simulador Aysén'},
        {id: 'Aysén NASCAR', label: 'Aysén NASCAR'},
        {id: 'Simulador Truck Aysén', label: 'Simulador Truck Aysén'},
        {id: 'Videojuegos', label: 'Video games'},
        {id: 'Series y películas', label: 'Series & films'},
        {id: 'Innovación', label: 'Innovation'},
      ],
      messageLabel: 'Message',
      messagePlaceholder: 'Tell us how we can help or which project you would like to know more about...',
      teamNote: 'Direct response from the NexPlay Chile team',
      submitButton: 'Send message',
      successTitle: 'Message sent successfully',
      successBodyPrefix: 'Thank you,',
      successBodyMiddle: 'We logged your message regarding',
      successReset: 'Send another message',
      errName: 'Please enter your name.',
      errMessage: 'Please enter a short message (at least 10 characters).',
    },
    settings: {
      title: 'Experience settings',
      subtitle: 'Customize the interface color and choose your preferred language.',
      close: 'Close',
      themeLabel: 'Appearance',
      themeDark: 'Dark',
      themeLight: 'Light',
      accentLabel: 'Accent color',
      languageLabel: 'Language',
      resetDefaults: 'Reset defaults',
      done: 'Done',
    },
    footer: {
      tagline: 'Made in Chile · Technology and entertainment in one place',
    },
  },
  pt: {
    nav: {
      ecosystem: 'Ecossistema',
      nexos: 'NexOS',
      games: 'Jogos',
      mission: 'Missão',
      settings: 'Ajustes',
      contact: 'Contato',
      account: 'Conta',
      openMenu: 'Abrir menu',
      closeMenu: 'Fechar menu',
    },
    auth: {
      optionalBadge: 'Conta opcional · Sem cadastro obrigatório',
      titleSignedOut: 'Conta NexPlay',
      titleSignedIn: 'Sessão ativa no NexPlay',
      subtitleSignedOut:
        'Você pode entrar ou criar uma conta no NexPlay, mas não é obrigatório para navegar ou jogar.',
      subtitleSignedIn:
        'Sua conta opcional do NexPlay está conectada. Continue explorando ou saia quando quiser.',
      loginTab: 'Entrar',
      registerTab: 'Criar conta',
      usernameLabel: 'Nome de usuário',
      usernamePlaceholder: 'Ex: piloto_aysen',
      passwordLabel: 'Senha',
      passwordPlaceholder: 'Mínimo 4 caracteres',
      confirmPasswordLabel: 'Confirmar senha',
      confirmPasswordPlaceholder: 'Repita sua senha',
      loginSubmit: 'Entrar',
      registerSubmit: 'Criar conta',
      continueGuest: 'Continuar sem conta',
      logoutButton: 'Sair da conta',
      signedInAs: 'Conectado como',
      errShort: 'Informe usuário (mín. 2 caracteres) e senha (mín. 4 caracteres).',
      errMismatch: 'As senhas não coincidem.',
      errNetwork: 'Não foi possível conectar ao servidor de contas.',
    },
    hero: {
      kicker: 'Projeto chileno · Tecnologia e entretenimento',
      headline: 'Tecnologia e diversão em um só lugar.',
      description:
        'Bem-vindos ao NexPlay! Somos um projeto tecnológico e de entretenimento nascido no Chile que cria novas experiências digitais: F1 Simulador Aysén e Aysén NASCAR jogáveis online, simulação de caminhões, suporte técnico, séries, filmes e inovação.',
      primaryCta: 'Explorar jogos',
      secondaryCta: 'Ver status do NexOS',
      pillarsStrip: [
        {
          kicker: 'Sistemas operacionais',
          title: 'NexOS',
          text: 'Atualmente não há sistemas operacionais NexOS disponíveis.',
        },
        {
          kicker: 'Jogos · Jogáveis agora',
          title: 'F1 Aysén, Aysén NASCAR & Truck',
          text: 'Corra agora em F1 3D ou ovais NASCAR V8 com 16 carros.',
        },
        {
          kicker: 'Assistência direta',
          title: 'Suporte técnico',
          text: 'Ajuda prática e soluções reais para sistemas e equipamentos.',
        },
        {
          kicker: 'Entretenimento e P&D',
          title: 'Séries, filmes e inovação',
          text: 'Novos projetos audiovisuais e protótipos digitais feitos no Chile.',
        },
      ],
    },
    ecosystem: {
      kicker: 'Ecossistema em crescimento',
      title: 'Muito além de uma única plataforma',
      subtitle:
        'O NexPlay reúne simulação de caminhões, suporte técnico, criação audiovisual e inovação sob uma mesma visão digital.',
      filters: [
        {id: 'todos', label: 'Todo o ecossistema'},
        {id: 'software', label: 'Sistemas'},
        {id: 'juegos', label: 'Jogos'},
        {id: 'multimedia', label: 'Audiovisual'},
        {id: 'servicios', label: 'Suporte'},
      ],
      showDetails: 'Ver resumo',
      detailsVisible: 'Resumo exibido abaixo',
      focusLabel: 'Em destaque',
      focusHeadingSuffix: 'pontos principais',
      consultAbout: 'Consultar sobre',
      openPageLabel: 'Abrir página dedicada',
      backToPortalLabel: 'Voltar ao NexPlay',
      switchAreaLabel: 'Áreas do ecossistema',
      highlightsTitle: 'Pontos-chave',
      capabilitiesTitle: 'O que esta área inclui',
      pillars: [
        {
          id: 'sistemas-operativos',
          index: '01.',
          category: 'software',
          categoryLabel: 'Sistemas operacionais',
          title: 'Família NexOS',
          subtitle: 'Sem sistemas operacionais disponíveis no momento',
          description:
            'Embora o NexOS faça parte da visão do ecossistema NexPlay, atualmente não há sistemas operacionais NexOS disponíveis para download ou consulta.',
          highlights: [
            'Não há versões ou distribuições do NexOS publicadas no momento',
            'Seção apenas informativa sem consultas ativas',
            'O foco atual em jogos está no Simulador Truck Aysén',
          ],
          targetSection: '#nexos',
          ctaLabel: 'Abrir página do NexOS',
          allowConsult: false,
          pageOverview:
            'A página Família NexOS reúne o status oficial sobre sistemas operacionais dentro do projeto. No momento não há nenhuma distribuição publicada nem atendimento técnico para o NexOS.',
          pageCapabilities: [
            {
              title: 'Sem downloads publicados',
              detail: 'Não há imagens ISO, instaladores nem versões preliminares do NexOS disponíveis atualmente.',
            },
            {
              title: 'Consultas fechadas',
              detail: 'O canal de consultas sobre o NexOS permanece desativado até novo aviso.',
            },
            {
              title: 'Foco ativo',
              detail: 'O trabalho ativo do estúdio está concentrado em F1 Simulador Aysén, Aysén NASCAR e Simulador Truck Aysén.',
            },
          ],
        },
        {
          id: 'videojuegos',
          index: '02.',
          category: 'juegos',
          categoryLabel: 'Entretenimento · Jogos',
          title: 'F1 Aysén, Aysén NASCAR e Truck',
          subtitle: 'Fórmula 1 3D, Stock Cars NASCAR V8 e transporte pesado',
          description:
            'Jogue F1 Simulador Aysén (900 pistas) e Aysén NASCAR (ovais inclinados com 16 carros e vácuo) direto no navegador, além do Simulador Truck Aysén.',
          highlights: [
            'F1 Simulador Aysén jogável agora: 900 pistas, garagem 3D, 2 jogadores e online',
            'Aysén NASCAR jogável agora: ovais de 31°, 16 stock cars V8 e Copa',
            'Simulador Truck Aysén em desenvolvimento pela Carretera Austral',
          ],
          targetSection: '#juegos',
          ctaLabel: 'Abrir página de Jogos',
          allowConsult: true,
          inquiryTopic: 'F1 Simulador Aysén',
          pageOverview:
            'A área de Jogos da NexPlay reúne simuladores 3D feitos no Chile e jogáveis no navegador, junto ao desenvolvimento de transporte pesado na Patagônia.',
          pageCapabilities: [
            {
              title: 'F1 Simulador Aysén (Jogável)',
              detail: '900 circuitos patagônicos, garagem 3D, carreira, tela dividida e salas online em tempo real.',
            },
            {
              title: 'Aysén NASCAR (Jogável)',
              detail: 'Stock cars V8 Next-Gen, pelotão de 16 carros, vácuo, Copa Aysén NASCAR e online.',
            },
            {
              title: 'Simulador Truck Aysén (Em desenvolvimento)',
              detail: 'Transporte de cargas pesadas pela Carretera Austral, serras e clima austral.',
            },
          ],
        },
        {
          id: 'soporte-tecnico',
          index: '03.',
          category: 'servicios',
          categoryLabel: 'Serviços · Assistência',
          title: 'Suporte técnico',
          subtitle: 'Ajuda direta e soluções reais em tecnologia',
          description:
            'Acompanhamos usuários com orientação prática para resolver problemas de software e otimizar equipamentos.',
          highlights: [
            'Diagnóstico de software e otimização de desempenho',
            'Consultoria em configuração e compatibilidade de hardware',
            'Atendimento próximo e claro da nossa equipe no Chile',
          ],
          targetSection: '#contacto',
          ctaLabel: 'Abrir página de Suporte',
          allowConsult: true,
          inquiryTopic: 'Soporte técnico',
          pageOverview:
            'O Suporte técnico da NexPlay oferece orientação prática para diagnosticar falhas em software, melhorar a estabilidade do sistema e orientar ajustes de hardware.',
          pageCapabilities: [
            {
              title: 'Diagnóstico e desempenho',
              detail: 'Análise de gargalos, processos em segundo plano e ajustes para mais fluidez.',
            },
            {
              title: 'Orientação de hardware',
              detail: 'Recomendações de compatibilidade, periféricos de simulação e montagem.',
            },
            {
              title: 'Contato direto',
              detail: 'Envie sua dúvida pelo formulário do portal sem precisar informar e-mail.',
            },
          ],
        },
        {
          id: 'series-peliculas',
          index: '04.',
          category: 'multimedia',
          categoryLabel: 'Audiovisual · Séries e filmes',
          title: 'Séries e filmes',
          subtitle: 'Novos projetos de entretenimento original',
          description:
            'Expandimos nossa criatividade para o formato audiovisual com produções independentes e pós-produção própria.',
          highlights: [
            'Desenvolvimento de roteiros originais de ação e ficção científica',
            'Edição, colorização e produção digital dentro do estúdio',
            'Integração narrativa com os mundos criativos do NexPlay',
          ],
          targetSection: '#contacto',
          ctaLabel: 'Abrir página Audiovisual',
          allowConsult: true,
          inquiryTopic: 'Series y películas',
          pageOverview:
            'O estúdio audiovisual da NexPlay cria histórias originais de ação, aventura e ficção científica produzidas de forma independente no Chile.',
          pageCapabilities: [
            {
              title: 'Roteiro e universo',
              detail: 'Desenvolvimento de personagens, roteiros e identidade visual autoral.',
            },
            {
              title: 'Pós-produção própria',
              detail: 'Edição de vídeo, som e composição digital no estúdio.',
            },
            {
              title: 'Narrativa conectada',
              detail: 'Projetos alinhados ao espírito tecnológico e automobilístico da NexPlay.',
            },
          ],
        },
        {
          id: 'innovacion',
          index: '05.',
          category: 'software',
          categoryLabel: 'Futuro · Pesquisa e design',
          title: 'Inovação contínua',
          subtitle: 'Novas ideias, protótipos e experiências digitais',
          description:
            'Um espaço permanente onde testamos ferramentas e conceitos interativos nascidos no Chile.',
          highlights: [
            'Exploração contínua de ferramentas interativas e motores gráficos',
            'Espaço aberto para propor ideias e colaborações',
            'Visão de longo prazo para levar projetos locais mais longe',
          ],
          targetSection: '#contacto',
          ctaLabel: 'Abrir página de Inovação',
          allowConsult: true,
          inquiryTopic: 'Innovación',
          pageOverview:
            'Nosso laboratório de Inovação contínua testa tecnologias web, motores 3D e novos conceitos digitais para os próximos lançamentos da NexPlay.',
          pageCapabilities: [
            {
              title: 'Protótipos WebGL',
              detail: 'Experimentos contínuos de física de veículos, iluminação e desempenho no navegador.',
            },
            {
              title: 'Design de interface',
              detail: 'Evolução constante em usabilidade, acessibilidade e personalização.',
            },
            {
              title: 'Colaboração aberta',
              detail: 'Recebemos ideias e propostas da comunidade para novos projetos.',
            },
          ],
        },
      ],
    },
    nexos: {
      kicker: 'Sistemas operacionais',
      title: 'Status do NexOS',
      subtitle: 'Aviso atualizado sobre a disponibilidade de sistemas operacionais no NexPlay.',
      imageCaptionKicker: 'Aviso oficial',
      unavailableTitle: 'Não há sistemas operacionais NexOS',
      unavailableDescription:
        'No momento não existe nenhum sistema operacional NexOS disponível para download, instalação ou consulta técnica.',
      unavailableNote:
        'As consultas sobre o NexOS estão desativadas até novo aviso. Conheça o projeto Simulador Truck Aysén e as áreas ativas abaixo.',
      plannedTitle: 'O que você precisa saber',
      plannedBullets: [
        'Não há versões ou distribuições do NexOS ativas atualmente.',
        'Não é possível enviar consultas sobre o NexOS no momento.',
        'Suporte técnico e o desenvolvimento do Simulador Truck Aysén seguem ativos.',
      ],
    },
    games: {
      kicker: 'Jogos da NexPlay',
      title: 'Simulação nascida em Aysén',
      subtitle:
        'Jogue F1 Simulador Aysén by NexPlay diretamente online ou acompanhe nosso simulador de caminhões em desenvolvimento.',
      modesLabel: 'Modos e recursos',
      projectPrefix: 'Jogo',
      ctaPrefix: 'Saber mais sobre',
      items: [
        {
          id: 'f1-simulador-aysen',
          name: 'F1 Simulador Aysén',
          discipline: 'Fórmula 1 3D · Região de Aysén',
          releaseDate: 'Disponível agora · Jogável no NexPlay',
          tagline: 'Corra em 900 circuitos patagônicos 3D com garagem, carreira e multijogador online.',
          description:
            'Assuma o volante em Coyhaique, Puerto Aysén, Cerro Castillo, Lago General Carrera e centenas de pistas geradas. Personalize seu carro na garagem 3D, jogue em tela dividida ou dispute corridas online.',
          image: IMAGES.f1Aysen,
          imageAlt: 'Carro de Fórmula 1 do F1 Simulador Aysén correndo na Patagônia',
          playableApp: 'f1-aysen',
          playCtaLabel: 'Jogar F1 Simulador Aysén',
          specs: [
            {label: 'Categoria', value: 'Simulador F1 3D (WebGL)'},
            {label: 'Circuitos', value: '900 pistas jogáveis'},
            {label: 'Status atual', value: 'Disponível agora'},
            {label: 'Modos', value: 'Carreira, 2P e Online'},
          ],
          modes: [
            {
              id: 'carrera-trayectoria',
              name: 'Carreira e Rápida',
              detail: 'Dispute campeonatos em Aysén, ganhe créditos por pódio e desbloqueie novos carros.',
            },
            {
              id: 'garaje-3d',
              name: 'Garagem 3D e Tomada de Tempo',
              detail: 'Ajuste pintura, aerodinâmica, pneus e registre sua melhor volta no ranking.',
            },
            {
              id: 'online-splitscreen',
              name: 'Online e 2 Jogadores',
              detail: 'Crie ou entre em salas multijogador em tempo real ou jogue em tela dividida.',
            },
          ],
        },
        {
          id: 'nexracing-nascar',
          name: 'Aysén NASCAR',
          discipline: 'Stock Car V8 · Ovais e Roval',
          releaseDate: 'Disponível agora · Jogável no NexPlay',
          tagline: 'Corra porta a porta em ovais inclinados com vácuo aerodinâmico, pelotão de 16 carros e motor V8.',
          description:
            'Pilote um Stock Car Next-Gen em Aysén Superspeedway (31° de inclinação), Atacama Night 400 sob refletores, Patagonia Bullring e Cordillera Roval. Personalize pintura e número na garagem 3D e dispute a Copa Aysén NASCAR.',
          image: IMAGES.nexRacing,
          imageAlt: 'Stock cars da Aysén NASCAR correndo em oval noturno iluminado',
          playableApp: 'nexracing',
          playCtaLabel: 'Jogar Aysén NASCAR',
          specs: [
            {label: 'Categoria', value: 'NASCAR Stock Car 3D'},
            {label: 'Circuitos', value: '4 ovais e roval inclinados'},
            {label: 'Status atual', value: 'Disponível agora'},
            {label: 'Modos', value: 'Pelotão 16, Copa e Crono'},
          ],
          modes: [
            {
              id: 'pack-racing',
              name: 'Pelotão e Vácuo',
              detail: 'Largada lançada em fila dupla com 16 carros, vácuo aerodinâmico e Pit Road ativo.',
            },
            {
              id: 'copa-nexracing',
              name: 'Copa Aysén NASCAR',
              detail: 'Campeonato oficial de 4 etapas com classificação e pontuação NASCAR.',
            },
            {
              id: 'taller-v8',
              name: 'Oficina de Pintura 3D',
              detail: 'Personalize número, faixas, cores e pacote aerodinâmico em tempo real.',
            },
          ],
        },
        {
          id: 'simulador-truck-aysen',
          name: 'Simulador Truck Aysén',
          discipline: 'Transporte pesado · Região de Aysén',
          releaseDate: 'Em desenvolvimento · Em breve',
          tagline: 'Dirija caminhões de carga pelas rotas extremas da Região de Aysén.',
          description:
            'Percorra a Carretera Austral, serras íngremes, pontes sobre rios glaciais e trechos entre Coyhaique e Puerto Aysén transportando cargas pesadas sob clima patagônico.',
          image: IMAGES.truckAysen,
          imageAlt: 'Caminhão de carga percorrendo rodovia de montanha na Região de Aysén',
          specs: [
            {label: 'Categoria', value: 'Simulação de caminhões'},
            {label: 'Ambientação', value: 'Região de Aysén, Chile'},
            {label: 'Status atual', value: 'Em desenvolvimento'},
            {label: 'Foco', value: 'Carga pesada e rotas austrais'},
          ],
          modes: [
            {
              id: 'carretera-austral',
              name: 'Carretera Austral',
              detail: 'Entregas de longa distância ligando cidades e trechos de montanha em Aysén.',
            },
            {
              id: 'carga-pesada',
              name: 'Carga pesada',
              detail: 'Controle o peso da carreta, freio-motor e marchas reduzidas em subidas fortes.',
            },
            {
              id: 'clima-patagonico',
              name: 'Clima austral',
              detail: 'Enfrente chuva intensa, neblina costeira e pista escorregadia na Patagônia.',
            },
          ],
        },
      ],
    },
    missionContact: {
      missionKicker: 'Nossa missão',
      missionTitle: 'Levar nossas ideias cada vez mais longe',
      missionBody:
        'Criar tecnologia, jogos e experiências digitais para todos, construindo a partir do Chile um espaço aberto onde ideias, simulação e entretenimento caminham juntos.',
      originLabel: 'Origem',
      originText: 'Um projeto nascido no Chile, com grandes sonhos',
      visionLabel: 'Visão',
      visionText: 'NexPlay — O futuro começa aqui',
      directMailLabel: 'E-mail direto',
      contactKicker: 'Suporte técnico e contato',
      contactTitle: 'Envie sua mensagem diretamente',
      contactSubtitle:
        'Não é necessário informar e-mail. Basta indicar seu nome, a área de interesse e sua mensagem.',
      nameLabel: 'Nome',
      namePlaceholder: 'Seu nome',
      topicLabel: 'Área de interesse',
      topics: [
        {id: 'Soporte técnico', label: 'Suporte técnico'},
        {id: 'F1 Simulador Aysén', label: 'F1 Simulador Aysén'},
        {id: 'Aysén NASCAR', label: 'Aysén NASCAR'},
        {id: 'Simulador Truck Aysén', label: 'Simulador Truck Aysén'},
        {id: 'Videojuegos', label: 'Jogos'},
        {id: 'Series y películas', label: 'Séries e filmes'},
        {id: 'Innovación', label: 'Inovação'},
      ],
      messageLabel: 'Mensagem',
      messagePlaceholder: 'Conte como podemos ajudar ou qual projeto chamou sua atenção...',
      teamNote: 'Atendimento direto da equipe NexPlay Chile',
      submitButton: 'Enviar mensagem',
      successTitle: 'Mensagem enviada com sucesso',
      successBodyPrefix: 'Obrigado,',
      successBodyMiddle: 'Registramos sua mensagem sobre',
      successReset: 'Enviar outra mensagem',
      errName: 'Por favor, informe seu nome.',
      errMessage: 'Escreva uma breve mensagem (mínimo 10 caracteres).',
    },
    settings: {
      title: 'Ajustes de experiência',
      subtitle: 'Personalize a cor da interface e escolha seu idioma preferido.',
      close: 'Fechar',
      themeLabel: 'Aparência',
      themeDark: 'Escuro',
      themeLight: 'Claro',
      accentLabel: 'Cor de destaque',
      languageLabel: 'Idioma',
      resetDefaults: 'Restaurar padrão',
      done: 'Concluir',
    },
    footer: {
      tagline: 'Feito no Chile · Tecnologia e entretenimento em um só lugar',
    },
  },
};
