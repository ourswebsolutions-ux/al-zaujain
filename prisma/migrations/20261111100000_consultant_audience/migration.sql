-- AlterTable
ALTER TABLE `consultants` ADD COLUMN `audience` VARCHAR(12) NOT NULL DEFAULT 'everyone',
    ADD COLUMN `audience_city` VARCHAR(80) NULL;

-- Consultants that were hidden from the public page become "team only", so nothing changes for them.
UPDATE `consultants` SET `audience` = 'team' WHERE `is_public` = false;
