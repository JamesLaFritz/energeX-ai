export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/**/*.test.ts'],

    // tell ts-jest to transpile TS as ESM
    transform: { '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: '<rootDir>/tsconfig.jest.json'  }] },

    // treat .ts files as ESM so imports work
    extensionsToTreatAsEsm: ['.ts'],

    // allow `import './app.js'` in runtime but `import './app'` in tests
    moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1', },
    clearMocks: true,
    collectCoverageFrom: ['src/**/*.ts'],
};
