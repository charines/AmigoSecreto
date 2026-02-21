-- MySQL schema for AmigoSecreto
-- Compatible with MySQL 5.7+ / MariaDB 10.x

CREATE TABLE IF NOT EXISTS `groups` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_email` VARCHAR(255) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_groups_owner_email` (`owner_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `participants` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `secret_friend_name` VARCHAR(255) NOT NULL,
  `viewed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_participants_group_id` (`group_id`),
  CONSTRAINT `fk_participants_group_id`
    FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
