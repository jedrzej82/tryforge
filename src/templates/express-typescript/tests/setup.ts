import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock setup for testing
beforeAll(async () => {
  // Setup code that runs before all tests
});

afterAll(async () => {
  // Cleanup code that runs after all tests
});

beforeEach(() => {
  // Setup code that runs before each test
});

afterEach(() => {
  // Cleanup code that runs after each test
});
