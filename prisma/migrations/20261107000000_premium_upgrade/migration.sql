-- AlterTable
ALTER TABLE `profiles` CHANGE COLUMN `pref_expectations` `partner_demand` TEXT NULL,
    ADD COLUMN `children_details` VARCHAR(60) NULL,
    ADD COLUMN `father_status` VARCHAR(20) NULL,
    ADD COLUMN `headline_ur` VARCHAR(200) NULL,
    ADD COLUMN `home_ownership` VARCHAR(30) NULL,
    ADD COLUMN `mother_status` VARCHAR(20) NULL,
    ADD COLUMN `residence_area` VARCHAR(20) NULL;

-- Email verification is removed, so its tokens and welcome template go first.
DELETE FROM `tokens` WHERE `purpose` = 'verify_email';
DELETE FROM `email_templates` WHERE `template_key` = 'welcome';

-- AlterTable
ALTER TABLE `tokens` MODIFY `purpose` ENUM('reset_password') NOT NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `email_verified_at`,
    ADD COLUMN `show_in_views` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `saved_profiles` (
    `user_id` INTEGER NOT NULL,
    `profile_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `saved_profiles_profile_id_idx`(`profile_id`),
    INDEX `saved_profiles_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`user_id`, `profile_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile_views` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profile_id` INTEGER NOT NULL,
    `viewer_id` INTEGER NULL,
    `viewer_key` VARCHAR(64) NOT NULL,
    `view_date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `profile_views_profile_id_created_at_idx`(`profile_id`, `created_at`),
    INDEX `profile_views_viewer_id_idx`(`viewer_id`),
    UNIQUE INDEX `profile_views_profile_id_viewer_key_view_date_key`(`profile_id`, `viewer_key`, `view_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `body` VARCHAR(300) NULL,
    `href` VARCHAR(200) NULL,
    `group_key` VARCHAR(60) NULL,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_read_at_idx`(`user_id`, `read_at`),
    INDEX `notifications_user_id_id_idx`(`user_id`, `id`),
    INDEX `notifications_user_id_group_key_idx`(`user_id`, `group_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `saved_profiles` ADD CONSTRAINT `saved_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_profiles` ADD CONSTRAINT `saved_profiles_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile_views` ADD CONSTRAINT `profile_views_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile_views` ADD CONSTRAINT `profile_views_viewer_id_fkey` FOREIGN KEY (`viewer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

