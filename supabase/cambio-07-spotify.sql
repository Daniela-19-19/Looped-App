-- ==========================================================
-- Looped · Cambio 07: Spotify con links (decisión 13 de spec.md)
-- 1. «artistas.spotify»: el código de su perfil de artista en Spotify.
-- 2. «fans.spotify_listas»: hasta 3 códigos de listas de Spotify.
-- Se guarda solo el código de 22 letras y números (el que va después
-- de /artist/ o /playlist/ en el link), nunca un link cualquiera.
-- 3. Permiso para que cada persona edite esas columnas en su perfil
--    (las tablas tienen permisos por columna: ver «Contadores protegidos»).
--
-- Cómo usarlo: SQL Editor → New query → pega todo → Run. Una sola vez,
-- DESPUÉS de los cambios 01 a 06.
-- (esquema.sql ya incluye este cambio, para quien empiece desde cero.)
-- ==========================================================

-- 1 y 2. Columnas nuevas, con revisión del formato.
alter table artistas add column spotify text
  check (spotify ~ '^[A-Za-z0-9]{22}$');
alter table fans add column spotify_listas text[] not null default '{}'
  check (cardinality(spotify_listas) <= 3
    and array_to_string(spotify_listas, ',') ~ '^([A-Za-z0-9]{22}(,[A-Za-z0-9]{22})*)?$');

-- 3. Cada persona puede cambiarlas en su perfil (RLS sigue diciendo que solo el suyo).
grant insert (spotify), update (spotify) on artistas to authenticated;
grant insert (spotify_listas), update (spotify_listas) on fans to authenticated;
