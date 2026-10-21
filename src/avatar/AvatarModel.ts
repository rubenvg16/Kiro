import * as THREE from 'three';

export interface AvatarConfig {
  skinColor: string;
  shirtColor: string;
  pantsColor: string;
  accessory: 'none' | 'glasses' | 'cap' | 'backpack';
}

export class AvatarModel {
  public group: THREE.Group;
  
  // Materiales dinámicos
  private skinMaterial: THREE.MeshStandardMaterial;
  private shirtMaterial: THREE.MeshStandardMaterial;
  private pantsMaterial: THREE.MeshStandardMaterial;
  private shoeMaterial: THREE.MeshStandardMaterial;
  private hairMaterial: THREE.MeshStandardMaterial;

  // Accesorios
  private glassesGroup: THREE.Group;
  private capGroup: THREE.Group;
  private backpackGroup: THREE.Group;

  // Piezas para animación
  private chestMesh!: THREE.Mesh;
  private headGroup!: THREE.Group;
  private leftArm!: THREE.Mesh;
  private rightArm!: THREE.Mesh;
  private leftHand!: THREE.Mesh;
  private rightHand!: THREE.Mesh;
  private leftLegGroup!: THREE.Group;
  private rightLegGroup!: THREE.Group;

  private walkTime: number = 0;

