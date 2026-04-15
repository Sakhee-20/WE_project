-- CreateTable
CREATE TABLE `note_references` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fromNoteId` VARCHAR(191) NOT NULL,
    `toNoteId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `note_references_fromNoteId_toNoteId_key`(`fromNoteId`, `toNoteId`),
    INDEX `note_references_toNoteId_idx`(`toNoteId`),
    INDEX `note_references_fromNoteId_idx`(`fromNoteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `note_references` ADD CONSTRAINT `note_references_fromNoteId_fkey` FOREIGN KEY (`fromNoteId`) REFERENCES `notes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `note_references` ADD CONSTRAINT `note_references_toNoteId_fkey` FOREIGN KEY (`toNoteId`) REFERENCES `notes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
