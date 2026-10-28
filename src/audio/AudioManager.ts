export type AudioChannel = 'music' | 'sfx' | 'ambient';

export interface AudioSettings {
  musicVolume: number; // 0–1
  sfxVolume: number; // 0–1
  ambientVolume: number; // 0–1
}

export type SfxId =
  | 'collectible_pickup'
  | 'quest_complete'
  | 'puzzle_correct'
  | 'puzzle_wrong'
  | 'npc_interact'
  | 'level_complete'
  | 'level_complete_3star'
  | 'player_jump'
  | 'achievement_unlock'
  | 'zone_unlock'
  | 'minigame_new_record'
  | 'shop_purchase'
  | 'skill_unlock';

export class AudioManager {
  private static instance: AudioManager | null = null;
  private context: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private currentMusicTrack: string | null = null;
  private currentAmbientTrack: string | null = null;
  private isDucked = false;
  private preDuckGain = 1;

  private settings: AudioSettings = {
    musicVolume: 0.7,
    sfxVolume: 0.8,
    ambientVolume: 0.5
  };

  private constructor() {
    this.initContext();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public static resetInstance(): void {
    AudioManager.instance = null;
  }

  private initContext(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.context = new AudioCtx();
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);

        this.musicGain = this.context.createGain();
        this.musicGain.gain.setValueAtTime(this.settings.musicVolume, this.context.currentTime);
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.context.createGain();
        this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume, this.context.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.ambientGain = this.context.createGain();
        this.ambientGain.gain.setValueAtTime(this.settings.ambientVolume, this.context.currentTime);
        this.ambientGain.connect(this.masterGain);
      }
    } catch (e) {
      console.warn('[AudioManager] Web Audio API unavailable or failed to initialize:', e);
    }
  }

  public ensureContext(): void {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume().catch(() => {});
    }
  }

  public playMusic(trackId: string, crossfadeSecs = 2): void {
    if (this.currentMusicTrack === trackId) return;
    this.currentMusicTrack = trackId;
    this.ensureContext();

    if (!this.context || !this.musicGain) return;

    // Cross-fade: softly dip and raise gain
    const now = this.context.currentTime;
    const targetGain = this.isDucked ? this.settings.musicVolume * 0.4 : this.settings.musicVolume;

    try {
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0.01, now + crossfadeSecs / 2);
      this.musicGain.gain.linearRampToValueAtTime(targetGain, now + crossfadeSecs);
    } catch (e) {
      // Audio node scheduling fallback
      this.musicGain.gain.setValueAtTime(targetGain, now);
    }
  }

  public stopMusic(fadeOutSecs = 1): void {
    this.currentMusicTrack = null;
    if (!this.context || !this.musicGain) return;

    const now = this.context.currentTime;
    try {
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0.0001, now + fadeOutSecs);
    } catch {
      this.musicGain.gain.setValueAtTime(0, now);
    }
  }

  public playAmbient(trackId: string): void {
    if (this.currentAmbientTrack === trackId) return;
    this.currentAmbientTrack = trackId;
    this.ensureContext();
  }

  public playSfx(sfxId: SfxId): void {
    this.ensureContext();
    if (!this.context || !this.sfxGain) return;
    if (this.settings.sfxVolume <= 0) return;

    try {
      this.synthesizeSfx(sfxId);
    } catch (e) {
      console.warn(`[AudioManager] Failed to synthesize SFX ${sfxId}:`, e);
    }
  }

  private synthesizeSfx(sfxId: SfxId): void {
    if (!this.context || !this.sfxGain) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.connect(gain);
    gain.connect(this.sfxGain);

    switch (sfxId) {
      case 'collectible_pickup':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15); // C6
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
        break;

      case 'player_jump':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
        break;

      case 'puzzle_correct':
      case 'quest_complete':
      case 'level_complete':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
        osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'level_complete_3star':
      case 'achievement_unlock':
      case 'minigame_new_record':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.24); // G5
        osc.frequency.setValueAtTime(1046.5, now + 0.36); // C6
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.65);
        osc.start(now);
        osc.stop(now + 0.65);
        break;

      case 'puzzle_wrong':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.25);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
        break;

      default:
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
    }
  }

  public duckMusic(targetGainMultiplier = 0.4, durationSecs = 0.5): void {
    if (this.isDucked || !this.context || !this.musicGain) return;
    this.isDucked = true;
    this.preDuckGain = this.settings.musicVolume;

    const now = this.context.currentTime;
    const target = this.settings.musicVolume * targetGainMultiplier;
    try {
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(target, now + durationSecs);
    } catch {
      this.musicGain.gain.setValueAtTime(target, now);
    }
  }

  public unduckMusic(durationSecs = 0.5): void {
    if (!this.isDucked || !this.context || !this.musicGain) return;
    this.isDucked = false;

    const now = this.context.currentTime;
    const target = this.preDuckGain;
    try {
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(target, now + durationSecs);
    } catch {
      this.musicGain.gain.setValueAtTime(target, now);
    }
  }

  public setVolume(channel: AudioChannel, value: number): void {
    const clamped = Math.max(0, Math.min(1, value));
    this.settings[`${channel}Volume` as keyof AudioSettings] = clamped;

    if (!this.context) return;
    const now = this.context.currentTime;

    if (channel === 'music' && this.musicGain) {
      const target = this.isDucked ? clamped * 0.4 : clamped;
      this.musicGain.gain.setValueAtTime(target, now);
    } else if (channel === 'sfx' && this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(clamped, now);
    } else if (channel === 'ambient' && this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(clamped, now);
    }
  }

  public getVolume(channel: AudioChannel): number {
    return this.settings[`${channel}Volume` as keyof AudioSettings];
  }

  public loadSettings(settings: Partial<AudioSettings>): void {
    if (typeof settings.musicVolume === 'number') this.setVolume('music', settings.musicVolume);
    if (typeof settings.sfxVolume === 'number') this.setVolume('sfx', settings.sfxVolume);
    if (typeof settings.ambientVolume === 'number') this.setVolume('ambient', settings.ambientVolume);
  }

  public serialize(): AudioSettings {
    return { ...this.settings };
  }

  public getCurrentMusicTrack(): string | null {
    return this.currentMusicTrack;
  }

  public isMusicDucked(): boolean {
    return this.isDucked;
  }
}
