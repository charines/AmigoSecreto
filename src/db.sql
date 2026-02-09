-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.groups (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  owner_email text NOT NULL,
  status text DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT groups_pkey PRIMARY KEY (id)
);
CREATE TABLE public.participants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  group_id uuid,
  name text NOT NULL,
  secret_friend_name text NOT NULL,
  viewed boolean DEFAULT false,
  CONSTRAINT participants_pkey PRIMARY KEY (id),
  CONSTRAINT participants_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id)
);