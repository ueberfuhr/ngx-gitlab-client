module.exports = {

  collectCoverageFrom: [
    '<rootDir>/projects/gitlab-client/src/**/*.ts',
    '!<rootDir>/projects/gitlab-client/src/public-api.ts'
  ],

  coverageDirectory: 'coverage',

  coverageReporters: [
    'lcov',
    'text-summary'
  ],

  testPathIgnorePatterns: [
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/e2e/',
    '<rootDir>/node_modules/'
  ],

  testMatch: [
    '<rootDir>/projects/gitlab-client/src/**/*.spec.ts'
  ]
};
