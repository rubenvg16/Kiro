export class CalculatorModal {
  private static instance: CalculatorModal;
  private modalElem: HTMLElement | null = null;
  private displayElem: HTMLElement | null = null;
  private currentExpr: string = '0';
  private shouldReset: boolean = false;

  private constructor() {
    this.createDOM();
  }

  public static getInstance(): CalculatorModal {
    if (!CalculatorModal.instance) {
      CalculatorModal.instance = new CalculatorModal();
    }
    return CalculatorModal.instance;
  }

  private createDOM(): void {
    const wrapper = document.createElement('div');
    wrapper.id = 'calculator-modal';
    wrapper.className = 'modal hidden';
    wrapper.innerHTML = `
      <div class="modal-content calculator-box">
        <div class="calc-header">
          <div class="calc-title">
            <span>🔢</span>
            <h4>Calculadora Científica Escolar</h4>
          </div>
          <button id="btn-close-calc" class="btn-icon">✕</button>
        </div>
        <div class="calc-screen" id="calc-display">0</div>
        <div class="calc-grid">
          <button class="calc-btn fn" data-val="C">C</button>
          <button class="calc-btn fn" data-val="(">(</button>
          <button class="calc-btn fn" data-val=")">)</button>
          <button class="calc-btn op" data-val="/">÷</button>

          <button class="calc-btn fn" data-val="sqrt">√</button>
          <button class="calc-btn fn" data-val="pow">x²</button>
          <button class="calc-btn fn" data-val="pi">π</button>
          <button class="calc-btn op" data-val="*">×</button>

          <button class="calc-btn num" data-val="7">7</button>
          <button class="calc-btn num" data-val="8">8</button>
          <button class="calc-btn num" data-val="9">9</button>
          <button class="calc-btn op" data-val="-">−</button>

          <button class="calc-btn num" data-val="4">4</button>
          <button class="calc-btn num" data-val="5">5</button>
          <button class="calc-btn num" data-val="6">6</button>
          <button class="calc-btn op" data-val="+">+</button>

          <button class="calc-btn num" data-val="1">1</button>
          <button class="calc-btn num" data-val="2">2</button>
          <button class="calc-btn num" data-val="3">3</button>
          <button class="calc-btn eq" data-val="=">=</button>

          <button class="calc-btn num zero" data-val="0">0</button>
          <button class="calc-btn num" data-val=".">.</button>
          <button class="calc-btn fn" data-val="del">⌫</button>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);
    this.modalElem = wrapper;
    this.displayElem = wrapper.querySelector('#calc-display');

    wrapper.querySelector('#btn-close-calc')?.addEventListener('click', () => {
      this.close();
    });

    wrapper.querySelectorAll('.calc-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-val');
        if (val) this.handleButton(val);
      });
    });
  }

  private handleButton(val: string): void {
    if (val === 'C') {
      this.currentExpr = '0';
      this.shouldReset = false;
    } else if (val === 'del') {
      if (this.currentExpr.length > 1) {
        this.currentExpr = this.currentExpr.slice(0, -1);
      } else {
        this.currentExpr = '0';
      }
    } else if (val === '=') {
      try {
        // Evaluación segura con sanitized math
        const sanitized = this.currentExpr.replace(/×/g, '*').replace(/÷/g, '/');
        // Soporte básico de funciones
        const evaluated = Function(`'use strict'; return (${sanitized})`)();
        this.currentExpr = String(Math.round(evaluated * 100000) / 100000);
        this.shouldReset = true;
      } catch {
        this.currentExpr = 'Error';
        this.shouldReset = true;
      }
    } else if (val === 'sqrt') {
      try {
        const num = parseFloat(this.currentExpr);
        this.currentExpr = String(Math.round(Math.sqrt(num) * 100000) / 100000);
        this.shouldReset = true;
      } catch {
        this.currentExpr = 'Error';
      }
    } else if (val === 'pow') {
      try {
        const num = parseFloat(this.currentExpr);
        this.currentExpr = String(Math.round(Math.pow(num, 2) * 100000) / 100000);
        this.shouldReset = true;
      } catch {
        this.currentExpr = 'Error';
      }
    } else if (val === 'pi') {
      this.currentExpr = this.currentExpr === '0' || this.shouldReset ? '3.14159' : this.currentExpr + '3.14159';
      this.shouldReset = false;
    } else {
      if (this.currentExpr === '0' || this.shouldReset) {
        this.currentExpr = val;
        this.shouldReset = false;
      } else {
        this.currentExpr += val;
      }
    }

    if (this.displayElem) {
      this.displayElem.textContent = this.currentExpr;
    }
  }

  public open(): void {
    if (this.modalElem) this.modalElem.classList.remove('hidden');
  }

  public close(): void {
    if (this.modalElem) this.modalElem.classList.add('hidden');
  }
}
