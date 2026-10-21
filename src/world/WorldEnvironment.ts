import * as THREE from 'three';
import {
  CRATE_SIZE,
  CRATE_STACK_POSITIONS,
  GOLD_PODIUM_POSITION,
  GOLD_PODIUM_SIZE
} from './WorldColliders';

export interface PointOfInterest {
  id: string;
  name: string;
  description: string;
  badge: string;
  position: THREE.Vector3;
  radius: number;
}

export class WorldEnvironment {
  public group: THREE.Group;
  public pois: PointOfInterest[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.buildSchoolGround();
    this.buildIESBuilding();
    this.buildSportsCourt();
    this.buildCafeteriaAndGarden();
    this.buildSchoolyardProps();
    this.setupProps();
    this.setupPOIs();

    // Sombras en todo el colegio
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  private buildSchoolGround(): void {
    // Suelo general del instituto (cemento pulido)
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x8a939e,
      roughness: 0.88,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Zonas de huerto y arbolado
    const gravelMat = new THREE.MeshStandardMaterial({ color: 0x5a6356, roughness: 0.95 });
    const gardenLeft = new THREE.Mesh(new THREE.PlaneGeometry(16, 76), gravelMat);
    gardenLeft.rotation.x = -Math.PI / 2;
    gardenLeft.position.set(-30, 0.01, 0);
    this.group.add(gardenLeft);

    const gardenRight = new THREE.Mesh(new THREE.PlaneGeometry(8, 76), gravelMat);
    gardenRight.rotation.x = -Math.PI / 2;
    gardenRight.position.set(34, 0.01, 0);
    this.group.add(gardenRight);
  }

  private buildIESBuilding(): void {
    // Edificio Central del IES (Norte, Z = -18)
    const iesGroup = new THREE.Group();
    iesGroup.position.set(0, 0, -18);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });

    const buildingBody = new THREE.Mesh(new THREE.BoxGeometry(28, 9, 12), wallMat);
    buildingBody.position.y = 4.5;
    iesGroup.add(buildingBody);

    const baseZocalo = new THREE.Mesh(new THREE.BoxGeometry(28.4, 0.8, 12.4), trimMat);
    baseZocalo.position.y = 0.4;
    iesGroup.add(baseZocalo);

