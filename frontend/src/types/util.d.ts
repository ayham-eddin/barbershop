// Minimal declarations for the parts of `util` we use in tests.
declare module 'util' {
  export const TextEncoder: typeof globalThis.TextEncoder;
  export const TextDecoder: typeof globalThis.TextDecoder;
}
