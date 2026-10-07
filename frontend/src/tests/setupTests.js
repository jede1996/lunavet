import '@testing-library/jest-dom';

// Mock de window.matchMedia para jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
});

// Mock de ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock de URL.createObjectURL y revokeObjectURL
globalThis.URL.createObjectURL = (_blob) => 'blob:mock-url';
globalThis.URL.revokeObjectURL = () => {};

// Mock de Canvas para jsdom
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function () {
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: (_x, _y, w, h) => ({ data: new Uint8ClampedArray((w || 1) * (h || 1) * 4) }),
      putImageData: () => {},
      createImageData: (w, h) => ({ data: new Uint8ClampedArray((w || 1) * (h || 1) * 4) }),
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      arc: () => {},
      roundRect: () => {},
      rect: () => {},
      quadraticCurveTo: () => {},
      clip: () => {},
      fill: () => {}
    };
  };

  HTMLCanvasElement.prototype.toBlob = function (callback, type = 'image/webp') {
    const blob = new Blob(['mock-canvas-blob'], { type });
    if (typeof callback === 'function') {
      callback(blob);
    }
  };

  HTMLCanvasElement.prototype.toDataURL = function () {
    return 'data:image/png;base64,mock';
  };
}
