-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ALTER COLUMN "github_id" DROP NOT NULL,
ALTER COLUMN "username" DROP NOT NULL;
