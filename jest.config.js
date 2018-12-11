module.exports = {
  preset: 'ts-jest',
  roots: ['src'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['.git/.*', 'node_modules/.*']
};
