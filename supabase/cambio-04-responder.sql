-- ==========================================================
-- Looped · Cambio 04: responder preguntas (R06)
-- La función responder_pregunta() hace todo junto, o nada:
-- · guarda la respuesta (texto o nota de voz),
-- · marca la pregunta como respondida,
-- · gasta una respuesta del cupo (y lo marca «completo» si se llena),
-- · deja una notificación para el fan.
-- Solo puede usarla el artista al que le hicieron la pregunta, con el
-- cupo abierto y respuestas disponibles.
--
-- Cómo usarlo: SQL Editor → New query → pega todo → Run. Una sola vez,
-- DESPUÉS de los cambios 01, 02 y 03.
-- (esquema.sql ya incluye este cambio, para quien empiece desde cero.)
-- ==========================================================

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

-- Las respuestas solo se crean con responder_pregunta(): el artista ya no
-- puede escribir directo en la tabla (así el cupo siempre cuadra).
drop policy "El artista responde" on respuestas;
revoke insert, update, delete on respuestas from authenticated;
