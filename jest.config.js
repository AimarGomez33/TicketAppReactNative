module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|lucide-react-native|react-native-svg|react-native-safe-area-context|react-native-tcp-socket)/',
  ],
  moduleNameMapper: {
    '^@env$': '<rootDir>/__mocks__/@env.js',
    '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
};