    const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(28.6, 0.7, 12.6), trimMat);
    roofTrim.position.y = 9.35;
    iesGroup.add(roofTrim);

    const signMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 0.3), signMat);
    sign.position.set(0, 5.8, 6.2);
    iesGroup.add(sign);

    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(7, 0.4, 4), canopyMat);
    canopy.position.set(0, 4.4, 7.8);
    iesGroup.add(canopy);

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
    const pillarLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4.4, 12), pillarMat);
    pillarLeft.position.set(-3.2, 2.2, 9.5);
    const pillarRight = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4.4, 12), pillarMat);
    pillarRight.position.set(3.2, 2.2, 9.5);
    iesGroup.add(pillarLeft, pillarRight);

    const doorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.2, 0.2), doorMat);
    door.position.set(0, 1.6, 6.1);
    iesGroup.add(door);

    const windowMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.2, metalness: 0.3 });
    const windowPositions = [-10, -6, 6, 10];
    windowPositions.forEach((x) => {
      const winBottom = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 0.2), windowMat);
      winBottom.position.set(x, 2.8, 6.05);
      const winTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 0.2), windowMat);
      winTop.position.set(x, 6.8, 6.05);
      iesGroup.add(winBottom, winTop);
    });

    this.group.add(iesGroup);
  }

  private buildSportsCourt(): void {
    const courtGroup = new THREE.Group();
    courtGroup.position.set(-6, 0.01, 10);

    const courtFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 26),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.8 })
    );
    courtFloor.rotation.x = -Math.PI / 2;
    courtFloor.receiveShadow = true;
    courtGroup.add(courtFloor);

    const borderFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 28),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.85 })
    );
    borderFloor.rotation.x = -Math.PI / 2;
    borderFloor.position.y = -0.005;
    courtGroup.add(borderFloor);

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(15.6, 0.2), lineMat);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = 0.01;
    courtGroup.add(centerLine);

    const centerCircle = new THREE.Mesh(new THREE.RingGeometry(2.8, 3.0, 32), lineMat);
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.y = 0.01;
    courtGroup.add(centerCircle);

    const goalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const goalNorth = this.createGoal(goalMat);
    goalNorth.position.set(0, 0, -12.5);
    courtGroup.add(goalNorth);

    const goalSouth = this.createGoal(goalMat);
    goalSouth.position.set(0, 0, 12.5);
    goalSouth.rotation.y = Math.PI;
    courtGroup.add(goalSouth);

    this.group.add(courtGroup);

    // Gimnasio escolar
    const gymGroup = new THREE.Group();
    gymGroup.position.set(20, 0, 8);

    const gymBody = new THREE.Mesh(
      new THREE.BoxGeometry(14, 7, 22),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 })
    );
    gymBody.position.y = 3.5;
    gymGroup.add(gymBody);

    const gymRoof = new THREE.Mesh(
      new THREE.BoxGeometry(15, 1.2, 23),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    gymRoof.position.y = 7.6;
    gymGroup.add(gymRoof);

    this.group.add(gymGroup);
  }

  private buildCafeteriaAndGarden(): void {
    // 1. Cantina / Cafetería escolar (Oeste, X = -20, Z = -16)
    const cantinaGroup = new THREE.Group();
    cantinaGroup.position.set(-20, 0, -16);

    const cantinaBody = new THREE.Mesh(
      new THREE.BoxGeometry(8, 4.5, 7),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 })
    );
    cantinaBody.position.y = 2.25;
    cantinaGroup.add(cantinaBody);

    // Toldo de rayas de la cantina
    const awningMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
    const awning = new THREE.Mesh(new THREE.BoxGeometry(7, 0.2, 2), awningMat);
    awning.position.set(0, 3.2, 4.2);
    awning.rotation.x = 0.2;
    cantinaGroup.add(awning);

    this.group.add(cantinaGroup);

    // 2. Huerto Escolar y Zona de Biodiversidad (Oeste, X = -28, Z = 6)
    const gardenGroup = new THREE.Group();
    gardenGroup.position.set(-26, 0, 6);

    const earthMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    for (let i = -2; i <= 2; i++) {
      const row = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 1.2), earthMat);
      row.position.set(0, 0.1, i * 2);
      gardenGroup.add(row);

      // Pequeñas plantas low-poly
      const plantMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
      for (let j = -2; j <= 2; j++) {
        const plant = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 5), plantMat);
        plant.position.set(j * 1.2, 0.35, i * 2);
        gardenGroup.add(plant);
      }
    }

    this.group.add(gardenGroup);

    // 3. Aparcabicicletas escolar (X = 8, Z = -10)
    const bikeRackMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    for (let i = 0; i < 4; i++) {
      const rack = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.04, 8, 16, Math.PI), bikeRackMat);
      rack.position.set(6.5 + i * 0.9, 0.4, -10);
      this.group.add(rack);
    }
  }

  private createGoal(mat: THREE.Material): THREE.Group {
    const goal = new THREE.Group();
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2, 8), mat);
    p1.position.set(-1.8, 1, 0);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2, 8), mat);
    p2.position.set(1.8, 1, 0);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.6, 8), mat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 2, 0);
    goal.add(p1, p2, bar);
    return goal;
  }

  private buildSchoolyardProps(): void {
    // Fuente de patio
    const fountainGroup = new THREE.Group();
    fountainGroup.position.set(6, 0, -2);
    const fMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.6 });
    const fBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.0, 12), fMat);
    fBase.position.y = 0.5;
    const fBasin = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.3, 0.3, 12), fMat);
    fBasin.position.y = 1.0;
    fountainGroup.add(fBase, fBasin);
    this.group.add(fountainGroup);

    // Papeleras de reciclaje del patio
    const binYellow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.2, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0xeab308 })
    );
    binYellow.position.set(8.5, 0.4, -2);
    const binBlue = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.2, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x2563eb })
    );
    binBlue.position.set(9.2, 0.4, -2);
    this.group.add(binYellow, binBlue);

    // Bancos de madera
    const benchPositions = [
      [7, -1, 0], [7, 3, 0],
      [-17, -1, Math.PI / 2], [-17, 4, Math.PI / 2],
      [-14, -14, 0]
    ];
    const benchWood = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
    benchPositions.forEach(([x, z, rot]) => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 0.55), benchWood);
      bench.position.set(x, 0.22, z);
      bench.rotation.y = rot;
      this.group.add(bench);
    });

    // Árboles
    const plataneros = [
      [-26, -10], [-26, 0], [-26, 12],
      [-32, -6], [-32, 6],
      [32, -8], [32, 2], [32, 14],
      [-14, 20], [14, 20]
    ];
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.9 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

    plataneros.forEach(([x, z]) => {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.4, 8), trunkMat);
      trunk.position.y = 1.2;
      tree.add(trunk);

      const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 0), leavesMat);
      leaves.position.y = 3.6;
      tree.add(leaves);

      this.group.add(tree);
    });
  }

  /**
   * Props escalables del patio: cajas de madera y podio dorado.
   * Las transformaciones se importan de `WorldColliders.ts` para que la malla
   * y su colisionador no puedan separarse nunca.
   */
  private setupProps(): void {
    // Cajas de madera apiladas junto al porche del IES
    CRATE_STACK_POSITIONS.forEach((pos) => {
      const crate = this.createCrate();
      crate.position.set(pos[0], pos[1], pos[2]);
      crate.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.group.add(crate);
    });

    // Podio dorado junto a la portería de fútbol sala
    const podium = this.createGoldPodium();
    podium.position.set(
      GOLD_PODIUM_POSITION[0],
      GOLD_PODIUM_POSITION[1],
      GOLD_PODIUM_POSITION[2]
    );
    podium.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.group.add(podium);
  }

  /**
   * Caja de madera low-poly: cuerpo de madera, listones y escuadras metálicas.
   * El tamaño exterior es exactamente `CRATE_SIZE` en los tres ejes.
   */
  private createCrate(): THREE.Group {
    const crate = new THREE.Group();

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.85 });
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
    const bracketMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.85,
      roughness: 0.35
    });

    // Cuerpo interior (deja los listones y las escuadras por fuera)
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(CRATE_SIZE * 0.92, CRATE_SIZE * 0.92, CRATE_SIZE * 0.92),
      woodMat
    );
    crate.add(body);

    // Listones horizontales: el superior cierra exactamente en +CRATE_SIZE / 2
    const plankOffsets = [-0.4, 0, 0.4];
    plankOffsets.forEach((offsetY) => {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(CRATE_SIZE, 0.1, CRATE_SIZE),
        plankMat
      );
      plank.position.y = offsetY;
      crate.add(plank);
    });

    // Escuadras metálicas en las cuatro esquinas
    const corners: Array<[number, number]> = [
      [-1, -1], [1, -1], [-1, 1], [1, 1]
    ];
    corners.forEach(([sx, sz]) => {
      const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, CRATE_SIZE, 0.1),
        bracketMat
      );
      bracket.position.set(
        sx * (CRATE_SIZE / 2 - 0.05),
        0,
        sz * (CRATE_SIZE / 2 - 0.05)
      );
      crate.add(bracket);
    });

    return crate;
  }

  /**
   * Podio dorado de 1.2 m con la placa "1" en la cara frontal.
   */
  private createGoldPodium(): THREE.Group {
    const podium = new THREE.Group();

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.75,
      roughness: 0.25,
      emissive: 0x78350f,
      emissiveIntensity: 0.35
    });

    const block = new THREE.Mesh(
      new THREE.BoxGeometry(GOLD_PODIUM_SIZE, GOLD_PODIUM_SIZE, GOLD_PODIUM_SIZE),
      goldMat
    );
    podium.add(block);

    // Placa con el número "1" dibujado en un canvas (sin recursos externos)
    const plateCanvas = document.createElement('canvas');
    plateCanvas.width = 128;
    plateCanvas.height = 128;
    const ctx = plateCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 104px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('1', 64, 70);
    }

    const plateTexture = new THREE.CanvasTexture(plateCanvas);
    plateTexture.colorSpace = THREE.SRGBColorSpace;

    const plateMat = new THREE.MeshStandardMaterial({
      map: plateTexture,
      metalness: 0.5,
      roughness: 0.3,
      emissive: 0x78350f,
      emissiveIntensity: 0.25,
      // Desplazamiento de polígono para que la placa no pelee con la cara del bloque
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), plateMat);
    plate.position.set(0, 0, GOLD_PODIUM_SIZE / 2);
    podium.add(plate);

    return podium;
  }

  private setupPOIs(): void {
    this.pois = [
      {
        id: 'conserjeria',
        name: 'Conserjería y Jefatura de Estudios',
        badge: '🏛️',
        description: 'Circulares del IES, partes de faltas y avisos oficiales.',
        position: new THREE.Vector3(0, 0, -11.0),
        radius: 3.5
      },
      {
        id: 'pista',
        name: 'Pista Polideportiva del Recreo',
        badge: '⚽',
        description: 'Retos de Educación Física, torneos del recreo y tiros a portería.',
        position: new THREE.Vector3(-6, 0, 16),
        radius: 4.0
      },
      {
        id: 'aula_informatica',
        name: 'Aula de Informática y Biblioteca',
        badge: '💻',
        description: 'Cuestionarios oficiales adaptados a tu curso escolar.',
        position: new THREE.Vector3(11.8, 0, 8),
        radius: 3.5
      },
      {
        id: 'cantina',
        name: 'Cantina Escolar del Recreo',
        badge: '🥪',
        description: 'Bocadillos, zumos y descanso durante el recreo.',
        position: new THREE.Vector3(-15.0, 0, -13.0),
        radius: 3.5
      }
    ];

    this.pois.forEach((poi) => {
      const markerGeo = new THREE.RingGeometry(poi.radius - 0.4, poi.radius, 32);
      const markerMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.rotation.x = -Math.PI / 2;
      marker.position.copy(poi.position);
      marker.position.y = 0.03;
      this.group.add(marker);
    });
  }
}
