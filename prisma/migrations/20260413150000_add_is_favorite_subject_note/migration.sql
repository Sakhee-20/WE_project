-- AlterTable
ALTER TABLE `subjects` ADD COLUMN `isFavorite` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `notes` ADD COLUMN `isFavorite` BOOLEAN NOT NULL DEFAULT false;
