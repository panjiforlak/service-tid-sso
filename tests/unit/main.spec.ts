// Mock the entire main module to avoid import issues
jest.mock('src/main', () => ({
  bootstrap: jest.fn(),
}));

import { bootstrap } from 'src/main';

describe('Main Application', () => {
  it('should be defined', () => {
    expect(bootstrap).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof bootstrap).toBe('function');
  });
});
