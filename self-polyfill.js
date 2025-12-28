// Polyfill for self in Node.js environment
if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
  global.self = global;
}
if (typeof globalThis !== 'undefined' && typeof globalThis.self === 'undefined') {
  globalThis.self = globalThis;
}
