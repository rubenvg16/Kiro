import * as THREE from 'three';
import { PuzzleEngine } from '../puzzles/PuzzleEngine';

export interface HistoricalFigure {
  id: string;
  name: string;
  title: string;
  era: string;
  badge: string;
  puzzleId: string;
  position: THREE.Vector3;
  mesh: THREE.Group;
  head: THREE.Group;
  dialogue: string[];
  puzzleAction: () => void;
}

export class HistoricalFiguresManager {
  public group: THREE.Group;
  public figures: HistoricalFigure[] = [];
  public activeFigure: HistoricalFigure | null = null;
  private puzzleEngine: PuzzleEngine;

  constructor() {
    this.group = new THREE.Group();
    this.puzzleEngine = PuzzleEngine.getInstance();
    this.createHistoricalFigures();
  }

  private createHistoricalFigures(): void {
    // 1. Santiago Ramón y Cajal (Nobel de Medicina 1906)
    const cajalGroup = this.buildFigureModel({
      skinColor: 0xf5cda6,
      coatColor: 0x1e293b,
      pantsColor: 0x0f172a,
      hairColor: 0x94a3b8,
      hasMustache: true
    });
    cajalGroup.group.position.set(-22, 0, 6);
    this.group.add(cajalGroup.group);

    this.figures.push({
      id: 'cajal',
      name: 'Santiago Ramón y Cajal',
      title: 'Premio Nobel de Medicina y Padre de la Neurociencia',
      era: 'España (1852 - 1934)',
      badge: '🔬',
      puzzleId: 'puzzle_cajal_synapse',
      position: new THREE.Vector3(-22, 0, 6),
      mesh: cajalGroup.group,
      head: cajalGroup.head,
      dialogue: [
        '¡Saludos, joven investigador! Todo hombre puede ser, si se lo propone, escultor de su propio cerebro.',
        'Con paciencia y mi humilde microscopio descubrí que las neuronas no forman una red continua, sino que dialogan entre sí a través de la sinapsis.',
        'La voluntad y la disciplina son los mejores cinceles del talento mental.',
        '¿Aceptas el reto de reconstruir el circuito eléctrico de una neurona para ganar la Medalla Científica?'
      ],
      puzzleAction: () => this.puzzleEngine.launchCajalSynapse()
    });

    // 2. Miguel de Cervantes Saavedra
    const cervantesGroup = this.buildFigureModel({
      skinColor: 0xfcd34d,
      coatColor: 0x7c2d12,
      pantsColor: 0x451a03,
      hairColor: 0x78716c,
      hasRuff: true
    });
    cervantesGroup.group.position.set(14, 0, -4);
    this.group.add(cervantesGroup.group);

    this.figures.push({
      id: 'cervantes',
      name: 'Miguel de Cervantes',
      title: 'Príncipe de los Ingenios de la Literatura Española',
      era: 'Siglo de Oro (1547 - 1616)',
      badge: '📜',
      puzzleId: 'puzzle_cervantes_cipher',
      position: new THREE.Vector3(14, 0, -4),
      mesh: cervantesGroup.group,
      head: cervantesGroup.head,
      dialogue: [
        '¡Pardiez, noble hidalgo! Quien lee mucho y anda mucho, ve mucho y sabe mucho.',
        'Dejé escritas las aventuras de don Quijote y Sancho Panza en un lugar de la Mancha de cuyo nombre no quiero acordarme.',
        'La pluma es la lengua del alma; cuales fueren los conceptos engendrados, tales serán los escritos.',
        'He protegido un pasaje secreto con un cifrado de desplazamiento. ¿Serás capaz de descifrarlo?'
      ],
      puzzleAction: () => this.puzzleEngine.launchCervantesCipher()
    });

    // 3. Pitágoras de Samos
    const pythagorasGroup = this.buildFigureModel({
      skinColor: 0xf5cda6,
      coatColor: 0xf8fafc,
      pantsColor: 0xe2e8f0,
      hairColor: 0xd1d5db,
      hasTogaTrim: true
    });
    pythagorasGroup.group.position.set(-6, 0, 6);
    this.group.add(pythagorasGroup.group);

    this.figures.push({
      id: 'pitagoras',
      name: 'Pitágoras de Samos',
      title: 'Filósofo y Matemático Griego',
      era: 'Grecia Clásica (c. 570 - c. 495 a. C.)',
      badge: '📐',
      puzzleId: 'puzzle_algebra_balance',
      position: new THREE.Vector3(-6, 0, 6),
      mesh: pythagorasGroup.group,
      head: pythagorasGroup.head,
      dialogue: [
        '¡Salve! Los números rigen el cosmos y la armonía del universo entero.',
        'En los triángulos rectángulos descubrí que el cuadrado de la hipotenusa iguala la suma de los cuadrados de los catetos.',
        'La música y la astronomía son ramas hermanadas por proporciones numéricas puras.',
        'Para entender el álgebra moderna debes dominar el equilibrio. ¿Te atreves con la Balanza Algebraica?'
      ],
      puzzleAction: () => this.puzzleEngine.launchAlgebraBalance()
    });

    // 4. Ada Lovelace
    const adaGroup = this.buildFigureModel({
      skinColor: 0xf5cda6,
      coatColor: 0x4c1d95,
      pantsColor: 0x2e1065,
      hairColor: 0x171717
    });
    adaGroup.group.position.set(22, 0, 36);
    this.group.add(adaGroup.group);

    this.figures.push({
      id: 'ada_lovelace',
      name: 'Ada Lovelace',
      title: 'Madre de la Programación y Primera Algoritmista',
      era: 'Inglaterra Victoriana (1815 - 1852)',
      badge: '💻',
      puzzleId: 'puzzle_ada_algorithm',
      position: new THREE.Vector3(22, 0, 36),
      mesh: adaGroup.group,
      head: adaGroup.head,
      dialogue: [
        '¡Saludos! La máquina analítica teje dibujos algebraicos tal como el telar de Jacquard teje flores.',
        'Fui la primera en comprender que las computadoras no solo procesarían números, sino cualquier símbolo o música.',
        'La imaginación poética y la ciencia analítica son aliadas inseparables.',
        '¿Quieres programar una secuencia de instrucciones para completar el reto lógico computacional?'
      ],
      puzzleAction: () => this.puzzleEngine.launchAlgebraBalance()
    });

    // 5. Hipatia de Alejandría
    const hipatiaGroup = this.buildFigureModel({
      skinColor: 0xfcd34d,
      coatColor: 0x065f46,
      pantsColor: 0x064e3b,
      hairColor: 0x78350f,
      hasTogaTrim: true
    });
    hipatiaGroup.group.position.set(2, 0, 28);
    this.group.add(hipatiaGroup.group);

    this.figures.push({
      id: 'hipatia',
      name: 'Hipatia de Alejandría',
      title: 'Astrónoma, Matemática y Filósofa Neoplatónica',
      era: 'Alejandría (c. 360 - 415 d. C.)',
      badge: '🌌',
      puzzleId: 'puzzle_hypatia_astronomy',
      position: new THREE.Vector3(2, 0, 28),
      mesh: hipatiaGroup.group,
      head: hipatiaGroup.head,
      dialogue: [
        'Defiende tu derecho a pensar: incluso equivocarse es mejor que no pensar en absoluto.',
        'Perfeccioné el astrolabio y estudié las órbitas de los cuerpos celestes con geometría cónica.',
        'La verdad nunca teme a las preguntas razonadas.',
        '¿Aceptas el reto de alinear las constelaciones para descubrir la trayectoria estelar?'
      ],
      puzzleAction: () => this.puzzleEngine.launchAlgebraBalance()
    });

    // 6. Marie Curie
    const curieGroup = this.buildFigureModel({
      skinColor: 0xf5cda6,
      coatColor: 0x374151,
      pantsColor: 0x1f2937,
      hairColor: 0x4b5563
    });
    curieGroup.group.position.set(28, 0, 24);
    this.group.add(curieGroup.group);

    this.figures.push({
      id: 'marie_curie',
      name: 'Marie Curie',
      title: 'Doble Premio Nobel de Física y Química',
      era: 'Polonia / Francia (1867 - 1934)',
      badge: '⚗️',
      puzzleId: 'puzzle_curie_elements',
      position: new THREE.Vector3(28, 0, 24),
      mesh: curieGroup.group,
      head: curieGroup.head,
      dialogue: [
        'En la vida no hay cosas que temer, solo cosas que comprender.',
        'Aislé el polonio y el radio tras años de perseverancia en un humilde laboratorio de París.',
        'La ciencia es profundamente desinteresada y pertenece a toda la humanidad.',
        '¿Te atreves a clasificar los elementos de la tabla periódica y aislar el isótopo correcto?'
      ],
      puzzleAction: () => this.puzzleEngine.launchCajalSynapse()
    });
  }

