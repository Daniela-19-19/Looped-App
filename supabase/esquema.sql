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
  segundos_escucha integer not null default 0,    -- de aquí salen los minutos (sumar_escucha)
  fecha_registro date not null default current_date,
  -- Hasta 3 listas de Spotify (decisión 13): solo el código de 22 caracteres.
  spotify_listas text[] not null default '{}'
    check (cardinality(spotify_listas) <= 3
      and array_to_string(spotify_listas, ',') ~ '^([A-Za-z0-9]{22}(,[A-Za-z0-9]{22})*)?$')
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
  fecha_registro date not null default current_date,
  -- Perfil de artista en Spotify (decisión 13): solo el código de 22 caracteres.
  spotify text check (spotify ~ '^[A-Za-z0-9]{22}$')
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

-- Las respuestas solo se crean con responder_pregunta() (más abajo).

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

-- Contadores protegidos: minutos, seguidores y votos solo los cambia la
-- base de datos (funciones y triggers), nunca el navegador.
revoke insert, update on fans from authenticated;
grant insert (usuario_id, nombre_perfil, nombre_usuario, foto, gustos_musicales, intereses, spotify_listas),
      update (usuario_id, nombre_perfil, nombre_usuario, foto, gustos_musicales, intereses, spotify_listas)
  on fans to authenticated;
revoke insert, update on artistas from authenticated;
grant insert (usuario_id, nombre_artistico, nombre_usuario, foto, presentacion, ciudad, generos, roles, spotify),
      update (usuario_id, nombre_artistico, nombre_usuario, foto, presentacion, ciudad, generos, roles, spotify)
  on artistas to authenticated;
revoke insert, update on preguntas from authenticated;
grant insert (artista, autor, autor_es_fan_club, primer_contacto, texto),
      update (estado)
  on preguntas to authenticated;

-- Suma lo escuchado al fan que inició sesión y devuelve sus minutos
-- (como mucho 60 segundos por llamada).
create function sumar_escucha(segundos integer) returns integer
language plpgsql security definer set search_path = public as $$
declare
  minutos integer;
begin
  update fans
    set segundos_escucha = segundos_escucha + least(greatest(segundos, 0), 60),
        minutos_escucha = (segundos_escucha + least(greatest(segundos, 0), 60)) / 60
    where usuario_id = auth.uid()
    returning minutos_escucha into minutos;
  return minutos;
end $$;
grant execute on function sumar_escucha(integer) to authenticated;


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


-- ----------------------------------------------------------
-- 8. Reglas de preguntas y votos (cupo abierto y nivel mínimo)
-- ----------------------------------------------------------
-- Nivel del fan según sus minutos (igual que la tabla de spec.md:
-- 15 min el nivel 1 y cada nivel pide 1,5 veces el anterior).
create function nivel_por_minutos(minutos integer) returns integer
language plpgsql immutable as $$
declare
  nivel integer := 0;
  acumulado integer := 0;
begin
  loop
    acumulado := acumulado + round(15 * power(1.5::numeric, nivel))::integer;
    if minutos < acumulado then return nivel; end if;
    nivel := nivel + 1;
  end loop;
end $$;

-- ¿Puede este fan participar en el cupo de este artista? Si no, explica por qué.
create function revisar_participacion(fan_id text, artista_id text) returns void
language plpgsql stable security definer set search_path = public as $$
declare
  cupo record;
  minutos integer;
begin
  select estado, nivel_minimo into cupo from cupos where artista = artista_id;
  if not found or cupo.estado <> 'abierto' then
    raise exception 'cupo-cerrado';
  end if;
  select minutos_escucha into minutos from fans where id = fan_id;
  if nivel_por_minutos(coalesce(minutos, 0)) < cupo.nivel_minimo then
    raise exception 'nivel-insuficiente';
  end if;
end $$;

-- Al crear una pregunta: revisa el cupo y el nivel, y marca lo que no
-- debe decidir el navegador.
create function preparar_pregunta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform revisar_participacion(new.autor, new.artista);
  new.primer_contacto := not exists (select 1 from seguimientos where fan = new.autor and artista = new.artista);
  new.autor_es_fan_club := exists (select 1 from miembros_fan_club where fan = new.autor and artista = new.artista);
  new.votos := 0;
  new.estado := 'nueva';
  new.fecha := now();
  return new;
end $$;

create trigger preguntas_preparar before insert on preguntas
  for each row execute function preparar_pregunta();

-- Al votar: revisa el cupo y el nivel, y que no sea su propia pregunta.
create function revisar_voto() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  pregunta record;
begin
  select artista, autor into pregunta from preguntas where id = new.pregunta;
  if pregunta.autor = new.fan then
    raise exception 'voto-propio';
  end if;
  perform revisar_participacion(new.fan, pregunta.artista);
  return new;
end $$;

create trigger votos_revisar before insert on votos
  for each row execute function revisar_voto();

alter table preguntas add constraint preguntas_largo check (char_length(texto) between 5 and 200);


