import * as THREE from 'three';
import { ProgressionManager } from '../gamification/ProgressionManager';

interface CollectibleItem {
  id: string;
  type: 'book' | 'gem';
  mesh: THREE.Group;
  baseY: number;
  initialPos: THREE.Vector3;
  collected: boolean;
  respawnTime?: number;
}

export class CollectiblesManager {
  public group: THREE.Group;
  private items: CollectibleItem[] = [];
  private progression: ProgressionManager;

  constructor() {
    this.group = new THREE.Group();
    this.progression = ProgressionManager.getInstance();
    this.spawnCollectibles();
  }

  private spawnCollectibles(): void {
    const locations: Array<{ pos: [number, number], type: 'book' | 'gem' }> = [
      { pos: [-4, -8], type: 'book' },
      { pos: [4, -8], type: 'book' },
      { pos: [-8, 0], type: 'gem' },
      { pos: [8, 0], type: 'gem' },
      { pos: [0, 8], type: 'book' },
      { pos: [-14, -10], type: 'gem' },
      { pos: [14, -10], type: 'book' },
      { pos: [0, -4], type: 'gem' }
    ];

    locations.forEach((loc, index) => {
      const itemGroup = new THREE.Group();
      itemGroup.position.set(loc.pos[0], 0.8, loc.pos[1]);

      if (loc.type === 'book') {
        // Modelo 3D de libro low-poly flotante
        const coverMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
        const pagesMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });

        const cover = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.65), coverMat);
        const pages = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.6), pagesMat);
        pages.position.x = 0.01;
        itemGroup.add(cover, pages);
      } else {
        // Modelo 3D de gema octogonal de sabiduría
        const gemMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          roughness: 0.2,
          metalness: 0.8,
          emissive: 0x059669,
          emissiveIntensity: 0.4
        });
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), gemMat);
        itemGroup.add(gem);
      }

      this.group.add(itemGroup);
      this.items.push({
        id: `item_${index}`,
        type: loc.type,
        mesh: itemGroup,
        baseY: 0.8,
        initialPos: itemGroup.position.clone(),
        collected: false
      });
    });
  }

  public update(delta: number, playerPos: THREE.Vector3): void {
    const time = performance.now() * 0.003;

    this.items.forEach((item) => {
      if (item.collected) {
        // Respawn automático tras 30 segundos
        if (item.respawnTime && Date.now() > item.respawnTime) {
          item.collected = false;
          item.mesh.visible = true;
          item.mesh.scale.set(1, 1, 1);
        }
        return;
      }

      // Animación de rotación y flotación
      item.mesh.rotation.y += delta * 2.2;
      item.mesh.position.y = item.baseY + Math.sin(time + item.initialPos.x) * 0.15;

      // Detección de colisión / recogida por el alumno
      const dist = playerPos.distanceTo(item.mesh.position);
      if (dist < 1.1) {
        this.collectItem(item);
      }
    });
  }

  private collectItem(item: CollectibleItem): void {
    item.collected = true;
    item.mesh.visible = false;
    item.respawnTime = Date.now() + 30000; // Vuelve a aparecer en 30s

    if (item.type === 'book') {
      this.progression.addXP(25);
      this.progression.addCoins(10);
      this.showToast('📖 ¡Cuaderno escolar recogido! +25 Puntos / +10 🪙');
    } else {
      this.progression.addXP(40);
      this.progression.addCoins(20);
      this.showToast('💎 ¡Gema de Mérito conseguida! +40 Puntos / +20 🪙');
    }
  }

  private showToast(msg: string): void {
    const toast = document.createElement('div');
    toast.className = 'pickup-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 2200);
  }
}
