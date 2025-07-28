import { sum } from '../utils/sum';

describe('sum util', () => {
  it('should add two numbers', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
