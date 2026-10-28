import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { Shop } from '../../gamification/Shop';
import { EXTENDED_SHOP_ITEMS } from '../../gamification/ShopItems';
import { ProgressionManager } from '../../gamification/ProgressionManager';
import { SaveSystem } from '../../storage/SaveSystem';

describe('Shop Property Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    SaveSystem.resetInstance();
    ProgressionManager.resetInstance();
    Shop.resetInstance();
  });

  /**
   * Feature: complete-game-expansion, Property 7: Shop Purchase Coin Invariant
   * Validates: Requirements 10.2
   *
   * For any player with coin balance C and any shop item with price P:
   * - If C >= P, then after a successful purchase the coin balance SHALL equal C - P.
   * - If C < P, the purchase SHALL be rejected and the coin balance SHALL remain unchanged (C).
   */
  it('Property 7: Shop purchase coin invariant holds for arbitrary balances and items', () => {
    const shopItemArbitrary = fc.constantFrom(...EXTENDED_SHOP_ITEMS);
    const initialCoinsArbitrary = fc.integer({ min: 0, max: 2000 });

    fc.assert(
      fc.property(shopItemArbitrary, initialCoinsArbitrary, (item, initialCoins) => {
        localStorage.clear();
        SaveSystem.resetInstance();
        ProgressionManager.resetInstance();
        Shop.resetInstance();

        const progression = ProgressionManager.getInstance();
        progression.progress.coins = initialCoins;
        // Ensure item is not already owned for testing purchase logic
        progression.progress.unlockedItems = progression.progress.unlockedItems.filter(
          (id) => id !== item.id
        );

        const shop = Shop.getInstance();
        const success = shop.buyItem(item.id);

        if (initialCoins >= item.price) {
          expect(success).toBe(true);
          expect(progression.progress.coins).toBe(initialCoins - item.price);
          expect(progression.hasItem(item.id)).toBe(true);
        } else {
          expect(success).toBe(false);
          expect(progression.progress.coins).toBe(initialCoins);
          expect(progression.hasItem(item.id)).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });
});
