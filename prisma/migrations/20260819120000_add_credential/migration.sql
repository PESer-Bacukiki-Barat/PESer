-- CreateTable
CREATE TABLE "credential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credential_userId_key" ON "credential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "credential_email_key" ON "credential"("email");

-- AddForeignKey
ALTER TABLE "credential" ADD CONSTRAINT "credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropIndex
DROP INDEX "user_authUserId_key";

-- DropColumn
ALTER TABLE "user" DROP COLUMN "authUserId";
