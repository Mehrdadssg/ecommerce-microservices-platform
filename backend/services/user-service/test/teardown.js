// test/teardown.js

// This runs once after all tests
export default async function globalTeardown() {
    console.log('\n🧹 Cleaning up test environment...\n');
    
    if (global.__MONGOSERVER__) {
        await global.__MONGOSERVER__.stop();
        console.log(' Test MongoDB stopped\n');
    }
}