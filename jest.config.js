module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  maxWorkers: 1, // 순차 실행으로 설정
  testTimeout: 30000, // 테스트 타임아웃 증가
  forceExit: true, // 강제 종료
  detectOpenHandles: true, // 열린 핸들 감지
};
