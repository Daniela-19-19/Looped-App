-- ==========================================================
-- Looped · Cambio 08: eliminar mi cuenta (decisión 14 de spec.md)
-- La función eliminar_mi_cuenta() borra la cuenta de la sesión en
-- Supabase Auth. Como fans y artistas están unidos a la cuenta con
-- «on delete cascade», se borran solos su perfil, seguimientos, visitas,
-- Fan Clubs, cupo, lanzamientos, preguntas, votos, respuestas,
-- publicaciones, cola, avisos, preferencias y suscripciones.
-- Los archivos (fotos, audios, portadas, notas de voz) los borra la app
-- antes de llamar a esta función: Supabase no deja borrarlos desde SQL.
--
-- Cómo usarlo: SQL Editor → New query → pega todo → Run. Una sola vez,
-- DESPUÉS de los cambios 01 a 07.
-- (esquema.sql ya incluye este cambio, para quien empiece desde cero.)
-- ==========================================================

-- Borra la cuenta de quien la pide (y, en cascada, su perfil y todo lo suyo).
-- «security definer»: corre con permisos de administrador, pero solo puede
-- borrar la cuenta de la sesión (auth.uid()), nunca la de otra persona.
create function eliminar_mi_cuenta() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'sin-sesion';
  end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke execute on function eliminar_mi_cuenta() from public, anon;
grant execute on function eliminar_mi_cuenta() to authenticated;
