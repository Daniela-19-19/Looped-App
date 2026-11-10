-- ==========================================================
-- Looped · Esquema de la base de datos (Supabase)
-- Tablas de spec.md («Datos»), reglas de seguridad (RLS) y
-- carpetas de archivos (Storage).
--
-- Cómo usarlo: en Supabase, abre SQL Editor → New query, pega
-- todo este archivo y pulsa Run. Se corre UNA sola vez, en un
-- proyecto vacío. Después corre datos-iniciales.sql.
--
-- Notas:
-- · El correo y la contraseña NO están en estas tablas: los
--   guarda Supabase Auth (más seguro). Cada perfil se une a su
--   cuenta con `usuario_id`.
-- · Los artistas y fans de ejemplo no tienen cuenta
--   (usuario_id vacío): solo se pueden ver, no editar.
-- · RLS = Row Level Security: cada tabla dice quién puede leer
--   y quién puede escribir cada fila.
-- ==========================================================


-- ----------------------------------------------------------
-- 1. Listas fijas (catálogos)
-- ----------------------------------------------------------
create table generos (
  id text primary key,
  nombre text not null
);

create table roles (
  id text primary key,
  nombre text not null
);

create table intereses (
  id text primary key,
  nombre text not null
);


-- ----------------------------------------------------------
-- 2. Perfiles: fans y artistas
-- ----------------------------------------------------------
create table fans (
  id text primary key default gen_random_uuid()::text,
  usuario_id uuid unique references auth.users on delete cascade,
  nombre_perfil text not null,
  nombre_usuario text not null unique,
  foto text,
  gustos_musicales text[] not null default '{}',  -- ids de generos
  intereses text[] not null default '{}',         -- ids de intereses
  minutos_escucha integer not null default 0,     -- definen el nivel
  fecha_registro date not null default current_date
);

create table artistas (
  id text primary key default gen_random_uuid()::text,
  usuario_id uuid unique references auth.users on delete cascade,
  nombre_artistico text not null,
  nombre_usuario text not null unique,
  foto text,
  presentacion text,
  ciudad text,
  generos text[] not null default '{}',           -- ids de generos
  roles text[] not null default '{}',             -- ids de roles
  seguidores integer not null default 0,
  emergente boolean not null default true,
  fecha_registro date not null default current_date
);

-- Qué artistas sigue cada fan.
create table seguimientos (
  fan text references fans on delete cascade,
  artista text references artistas on delete cascade,
  fecha timestamptz not null default now(),
  primary key (fan, artista)
);

-- La primera visita de cada fan a cada artista. «Fan fundador» se gana
-- al visitar a un artista con menos de 1000 seguidores (lo decide un
-- trigger más abajo, no el navegador).
create table visitas (
  fan text references fans on delete cascade,
  artista text references artistas on delete cascade,
  es_fan_fundador boolean not null default false,
  fecha timestamptz not null default now(),
  primary key (fan, artista)
);

-- Fan Clubs a los que pertenece cada fan (gratis en el MVP).
create table miembros_fan_club (
  fan text references fans on delete cascade,
  artista text references artistas on delete cascade,
  fecha timestamptz not null default now(),
  primary key (fan, artista)
);


-- ----------------------------------------------------------
-- 3. Música, preguntas y comunidad
-- ----------------------------------------------------------
create table cupos (
  id text primary key default gen_random_uuid()::text,
  artista text not null unique references artistas on delete cascade, -- uno por artista
  estado text not null default 'cerrado' check (estado in ('abierto', 'completo', 'cerrado')),
  total_preguntas integer not null default 5 check (total_preguntas between 1 and 100),
  preguntas_usadas integer not null default 0,
  nivel_minimo integer not null default 0,
  fecha_apertura timestamptz
);

create table lanzamientos (
  id text primary key default gen_random_uuid()::text,
  artista text not null references artistas on delete cascade,
  nombre_lanzamiento text not null,
  nombre_cancion text not null,
  portada text,
  audio text not null,
  fecha_publicacion timestamptz not null default now()  -- ventana de 48 h
);

create table preguntas (
  id text primary key default gen_random_uuid()::text,
  artista text not null references artistas on delete cascade,
  autor text not null references fans on delete cascade,
  autor_es_fan_club boolean not null default false,
  primer_contacto boolean not null default false,
  texto text not null,
  votos integer not null default 0,
  estado text not null default 'nueva'
    check (estado in ('nueva', 'pendiente', 'seleccionada', 'respondida', 'descartada')),
  fecha timestamptz not null default now()
);

