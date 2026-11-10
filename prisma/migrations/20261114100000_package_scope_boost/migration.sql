-- AlterTable
ALTER TABLE `credit_packages` ADD COLUMN `days` INTEGER NULL,
    ADD COLUMN `kind` ENUM('credits', 'boost') NOT NULL DEFAULT 'credits',
    ADD COLUMN `scope` ENUM('local', 'foreign') NOT NULL DEFAULT 'local',
    ADD COLUMN `super_boost` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `was_price` DECIMAL(12, 2) NULL;

-- AlterTable
ALTER TABLE `payment_requests` ADD COLUMN `boost_days` INTEGER NULL,
    ADD COLUMN `package_kind` VARCHAR(10) NULL,
    ADD COLUMN `package_scope` VARCHAR(10) NULL,
    ADD COLUMN `super_boost` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `boost_rank` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `boosted_until` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `foreign_access` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `profiles_boost_rank_boosted_until_idx` ON `profiles`(`boost_rank`, `boosted_until`);


-- Credits bought before packages had a Local / Foreign scope always opened overseas profiles too.
-- Members who already bought or were given credits keep that.
UPDATE `users` SET `foreign_access` = true
WHERE `id` IN (SELECT DISTINCT `user_id` FROM `credit_transactions` WHERE `kind` IN ('purchase', 'adjustment') AND `amount` > 0);

-- A boost runs for whole days and never goes below zero.
ALTER TABLE `credit_packages` ADD CONSTRAINT `credit_packages_days_check` CHECK (`days` IS NULL OR (`days` BETWEEN 1 AND 365));
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_boost_rank_check` CHECK (`boost_rank` BETWEEN 0 AND 2);
