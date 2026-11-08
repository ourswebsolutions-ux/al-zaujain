-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `role` ENUM('user', 'consultant', 'admin') NOT NULL DEFAULT 'user',
    `status` ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    `email_verified_at` DATETIME(3) NULL,
    `chat_disabled` BOOLEAN NOT NULL DEFAULT false,
    `match_emails` BOOLEAN NOT NULL DEFAULT true,
    `match_frequency` ENUM('daily', 'weekly', 'off') NOT NULL DEFAULT 'weekly',
    `match_last_sent_at` DATETIME(3) NULL,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_status_idx`(`role`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `token_hash` CHAR(64) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sessions_user_id_idx`(`user_id`),
    INDEX `sessions_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`token_hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tokens` (
    `token_hash` CHAR(64) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `purpose` ENUM('verify_email', 'reset_password') NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,

    INDEX `tokens_user_id_purpose_idx`(`user_id`, `purpose`),
    PRIMARY KEY (`token_hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(100) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `name_ur` VARCHAR(100) NULL,
    `description` VARCHAR(500) NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `countries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 100,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `countries_name_key`(`name`),
    UNIQUE INDEX `countries_slug_key`(`slug`),
    INDEX `countries_category_id_idx`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `country_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `cities_slug_idx`(`slug`),
    UNIQUE INDEX `cities_country_id_slug_key`(`country_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `consultant_id` INTEGER NULL,
    `manage_token_hash` CHAR(64) NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `rejection_reason` VARCHAR(500) NULL,
    `verification_status` ENUM('not_submitted', 'pending', 'verified', 'rejected') NOT NULL DEFAULT 'not_submitted',
    `verification_note` VARCHAR(500) NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `featured_sort` INTEGER NOT NULL DEFAULT 100,
    `photo_public` BOOLEAN NOT NULL DEFAULT true,
    `is_demo` BOOLEAN NOT NULL DEFAULT false,
    `views` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `approved_at` DATETIME(3) NULL,
    `search_text` TEXT NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `display_name` VARCHAR(60) NOT NULL,
    `gender` ENUM('female', 'male') NOT NULL,
    `date_of_birth` DATE NOT NULL,
    `height_cm` INTEGER NULL,
    `marital_status` VARCHAR(60) NOT NULL,
    `mother_tongue` VARCHAR(40) NULL,
    `caste` VARCHAR(60) NULL,
    `nationality` VARCHAR(60) NULL,
    `origin_country` VARCHAR(100) NULL,
    `origin_city` VARCHAR(80) NULL,
    `profile_created_by` VARCHAR(40) NULL,
    `education_level` VARCHAR(60) NULL,
    `degree` VARCHAR(100) NULL,
    `institution` VARCHAR(120) NULL,
    `other_qualifications` TEXT NULL,
    `occupation` VARCHAR(100) NULL,
    `job_title` VARCHAR(100) NULL,
    `business_details` TEXT NULL,
    `monthly_income` VARCHAR(40) NULL,
    `employment_status` VARCHAR(40) NULL,
    `religion` VARCHAR(40) NULL,
    `sect` VARCHAR(40) NULL,
    `religious_practices` VARCHAR(40) NULL,
    `religious_details` TEXT NULL,
    `father_occupation` VARCHAR(100) NULL,
    `mother_occupation` VARCHAR(100) NULL,
    `brothers` INTEGER NULL,
    `sisters` INTEGER NULL,
    `family_status` VARCHAR(40) NULL,
    `family_background` TEXT NULL,
    `family_location` VARCHAR(120) NULL,
    `country_id` INTEGER NULL,
    `state` VARCHAR(80) NULL,
    `city` VARCHAR(80) NULL,
    `current_residence` VARCHAR(200) NULL,
    `permanent_residence` VARCHAR(200) NULL,
    `pref_age_min` INTEGER NULL,
    `pref_age_max` INTEGER NULL,
    `pref_height_min` INTEGER NULL,
    `pref_education` VARCHAR(100) NULL,
    `pref_profession` VARCHAR(100) NULL,
    `pref_caste` VARCHAR(60) NULL,
    `pref_country` VARCHAR(100) NULL,
    `pref_city` VARCHAR(80) NULL,
    `pref_marital_status` VARCHAR(60) NULL,
    `pref_expectations` TEXT NULL,
    `description` TEXT NULL,
    `contact_phone` VARCHAR(20) NULL,
    `contact_whatsapp` VARCHAR(20) NULL,
    `contact_email` VARCHAR(160) NULL,

    UNIQUE INDEX `profiles_manage_token_hash_key`(`manage_token_hash`),
    INDEX `profiles_status_gender_approved_at_idx`(`status`, `gender`, `approved_at`),
    INDEX `profiles_status_country_id_idx`(`status`, `country_id`),
    INDEX `profiles_status_verification_status_idx`(`status`, `verification_status`),
    INDEX `profiles_status_featured_featured_sort_idx`(`status`, `featured`, `featured_sort`),
    INDEX `profiles_city_idx`(`city`),
    INDEX `profiles_caste_idx`(`caste`),
    INDEX `profiles_date_of_birth_idx`(`date_of_birth`),
    INDEX `profiles_user_id_idx`(`user_id`),
    INDEX `profiles_consultant_id_idx`(`consultant_id`),
    INDEX `profiles_verification_status_idx`(`verification_status`),
    INDEX `profiles_contact_email_idx`(`contact_email`),
    FULLTEXT INDEX `profiles_search_text_idx`(`search_text`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profile_id` INTEGER NOT NULL,
    `file` VARCHAR(80) NOT NULL,
    `thumb` VARCHAR(80) NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `sort` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `profile_photos_file_key`(`file`),
    UNIQUE INDEX `profile_photos_thumb_key`(`thumb`),
    INDEX `profile_photos_profile_id_is_primary_sort_idx`(`profile_id`, `is_primary`, `sort`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cnic_documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profile_id` INTEGER NOT NULL,
    `front_file` VARCHAR(80) NOT NULL,
    `back_file` VARCHAR(80) NULL,
    `reviewed_by` INTEGER NULL,
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cnic_documents_profile_id_key`(`profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `display_name` VARCHAR(100) NOT NULL,
    `photo` VARCHAR(80) NULL,
    `title` VARCHAR(120) NULL,
    `bio` TEXT NULL,
    `phone` VARCHAR(30) NULL,
    `whatsapp` VARCHAR(20) NULL,
    `public_email` VARCHAR(160) NULL,
    `city` VARCHAR(80) NULL,
    `languages` VARCHAR(160) NULL,
    `experience_years` INTEGER NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT true,
    `perm_edit` BOOLEAN NOT NULL DEFAULT false,
    `perm_review` BOOLEAN NOT NULL DEFAULT true,
    `perm_contact` BOOLEAN NOT NULL DEFAULT true,
    `perm_chat` BOOLEAN NOT NULL DEFAULT true,
    `perm_proposals` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `consultants_user_id_key`(`user_id`),
    UNIQUE INDEX `consultants_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_proposals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `consultant_id` INTEGER NOT NULL,
    `profile_a_id` INTEGER NOT NULL,
    `profile_b_id` INTEGER NOT NULL,
    `note` VARCHAR(500) NULL,
    `status` ENUM('suggested', 'shared', 'accepted', 'declined') NOT NULL DEFAULT 'suggested',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `match_proposals_consultant_id_idx`(`consultant_id`),
    UNIQUE INDEX `match_proposals_profile_a_id_profile_b_id_key`(`profile_a_id`, `profile_b_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_low` INTEGER NOT NULL,
    `user_high` INTEGER NOT NULL,
    `last_message_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `conversations_user_high_idx`(`user_high`),
    INDEX `conversations_last_message_at_idx`(`last_message_at`),
    UNIQUE INDEX `conversations_user_low_user_high_key`(`user_low`, `user_high`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversation_id` INTEGER NOT NULL,
    `sender_id` INTEGER NOT NULL,
    `body` TEXT NOT NULL,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `messages_conversation_id_id_idx`(`conversation_id`, `id`),
    INDEX `messages_conversation_id_read_at_idx`(`conversation_id`, `read_at`),
    INDEX `messages_sender_id_idx`(`sender_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_blocks` (
    `blocker_id` INTEGER NOT NULL,
    `blocked_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_blocks_blocked_id_idx`(`blocked_id`),
    PRIMARY KEY (`blocker_id`, `blocked_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `matched_profile_id` INTEGER NOT NULL,
    `score` INTEGER NOT NULL,
    `sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `match_notifications_matched_profile_id_idx`(`matched_profile_id`),
    UNIQUE INDEX `match_notifications_user_id_matched_profile_id_key`(`user_id`, `matched_profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_templates` (
    `template_key` VARCHAR(60) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `subject` VARCHAR(200) NOT NULL,
    `body` TEXT NOT NULL,
    `variables` VARCHAR(200) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`template_key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `template` VARCHAR(60) NULL,
    `recipient` VARCHAR(160) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `status` ENUM('sent', 'failed', 'skipped') NOT NULL,
    `error` VARCHAR(300) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `email_log_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `setting_key` VARCHAR(64) NOT NULL,
    `value` TEXT NULL,

    PRIMARY KEY (`setting_key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faqs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question` VARCHAR(255) NOT NULL,
    `answer` TEXT NOT NULL,
    `answer_ur` TEXT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enquiries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `profile_for` VARCHAR(100) NULL,
    `city` VARCHAR(100) NULL,
    `message` TEXT NULL,
    `profile_code` VARCHAR(20) NULL,
    `handled` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `enquiries_handled_id_idx`(`handled`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actor_id` INTEGER NULL,
    `action` VARCHAR(60) NOT NULL,
    `target` VARCHAR(120) NULL,
    `detail` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_log_actor_id_idx`(`actor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rate_limits` (
    `rl_key` CHAR(64) NOT NULL,
    `hits` INTEGER NOT NULL,
    `reset_at` BIGINT NOT NULL,

    PRIMARY KEY (`rl_key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tokens` ADD CONSTRAINT `tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `countries` ADD CONSTRAINT `countries_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cities` ADD CONSTRAINT `cities_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_consultant_id_fkey` FOREIGN KEY (`consultant_id`) REFERENCES `consultants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile_photos` ADD CONSTRAINT `profile_photos_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cnic_documents` ADD CONSTRAINT `cnic_documents_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cnic_documents` ADD CONSTRAINT `cnic_documents_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultants` ADD CONSTRAINT `consultants_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_proposals` ADD CONSTRAINT `match_proposals_consultant_id_fkey` FOREIGN KEY (`consultant_id`) REFERENCES `consultants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_proposals` ADD CONSTRAINT `match_proposals_profile_a_id_fkey` FOREIGN KEY (`profile_a_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_proposals` ADD CONSTRAINT `match_proposals_profile_b_id_fkey` FOREIGN KEY (`profile_b_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_user_low_fkey` FOREIGN KEY (`user_low`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_user_high_fkey` FOREIGN KEY (`user_high`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_blocks` ADD CONSTRAINT `user_blocks_blocker_id_fkey` FOREIGN KEY (`blocker_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_blocks` ADD CONSTRAINT `user_blocks_blocked_id_fkey` FOREIGN KEY (`blocked_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_notifications` ADD CONSTRAINT `match_notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_notifications` ADD CONSTRAINT `match_notifications_matched_profile_id_fkey` FOREIGN KEY (`matched_profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_log` ADD CONSTRAINT `activity_log_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
