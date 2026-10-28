import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { DayNightCycle } from '../../world/DayNightCycle';
import { WeatherSystem } from '../../world/WeatherSystem';
import { PhysicsWorld } from '../../core/physics/PhysicsWorld';
import { EventBus } from '../../core/EventBus';

describe('DayNightCycle & Weather Properties', () => {
  beforeEach(() => {
    DayNightCycle.resetInstance();
    WeatherSystem.resetInstance();
    EventBus.getInstance().clear();
  });

  /**
   * Feature: complete-game-expansion, Property 9: DayNight Cycle Phase Normalization
   * Validates: Requirements 12.1
   */
  it('Property 9: Normalized cycle position is always strictly in [0, 1) for any elapsed time', () => {
    const cycle = DayNightCycle.getInstance();
    const cycleDuration = cycle.getCycleDuration();
    expect(cycleDuration).toBe(1200); // 20 minutes

    fc.assert(
      fc.property(fc.float({ min: 0, max: 1000000, noNaN: true }), (elapsed) => {
        cycle.hydrate({
          elapsedSecs: elapsed,
          currentPhase: 'morning',
          normalizedTime: 0
        });

        const normalized = cycle.getNormalized();
        expect(normalized).toBeGreaterThanOrEqual(0);
        expect(normalized).toBeLessThan(1);
      }),
      { numRuns: 100 }
    );
  });

  it('correctly maps normalized time to 4 distinct day phases', () => {
    const cycle = DayNightCycle.getInstance();

    expect(cycle.calculatePhase(0.1)).toBe('morning');
    expect(cycle.calculatePhase(0.35)).toBe('afternoon');
    expect(cycle.calculatePhase(0.6)).toBe('evening');
    expect(cycle.calculatePhase(0.85)).toBe('night');
  });

  it('dispatches daycycle:phaseChanged event when phase changes', () => {
    const cycle = DayNightCycle.getInstance();
    const handler = vi.fn();
    EventBus.getInstance().on('daycycle:phaseChanged', handler);

    // Initial is morning (0s). Jump 400s into afternoon (cycle is 1200s, 400/1200 = 0.33)
    cycle.update(400);

    expect(handler).toHaveBeenCalledWith({ phase: 'afternoon' });
  });

  it('triggers weather friction multiplier in PhysicsWorld during rain', () => {
    const physics = new PhysicsWorld();
    expect(physics.frictionMultiplier).toBe(1.0);

    const weather = WeatherSystem.getInstance();
    weather.setWeather('rain');

    expect(physics.frictionMultiplier).toBe(0.7);

    weather.setWeather('clear');
    expect(physics.frictionMultiplier).toBe(1.0);
  });
});
