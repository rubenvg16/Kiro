// Test setup: Browser mocks for Three.js, Web Audio, and Storage

// Mock AudioContext and GainNode for Web Audio testing
class MockGainNode {
  gain = {
    value: 1,
    setValueAtTime: (val: number, _startTime?: number) => {
      this.gain.value = val;
    },
    linearRampToValueAtTime: (val: number, _endTime?: number) => {
      this.gain.value = val;
    },
    exponentialRampToValueAtTime: (val: number, _endTime?: number) => {
      this.gain.value = val;
    }
  };
  connect() {}
  disconnect() {}
}

class MockAudioBufferSourceNode {
  buffer: any = null;
  loop = false;
  connect() {}
  disconnect() {}
  start() {}
  stop() {}
}

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};

  createGain() {
    return new MockGainNode();
  }

  createBufferSource() {
    return new MockAudioBufferSourceNode();
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 440, setValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
  }

  async resume() {
    this.state = 'running';
  }

  async suspend() {
    this.state = 'suspended';
  }

  async close() {
    this.state = 'closed';
  }
}

if (typeof window !== 'undefined') {
  (window as any).AudioContext = (window as any).AudioContext || MockAudioContext;
  (window as any).webkitAudioContext = (window as any).webkitAudioContext || MockAudioContext;
}

// In-memory localStorage mock fallback if needed
if (typeof window !== 'undefined' && (!window.localStorage || typeof window.localStorage.getItem !== 'function')) {
  let store: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null
  };
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true
  });
}
