export default {
//   testEnvironment: 'node',
//   extensionsToTreatAsEsm: ['.js'],
//   moduleNameMapper: {
//     '^(\\.{1,2}/.*)\\.js$': '$1'
//   },
//   transform: {},
//   setupFilesAfterEnv: ['<rootDir>/test/setup.js']

  // Use Node environment (not browser)
    testEnvironment: 'node',
    
    // Look for test files
    testMatch: [
        '**/__tests__/**/*.test.js',
        '**/?(*.)+(spec|test).js'
    ],
    
    // Coverage settings
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/server.js'
    ],
    
    // Transform ES modules
    transform: {},
    
    // Handle ES modules - removed moduleNameMapper for better compatibility
    
    // Setup files
    setupFiles: ['<rootDir>/test/setup.js'],

    
    // Timeout for async tests
    testTimeout: 30000,
    
    // Verbose output
    verbose: true
};