exports.genkit = function genkitStub() {
  return {
    defineFlow: (opts, fn) => {
      // Return a lightweight flow-like object that calls the underlying function server-side.
      return {
        __isMock: true,
        run: async (input) => {
          // In client environment we cannot run the server-side flow; throw to surface at runtime.
          throw new Error('genkit.defineFlow is not available in the client build')
        },
      }
    },
    generate: async () => {
      throw new Error('genkit.generate is not available in the client build')
    },
  }
}
