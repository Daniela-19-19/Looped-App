-- ==========================================================
-- Looped · Cambio 03: reglas de preguntas y votos (Conectar)
-- La base de datos revisa, aunque alguien salte la pantalla:
-- · Solo se pregunta o vota con el cupo abierto y el nivel mínimo.
-- · «Primer contacto» (no sigue al artista) y «Fan Club» los marca ella.
-- · Una pregunta tiene entre 5 y 200 caracteres.
-- · Nadie vota su propia pregunta.
--
-- Cómo usarlo: SQL Editor → New query → pega todo → Run. Una sola vez,
-- DESPUÉS de cambio-01 y cambio-02.
-- (esquema.sql ya incluye este cambio, para quien empiece desde cero.)
-- ==========================================================

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
