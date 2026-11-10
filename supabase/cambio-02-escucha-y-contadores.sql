-- ==========================================================
-- Looped · Cambio 02: minutos de escucha y contadores protegidos
-- 1. Los minutos de escucha (definen el nivel del fan) se guardan en
--    Supabase con la función sumar_escucha().
-- 2. Nadie puede cambiar a mano sus contadores (minutos, seguidores,
--    votos) ni el estado de un lanzamiento ajeno: solo las funciones y
--    triggers de la base de datos los cambian.
--
-- Cómo usarlo: SQL Editor → New query → pega todo → Run. Una sola vez,
-- DESPUÉS de cambio-01-visitas.sql.
-- (esquema.sql ya incluye este cambio, para quien empiece desde cero.)
-- ==========================================================

-- 1. Segundos de escucha (los minutos salen de aquí).
alter table fans add column segundos_escucha integer not null default 0;
update fans set segundos_escucha = minutos_escucha * 60;

-- Suma lo escuchado al fan que inició sesión y devuelve sus minutos.
-- Como mucho 60 segundos por llamada: la app la llama cada pocos segundos.
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

-- 2. Qué columnas puede escribir cada persona (las demás, solo la base de datos).
revoke insert, update on fans from authenticated;
grant insert (usuario_id, nombre_perfil, nombre_usuario, foto, gustos_musicales, intereses),
      update (usuario_id, nombre_perfil, nombre_usuario, foto, gustos_musicales, intereses)
  on fans to authenticated;

revoke insert, update on artistas from authenticated;
grant insert (usuario_id, nombre_artistico, nombre_usuario, foto, presentacion, ciudad, generos, roles),
      update (usuario_id, nombre_artistico, nombre_usuario, foto, presentacion, ciudad, generos, roles)
  on artistas to authenticated;

-- Preguntas: el fan escribe el texto; los votos los cuenta la base de
-- datos y el artista solo cambia el estado.
revoke insert, update on preguntas from authenticated;
grant insert (artista, autor, autor_es_fan_club, primer_contacto, texto),
      update (estado)
  on preguntas to authenticated;
