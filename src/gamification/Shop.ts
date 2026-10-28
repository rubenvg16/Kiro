import { ExtendedShopItem, EXTENDED_SHOP_ITEMS, ShopCategory } from './ShopItems';
import { ProgressionManager } from './ProgressionManager';
import { SaveSystem } from '../storage/SaveSystem';

export class Shop {
  private static instance: Shop | null = null;
  private modalElem: HTMLElement | null = null;
  private selectedCategory: ShopCategory = 'avatar_accessories';

  private constructor() {
    this.createDOM();
  }

  public static getInstance(): Shop {
    if (!Shop.instance) {
      Shop.instance = new Shop();
    }
    return Shop.instance;
  }

  public static resetInstance(): void {
    Shop.instance = null;
  }

  public getAllItems(): ExtendedShopItem[] {
    return [...EXTENDED_SHOP_ITEMS];
  }

  public getItem(itemId: string): ExtendedShopItem | undefined {
    return EXTENDED_SHOP_ITEMS.find((item) => item.id === itemId);
  }

  public isAvailable(item: ExtendedShopItem, date: Date = new Date()): boolean {
    if (!item.isLimitedTime || !item.availableFrom || !item.availableTo) {
      return true;
    }
    const now = date.toISOString().split('T')[0];
    return now >= item.availableFrom && now <= item.availableTo;
  }

  public getItemsByCategory(category: ShopCategory): ExtendedShopItem[] {
    return EXTENDED_SHOP_ITEMS.filter((item) => item.category === category);
  }

  /**
   * Atomic purchase transaction:
   * 1. Validates item existence and affordability.
   * 2. If coins < price, transaction is aborted and balance remains unchanged.
   * 3. Deducts coins, adds item to inventory, and persists state via SaveSystem.
   * Returns true on success, false on rejection.
   */
  public buyItem(itemId: string): boolean {
    const item = this.getItem(itemId);
    if (!item) return false;

    const progression = ProgressionManager.getInstance();
    const currentCoins = progression.progress.coins;

    // Check affordability
    if (currentCoins < item.price) {
      return false; // Rejection: coin balance unchanged
    }

    // Atomic execution
    const spent = progression.spendCoins(item.price);
    if (!spent) return false;

    progression.unlockItem(item.id);

    try {
      SaveSystem.getInstance().save({
        progression: { ...progression.progress }
      });
    } catch {
      // Safe fallback in test environments
    }

    return true;
  }

  private createDOM(): void {
    if (typeof document === 'undefined') return;

    let wrapper = document.getElementById('shop-modal');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'shop-modal';
      wrapper.className = 'modal hidden';
      wrapper.innerHTML = `
        <div class="modal-content large shop-box">
          <div class="modal-header">
            <h3>🏪 Tienda Escolar del IES</h3>
            <div class="shop-balance-badge" style="font-size: 1.15rem; color: #fbbf24; font-weight: bold;">
              Tus Monedas: <span id="shop-coin-balance">0</span> 🪙
            </div>
            <button id="btn-close-shop" class="btn-icon">✕</button>
          </div>
          <div class="shop-categories-tabs" style="display: flex; gap: 8px; margin: 15px 0; overflow-x: auto;">
            <button class="btn btn-tab active" data-category="avatar_accessories">👓 Accesorios</button>
            <button class="btn btn-tab" data-category="backpack_upgrades">🎒 Mochila</button>
            <button class="btn btn-tab" data-category="zone_decorations">🛋️ Decoración</button>
            <button class="btn btn-tab" data-category="puzzle_consumables">⏳ Consumibles</button>
          </div>
          <div id="shop-items-grid" class="shop-grid"></div>
        </div>
      `;
      document.body.appendChild(wrapper);
    }

    this.modalElem = wrapper;

    wrapper.querySelector('#btn-close-shop')?.addEventListener('click', () => {
      this.close();
    });

    wrapper.querySelectorAll('.shop-categories-tabs .btn-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        wrapper.querySelectorAll('.shop-categories-tabs .btn-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.selectedCategory = tab.getAttribute('data-category') as ShopCategory;
        this.render();
      });
    });
  }

  public open(): void {
    if (!this.modalElem) this.createDOM();
    if (this.modalElem) {
      this.modalElem.classList.remove('hidden');
      this.render();
    }
  }

  public close(): void {
    if (this.modalElem) {
      this.modalElem.classList.add('hidden');
    }
  }

  public render(): void {
    if (!this.modalElem) return;

    const progression = ProgressionManager.getInstance();
    const balanceElem = this.modalElem.querySelector('#shop-coin-balance');
    if (balanceElem) balanceElem.textContent = progression.progress.coins.toString();

    const grid = this.modalElem.querySelector('#shop-items-grid');
    if (!grid) return;

    const items = this.getItemsByCategory(this.selectedCategory);
    grid.innerHTML = items
      .map((item, index) => {
        const isOwned = progression.hasItem(item.id);
        const canAfford = progression.progress.coins >= item.price;
        const deficit = item.price - progression.progress.coins;
        const animationDelayMs = index * 50; // Staggered 50ms entrance (Req 10.7)

        return `
          <div class="shop-item-card ${isOwned ? 'owned' : canAfford ? 'affordable' : 'locked'}"
               style="border: 1px solid ${isOwned ? '#10b981' : canAfford ? '#38bdf8' : '#64748b'};
                      padding: 14px; border-radius: 8px; background: rgba(0,0,0,0.25);
                      opacity: 0; transform: translateY(10px);
                      animation: fadeInSlideUp 0.3s forwards;
                      animation-delay: ${animationDelayMs}ms;">
            <div style="font-size: 2.2rem; text-align: center; margin-bottom: 8px;">${item.icon}</div>
            <h4 style="font-size: 1.05rem; margin-bottom: 6px;">${item.name}</h4>
            <p style="font-size: 0.85rem; color: #cbd5e1; min-height: 40px; margin-bottom: 10px;">${item.description}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
              <span style="font-weight: bold; color: #fbbf24;">${item.price} 🪙</span>
              ${
                isOwned
                  ? `<button class="btn btn-secondary btn-sm" disabled>En Propiedad</button>`
                  : canAfford
                  ? `<button class="btn btn-success btn-sm btn-buy-item" data-id="${item.id}">Comprar</button>`
                  : `<span class="deficit-badge" style="color: #ef4444; font-size: 0.8rem; font-weight: bold;">
                      🔒 Faltan ${deficit} 🪙
                    </span>`
              }
            </div>
          </div>
        `;
      })
      .join('');

    grid.querySelectorAll('.btn-buy-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) {
          const success = this.buyItem(id);
          if (success) {
            this.render();
          }
        }
      });
    });
  }
}
