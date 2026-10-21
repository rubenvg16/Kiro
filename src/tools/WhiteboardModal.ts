export class WhiteboardModal {
  private static instance: WhiteboardModal;
  private modalElem: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isDrawing: boolean = false;
  private currentColor: string = '#ffffff';
  private currentSize: number = 3;
  private isEraser: boolean = false;

  private constructor() {
    this.createDOM();
  }

  public static getInstance(): WhiteboardModal {
    if (!WhiteboardModal.instance) {
      WhiteboardModal.instance = new WhiteboardModal();
    }
    return WhiteboardModal.instance;
  }

  private createDOM(): void {
    const wrapper = document.createElement('div');
    wrapper.id = 'whiteboard-modal';
    wrapper.className = 'modal hidden';
    wrapper.innerHTML = `
      <div class="modal-content whiteboard-box">
        <div class="board-header">
          <div class="board-title">
            <span>🖍️</span>
            <h4>Pizarra Digital de Apuntes y Borrador</h4>
          </div>
          <div class="board-tools">
            <button class="tool-btn color-dot active" style="background: #ffffff;" data-color="#ffffff"></button>
            <button class="tool-btn color-dot" style="background: #38bdf8;" data-color="#38bdf8"></button>
            <button class="tool-btn color-dot" style="background: #facc15;" data-color="#facc15"></button>
            <button class="tool-btn color-dot" style="background: #f87171;" data-color="#f87171"></button>
            <button class="tool-btn color-dot" style="background: #4ade80;" data-color="#4ade80"></button>
            <div class="sep"></div>
            <button id="btn-board-pen" class="tool-btn active">✏️ Lápiz</button>
            <button id="btn-board-eraser" class="tool-btn">🧽 Borrador</button>
            <button id="btn-board-clear" class="tool-btn danger">🗑️ Limpiar</button>
            <div class="sep"></div>
            <button id="btn-close-board" class="btn-icon">✕</button>
          </div>
        </div>
        <div class="canvas-wrapper">
          <canvas id="whiteboard-canvas" width="700" height="420"></canvas>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);
    this.modalElem = wrapper;
    this.canvas = wrapper.querySelector('#whiteboard-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.initCanvas();
    }

    wrapper.querySelector('#btn-close-board')?.addEventListener('click', () => this.close());
    wrapper.querySelector('#btn-board-clear')?.addEventListener('click', () => this.clearCanvas());

    const penBtn = wrapper.querySelector('#btn-board-pen');
    const eraserBtn = wrapper.querySelector('#btn-board-eraser');

    penBtn?.addEventListener('click', () => {
      this.isEraser = false;
      penBtn.classList.add('active');
      eraserBtn?.classList.remove('active');
    });

    eraserBtn?.addEventListener('click', () => {
      this.isEraser = true;
      eraserBtn.classList.add('active');
      penBtn?.classList.remove('active');
    });

    wrapper.querySelectorAll('.color-dot').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.isEraser = false;
        penBtn?.classList.add('active');
        eraserBtn?.classList.remove('active');
        wrapper.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        btn.classList.add('active');
        this.currentColor = btn.getAttribute('data-color') || '#ffffff';
      });
    });
  }

  private initCanvas(): void {
    if (!this.canvas || !this.ctx) return;

    this.clearCanvas();

    const getPos = (e: MouseEvent | TouchEvent) => {
      if (!this.canvas) return { x: 0, y: 0 };
      const rect = this.canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const startDraw = (e: MouseEvent | TouchEvent) => {
      this.isDrawing = true;
      const pos = getPos(e);
      if (!this.ctx) return;
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!this.isDrawing || !this.ctx) return;
      const pos = getPos(e);
      this.ctx.lineWidth = this.isEraser ? 24 : this.currentSize;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.strokeStyle = this.isEraser ? '#1a2234' : this.currentColor;
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
    };

    const stopDraw = () => {
      this.isDrawing = false;
    };

    this.canvas.addEventListener('mousedown', startDraw);
    this.canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);

    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e); }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, { passive: false });
    window.addEventListener('touchend', stopDraw);
  }

  private clearCanvas(): void {
    if (!this.canvas || !this.ctx) return;
    this.ctx.fillStyle = '#1a2234'; // Tono pizarra oscura escolar
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Cuadrícula sutil de libreta milimetrada
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  public open(): void {
    if (this.modalElem) this.modalElem.classList.remove('hidden');
  }

  public close(): void {
    if (this.modalElem) this.modalElem.classList.add('hidden');
  }
}
