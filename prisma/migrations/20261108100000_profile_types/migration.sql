-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `access_type` ENUM('public', 'paid', 'premium') NOT NULL DEFAULT 'paid',
    ADD COLUMN `extra_info` TEXT NULL,
    ADD COLUMN `import_hash` CHAR(64) NULL,
    ADD COLUMN `source` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    MODIFY `status` ENUM('pending', 'approved', 'rejected', 'hidden') NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX `profiles_status_access_type_idx` ON `profiles`(`status`, `access_type`);

-- CreateIndex
CREATE INDEX `profiles_import_hash_idx` ON `profiles`(`import_hash`);

