-- AlterTable
ALTER TABLE `credit_packages` ADD COLUMN `audio_call` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `color` VARCHAR(20) NULL,
    ADD COLUMN `video_call` BOOLEAN NOT NULL DEFAULT false;

