-- MySQL schema for AmigoSecreto (admin, groups, invites, draw with encryption)
-- Compatible with MySQL 5.7+ / MariaDB 10.x

CREATE TABLE IF NOT EXISTS `admins` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_admins_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `groups` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `draw_date` DATETIME NULL,
  `budget_limit` DECIMAL(10,2) NULL,
  `status` ENUM('open','drawn','cancelled') NOT NULL DEFAULT 'open',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_groups_admin_id` (`admin_id`),
  CONSTRAINT `fk_groups_admin_id`
    FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `participants` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `status` ENUM('invited','link_clicked','confirmed','token_sent','revealed') NOT NULL DEFAULT 'invited',
  `invite_token` VARCHAR(64) NOT NULL,
  `reveal_token` VARCHAR(64) NULL,
  `invite_sent_at` DATETIME NULL,
  `invite_clicked_at` DATETIME NULL,
  `confirmed_at` DATETIME NULL,
  `token_sent_at` DATETIME NULL,
  `revealed_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_participants_group_id` (`group_id`),
  KEY `idx_participants_invite_token` (`invite_token`),
  KEY `idx_participants_reveal_token` (`reveal_token`),
  CONSTRAINT `fk_participants_group_id`
    FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `draw_results` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT UNSIGNED NOT NULL,
  `giver_id` BIGINT UNSIGNED NOT NULL,
  `encrypted_payload` MEDIUMTEXT NOT NULL,
  `iv_b64` VARCHAR(255) NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_draw_giver_id` (`giver_id`),
  KEY `idx_draw_group_id` (`group_id`),
  CONSTRAINT `fk_draw_group_id`
    FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_draw_giver_id`
    FOREIGN KEY (`giver_id`) REFERENCES `participants`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
