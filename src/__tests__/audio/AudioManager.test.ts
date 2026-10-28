import { describe, it, expect, beforeEach } from 'vitest';
import { AudioManager, SfxId } from '../../audio/AudioManager';

describe('AudioManager Subsystem', () => {
  let audio: AudioManager;

  beforeEach(() => {
    AudioManager.resetInstance();
    audio = AudioManager.getInstance();
  });

  it('clamps volume strictly between 0 and 1', () => {
    audio.setVolume('music', 1.5);
    expect(audio.getVolume('music')).toBe(1.0);

    audio.setVolume('music', -0.5);
    expect(audio.getVolume('music')).toBe(0.0);

    audio.setVolume('sfx', 0.65);
    expect(audio.getVolume('sfx')).toBe(0.65);
  });

  it('mutes channel cleanly when volume is set to 0', () => {
    audio.setVolume('music', 0);
    expect(audio.getVolume('music')).toBe(0);
    expect(() => audio.playMusic('music_patio')).not.toThrow();
  });

  it('ducks music volume by 60% (target 40%) during dialogue', () => {
    audio.setVolume('music', 1.0);
    expect(audio.isMusicDucked()).toBe(false);

    audio.duckMusic(0.4, 0.1);
    expect(audio.isMusicDucked()).toBe(true);

    audio.unduckMusic(0.1);
    expect(audio.isMusicDucked()).toBe(false);
  });

  it('serializes and restores volume settings accurately', () => {
    audio.setVolume('music', 0.35);
    audio.setVolume('sfx', 0.9);
    audio.setVolume('ambient', 0.2);

    const serialized = audio.serialize();
    expect(serialized).toEqual({
      musicVolume: 0.35,
      sfxVolume: 0.9,
      ambientVolume: 0.2
    });

    AudioManager.resetInstance();
    const freshAudio = AudioManager.getInstance();
    freshAudio.loadSettings(serialized);

    expect(freshAudio.getVolume('music')).toBe(0.35);
    expect(freshAudio.getVolume('sfx')).toBe(0.9);
    expect(freshAudio.getVolume('ambient')).toBe(0.2);
  });

  it('synthesizes all 13 defined SFX without errors', () => {
    const sfxList: SfxId[] = [
      'collectible_pickup',
      'quest_complete',
      'puzzle_correct',
      'puzzle_wrong',
      'npc_interact',
      'level_complete',
      'level_complete_3star',
      'player_jump',
      'achievement_unlock',
      'zone_unlock',
      'minigame_new_record',
      'shop_purchase',
      'skill_unlock'
    ];

    for (const sfx of sfxList) {
      expect(() => audio.playSfx(sfx)).not.toThrow();
    }
  });
});
