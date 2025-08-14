module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  roots: ['<rootDir>/src'],
  // 테스트 격리 개선
  testTimeout: 30000,
  // 테스트를 순차적으로 실행하여 데드락 방지
  maxWorkers: 1,
  // 각 테스트 파일을 독립적으로 실행
  testSequencer: './test-sequencer.js',
};