create table votos (
  fan text references fans on delete cascade,
  pregunta text references preguntas on delete cascade,
  primary key (fan, pregunta)  -- un voto por fan y pregunta
);

create table respuestas (
  id text primary key default gen_random_uuid()::text,
  pregunta text not null unique references preguntas on delete cascade,
  tipo text not null check (tipo in ('texto', 'voz')),
  texto text,
  audio text,
  duracion_audio integer,  -- segundos
  fecha timestamptz not null default now()
);

create table publicaciones (
  id text primary key default gen_random_uuid()::text,
  artista text not null references artistas on delete cascade,
  texto text not null,
  lanzamiento text references lanzamientos on delete set null,
  solo_fan_club boolean not null default false,  -- contenido exclusivo
  fecha timestamptz not null default now()
);

-- Una cola de reproducción por fan.
create table colas (
  fan text primary key references fans on delete cascade,
  canciones text[] not null default '{}',  -- ids de lanzamientos, en orden
  cancion_actual text,
  aleatorio boolean not null default false,
  bucle text not null default 'apagado' check (bucle in ('apagado', 'una', 'toda'))
);


-- ----------------------------------------------------------
-- 4. Notificaciones y preferencias (de cualquier cuenta)
-- ----------------------------------------------------------
create table notificaciones (
  id text primary key default gen_random_uuid()::text,
  usuario_id uuid not null references auth.users on delete cascade,
  texto text not null,
  accion text,  -- a qué pantalla lleva
  fecha timestamptz not null default now(),
  leida boolean not null default false,
  enviada_celular boolean not null default false
);

create table preferencias (
  usuario_id uuid primary key references auth.users on delete cascade,
  apariencia text not null default 'oscura' check (apariencia in ('clara', 'oscura')),
  reducir_movimiento boolean not null default false,
  reducir_transparencia boolean not null default false,
  notificaciones boolean not null default true
);


-- ----------------------------------------------------------
-- 5. Funciones de ayuda
-- ----------------------------------------------------------
-- El id del fan o del artista de la persona que inició sesión.
create function mi_fan() returns text
language sql stable security definer set search_path = public as $$
  select id from fans where usuario_id = auth.uid()
$$;

create function mi_artista() returns text
language sql stable security definer set search_path = public as $$
  select id from artistas where usuario_id = auth.uid()
$$;

-- Un correo pertenece a una sola cuenta: de fan O de artista.
create function una_cuenta_por_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.usuario_id is not null and (
    (tg_table_name = 'fans' and exists (select 1 from artistas where usuario_id = new.usuario_id)) or
    (tg_table_name = 'artistas' and exists (select 1 from fans where usuario_id = new.usuario_id))
  ) then
    raise exception 'Este correo ya tiene una cuenta.';
  end if;
  return new;
end $$;

create trigger fans_una_cuenta before insert or update on fans
  for each row execute function una_cuenta_por_usuario();
create trigger artistas_una_cuenta before insert or update on artistas
  for each row execute function una_cuenta_por_usuario();

-- Mantiene al día el número de votos de cada pregunta.
create function contar_votos() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update preguntas set votos = votos + 1 where id = new.pregunta;
  else
    update preguntas set votos = greatest(votos - 1, 0) where id = old.pregunta;
  end if;
  return null;
end $$;

create trigger votos_contar after insert or delete on votos
  for each row execute function contar_votos();

-- Mantiene al día el número de seguidores de cada artista.
create function contar_seguidores() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update artistas set seguidores = seguidores + 1 where id = new.artista;
  else
    update artistas set seguidores = greatest(seguidores - 1, 0) where id = old.artista;
  end if;
  return null;
end $$;

create trigger seguimientos_contar after insert or delete on seguimientos
  for each row execute function contar_seguidores();

-- Decide si una visita da «Fan fundador»: menos de 1000 seguidores.
create function decidir_fan_fundador() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.es_fan_fundador := coalesce((select seguidores < 1000 from artistas where id = new.artista), false);
  new.fecha := now();
  return new;
end $$;

create trigger visitas_fan_fundador before insert on visitas
  for each row execute function decidir_fan_fundador();


-- ----------------------------------------------------------
-- 6. Seguridad (RLS): quién lee y quién escribe
-- ----------------------------------------------------------
alter table generos enable row level security;
alter table roles enable row level security;
alter table intereses enable row level security;
alter table fans enable row level security;
alter table artistas enable row level security;
alter table seguimientos enable row level security;
alter table visitas enable row level security;
alter table miembros_fan_club enable row level security;
alter table cupos enable row level security;
alter table lanzamientos enable row level security;
alter table preguntas enable row level security;
alter table votos enable row level security;
alter table respuestas enable row level security;
alter table publicaciones enable row level security;
alter table colas enable row level security;
alter table notificaciones enable row level security;
alter table preferencias enable row level security;

