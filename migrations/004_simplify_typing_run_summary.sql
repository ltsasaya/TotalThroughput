alter table typing_runs
  add column if not exists observed_arrival_rate numeric,
  add column if not exists throughput_per_second numeric;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'typing_runs' and column_name = 'actual_throughput'
  ) then
    execute '
      update typing_runs
      set throughput_per_second = coalesce(throughput_per_second, actual_throughput)
    ';
  end if;
end $$;

update typing_runs
set
  observed_arrival_rate = coalesce(
    observed_arrival_rate,
    arrival_count::numeric / nullif(duration_ms::numeric / 1000, 0),
    0
  ),
  throughput_per_second = coalesce(
    throughput_per_second,
    completed_count::numeric / nullif(duration_ms::numeric / 1000, 0),
    0
  );

alter table typing_runs
  drop column if exists difficulty_label,
  drop column if exists difficulty_range_label,
  drop column if exists total_throughput,
  drop column if exists actual_throughput;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'typing_runs_observed_arrival_rate_range'
  ) then
    alter table typing_runs
      add constraint typing_runs_observed_arrival_rate_range
      check (observed_arrival_rate is null or observed_arrival_rate between 0 and 20);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'typing_runs_throughput_per_second_range'
  ) then
    alter table typing_runs
      add constraint typing_runs_throughput_per_second_range
      check (throughput_per_second is null or throughput_per_second between 0 and 20);
  end if;
end $$;
