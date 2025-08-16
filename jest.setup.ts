import "@testing-library/jest-dom";

// Mock TextDecoder for neon serverless
global.TextDecoder = require('util').TextDecoder;
global.TextEncoder = require('util').TextEncoder;

// Set test environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NODE_ENV = 'test';
