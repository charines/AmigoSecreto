-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 24, 2026 at 10:35 PM
-- Server version: 8.0.45-36
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `charl543_secretsanta`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `name`, `email`, `password_hash`, `created_at`) VALUES
(2, 'chales', 'charles@inmade.com.br', '$2y$10$pYBoiCql09AfB/oiC3u5xO1osvzAqY3JhEEk/lC6qSDLXdiLq3tya', '2026-02-23 20:18:25'),
(3, 'Jonatan', 'jonatan.canuto@dsop.com.br', '$2y$10$Q1CNaFDdwx388gR.PeaWSuJdlONjuTd.XKnv5jxmemRm5INECa3dm', '2026-02-23 21:33:16'),
(4, 'charles dsop', 'charles.rodrigues@dsop.com.br', '$2y$10$1QUIwsWrHWg.IlDYWDxgG.xiq4I64V0OkuJz9L7079B8XoQD.AAYa', '2026-03-10 21:16:39');

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` bigint UNSIGNED NOT NULL,
  `group_id` bigint UNSIGNED NOT NULL,
  `draw_id` bigint UNSIGNED NOT NULL,
  `sender_role` enum('giver','receiver') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `texto` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draw_results`
--

CREATE TABLE `draw_results` (
  `id` bigint UNSIGNED NOT NULL,
  `group_id` bigint UNSIGNED NOT NULL,
  `giver_id` bigint UNSIGNED NOT NULL,
  `encrypted_payload` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `iv_b64` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_raw` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receiver_id` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `draw_results`
--

INSERT INTO `draw_results` (`id`, `group_id`, `giver_id`, `encrypted_payload`, `iv_b64`, `token_hash`, `token_raw`, `receiver_id`, `created_at`) VALUES
(7, 5, 22, 'y92s3HmoVDrQBQSVt+MS8BN5jm0ChP5CZg==', 'GNqZNBmoUed9lQaR', '67c94b3c40e692e3f7aefbd16193d054b3687948de2a5c4f7f8505facc95ed5c', NULL, NULL, '2026-02-25 01:18:59'),
(8, 5, 19, 'OydJ9DsExj/gZz3O3t44yp1bDMC4Hlp9ZNE=', '/vL2uGoYYztVABEk', '34951321ab8385d3bf1558978bcbebb63c23d42b65295f6b08a709682d85a871', NULL, NULL, '2026-02-25 01:18:59'),
(9, 5, 23, 'Id739RJg+4J9BHfm02RNpcApD8AZRC+X', 'zJfcr1miPiAttxfx', '586158d8775287d26b6057314a0a5448e7ac908098b54c35a9ae7eab37ebfd2d', NULL, NULL, '2026-02-25 01:18:59'),
(10, 5, 21, 'BvAar+3Fag4bkiRii4D1hC42w9qSPg==', 'ygMNPsuPIB7vw4j6', '6ff4cf550791bf68e82932c11ee2a542345382ceee4bfdcd23dec3f5fc13d63b', NULL, NULL, '2026-02-25 01:18:59'),
(11, 5, 20, '9XXimYSoQ0D72u6A7ljrigdPDKo=', '9iWRT2RaascN2+hE', 'c276ac4f65cf194e9a43af556818117a6a5ce7a179dcf87cbc58ea99bc3a271d', NULL, NULL, '2026-02-25 01:18:59'),
(12, 5, 24, 'gFo4EN/kQCJCXLTMb5TPPX2S4/BvWtnZGGs=', 'g36Z7Tb2UxH6nyGC', '8a3dfd178630a21c240dfd781b7854efd93c8640ea8cc657da028aa8fe1a3d6c', NULL, NULL, '2026-02-25 01:18:59'),
(16, 9, 29, '+ZePEfZrj3sVkU0A26B4PfMo6TXoVtk8', 'ZP63cSI8zfxol9g7', 'e55efa1c2f58aa4f675d73d378e5bc53c19b0a397827b181d3ef4b07a78b1e6e', 'DPh2mSLRlbQsW9zeqHCt_WrG24U8uWeW', NULL, '2026-02-25 03:08:56'),
(17, 9, 28, 'C/6ieyvyeNKPN1Wv04u+FBAROG+s7mlO', 'rX26HoIPwZMdvf7w', 'b47992f8aa95ca5d862b5997f82e3f78ce9b7f2be462b4cb0c81e35da25a488d', 'pZKvcDRe6M4r2MEDJIOIlSbhhpyJUG9P', NULL, '2026-02-25 03:08:56'),
(18, 9, 30, 'NNC7WELhMG+B4Qd+ZnnLgHsKLGmTBAXR', '0AYY/bJv/rHvMoif', '8351906011cc75b5ceaa5b22998c03b2d5d094ddcd587bc941fad97841c44cac', '9u1d2wTbHo3AZRE0Mk3_QWNNKGtorxJy', NULL, '2026-02-25 03:08:56'),
(19, 10, 31, 'zM0ZyA2dcTEwNtlzlRXdxQ7ECd1C7gLJ', 'ajlmZc5EwoNbzjsa', '0d2a21605d0f624769b6ead25bfa449a6b66a9e0f5982962d1832e5ae07c8479', 'SoIwjJtK5jgUprA2mXKBu-9SoQVvRgQb', NULL, '2026-02-25 11:18:02'),
(20, 10, 32, '+hkoY0nlG6jJsI5SbxfbcTUsTBoZ7NEO', 'JikwNkH+GSH6Ljdq', '0bcc03a7e4476cf793128b28972f86fdc8066a7febe32d594999ef2a5d945912', '1ZZVzZg1EIziUF6RUCxf4J2sqcNkJ4Mg', NULL, '2026-02-25 11:18:02'),
(21, 10, 33, 'lm6ihYcG2puvww9JROG9CCYYnoRAgLw=', 'uIMwQjqk9yGiRh3a', 'f0e03e606d5529dd0b1e4b3d840cbaf2a251f2f2a4cfab10429c82d9b2650814', 'm3c0jq27Rtz0fJ6GrOUo5bu3id5lhZSn', NULL, '2026-02-25 11:18:02'),
(22, 11, 35, 'o/F4NiZmoUxhJc9uzz73XyUt/GSQI9w=', 'vmnV2Eh9pkkyqpgg', '0827295581798c0bdc35218b1922995af1a28c68b74d392e0d342237cc366769', 'wraI5YjiLFEA6v1aDD1CXEINebBRCUtH', NULL, '2026-02-25 18:28:16'),
(23, 11, 34, 'G89IG6vhRk7OwHgN/Hb8Fk2Q0S+UueI9zK45k1Y=', 'v1gUfWEUVD/uMNw8', '67e5d32a5e7089e8cb3d2236201de8db621dd347ad512cdc5ddbc07050d2ff26', 'nISVZov5qWOQHvULQX68CK6Qn6_1sxDp', NULL, '2026-02-25 18:28:16'),
(24, 11, 36, 'oesyROxEF4AAAWVdeIGcA2ui+fVe6ZU=', '7aSl9JIPuroA9q/+', '496d4fb30d809859afe5bd5266f3444188b0d7ce8966a355bdf5e5f3f863598f', 'o6ifmxZ3g0eayFXf9uV-2u5V31Ye1UWm', NULL, '2026-02-25 18:28:16'),
(25, 13, 44, 'nOeTpbgjIEtCqOh1AZJkrPrSs97bR4X5obbFI8uk3GumJhQTF0JELg==', '6ST1FgdVA+DP8eDG', 'e99279876032acad8d568f67dae888e6e9fb67fc57dbc69eb482f75630b7d9bf', 'Jroi9ZMKTCqJ-_R_ZKs_S11GXnFJqlnz', NULL, '2026-03-12 17:42:06'),
(26, 13, 46, '5H4qcOB2Hl/83w4sihp7xGjZrZ4GTCA=', 'CisOV8eW5zX7a5KM', '444ff09a2afa40ea06749f61747fd1618ec4a7e60a9718260d2e05ecbdd88e47', 'w5rFX3aXMKYGC6uH-oIoNZ7CWN12AA6I', NULL, '2026-03-12 17:42:06'),
(27, 13, 47, 'gU3R9xa/9O5ZweTCR802AVqCSS7o5I90oPFOBZmS', 'Uxxfgdxu5bsKUkOL', '473bcfbb05807784d5fe4bb3e2ea07911fa3b673d2c306a5f983c0f4c60ccaaa', 'HpSPwyjFybU63aAQ8trp3ls4325tuLQM', NULL, '2026-03-12 17:42:06'),
(28, 13, 48, '9e2Xz33xmxWSJKERIIt5iR88Xj3plzeu8GZsdQ==', 'xfVDS0uy//ENnXqw', 'be99a56bea978366395d089aded8eef7e9ae65c547b52777d4e52329c0426fa9', 'aiAEDnHBSIV6TAe81v-7XRzWkMiQa4Po', NULL, '2026-03-12 17:42:06'),
(29, 13, 45, '4AuXcBccwDkjWn29XT3pPA3r0wc3QaUMhfu1HbIx', 'TiG2SdMlPtIUbnq5', '9d319d0fcfa49d7e1ffdb2587c2e82103d5b1ce71992114200225bca2fb8d1aa', 'iTHvROZTQ9FyUJjxqtIDNrIKnawDtddY', NULL, '2026-03-12 17:42:06'),
(30, 13, 49, 'msk1bMSob0nMDm7Dx2RO12DLrGlCrfDiDSAw/aImog==', 'o19eOypRLo2fpi4B', 'fd9125a84a07c091ed25dc3d9799791a6ee3f754cf9794bcae1b220e5077fad9', 'L1d0qaPe_bdZN8jgjwOFxe5WMjTHV2Tc', NULL, '2026-03-12 17:42:06'),
(31, 12, 65, '5lZ5MsJDCXjxCu+u1o15xVG+BHaIkrjbZo82DOkr/tAEoJQ=', 'i/p3Nfa5uI/XlDfN', 'a0687e888a8479cd528e1cb3b48c680a66dc44f40000fc515dd53a4ac7fe550b', 's0H8QQe7IH15XThTBYBHpFmIWeF2YefC', NULL, '2026-03-24 17:18:23'),
(32, 12, 59, '25DbSFRpORXc8QaYa/1ffkLTKm3gA56W9lNmLfcYGZYXWrUcpYc=', 'dHCqGtMRMFUZycmi', '2ca036d89f3abb7161dd74eeec34c1236a7b82ab92669d8a884be9e4f7934a7c', 'rvLl0FTAAUUwdNYUJyFHBVva24Emi6yZ', NULL, '2026-03-24 17:18:23'),
(33, 12, 64, 'Pfagx/NJDerRhRxQyFy4GQJhR4M9DhJP7G5hjJ0cQeewvQ==', 'bWgxAZrtbxctPkAU', '08d2956f957c62dc5af89c82b8aa0bf02008824949e09acc500c794d40811dd4', '7lSJm5fFAAOerV0pJAe8-1mv1rdprC2_', NULL, '2026-03-24 17:18:23'),
(34, 12, 50, 'p99Hy8p8ZAX4uRFhuXoFNt0kEew=', 'LC31TtwlpCejOjZr', '728e86f0cc768493627bd37110d2a8949dbf90669c5ba988bc4817acad2f7958', 'KyIKCyJyPZFmvIOsOwUBroI3qPWF6Co2', NULL, '2026-03-24 17:18:23'),
(35, 12, 37, 'DLIpjCanHkSd4r8Z+FMn0TxCDf+Rvq7ZZ/H86B28udvR/jLngSUVSuNh', 'c6GtJjMccW48oqdV', 'abcff98be6578c3d6afab43cb79286e8b208be6b4363f4ade098242bd0ee3988', 'STW77-nVu3-Uo0-McQE8qgjBUH4ySjSI', NULL, '2026-03-24 17:18:23'),
(36, 12, 61, 'hJFYSfW61kZDn4WVJu0SmMSpDg7Nxv4/pHpYVYscZNPk0zhYmD4=', 'GyAgL6rJpRjCbI5r', '644a95458bb5125a93085a35de5d13d14beba2ac4d4cebda9c302a13238d91c4', 'cvaySV8OAxsnZnh8Z4zt6zU8RrJ-Kr5L', NULL, '2026-03-24 17:18:23'),
(37, 12, 55, '1fFv9gJNXMwBgDwA/AecEtHOy/0vvfAQtUNc//3SCVY=', '9iuSQ/+E1UXduScm', '9fb4c1ea045c3f1ab12704fdba1e2bd17f8ec9d3db1c1bb0f3c3fee8957bc0ec', '8hQX-FpCUVMd0DfoU3YH9nsMwe14zAOf', NULL, '2026-03-24 17:18:23'),
(38, 12, 62, 'nPJG6Z/eYs3TQHoJ2SG3Au7jP/6IBDD8HZW1z4gpZA==', 'K1lDaWURY+vuDIMp', 'c402f3b5154ac4935ce12c8ccce6e747dc93b127a371a802398e578e889061a5', '5wjVB-hbDtKAJMMUGlPIDUHhtnlHdnVR', NULL, '2026-03-24 17:18:23'),
(39, 12, 42, 'qJhzTf9W6oPj16rgPzXIiADa2AWz7JC+1MqQF3j24btdZbITDQ==', 'l7LlYSlxL2m9zDze', '5c6dbdad583bb217fce8cbd653810880e3f8794dc983dbd427fb328586296dd3', 'KJ-_vT4auDqePYWpFkb-RKW8Xbv8-UpE', NULL, '2026-03-24 17:18:23'),
(40, 12, 53, 'wy6HpyGCbD8qzdHjYtBc1w2oFIvUN20lLtMSU6w=', 'u7MdQ+CO/41wq2pW', '23cb7c8483acf9c49bf7148121a7811ced25e48b002a9c122e9eff3d3dde45a1', 'jJlrYqZ6U1j5pqy202ywMG5eL1S4KlIX', NULL, '2026-03-24 17:18:23'),
(41, 12, 58, 'gMJ2GJKwCna+HdgzIVoXf+xnD4ut3CoXHBo=', 'xhp6xVy6DZQcoFEj', '2f33dd864c2f885c929b8ca9e17fafcedea5d231a193b91e66cecc751cbedaba', '-zoWvpqQXHxXQPiORUzuHsUlDTzuBXj8', NULL, '2026-03-24 17:18:23'),
(42, 12, 63, 'oLFdvyIvWFpilrF7vd5s5FkWx7pU2MIy8MttaKw=', 'i8iGsgpYY+owMp+d', 'cd18c9b469672252069a8b97828b7eba62c65d0a5e4624553cdf890dbc988599', 'nEe4-qR8QrSrses6BfewVo4aj7DR7zHF', NULL, '2026-03-24 17:18:23'),
(43, 12, 54, '8nhN74ulLBLv9QVGb3ur0/fYNvyEo8nkC7lPr6tv', 'DxD/cO1aUfOuScpr', '4c5a3337c71989ca68fa141e60a294d12ef5f2f617b45085ff03c8ee7a4ce51c', 'Kvlp1bXK3kQfdNu3HW1zbVK_UUBqYIql', NULL, '2026-03-24 17:18:23'),
(44, 12, 52, 'oMzy0gLKBPv2tkV9uDU0Cxji2g==', 'xNX2xInkHTRn2fL7', '7800551ad4faf07e73fe8eca43d16992767c5b66901503be0b3d11e535f75f17', 'wAiGYqkvoRNp81amXnSp0IgUAb71rutB', NULL, '2026-03-24 17:18:23'),
(45, 12, 39, 'MLvxPVnFXrBPUtC2hWsKDCyfYv38', 'jZiv0ckda1zwtgmb', '6353e6fc433d772a33a420825b5a65067a666b6c28fea0fd6390e1c71cfbe26b', 'HS1LUkp_EsJ8siGNnegzwhH7J_y-Wb1O', NULL, '2026-03-24 17:18:23'),
(46, 12, 38, 'n3pNW7yUl1Tu8cKDfsM3r/3h2LV4Bml/ltscA6/spDJN8xd/T6BXS1dt', 'jmSkHa+mw/Qzus3U', 'af9abe026e6d597e2ef0b2a441f3d3f2988d0cff5b436e1df3c94df936dd797d', '5MBKl8RQ-29nYvdZsUNXKZhsdhshf5Mk', NULL, '2026-03-24 17:18:23'),
(47, 12, 57, 'ssv26L1F0a7hT0dblv5ELTtLHOEQ3crAjnF9HN9SLYWKcKE=', 'qa2MSYXLnCYPqaQZ', '49e0a226ddb2e2b93b900f9105387f553cf4231ddc955c36b343cfa7b878d00d', 'yGoL2o1gqEVWMcsFBp07pZKSgVU2Crdf', NULL, '2026-03-24 17:18:23'),
(48, 12, 60, 'tYB15oYbrNFmLjNxwocLGRb1ElWjHLBAMoQ=', 'NBmu42FU6PHssVm3', 'f7b23672471ee219e2c4046977edadbea641334b9ef7f2466a749f9c085fa5b6', 'NgcuNfbxtgpJHD7fcjjL7WNVIhp3Uj5C', NULL, '2026-03-24 17:18:23');

-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

CREATE TABLE `groups` (
  `id` bigint UNSIGNED NOT NULL,
  `admin_id` bigint UNSIGNED NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `draw_date` datetime DEFAULT NULL,
  `budget_limit` decimal(10,2) DEFAULT NULL,
  `status` enum('open','drawn','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `dharma_code` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `groups`
--

INSERT INTO `groups` (`id`, `admin_id`, `title`, `description`, `draw_date`, `budget_limit`, `status`, `dharma_code`, `created_at`) VALUES
(3, 3, 'pascoa', 'pascoa 2026', '2026-02-28 18:33:49', 50.00, 'open', 'BA6FFD16', '2026-02-23 21:33:49'),
(5, 2, 'Meu amigão secreto', 'Meu amigão', '2026-03-02 09:17:17', 100.00, 'drawn', '7AF1E3FB', '2026-02-24 12:17:17'),
(9, 2, 'grupo bao', 'bao', '2026-02-26 00:05:34', 100.00, 'drawn', 'AE775354', '2026-02-25 03:05:34'),
(10, 2, 'Grupo Dharma', 'Exemplos do Grupo DHARMA', '2025-02-26 08:11:13', 100.00, 'drawn', 'C85EA9CE', '2026-02-25 11:11:13'),
(11, 2, 'Pascoa', 'Amigos da Pascoa presente chocolate', '2026-04-01 15:25:34', 100.00, 'drawn', '5953BD3D', '2026-02-25 18:25:34'),
(12, 4, 'Amigo Chocolate', 'Pascoa 2026 DSOP amigo chocolate, Uma barra de chocolate é o importante!!! apenas participem!!!! 10 Reais', '2026-04-03 18:18:37', 10.00, 'drawn', '7074BE09', '2026-03-10 21:18:37'),
(13, 2, 'Maior Barra', 'Amigo secreto da pascoa da família, valendo barra de chocolate e vale a pena conhecer seu amigo, qual das 3 barras de chocolate ele mais gosta?', '2026-04-05 12:44:20', 10.00, 'drawn', 'JPMQ4DXT', '2026-03-11 15:44:20');

-- --------------------------------------------------------

--
-- Table structure for table `participants`
--

CREATE TABLE `participants` (
  `id` bigint UNSIGNED NOT NULL,
  `group_id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('invited','link_clicked','confirmed','token_sent','revealed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'invited',
  `invite_token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reveal_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invite_sent_at` datetime DEFAULT NULL,
  `invite_clicked_at` datetime DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `token_sent_at` datetime DEFAULT NULL,
  `revealed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `participants`
--

INSERT INTO `participants` (`id`, `group_id`, `name`, `email`, `status`, `invite_token`, `reveal_token`, `invite_sent_at`, `invite_clicked_at`, `confirmed_at`, `token_sent_at`, `revealed_at`, `created_at`) VALUES
(6, 3, 'charles', 'charles.rodrigues@dsop.com.br', 'invited', 'wGhoJJVudLRmleUm2ZUwnN5XV5crMSH4', NULL, '2026-02-23 18:35:24', NULL, NULL, NULL, NULL, '2026-02-23 21:35:24'),
(7, 3, 'jon', 'jonatan.canuto@dsop.com.br', 'invited', 'aje2XFShK7wYA5xigXz1s2aQrvy2JczY', NULL, '2026-02-23 18:35:24', NULL, NULL, NULL, NULL, '2026-02-23 21:35:24'),
(8, 3, 'rony', 'rony.alcantara@dsop.com.br', 'invited', 'EN9JfDgw_mxVo25ZBeawB3d4SWU31zzU', NULL, '2026-02-23 18:35:24', NULL, NULL, NULL, NULL, '2026-02-23 21:35:24'),
(9, 3, 'charles', 'charles.rodrigues@dsop.com.br', 'invited', 'Da-B4rW331njBUgU8cnrwD8EUvvKQ6gb', NULL, '2026-02-23 18:35:35', NULL, NULL, NULL, NULL, '2026-02-23 21:35:35'),
(10, 3, 'jon', 'jonatan.canuto@dsop.com.br', 'invited', '3MY9LDTgf9qFvl_m6zk2Tf2DFpLRSlbl', NULL, '2026-02-23 18:35:35', NULL, NULL, NULL, NULL, '2026-02-23 21:35:35'),
(11, 3, 'rony', 'rony.alcantara@dsop.com.br', 'invited', 'np3UlPQvFs0N52oi8qqW7MTa8roRdkJg', NULL, '2026-02-23 18:35:35', NULL, NULL, NULL, NULL, '2026-02-23 21:35:35'),
(12, 3, 'charles', 'charles.rodrigues@dsop.com.br', 'invited', 'iViKYarnkjmSI-KW-sqIDt4yAPlPoTH7', NULL, '2026-02-23 18:35:45', NULL, NULL, NULL, NULL, '2026-02-23 21:35:45'),
(13, 3, 'jon', 'jonatan.canuto@dsop.com.br', 'confirmed', 'BkCMd0xKfK833rhufzSeZdNflFPGLvNJ', NULL, '2026-02-23 18:35:45', '2026-02-24 09:09:27', '2026-02-24 09:10:52', NULL, NULL, '2026-02-23 21:35:45'),
(14, 3, 'rony', 'rony.alcantara@dsop.com.br', 'invited', 'Gx94OukucMc9k2UeaFtPAdim_yQsAyc9', NULL, '2026-02-23 18:35:45', NULL, NULL, NULL, NULL, '2026-02-23 21:35:45'),
(15, 3, 'jon —', 'jonatan.canuto@dsop.com.br', 'invited', 'Kk6o8nq5mY1acT6wUhyrZIbdzMVnhJuJ', NULL, '2026-02-23 18:37:07', NULL, NULL, NULL, NULL, '2026-02-23 21:37:07'),
(19, 5, 'Charles -', 'Charles@inmade.com.br', 'revealed', '0Nx4Vpu18jsEps5OGsyzStJ9atZn8LYV', 'uaKKM4r2SGa5zhj99vC_IlVyIYut37uN', '2026-02-24 09:18:33', '2026-02-24 09:21:02', '2026-02-24 09:21:05', '2026-02-24 22:18:59', '2026-02-24 22:21:22', '2026-02-24 12:18:33'),
(20, 5, 'Ines -', 'in.madde@gmail.com', 'revealed', 'iw2p6WulAqanbP00glztzQwmleIHttzk', 'xiddlSQPuV4GpYJ7wOV-JF2zUbkGlStU', '2026-02-24 09:18:33', '2026-02-24 09:21:52', '2026-02-24 09:22:15', '2026-02-24 22:18:59', '2026-02-24 22:21:14', '2026-02-24 12:18:33'),
(21, 5, 'Sophia -', 'sophia@inmade.com.br', 'revealed', 'J5GMzGME5zbVGm4TBAdndKNKFEtKJYCO', 'KG2s-n_kfvqiUTUgrOXM8caBIVM9BJoS', '2026-02-24 09:18:33', '2026-02-24 11:48:34', '2026-02-24 11:48:35', '2026-02-24 22:18:59', '2026-02-24 22:21:44', '2026-02-24 12:18:33'),
(22, 5, 'Henrique -', 'henrique@inmade.com.br', 'revealed', 'qmf8b6OnddLLMVI8bhBsMeY0POXKkyZC', 'kwnm-KbqcchvZcxBoVC1jHuiOEwljWEG', '2026-02-24 09:18:33', '2026-02-24 21:59:32', '2026-02-24 21:59:38', '2026-02-24 22:18:59', '2026-02-24 22:19:34', '2026-02-24 12:18:33'),
(23, 5, 'Patricia -', 'patricia@inmade.com.br', 'revealed', 'MhnydgHsT0WnY1omdsFGCGml8XePK339', 'xRMJxsbGXUkrQCBPHFE4hmLcZDK78Xgg', '2026-02-24 09:18:33', '2026-02-24 22:02:45', '2026-02-24 22:02:50', '2026-02-24 22:18:59', '2026-02-24 22:48:16', '2026-02-24 12:18:33'),
(24, 5, 'caio', 'caionagashima45@gmail.com', 'revealed', 'dUwhyRt6nXxvYM7M4p9y-Gho6baHFmPi', '962_hnseZ6A_-kyzqVBu6vI-Rj-UWEdE', '2026-02-24 22:03:12', '2026-02-24 22:17:47', '2026-02-24 22:17:49', '2026-02-24 22:18:59', '2026-02-24 22:24:36', '2026-02-25 01:03:12'),
(28, 9, 'charles1', 'charles+1@inmade.com.br', 'revealed', 'Gj5RHZOgKNJZAj2ssoVR6PnhtDUWHkWJ', 'Yx-45IDCywpNra__01vu72wYBcLyh30U', '2026-02-25 00:06:30', '2026-02-25 00:08:20', '2026-02-25 00:08:21', '2026-02-25 00:08:56', '2026-02-25 00:09:47', '2026-02-25 03:06:30'),
(29, 9, 'charles2', 'charles+2@inmade.com.br', 'revealed', 'ZmvtvpHpap5s8XOx_ZY4YBt7XBS7nAwQ', '9iLItDe1Q7WDOcf6-iI1iokFKE7bZuRv', '2026-02-25 00:06:30', '2026-02-25 00:08:25', '2026-02-25 00:08:27', '2026-02-25 00:08:56', '2026-02-25 00:09:41', '2026-02-25 03:06:30'),
(30, 9, 'charles3', 'charles+3@inmade.com.br', 'revealed', 'HxBu81p6UgayxA6p-Ioh9gA-mnoty88c', 'MG1LO5I2_oFiptANdAyQ3U4cIS1velu8', '2026-02-25 00:06:30', '2026-02-25 00:08:34', '2026-02-25 00:08:35', '2026-02-25 00:08:56', '2026-02-25 00:09:54', '2026-02-25 03:06:30'),
(31, 10, 'charles', 'charles@inmade.com.br', 'revealed', 'C2j2mKdE0e3aQDRD1GVEmPsTHwthC0vn', 'AbgJDTFkjx8h06arnpp_Gzc1jdrarjV1', '2026-02-25 08:12:03', '2026-02-25 08:13:15', '2026-02-25 08:13:17', '2026-02-25 11:13:56', '2026-02-25 08:18:43', '2026-02-25 11:12:03'),
(32, 10, 'charles2', 'charles+2@inmade.com.br', 'revealed', 'pyFggsdkIcZVLb3cQw11WjFKYl3OOkV6', 'AXnHk5HuqtuF5D6_mbrZjwE5IXM_ZHY3', '2026-02-25 08:12:03', '2026-02-25 08:16:20', '2026-02-25 08:16:22', '2026-02-25 11:04:09', '2026-02-25 11:04:35', '2026-02-25 11:12:03'),
(33, 10, 'charles3', 'charles+3@inmade.com.br', 'revealed', '0K8Jr5n3lKDgnqSgevpzqHmi_z1Pijcj', 'Fxy2VnVrkjOkbprGLlMgAOawzBWxlUhk', '2026-02-25 08:17:30', '2026-02-25 08:17:46', '2026-02-25 08:17:47', '2026-02-25 11:05:17', '2026-02-25 11:06:08', '2026-02-25 11:12:03'),
(34, 11, 'lamimas', 'gabriel.laminas@dsop.com.br', 'revealed', 'thjGIc5J28p2lHwzbYqSZHokU30jOcpU', 'rDnygYjaoP3zV3vt6HmHryfFYWPrakTy', '2026-02-25 15:26:30', '2026-02-25 15:26:54', '2026-02-25 15:26:57', '2026-02-25 15:28:16', '2026-02-25 15:28:41', '2026-02-25 18:26:30'),
(35, 11, 'charles', 'charles@inmade.com.br', 'revealed', '4m0IM7XV2r6S_w03jtbPiosAX9PqMwbb', 'ZH4Boxa6HB9SjQ1j2V3z8Q5ZWTyHvGwL', '2026-02-25 15:26:30', '2026-02-25 15:27:45', '2026-02-25 15:27:46', '2026-02-25 15:28:16', '2026-02-25 15:29:12', '2026-02-25 18:26:30'),
(36, 11, 'amigo charlao', 'charles+4@inmade.com.br', 'revealed', 'h3Y6AfMyWnSNo7oTiCyOTGuVu40QaXSb', 'xVd7wWb35VZK-NOFydDU1d1p68X0mKmh', '2026-02-25 15:26:30', '2026-02-25 15:27:51', '2026-02-25 15:27:52', '2026-02-25 15:28:16', '2026-02-25 15:29:19', '2026-02-25 18:26:30'),
(37, 12, 'tato', 'tato.brito@dsop.com.br', 'revealed', 'rhHiaunu9lzbq-1wA0Y9FwzDHcXHoB2h', 'rKPsAh0_Q_zl1Kxa4RqLfd_McNHQZ9OD', '2026-03-10 18:20:40', '2026-03-10 18:22:25', '2026-03-10 18:22:28', '2026-03-24 14:18:23', '2026-03-24 14:36:58', '2026-03-10 21:20:40'),
(38, 12, 'aline', 'aline.lopes@dsop.com.br', 'revealed', 'FhfTokpamFf8sdTxUku0BUUAaEvKF8CO', 'CqDAqprqzJ8DABFDgrX9UiXy43xTadaz', '2026-03-10 18:20:40', '2026-03-10 18:23:08', '2026-03-10 18:23:11', '2026-03-24 14:18:23', '2026-03-24 17:45:33', '2026-03-10 21:20:40'),
(39, 12, 'jon', 'jonatan.canuto@dsop.com.br', 'revealed', 'jKJBQsa1a82Yz-lI-52AR5slSIsUyf_g', 'gF5V0nZk72lZZF4FAYr3af4IcQXjaCvk', '2026-03-10 18:20:40', '2026-03-10 18:24:40', '2026-03-10 18:24:45', '2026-03-24 14:18:23', '2026-03-24 14:36:37', '2026-03-10 21:20:40'),
(42, 12, 'rafael loureiro', 'rafael.loureiro@dsop.com.br', 'revealed', 'eA0vEHzvf4XYj_lI-vXXmaC5WSQW_37t', 'sOtALkH55NJk1zmOhtHRfYjiLbSuMJDf', '2026-03-10 18:29:03', '2026-03-10 18:29:38', '2026-03-10 18:29:43', '2026-03-24 14:18:23', '2026-03-24 14:22:12', '2026-03-10 21:29:03'),
(44, 13, 'Inês Rodrigues', 'in.madde@gmail.com', 'revealed', 'UmgWvk8DS7kge6e6k0AvQ6486Gqv-aAjwumYOeMJl7g', 'McUJyllSIF3XBWV0DN11K5IIREIQt8O4', '2026-03-11 12:54:57', '2026-03-11 12:55:12', '2026-03-11 12:55:16', '2026-03-12 14:42:06', '2026-03-12 14:43:21', '2026-03-11 15:54:53'),
(45, 13, 'Sophia Nunes', 'sophia@inmade.com.br', 'revealed', '5uYlttamdqivTIePworAz0BtDzfI2ZjJmRW5_jUyFrk', 'onowdjvJOADED9ToAGTCkcbkRb9w9kEo', '2026-03-11 14:49:13', '2026-03-11 14:50:17', '2026-03-11 14:50:25', '2026-03-12 14:42:06', '2026-03-12 15:59:34', '2026-03-11 17:49:09'),
(46, 13, 'Henrique Nunes Rodrigues', 'henrique@inmade.com.br', 'revealed', '6U0iGACP8OodXAfvZuerFy-tQIU4waMomdJiS2hpITU', 'G5U5sv12XR00ZeQoAugFOE8ghNT_VAqt', '2026-03-11 15:01:39', '2026-03-11 15:01:51', '2026-03-11 15:01:56', '2026-03-12 14:42:06', '2026-03-12 14:43:24', '2026-03-11 18:01:35'),
(47, 13, 'charles', 'charles@inmade.com.br', 'revealed', 'lgn_QKvXyJAmgiiLWvW8MxEEQ9B-0nps', 'YFKwe8XGWc_FxeFbYHY-jzon_6cTKnku', '2026-03-11 15:38:15', '2026-03-11 16:29:45', '2026-03-11 16:29:47', '2026-03-12 14:42:06', '2026-03-12 14:44:25', '2026-03-11 18:38:15'),
(48, 13, 'Patricia nunes', 'patricia@inmade.com.br', 'revealed', 'idgY9z-FMrX2T2q-CcUoaNczoSAPKlbTAqtRZC5BkeU', 'UuVdU8i-CbyZLQJXdWQyv5U4LQ2Zu7y0', '2026-03-12 14:33:00', '2026-03-12 14:33:20', '2026-03-12 14:33:25', '2026-03-12 14:42:06', '2026-03-12 14:46:06', '2026-03-12 17:32:55'),
(49, 13, 'Caio Nagassima', 'caionagashima45@gmail.com', 'revealed', 'SXS4h3rbKCBXm8IK4WVCRH8HIn14WTIhhoFkwIsiEqc', 'Q-XzncuB-ZNX-Xl77Dm-hvzv1-BKQTvm', '2026-03-12 14:34:25', '2026-03-12 14:35:32', '2026-03-12 14:35:33', '2026-03-12 14:42:06', '2026-03-12 14:42:47', '2026-03-12 17:34:22'),
(50, 12, 'Hipolito Francisco', 'hipolito.francisco@dsop.com.br', 'revealed', 'PiyLsBHzPlFlIV-K0cnLr8L6a94dF4xvgbL4xllsFhI', 'oNX_oMTGyEouzJjkxRFcWF4jm9yr3o_C', '2026-03-13 10:16:25', '2026-03-13 11:16:41', '2026-03-13 11:16:43', '2026-03-24 14:18:23', '2026-03-24 14:22:41', '2026-03-13 13:16:21'),
(52, 12, 'Daniel Tocchio', 'daniel.tocchio@dsop.com.br', 'revealed', 'D34kxtjyShY1ruiyEefeWl9zXfMU_Ytn1XIZ9lnfkoA', 'n01WZXdrC3dCXi5XNeN1VPLBH-92mXvV', '2026-03-24 12:53:55', '2026-03-24 13:24:12', '2026-03-24 13:24:16', '2026-03-24 14:18:23', '2026-03-24 14:20:55', '2026-03-20 13:17:51'),
(53, 12, 'Gustavo Santos Simão', 'gusantossimao@gmail.com', 'revealed', 'sZXK876s1vnthHDhEVFOuSoqDmuvn4vZ6Pvv0LaG2E4', 'qiBmN_4z05zE4zRKSIDoMCboKPdfl8Dl', '2026-03-20 10:18:54', '2026-03-20 10:27:36', '2026-03-20 10:27:44', '2026-03-24 14:18:23', '2026-03-24 14:21:53', '2026-03-20 13:18:50'),
(54, 12, 'Patrick Ayala', 'patricio.ayala@editoradsop.com.br', 'revealed', 'eNzgUK6NVaUh8HkurB69uKMhWxWczWvuKRIMs2tDSYI', 'gm8m1xQ2x_63uKFUNWEhH_I24gaCct84', '2026-03-24 14:17:47', '2026-03-24 14:18:00', '2026-03-24 14:18:07', '2026-03-24 14:18:23', '2026-03-24 15:41:18', '2026-03-20 13:21:00'),
(55, 12, 'Isaac Machado da Silva', 'isaacmachado.profissional@gmail.com', 'revealed', 'JtyTkeo147tFNb-FEBp-g1d0s5wyfmiqQtD5WTJ7Rjk', '1nQHLssRf-hzpwfR2BFvACFhD-PpVwLU', '2026-03-24 12:54:02', '2026-03-24 12:54:23', '2026-03-24 12:54:40', '2026-03-24 14:18:23', '2026-03-24 14:26:36', '2026-03-20 13:21:26'),
(57, 12, 'Pedro Henrique Sousa Lopes', 'pedro.henrisousalopes9@gmail.com', 'revealed', 'R20MV-xe-V4gB39n1gF4nQXNBFKnaSvbeHEtBOxroHE', 'duL-zVpRCDL36c5NH5A26oZo_q3Z9vpL', NULL, '2026-03-20 10:26:16', '2026-03-20 10:26:22', '2026-03-24 14:18:23', '2026-03-24 14:42:08', '2026-03-20 13:23:29'),
(58, 12, 'Kawenny Silva', 'kawenny.silva@dsop.com.br', 'revealed', '2c4S8WGb6rl2QHSXCaLwD1x72O2jX8kpJb9xXUg7C1Y', 'u8Iq0c9SFYTHznsKSFHiNjM2tfsFJKYD', '2026-03-20 10:29:58', '2026-03-20 15:28:57', '2026-03-20 15:29:01', '2026-03-24 14:18:23', '2026-03-24 17:48:18', '2026-03-20 13:29:54'),
(59, 12, 'Luciana Vasconcelos', 'luciana.vasconcelos@dsop.com.br', 'revealed', 'nrKXfND6Gjz5ylOdelgwuFN5jUvJd7h_X2UWXGCZu2k', 'vOg1esoctWfKqdBfpB0O-pmQ4WQgF5sK', '2026-03-20 10:45:53', '2026-03-20 14:35:08', '2026-03-20 14:35:17', '2026-03-24 14:18:23', '2026-03-24 14:22:25', '2026-03-20 13:45:50'),
(60, 12, 'Domenica Gonçalves', 'kauafelipelevy10@gmail.com', 'revealed', '7rOd6yRIlcA8rmgMpNbiiybwFkkB4por0ZDSlHkeBp4', 'n-7QCjsBv7ardKQb3gCs8PhpgWvIQAwq', '2026-03-20 14:53:33', '2026-03-20 14:54:15', '2026-03-20 14:54:22', '2026-03-24 14:18:23', '2026-03-24 19:32:50', '2026-03-20 17:53:29'),
(61, 12, 'Glauco Artagoitia Romualdi', 'glauco.romualdo@dsop.com.br', 'token_sent', 'snVqaJhsPof6T1VSAVypOlImLM3kOVATgeGbzYX5_pA', 'TnsHueanCRupgfXxkauV9p0ao5bcS0fV', '2026-03-20 14:57:02', '2026-03-20 15:11:25', '2026-03-20 15:11:32', '2026-03-24 14:18:23', NULL, '2026-03-20 17:56:58'),
(62, 12, 'Willian Pinheiro', 'willian.pinheiro@dsop.com.br', 'revealed', '2U3_4V66pC-3OANZYBdJUgWYhAqs3WBarglolugp8Bw', 'cGGNO0wFlQAzLhGAUEqWAQc_Hr8QQZjv', '2026-03-20 18:50:12', '2026-03-20 18:50:46', '2026-03-20 18:50:49', '2026-03-24 14:18:23', '2026-03-24 14:33:04', '2026-03-20 21:50:08'),
(63, 12, 'Mehiel Luz', 'mehielluz@gmail.com', 'revealed', 'tvYiIfNez7WLShHJx8og9UUheLriROsxDR96aIBW0H0', 'Y9l_cVbDkOJhTS8LF82JBM9TahvTp3cv', '2026-03-24 13:03:54', '2026-03-24 13:04:12', '2026-03-24 13:04:15', '2026-03-24 14:18:23', '2026-03-24 14:20:56', '2026-03-24 16:03:51'),
(64, 12, 'Vanessa Araújo Santos', 'vanessa.araujo7222@gmail.com', 'revealed', 'XuzUq4H1XpZWlrsXkz6pizyTp09f_jtEy2JEiiktVmI', '2pJ0D70qc1JU_ONrcBOpMUnKSN3azXqC', '2026-03-24 13:30:17', '2026-03-24 13:30:37', '2026-03-24 13:30:39', '2026-03-24 14:18:23', '2026-03-24 14:21:23', '2026-03-24 16:30:13'),
(65, 12, 'Roger Lima', 'roger.lima@dsop.com.br', 'revealed', 'PeFyDTOJAcP59Upwf810TKgPlr3xlxek7F5s6ft8E6M', '0nuCVh_cmxMr5rTRwBx0zZFIRBrRiuvf', '2026-03-24 13:32:10', '2026-03-24 13:32:41', '2026-03-24 13:32:56', '2026-03-24 14:18:23', '2026-03-24 15:12:14', '2026-03-24 16:32:06');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_admins_email` (`email`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_chat_group_id` (`group_id`),
  ADD KEY `idx_chat_draw_id` (`draw_id`);

--
-- Indexes for table `draw_results`
--
ALTER TABLE `draw_results`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_draw_giver_id` (`giver_id`),
  ADD KEY `idx_draw_group_id` (`group_id`),
  ADD KEY `fk_draw_receiver_id` (`receiver_id`);

--
-- Indexes for table `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dharma_code` (`dharma_code`),
  ADD KEY `idx_groups_admin_id` (`admin_id`);

--
-- Indexes for table `participants`
--
ALTER TABLE `participants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_participants_group_id` (`group_id`),
  ADD KEY `idx_participants_invite_token` (`invite_token`),
  ADD KEY `idx_participants_reveal_token` (`reveal_token`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draw_results`
--
ALTER TABLE `draw_results`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `groups`
--
ALTER TABLE `groups`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `participants`
--
ALTER TABLE `participants`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `fk_chat_draw_id` FOREIGN KEY (`draw_id`) REFERENCES `draw_results` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_chat_group_id` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `draw_results`
--
ALTER TABLE `draw_results`
  ADD CONSTRAINT `fk_draw_giver_id` FOREIGN KEY (`giver_id`) REFERENCES `participants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_draw_group_id` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_draw_receiver_id` FOREIGN KEY (`receiver_id`) REFERENCES `participants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `groups`
--
ALTER TABLE `groups`
  ADD CONSTRAINT `fk_groups_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `participants`
--
ALTER TABLE `participants`
  ADD CONSTRAINT `fk_participants_group_id` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
