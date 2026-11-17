-- Profiles now show the full name publicly (the bureau's decision), not just the first word.
ALTER TABLE `profiles` MODIFY `display_name` VARCHAR(100) NOT NULL;

-- The search text starts with the old first name; swap it for the full name first, then the name itself.
UPDATE `profiles`
SET `search_text` = CONCAT(TRIM(`full_name`), SUBSTRING(`search_text`, CHAR_LENGTH(`display_name`) + 1))
WHERE `search_text` LIKE CONCAT(`display_name`, '%');

UPDATE `profiles` SET `display_name` = LEFT(TRIM(`full_name`), 100) WHERE TRIM(`full_name`) <> '';

-- The seeded FAQ answer said only a first name is shown.
UPDATE `faqs`
SET `answer` = REPLACE(`answer`, 'Public proposals show a first name and general details only. Your full name, contact details and CNIC stay private.', 'Public proposals show the candidate’s name and general details only. Contact details and CNIC stay private.');
