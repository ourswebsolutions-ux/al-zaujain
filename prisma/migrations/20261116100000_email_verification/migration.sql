-- AlterTable
ALTER TABLE `users` ADD COLUMN `email_verified_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `email_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `code_hash` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `email_codes_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `email_codes` ADD CONSTRAINT `email_codes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


-- Accounts made before email confirmation existed keep working: they count as confirmed.
UPDATE `users` SET `email_verified_at` = `created_at` WHERE `email_verified_at` IS NULL;
