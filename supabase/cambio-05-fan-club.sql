-- ==========================================================
-- Looped · Cambio 05: prioridad del Fan Club en preguntas ya hechas
-- Al entrar o salir del Fan Club de un artista, se actualiza la marca
-- «Fan Club» de las preguntas que ese fan ya le había hecho. Así la
-- prioridad en la bandeja cambia de inmediato.
-- (Las preguntas nuevas ya se marcan solas desde el cambio 03.)
--
-- Cómo usarlo: SQL Editor → New query → pega todo → Run. Una sola vez,
-- DESPUÉS de los cambios 01 a 04.
-- (esquema.sql ya incluye este cambio, para quien empiece desde cero.)
-- ==========================================================

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