  constructor(initialConfig: AvatarConfig) {
    this.group = new THREE.Group();

    // 1. Materiales base
    this.skinMaterial = new THREE.MeshStandardMaterial({
      color: initialConfig.skinColor,
      roughness: 0.6,
      metalness: 0.05
    });

    this.shirtMaterial = new THREE.MeshStandardMaterial({
      color: initialConfig.shirtColor,
      roughness: 0.8
    });

    this.pantsMaterial = new THREE.MeshStandardMaterial({
      color: initialConfig.pantsColor,
      roughness: 0.85
    });

    this.shoeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.7
    });

    this.hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x271911,
      roughness: 0.9
    });

    this.glassesGroup = new THREE.Group();
    this.capGroup = new THREE.Group();
    this.backpackGroup = new THREE.Group();

    this.buildBody();
    this.buildHead();
    this.buildAccessories();

    this.setAccessory(initialConfig.accessory);

    // Activar sombras en todas las mallas
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  private buildHead(): void {
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.45, 0);

    // Cabeza estilizada low-poly
    const headGeo = new THREE.BoxGeometry(0.38, 0.42, 0.38);
    const headMesh = new THREE.Mesh(headGeo, this.skinMaterial);
    this.headGroup.add(headMesh);

    // Pelo
    const hairGeo = new THREE.BoxGeometry(0.42, 0.22, 0.42);
    const hairMesh = new THREE.Mesh(hairGeo, this.hairMaterial);
    hairMesh.position.set(0, 0.16, -0.01);
    this.headGroup.add(hairMesh);

    // Flequillo
    const bangsGeo = new THREE.BoxGeometry(0.38, 0.1, 0.1);
    const bangsMesh = new THREE.Mesh(bangsGeo, this.hairMaterial);
    bangsMesh.position.set(0, 0.15, 0.18);
    this.headGroup.add(bangsMesh);

    // Ojos
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.02);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 0.02, 0.195);
    this.headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 0.02, 0.195);
    this.headGroup.add(rightEye);

    // Nariz
    const noseGeo = new THREE.BoxGeometry(0.04, 0.06, 0.05);
    const noseMesh = new THREE.Mesh(noseGeo, this.skinMaterial);
    noseMesh.position.set(0, -0.04, 0.2);
    this.headGroup.add(noseMesh);

    this.group.add(this.headGroup);
  }

  private buildBody(): void {
    // Torso / Remera
    const chestGeo = new THREE.BoxGeometry(0.48, 0.55, 0.28);
    this.chestMesh = new THREE.Mesh(chestGeo, this.shirtMaterial);
    this.chestMesh.position.set(0, 1.0, 0);
    this.group.add(this.chestMesh);

    // Brazos con pivote en los hombros
    const armGeo = new THREE.BoxGeometry(0.13, 0.45, 0.13);
    
    this.leftArm = new THREE.Mesh(armGeo, this.shirtMaterial);
    this.leftArm.position.set(-0.33, 0.95, 0);
    this.group.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, this.shirtMaterial);
    this.rightArm.position.set(0.33, 0.95, 0);
    this.group.add(this.rightArm);

    // Manos
    const handGeo = new THREE.BoxGeometry(0.11, 0.12, 0.11);
    this.leftHand = new THREE.Mesh(handGeo, this.skinMaterial);
    this.leftHand.position.set(-0.33, 0.67, 0);
    this.group.add(this.leftHand);

    this.rightHand = new THREE.Mesh(handGeo, this.skinMaterial);
    this.rightHand.position.set(0.33, 0.67, 0);
    this.group.add(this.rightHand);

    // Piernas estructuradas en grupos para rotación limpia desde la cadera
    const legGeo = new THREE.BoxGeometry(0.18, 0.52, 0.2);
    const shoeGeo = new THREE.BoxGeometry(0.19, 0.12, 0.26);

    // Pierna Izquierda
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.13, 0.72, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, this.pantsMaterial);
    leftLegMesh.position.set(0, -0.24, 0);
    const leftShoe = new THREE.Mesh(shoeGeo, this.shoeMaterial);
    leftShoe.position.set(0, -0.44, 0.03);
    this.leftLegGroup.add(leftLegMesh, leftShoe);
    this.group.add(this.leftLegGroup);

    // Pierna Derecha
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.13, 0.72, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, this.pantsMaterial);
    rightLegMesh.position.set(0, -0.24, 0);
    const rightShoe = new THREE.Mesh(shoeGeo, this.shoeMaterial);
    rightShoe.position.set(0, -0.44, 0.03);
    this.rightLegGroup.add(rightLegMesh, rightShoe);
    this.group.add(this.rightLegGroup);
  }

  private buildAccessories(): void {
    // 1. Lentes
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.5, roughness: 0.1 });

    const leftRim = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.03), frameMat);
    leftRim.position.set(-0.1, 0.02, 0.21);
    const rightRim = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.03), frameMat);
    rightRim.position.set(0.1, 0.02, 0.21);

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), frameMat);
    bridge.position.set(0, 0.02, 0.21);

    const leftLens = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.01), lensMat);
    leftLens.position.set(-0.1, 0.02, 0.22);
    const rightLens = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.01), lensMat);
    rightLens.position.set(0.1, 0.02, 0.22);

    this.glassesGroup.add(leftRim, rightRim, bridge, leftLens, rightLens);
    this.headGroup.add(this.glassesGroup);

    // 2. Gorra escolar
    const capMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.7 });
    const capTop = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.44), capMat);
    capTop.position.set(0, 0.22, 0);

    const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.22), capMat);
    capVisor.position.set(0, 0.17, 0.26);

    this.capGroup.add(capTop, capVisor);
    this.headGroup.add(this.capGroup);

    // 3. Mochila escolar en la espalda
    const backpackMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.6 });
    const pocketMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.7 });

    const mainBag = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.18), backpackMat);
    mainBag.position.set(0, 0.98, -0.22);

    const frontPocket = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.08), pocketMat);
    frontPocket.position.set(0, 0.92, -0.32);

    this.backpackGroup.add(mainBag, frontPocket);
    this.group.add(this.backpackGroup);
  }

  public setSkinColor(colorHex: string): void {
    this.skinMaterial.color.set(colorHex);
  }

  public setShirtColor(colorHex: string): void {
    this.shirtMaterial.color.set(colorHex);
  }

  public setPantsColor(colorHex: string): void {
    this.pantsMaterial.color.set(colorHex);
  }

  public setAccessory(accessory: 'none' | 'glasses' | 'cap' | 'backpack'): void {
    this.glassesGroup.visible = accessory === 'glasses';
    this.capGroup.visible = accessory === 'cap';
    this.backpackGroup.visible = accessory === 'backpack';
  }

  /**
   * Actualiza las animaciones de idle, caminata, carrera y salto
   */
  public updateAnimation(delta: number, isMoving: boolean, isGrounded: boolean = true, isSprinting: boolean = false): void {
    if (!isGrounded) {
      // Pose de salto en el aire
      this.leftArm.rotation.x = -1.2;
      this.rightArm.rotation.x = -1.2;
      this.leftLegGroup.rotation.x = 0.4;
      this.rightLegGroup.rotation.x = -0.3;
      return;
    }

    if (isMoving) {
      const speedMultiplier = isSprinting ? 14.0 : 9.0;
      this.walkTime += delta * speedMultiplier;
      const swing = Math.sin(this.walkTime);

      // Movimiento coordinado de piernas (adelante y atrás)
      const legAmplitude = isSprinting ? 0.95 : 0.7;
      this.leftLegGroup.rotation.x = swing * legAmplitude;
      this.rightLegGroup.rotation.x = -swing * legAmplitude;

      // Movimiento contrariado de brazos (paso natural)
      const armAmplitude = isSprinting ? 0.85 : 0.6;
      this.leftArm.rotation.x = -swing * armAmplitude;
      this.leftHand.position.z = Math.sin(this.leftArm.rotation.x) * 0.25;
      this.rightArm.rotation.x = swing * armAmplitude;
      this.rightHand.position.z = Math.sin(this.rightArm.rotation.x) * 0.25;

      // Bobbing vertical al caminar/correr
      this.group.position.y = Math.abs(Math.sin(this.walkTime)) * (isSprinting ? 0.12 : 0.08);
      this.headGroup.rotation.y = Math.sin(this.walkTime * 0.5) * 0.05;
    } else {
      // Regreso suave a reposo e idle breathing
      this.leftLegGroup.rotation.x *= 0.85;
      this.rightLegGroup.rotation.x *= 0.85;
      this.leftArm.rotation.x *= 0.85;
      this.rightArm.rotation.x *= 0.85;
      this.leftHand.position.z *= 0.85;
      this.rightHand.position.z *= 0.85;
      this.group.position.y *= 0.85;

      const t = performance.now() * 0.0025;
      if (this.chestMesh && this.headGroup) {
        this.chestMesh.scale.y = 1 + Math.sin(t) * 0.02;
        this.chestMesh.scale.x = 1 + Math.sin(t) * 0.015;
        this.headGroup.position.y = 1.45 + Math.sin(t) * 0.01;
      }
    }
  }
}
