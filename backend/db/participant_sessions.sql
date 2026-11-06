-- Sessão de participante, separada de `sessions` (admin) para não misturar
-- os dois domínios de identidade e permitir login simultâneo dos dois.
CREATE TABLE IF NOT EXISTS `participant_sessions` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `token_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `participant_account_id` bigint UNSIGNED NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_participant_sessions_token_hash` (`token_hash`),
  KEY `idx_participant_sessions_account_id` (`participant_account_id`),
  CONSTRAINT `fk_participant_sessions_account_id` FOREIGN KEY (`participant_account_id`)
    REFERENCES `participant_accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
