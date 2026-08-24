/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  resetMocks: true,
  // Default Jest memakai (jumlah core - 1) worker. Dengan 18 suite dan setiap
  // worker memuat Prisma client sendiri, itu cukup untuk membuat mesin 8 GB
  // kehabisan memori — suite-nya gagal tanpa satu pun assertion yang salah.
  // 50% menskala mengikuti mesin, jadi tetap wajar di CI yang lebih besar.
  maxWorkers: "50%",
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