-- Rename subjects.title -> subjects.name (single column rename, no duplicate fields)

ALTER TABLE `subjects` CHANGE `title` `name` VARCHAR(191) NOT NULL;
