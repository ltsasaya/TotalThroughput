alter table users
  add column if not exists calibration_wpm numeric,
  add column if not exists calibration_range_label text,
  add column if not exists calibration_bin_index integer,
  add column if not exists calibration_service_demand_ms numeric,
  add column if not exists calibration_updated_at timestamptz;

update users u
set
  calibration_wpm = latest.calibration_wpm,
  calibration_range_label = latest.calibration_range_label,
  calibration_bin_index = latest.calibration_bin_index,
  calibration_service_demand_ms = latest.service_demand_estimate_ms,
  calibration_updated_at = latest.completed_at,
  updated_at = now()
from (
  select distinct on (tr.user_id)
    tr.user_id,
    tr.calibration_wpm,
    tr.calibration_range_label,
    tr.calibration_bin_index,
    tr.service_demand_estimate_ms,
    tr.completed_at
  from typing_runs tr
  where tr.user_id is not null
    and tr.calibration_wpm is not null
  order by tr.user_id, tr.completed_at desc
) latest
where u.id = latest.user_id
  and u.calibration_wpm is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_calibration_wpm_range'
  ) then
    alter table users
      add constraint users_calibration_wpm_range
      check (calibration_wpm is null or calibration_wpm between 0 and 250);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'users_calibration_bin_range'
  ) then
    alter table users
      add constraint users_calibration_bin_range
      check (calibration_bin_index is null or calibration_bin_index between 0 and 20);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'users_calibration_service_demand_range'
  ) then
    alter table users
      add constraint users_calibration_service_demand_range
      check (
        calibration_service_demand_ms is null
        or calibration_service_demand_ms between 0 and 600000
      );
  end if;
end $$;
