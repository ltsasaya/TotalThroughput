create extension if not exists pgcrypto;

create table if not exists schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  normalized_username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists sessions_active_idx on sessions(token_hash, expires_at) where revoked_at is null;

create table if not exists instructor_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  instructor_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  instructor_user_id uuid not null references users(id) on delete cascade,
  class_code text not null unique,
  class_name text not null,
  password_hash text not null,
  requires_student_id boolean not null default false,
  requires_student_name boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists classes_instructor_user_id_idx on classes(instructor_user_id);

create table if not exists class_memberships (
  class_id uuid not null references classes(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  student_name text,
  student_id text,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create index if not exists class_memberships_user_id_idx on class_memberships(user_id);

create table if not exists user_activity (
  user_id uuid primary key references users(id) on delete cascade,
  simulation_run_count integer not null default 0,
  last_simulation_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists typing_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  class_id uuid references classes(id) on delete set null,
  completed_at timestamptz not null default now(),
  difficulty_key text not null,
  calibration_wpm numeric,
  calibration_range_label text,
  calibration_bin_index integer,
  target_load numeric,
  arrival_rate numeric,
  observed_arrival_rate numeric,
  expected_arrivals integer,
  arrival_count integer,
  completed_count integer,
  throughput_per_second numeric,
  avg_response_ms numeric,
  avg_service_demand_ms numeric,
  avg_typing_wpm numeric,
  reaction_ms numeric,
  utilization numeric,
  avg_queue_length numeric,
  max_queue_length integer,
  still_waiting_count integer,
  duration_ms integer,
  service_demand_estimate_ms numeric,
  reference_response_ms numeric,
  seed integer,
  created_at timestamptz not null default now()
);

create index if not exists typing_runs_user_id_completed_at_idx on typing_runs(user_id, completed_at desc);
create index if not exists typing_runs_class_id_completed_at_idx on typing_runs(class_id, completed_at desc);
create index if not exists typing_runs_global_completed_idx on typing_runs(completed_at desc) where completed_at is not null;
