-- The questionnaire now asks each question only when it applies (lib/form-conditions.js).
ALTER TABLE `profiles`
  MODIFY `children_details` VARCHAR(200) NULL,
  ADD COLUMN `has_children` VARCHAR(10) NULL,
  ADD COLUMN `children_count` INT NULL,
  ADD COLUMN `children_living` VARCHAR(80) NULL,
  ADD COLUMN `existing_wives` INT NULL,
  ADD COLUMN `second_marriage_intent` VARCHAR(80) NULL,
  ADD COLUMN `existing_family_situation` TEXT NULL,
  ADD COLUMN `previous_marriage_duration` VARCHAR(80) NULL,
  ADD COLUMN `divorce_details` TEXT NULL,
  ADD COLUMN `widowed_details` TEXT NULL,
  ADD COLUMN `previous_spouse_details` TEXT NULL,
  ADD COLUMN `current_studies` VARCHAR(150) NULL,
  ADD COLUMN `owns_property` VARCHAR(10) NULL,
  ADD COLUMN `property_details` TEXT NULL,
  ADD COLUMN `siblings_details` TEXT NULL,
  ADD COLUMN `has_cultural_prefs` VARCHAR(10) NULL;

-- Existing answers stay visible: the new "gate" questions are filled in from what was already given.
-- Nothing is deleted.
UPDATE `profiles` SET `has_children` = 'No'
WHERE `marital_status` <> 'Never married' AND `children_details` IS NOT NULL
  AND LOWER(TRIM(`children_details`)) IN ('no', 'none', 'nil', 'no kids', 'no kid', 'no children', 'no child', 'not any', '0', 'کوئی نہیں', 'نہیں');
UPDATE `profiles` SET `has_children` = 'Yes'
WHERE `marital_status` <> 'Never married' AND `children_details` IS NOT NULL AND `has_children` IS NULL;
-- "1 son", "2 daughters": a single number at the start is the count.
UPDATE `profiles` SET `children_count` = CAST(REGEXP_SUBSTR(`children_details`, '^[0-9]+') AS UNSIGNED)
WHERE `has_children` = 'Yes' AND `children_details` REGEXP '^[0-9]+[^0-9]*$' AND CAST(REGEXP_SUBSTR(`children_details`, '^[0-9]+') AS UNSIGNED) BETWEEN 1 AND 20;
UPDATE `profiles` SET `has_cultural_prefs` = 'Yes' WHERE `pref_cultural` IS NOT NULL AND TRIM(`pref_cultural`) <> '';
