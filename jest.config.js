/** @type {import('next').JestConfigWithNext} */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const jestConfig = {
  testEnvironment: 'jest-environment-jsdom',
};

module.exports = createJestConfig(jestConfig);
