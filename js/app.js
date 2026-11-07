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

// Botón del ojo: muestra u oculta la contraseña de un campo.
function activarMostrarContrasena(control, boton) {
  boton.addEventListener('click', () => {
    const mostrar = control.type === 'password';
    control.type = mostrar ? 'text' : 'password';
    boton.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
    boton.querySelector('use').setAttribute('href', mostrar ? '#icono-ocultar' : '#icono-ver');
  });
}

// ¿Este correo ya tiene una cuenta, de fan o de artista?
function correoRegistrado(correo) {
  const buscado = correo.toLowerCase();
  return obtenerDatos('fans').some(f => f.correo.toLowerCase() === buscado) ||
    obtenerDatos('artistas').some(a => a.correo.toLowerCase() === buscado);
}

// ---------- Registro en curso ----------
// Lo que la persona va llenando en los pasos del registro (rol, correo…),
// guardado solo en esta pestaña. Nunca se guarda la contraseña.
// SIMULADO: con Supabase, la cuenta se crea de verdad al continuar.
function leerRegistro() {
  try { return JSON.parse(sessionStorage.getItem('looped-registro')) || {}; } catch (e) { return {}; }
}
function guardarRegistro(cambios) {
  const registro = Object.assign(leerRegistro(), cambios);
  try { sessionStorage.setItem('looped-registro', JSON.stringify(registro)); } catch (e) { /* sin almacenamiento */ }
  return registro;
}

// Rol del registro: primero el de la dirección (?rol=fan o ?rol=artista),
// si no, el que ya se había elegido. Devuelve null si no hay ninguno.
function rolDelRegistro() {
  const rol = new URLSearchParams(location.search).get('rol') || leerRegistro().rol;
  return rol === 'fan' || rol === 'artista' ? rol : null;
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
  activarMostrarContrasena(contrasena, document.querySelector('[data-mostrar-contrasena]'));

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

// ---------- A03 · Crear cuenta: elegir experiencia ----------
// Cada opción es un enlace a crear-cuenta.html?rol=fan o ?rol=artista.
// Al tocarla, la app toma el color del rol (turquesa o violeta) y
// recuerda el rol para el resto del registro.
function pantallaElegirExperiencia() {
  document.querySelectorAll('[data-elegir-rol]').forEach(enlace => {
    enlace.addEventListener('click', () => {
      const rol = enlace.dataset.elegirRol;
      document.documentElement.dataset.rol = rol;
      guardarRegistro({ rol });
    });
  });
}

// ---------- A03f / A03r · Crear cuenta ----------
function pantallaCrearCuenta() {
  // Sin rol elegido no se puede crear la cuenta: vuelve a elegir.
  const rol = rolDelRegistro();
  if (!rol) {
    location.replace('elegir-experiencia.html');
    return;
  }
  // La pantalla toma el color y el texto del rol.
  document.documentElement.dataset.rol = rol;
  document.querySelector('[data-nombre-rol]').textContent = rol;
  guardarRegistro({ rol });

  const formulario = document.getElementById('formulario-cuenta');
  const correo = document.getElementById('correo');
  const contrasena = document.getElementById('contrasena');
  correo.value = leerRegistro().correo || '';

  activarMostrarContrasena(contrasena, document.querySelector('[data-mostrar-contrasena]'));
  correo.addEventListener('input', () => mostrarError('correo', ''));
  contrasena.addEventListener('input', () => mostrarError('contrasena', ''));

  formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    const textoCorreo = correo.value.trim();

    if (!correoValido(textoCorreo)) mostrarError('correo', 'Escribe un correo válido.');
    else if (correoRegistrado(textoCorreo)) mostrarError('correo', 'Este correo ya tiene una cuenta. Inicia sesión.');
    if (contrasena.value.length < 6) mostrarError('contrasena', 'La contraseña necesita al menos 6 caracteres.');

    const conError = formulario.querySelector('[aria-invalid="true"]');
    if (conError) {
      conError.focus();
      return;
    }

    // SIMULADO: aquí se creará la cuenta en Supabase. Por ahora solo se
    // recuerda el correo para los pasos siguientes (la contraseña no).
    guardarRegistro({ correo: textoCorreo });
    location.href = rol === 'artista' ? 'identidad-artista.html' : 'perfil-basico-fan.html';
  });
}

// ---------- Arranque ----------
const PANTALLAS = {
  'index': pantallaIndex,
  'iniciar-sesion': pantallaIniciarSesion,
  'elegir-experiencia': pantallaElegirExperiencia,
  'crear-cuenta': pantallaCrearCuenta
};

document.addEventListener('DOMContentLoaded', () => {
  const pantalla = PANTALLAS[document.body.dataset.pantalla];
  if (pantalla) pantalla();
});
