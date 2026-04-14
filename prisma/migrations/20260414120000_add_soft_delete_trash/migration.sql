-- AlterTable
ALTER TABLE `subjects` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `chapters` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `notes` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `subjects_userId_deletedAt_idx` ON `subjects`(`userId`, `deletedAt`);

-- CreateIndex
CREATE INDEX `chapters_subjectId_deletedAt_idx` ON `chapters`(`subjectId`, `deletedAt`);

-- CreateIndex
CREATE INDEX `notes_chapterId_deletedAt_idx` ON `notes`(`chapterId`, `deletedAt`);
