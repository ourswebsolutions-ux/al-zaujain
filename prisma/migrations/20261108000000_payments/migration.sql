-- CreateTable
CREATE TABLE `payment_methods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `account_holder` VARCHAR(120) NOT NULL,
    `bank_name` VARCHAR(120) NOT NULL,
    `iban` VARCHAR(40) NULL,
    `account_number` VARCHAR(40) NULL,
    `instructions` TEXT NULL,
    `qr_image` VARCHAR(80) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payment_methods_active_sort_idx`(`active`, `sort`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `method_id` INTEGER NULL,
    `method_name` VARCHAR(100) NOT NULL,
    `sender_name` VARCHAR(120) NOT NULL,
    `transaction_id` VARCHAR(80) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `receipt_file` VARCHAR(80) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `admin_note` VARCHAR(500) NULL,
    `reviewed_by` INTEGER NULL,
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payment_requests_status_created_at_idx`(`status`, `created_at`),
    INDEX `payment_requests_user_id_status_idx`(`user_id`, `status`),
    INDEX `payment_requests_transaction_id_idx`(`transaction_id`),
    INDEX `payment_requests_method_id_idx`(`method_id`),
    INDEX `payment_requests_reviewed_by_idx`(`reviewed_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `member_access` (
    `user_id` INTEGER NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `expires_at` DATETIME(3) NULL,
    `granted_by` INTEGER NULL,
    `note` VARCHAR(255) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `member_access_granted_by_idx`(`granted_by`),
    INDEX `member_access_active_expires_at_idx`(`active`, `expires_at`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payment_requests` ADD CONSTRAINT `payment_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_requests` ADD CONSTRAINT `payment_requests_method_id_fkey` FOREIGN KEY (`method_id`) REFERENCES `payment_methods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_requests` ADD CONSTRAINT `payment_requests_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_access` ADD CONSTRAINT `member_access_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_access` ADD CONSTRAINT `member_access_granted_by_fkey` FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

