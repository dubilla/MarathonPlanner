import "@testing-library/jest-dom";

// Mock TextDecoder for neon serverless
global.TextDecoder = require("util").TextDecoder;
global.TextEncoder = require("util").TextEncoder;

// Set test environment variables
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.NODE_ENV = "test";

// Mock date utilities to avoid timezone issues in tests
jest.mock("@/utils/date", () => ({
  formatDate: (date: string | Date): string => {
    const dateStr = typeof date === "string" ? date : date.toISOString();
    // Return consistent formatting for known test dates
    if (dateStr.includes("2024-10-15")) return "October 15, 2024";
    if (dateStr.includes("2024-06-02")) return "June 2, 2024";
    // Fallback to standard formatting
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },
  formatDateShort: (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  },
  getWeeksUntilMarathon: (marathonDate: string): number => {
    const now = new Date();
    const marathon = new Date(marathonDate);
    const diffTime = marathon.getTime() - now.getTime();
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.max(0, diffWeeks);
  },
  addWeeks: (date: string | Date, weeks: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + weeks * 7);
    return result;
  },
}));