-- ----------------------------------------------------------
-- 9. Responder preguntas: respuesta, estado, cupo y notificación juntos
-- ----------------------------------------------------------
create function responder_pregunta(
  pregunta_id text,
  tipo_respuesta text,
  texto_respuesta text default null,
  audio_respuesta text default null,
  duracion integer default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  pregunta record;
  cupo record;
  artista_nombre text;
  fan_usuario uuid;
  respuesta_id text;
begin
  select * into pregunta from preguntas where id = pregunta_id;
  if not found or pregunta.artista is distinct from mi_artista() then
    raise exception 'sin-permiso';
  end if;
  if pregunta.estado = 'respondida' then
    raise exception 'ya-respondida';
  end if;
  if tipo_respuesta = 'texto' and coalesce(trim(texto_respuesta), '') = '' then
    raise exception 'respuesta-vacia';
  end if;
  if tipo_respuesta = 'voz' and audio_respuesta is null then
    raise exception 'respuesta-vacia';
  end if;

  select * into cupo from cupos where artista = pregunta.artista for update;
  if not found or cupo.estado <> 'abierto' or cupo.preguntas_usadas >= cupo.total_preguntas then
    raise exception 'cupo-sin-respuestas';
  end if;

  insert into respuestas (pregunta, tipo, texto, audio, duracion_audio)
    values (pregunta_id, tipo_respuesta,
            case when tipo_respuesta = 'texto' then trim(texto_respuesta) end,
            case when tipo_respuesta = 'voz' then audio_respuesta end,
            case when tipo_respuesta = 'voz' then duracion end)
    returning id into respuesta_id;

  update preguntas set estado = 'respondida' where id = pregunta_id;

  update cupos
    set preguntas_usadas = preguntas_usadas + 1,
        estado = case when preguntas_usadas + 1 >= total_preguntas then 'completo' else estado end
    where artista = pregunta.artista;

  -- Notificación para el fan (si tiene cuenta).
  select nombre_artistico into artista_nombre from artistas where id = pregunta.artista;
  select usuario_id into fan_usuario from fans where id = pregunta.autor;
  if fan_usuario is not null then
    insert into notificaciones (usuario_id, texto, accion)
      values (fan_usuario, artista_nombre || ' respondió tu pregunta.', 'tu-conexion-fan.html?id=' || pregunta_id);
  end if;

  return respuesta_id;
end $$;
grant execute on function responder_pregunta(text, text, text, text, integer) to authenticated;
revoke insert, update, delete on respuestas from authenticated;


-- ----------------------------------------------------------
-- 10. Fan Club: al entrar o salir, las preguntas ya hechas cambian de prioridad
-- ----------------------------------------------------------
create function marcar_preguntas_fan_club() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update preguntas set autor_es_fan_club = true
      where autor = new.fan and artista = new.artista;
  else
    update preguntas set autor_es_fan_club = false
      where autor = old.fan and artista = old.artista;
  end if;
  return null;
end $$;

create trigger miembros_marcar_preguntas after insert or delete on miembros_fan_club
  for each row execute function marcar_preguntas_fan_club();


-- ----------------------------------------------------------
-- 11. Notificaciones: suscripciones al celular y aviso de pregunta nueva
-- ----------------------------------------------------------
create table suscripciones_push (
  endpoint text primary key,   -- la dirección que da el navegador
  usuario_id uuid not null references auth.users on delete cascade,
  p256dh text not null,        -- claves públicas del navegador (no son secretas)
  auth text not null,
  fecha timestamptz not null default now()
);
alter table suscripciones_push enable row level security;
create policy "Sus suscripciones" on suscripciones_push for all
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
grant select, insert, update, delete on suscripciones_push to authenticated;

-- 2. Aviso al artista: «Lucía te envió una pregunta.»
create function avisar_pregunta_nueva() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  artista_usuario uuid;
  fan_nombre text;
begin
  select usuario_id into artista_usuario from artistas where id = new.artista;
  select nombre_perfil into fan_nombre from fans where id = new.autor;
  if artista_usuario is not null then
    insert into notificaciones (usuario_id, texto, accion)
      values (artista_usuario, coalesce(fan_nombre, 'Un fan') || ' te envió una pregunta.',
              'revisar-pregunta-artista.html?id=' || new.id);
  end if;
  return null;
end $$;

create trigger preguntas_avisar after insert on preguntas
  for each row execute function avisar_pregunta_nueva();

-- ----------------------------------------------------------
-- Eliminar mi cuenta (cambio 08, decisión 14)
-- ----------------------------------------------------------
-- Borra la cuenta de quien la pide (y, en cascada, su perfil y todo lo suyo).
-- «security definer»: corre con permisos de administrador, pero solo puede
-- borrar la cuenta de la sesión (auth.uid()), nunca la de otra persona.
-- Con solo_revisar = true no borra nada: la app la llama así primero, para
-- confirmar que la función existe antes de borrar los archivos.
create function eliminar_mi_cuenta(solo_revisar boolean default false) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'sin-sesion';
  end if;
  if solo_revisar then
    return;
  end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke execute on function eliminar_mi_cuenta(boolean) from public, anon;
grant execute on function eliminar_mi_cuenta(boolean) to authenticated;
