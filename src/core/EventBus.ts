export type ZoneId =
  | 'patio_central'
  | 'biblioteca'
  | 'laboratorio'
  | 'pista_deportiva'
  | 'huerto_escolar'
  | 'sala_informatica'
  | 'pasillo_historia'
  | 'tejado_secreto';

export type WeatherState = 'clear' | 'cloudy' | 'rain';

export type DayPhase = 'morning' | 'afternoon' | 'evening' | 'night';

export type EventMap = {
  'quest:completed': { questId: string; xp: number; coins: number };
  'quest:accepted': { questId: string };
  'puzzle:completed': { puzzleId: string; score: number; perfect: boolean };
  'puzzle:answered': { correct: boolean };
  'zone:entered': { zoneId: ZoneId };
  'zone:unlocked': { zoneId: ZoneId };
  'achievement:unlocked': { achievementId: string };
  'collectible:picked': { collectibleId: string };
  'level:completed': { levelId: string; stars: number };
  'player:levelup': { newLevel: number };
  'minigame:ended': { minigameId: string; score: number; isNewBest: boolean };
  'weather:changed': { state: WeatherState };
  'daycycle:phaseChanged': { phase: DayPhase };
  'npc:relationshipChanged': { npcId: string; score: number };
};

export type EventHandler<T> = (data: T) => void;

/**
 * Singleton typed event bus for decoupled communication across all game subsystems.
 */
export class EventBus {
  private static instance: EventBus | null = null;
  private handlers: {
    [K in keyof EventMap]?: Array<EventHandler<EventMap[K]>>;
  } = {};

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribes an event listener and returns an unsubscription callback.
   */
  public on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event]!.push(handler);

    return () => {
      this.off(event, handler);
    };
  }

  /**
   * Emits an event with strongly typed payload to all active listeners.
   */
  public emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const eventHandlers = this.handlers[event];
    if (eventHandlers && eventHandlers.length > 0) {
      // Create a shallow copy before iterating to handle unsubscribes during emit
      const currentHandlers = [...eventHandlers];
      for (const handler of currentHandlers) {
        try {
          handler(data);
        } catch (err) {
          console.error(`[EventBus] Error in listener for event "${String(event)}":`, err);
        }
      }
    }
  }

  /**
   * Removes a specific event handler.
   */
  public off<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    const eventHandlers = this.handlers[event];
    if (!eventHandlers) return;

    this.handlers[event] = eventHandlers.filter((h) => h !== handler) as any;
    if (this.handlers[event]!.length === 0) {
      delete this.handlers[event];
    }
  }

  /**
   * Resets all listeners. Essential for isolating unit tests.
   */
  public clear(): void {
    this.handlers = {};
  }
}
