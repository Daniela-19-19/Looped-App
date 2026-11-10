-- ==========================================================
-- Looped · Cambio 06: notificaciones (F11 / R11)
-- 1. «suscripciones_push»: los navegadores o celulares que aceptaron
--    recibir notificaciones. Cada persona solo ve y borra las suyas.
-- 2. Aviso para el artista cuando le llega una pregunta nueva.
--    (El aviso al fan cuando le responden ya lo deja responder_pregunta().)
-- El envío al celular lo hace la Edge Function «enviar-push»
-- (supabase/functions/enviar-push/index.js), que se activa con un
-- Database Webhook cuando se crea una fila en «notificaciones».
--
-- Cómo usarlo: SQL Editor → New query → pega todo → Run. Una sola vez,
-- DESPUÉS de los cambios 01 a 05.
-- (esquema.sql ya incluye este cambio, para quien empiece desde cero.)
-- ==========================================================

-- 1. Dónde enviar las notificaciones de cada cuenta.
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
