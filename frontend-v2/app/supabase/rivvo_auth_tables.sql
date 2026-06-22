create table if not exists public.user_vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  fuel text not null default 'gasolina95',
  tank_liters numeric,
  consumption numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.user_favorite_stations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  station_id text not null,
  name text not null,
  brand text,
  address text,
  province text,
  municipality text,
  latitude numeric,
  longitude numeric,
  price text,
  fuel_type text,
  created_at timestamptz not null default now(),
  unique (user_id, station_id)
);

alter table public.user_vehicles enable row level security;
alter table public.user_favorite_stations enable row level security;

create policy "Users can read their vehicles"
on public.user_vehicles for select using (auth.uid() = user_id);

create policy "Users can insert their vehicles"
on public.user_vehicles for insert with check (auth.uid() = user_id);

create policy "Users can update their vehicles"
on public.user_vehicles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete their vehicles"
on public.user_vehicles for delete using (auth.uid() = user_id);

create policy "Users can read their favorite stations"
on public.user_favorite_stations for select using (auth.uid() = user_id);

create policy "Users can insert their favorite stations"
on public.user_favorite_stations for insert with check (auth.uid() = user_id);

create policy "Users can update their favorite stations"
on public.user_favorite_stations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete their favorite stations"
on public.user_favorite_stations for delete using (auth.uid() = user_id);


-- Ajustes añadidos para sincronización correcta desde Buscar y Favoritas.
alter table public.user_vehicles
add column if not exists make text;

alter table public.user_vehicles
add column if not exists model text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_favorite_stations_user_id_station_id_key'
  ) then
    alter table public.user_favorite_stations
    add constraint user_favorite_stations_user_id_station_id_key unique (user_id, station_id);
  end if;
end $$;
