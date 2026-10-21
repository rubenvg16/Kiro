import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type AppMode = 'customizer' | 'world' | 'levels';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  public currentMode: AppMode = 'customizer';

  private container: HTMLElement;
  private floorGroup: THREE.Group;
  private dirLight: THREE.DirectionalLight;
  private onUpdateCallback?: (delta: number) => void;
  private clock: THREE.Clock = new THREE.Clock();

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Escena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x181c2b);
    this.scene.fog = new THREE.Fog(0x181c2b, 20, 75);

    // 2. Cámara
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 150);
    this.camera.position.set(0, 1.3, 3.2);

    // 3. Renderer optimizado para tablets
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Controles orbitales para el customizer
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 1.0, 0);
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 5.0;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1;

    // 5. Iluminación limpia
    this.dirLight = new THREE.DirectionalLight(0xfff3e0, 1.3);
    this.setupLighting();

    // 6. Plataforma de estudio
    this.floorGroup = new THREE.Group();
    this.setupStudioFloor();
    this.scene.add(this.floorGroup);

    // 7. El objetivo de la luz direccional debe estar en la escena para que
    //    su matriz de mundo se actualice cuando se mueve el foco de luz
    this.scene.add(this.dirLight.target);

    // 8. Resize listener
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // 9. Render loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.6);
    hemiLight.position.set(0, 30, 0);
    this.scene.add(hemiLight);

    const dirLight = this.dirLight;
    dirLight.position.set(10, 20, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.6);
    rimLight.position.set(-15, 10, -15);
    this.scene.add(rimLight);
  }

  /**
   * Enfoca la luz direccional sobre un punto del mundo.
   *
   * El frustum de sombras es pequeño (±20 m), así que la luz sólo ilumina
   * bien el entorno que hay alrededor de su objetivo. Sin esto, las arenas de
   * niveles (situadas a 200 m del origen) quedarían sin luz ni sombras.
   *
   * @param target Punto del mundo que debe quedar iluminado.
   */
  public focusLightingOn(target: THREE.Vector3): void {
    this.dirLight.position.set(target.x + 10, target.y + 20, target.z + 15);
    this.dirLight.target.position.copy(target);
    this.dirLight.target.updateMatrixWorld();
  }

  private setupStudioFloor(): void {
    const floorGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.1, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x222a3d,
      roughness: 0.8,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.05;
    floor.receiveShadow = true;
    this.floorGroup.add(floor);

    const ringGeo = new THREE.RingGeometry(1.62, 1.7, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.001;
    this.floorGroup.add(ring);
  }

  public setMode(mode: AppMode): void {
    this.currentMode = mode;

    if (mode === 'customizer') {
      this.controls.enabled = true;
      this.floorGroup.visible = true;
      this.scene.fog = new THREE.Fog(0x181c2b, 20, 75);
      this.scene.background = new THREE.Color(0x181c2b);
      this.camera.position.set(0, 1.3, 3.2);
      this.controls.target.set(0, 1.0, 0);
      // Sincroniza el estado interno de los controles: si no, el amortiguado
      // residual arrastra la cámara y da un salto al volver al customizer
      this.controls.update();
    } else {
      // 'world' y 'levels' comparten escenario exterior: sin suelo de estudio
      // y con cielo celeste escolar
      this.controls.enabled = false;
      this.floorGroup.visible = false;
      this.scene.fog = new THREE.Fog(0x93c5fd, 30, 85);
      this.scene.background = new THREE.Color(0x93c5fd); // Cielo celeste escolar
    }
  }

  public setUpdateCallback(callback: (delta: number) => void): void {
    this.onUpdateCallback = callback;
  }

  private onWindowResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private animate(): void {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.currentMode === 'customizer') {
      this.controls.update();
    }

    if (this.onUpdateCallback) {
      this.onUpdateCallback(delta);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
