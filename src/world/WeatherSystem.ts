import * as THREE from 'three';
import { EventBus, WeatherState } from '../core/EventBus';

export interface WeatherSnapshot {
  state: WeatherState;
  nextTransitionAt: number;
}

export class WeatherSystem {
  private static instance: WeatherSystem | null = null;
  private state: WeatherState = 'clear';
  private timer = 0;
  private nextTransitionAt = 300; // Min 5 min (Req 12.4)
  private rainParticleSystem: THREE.Points | null = null;

  private constructor() {
    this.scheduleNextTransition();
  }

  public static getInstance(): WeatherSystem {
    if (!WeatherSystem.instance) {
      WeatherSystem.instance = new WeatherSystem();
    }
    return WeatherSystem.instance;
  }

  public static resetInstance(): void {
    WeatherSystem.instance = null;
  }

  public initParticles(scene: THREE.Scene): void {
    if (this.rainParticleSystem) return;

    // 1000 droplets particle system (Req 12.5)
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 60; // within 30 world units
      positions[i + 1] = Math.random() * 25;
      positions[i + 2] = (Math.random() - 0.5) * 60;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.15,
      transparent: true,
      opacity: 0.7
    });

    this.rainParticleSystem = new THREE.Points(geometry, material);
    this.rainParticleSystem.visible = this.state === 'rain';
    scene.add(this.rainParticleSystem);
  }

  public update(delta: number, playerPos?: THREE.Vector3): void {
    if (delta <= 0 || isNaN(delta)) return;
    this.timer += delta;

    if (this.timer >= this.nextTransitionAt) {
      this.timer = 0;
      this.transitionToNextWeather();
    }

    // Animate raindrops falling
    if (this.state === 'rain' && this.rainParticleSystem) {
      const positions = this.rainParticleSystem.geometry.attributes.position.array as Float32Array;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        const idx = i * 3 + 1;
        positions[idx] -= delta * 18; // fall speed
        if (positions[idx] < 0) {
          positions[idx] = 25;
        }
      }
      this.rainParticleSystem.geometry.attributes.position.needsUpdate = true;

      if (playerPos) {
        this.rainParticleSystem.position.set(playerPos.x, 0, playerPos.z);
      }
    }
  }

  public setWeather(newState: WeatherState): void {
    if (this.state === newState) return;
    this.state = newState;

    if (this.rainParticleSystem) {
      this.rainParticleSystem.visible = newState === 'rain';
    }

    EventBus.getInstance().emit('weather:changed', { state: newState });
  }

  private transitionToNextWeather(): void {
    const states: WeatherState[] = ['clear', 'cloudy', 'rain'];
    const candidates = states.filter((s) => s !== this.state);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    this.setWeather(chosen);
    this.scheduleNextTransition();
  }

  private scheduleNextTransition(): void {
    // Random between 5 min (300s) and 30 min (1800s) (Req 12.4)
    this.nextTransitionAt = 300 + Math.random() * 1500;
  }

  public getCurrentWeather(): WeatherState {
    return this.state;
  }

  public getWeatherContext(): string {
    switch (this.state) {
      case 'rain':
        return 'Está lloviendo en el patio escolar, ¡cuidado con los resbalones!';
      case 'cloudy':
        return 'El cielo está nublado sobre el instituto.';
      case 'clear':
      default:
        return 'Hace un día soleado y despejado en el instituto.';
    }
  }

  public serialize(): WeatherSnapshot {
    return {
      state: this.state,
      nextTransitionAt: this.nextTransitionAt - this.timer
    };
  }

  public hydrate(snap: WeatherSnapshot): void {
    if (!snap) return;
    this.setWeather(snap.state);
    this.nextTransitionAt = Math.max(60, snap.nextTransitionAt || 300);
    this.timer = 0;
  }
}
