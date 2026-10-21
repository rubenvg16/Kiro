import * as THREE from 'three';

export interface SchoolNPC {
  id: string;
  name: string;
  role: string;
  badge: string;
  position: THREE.Vector3;
  mesh: THREE.Group;
  dialogue: string[];
  challengeSubject?: string;
  headGroup: THREE.Group;
}

export class NPCManager {
  public group: THREE.Group;
  public npcs: SchoolNPC[] = [];
  public activeNPC: SchoolNPC | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.createSchoolNPCs();
  }

  private createSchoolNPCs(): void {
    // 1. Don Manuel - Profesor de Matemáticas y Ciencias (con bata blanca)
    const donManuel = this.buildHumanNPC({
      skinColor: 0xfcd34d,
      clothesColor: 0xffffff, // Bata blanca
      pantsColor: 0x334155,
      hairColor: 0x64748b, // Pelo canoso
      hasGlasses: true
    });
    donManuel.group.position.set(-8, 0, -10);
    this.group.add(donManuel.group);

    this.npcs.push({
      id: 'don_manuel',
      name: 'Don Manuel',
      role: 'Profesor de Matemáticas y Ciencias',
      badge: '👨‍🏫',
      position: new THREE.Vector3(-8, 0, -10),
      mesh: donManuel.group,
      headGroup: donManuel.head,
      dialogue: [
        '¡Hola! Recuerda que las matemáticas no son para memorizar, ¡son para razonar y entender el mundo!',
        'Si tienes dudas con las ecuaciones o las fracciones de tu curso, ven a preguntarme cuando quieras.',
        '¿Sabías que la proporción áurea está presente en los caracoles, las galaxias y las obras de arte?'
      ],
      challengeSubject: 'Matemáticas'
    });

    // 2. Doña Carmen - Profesora de Lengua y Literatura
    const donaCarmen = this.buildHumanNPC({
      skinColor: 0xf5cda6,
      clothesColor: 0xbe123c, // Chaqueta granate
      pantsColor: 0x1e293b,
      hairColor: 0x451a03,
      hasGlasses: true
    });
    donaCarmen.group.position.set(10, 0, -8);
    this.group.add(donaCarmen.group);

    this.npcs.push({
      id: 'dona_carmen',
      name: 'Doña Carmen',
      role: 'Profesora de Lengua y Literatura',
      badge: '👩‍🏫',
      position: new THREE.Vector3(10, 0, -8),
      mesh: donaCarmen.group,
      headGroup: donaCarmen.head,
      dialogue: [
        '¡Buenos días! Leer un buen libro es la mejor forma de viajar sin moverte del sitio.',
        'Cuida siempre la acentuación y los signos de puntuación; dan claridad y elegancia a lo que piensas.',
        'Estamos preparando el certamen literario del instituto. ¡Anímate a escribir un microrrelato!'
      ],
      challengeSubject: 'Lengua'
    });

    // 3. Paco - El Conserje del Instituto (con chaleco azul de trabajo)
    const paco = this.buildHumanNPC({
      skinColor: 0xd4a373,
      clothesColor: 0x0284c7, // Chaleco azul
      pantsColor: 0x1f2937,
      hairColor: 0x1e293b,
      hasCap: true
    });
    paco.group.position.set(3.5, 0, -12);
    this.group.add(paco.group);

    this.npcs.push({
      id: 'paco_conserje',
      name: 'Paco',
      role: 'Conserje del I.E.S.',
      badge: '🔑',
      position: new THREE.Vector3(3.5, 0, -12),
      mesh: paco.group,
      headGroup: paco.head,
      dialogue: [
        '¡A ver esos pasillos, que no se corre que os podéis resbalar!',
        'Si se te ha olvidado la chaqueta o el estuche en algún aula, avísame que tengo las llaves maestras.',
        'Acordaos de tirar los envases del bocadillo a la papelera amarilla del patio, que hay que cuidar el centro.'
      ]
    });

    // 4. Marcos - Compañero de clase en la pista de fútbol
    const marcos = this.buildHumanNPC({
      skinColor: 0xfcd34d,
      clothesColor: 0x16a34a, // Camiseta deportiva verde
      pantsColor: 0x0f172a,
      hairColor: 0xb45309
    });
    marcos.group.position.set(-6, 0, 7);
    this.group.add(marcos.group);

    // Balón de fútbol low-poly junto a Marcos
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const ball = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 1), ballMat);
    ball.position.set(-5.6, 0.22, 7.3);
    this.group.add(ball);

    this.npcs.push({
      id: 'marcos_alumno',
      name: 'Marcos',
      role: 'Compañero de 2º ESO',
      badge: '⚽',
      position: new THREE.Vector3(-6, 0, 7),
      mesh: marcos.group,
      headGroup: marcos.head,
      dialogue: [
        '¡Pásala! ¡Nos quedan 10 minutos de recreo antes de que toque el timbre!',
        '¿Has hecho el reto voluntario de mates? Yo lo completé ayer y me dieron monedas para comprar la mochila.',
        '¡En cuanto suene el timbre vamos juntos a la clase de Tecnología!'
      ]
    });
  }

  private buildHumanNPC(config: {
    skinColor: number;
    clothesColor: number;
    pantsColor: number;
    hairColor: number;
    hasGlasses?: boolean;
    hasCap?: boolean;
  }): { group: THREE.Group; head: THREE.Group } {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: config.skinColor, roughness: 0.6 });
    const clothesMat = new THREE.MeshStandardMaterial({ color: config.clothesColor, roughness: 0.8 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: config.pantsColor, roughness: 0.85 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
    const hairMat = new THREE.MeshStandardMaterial({ color: config.hairColor, roughness: 0.9 });

    // Cabeza
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

    if (config.hasGlasses) {
      const glassesMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.03), glassesMat);
      frame.position.set(0, 0.02, 0.2);
      head.add(frame);
    }

    if (config.hasCap) {
      const capMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.42), capMat);
      cap.position.set(0, 0.2, 0);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.03, 0.2), capMat);
      visor.position.set(0, 0.15, 0.24);
      head.add(cap, visor);
    }

    group.add(head);

    // Cuerpo
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.55, 0.26), clothesMat);
    body.position.set(0, 1.0, 0);
    group.add(body);

    // Brazos
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), clothesMat);
    armL.position.set(-0.31, 0.95, 0);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), clothesMat);
    armR.position.set(0.31, 0.95, 0);
    group.add(armL, armR);

    // Piernas
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.52, 0.19), pantsMat);
    legL.position.set(-0.12, 0.48, 0);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.52, 0.19), pantsMat);
    legR.position.set(0.12, 0.48, 0);
    group.add(legL, legR);

    // Zapatos
    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.24), shoeMat);
    shoeL.position.set(-0.12, 0.09, 0.03);
    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.24), shoeMat);
    shoeR.position.set(0.12, 0.09, 0.03);
    group.add(shoeL, shoeR);

    // Sombras
    group.traverse((c) => {
      if (c instanceof THREE.Mesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    return { group, head };
  }

  public update(_delta: number, playerPos: THREE.Vector3): SchoolNPC | null {
    const t = performance.now() * 0.002;
    let closest: SchoolNPC | null = null;
    let minDist = 3.2; // Radio de interacción

    this.npcs.forEach((npc) => {
      // Sutil animación idle de balanceo y respiración
      npc.headGroup.rotation.y = Math.sin(t + npc.position.x) * 0.15;
      npc.headGroup.position.y = 1.45 + Math.sin(t * 1.5 + npc.position.z) * 0.01;

      // Mirar sutilmente hacia el jugador si está cerca
      const dist = playerPos.distanceTo(npc.position);
      if (dist < 6.0) {
        const dir = new THREE.Vector3().subVectors(playerPos, npc.position);
        npc.mesh.rotation.y = Math.atan2(dir.x, dir.z);
      }

      if (dist < minDist) {
        closest = npc;
      }
    });

    this.activeNPC = closest;
    return closest;
  }
}
