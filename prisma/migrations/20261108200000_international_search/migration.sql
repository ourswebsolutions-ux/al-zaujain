-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `marriage_location` VARCHAR(120) NULL;

-- CreateTable
CREATE TABLE `castes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(60) NOT NULL,
    `name_ur` VARCHAR(60) NULL,
    `popular` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `sort` INTEGER NOT NULL DEFAULT 100,

    UNIQUE INDEX `castes_name_key`(`name`),
    INDEX `castes_active_popular_idx`(`active`, `popular`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `profiles_nationality_idx` ON `profiles`(`nationality`);

-- CreateIndex
CREATE INDEX `profiles_height_cm_idx` ON `profiles`(`height_cm`);

-- Starting caste / biradari list. Administrators manage it under Castes.
INSERT IGNORE INTO `castes` (`name`, `name_ur`, `popular`, `sort`) VALUES
('Jutt', 'جٹ', true, 10),
('Arain', 'آرائیں', true, 11),
('Rajput', 'راجپوت', true, 12),
('Syed', 'سید', true, 13),
('Sheikh', 'شیخ', true, 14),
('Mughal', 'مغل', true, 15),
('Butt', 'بٹ', true, 16),
('Awan', 'اعوان', true, 17),
('Pathan', 'پٹھان', true, 18),
('Gujjar', 'گجر', true, 19),
('Abbasi', 'عباسی', false, 100),
('Afridi', 'آفریدی', false, 100),
('Ansari', 'انصاری', false, 100),
('Bajwa', 'باجوہ', false, 100),
('Baloch', 'بلوچ', false, 100),
('Bhatti', 'بھٹی', false, 100),
('Chaudhry', 'چوہدری', false, 100),
('Chattha', 'چٹھہ', false, 100),
('Cheema', 'چیمہ', false, 100),
('Dogar', 'ڈوگر', false, 100),
('Gill', 'گل', false, 100),
('Hashmi', 'ہاشمی', false, 100),
('Jatoi', 'جتوئی', false, 100),
('Kakazai', 'ککےزئی', false, 100),
('Kamboh', 'کمبوہ', false, 100),
('Kashmiri', 'کشمیری', false, 100),
('Khan', 'خان', false, 100),
('Khattak', 'خٹک', false, 100),
('Khokhar', 'کھوکھر', false, 100),
('Kiani', 'کیانی', false, 100),
('Lodhi', 'لودھی', false, 100),
('Malik', 'ملک', false, 100),
('Memon', 'میمن', false, 100),
('Mirza', 'مرزا', false, 100),
('Niazi', 'نیازی', false, 100),
('Qureshi', 'قریشی', false, 100),
('Rana', 'رانا', false, 100),
('Sandhu', 'سندھو', false, 100),
('Siddiqui', 'صدیقی', false, 100),
('Sial', 'سیال', false, 100),
('Tarar', 'تارڑ', false, 100),
('Virk', 'ورک', false, 100),
('Warraich', 'وڑائچ', false, 100),
('Yousafzai', 'یوسفزئی', false, 100),
('Other', 'دیگر', false, 100);

-- Existing installations only (a new one is filled by the seeder, which runs when no category exists yet).
-- Canada and Australia had no category, so their proposals had no listing page of their own.
INSERT IGNORE INTO `categories` (`slug`, `name`, `name_ur`, `description`, `sort`, `active`)
SELECT 'other-countries', 'Canada, Australia & more', 'کینیڈا، آسٹریلیا اور دیگر', 'Proposals from Pakistani families in Canada, Australia and other countries.', 5, true
FROM DUAL WHERE EXISTS (SELECT 1 FROM `categories`);
UPDATE `countries` SET `category_id` = (SELECT `id` FROM `categories` WHERE `slug` = 'other-countries')
WHERE `category_id` IS NULL AND `name` IN ('Canada', 'Australia');

INSERT IGNORE INTO `countries` (`name`, `slug`, `sort`, `category_id`) SELECT 'New Zealand', 'new-zealand', 2, `id` FROM `categories` WHERE `slug` = 'other-countries';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Auckland', 'auckland' FROM `countries` WHERE `name` = 'New Zealand';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Wellington', 'wellington' FROM `countries` WHERE `name` = 'New Zealand';
INSERT IGNORE INTO `countries` (`name`, `slug`, `sort`, `category_id`) SELECT 'Malaysia', 'malaysia', 3, `id` FROM `categories` WHERE `slug` = 'other-countries';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Kuala Lumpur', 'kuala-lumpur' FROM `countries` WHERE `name` = 'Malaysia';
INSERT IGNORE INTO `countries` (`name`, `slug`, `sort`, `category_id`) SELECT 'Turkey', 'turkey', 4, `id` FROM `categories` WHERE `slug` = 'other-countries';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Istanbul', 'istanbul' FROM `countries` WHERE `name` = 'Turkey';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Ankara', 'ankara' FROM `countries` WHERE `name` = 'Turkey';

-- More cities for city-wise search. Existing cities are left untouched.
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Abbottabad', 'abbottabad' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Mardan', 'mardan' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Sahiwal', 'sahiwal' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Okara', 'okara' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Jhang', 'jhang' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Sheikhupura', 'sheikhupura' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Gujrat', 'gujrat' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Kasur', 'kasur' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Chiniot', 'chiniot' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Mianwali', 'mianwali' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Khanewal', 'khanewal' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Vehari', 'vehari' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Larkana', 'larkana' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Nawabshah', 'nawabshah' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Mirpur (AJK)', 'mirpur-ajk' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Muzaffarabad', 'muzaffarabad' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Jhelum', 'jhelum' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Attock', 'attock' FROM `countries` WHERE `name` = 'Pakistan';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Luton', 'luton' FROM `countries` WHERE `name` = 'United Kingdom';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Leicester', 'leicester' FROM `countries` WHERE `name` = 'United Kingdom';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Sheffield', 'sheffield' FROM `countries` WHERE `name` = 'United Kingdom';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Slough', 'slough' FROM `countries` WHERE `name` = 'United Kingdom';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Nottingham', 'nottingham' FROM `countries` WHERE `name` = 'United Kingdom';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Oldham', 'oldham' FROM `countries` WHERE `name` = 'United Kingdom';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'New Jersey', 'new-jersey' FROM `countries` WHERE `name` = 'United States';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Atlanta', 'atlanta' FROM `countries` WHERE `name` = 'United States';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'San Francisco', 'san-francisco' FROM `countries` WHERE `name` = 'United States';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Montreal', 'montreal' FROM `countries` WHERE `name` = 'Canada';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Ottawa', 'ottawa' FROM `countries` WHERE `name` = 'Canada';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Edmonton', 'edmonton' FROM `countries` WHERE `name` = 'Canada';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Brisbane', 'brisbane' FROM `countries` WHERE `name` = 'Australia';
INSERT IGNORE INTO `cities` (`country_id`, `name`, `slug`) SELECT `id`, 'Perth', 'perth' FROM `countries` WHERE `name` = 'Australia';
