-- AlterTable
ALTER TABLE "ShopConnection" ADD COLUMN "apiKeyID" TEXT;
ALTER TABLE "ShopConnection" ADD COLUMN "apiKeySecret" TEXT;
ALTER TABLE "ShopConnection" ADD COLUMN "apiToken" TEXT;
ALTER TABLE "ShopConnection" ADD COLUMN "melonType" TEXT DEFAULT 'stack';
ALTER TABLE "ShopConnection" ADD COLUMN "tokenExpiresIn" INTEGER;
ALTER TABLE "ShopConnection" ADD COLUMN "tokenType" TEXT;
