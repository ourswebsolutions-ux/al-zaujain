-- Boost packages add no credits; credit packages still need at least one.
ALTER TABLE `credit_packages` DROP CONSTRAINT `credit_packages_sane`;
ALTER TABLE `credit_packages` ADD CONSTRAINT `credit_packages_sane` CHECK (((`kind` = 'credits' AND `credits` > 0) OR (`kind` = 'boost' AND `credits` = 0 AND `days` IS NOT NULL)) AND `price` >= 0 AND (`was_price` IS NULL OR `was_price` >= `price`));
