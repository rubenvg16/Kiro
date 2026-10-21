import { ProgressionManager } from '../gamification/ProgressionManager';

export interface PuzzleResult {
  solved: boolean;
  xpEarned: number;
  coinsEarned: number;
  relicUnlocked?: string;
}

export class PuzzleEngine {
  private static instance: PuzzleEngine;
  private modalElem: HTMLElement | null = null;
  private contentElem: HTMLElement | null = null;
  private titleElem: HTMLElement | null = null;
  private progression: ProgressionManager;

  private constructor() {
    this.progression = ProgressionManager.getInstance();
    this.createDOM();
  }

  public static getInstance(): PuzzleEngine {
    if (!PuzzleEngine.instance) {
      PuzzleEngine.instance = new PuzzleEngine();
    }
    return PuzzleEngine.instance;
  }

  private createDOM(): void {
    const wrapper = document.createElement('div');
    wrapper.id = 'puzzle-modal';
    wrapper.className = 'modal hidden';
    wrapper.innerHTML = `
      <div class="modal-content large puzzle-box">
        <div class="puzzle-header">
          <h3 id="puzzle-title">Enigma</h3>
          <button id="btn-close-puzzle" class="btn-icon">✕</button>
        </div>
        <div id="puzzle-body" class="puzzle-interactive-area"></div>
      </div>
    `;

    document.body.appendChild(wrapper);
    this.modalElem = wrapper;
    this.contentElem = wrapper.querySelector('#puzzle-body');
    this.titleElem = wrapper.querySelector('#puzzle-title');

    wrapper.querySelector('#btn-close-puzzle')?.addEventListener('click', () => {
      this.close();
    });
  }

  /**
   * Puzzle 1: La Balanza Algebraica (Equilibrio de Ecuaciones)
   */
  public launchAlgebraBalance(): void {
    if (!this.modalElem || !this.contentElem || !this.titleElem) return;
    this.titleElem.textContent = '⚖️ La Balanza Algebraica de Don Manuel';

    // Ecuación: 2x + 6 = 14  => x = 4
    let leftX = 2;
    let leftUnits = 6;
    let rightUnits = 14;
    const targetX = 4;

    const render = () => {
      if (!this.contentElem) return;
      const totalLeft = leftX * targetX + leftUnits;
      const totalRight = rightUnits;
      const isBalanced = totalLeft === totalRight;
      const isSolved = leftX === 1 && leftUnits === 0 && rightUnits === targetX;

      this.contentElem.innerHTML = `
        <div class="balance-puzzle">
          <p class="puzzle-desc">
            Equilibra la balanza para resolver la ecuación. Lo que hagas en un plato, ¡debes hacerlo en el otro!
          </p>
          <div class="algebra-equation-box">
            <span>${leftX}x + ${leftUnits} = ${rightUnits}</span>
          </div>

          <div class="balance-visual ${isBalanced ? 'balanced' : totalLeft > totalRight ? 'tilt-left' : 'tilt-right'}">
            <div class="balance-fulcrum">▲</div>
            <div class="balance-beam"></div>

            <div class="balance-pan left-pan">
              <div class="pan-label">Plato Izquierdo</div>
              <div class="pan-items">
                ${Array(leftX).fill('<div class="x-box">x</div>').join('')}
                ${leftUnits > 0 ? `<div class="unit-box">+${leftUnits}</div>` : ''}
              </div>
            </div>

            <div class="balance-pan right-pan">
              <div class="pan-label">Plato Derecho</div>
              <div class="pan-items">
                <div class="unit-box number-box">${rightUnits}</div>
              </div>
            </div>
          </div>

          <div class="balance-actions">
            <button id="btn-sub-2" class="btn btn-option" ${leftUnits < 2 || rightUnits < 2 ? 'disabled' : ''}>Restar 2 a ambos lados (-2)</button>
            <button id="btn-sub-6" class="btn btn-option" ${leftUnits < 6 || rightUnits < 6 ? 'disabled' : ''}>Restar 6 a ambos lados (-6)</button>
            <button id="btn-div-2" class="btn btn-option" ${leftX !== 2 || leftUnits !== 0 || rightUnits % 2 !== 0 ? 'disabled' : ''}>Dividir entre 2 (÷2)</button>
            <button id="btn-reset-balance" class="btn btn-secondary">Reiniciar</button>
          </div>

          <div id="balance-result-zone">
            ${isSolved ? `
              <div class="puzzle-victory-card">
                <h4>🎉 ¡Ecuación Resuelta con Éxito!</h4>
                <p>Has aislado la incógnita: <strong>x = ${targetX}</strong></p>
                <p>Recompensa: <strong>+80 Puntos de Estudio</strong> y <strong>+60 Monedas 🪙</strong></p>
                <button id="btn-claim-balance" class="btn btn-success">Reclamar y Guardar</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      this.contentElem.querySelector('#btn-sub-2')?.addEventListener('click', () => {
        leftUnits -= 2;
        rightUnits -= 2;
        render();
      });

      this.contentElem.querySelector('#btn-sub-6')?.addEventListener('click', () => {
        leftUnits -= 6;
        rightUnits -= 6;
        render();
      });

      this.contentElem.querySelector('#btn-div-2')?.addEventListener('click', () => {
        leftX = 1;
        rightUnits /= 2;
        render();
      });

      this.contentElem.querySelector('#btn-reset-balance')?.addEventListener('click', () => {
        leftX = 2;
        leftUnits = 6;
        rightUnits = 14;
        render();
      });

      this.contentElem.querySelector('#btn-claim-balance')?.addEventListener('click', () => {
        this.progression.addXP(80);
        this.progression.addCoins(60);
        this.progression.unlockRelic('relic_balance_master');
        this.close();
      });
    };

    render();
    this.open();
  }

