/*
  Warnings:

  - You are about to drop the `Point` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Point" DROP CONSTRAINT "Point_userId_fkey";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "point" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "public"."Point";
