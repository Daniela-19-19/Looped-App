-- ==========================================================
-- Looped · Cambio 01: visitas y «Fan fundador»
-- spec.md: «Fan fundador» se gana al VISITAR por primera vez a un
-- artista con menos de 1000 seguidores (aunque no lo siga).
-- Antes estaba dentro de «seguimientos»; ahora va en «visitas».
--
-- Cómo usarlo: SQL Editor → New query → pega todo → Run. Una sola vez.
-- (esquema.sql y datos-iniciales.sql ya incluyen este cambio, para
-- quien cree la base de datos desde cero.)
-- ==========================================================

-- La primera visita de cada fan a cada artista.
create table visitas (
  fan text references fans on delete cascade,
  artista text references artistas on delete cascade,
  es_fan_fundador boolean not null default false,
  fecha timestamptz not null default now(),
  primary key (fan, artista)  -- solo cuenta la primera
);

-- La base de datos decide si es fan fundador (no el navegador):
-- el artista tiene menos de 1000 seguidores en ese momento.
create function decidir_fan_fundador() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.es_fan_fundador := coalesce((select seguidores < 1000 from artistas where id = new.artista), false);
  new.fecha := now();
  return new;
end $$;

create trigger visitas_fan_fundador before insert on visitas
  for each row execute function decidir_fan_fundador();

alter table visitas enable row level security;
create policy "Todos leen" on visitas for select using (true);
create policy "El fan visita" on visitas for insert with check (fan = mi_fan());
grant select on visitas to anon, authenticated;
grant insert on visitas to authenticated;

-- Pasa los fans fundadores que ya había y quita la columna vieja.
insert into visitas (fan, artista) select fan, artista from seguimientos where es_fan_fundador;
alter table seguimientos drop column es_fan_fundador;
