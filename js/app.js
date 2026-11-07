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
  const control = campo.querySelector('.campo__control, .area-texto');
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

// ---------- Foto y nombre de usuario (pasos de identidad) ----------
// Iniciales de un nombre: «Mara Sol» → «MS».
function iniciales(nombre) {
  return nombre.trim().split(/\s+/).slice(0, 2).map(p => p.charAt(0)).join('').toUpperCase();
}

// Nombre de usuario: sin @, minúsculas, sin tildes, solo letras, números y _.
function limpiarUsuario(texto) {
  return texto.replace(/^@+/, '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9_]/g, '').slice(0, 20);
}

// Achica una imagen para que su lado más largo mida como máximo «lado» px.
// Devuelve la imagen como texto (data URL) para poder mostrarla y recordarla.
function reducirImagen(archivo, lado) {
  return new Promise((resolver, rechazar) => {
    const url = URL.createObjectURL(archivo);
    const imagen = new Image();
    imagen.onload = () => {
      const escala = Math.min(1, lado / Math.max(imagen.width, imagen.height));
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.round(imagen.width * escala);
      lienzo.height = Math.round(imagen.height * escala);
      lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
      URL.revokeObjectURL(url);
      resolver(lienzo.toDataURL('image/jpeg', 0.85));
    };
    imagen.onerror = () => { URL.revokeObjectURL(url); rechazar(new Error('imagen')); };
    imagen.src = url;
  });
}

// Pinta el círculo: la foto si hay, si no las iniciales, si no el ícono.
function pintarAvatar(avatar, foto, nombre) {
  avatar.replaceChildren();
  if (foto) {
    const img = document.createElement('img');
    img.src = foto;
    img.alt = '';
    avatar.append(img);
  } else if (nombre.trim()) {
    avatar.textContent = iniciales(nombre);
  } else {
    avatar.innerHTML = '<svg class="icono" aria-hidden="true"><use href="#icono-perfil"></use></svg>';
  }
}

// Pasos de identidad (A05r artista y A05f fan): foto opcional, nombre y usuario.
// SIMULADO: con Supabase, aquí se guardan el perfil y la foto de verdad.
function pasoIdentidad({ rol, campoNombre, errorNombre, usuarioAutomatico, destino }) {
  // Solo se llega aquí después de crear la cuenta con este rol.
  const registro = leerRegistro();
  if (registro.rol !== rol || !registro.correo) {
    location.replace('elegir-experiencia.html');
    return;
  }

  const formulario = document.getElementById('formulario-identidad');
  const nombre = document.getElementById('nombre');
  const usuario = document.getElementById('usuario');
  const entradaFoto = document.querySelector('[data-foto-entrada]');
  const avatar = document.querySelector('[data-foto-avatar]');
  const textoFoto = document.querySelector('[data-foto-texto]');
  let foto = registro.foto || null;
  // El usuario se llena solo con el nombre hasta que la persona lo cambia.
  let usuarioTocado = Boolean(registro.nombreUsuario) || !usuarioAutomatico;

  // Si vuelve a este paso, encuentra lo que ya había escrito.
  nombre.value = registro[campoNombre] || '';
  usuario.value = registro.nombreUsuario ? '@' + registro.nombreUsuario : '';
  pintarAvatar(avatar, foto, nombre.value);
  if (foto) textoFoto.textContent = 'Toca para cambiarla.';

  entradaFoto.addEventListener('change', async () => {
    const archivo = entradaFoto.files[0];
    if (!archivo) return;
    try {
      foto = await reducirImagen(archivo, 512);
      pintarAvatar(avatar, foto, nombre.value);
      textoFoto.textContent = 'Toca para cambiarla.';
      guardarRegistro({ foto });
    } catch (e) {
      textoFoto.textContent = 'No pudimos usar esa imagen. Prueba con otra.';
    }
    entradaFoto.value = '';
  });

  nombre.addEventListener('input', () => {
    mostrarError('nombre', '');
    if (!foto) pintarAvatar(avatar, null, nombre.value);
    if (!usuarioTocado) {
      const sugerido = limpiarUsuario(nombre.value);
      usuario.value = sugerido ? '@' + sugerido : '';
      mostrarError('usuario', '');
    }
  });
  usuario.addEventListener('input', () => {
    usuarioTocado = true;
    mostrarError('usuario', '');
  });
  // Al salir del campo, el usuario queda limpio y con su @.
  usuario.addEventListener('blur', () => {
    const limpio = limpiarUsuario(usuario.value);
    usuario.value = limpio ? '@' + limpio : '';
  });

  formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    const textoNombre = nombre.value.trim();
    const textoUsuario = limpiarUsuario(usuario.value);

    if (!textoNombre) mostrarError('nombre', errorNombre);
    if (!textoUsuario) mostrarError('usuario', 'Elige un nombre de usuario.');

    const conError = formulario.querySelector('[aria-invalid="true"]');
    if (conError) {
      conError.focus();
      return;
    }

    guardarRegistro({ [campoNombre]: textoNombre, nombreUsuario: textoUsuario, foto });
    location.href = destino;
  });
}

// ---------- A05r · Identidad del artista ----------
function pantallaIdentidadArtista() {
  pasoIdentidad({
    rol: 'artista',
    campoNombre: 'nombreArtistico',
    errorNombre: 'Escribe tu nombre artístico.',
    usuarioAutomatico: false,
    destino: 'presentacion-artista.html'
  });
}

