-- Premium profile credits: packages, a credit ledger, per-profile unlocks and package payments.

-- AlterTable
ALTER TABLE `payment_requests` ADD COLUMN `credits` INTEGER NULL,
    ADD COLUMN `package_id` INTEGER NULL,
    ADD COLUMN `package_name` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `credits` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `credit_packages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `credits` INTEGER NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `description` VARCHAR(500) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `sort` INTEGER NOT NULL DEFAULT 100,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `credit_packages_active_sort_idx`(`active`, `sort`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `kind` ENUM('purchase', 'unlock', 'adjustment', 'refund') NOT NULL,
    `amount` INTEGER NOT NULL,
    `balance_after` INTEGER NOT NULL,
    `reference` VARCHAR(80) NULL,
    `note` VARCHAR(500) NULL,
    `actor_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `credit_transactions_user_id_id_idx`(`user_id`, `id`),
    INDEX `credit_transactions_kind_created_at_idx`(`kind`, `created_at`),
    INDEX `credit_transactions_actor_id_idx`(`actor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile_unlocks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `profile_id` INTEGER NOT NULL,
    `credits` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `profile_unlocks_profile_id_idx`(`profile_id`),
    UNIQUE INDEX `profile_unlocks_user_id_profile_id_key`(`user_id`, `profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `payment_requests_package_id_idx` ON `payment_requests`(`package_id`);

-- AddForeignKey
ALTER TABLE `payment_requests` ADD CONSTRAINT `payment_requests_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `credit_packages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_transactions` ADD CONSTRAINT `credit_transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_transactions` ADD CONSTRAINT `credit_transactions_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile_unlocks` ADD CONSTRAINT `profile_unlocks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile_unlocks` ADD CONSTRAINT `profile_unlocks_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


-- A balance can never go below zero, whatever happens in the application.
ALTER TABLE `users` ADD CONSTRAINT `users_credits_not_negative` CHECK (`credits` >= 0);

-- A package always grants at least one credit and costs nothing negative.
ALTER TABLE `credit_packages` ADD CONSTRAINT `credit_packages_sane` CHECK (`credits` > 0 AND `price` >= 0);
