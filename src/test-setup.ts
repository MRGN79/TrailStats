// jsdom doesn't implement ResizeObserver; recharts requires it.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