// ---------- A05f · Perfil básico del fan ----------
function pantallaPerfilBasicoFan() {
  pasoIdentidad({
    rol: 'fan',
    campoNombre: 'nombrePerfil',
    errorNombre: 'Escribe cómo quieres que te vean.',
    usuarioAutomatico: true,
    destino: 'gustos-fan.html'
  });
}

// Contador de caracteres: muestra «escritos/máximo» mientras se escribe.
function activarContador(control, contador) {
  const actualizar = () => { contador.textContent = `${control.value.length}/${control.maxLength}`; };
  control.addEventListener('input', actualizar);
  actualizar();
}

// ---------- A06r · Presentación ----------
// SIMULADO: con Supabase, aquí se guardan la presentación y la ciudad.
function pantallaPresentacionArtista() {
  // Solo se llega aquí después de la identidad del artista.
  const registro = leerRegistro();
  if (registro.rol !== 'artista' || !registro.nombreArtistico) {
    location.replace('elegir-experiencia.html');
    return;
  }

  const formulario = document.getElementById('formulario-presentacion');
  const presentacion = document.getElementById('presentacion');
  const ciudad = document.getElementById('ciudad');

  // Si vuelve a este paso, encuentra lo que ya había escrito.
  presentacion.value = registro.presentacion || '';
  ciudad.value = registro.ciudad || '';
  activarContador(presentacion, document.querySelector('[data-contador]'));
  presentacion.addEventListener('input', () => mostrarError('presentacion', ''));

  formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    const textoPresentacion = presentacion.value.trim();
    if (!textoPresentacion) {
      mostrarError('presentacion', 'Escribe una presentación breve.');
      presentacion.focus();
      return;
    }
    // La ciudad es opcional: puede quedar vacía.
    guardarRegistro({ presentacion: textoPresentacion, ciudad: ciudad.value.trim() });
    location.href = 'estilo-musical-artista.html';
  });
}

// ---------- Casillas ----------
// Dibuja una casilla del kit (.casilla) por cada opción de una lista de datos.
function dibujarCasillas(contenedor, opciones, nombre, marcadas) {
  contenedor.replaceChildren(...opciones.map(opcion => {
    const etiqueta = document.createElement('label');
    etiqueta.className = 'casilla';
    const casilla = document.createElement('input');
    casilla.type = 'checkbox';
    casilla.name = nombre;
    casilla.value = opcion.id;
    casilla.checked = marcadas.includes(opcion.id);
    const caja = document.createElement('span');
    caja.className = 'casilla__caja';
    caja.innerHTML = '<svg class="icono" aria-hidden="true"><use href="#icono-check"></use></svg>';
    etiqueta.append(casilla, caja, opcion.nombre);
    return etiqueta;
  }));
}

// Los valores (ids) de las casillas marcadas.
function casillasMarcadas(contenedor) {
  return [...contenedor.querySelectorAll('input:checked')].map(casilla => casilla.value);
}

// Pasos de géneros (A07r artista y A06f fan).
// «Continuar» guarda lo marcado; «Lo haré después» avanza sin guardar.
// SIMULADO: con Supabase, aquí se guardan los géneros de verdad.
function pasoGeneros({ rol, pasoAnterior, campo, destino }) {
  // Solo se llega aquí después del paso anterior del registro.
  const registro = leerRegistro();
  if (registro.rol !== rol || !registro[pasoAnterior]) {
    location.replace('elegir-experiencia.html');
    return;
  }

  const formulario = document.getElementById('formulario-generos');
  const lista = document.querySelector('[data-lista-generos]');
  dibujarCasillas(lista, obtenerDatos('generos'), 'generos', registro[campo] || []);

  formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    guardarRegistro({ [campo]: casillasMarcadas(lista) });
    location.href = destino;
  });

  document.querySelector('[data-despues]').addEventListener('click', () => {
    guardarRegistro({ [campo]: [] });
    location.href = destino;
  });
}

// ---------- A07r · Estilo musical ----------
function pantallaEstiloMusicalArtista() {
  pasoGeneros({
    rol: 'artista',
    pasoAnterior: 'presentacion',
    campo: 'generos',
    destino: 'proyecto-musical-artista.html'
  });
}

// ---------- A06f · Gustos musicales ----------
function pantallaGustosFan() {
  pasoGeneros({
    rol: 'fan',
    pasoAnterior: 'nombrePerfil',
    campo: 'gustosMusicales',
    destino: 'intereses-fan.html'
  });
}

// ---------- Arranque ----------
const PANTALLAS = {
  'index': pantallaIndex,
  'iniciar-sesion': pantallaIniciarSesion,
  'elegir-experiencia': pantallaElegirExperiencia,
  'crear-cuenta': pantallaCrearCuenta,
  'identidad-artista': pantallaIdentidadArtista,
  'perfil-basico-fan': pantallaPerfilBasicoFan,
  'presentacion-artista': pantallaPresentacionArtista,
  'estilo-musical-artista': pantallaEstiloMusicalArtista,
  'gustos-fan': pantallaGustosFan
};

document.addEventListener('DOMContentLoaded', () => {
  const pantalla = PANTALLAS[document.body.dataset.pantalla];
  if (pantalla) pantalla();
});
