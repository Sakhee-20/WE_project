-- Convert note/version plain-text content to TipTap JSON documents (MySQL JSON columns)

ALTER TABLE `notes` ADD COLUMN `content_doc` JSON NULL;

UPDATE `notes` SET `content_doc` = JSON_OBJECT(
  'type', 'doc',
  'content', JSON_ARRAY(
    JSON_OBJECT(
      'type', 'paragraph',
      'content', JSON_ARRAY(
        JSON_OBJECT('type', 'text', 'text', `content`)
      )
    )
  )
);

ALTER TABLE `notes` DROP COLUMN `content`;
ALTER TABLE `notes` CHANGE `content_doc` `content` JSON NOT NULL;

ALTER TABLE `versions` ADD COLUMN `content_doc` JSON NULL;

UPDATE `versions` SET `content_doc` = JSON_OBJECT(
  'type', 'doc',
  'content', JSON_ARRAY(
    JSON_OBJECT(
      'type', 'paragraph',
      'content', JSON_ARRAY(
        JSON_OBJECT('type', 'text', 'text', `content`)
      )
    )
  )
);

ALTER TABLE `versions` DROP COLUMN `content`;
ALTER TABLE `versions` CHANGE `content_doc` `content` JSON NOT NULL;
