import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../../core/EventBus';

describe('EventBus Core Infrastructure', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = EventBus.getInstance();
    eventBus.clear();
  });

  it('guarantees singleton instance reference', () => {
    const bus1 = EventBus.getInstance();
    const bus2 = EventBus.getInstance();
    expect(bus1).toBe(bus2);
  });

  it('subscribes and receives emitted events with accurate payloads', () => {
    const handler = vi.fn();
    eventBus.on('quest:completed', handler);

    eventBus.emit('quest:completed', {
      questId: 'main_quest_1',
      xp: 150,
      coins: 50
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      questId: 'main_quest_1',
      xp: 150,
      coins: 50
    });
  });

  it('dispatches to multiple listeners registered for the same event', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    eventBus.on('zone:entered', handler1);
    eventBus.on('zone:entered', handler2);

    eventBus.emit('zone:entered', { zoneId: 'biblioteca' });

    expect(handler1).toHaveBeenCalledWith({ zoneId: 'biblioteca' });
    expect(handler2).toHaveBeenCalledWith({ zoneId: 'biblioteca' });
  });

  it('stops receiving events when calling returned unsubscribe function', () => {
    const handler = vi.fn();
    const unsubscribe = eventBus.on('level:completed', handler);

    eventBus.emit('level:completed', { levelId: 'patio', stars: 3 });
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    eventBus.emit('level:completed', { levelId: 'patio', stars: 2 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('stops receiving events when using off() method directly', () => {
    const handler = vi.fn();
    eventBus.on('player:levelup', handler);

    eventBus.emit('player:levelup', { newLevel: 2 });
    expect(handler).toHaveBeenCalledTimes(1);

    eventBus.off('player:levelup', handler);
    eventBus.emit('player:levelup', { newLevel: 3 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('isolates errors in one listener from failing other listeners', () => {
    const faultyHandler = vi.fn(() => {
      throw new Error('Boom in listener');
    });
    const normalHandler = vi.fn();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    eventBus.on('weather:changed', faultyHandler);
    eventBus.on('weather:changed', normalHandler);

    expect(() => {
      eventBus.emit('weather:changed', { state: 'rain' });
    }).not.toThrow();

    expect(faultyHandler).toHaveBeenCalledTimes(1);
    expect(normalHandler).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('handles events safely when no listeners are attached', () => {
    expect(() => {
      eventBus.emit('achievement:unlocked', { achievementId: 'first_step' });
    }).not.toThrow();
  });

  it('wipes all handlers when clear() is invoked', () => {
    const handler = vi.fn();
    eventBus.on('daycycle:phaseChanged', handler);

    eventBus.clear();
    eventBus.emit('daycycle:phaseChanged', { phase: 'night' });

    expect(handler).not.toHaveBeenCalled();
  });
});
