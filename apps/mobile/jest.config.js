// Tests that need React Native or AsyncStorage (renders, persisted stores).
// The pure logic tests in __tests__ run on node:test (see `npm test`).
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/__render__/**/*.test.{ts,tsx}'],
  setupFilesAfterEnv: ['<rootDir>/__render__/setup.ts'],
};
