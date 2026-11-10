/* ==========================================================
   Looped · Service worker (notificaciones al celular)
   El navegador lo tiene corriendo aunque la app esté cerrada: recibe
   el aviso que envía la Edge Function «enviar-push» y lo muestra.
   Va en la raíz para poder abrir cualquier pantalla de pages/.
   ========================================================== */

// Llega un aviso: se muestra como notificación del sistema.
self.addEventListener('push', evento => {
  let datos = {};
  try { datos = evento.data ? evento.data.json() : {}; } catch (e) { /* aviso sin datos */ }
  evento.waitUntil(self.registration.showNotification(datos.titulo || 'Looped', {
    body: datos.texto || '',
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    data: { accion: datos.accion || '' }
  }));
});

// Al tocar la notificación se abre su pantalla (p. ej. la respuesta).
self.addEventListener('notificationclick', evento => {
  evento.notification.close();
  const accion = evento.notification.data && evento.notification.data.accion;
  const destino = new URL(`/pages/${accion || 'bienvenida.html'}`, self.location.origin).href;
  evento.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ventanas => {
    const abierta = ventanas.find(ventana => 'focus' in ventana);
    if (abierta) return abierta.navigate(destino).then(ventana => (ventana || abierta).focus());
    return clients.openWindow(destino);
  }));
});
