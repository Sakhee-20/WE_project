-- Add missing ordering columns introduced in schema but absent from earlier migrations.
ALTER TABLE `subjects`
  ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0;

ALTER TABLE `notes`
  ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0;

CREATE INDEX `subjects_userId_order_idx` ON `subjects`(`userId`, `order`);
