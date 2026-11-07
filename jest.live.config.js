// Configuración mínima (entorno Node, fetch nativo) para la prueba contra el backend real.
const preset = require.resolve('babel-preset-expo', { paths: [require.resolve('expo/package.json')] });
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/live.test.ts'],
  transform: { '\\.[jt]sx?$': ['babel-jest', { presets: [preset] }] },
  transformIgnorePatterns: ['/node_modules/(?!expo/virtual)'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
