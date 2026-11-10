// ==========================================================
// Looped · Edge Function «enviar-push»
// Envía una notificación al celular (push) cada vez que se crea una
// fila en «notificaciones». La activa un Database Webhook de Supabase.
//
// Cómo se instala (en el panel de Supabase, no desde la app):
// 1. Edge Functions → Deploy a new function → Via Editor.
//    Nombre: enviar-push. Pega todo este archivo y despliega.
//    En los ajustes de la función, apaga «Verify JWT» (la protege el
//    secreto PUSH_SECRETO de abajo).
// 2. Edge Functions → Secrets: agrega
//    VAPID_PUBLICA, VAPID_PRIVADA, VAPID_CONTACTO (mailto:…) y PUSH_SECRETO.
// 3. Database → Webhooks → Create: tabla «notificaciones», evento Insert,
//    tipo «Supabase Edge Functions», función enviar-push, y un header
//    x-looped-secreto con el mismo valor de PUSH_SECRETO.
//
// Nada secreto va en este archivo: todo sale de los Secrets de Supabase.
// Está en JavaScript (sin TypeScript), como el resto del proyecto.
// ==========================================================
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

const SECRETO = Deno.env.get('PUSH_SECRETO');
webpush.setVapidDetails(
  Deno.env.get('VAPID_CONTACTO'),
  Deno.env.get('VAPID_PUBLICA'),
  Deno.env.get('VAPID_PRIVADA')
);
// Supabase entrega estas dos variables a toda Edge Function: no hay que crearlas.
const baseDatos = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

Deno.serve(async pedido => {
  // Solo el webhook de Looped (que conoce el secreto) puede usarla.
  if (!SECRETO || pedido.headers.get('x-looped-secreto') !== SECRETO) {
    return new Response('No autorizado', { status: 401 });
  }
  const cuerpo = await pedido.json();
  const aviso = cuerpo.record;
  if (cuerpo.type !== 'INSERT' || !aviso) return new Response('Nada que enviar');

  // Con los avisos desactivados no llega nada al celular (spec.md).
  const { data: preferencia } = await baseDatos.from('preferencias')
    .select('notificaciones').eq('usuario_id', aviso.usuario_id).maybeSingle();
  if (preferencia && preferencia.notificaciones === false) return new Response('Avisos desactivados');

  const { data: suscripciones } = await baseDatos.from('suscripciones_push')
    .select('*').eq('usuario_id', aviso.usuario_id);
  let enviadas = 0;
  for (const suscripcion of suscripciones || []) {
    try {
      await webpush.sendNotification(
        { endpoint: suscripcion.endpoint, keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth } },
        JSON.stringify({ titulo: 'Looped', texto: aviso.texto, accion: aviso.accion })
      );
      enviadas++;
    } catch (error) {
      // El navegador ya no acepta avisos (desinstaló la app o quitó el permiso): se borra.
      if (error.statusCode === 404 || error.statusCode === 410) {
        await baseDatos.from('suscripciones_push').delete().eq('endpoint', suscripcion.endpoint);
      }
    }
  }
  if (enviadas) await baseDatos.from('notificaciones').update({ enviada_celular: true }).eq('id', aviso.id);
  return new Response(JSON.stringify({ enviadas }), { headers: { 'Content-Type': 'application/json' } });
});
