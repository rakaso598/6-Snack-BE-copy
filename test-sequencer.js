const TestSequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends TestSequencer {
  sort(tests) {
    // 테스트 파일들을 순서대로 정렬하여 순차 실행
    return tests.sort((testA, testB) => {
      const pathA = testA.path;
      const pathB = testB.path;
      
      // 통합 테스트를 먼저 실행
      if (pathA.includes('integration-test') && !pathB.includes('integration-test')) {
        return -1;
      }
      if (!pathA.includes('integration-test') && pathB.includes('integration-test')) {
        return 1;
      }
      
      // 파일명으로 정렬
      return pathA.localeCompare(pathB);
    });
  }
}

module.exports = CustomSequencer;
