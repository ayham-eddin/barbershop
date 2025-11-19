// src/setupTests.ts
import '@testing-library/jest-dom';

type Enc = typeof globalThis.TextEncoder;
type Dec = typeof globalThis.TextDecoder;

// Use CommonJS require here to avoid TS1295 under verbatimModuleSyntax
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nodeUtil = require('util') as {
  TextEncoder?: Enc;
  TextDecoder?: Dec;
};

const g = globalThis as typeof globalThis & {
  TextEncoder?: Enc;
  TextDecoder?: Dec;
};

if (!g.TextEncoder && nodeUtil.TextEncoder) {
  g.TextEncoder = nodeUtil.TextEncoder;
}

if (!g.TextDecoder && nodeUtil.TextDecoder) {
  g.TextDecoder = nodeUtil.TextDecoder;
}
