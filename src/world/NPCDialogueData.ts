export interface NPCProfile {
  id: string;
  name: string;
  role: string;
  personality: string;
  backstory: string;
  portrait: string;
  zoneId: string;
  idleLines: string[];
}

export interface DialogueLine {
  speakerId: string;
  text: string;
  portrait?: string;
}

export interface DialogueCondition {
  type: 'relationship' | 'quest' | 'item' | 'level';
  referenceId: string;
  operator: '>=' | '<=' | '==' | '!=';
  value: number | string | boolean;
}

export interface DialogueSideEffect {
  type: 'startQuest' | 'modifyRelationship' | 'giveItem' | 'unlockZone';
  payload: any;
}

export interface DialogueChoice {
  text: string;
  nextNodeId: string;
  condition?: DialogueCondition;
  sideEffect?: DialogueSideEffect;
}

export interface DialogueNode {
  id: string;
  lines: DialogueLine[];
  choices?: DialogueChoice[];
  autoAdvanceAfterMs?: number;
}

export interface DialogueTree {
  npcId: string;
  rootNodeId: string;
  nodes: Record<string, DialogueNode>;
}

export const NPC_PROFILES: Record<string, NPCProfile> = {
  directora_elena: {
    id: 'directora_elena',
    name: 'Doña Elena',
    role: 'Directora del I.E.S.',
    personality: 'Autoritaria pero maternal, apasionada por la excelencia y la convivencia escolar.',
    backstory: 'Lleva más de 20 años dirigiendo el centro. Su sueño es ganar el certamen intercentros de innovación educativa.',
    portrait: '👩‍💼',
    zoneId: 'patio_central',
    idleLines: [
      '¡Bienvenidos al nuevo curso escolar! Este año demostraremos de qué pasta está hecho nuestro instituto.',
      'La disciplina y la curiosidad son las dos alas que os permitirán volar alto.',
      'Recuerda que las puertas de dirección siempre están abiertas para quien busque superarse.'
    ]
  },

  don_manuel: {
    id: 'don_manuel',
    name: 'Don Manuel',
    role: 'Profesor de Matemáticas',
    personality: 'Analítico, paciente y amante de los acertijos geométricos.',
    backstory: 'Ex-investigador universitario que descubrió que su verdadera vocación era enseñar álgebra a los más jóvenes.',
    portrait: '👨‍🏫',
    zoneId: 'patio_central',
    idleLines: [
      '¡Hola! Recuerda que las matemáticas no son para memorizar, ¡son para razonar y entender el mundo!',
      'Si tienes dudas con las ecuaciones o las fracciones de tu curso, ven a preguntarme cuando quieras.',
      '¿Sabías que la proporción áurea está presente en los caracoles, las galaxias y las obras de arte?'
    ]
  },

  dona_carmen: {
    id: 'dona_carmen',
    name: 'Doña Carmen',
    role: 'Profesora de Lengua y Literatura',
    personality: 'Elocuente, soñadora y defensora acérrima de la ortografía.',
    backstory: 'Autora de varios poemarios premiados, dedica las tardes a restaurar manuscritos en la biblioteca.',
    portrait: '👩‍🏫',
    zoneId: 'biblioteca',
    idleLines: [
      '¡Buenos días! Leer un buen libro es la mejor forma de viajar sin moverte del sitio.',
      'Cuida siempre la acentuación y los signos de puntuación; dan claridad y elegancia a lo que piensas.',
      'Estamos preparando el certamen literario del instituto. ¡Anímate a escribir un microrrelato!'
    ]
  },

  paco_conserje: {
    id: 'paco_conserje',
    name: 'Paco',
    role: 'Conserje Principal',
    personality: 'Pragmático, socarrón y el alma silenciosa que hace funcionar el centro.',
    backstory: 'Conoce cada tubería, candado y rincón secreto del instituto desde que se fundó el edificio.',
    portrait: '🔑',
    zoneId: 'patio_central',
    idleLines: [
      '¡A ver esos pasillos, que no se corre que os podéis resbalar!',
      'Si se te ha olvidado la chaqueta o el estuche en algún aula, avísame que tengo las llaves maestras.',
      'Acordaos de tirar los envases del bocadillo a la papelera amarilla del patio, que hay que cuidar el centro.'
    ]
  },

  marcos_alumno: {
    id: 'marcos_alumno',
    name: 'Marcos',
    role: 'Capitán de Deportes',
    personality: 'Enérgico, competitivo y leal amigo.',
    backstory: 'Estudia 2º de ESO y entrena todos los días para llevar al equipo de fútbol sala a la final regional.',
    portrait: '⚽',
    zoneId: 'pista_deportiva',
    idleLines: [
      '¡Pásala! ¡Nos quedan 10 minutos de recreo antes de que toque el timbre!',
      '¿Has hecho el reto voluntario de mates? Yo lo completé ayer y me dieron monedas para comprar la mochila.',
      '¡En cuanto suene el timbre vamos juntos a la pista a entrenar!'
    ]
  },

  lucia_delegada: {
    id: 'lucia_delegada',
    name: 'Lucía',
    role: 'Delegada de Alumnos',
    personality: 'Líder nata, organizada y defensora de los derechos estudiantiles.',
    backstory: 'Coordina el comité escolar de convivencia y organiza los torneos de debate escolar.',
    portrait: '📋',
    zoneId: 'patio_central',
    idleLines: [
      'Estamos recogiendo propuestas para mejorar las actividades del recreo.',
      'No olvides revisar el tablón de anuncios para las fechas de los exámenes finales.',
      'El trabajo en equipo siempre consigue mejores notas y mejores amistades.'
    ]
  },

  profesor_alberto: {
    id: 'profesor_alberto',
    name: 'Profesor Alberto',
    role: 'Profesor de Biología y Geología',
    personality: 'Apasionado de la botánica, ecologista y siempre con tierra en las manos.',
    backstory: 'Fundó el huerto escolar del IES para que los alumnos aprendan el ciclo de vida de los seres vivos.',
    portrait: '🌱',
    zoneId: 'huerto_escolar',
    idleLines: [
      'Las plantas nos enseñan paciencia: una semilla necesita tiempo y constancia para dar fruto.',
      'El compostaje reduce un 40% los residuos orgánicos de la cantina.',
      '¿Has observado los insectos polinizadores que visitan las tomateras?'
    ]
  },

  profesora_soraya: {
    id: 'profesora_soraya',
    name: 'Profesora Soraya',
    role: 'Profesora de Tecnología e Informática',
    personality: 'Visionaria tecnológica, fan del open-source y de la robótica educativa.',
    backstory: 'Ingeniera de telecomunicaciones que dejó la gran industria para inspirar a la próxima generación de programadores.',
    portrait: '💻',
    zoneId: 'sala_informatica',
    idleLines: [
      'Un algoritmo no es más que una receta paso a paso para resolver un enigma.',
      'Recuerda indentar bien tu código: la limpieza mental se refleja en tus programas.',
      'La informática no es solo pulsar teclas, es modelar soluciones creativas.'
    ]
  },

  pedro_bibliotecario: {
    id: 'pedro_bibliotecario',
    name: 'Don Pedro',
    role: 'Archivero y Bibliotecario',
    personality: 'Susurrante, metódico y guardián de códices antiguos.',
    backstory: 'Ha catalogado más de 15.000 volúmenes y conoce el paradero de todos los libros perdidos del centro.',
    portrait: '📚',
    zoneId: 'biblioteca',
    idleLines: [
      'Silencio, por favor; aquí las palabras están descansando en sus páginas.',
      'El índice de materias te guiará hacia la sección de historia antigua.',
      'Dicen que entre estos libros hay un mapa del tejado secreto...'
    ]
  },

  clara_artista: {
    id: 'clara_artista',
    name: 'Clara',
    role: 'Alumna de Artes Plásticas',
    personality: 'Creativa, observadora y siempre con un cuaderno de bocetos.',
    backstory: 'Diseña los carteles y murales de todas las festividades escolares.',
    portrait: '🎨',
    zoneId: 'pasillo_historia',
    idleLines: [
      'La perspectiva renacentista cambió para siempre la manera en que vemos el espacio tridimensional.',
      'Me encanta dibujar la luz del patio cuando cae la tarde.',
      'Usa los colores complementarios si quieres que un diseño destaque de verdad.'
    ]
  },

  javier_musico: {
    id: 'javier_musico',
    name: 'Don Javier',
    role: 'Profesor de Música',
    personality: 'Expresivo, armónico y enamorado de las escalas pentatónicas.',
    backstory: 'Director del coro del instituto y virtuoso del piano y la guitarra clásica.',
    portrait: '🎵',
    zoneId: 'pasillo_historia',
    idleLines: [
      'El ritmo está en los latidos del corazón y en el paso constante al caminar.',
      'Pitágoras descubrió las notas musicales midiendo la tensión de una cuerda.',
      'Escuchar con atención es el primer paso para componer algo grande.'
    ]
  },

  antonio_cantina: {
    id: 'antonio_cantina',
    name: 'Antonio',
    role: 'Encargado de la Cantina',
    personality: 'Alegre, generoso y promotor de la nutrición saludable.',
    backstory: 'Prepara las meriendas escolares con fruta fresca y pan recién horneado cada mañana.',
    portrait: '🥪',
    zoneId: 'patio_central',
    idleLines: [
      '¡Un plátano o una manzana a media mañana te dan energía para tres clases de matemáticas!',
      'Hoy tenemos bocadillos de tortilla recién hecha, ¡volarán en 5 minutos!',
      'Beber suficiente agua es fundamental para que el cerebro rinda al 100%.'
    ]
  },

  marta_cientifica: {
    id: 'marta_cientifica',
    name: 'Marta',
    role: 'Alumna de Bachillerato Científico',
    personality: 'Curiosa, escéptica y fanática del método científico.',
    backstory: 'Ganó la feria provincial de ciencias con su proyecto sobre sinapsis artificiales.',
    portrait: '🧪',
    zoneId: 'laboratorio',
    idleLines: [
      'No aceptes ninguna afirmación sin comprobar antes los datos y las evidencias.',
      'El microscopio electrónico nos permite observar un cosmos en una sola gota de agua.',
      'Cajal dibujaba a mano lo que veía con tinta china; era un auténtico genio.'
    ]
  },

  raul_atleta: {
    id: 'raul_atleta',
    name: 'Raúl',
    role: 'Profesor de Educación Física',
    personality: 'Motivador, disciplinado y promotor del juego limpio.',
    backstory: 'Ex-atleta de fondo que enseña que el esfuerzo constante supera al talento sin disciplina.',
    portrait: '🏃',
    zoneId: 'pista_deportiva',
    idleLines: [
      '¡El calentamiento antes de correr previene cualquier lesión!',
      'Mens sana in corpore sano: el ejercicio físico oxigena la mente para estudiar mejor.',
      'En el deporte lo más valioso no es ganar, sino aprender a levantarse tras la derrota.'
    ]
  },

  eva_filosofa: {
    id: 'eva_filosofa',
    name: 'Doña Eva',
    role: 'Profesora de Filosofía',
    personality: 'Socrática, reflexiva y cuestionadora de lo evidente.',
    backstory: 'Incentiva el pensamiento crítico y organiza debates éticos sobre la inteligencia artificial y el futuro.',
    portrait: '🏛️',
    zoneId: 'tejado_secreto',
    idleLines: [
      'El principio de la sabiduría es el asombro ante lo cotidiano.',
      'Cuestionar lo que damos por seguro es lo que nos hace verdaderamente humanos.',
      'Desde este tejado, los problemas de abajo parecen tan pequeños como interesantes.'
    ]
  }
};