-- Todos pueden leer lo público de la app.
create policy "Todos leen" on generos for select using (true);
create policy "Todos leen" on roles for select using (true);
create policy "Todos leen" on intereses for select using (true);
create policy "Todos leen" on fans for select using (true);
create policy "Todos leen" on artistas for select using (true);
create policy "Todos leen" on seguimientos for select using (true);
create policy "Todos leen" on visitas for select using (true);
create policy "Todos leen" on miembros_fan_club for select using (true);
create policy "Todos leen" on cupos for select using (true);
create policy "Todos leen" on lanzamientos for select using (true);
create policy "Todos leen" on preguntas for select using (true);
create policy "Todos leen" on votos for select using (true);
create policy "Todos leen" on respuestas for select using (true);

-- Cada persona crea y edita solo su propio perfil.
create policy "Crea su perfil" on fans for insert with check (usuario_id = auth.uid());
create policy "Edita su perfil" on fans for update using (usuario_id = auth.uid());
create policy "Crea su perfil" on artistas for insert with check (usuario_id = auth.uid());
create policy "Edita su perfil" on artistas for update using (usuario_id = auth.uid());

-- El fan sigue, deja de seguir y entra o sale de Fan Clubs.
create policy "El fan sigue" on seguimientos for insert with check (fan = mi_fan());
create policy "El fan deja de seguir" on seguimientos for delete using (fan = mi_fan());
create policy "El fan visita" on visitas for insert with check (fan = mi_fan());
create policy "El fan entra" on miembros_fan_club for insert with check (fan = mi_fan());
create policy "El fan sale" on miembros_fan_club for delete using (fan = mi_fan());

-- El artista maneja su cupo y sus lanzamientos.
create policy "El artista maneja su cupo" on cupos for all
  using (artista = mi_artista()) with check (artista = mi_artista());
create policy "El artista maneja su música" on lanzamientos for all
  using (artista = mi_artista()) with check (artista = mi_artista());

-- El fan pregunta y vota; el artista cambia el estado de sus preguntas.
create policy "El fan pregunta" on preguntas for insert with check (autor = mi_fan());
create policy "El artista ordena sus preguntas" on preguntas for update using (artista = mi_artista());
create policy "El fan vota" on votos for insert with check (fan = mi_fan());
create policy "El fan quita su voto" on votos for delete using (fan = mi_fan());

-- El artista responde solo las preguntas que le hicieron a él.
create policy "El artista responde" on respuestas for all
  using (exists (select 1 from preguntas p where p.id = pregunta and p.artista = mi_artista()))
  with check (exists (select 1 from preguntas p where p.id = pregunta and p.artista = mi_artista()));

-- Publicaciones: las de «Solo para el Fan Club» solo las ven sus miembros y el artista.
create policy "Leen publicaciones" on publicaciones for select using (
  not solo_fan_club
  or artista = mi_artista()
  or exists (select 1 from miembros_fan_club m where m.artista = publicaciones.artista and m.fan = mi_fan())
);
create policy "El artista publica" on publicaciones for all
  using (artista = mi_artista()) with check (artista = mi_artista());

-- Lo privado: cada uno ve y cambia solo lo suyo.
create policy "Su cola" on colas for all
  using (fan = mi_fan()) with check (fan = mi_fan());
create policy "Sus notificaciones" on notificaciones for select using (usuario_id = auth.uid());
create policy "Marca como leída" on notificaciones for update using (usuario_id = auth.uid());
create policy "Sus preferencias" on preferencias for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Permisos base (RLS sigue decidiendo fila por fila).
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;


-- ----------------------------------------------------------
-- 7. Archivos (Storage): audio, portadas, fotos y notas de voz
-- ----------------------------------------------------------
-- Cada carpeta se puede leer públicamente (para reproducir y mostrar).
insert into storage.buckets (id, name, public) values
  ('audios', 'audios', true),
  ('portadas', 'portadas', true),
  ('fotos', 'fotos', true),
  ('notas-voz', 'notas-voz', true);

-- Cada persona sube archivos solo dentro de una carpeta con su id:
-- por ejemplo audios/<id de su cuenta>/cancion.mp3
create policy "Sube sus archivos" on storage.objects for insert to authenticated
  with check (bucket_id in ('audios', 'portadas', 'fotos', 'notas-voz')
              and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Cambia sus archivos" on storage.objects for update to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text);
create policy "Borra sus archivos" on storage.objects for delete to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text);
