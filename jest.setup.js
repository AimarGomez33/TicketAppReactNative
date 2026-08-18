/* global jest */
// jest.setup.js
jest.mock('react-native-tcp-socket', () => ({
  createConnection: jest.fn(() => ({
    write: jest.fn(),
    destroy: jest.fn(),
    setTimeout: jest.fn(),
    on: jest.fn(),
  })),
}));