  /**
   * Puzzle 2: El Enigma Criptográfico de Miguel de Cervantes (Cifrado César)
   */
  public launchCervantesCipher(): void {
    if (!this.modalElem || !this.contentElem || !this.titleElem) return;
    this.titleElem.textContent = '📜 El Enigma Criptográfico de Cervantes';

    let currentShift = 0;
    const targetShift = 3; // Desplazamiento César real
    const originalText = 'EL QUE LEE MUCHO Y ANDA MUCHO, SABE MUCHO';
    
    // Función de cifrado César
    const caesar = (text: string, shift: number) => {
      const alphabet = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
      return text.split('').map((char) => {
        const idx = alphabet.indexOf(char.toUpperCase());
        if (idx === -1) return char;
        let newIdx = (idx + shift) % alphabet.length;
        if (newIdx < 0) newIdx += alphabet.length;
        return alphabet[newIdx];
      }).join('');
    };

    const encrypted = caesar(originalText, targetShift);

    const render = () => {
      if (!this.contentElem) return;
      const decodedAttempt = caesar(encrypted, -currentShift);
      const isSolved = currentShift === targetShift;

      this.contentElem.innerHTML = `
        <div class="cervantes-puzzle">
          <p class="puzzle-desc">
            Don Miguel de Cervantes ha dejado este manuscrito cifrado con un desplazamiento de letras.
            Gira la rueda de descifrado hasta encontrar el texto legible original.
          </p>

          <div class="parchment-box">
            <span class="parchment-label">Manuscrito en la Biblioteca:</span>
            <div class="cipher-text">${decodedAttempt}</div>
          </div>

          <div class="cipher-controls">
            <span class="shift-label">Desplazamiento César actual: <strong>${currentShift} posiciones</strong></span>
            <div class="button-group" style="max-width: 320px; margin: 12px auto;">
              <button id="btn-shift-prev" class="btn btn-option">◀ Letra Anterior</button>
              <button id="btn-shift-next" class="btn btn-option">Letra Siguiente ▶</button>
            </div>
          </div>

          <div id="cervantes-result-zone">
            ${isSolved ? `
              <div class="puzzle-victory-card">
                <h4>🏆 ¡Códice Descifrado con Maestría!</h4>
                <p><em>"${originalText}"</em> — Don Quijote de la Mancha</p>
                <p>Has desbloqueado el <strong>Pergamino Dorado de Cervantes</strong>.</p>
                <button id="btn-claim-cervantes" class="btn btn-success">Aceptar Premio</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      this.contentElem.querySelector('#btn-shift-prev')?.addEventListener('click', () => {
        currentShift = (currentShift - 1 + 27) % 27;
        render();
      });

      this.contentElem.querySelector('#btn-shift-next')?.addEventListener('click', () => {
        currentShift = (currentShift + 1) % 27;
        render();
      });

      this.contentElem.querySelector('#btn-claim-cervantes')?.addEventListener('click', () => {
        this.progression.addXP(100);
        this.progression.addCoins(75);
        this.progression.unlockRelic('relic_cervantes_scroll');
        this.close();
      });
    };

    render();
    this.open();
  }

