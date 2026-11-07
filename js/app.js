/* ==========================================================
   Looped · Comportamiento de la app
   Una función por pantalla. Cada página dice cuál es en
   <body data-pantalla="...">, y aquí se ejecuta solo la suya.
   ========================================================== */

// ---------- Datos ----------
// Única puerta a los datos. Hoy lee js/data.js; el día que
// conectemos Supabase, solo cambia esta función.
function obtenerDatos(tipo) {
  if (typeof DATOS === 'undefined') return [];
  return DATOS[tipo] || [];
}

// ---------- Sesión ----------
// SIMULADO mientras no esté Supabase: busca el correo entre las cuentas
// de ejemplo y acepta cualquier contraseña que no esté vacía.
// Devuelve { rol, id } o null si el correo no tiene cuenta.
// Con Supabase, aquí se llamará al inicio de sesión real.
function iniciarSesion(correo, contrasena) {
  const buscado = correo.toLowerCase();
  const fan = obtenerDatos('fans').find(f => f.correo.toLowerCase() === buscado);
  if (fan && contrasena) return { rol: 'fan', id: fan.id };
  const artista = obtenerDatos('artistas').find(a => a.correo.toLowerCase() === buscado);
  if (artista && contrasena) return { rol: 'artista', id: artista.id };
  return null;
}

// Guarda quién entró, en este navegador. Si el navegador no deja
// guardar (modo privado), la app sigue funcionando igual.
function guardarSesion(sesion) {
  try { localStorage.setItem('looped-sesion', JSON.stringify(sesion)); } catch (e) { /* sin almacenamiento */ }
}

// ---------- Formularios ----------
function correoValido(texto) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto);
}

// Muestra (o borra, con mensaje vacío) el error debajo de un campo.
function mostrarError(nombreCampo, mensaje) {
  const campo = document.querySelector(`[data-campo="${nombreCampo}"]`);
  if (!campo) return;
  campo.classList.toggle('campo--error', Boolean(mensaje));
  campo.querySelector('.campo__mensaje-error').textContent = mensaje;
  const control = campo.querySelector('.campo__control');
  if (mensaje) control.setAttribute('aria-invalid', 'true');
  else control.removeAttribute('aria-invalid');
}

// ---------- A00 · Splash ----------
// A los 3,5 s pasa sola a la bienvenida; un toque (o una tecla) lo adelanta.
// Con «reducir movimiento», pasa en menos de 1 s.
function pantallaIndex() {
  const splash = document.querySelector('.splash');
  if (!splash) return;
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const salida = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duracion-salida')) || 0;
  const total = reducir ? 900 : 3500; // milisegundos hasta llegar a la bienvenida
  let saliendo = false;

  function irABienvenida() {
    if (saliendo) return;
    saliendo = true;
    clearTimeout(espera);
    splash.classList.add('splash--saliendo');
    // replace: el botón «atrás» del celular no vuelve al splash
    setTimeout(() => location.replace('pages/bienvenida.html'), salida);
  }

  const espera = setTimeout(irABienvenida, total - salida);
  splash.addEventListener('click', irABienvenida);
  document.addEventListener('keydown', irABienvenida);
}

// ---------- A02 · Iniciar sesión ----------
function pantallaIniciarSesion() {
  const formulario = document.getElementById('formulario-sesion');
  const correo = document.getElementById('correo');
  const contrasena = document.getElementById('contrasena');
  const botonVer = document.querySelector('[data-mostrar-contrasena]');

  // Mostrar u ocultar la contraseña
  botonVer.addEventListener('click', () => {
    const mostrar = contrasena.type === 'password';
    contrasena.type = mostrar ? 'text' : 'password';
    botonVer.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
    botonVer.querySelector('use').setAttribute('href', mostrar ? '#icono-ocultar' : '#icono-ver');
  });

  // Al volver a escribir, el error de ese campo se borra
  correo.addEventListener('input', () => mostrarError('correo', ''));
  contrasena.addEventListener('input', () => mostrarError('contrasena', ''));

  formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    const textoCorreo = correo.value.trim();
    let valido = true;

    if (!correoValido(textoCorreo)) {
      mostrarError('correo', 'Escribe un correo válido.');
      valido = false;
    }
    if (!contrasena.value) {
      mostrarError('contrasena', 'Escribe tu contraseña.');
      valido = false;
    }
    if (!valido) {
      formulario.querySelector('[aria-invalid="true"]').focus();
      return;
    }

    const sesion = iniciarSesion(textoCorreo, contrasena.value);
    if (!sesion) {
      mostrarError('correo', 'No encontramos una cuenta con este correo.');
      correo.focus();
      return;
    }

    guardarSesion(sesion);
    // Cada rol abre su lado: el fan su inicio y el artista su panel.
    location.href = sesion.rol === 'artista' ? 'panel-artista.html' : 'inicio-fan.html';
  });
}

// ---------- Arranque ----------
const PANTALLAS = {
  'index': pantallaIndex,
  'iniciar-sesion': pantallaIniciarSesion
};

document.addEventListener('DOMContentLoaded', () => {
  const pantalla = PANTALLAS[document.body.dataset.pantalla];
  if (pantalla) pantalla();
});
