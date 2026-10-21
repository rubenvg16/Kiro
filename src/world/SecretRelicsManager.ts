import * as THREE from 'three';
import { ProgressionManager, SECRET_RELICS } from '../gamification/ProgressionManager';

interface Relic3D {
  id: string;
  mesh: THREE.Group;
  initialPos: THREE.Vector3;
}

export class SecretRelicsManager {
  public group: THREE.Group;
  private relics: Relic3D[] = [];
  private progression: ProgressionManager;

  constructor() {
    this.group = new THREE.Group();
    this.progression = ProgressionManager.getInstance();
    this.spawnSecretRelics();
  }

  private spawnSecretRelics(): void {
    const relicSpawns = [
      { id: 'relic_porch_key', pos: new THREE.Vector3(0, 4.8, -10.2), type: 'key' },
      { id: 'relic_golden_ball', pos: new THREE.Vector3(0, 2.3, -2.5), type: 'trophy' },
      { id: 'relic_cajal_microscope', pos: new THREE.Vector3(-26, 0.9, 10), type: 'microscope' },
      { id: 'relic_cervantes_scroll', pos: new THREE.Vector3(-22, 0.9, -18), type: 'scroll' }
    ];

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xd97706,
      emissiveIntensity: 0.35
    });

    relicSpawns.forEach((spawn) => {
      const relicGroup = new THREE.Group();
      relicGroup.position.copy(spawn.pos);

      // Modelos 3D de reliquias doradas
      if (spawn.type === 'key') {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 16), goldMat);
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4), goldMat);
        shaft.position.y = -0.25;
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.04), goldMat);
        tooth.position.set(0.06, -0.4, 0);
        relicGroup.add(ring, shaft, tooth);
      } else if (spawn.type === 'trophy') {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.1, 0.4, 12), goldMat);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2), goldMat);
        stem.position.y = -0.25;
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08), goldMat);
        base.position.y = -0.38;
        relicGroup.add(cup, stem, base);
      } else if (spawn.type === 'microscope') {
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4), goldMat);
        tube.rotation.z = 0.35;
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.1), goldMat);
        arm.position.set(-0.15, -0.1, 0);
        relicGroup.add(tube, arm);
      } else {
        const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 12), goldMat);
        roll.rotation.z = Math.PI / 2;
        relicGroup.add(roll);
      }

      this.group.add(relicGroup);
      this.relics.push({
        id: spawn.id,
        mesh: relicGroup,
        initialPos: spawn.pos.clone()
      });
    });
  }

  public update(delta: number, playerPos: THREE.Vector3): void {
    const t = performance.now() * 0.003;

    this.relics.forEach((r) => {
      // Ocultar si ya ha sido conseguida
      if (this.progression.isRelicUnlocked(r.id)) {
        r.mesh.visible = false;
        return;
      }

      r.mesh.rotation.y += delta * 2.5;
      r.mesh.position.y = r.initialPos.y + Math.sin(t + r.initialPos.x) * 0.12;

      // Detección de colisión / recogida
      const dist = playerPos.distanceTo(r.mesh.position);
      if (dist < 1.3) {
        this.collectRelic(r);
      }
    });
  }

  private collectRelic(r: Relic3D): void {
    const meta = SECRET_RELICS.find(m => m.id === r.id);
    const name = meta ? meta.name : 'Reliquia Secreta';
    
    this.progression.unlockRelic(r.id);
    r.mesh.visible = false;

    this.showRelicCelebration(name);
  }

  private showRelicCelebration(name: string): void {
    const toast = document.createElement('div');
    toast.className = 'pickup-toast relic-toast';
    toast.innerHTML = `🌟 <strong>¡RELIQUIA OCULTA ENCONTRADA!</strong><br>${name} (+150 Puntos / +100 🪙)`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }
}
