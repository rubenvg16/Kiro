import { HybridChallenge } from './types';

export const HYBRID_CHALLENGE_DEFINITIONS: HybridChallenge[] = [
  // 1. Matemáticas - La Balanza Algebraica de Pitágoras
  {
    id: 'puzzle_algebra_balance',
    title: 'La Balanza Algebraica de Pitágoras',
    subject: 'Matemáticas',
    difficulty: 'medium',
    parTimeSeconds: 120,
    relicRewardId: 'relic_balance_master',
    description: 'Equilibra la balanza algebraica y responde preguntas sobre ecuaciones lineales.',
    phases: [
      {
        type: 'mechanical',
        parTimeSeconds: 30,
        content: {
          mechanic: 'balance',
          obstacleCount: 2,
          title: 'Aislamiento de la Incógnita',
          description: 'Resta las unidades en ambos platos para equilibrar la ecuación 2x + 6 = 14.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Matemáticas',
          difficulty: 'medium',
          question: 'Si 2x + 6 = 14, ¿cuál es el valor de x?',
          correctAnswer: '4',
          distractors: ['3', '5', '8'],
          explanation: 'Restando 6 a ambos lados obtenemos 2x = 8, dividiendo por 2 resulta x = 4.'
        }
      },
      {
        type: 'mechanical',
        parTimeSeconds: 30,
        content: {
          mechanic: 'balance',
          obstacleCount: 3,
          title: 'División de Coeficientes',
          description: 'Divide ambos platos entre 2 para despejar x completamente.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Matemáticas',
          difficulty: 'medium',
          question: 'En un triángulo rectángulo con catetos de 3 y 4 cm, ¿cuánto mide la hipotenusa según el Teorema de Pitágoras?',
          correctAnswer: '5 cm',
          distractors: ['6 cm', '7 cm', '4.5 cm'],
          explanation: '3² + 4² = 9 + 16 = 25. La raíz cuadrada de 25 es 5 cm.'
        }
      }
    ]
  },

  // 2. Lengua - El Cifrado Secreto de Cervantes
  {
    id: 'puzzle_cervantes_cipher',
    title: 'El Cifrado Secreto de Miguel de Cervantes',
    subject: 'Lengua',
    difficulty: 'easy',
    parTimeSeconds: 120,
    relicRewardId: 'relic_cervantes_scroll',
    description: 'Alinea los discos del cifrador César y descifra los pasajes clásicos del Quijote.',
    phases: [
      {
        type: 'mechanical',
        parTimeSeconds: 30,
        content: {
          mechanic: 'cipher',
          obstacleCount: 1,
          title: 'Rueda de Sustitución César',
          description: 'Ajusta el desplazamiento de la rueda a 3 posiciones para revelar el manuscrito.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Lengua',
          difficulty: 'easy',
          question: '¿Qué figura retórica consiste en atribuir cualidades humanas a objetos inanimados?',
          correctAnswer: 'Personificación',
          distractors: ['Metáfora', 'Hipérbole', 'Aliteración'],
          explanation: 'La personificación o prosopopeya dota de rasgos humanos a seres inertes o animales.'
        }
      },
      {
        type: 'mechanical',
        parTimeSeconds: 30,
        content: {
          mechanic: 'cipher',
          obstacleCount: 2,
          title: 'Decodificación de Manuscrito',
          description: 'Identifica la palabra oculta aplicando el desplazamiento inverso.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Lengua',
          difficulty: 'easy',
          question: '¿Cuál de las siguientes palabras es esdrújula?',
          correctAnswer: 'Científico',
          distractors: ['Corazón', 'Árbol', 'Cartel'],
          explanation: 'Científico lleva el acento en la antepenúltima sílaba, por lo que siempre se acentúa.'
        }
      }
    ]
  },

  // 3. Ciencias - La Red Neuronal de Ramón y Cajal
  {
    id: 'puzzle_cajal_synapse',
    title: 'La Red Neuronal de Ramón y Cajal',
    subject: 'Ciencias',
    difficulty: 'medium',
    parTimeSeconds: 120,
    relicRewardId: 'relic_cajal_microscope',
    description: 'Conecta la vía del impulso nervioso y verifica la doctrina neuronal.',
    phases: [
      {
        type: 'mechanical',
        parTimeSeconds: 30,
        content: {
          mechanic: 'sequence',
          obstacleCount: 4,
          title: 'Secuencia del Impulso Nervioso',
          description: 'Conecta en orden: Dendritas -> Soma -> Axón -> Botón Sináptico.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Ciencias',
          difficulty: 'medium',
          question: '¿Qué organelo celular se conoce como la central energética productora de ATP?',
          correctAnswer: 'Mitocondria',
          distractors: ['Ribosoma', 'Aparato de Golgi', 'Lisosoma'],
          explanation: 'Las mitocondrias realizan la respiración celular y sintetizan la mayor parte del ATP.'
        }
      },
      {
        type: 'mechanical',
        parTimeSeconds: 30,
        content: {
          mechanic: 'sequence',
          obstacleCount: 3,
          title: 'Sincronización de Neurotransmisores',
          description: 'Libera las vesículas sinápticas hacia los receptores postsinápticos.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Ciencias',
          difficulty: 'medium',
          question: '¿En qué año recibió Santiago Ramón y Cajal el Premio Nobel de Fisiología o Medicina?',
          correctAnswer: '1906',
          distractors: ['1898', '1914', '1923'],
          explanation: 'Cajal recibió el Nobel en 1906 junto a Camillo Golgi por sus estudios sobre el sistema nervioso.'
        }
      }
    ]
  },

  // 4. Tecnología - El Telar Analítico de Ada Lovelace
  {
    id: 'puzzle_ada_algorithm',
    title: 'El Telar Analítico de Ada Lovelace',
    subject: 'Tecnología',
    difficulty: 'medium',
    parTimeSeconds: 120,
    description: 'Secuencia tarjetas perforadas y resuelve los fundamentos algorítmicos.',
    phases: [
      {
        type: 'mechanical',
        parTimeSeconds: 30,
        content: {
          mechanic: 'sequence',
          obstacleCount: 3,
          title: 'Perforación de Instrucciones',
          description: 'Ordena los pasos del bucle iterativo para calcular la serie de Bernoulli.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Tecnología',
          difficulty: 'medium',
          question: '¿Qué estructura de control repite un bloque de código mientras una condición sea verdadera?',
          correctAnswer: 'Bucle (While / For)',
          distractors: ['Condicional (If)', 'Constante', 'Función recursiva sin base'],
          explanation: 'Los bucles permiten la ejecución reiterada de instrucciones bajo una condición lógica.'
        }
      },
      {
        type: 'mechanical',
        parTimeSeconds: 30,
        content: {
          mechanic: 'maze',
          obstacleCount: 2,
          title: 'Enrutamiento del Bus de Datos',
          description: 'Guía los impulsos de la memoria a los registros de cálculo de la máquina.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Tecnología',
          difficulty: 'medium',
          question: '¿Cómo se llama el componente físico principal de una computadora que ejecuta las instrucciones de los programas?',
          correctAnswer: 'CPU (Unidad Central de Procesamiento)',
          distractors: ['Disco Duro', 'Memoria RAM', 'Fuente de alimentación'],
          explanation: 'La CPU interpreta y ejecuta las instrucciones de cómputo fundamentales.'
        }
      }
    ]
  },

  // 5. Ciencias - Las Constelaciones y Astrolabio de Hipatia
  {
    id: 'puzzle_hypatia_astronomy',
    title: 'El Astrolabio de Hipatia de Alejandría',
    subject: 'Ciencias',
    difficulty: 'medium',
    parTimeSeconds: 130,
    description: 'Orienta la aguja astronómica hacia las coordenadas polares correctas.',
    phases: [
      {
        type: 'mechanical',
        parTimeSeconds: 35,
        content: {
          mechanic: 'balance',
          obstacleCount: 2,
          title: 'Calibración del Astrolabio',
          description: 'Equilibra el limbo graduado respecto al cenit del observador.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Ciencias',
          difficulty: 'medium',
          question: '¿Qué tipo de sección cónica describe la órbita de los planetas alrededor del Sol según Kepler?',
          correctAnswer: 'Elipse',
          distractors: ['Círculo perfecto', 'Parábola', 'Hipérbola'],
          explanation: 'La primera ley de Kepler establece que las órbitas planetarias son elipses con el Sol en un foco.'
        }
      },
      {
        type: 'mechanical',
        parTimeSeconds: 35,
        content: {
          mechanic: 'sequence',
          obstacleCount: 3,
          title: 'Alineación de Eclíptica',
          description: 'Superpón la red estelar con las estrellas de referencia de la constelación de Orión.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Ciencias',
          difficulty: 'medium',
          question: '¿En qué famosa ciudad de la antigüedad enseñó y dirigió la escuela neoplatónica Hipatia?',
          correctAnswer: 'Alejandría',
          distractors: ['Atenas', 'Roma', 'Cartago'],
          explanation: 'Hipatia fue líder intelectual de la Biblioteca y Museo de Alejandría en Egipto.'
        }
      }
    ]
  },

  // 6. Ciencias - La Tabla Periódica y Radiactividad de Marie Curie
  {
    id: 'puzzle_curie_elements',
    title: 'El Laboratorio Radiactivo de Marie Curie',
    subject: 'Ciencias',
    difficulty: 'hard',
    parTimeSeconds: 140,
    description: 'Separa los isótopos de pechblenda y clasifica los elementos químicos.',
    phases: [
      {
        type: 'mechanical',
        parTimeSeconds: 35,
        content: {
          mechanic: 'balance',
          obstacleCount: 3,
          title: 'Aislamiento de Sales de Radio',
          description: 'Equilibra los pesos atómicos en el electrómetro piezoeléctrico de cuarzo.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 35,
        content: {
          subject: 'Ciencias',
          difficulty: 'hard',
          question: '¿Cuáles fueron los dos nuevos elementos químicos descubiertos por Marie y Pierre Curie?',
          correctAnswer: 'Polonio y Radio',
          distractors: ['Uranio y Torio', 'Curio y Plutonio', 'Cesio y Francio'],
          explanation: 'En 1898 descubrieron el polonio (nombrado por Polonia) y el radio debido a su intensa radiactividad.'
        }
      },
      {
        type: 'mechanical',
        parTimeSeconds: 35,
        content: {
          mechanic: 'sequence',
          obstacleCount: 3,
          title: 'Centrifugado Fraccionado',
          description: 'Alinea los tubos de ensayo según su densidad atómica relativa.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 35,
        content: {
          subject: 'Ciencias',
          difficulty: 'hard',
          question: '¿Qué partículas componen el núcleo de un átomo neutro?',
          correctAnswer: 'Protones y neutrones',
          distractors: ['Protones y electrones', 'Neutrones y fotones', 'Electrones y positrones'],
          explanation: 'El núcleo contiene nucleones (protones con carga positiva y neutrones sin carga).'
        }
      }
    ]
  },

  // 7. Matemáticas - El Arquitecto Geométrico
  {
    id: 'puzzle_geometry_architect',
    title: 'El Arquitecto Geométrico',
    subject: 'Matemáticas',
    difficulty: 'medium',
    parTimeSeconds: 120,
    description: 'Construye polígonos regulares y calcula perímetros y áreas.',
    phases: [
      {
        type: 'mechanical',
        parTimeSeconds: 30,
        content: {
          mechanic: 'platforming',
          obstacleCount: 3,
          title: 'Trazado de Vértices',
          description: 'Salta y activa los pilares para cerrar el hexágono en el plano.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Matemáticas',
          difficulty: 'medium',
          question: '¿Cuál es la fórmula para calcular el área de un círculo de radio r?',
          correctAnswer: 'π × r²',
          distractors: ['2 × π × r', 'π × r³', '4 × π × r²'],
          explanation: 'El área de un círculo es proporcional al cuadrado de su radio multiplicada por pi.'
        }
      },
      {
        type: 'mechanical',
        parTimeSeconds: 30,
        content: {
          mechanic: 'balance',
          obstacleCount: 2,
          title: 'Nivelación de Pendiente',
          description: 'Ajusta la altura de los soportes para mantener la viga con pendiente cero.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Matemáticas',
          difficulty: 'medium',
          question: '¿Cuántos grados suman los tres ángulos internos de cualquier triángulo plano?',
          correctAnswer: '180°',
          distractors: ['90°', '270°', '360°'],
          explanation: 'En la geometría euclidiana plana la suma de los ángulos interiores de todo triángulo es 180°.'
        }
      }
    ]
  },

  // 8. Lengua - El Detective Lingüístico
  {
    id: 'puzzle_linguistic_detective',
    title: 'El Detective Lingüístico',
    subject: 'Lengua',
    difficulty: 'easy',
    parTimeSeconds: 110,
    description: 'Encuentra las erratas en textos medievales y clasifica categorías gramaticales.',
    phases: [
      {
        type: 'mechanical',
        parTimeSeconds: 25,
        content: {
          mechanic: 'sequence',
          obstacleCount: 3,
          title: 'Organización Sintáctica',
          description: 'Ordena Sujeto + Verbo + Complemento Directo.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Lengua',
          difficulty: 'easy',
          question: 'En la oración "El gato veloz saltó la valla", ¿qué función sintáctica cumple "veloz"?',
          correctAnswer: 'Adjetivo (Modificador directo del núcleo)',
          distractors: ['Sustantivo núcleo', 'Verbo copulativo', 'Adverbio de lugar'],
          explanation: '"Veloz" es un adjetivo que califica al sustantivo gato.'
        }
      },
      {
        type: 'mechanical',
        parTimeSeconds: 25,
        content: {
          mechanic: 'cipher',
          obstacleCount: 1,
          title: 'Criptograma de Sinónimos',
          description: 'Descifra la palabra clave sustituyendo vocales por su número de orden.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Lengua',
          difficulty: 'easy',
          question: '¿Cuál es el antónimo directo de la palabra "efímero"?',
          correctAnswer: 'Duradero / Eterno',
          distractors: ['Fugaz', 'Rápido', 'Transitorio'],
          explanation: 'Efímero significa de corta duración; su antónimo es duradero o imperecedero.'
        }
      }
    ]
  },

  // 9. Historia - El Acueducto de Segovia y la Hispania Romana
  {
    id: 'puzzle_roman_aqueduct',
    title: 'La Ingeniería del Acueducto Romano',
    subject: 'Historia',
    difficulty: 'medium',
    parTimeSeconds: 130,
    description: 'Ensambla los sillares de granito sin argamasa y conoce la romanización.',
    phases: [
      {
        type: 'mechanical',
        parTimeSeconds: 35,
        content: {
          mechanic: 'balance',
          obstacleCount: 3,
          title: 'Colocación de la Clave del Arco',
          description: 'Centra la dovela central para que las fuerzas de compresión sostengan el arco.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Historia',
          difficulty: 'medium',
          question: '¿Cuál era el principal propósito de los acueductos en las ciudades romanas?',
          correctAnswer: 'Transportar agua potable desde manantiales montañosos',
          distractors: ['Servir de murallas defensivas', 'Canalizar aguas residuales al río', 'Demarcar fronteras provinciales'],
          explanation: 'Los acueductos transportaban agua por gravedad a termas, fuentes públicas y viviendas.'
        }
      },
      {
        type: 'mechanical',
        parTimeSeconds: 35,
        content: {
          mechanic: 'platforming',
          obstacleCount: 2,
          title: 'Supervisión del Specus',
          description: 'Recorre el canal superior asegurando una pendiente regular de 1%.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Historia',
          difficulty: 'medium',
          question: '¿Cómo llamaban los romanos a la Península Ibérica?',
          correctAnswer: 'Hispania',
          distractors: ['Galia', 'Lusitania', 'Britania'],
          explanation: 'Hispania fue el nombre otorgado por Roma a toda la Península Ibérica.'
        }
      }
    ]
  },

  // 10. Historia - La Crónica Medieval y las Tres Culturas
  {
    id: 'puzzle_middle_ages_chronicle',
    title: 'Toledo y la Escuela de Traductores',
    subject: 'Historia',
    difficulty: 'medium',
    parTimeSeconds: 120,
    description: 'Reconstruye códices de la convivencia de las tres culturas en Toledo.',
    phases: [
      {
        type: 'mechanical',
        parTimeSeconds: 30,
        content: {
          mechanic: 'sequence',
          obstacleCount: 3,
          title: 'Encuadernación de Pergaminos',
          description: 'Ordena cronológicamente los folios del scriptorium toledano.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Historia',
          difficulty: 'medium',
          question: '¿Qué monarca castellano impulsó decisivamente la Escuela de Traductores de Toledo en el siglo XIII?',
          correctAnswer: 'Alfonso X el Sabio',
          distractors: ['Fernando III el Santo', 'Carlos I', 'Felipe II'],
          explanation: 'Alfonso X el Sabio patrocinó la traducción masiva de obras árabes, hebreas y clásicas al castellano y latín.'
        }
      },
      {
        type: 'mechanical',
        parTimeSeconds: 30,
        content: {
          mechanic: 'maze',
          obstacleCount: 2,
          title: 'El Laberinto de la Judería',
          description: 'Navega los callejones históricos evitando los callejones sin salida.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Historia',
          difficulty: 'medium',
          question: '¿Cuáles fueron las tres culturas que convivieron intensamente en la Toledo medieval?',
          correctAnswer: 'Cristiana, Musulmana y Judía',
          distractors: ['Romana, Visigoda y Celta', 'Bizantina, Mora y Fenicia', 'Vikinga, Sajona y Franca'],
          explanation: 'Toledo es conocida como la Ciudad de las Tres Culturas por la coexistencia de cristianos, musulmanes y judíos.'
        }
      }
    ]
  },

  // 11. Tecnología - Compuertas Lógicas y Circuitos Binarios
  {
    id: 'puzzle_binary_logic_gates',
    title: 'Compuertas Lógicas y Circuitos Binarios',
    subject: 'Tecnología',
    difficulty: 'hard',
    parTimeSeconds: 130,
    description: 'Conecta compuertas AND, OR y NOT para resolver la tabla de verdad requerida.',
    phases: [
      {
        type: 'mechanical',
        parTimeSeconds: 35,
        content: {
          mechanic: 'sequence',
          obstacleCount: 3,
          title: 'Cableado del Circuito Lógico',
          description: 'Conecta las entradas A y B a la compuerta AND para obtener salida alta (1).'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Tecnología',
          difficulty: 'hard',
          question: '¿Cuál es la salida de una compuerta lógica AND cuando sus entradas son A=1 y B=0?',
          correctAnswer: '0 (Falso)',
          distractors: ['1 (Verdadero)', 'Indeterminado', 'Alta impedancia'],
          explanation: 'La compuerta AND solo produce un 1 si TODAS sus entradas son 1.'
        }
      },
      {
        type: 'mechanical',
        parTimeSeconds: 35,
        content: {
          mechanic: 'maze',
          obstacleCount: 3,
          title: 'Bypass de Cortocircuito',
          description: 'Guía la señal por el bus de cobre evitando los nodos en conflicto.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Tecnología',
          difficulty: 'hard',
          question: '¿Cuántos bits componen un Byte en la arquitectura de ordenadores estándar?',
          correctAnswer: '8 bits',
          distractors: ['4 bits', '16 bits', '32 bits'],
          explanation: 'Un byte está compuesto por un conjunto ordenado de 8 bits binarios (octeto).'
        }
      }
    ]
  },

  // 12. Ciencias - El Péndulo Simple y la Gravedad
  {
    id: 'puzzle_physics_pendulum',
    title: 'El Péndulo Simple de Galileo',
    subject: 'Ciencias',
    difficulty: 'medium',
    parTimeSeconds: 120,
    description: 'Ajusta la longitud de la cuerda y el ángulo para sincronizar el periodo oscilatorio.',
    phases: [
      {
        type: 'mechanical',
        parTimeSeconds: 30,
        content: {
          mechanic: 'balance',
          obstacleCount: 2,
          title: 'Ajuste de Amplitud Oscilatoria',
          description: 'Fija el ángulo inicial a 15 grados para respetar la aproximación de pequeñas oscilaciones.'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Ciencias',
          difficulty: 'medium',
          question: '¿De qué variable depende principalmente el período de un péndulo simple en la Tierra?',
          correctAnswer: 'De la longitud de la cuerda',
          distractors: ['De la masa de la pesa', 'Del color de la esfera', 'De la temperatura ambiente únicamente'],
          explanation: 'El período T = 2π√(L/g); no depende de la masa oscilante, sino de la longitud L y la gravedad g.'
        }
      },
      {
        type: 'mechanical',
        parTimeSeconds: 30,
        content: {
          mechanic: 'platforming',
          obstacleCount: 2,
          title: 'Punto de Inflexión',
          description: 'Sincroniza el salto en el instante en que la energía cinética es máxima (punto más bajo).'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          subject: 'Ciencias',
          difficulty: 'medium',
          question: '¿Cuál es el valor aproximado de la aceleración de la gravedad estándar en la superficie terrestre?',
          correctAnswer: '9.8 m/s²',
          distractors: ['3.14 m/s²', '12.5 m/s²', '1.6 m/s²'],
          explanation: 'La gravedad terrestre al nivel del mar se aproxima comúnmente como 9.8 m/s².'
        }
      }
    ]
  }
];
