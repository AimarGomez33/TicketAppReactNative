/* global jest */
// jest.setup.js
jest.mock('react-native-tcp-socket', () => ({
  createConnection: jest.fn((_options, callback) => {
    const mockSocket = {
      write: jest.fn((_data, cb) => {
        if (typeof cb === 'function') cb();
      }),
      end: jest.fn(),
      destroy: jest.fn(),
      setTimeout: jest.fn(),
      on: jest.fn((event, handler) => {
        if (event === 'connect') {
          setTimeout(() => handler(), 5);
        }
        if (event === 'close') {
          setTimeout(() => handler(), 10);
        }
        return mockSocket;
      }),
    };
    if (typeof callback === 'function') {
      setTimeout(callback, 5);
    }
    return mockSocket;
  }),
}));