  private buildFigureModel(config: {
    skinColor: number;
    coatColor: number;
    pantsColor: number;
    hairColor: number;
    hasMustache?: boolean;
    hasRuff?: boolean;
    hasTogaTrim?: boolean;
  }): { group: THREE.Group; head: THREE.Group } {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: config.skinColor, roughness: 0.6 });
    const coatMat = new THREE.MeshStandardMaterial({ color: config.coatColor, roughness: 0.8 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: config.pantsColor, roughness: 0.85 });
    const hairMat = new THREE.MeshStandardMaterial({ color: config.hairColor, roughness: 0.9 });

    const head = new THREE.Group();
    head.position.set(0, 1.45, 0);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.4, 0.36), skinMat);
    head.add(headMesh);

    const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.4), hairMat);
    hairMesh.position.set(0, 0.16, -0.01);
    head.add(hairMesh);

    // Ojos
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), eyeMat);
    leftEye.position.set(-0.08, 0.03, 0.18);
    head.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), eyeMat);
    rightEye.position.set(0.08, 0.03, 0.18);
    head.add(rightEye);

    if (config.hasMustache) {
      const mustacheMat = new THREE.MeshStandardMaterial({ color: config.hairColor, roughness: 0.9 });
      const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.06), mustacheMat);
      mustache.position.set(0, -0.08, 0.18);
      head.add(mustache);
    }

    if (config.hasRuff) {
      const ruffMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
      const ruff = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.1, 16), ruffMat);
      ruff.position.set(0, -0.22, 0);
      head.add(ruff);
    }

    group.add(head);

    // Torso
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.72, 0.34), coatMat);
    torsoMesh.position.set(0, 0.96, 0);
    torsoMesh.castShadow = true;
    group.add(torsoMesh);

    if (config.hasTogaTrim) {
      const trimMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.73, 0.36), trimMat);
      trim.position.set(0.12, 0.96, 0);
      group.add(trim);
    }

    // Piernas
    const legGeo = new THREE.BoxGeometry(0.24, 0.6, 0.26);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.16, 0.3, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.16, 0.3, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    group.traverse((c) => {
      if (c instanceof THREE.Mesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    return { group, head };
  }

  public update(_delta: number, playerPos: THREE.Vector3): HistoricalFigure | null {
    const t = performance.now() * 0.002;
    let closest: HistoricalFigure | null = null;
    let minDist = 3.2;

    this.figures.forEach((fig) => {
      fig.head.rotation.y = Math.sin(t + fig.position.x) * 0.12;

      const dist = playerPos.distanceTo(fig.position);
      if (dist < 6.0) {
        const dir = new THREE.Vector3().subVectors(playerPos, fig.position);
        fig.mesh.rotation.y = Math.atan2(dir.x, dir.z);
      }

      if (dist < minDist) {
        closest = fig;
      }
    });

    this.activeFigure = closest;
    return closest;
  }
}
