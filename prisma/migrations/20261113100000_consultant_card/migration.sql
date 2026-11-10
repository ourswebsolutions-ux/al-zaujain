-- AlterTable
ALTER TABLE `consultants` ADD COLUMN `specialties` VARCHAR(255) NULL,
    ADD COLUMN `rating` DECIMAL(2, 1) NULL,
    ADD COLUMN `work_days` VARCHAR(10) NOT NULL DEFAULT 'mon-sat',
    ADD COLUMN `hours_from` VARCHAR(5) NULL,
    ADD COLUMN `hours_to` VARCHAR(5) NULL;
