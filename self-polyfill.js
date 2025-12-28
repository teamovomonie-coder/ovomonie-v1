// Polyfill for self in Node.js environment
if (typeof globalThis.self === 'undefined') {
  globalThis.self = globalThis;
}
