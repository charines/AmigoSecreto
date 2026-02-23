-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE admins (
  id bigint PRIMARY KEY,
  name varchar(255) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  password_hash varchar(255) NOT NULL
);

CREATE TABLE groups (
  id bigint PRIMARY KEY,
  admin_id bigint NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  draw_date datetime,
  budget_limit decimal(10,2),
  status varchar(20) DEFAULT 'open'
);

CREATE TABLE participants (
  id bigint PRIMARY KEY,
  group_id bigint NOT NULL,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  status varchar(20) DEFAULT 'invited',
  invite_token varchar(64) NOT NULL,
  reveal_token varchar(64)
);

CREATE TABLE draw_results (
  id bigint PRIMARY KEY,
  group_id bigint NOT NULL,
  giver_id bigint NOT NULL,
  encrypted_payload text NOT NULL,
  iv_b64 varchar(255) NOT NULL,
  token_hash varchar(64) NOT NULL
);
