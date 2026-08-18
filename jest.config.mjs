/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  resetMocks: true,
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.(t|j)s$": [
      "@swc/jest",
      { jsc: { parser: { syntax: "typescript" } } },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
}

export default config