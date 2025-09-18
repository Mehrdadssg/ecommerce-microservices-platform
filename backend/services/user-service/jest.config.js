// jest.config.js

export default {
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
    
    // Handle ES modules
    extensionsToTreatAsEsm: [],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    
    // Setup and teardown
    globalSetup: './test/setup.js',
    globalTeardown: './test/teardown.js',
    
    // Timeout for async tests
    testTimeout: 30000,
    
    // Verbose output
    verbose: true
};