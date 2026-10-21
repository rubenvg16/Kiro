import * as THREE from 'three';
import { PuzzleEngine } from '../puzzles/PuzzleEngine';

export interface HistoricalFigure {
  id: string;
  name: string;
  title: string;
  era: string;
  badge: string;
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
      coatColor: 0x1e293b, // Traje formal oscuro de 1900
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
      position: new THREE.Vector3(-22, 0, 6),
      mesh: cajalGroup.group,
      head: cajalGroup.head,
      dialogue: [
        '¡Saludos, joven investigador! Todo hombre puede ser, si se lo propone, escultor de su propio cerebro.',
        'Con paciencia y mi humilde microscopio descubrí que las neuronas no forman una red continua, sino que dialogan entre sí a través de la sinapsis.',
        '¿Aceptas el reto de reconstruir el circuito eléctrico de una neurona para ganar la Medalla Científica?'
      ],
      puzzleAction: () => this.puzzleEngine.launchCajalSynapse()
    });

    // 2. Miguel de Cervantes Saavedra
    const cervantesGroup = this.buildFigureModel({
      skinColor: 0xfcd34d,
      coatColor: 0x7c2d12, // Jubón renacentista
      pantsColor: 0x451a03,
      hairColor: 0x78716c,
      hasRuff: true // Gola blanca renacentista
    });
    cervantesGroup.group.position.set(14, 0, -4);
    this.group.add(cervantesGroup.group);

    this.figures.push({
      id: 'cervantes',
      name: 'Miguel de Cervantes',
      title: 'Príncipe de los Ingenios de la Literatura Española',
      era: 'Siglo de Oro (1547 - 1616)',
      badge: '📜',
      position: new THREE.Vector3(14, 0, -4),
      mesh: cervantesGroup.group,
      head: cervantesGroup.head,
      dialogue: [
        '¡Pardiez, noble hidalgo! Quien lee mucho y anda mucho, ve mucho y sabe mucho.',
        'Dejé escritas las aventuras de don Quijote y Sancho Panza en un lugar de la Mancha de cuyo nombre no quiero acordarme.',
        'He protegido un pasaje secreto con un cifrado de desplazamiento. ¿Serás capaz de descifrarlo?'
      ],
      puzzleAction: () => this.puzzleEngine.launchCervantesCipher()
    });

    // 3. Pitágoras de Samos
    const pythagorasGroup = this.buildFigureModel({
      skinColor: 0xf5cda6,
      coatColor: 0xf8fafc, // Túnica griega blanca
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
      position: new THREE.Vector3(-6, 0, 6),
      mesh: pythagorasGroup.group,
      head: pythagorasGroup.head,
      dialogue: [
        '¡Salve! Los números rigen el cosmos y la armonía del universo.',
        'En los triángulos rectángulos descubrí que el cuadrado de la hipotenusa iguala la suma de los cuadrados de los catetos.',
        'Para entender el álgebra moderna debes dominar el equilibrio. ¿Te atreves con la Balanza Algebraica?'
      ],
      puzzleAction: () => this.puzzleEngine.launchAlgebraBalance()
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
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), eyeMat);
    eyeL.position.set(-0.09, 0.02, 0.185);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), eyeMat);
    eyeR.position.set(0.09, 0.02, 0.185);
    head.add(eyeL, eyeR);

    // Bigote histórico (Cajal)
    if (config.hasMustache) {
      const mustache = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.05, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      mustache.position.set(0, -0.06, 0.2);
      head.add(mustache);
    }

    // Gola renacentista (Cervantes)
    if (config.hasRuff) {
      const ruffMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
      const ruff = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.12, 16), ruffMat);
      ruff.position.set(0, -0.22, 0);
      head.add(ruff);
    }

    group.add(head);

    // Cuerpo
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.58, 0.28), coatMat);
    body.position.set(0, 1.0, 0);
    group.add(body);

    if (config.hasTogaTrim) {
      const goldTrim = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.6, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.3 })
      );
      goldTrim.position.set(0.1, 1.0, 0.01);
      goldTrim.rotation.z = -0.3;
      group.add(goldTrim);
    }

    // Piernas
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.52, 0.2), pantsMat);
    legL.position.set(-0.12, 0.48, 0);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.52, 0.2), pantsMat);
    legR.position.set(0.12, 0.48, 0);
    group.add(legL, legR);

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
