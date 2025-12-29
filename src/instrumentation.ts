export async function register() {
  if (typeof globalThis.self === 'undefined') {
    (globalThis as any).self = globalThis;
  }
}
