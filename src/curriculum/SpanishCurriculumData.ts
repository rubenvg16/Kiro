export interface QuizQuestion {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
}

export interface ExtraChallenge {
  id: string;
  title: string;
  subject: string;
  description: string;
  rewardXP: number;
  rewardCoins: number;
}

export interface CourseCurriculum {
  id: string;
  name: string;
  stage: 'Primaria' | 'ESO' | 'Bachillerato';
  questions: QuizQuestion[];
  challenges: ExtraChallenge[];
}

export const SPANISH_CURRICULUM: Record<string, CourseCurriculum> = {
  '5primaria': {
    id: '5primaria',
    name: '5º de Primaria',
    stage: 'Primaria',
    questions: [
      {
        id: '5p_mat_1',
        subject: 'Matemáticas',
        question: '¿Cuál es el resultado de (25 × 4) + 50?',
        options: ['125', '150', '200', '100'],
        correctIndex: 1,
        explanation: '25 × 4 = 100, y 100 + 50 = 150.',
        points: 30
      },
      {
        id: '5p_mat_2',
        subject: 'Matemáticas',
        question: '¿Cómo se llama un polígono de 6 lados?',
        options: ['Pentágono', 'Hexágono', 'Heptágono', 'Octógono'],
        correctIndex: 1,
        explanation: 'El hexágono tiene 6 lados y 6 vértices.',
        points: 30
      },
      {
        id: '5p_len_1',
        subject: 'Lengua Castellana',
        question: '¿Qué palabra tiene un hiato?',
        options: ['Cielo', 'Baúl', 'Agua', 'Tierra'],
        correctIndex: 1,
        explanation: '"Ba-úl" separa la vocal abierta de la cerrada tónica, formando un hiato.',
        points: 30
      },
      {
        id: '5p_len_2',
        subject: 'Lengua Castellana',
        question: '¿Cuál es el antónimo de "efímero"?',
        options: ['Breve', 'Duradero', 'Rápido', 'Frágil'],
        correctIndex: 1,
        explanation: 'Efímero significa de corta duración; su contrario es duradero o eterno.',
        points: 30
      },
      {
        id: '5p_cie_1',
        subject: 'Ciencias Naturales',
        question: '¿Qué órgano del cuerpo humano bombea la sangre?',
        options: ['El estómago', 'Los pulmones', 'El corazón', 'El hígado'],
        correctIndex: 2,
        explanation: 'El corazón es el motor del aparato circulatorio.',
        points: 30
      },
      {
        id: '5p_cie_2',
        subject: 'Ciencias Naturales',
        question: '¿Cómo se llama el proceso por el cual las plantas fabrican su alimento?',
        options: ['Respiración', 'Polinización', 'Fotosíntesis', 'Germinación'],
        correctIndex: 2,
        explanation: 'La fotosíntesis utiliza luz solar, agua y CO2 para producir glucosa y oxígeno.',
        points: 30
      }
    ],
    challenges: [
      {
        id: 'ch_5p_1',
        title: 'Maestro del Cálculo Mental',
        subject: 'Matemáticas',
        description: 'Practica tablas de multiplicar y divisiones con resto.',
        rewardXP: 60,
        rewardCoins: 40
      },
      {
        id: 'ch_5p_2',
        title: 'Explorador del Reino Animal',
        subject: 'Ciencias Naturales',
        description: 'Clasifica vertebrados e invertebrados en el huerto escolar.',
        rewardXP: 55,
        rewardCoins: 35
      }
    ]
  },
  '6primaria': {
    id: '6primaria',
    name: '6º de Primaria',
    stage: 'Primaria',
    questions: [
      {
        id: '6p_mat_1',
        subject: 'Matemáticas',
        question: '¿Cuál es el 25% de 200?',
        options: ['25', '50', '75', '40'],
        correctIndex: 1,
        explanation: 'El 25% equivale a un cuarto: 200 / 4 = 50.',
        points: 35
      },
      {
        id: '6p_mat_2',
        subject: 'Matemáticas',
        question: '¿Cuánto es 3/4 + 1/2?',
        options: ['4/6', '5/4 (1.25)', '1', '2/4'],
        correctIndex: 1,
        explanation: '1/2 equivale a 2/4. 3/4 + 2/4 = 5/4 = 1,25.',
        points: 35
      },
      {
        id: '6p_len_1',
        subject: 'Lengua Castellana',
        question: '¿Cuál de estas oraciones tiene el verbo en pretérito perfecto simple?',
        options: ['Juan comía pan', 'Ayer Juan comió pan', 'Juan comerá pan', 'Juan ha comido pan'],
        correctIndex: 1,
        explanation: '"Comió" es la forma simple del pretérito perfecto.',
        points: 35
      },
      {
        id: '6p_soc_1',
        subject: 'Ciencias Sociales',
        question: '¿En qué año se aprobó la actual Constitución Española?',
        options: ['1975', '1978', '1982', '1992'],
        correctIndex: 1,
        explanation: 'La Constitución Española fue ratificada en referéndum el 6 de diciembre de 1978.',
        points: 35
      },
      {
        id: '6p_soc_2',
        subject: 'Ciencias Sociales',
        question: '¿Cuál es la capital de la Comunidad Autónoma de Andalucía?',
        options: ['Málaga', 'Granada', 'Sevilla', 'Córdoba'],
        correctIndex: 2,
        explanation: 'Sevilla es la sede del Parlamento y la Presidencia de la Junta de Andalucía.',
        points: 35
      }
    ],
    challenges: [
      {
        id: 'ch_6p_1',
        title: 'Desafío de Porcentajes y Fracciones',
        subject: 'Matemáticas',
        description: 'Resuelve problemas de compras y rebajas comerciales.',
        rewardXP: 70,
        rewardCoins: 45
      }
    ]
  },
  '1eso': {
    id: '1eso',
    name: '1º de E.S.O.',
    stage: 'ESO',
    questions: [
      {
        id: '1eso_mat_1',
        subject: 'Matemáticas',
        question: '¿Cuál es el valor de: (-8) + (+15) - (-3)?',
        options: ['4', '10', '-10', '15'],
        correctIndex: 1,
        explanation: '(-8) + 15 = 7; luego 7 - (-3) = 7 + 3 = 10.',
        points: 40
      },
      {
        id: '1eso_mat_2',
        subject: 'Matemáticas',
        question: '¿Cuál es el Mínimo Común Múltiplo (m.c.m.) de 4 y 6?',
        options: ['12', '24', '2', '8'],
        correctIndex: 0,
        explanation: 'Los múltiplos de 4 son 4, 8, 12... y los de 6 son 6, 12... El menor común es 12.',
        points: 40
      },
      {
        id: '1eso_len_1',
        subject: 'Lengua y Literatura',
        question: '¿Qué figura retórica consiste en exagerar una cualidad o hecho?',
        options: ['Metáfora', 'Hipérbole', 'Aliteración', 'Personificación'],
        correctIndex: 1,
        explanation: 'La hipérbole es una exageración expresiva (ej. "te lo he dicho un millón de veces").',
        points: 40
      },
      {
        id: '1eso_len_2',
        subject: 'Lengua y Literatura',
        question: '¿Cuáles son los elementos principales de la comunicación?',
        options: [
          'Sujeto, verbo y predicado',
          'Emisor, receptor, mensaje, código y canal',
          'Sustantivo, adjetivo y adverbio',
          'Prólogo, nudo y desenlace'
        ],
        correctIndex: 1,
        explanation: 'El emisor transmite un mensaje al receptor a través de un canal usando un código común.',
        points: 40
      },
      {
        id: '1eso_geo_1',
        subject: 'Geografía e Historia',
        question: '¿Cuál es el pico más alto de la Península Ibérica?',
        options: ['Teide', 'Mulhacén', 'Aneto', 'Veleta'],
        correctIndex: 1,
        explanation: 'El Mulhacén (Sierra Nevada, Granada) con 3.479 m es el más alto de la Península.',
        points: 40
      },
      {
        id: '1eso_geo_2',
        subject: 'Geografía e Historia',
        question: '¿Entre qué ríos se desarrolló la civilización de Mesopotamia?',
        options: ['Nilo y Éufrates', 'Tíber y Danubio', 'Tigris y Éufrates', 'Ganges e Indo'],
        correctIndex: 2,
        explanation: 'Mesopotamia significa en griego "tierra entre dos ríos" (el Tigris y el Éufrates).',
        points: 40
      }
    ],
    challenges: [
      {
        id: 'ch_1eso_1',
        title: 'Reto de Números Enteros y m.c.m.',
        subject: 'Matemáticas',
        description: 'Domina los signos positivos y negativos con problemas prácticos.',
        rewardXP: 75,
        rewardCoins: 50
      },
      {
        id: 'ch_1eso_2',
        title: 'Taller de Mitología e Historia Antigua',
        subject: 'Historia',
        description: 'Descubre las civilizaciones fluviales de Egipto y Mesopotamia.',
        rewardXP: 65,
        rewardCoins: 40
      }
    ]
  },
  '2eso': {
    id: '2eso',
    name: '2º de E.S.O.',
    stage: 'ESO',
    questions: [
      {
        id: '2eso_mat_1',
        subject: 'Matemáticas',
        question: 'Resuelve la ecuación: 3x - 5 = x + 7. ¿Cuánto vale x?',
        options: ['x = 4', 'x = 6', 'x = 2', 'x = 12'],
        correctIndex: 1,
        explanation: '3x - x = 7 + 5 => 2x = 12 => x = 6.',
        points: 45
      },
      {
        id: '2eso_mat_2',
        subject: 'Matemáticas',
        question: 'Si 4 obreros tardan 6 horas en pintar un muro, ¿cuántas horas tardarán 8 obreros?',
        options: ['12 horas', '3 horas', '4 horas', '8 horas'],
        correctIndex: 1,
        explanation: 'Es proporcionalidad inversa: a doble de obreros, la mitad de tiempo (6 / 2 = 3 h).',
        points: 45
      },
      {
        id: '2eso_fq_1',
        subject: 'Física y Química',
        question: '¿Cuál es el símbolo químico del Hierro?',
        options: ['H', 'He', 'Fe', 'Ir'],
        correctIndex: 2,
        explanation: 'El símbolo del hierro es Fe (del latín "Ferrum").',
        points: 45
      },
      {
        id: '2eso_fq_2',
        subject: 'Física y Química',
        question: '¿Qué partículas con carga negativa orbitan alrededor del núcleo atómico?',
        options: ['Protones', 'Neutrones', 'Electrones', 'Fotones'],
        correctIndex: 2,
        explanation: 'Los electrones poseen carga negativa y orbitan en la corteza atómica.',
        points: 45
      },
      {
        id: '2eso_len_1',
        subject: 'Lengua y Literatura',
        question: 'En la oración "El alumno entregó el trabajo al profesor", ¿qué función cumple "al profesor"?',
        options: ['Complemento Directo (CD)', 'Complemento Indirecto (CI)', 'Atributo', 'Complemento Circunstancial'],
        correctIndex: 1,
        explanation: '"Al profesor" es CI ("se lo entregó").',
        points: 45
      },
      {
        id: '2eso_his_1',
        subject: 'Geografía e Historia',
        question: '¿En qué año llegaron las tropas musulmanas a la Península Ibérica (Batalla de Guadalete)?',
        options: ['711', '1492', '476', '1212'],
        correctIndex: 0,
        explanation: 'El año 711 marca el inicio de al-Ándalus tras la derrota visigoda.',
        points: 45
      }
    ],
    challenges: [
      {
        id: 'ch_2eso_1',
        title: 'Laboratorio de Ecuaciones y Proporciones',
        subject: 'Matemáticas',
        description: 'Aplica reglas de tres y ecuaciones de primer grado a la vida real.',
        rewardXP: 80,
        rewardCoins: 55
      },
      {
        id: 'ch_2eso_2',
        title: 'Ruta de la Edad Media y el Románico',
        subject: 'Historia',
        description: 'Conoce los castillos y catedrales medievales.',
        rewardXP: 70,
        rewardCoins: 45
      }
    ]
  },
  '3eso': {
    id: '3eso',
    name: '3º de E.S.O.',
    stage: 'ESO',
    questions: [
      {
        id: '3eso_mat_1',
        subject: 'Matemáticas',
        question: 'En un triángulo rectángulo con catetos de 3 cm y 4 cm, ¿cuánto mide la hipotenusa?',
        options: ['5 cm', '6 cm', '7 cm', '25 cm'],
        correctIndex: 0,
        explanation: 'Pitágoras: h² = 3² + 4² = 25 => h = 5 cm.',
        points: 50
      },
      {
        id: '3eso_mat_2',
        subject: 'Matemáticas',
        question: '¿Cuál es el desarrollo del producto notable (a + b)²?',
        options: ['a² + b²', 'a² + 2ab + b²', 'a² - 2ab + b²', '2a + 2b'],
        correctIndex: 1,
        explanation: 'El cuadrado de una suma es igual al cuadrado del primero más el doble producto más el cuadrado del segundo.',
        points: 50
      },
      {
        id: '3eso_bio_1',
        subject: 'Biología y Geología',
        question: '¿Qué orgánulo celular produce la mayor parte del ATP energético?',
        options: ['Ribosoma', 'Mitocondria', 'Aparato de Golgi', 'Lisosoma'],
        correctIndex: 1,
        explanation: 'Las mitocondrias son las centrales energéticas de la célula eucariota.',
        points: 50
      },
      {
        id: '3eso_fq_1',
        subject: 'Física y Química',
        question: '¿Qué establece la Ley de Conservación de la Masa de Lavoisier?',
        options: [
          'La energía ni se crea ni se destruye',
          'En una reacción química, la masa total de reactivos es igual a la de los productos',
          'La fuerza es proporcional a la aceleración',
          'El volumen de un gas es constante a temperatura fija'
        ],
        correctIndex: 1,
        explanation: 'La materia ni se crea ni se destruye en las reacciones químicas ordinarias.',
        points: 50
      },
      {
        id: '3eso_len_1',
        subject: 'Lengua y Literatura',
        question: '¿Quién escribió "La Celestina" a finales del siglo XV?',
        options: ['Garcilaso de la Vega', 'Fernando de Rojas', 'Miguel de Cervantes', 'Lope de Vega'],
        correctIndex: 1,
        explanation: 'Fernando de Rojas escribió la "Tragicomedia de Calisto y Melibea".',
        points: 50
      }
    ],
    challenges: [
      {
        id: 'ch_3eso_1',
        title: 'Desafío del Teorema de Pitágoras y Semejanza',
        subject: 'Matemáticas',
        description: 'Calcula alturas de edificios escolares mediante sombras.',
        rewardXP: 85,
        rewardCoins: 60
      }
    ]
  },
  '4eso': {
    id: '4eso',
    name: '4º de E.S.O.',
    stage: 'ESO',
    questions: [
      {
        id: '4eso_mat_1',
        subject: 'Matemáticas',
        question: '¿Cuál es el valor del seno de 30º?',
        options: ['1/2 (0.5)', '√2/2', '√3/2', '1'],
        correctIndex: 0,
        explanation: 'sen(30º) = 0.5 en trigonometría elemental.',
        points: 55
      },
      {
        id: '4eso_mat_2',
        subject: 'Matemáticas',
        question: '¿Cuál es el logaritmo en base 10 de 1.000? log₁₀(1000)',
        options: ['10', '3', '100', '1'],
        correctIndex: 1,
        explanation: '10³ = 1000, por lo que log₁₀(1000) = 3.',
        points: 55
      },
      {
        id: '4eso_fq_1',
        subject: 'Física y Química',
        question: 'Según la 2ª Ley de Newton, ¿cuál es la fórmula de la fuerza?',
        options: ['F = m / a', 'F = m · a', 'F = m · v', 'F = 1/2 m · a²'],
        correctIndex: 1,
        explanation: 'Fuerza = masa × aceleración (F = m · a) en Newtons.',
        points: 55
      },
      {
        id: '4eso_his_1',
        subject: 'Historia',
        question: '¿En qué año comenzó la Guerra Civil Española?',
        options: ['1914', '1931', '1936', '1939'],
        correctIndex: 2,
        explanation: 'La Guerra Civil Española comenzó el 18 de julio de 1936.',
        points: 55
      },
      {
        id: '4eso_len_1',
        subject: 'Lengua y Literatura',
        question: '¿A qué generación literaria pertenecen autores como Federico García Lorca y Rafael Alberti?',
        options: ['Generación del 98', 'Generación del 27', 'Generación del 14', 'Modernismo'],
        correctIndex: 1,
        explanation: 'La Generación del 27 conmemoró el tricentenario de Góngora en 1927.',
        points: 55
      }
    ],
    challenges: [
      {
        id: 'ch_4eso_1',
        title: 'Preparación para Bachillerato: Cinemática y Dinámica',
        subject: 'Física',
        description: 'Resuelve problemas de velocidad, aceleración y caída libre.',
        rewardXP: 95,
        rewardCoins: 70
      }
    ]
  },
  '1bach': {
    id: '1bach',
    name: '1º de Bachillerato',
    stage: 'Bachillerato',
    questions: [
      {
        id: '1bach_mat_1',
        subject: 'Matemáticas I',
        question: '¿Cuál es la derivada de f(x) = x³ - 4x + 7?',
        options: ['3x² - 4', '3x² - 4x', 'x² - 4', '3x - 4'],
        correctIndex: 0,
        explanation: 'd/dx(x³) = 3x², d/dx(-4x) = -4, y la derivada de 7 es 0.',
        points: 60
      },
      {
        id: '1bach_mat_2',
        subject: 'Matemáticas I',
        question: '¿Cuál es el límite cuando x tiende a infinito de (2x² + 5) / (x² - 3)?',
        options: ['0', '1', '2', 'Infinito'],
        correctIndex: 2,
        explanation: 'Dividiendo por x², el cociente de los coeficientes de mayor grado es 2 / 1 = 2.',
        points: 60
      },
      {
        id: '1bach_fil_1',
        subject: 'Filosofía',
        question: '¿A qué filósofo griego se atribuye la teoría del "Mito de la Caverna"?',
        options: ['Aristóteles', 'Sócrates', 'Platón', 'Heráclito'],
        correctIndex: 2,
        explanation: 'Platón expone la alegoría de la caverna en "La República".',
        points: 60
      },
      {
        id: '1bach_fq_1',
        subject: 'Física y Química',
        question: '¿Cuál es el valor del número de Avogadro?',
        options: ['6,022 × 10²³ mol⁻¹', '3,00 × 10⁸ m/s', '9,81 m/s²', '1,602 × 10⁻¹⁹ C'],
        correctIndex: 0,
        explanation: 'El número de Avogadro (6,022 × 10²³) define la cantidad de entidades en un mol.',
        points: 60
      }
    ],
    challenges: [
      {
        id: 'ch_1bach_1',
        title: 'Olimpiada Académica de Bachillerato',
        subject: 'Ciencias y Letras',
        description: 'Retos de alta puntuación para preparar la PAU / Selectividad.',
        rewardXP: 110,
        rewardCoins: 85
      }
    ]
  }
};