  /**
   * Puzzle 3: La Red Neuronal de Santiago Ramón y Cajal
   */
  public launchCajalSynapse(): void {
    if (!this.modalElem || !this.contentElem || !this.titleElem) return;
    this.titleElem.textContent = '🔬 El Microscopio y Sinapsis de Ramón y Cajal';

    const sequence: number[] = [];
    const correctSequence = [1, 2, 3, 4]; // Dendrita -> Soma -> Axón -> Botón Sináptico
    let isSolved = false;

    const render = () => {
      if (!this.contentElem) return;

      this.contentElem.innerHTML = `
        <div class="cajal-puzzle">
          <p class="puzzle-desc">
            Cajal descubrió la individualidad de las neuronas y la dirección del impulso nervioso.
            Conecta los 4 elementos en la dirección biológica correcta del impulso nervioso:
          </p>

          <div class="synapse-circuit">
            <button class="node-btn ${sequence.includes(1) ? 'active' : ''}" data-id="1">1. Dendritas (Receptoras)</button>
            <div class="synapse-arrow">➜</div>
            <button class="node-btn ${sequence.includes(2) ? 'active' : ''}" data-id="2">2. Soma (Cuerpo Celular)</button>
            <div class="synapse-arrow">➜</div>
            <button class="node-btn ${sequence.includes(3) ? 'active' : ''}" data-id="3">3. Axón (Transmisión)</button>
            <div class="synapse-arrow">➜</div>
            <button class="node-btn ${sequence.includes(4) ? 'active' : ''}" data-id="4">4. Botón Sináptico (Neurotransmisores)</button>
          </div>

          <div class="circuit-status">
            <span>Pulsos conectados: <strong>${sequence.length} de 4</strong></span>
            <button id="btn-reset-synapse" class="btn btn-secondary btn-sm" style="margin-left: 14px;">Reiniciar Impulso</button>
          </div>

          <div id="cajal-result-zone">
            ${isSolved ? `
              <div class="puzzle-victory-card">
                <h4>🌟 ¡Doctrina Neuronal Verificada!</h4>
                <p>Has reconstruido la polarización dinámica de Ramón y Cajal (Premio Nobel 1906).</p>
                <p>Recompensa: <strong>Medalla de Honor Científico</strong>, +120 Puntos y +80 🪙</p>
                <button id="btn-claim-cajal" class="btn btn-success">Recoger Medalla</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      this.contentElem.querySelectorAll('.node-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id') || '0', 10);
          if (!sequence.includes(id)) {
            sequence.push(id);
            // Comprobar si va en orden correcto
            const isMatchSoFar = sequence.every((val, idx) => val === correctSequence[idx]);
            if (!isMatchSoFar) {
              alert('⚡ ¡Cortocircuito sináptico! El impulso debe viajar desde las dendritas al axón.');
              sequence.length = 0;
            } else if (sequence.length === 4) {
              isSolved = true;
            }
            render();
          }
        });
      });

      this.contentElem.querySelector('#btn-reset-synapse')?.addEventListener('click', () => {
        sequence.length = 0;
        isSolved = false;
        render();
      });

      this.contentElem.querySelector('#btn-claim-cajal')?.addEventListener('click', () => {
        this.progression.addXP(120);
        this.progression.addCoins(80);
        this.progression.unlockRelic('relic_cajal_microscope');
        this.close();
      });
    };

    render();
    this.open();
  }

  public open(): void {
    if (this.modalElem) this.modalElem.classList.remove('hidden');
  }

  public close(): void {
    if (this.modalElem) this.modalElem.classList.add('hidden');
  }
}
