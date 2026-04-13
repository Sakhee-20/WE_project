-- AlterTable
ALTER TABLE `users` ADD COLUMN `onboardingCompletedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `note_opens` (
    `id` VARCHAR(191) NOT NULL,
    `openedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,
    `noteId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `note_opens_userId_noteId_key`(`userId`, `noteId`),
    INDEX `note_opens_userId_openedAt_idx`(`userId`, `openedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `note_opens` ADD CONSTRAINT `note_opens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `note_opens` ADD CONSTRAINT `note_opens_noteId_fkey` FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
