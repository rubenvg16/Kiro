import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { ZoneManager } from '../../world/ZoneManager';
import { ZONE_DEFINITIONS } from '../../world/ZoneDefinitions';
import type { ZoneId } from '../../core/EventBus';

describe('ZoneManager and Zone Properties', () => {
  let zoneManager: ZoneManager;

  beforeEach(() => {
    ZoneManager.resetInstance();
    zoneManager = ZoneManager.getInstance();
  });

  /**
   * Feature: complete-game-expansion, Property 11: Locked Zone Message Non-Empty
   * Validates: Requirements 1.7
   */
  it('Property 11: Locked zones always produce a non-empty explanation message', () => {
    const lockedZones = (Object.keys(ZONE_DEFINITIONS) as ZoneId[]).filter(
      (id) => ZONE_DEFINITIONS[id].unlockCondition !== undefined
    );

    expect(lockedZones.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(fc.constantFrom(...lockedZones), (zoneId) => {
        const message = zoneManager.getUnlockMessage(zoneId);
        expect(typeof message).toBe('string');
        expect(message.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('guarantees 8 distinct zones defined with at least 25 points of interest across the world', () => {
    const zoneKeys = Object.keys(ZONE_DEFINITIONS) as ZoneId[];
    expect(zoneKeys.length).toBe(8);

    const requiredZones: ZoneId[] = [
      'patio_central',
      'biblioteca',
      'laboratorio',
      'pista_deportiva',
      'huerto_escolar',
      'sala_informatica',
      'pasillo_historia',
      'tejado_secreto'
    ];

    for (const required of requiredZones) {
      expect(ZONE_DEFINITIONS[required]).toBeDefined();
    }

    const totalPOIs = zoneKeys.reduce(
      (sum, key) => sum + ZONE_DEFINITIONS[key].pointsOfInterest.length,
      0
    );
    expect(totalPOIs).toBeGreaterThanOrEqual(25);
  });

  it('rejects transition into locked zones and allows transition into unlocked zones', async () => {
    // Patio Central is unlocked by default
    const canEnterPatio = await zoneManager.transitionTo('patio_central');
    expect(canEnterPatio).toBe(true);
    expect(zoneManager.getCurrentZone()).toBe('patio_central');

    // Tejado Secreto has an unfulfilled quest condition initially
    const canEnterTejado = await zoneManager.transitionTo('tejado_secreto');
    expect(canEnterTejado).toBe(false);
    expect(zoneManager.getCurrentZone()).toBe('patio_central');
  });
});
