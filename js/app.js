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
  // Primero, la cuenta creada en el registro (guardada en este navegador).
  const propia = perfilGuardado();
  if (propia && propia.correo.toLowerCase() === buscado && contrasena) {
    return { rol: rolDelPerfil(propia), id: propia.id };
  }
  const fan = obtenerDatos('fans').find(f => f.correo.toLowerCase() === buscado);
  if (fan && contrasena) return { rol: 'fan', id: fan.id };
  const artista = obtenerDatos('artistas').find(a => a.correo.toLowerCase() === buscado);
  if (artista && contrasena) return { rol: 'artista', id: artista.id };
  return null;
}

// La cuenta creada al terminar el registro, guardada en este navegador
// (SIMULADO hasta conectar Supabase). null si no hay ninguna.
function perfilGuardado() {
  try { return JSON.parse(localStorage.getItem('looped-perfil')); } catch (e) { return null; }
}
// Un perfil de artista tiene nombre artístico; uno de fan, nombre de perfil.
function rolDelPerfil(perfil) {
  return perfil.nombreArtistico ? 'artista' : 'fan';
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
  const propia = perfilGuardado();
  if (propia && propia.correo.toLowerCase() === buscado) return true;
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

// Pasos de casillas del registro: géneros (A07r, A06f), roles (A08r)
// e intereses (A07f). Muestra la lista de datos indicada en el grupo
// .casillas del formulario de la pantalla.
// El botón principal guarda lo marcado; «Lo haré después» avanza sin guardar.
// SIMULADO: con Supabase, aquí se guarda lo marcado de verdad.
function pasoCasillas({ rol, pasoAnterior, lista, campo, destino }) {
  // Solo se llega aquí después del paso anterior del registro.
  const registro = leerRegistro();
  if (registro.rol !== rol || !registro[pasoAnterior]) {
    location.replace('elegir-experiencia.html');
    return;
  }

  const formulario = document.querySelector('main form');
  const grupo = formulario.querySelector('.casillas');
  dibujarCasillas(grupo, obtenerDatos(lista), lista, registro[campo] || []);

  formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    guardarRegistro({ [campo]: casillasMarcadas(grupo) });
    location.href = destino;
  });

  document.querySelector('[data-despues]').addEventListener('click', () => {
    guardarRegistro({ [campo]: [] });
    location.href = destino;
  });
}

// ---------- A07r · Estilo musical ----------
function pantallaEstiloMusicalArtista() {
  pasoCasillas({
    rol: 'artista',
    pasoAnterior: 'presentacion',
    lista: 'generos',
    campo: 'generos',
    destino: 'proyecto-musical-artista.html'
  });
}

// ---------- A06f · Gustos musicales ----------
function pantallaGustosFan() {
  pasoCasillas({
    rol: 'fan',
    pasoAnterior: 'nombrePerfil',
    lista: 'generos',
    campo: 'gustosMusicales',
    destino: 'intereses-fan.html'
  });
}

// ---------- A08r · Proyecto musical ----------
function pantallaProyectoMusicalArtista() {
  pasoCasillas({
    rol: 'artista',
    pasoAnterior: 'generos',
    lista: 'roles',
    campo: 'roles',
    destino: 'perfil-listo-artista.html'
  });
}

// ---------- A07f · Intereses ----------
function pantallaInteresesFan() {
  pasoCasillas({
    rol: 'fan',
    pasoAnterior: 'gustosMusicales',
    lista: 'intereses',
    campo: 'intereses',
    destino: 'perfil-listo-fan.html'
  });
}

// ---------- Fin del registro ----------
// Arma el perfil con los campos de spec.md («Datos»): artistas o fans.
function perfilDelRegistro(registro) {
  const comun = {
    id: `${registro.rol}-${Date.now()}`,
    nombreUsuario: registro.nombreUsuario,
    correo: registro.correo,
    foto: registro.foto || null
  };
  if (registro.rol === 'artista') {
    return Object.assign(comun, {
      nombreArtistico: registro.nombreArtistico,
      presentacion: registro.presentacion || '',
      ciudad: registro.ciudad || '',
      generos: registro.generos || [],
      roles: registro.roles || [],
      seguidores: 0,
      emergente: true
    });
  }
  return Object.assign(comun, {
    nombrePerfil: registro.nombrePerfil,
    gustosMusicales: registro.gustosMusicales || [],
    intereses: registro.intereses || [],
    minutosEscucha: 0,
    artistasQueSigue: [],
    fanClubs: [],
    fanFundadorDe: [],
    fechaRegistro: new Date().toISOString().slice(0, 10)
  });
}

// SIMULADO: crea la cuenta guardando el perfil en este navegador.
// Con Supabase, aquí se crea la cuenta de verdad (la contraseña la
// maneja Supabase; nunca se guarda en el código ni en el navegador).
function crearCuentaSimulada(registro) {
  const perfil = perfilDelRegistro(registro);
  try { localStorage.setItem('looped-perfil', JSON.stringify(perfil)); } catch (e) { /* sin almacenamiento */ }
  guardarSesion({ rol: registro.rol, id: perfil.id });
  try { sessionStorage.removeItem('looped-registro'); } catch (e) { /* sin almacenamiento */ }
  return perfil;
}

// Pasos «perfil listo» (A09r artista y A08f fan): resumen y entrada a su lado.
function pasoPerfilListo({ rol, pasoAnterior, campoNombre, campoGeneros, etiquetaRol, destino }) {
  // Solo se llega aquí al terminar los pasos del registro.
  const registro = leerRegistro();
  if (registro.rol !== rol || !registro[pasoAnterior] || !registro[campoNombre]) {
    location.replace('elegir-experiencia.html');
    return;
  }

  // Resumen: foto, nombre, @usuario (y ciudad) y etiquetas.
  const nombre = registro[campoNombre];
  pintarAvatar(document.querySelector('[data-resumen-avatar]'), registro.foto, nombre);
  document.querySelector('[data-resumen-nombre]').textContent = nombre;
  document.querySelector('[data-resumen-detalle]').textContent =
    '@' + registro.nombreUsuario + (registro.ciudad ? ' · ' + registro.ciudad : '');

  const generos = obtenerDatos('generos');
  const nombresGeneros = (registro[campoGeneros] || [])
    .map(id => (generos.find(g => g.id === id) || {}).nombre)
    .filter(Boolean)
    .slice(0, 3);
  const etiquetas = [etiquetaRol, ...nombresGeneros].map((texto, i) => {
    const etiqueta = document.createElement('span');
    etiqueta.className = i === 0 ? 'etiqueta etiqueta--acento' : 'etiqueta';
    etiqueta.textContent = texto;
    return etiqueta;
  });
  document.querySelector('[data-resumen-etiquetas]').replaceChildren(...etiquetas);

  // Al entrar, la cuenta queda creada. replace: «atrás» no vuelve al registro.
  document.querySelector('[data-entrar]').addEventListener('click', () => {
    crearCuentaSimulada(registro);
    location.replace(destino);
  });
}

// ---------- A09r · Perfil del artista listo ----------
function pantallaPerfilListoArtista() {
  pasoPerfilListo({
    rol: 'artista',
    pasoAnterior: 'roles',
    campoNombre: 'nombreArtistico',
    campoGeneros: 'generos',
    etiquetaRol: 'Perfil artista',
    destino: 'panel-artista.html'
  });
}

// ---------- A08f · Perfil del fan listo ----------
function pantallaPerfilListoFan() {
  pasoPerfilListo({
    rol: 'fan',
    pasoAnterior: 'intereses',
    campoNombre: 'nombrePerfil',
    campoGeneros: 'gustosMusicales',
    etiquetaRol: 'Perfil fan',
    destino: 'inicio-fan.html'
  });
}

// ---------- Utilidades compartidas ----------
// Desde pages/ las rutas de data.js (desde la raíz) necesitan «../».
const RAIZ = location.pathname.includes('/pages/') ? '../' : '';
function rutaRecurso(ruta) {
  return ruta ? RAIZ + ruta : null;
}

// Para poner textos de los datos dentro de HTML sin riesgo.
function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Quién inició sesión en este navegador: { rol, id } o null.
function leerSesion() {
  try { return JSON.parse(localStorage.getItem('looped-sesion')); } catch (e) { return null; }
}

// El artista de la sesión: uno de data.js o el recién registrado. null si no hay.
function artistaActual() {
  const sesion = leerSesion();
  if (!sesion || sesion.rol !== 'artista') return null;
  const deEjemplo = obtenerDatos('artistas').find(a => a.id === sesion.id);
  if (deEjemplo) return deEjemplo;
  const propia = perfilGuardado();
  return propia && propia.id === sesion.id ? propia : null;
}

// Hace cuánto: «Hace 5 h», «Ayer», «Hace 9 días».
function haceCuanto(fecha) {
  const minutos = Math.round((Date.now() - new Date(fecha)) / 60000);
  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'Ayer' : `Hace ${dias} días`;
}

// ---------- Reglas de spec.md ----------
// Ventana de visibilidad: 48 h desde la publicación.
const HORAS_VENTANA = 48;
function horasRestantesVentana(lanzamiento) {
  const pasadas = (Date.now() - new Date(lanzamiento.fechaPublicacion)) / 3600000;
  return Math.max(0, Math.ceil(HORAS_VENTANA - pasadas));
}

// Nivel del fan: el nivel 1 pide 15 minutos y cada nivel siguiente pide
// 1,5 veces lo del anterior, redondeado (15, 23, 34, 51…). Empieza en 0.
function nivelPorMinutos(minutos) {
  let nivel = 0;
  let acumulado = 0;
  while (true) {
    acumulado += Math.round(15 * Math.pow(1.5, nivel));
    if (minutos < acumulado) return nivel;
    nivel++;
  }
}

function textoNivelMinimo(nivel) {
  return !nivel || nivel <= 1 ? 'Sin requisito de nivel' : `Nivel ${nivel} o superior`;
}

// Preguntas nuevas de un artista, solo de fans con el nivel mínimo del cupo.
// Orden (decisión del equipo): más votadas primero; si empatan, Fan Club primero.
function preguntasNuevas(artistaId) {
  const cupo = obtenerDatos('cupos').find(c => c.artista === artistaId);
  const nivelMinimo = cupo ? cupo.nivelMinimo : 0;
  const fans = obtenerDatos('fans');
  return obtenerDatos('preguntas')
    .filter(p => p.artista === artistaId && p.estado === 'nueva')
    .filter(p => {
      const autor = fans.find(f => f.id === p.autor);
      return autor && nivelPorMinutos(autor.minutosEscucha) >= nivelMinimo;
    })
    .sort((a, b) => (b.votos - a.votos) || (b.autorEsFanClub - a.autorEsFanClub) || (new Date(a.fecha) - new Date(b.fecha)));
}

// ---------- Apariencia (tema claro u oscuro) ----------
// SIMULADO: la preferencia se recuerda en este navegador; con Supabase
// se guardará en «preferencias» y seguirá igual al volver a iniciar sesión.
function leerPreferencias() {
  try { return JSON.parse(localStorage.getItem('looped-preferencias')) || {}; } catch (e) { return {}; }
}
function aplicarTema() {
  if (leerPreferencias().apariencia === 'claro') document.documentElement.dataset.tema = 'claro';
  else delete document.documentElement.dataset.tema;
}
// Activa un botón que alterna claro y oscuro (con su aria-label al día).
function activarCambioDeTema(boton) {
  if (!boton) return;
  const actualizar = () => {
    const claro = document.documentElement.dataset.tema === 'claro';
    boton.setAttribute('aria-label', claro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
  };
  boton.addEventListener('click', () => {
    const preferencias = leerPreferencias();
    preferencias.apariencia = preferencias.apariencia === 'claro' ? 'oscuro' : 'claro';
    try { localStorage.setItem('looped-preferencias', JSON.stringify(preferencias)); } catch (e) { /* sin almacenamiento */ }
    aplicarTema();
    actualizar();
  });
  actualizar();
}

// ---------- R01 · Panel del artista ----------
function pantallaPanelArtista() {
  // Sin sesión de artista, a iniciar sesión.
  const artista = artistaActual();
  if (!artista) {
    location.replace('iniciar-sesion.html');
    return;
  }

  // Barra de marca y saludo
  activarCambioDeTema(document.querySelector('[data-cambiar-tema]'));
  pintarAvatar(document.querySelector('[data-avatar-sesion]'), rutaRecurso(artista.foto), artista.nombreArtistico);
  document.querySelector('[data-nombre-corto]').textContent = artista.nombreArtistico.split(' ')[0];

  // Preguntas nuevas: aviso en el botón y en la navegación
  const nuevas = preguntasNuevas(artista.id);
  const acceso = document.querySelector('[data-acceso-preguntas]');
  const pestana = document.querySelector('[data-pestana-preguntas]');
  if (nuevas.length) {
    acceso.textContent = `Preguntas · ${nuevas.length}`;
    acceso.setAttribute('aria-label', `Preguntas de fans, ${nuevas.length} nuevas`);
    pestana.insertAdjacentHTML('beforeend', '<i class="navegacion__aviso" aria-hidden="true"></i>');
    pestana.setAttribute('aria-label', `Preguntas, ${nuevas.length} nuevas`);
  }

  // Tu último lanzamiento
  const lanzamientos = obtenerDatos('lanzamientos')
    .filter(l => l.artista === artista.id)
    .sort((a, b) => new Date(b.fechaPublicacion) - new Date(a.fechaPublicacion));
  const ultimo = lanzamientos[0];
  const cajaLanzamiento = document.querySelector('[data-ultimo-lanzamiento]');
  if (ultimo) {
    const horas = horasRestantesVentana(ultimo);
    const estadoVentana = horas > 0 ? `En su ventana · Quedan ${horas} h` : haceCuanto(ultimo.fechaPublicacion);
    const portada = ultimo.portada
      ? `<img class="portada" src="${escapar(rutaRecurso(ultimo.portada))}" alt="Portada de ${escapar(ultimo.nombreLanzamiento)}">`
      : `<div class="portada" role="img" aria-label="${escapar(ultimo.nombreLanzamiento)}, sin portada"></div>`;
    cajaLanzamiento.innerHTML = `
      <article class="tarjeta tarjeta--acento tarjeta--destacada">
        <div class="tarjeta__info">
          <div>
            <h3 class="tarjeta__titulo">${escapar(ultimo.nombreLanzamiento)}</h3>
            <p class="tarjeta__texto">${escapar(artista.nombreArtistico)}</p>
            <p class="tarjeta__meta">${escapar(estadoVentana)}</p>
          </div>
          <a class="boton-icono" href="lanzamiento-artista.html?id=${encodeURIComponent(ultimo.id)}" aria-label="Ver lanzamiento ${escapar(ultimo.nombreLanzamiento)}">
            <svg class="icono" aria-hidden="true"><use href="#icono-ver"></use></svg>
          </a>
        </div>
        ${portada}
      </article>`;
  } else {
    document.querySelector('[data-ver-todo-musica]').remove(); // nada que ver todavía
    cajaLanzamiento.innerHTML = `
      <div class="tarjeta">
        <p class="tarjeta__texto">Aún no has publicado música.</p>
        <div class="tarjeta__acciones"><a class="boton boton--bloque" href="publicar-lanzamiento-artista.html">Publicar lanzamiento</a></div>
      </div>`;
  }

  // Disponibilidad (cupo). Un artista nuevo todavía no tiene cupo: cerrado.
  const cupo = obtenerDatos('cupos').find(c => c.artista === artista.id);
  const cajaCupo = document.querySelector('[data-disponibilidad]');
  if (cupo && cupo.estado === 'abierto') {
    const quedan = Math.max(0, cupo.totalPreguntas - cupo.preguntasUsadas);
    cajaCupo.innerHTML = `
      <div class="tarjeta">
        <div class="tarjeta__encabezado">
          <h3 class="tarjeta__titulo">Preguntas abiertas</h3>
          <span class="etiqueta etiqueta--borde">${quedan} de ${cupo.totalPreguntas}</span>
        </div>
        <div class="progreso" role="progressbar" aria-label="Respuestas usadas" aria-valuemin="0"
          aria-valuemax="${cupo.totalPreguntas}" aria-valuenow="${cupo.preguntasUsadas}"><span class="progreso__barra"></span></div>
        <p class="tarjeta__texto">Los fans pueden enviarte preguntas y votar. ${escapar(textoNivelMinimo(cupo.nivelMinimo))}.</p>
      </div>`;
    cajaCupo.querySelector('.progreso__barra').style.width = `${(cupo.preguntasUsadas / cupo.totalPreguntas) * 100}%`;
  } else {
    const completo = cupo && cupo.estado === 'completo';
    cajaCupo.innerHTML = `
      <div class="tarjeta">
        <h3 class="tarjeta__titulo">${completo ? 'Cupo completo' : 'Cupo cerrado'}</h3>
        <p class="tarjeta__texto">${completo
          ? 'Respondiste todo lo que ofreciste. Abre uno nuevo cuando tengas disponibilidad.'
          : 'Los fans no pueden enviarte preguntas ahora.'}</p>
        <div class="tarjeta__acciones"><a class="boton boton--secundario boton--bloque" href="cupos-artista.html">Ir a mi cupo</a></div>
      </div>`;
  }

  // Preguntas nuevas (las 2 primeras)
  const cajaPreguntas = document.querySelector('[data-preguntas-nuevas]');
  if (nuevas.length) {
    const fans = obtenerDatos('fans');
    cajaPreguntas.innerHTML = nuevas.slice(0, 2).map(p => {
      const autor = fans.find(f => f.id === p.autor);
      return `
        <article class="tarjeta">
          <div class="tarjeta__encabezado">
            <span class="tarjeta__meta">${escapar(autor.nombrePerfil)}${p.autorEsFanClub ? ' · Fan Club' : ''}</span>
            <span class="votos" aria-label="${p.votos} votos"><svg class="icono icono--pequeno" aria-hidden="true"><use href="#icono-votos"></use></svg>${p.votos}</span>
          </div>
          <p class="tarjeta__texto tarjeta__texto--principal">${escapar(p.texto)}</p>
          <p class="tarjeta__texto">Selecciona una pregunta para decidir si la respondes.</p>
          <div class="tarjeta__acciones"><a class="boton boton--bloque" href="revisar-pregunta-artista.html?id=${encodeURIComponent(p.id)}">Revisar pregunta</a></div>
        </article>`;
    }).join('');
  } else {
    document.querySelector('[data-ver-todas-preguntas]').remove(); // nada que ver todavía
    cajaPreguntas.innerHTML = `
      <div class="tarjeta"><p class="tarjeta__texto">No hay preguntas nuevas. Cuando tus fans participen, aparecerán aquí.</p></div>`;
  }
}

// ---------- Fan de la sesión y su nivel ----------
// El fan de la sesión: uno de data.js o el recién registrado. null si no hay.
function fanActual() {
  const sesion = leerSesion();
  if (!sesion || sesion.rol !== 'fan') return null;
  const deEjemplo = obtenerDatos('fans').find(f => f.id === sesion.id);
  if (deEjemplo) return deEjemplo;
  const propia = perfilGuardado();
  return propia && propia.id === sesion.id ? propia : null;
}

// Dónde está el fan dentro de su nivel: minutos al empezar el nivel
// actual y al llegar al siguiente (tabla de spec.md).
function progresoNivel(minutos) {
  const nivel = nivelPorMinutos(minutos);
  let inicio = 0;
  for (let n = 0; n < nivel; n++) inicio += Math.round(15 * Math.pow(1.5, n));
  const fin = inicio + Math.round(15 * Math.pow(1.5, nivel));
  return { nivel, inicio, fin, faltan: fin - minutos, porcentaje: ((minutos - inicio) / (fin - inicio)) * 100 };
}

// ---------- Reproducir un lanzamiento ----------
// Por ahora solo suena y se pausa. El minirreproductor, la cola y sumar
// minutos al nivel llegan con el reproductor (tramo 4).
const reproduccion = { audio: null, id: null };

// Los botones con data-reproducir="id" muestran ▶ o ⏸ según lo que suena.
function actualizarBotonesReproducir() {
  document.querySelectorAll('[data-reproducir]').forEach(boton => {
    const sonando = reproduccion.id === boton.dataset.reproducir && reproduccion.audio && !reproduccion.audio.paused;
    boton.querySelector('use').setAttribute('href', sonando ? '#icono-pausa' : '#icono-reproducir');
    boton.setAttribute('aria-label', `${sonando ? 'Pausar' : 'Reproducir'} ${boton.dataset.titulo}`);
  });
}

function alternarReproduccion(lanzamiento) {
  if (reproduccion.id === lanzamiento.id && reproduccion.audio) {
    if (reproduccion.audio.paused) reproduccion.audio.play();
    else reproduccion.audio.pause();
  } else {
    if (reproduccion.audio) reproduccion.audio.pause();
    reproduccion.audio = new Audio(rutaRecurso(lanzamiento.audio));
    reproduccion.id = lanzamiento.id;
    ['play', 'pause', 'ended'].forEach(evento => reproduccion.audio.addEventListener(evento, actualizarBotonesReproducir));
    reproduccion.audio.play();
  }
  actualizarBotonesReproducir();
}

// Activa todos los botones data-reproducir que hay dentro de un contenedor.
function activarBotonesReproducir(contenedor) {
  const lanzamientos = obtenerDatos('lanzamientos');
  contenedor.querySelectorAll('[data-reproducir]').forEach(boton => {
    boton.addEventListener('click', () => {
      const lanzamiento = lanzamientos.find(l => l.id === boton.dataset.reproducir);
      if (lanzamiento) alternarReproduccion(lanzamiento);
    });
  });
  actualizarBotonesReproducir();
}

// HTML de un botón de reproducir (▶) para un lanzamiento.
function botonReproducir(lanzamiento, clases) {
  return `<button type="button" class="boton-icono ${clases}" data-reproducir="${escapar(lanzamiento.id)}"
    data-titulo="${escapar(lanzamiento.nombreCancion)}" aria-label="Reproducir ${escapar(lanzamiento.nombreCancion)}">
    <svg class="icono" aria-hidden="true"><use href="#icono-reproducir"></use></svg></button>`;
}

// Portada de un lanzamiento (o un cuadro vacío si no tiene).
function htmlPortada(lanzamiento, clases = '') {
  return lanzamiento.portada
    ? `<img class="portada ${clases}" src="${escapar(rutaRecurso(lanzamiento.portada))}" alt="Portada de ${escapar(lanzamiento.nombreLanzamiento)}">`
    : `<div class="portada ${clases}" role="img" aria-label="${escapar(lanzamiento.nombreLanzamiento)}, sin portada"></div>`;
}

// Tarjeta de un artista que lleva a su perfil (inicio y explorar).
function htmlTarjetaArtista(artista) {
  const cupo = obtenerDatos('cupos').find(c => c.artista === artista.id);
  const estado = cupo && cupo.estado === 'abierto'
    ? `Preguntas abiertas · ${textoNivelMinimo(cupo.nivelMinimo)}`
    : 'Cupo cerrado';
  const avatar = artista.foto
    ? `<span class="avatar"><img src="${escapar(rutaRecurso(artista.foto))}" alt=""></span>`
    : `<span class="avatar avatar--acento">${escapar(iniciales(artista.nombreArtistico))}</span>`;
  return `
    <a class="tarjeta tarjeta--tocable tarjeta--fila" href="perfil-artista-fan.html?id=${encodeURIComponent(artista.id)}">
      ${avatar}
      <div class="tarjeta__info">
        <h3 class="tarjeta__titulo">${escapar(artista.nombreArtistico)}</h3>
        <p class="tarjeta__meta">${escapar(estado)}</p>
      </div>
      <svg class="icono texto--suave" aria-hidden="true"><use href="#icono-siguiente"></use></svg>
    </a>`;
}

// Fila de una canción con su botón ▶ (inicio y explorar).
function htmlFilaCancion(lanzamiento) {
  const artista = obtenerDatos('artistas').find(a => a.id === lanzamiento.artista);
  return `
    <div class="fila-lista">
      ${htmlPortada(lanzamiento, 'portada--pequena')}
      <span class="fila-lista__info">
        <b class="fila-lista__titulo">${escapar(lanzamiento.nombreCancion)}</b>
        <span class="fila-lista__detalle">${escapar(artista ? artista.nombreArtistico : '')} · ${escapar(lanzamiento.nombreLanzamiento)}</span>
      </span>
      ${botonReproducir(lanzamiento, 'boton-icono--relleno boton-icono--pequeno')}
    </div>`;
}

// ---------- F01a · Inicio del fan ----------
// Filtros de «Explora a tu manera» (spec.md): filtran la lista «Artistas».
const FILTROS_ARTISTAS = [
  { id: 'todos', nombre: 'Todos los artistas' },
  { id: 'cupo-abierto', nombre: 'Con cupo abierto' },
  { id: 'nuevo-lanzamiento', nombre: 'Con nuevo lanzamiento' },
  { id: 'emergentes', nombre: 'Emergentes' }
];

function textoEstadoPregunta(pregunta, artista) {
  const nombre = artista ? artista.nombreArtistico.split(' ')[0] : 'El artista';
  return {
    nueva: 'En cola. El artista decide qué responder.',
    pendiente: 'En cola. El artista decide qué responder.',
    seleccionada: `${nombre} seleccionó esta pregunta. Espera su respuesta.`,
    respondida: 'La respuesta está disponible.',
    descartada: 'No fue seleccionada en este cupo.'
  }[pregunta.estado] || '';
}

function pantallaInicioFan() {
  // Sin sesión de fan, a iniciar sesión.
  const fan = fanActual();
  if (!fan) {
    location.replace('iniciar-sesion.html');
    return;
  }
  const artistas = obtenerDatos('artistas');
  const cupos = obtenerDatos('cupos');
  const lanzamientos = obtenerDatos('lanzamientos')
    .slice()
    .sort((a, b) => new Date(b.fechaPublicacion) - new Date(a.fechaPublicacion));
  const artistaDe = id => artistas.find(a => a.id === id);
  const cupoDe = id => cupos.find(c => c.artista === id);

  // Barra de marca
  activarCambioDeTema(document.querySelector('[data-cambiar-tema]'));
  pintarAvatar(document.querySelector('[data-avatar-sesion]'), rutaRecurso(fan.foto), fan.nombrePerfil);

  // Lanzamiento destacado: el más nuevo en su ventana de 48 h; si no hay, el último.
  const enVentana = lanzamientos.filter(l => horasRestantesVentana(l) > 0);
  const destacado = enVentana[0] || lanzamientos[0];
  if (destacado) {
    const artista = artistaDe(destacado.artista);
    const horas = horasRestantesVentana(destacado);
    document.querySelector('[data-titulo-destacado]').textContent = horas > 0 ? 'En sus primeras 48 h' : 'Último lanzamiento';
    document.querySelector('[data-destacado]').innerHTML = `
      <article class="tarjeta tarjeta--acento tarjeta--destacada">
        <div class="tarjeta__info">
          <div>
            <h3 class="tarjeta__titulo">${escapar(destacado.nombreLanzamiento)}</h3>
            <p class="tarjeta__texto">${escapar(artista ? artista.nombreArtistico : '')}</p>
            <p class="tarjeta__meta">${horas > 0 ? `Nuevo lanzamiento · Quedan ${horas} h de ventana` : 'Lanzamiento'}</p>
          </div>
          ${botonReproducir(destacado, '')}
        </div>
        ${htmlPortada(destacado)}
      </article>`;
  } else {
    document.querySelector('[data-seccion-destacado]').remove();
  }

  // Una conexión real: un artista con cupo abierto (con foto y menos seguidores primero).
  const conCupo = artistas
    .filter(a => (cupoDe(a.id) || {}).estado === 'abierto')
    .sort((a, b) => (Boolean(b.foto) - Boolean(a.foto)) || (a.seguidores - b.seguidores));
  const persona = conCupo[0];
  if (persona) {
    const cupo = cupoDe(persona.id);
    const quedan = Math.max(0, cupo.totalPreguntas - cupo.preguntasUsadas);
    const foto = persona.foto
      ? `<img class="portada" src="${escapar(rutaRecurso(persona.foto))}" alt="">`
      : `<span class="avatar avatar--grande avatar--acento">${escapar(iniciales(persona.nombreArtistico))}</span>`;
    document.querySelector('[data-conexion]').innerHTML = `
      <a class="tarjeta tarjeta--tocable tarjeta--persona" href="perfil-artista-fan.html?id=${encodeURIComponent(persona.id)}">
        <div>
          <h3 class="tarjeta__titulo">${escapar(persona.nombreArtistico)}</h3>
          <p class="tarjeta__texto">Preguntas abiertas</p>
          <div class="etiquetas inicio__etiquetas"><span class="etiqueta etiqueta--borde">Quedan ${quedan} respuestas</span></div>
        </div>
        ${foto}
      </a>`;
  } else {
    document.querySelector('[data-seccion-conexion]').remove();
  }

  // Tus preguntas (las 2 más recientes)
  const mias = obtenerDatos('preguntas')
    .filter(p => p.autor === fan.id)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 2);
  const cajaPreguntas = document.querySelector('[data-tus-preguntas]');
  if (mias.length) {
    cajaPreguntas.innerHTML = mias.map(p => {
      const artista = artistaDe(p.artista);
      const respondida = p.estado === 'respondida';
      const etiqueta = respondida
        ? '<span class="etiqueta etiqueta--reconocimiento">Respondida</span>'
        : p.estado === 'seleccionada' ? '<span class="etiqueta etiqueta--borde">Seleccionada</span>' : '';
      return `
        <article class="tarjeta">
          <div class="tarjeta__encabezado">
            <span class="tarjeta__meta">Para ${escapar(artista ? artista.nombreArtistico : '')}</span>${etiqueta}
          </div>
          <p class="tarjeta__texto tarjeta__texto--principal">${escapar(p.texto)}</p>
          <p class="tarjeta__texto">${escapar(textoEstadoPregunta(p, artista))}</p>
          <div class="tarjeta__acciones">
            <a class="boton ${respondida ? 'boton--secundario' : 'boton--terciario'} boton--bloque" href="tu-conexion-fan.html?id=${encodeURIComponent(p.id)}">${respondida ? 'Ver respuesta' : 'Ver mi pregunta'}</a>
          </div>
        </article>`;
    }).join('');
  } else {
    document.querySelector('[data-ver-todas-preguntas]').remove(); // nada que ver todavía
    cajaPreguntas.innerHTML = `
      <div class="tarjeta">
        <h3 class="tarjeta__titulo">Aún no has preguntado.</h3>
        <p class="tarjeta__texto">Cuando un artista abre su cupo, puedes enviarle una pregunta o votar las de otros fans.</p>
        <div class="tarjeta__acciones"><a class="boton boton--secundario boton--bloque" href="conexion-activa-fan.html">Ver conexión activa</a></div>
      </div>`;
  }

  // Explora a tu manera: los chips filtran la lista «Artistas» (Real).
  const cajaFiltros = document.querySelector('[data-filtros-artistas]');
  const cajaArtistas = document.querySelector('[data-lista-artistas]');
  const cumpleFiltro = {
    'todos': () => true,
    'cupo-abierto': a => (cupoDe(a.id) || {}).estado === 'abierto',
    'nuevo-lanzamiento': a => lanzamientos.some(l => l.artista === a.id && horasRestantesVentana(l) > 0),
    'emergentes': a => a.emergente
  };
  function pintarArtistas(filtro) {
    cajaFiltros.querySelectorAll('.chip').forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.filtro === filtro)));
    const lista = artistas.filter(cumpleFiltro[filtro]);
    if (!lista.length) {
      cajaArtistas.innerHTML = `
        <div class="tarjeta">
          <h3 class="tarjeta__titulo">Sin resultados</h3>
          <p class="tarjeta__texto">No hay artistas con este filtro por ahora. Prueba con otro.</p>
        </div>`;
      return;
    }
    cajaArtistas.innerHTML = lista.map(htmlTarjetaArtista).join('');
  }
  cajaFiltros.innerHTML = FILTROS_ARTISTAS.map(f =>
    `<button type="button" class="chip" data-filtro="${f.id}" aria-pressed="false">${escapar(f.nombre)}</button>`).join('');
  cajaFiltros.addEventListener('click', evento => {
    const chip = evento.target.closest('.chip');
    if (chip) pintarArtistas(chip.dataset.filtro);
  });
  pintarArtistas('todos');

  // Canciones: una fila por lanzamiento, cada una se puede reproducir.
  document.querySelector('[data-lista-canciones]').innerHTML = lanzamientos.map(htmlFilaCancion).join('');

  // Tu recorrido: nivel y progreso al siguiente (tabla de spec.md).
  const minutos = fan.minutosEscucha || 0;
  const progreso = progresoNivel(minutos);
  document.querySelector('[data-recorrido]').innerHTML = `
    <div class="tarjeta">
      <div class="tarjeta__encabezado">
        <h3 class="tarjeta__titulo">Nivel ${progreso.nivel}</h3>
        <span class="etiqueta">${minutos} min escuchados</span>
      </div>
      <div class="progreso" role="progressbar" aria-label="Progreso al nivel ${progreso.nivel + 1}" aria-valuemin="0"
        aria-valuemax="100" aria-valuenow="${Math.round(progreso.porcentaje)}"><span class="progreso__barra"></span></div>
      <p class="tarjeta__texto">Te faltan ${progreso.faltan} min de escucha para el nivel ${progreso.nivel + 1}.</p>
      <div class="tarjeta__acciones"><a class="boton boton--terciario boton--bloque" href="recorrido-fan.html">Ver mi recorrido</a></div>
    </div>`;
  document.querySelector('[data-recorrido] .progreso__barra').style.width = `${progreso.porcentaje}%`;

  // Todos los botones ▶ de la página (destacado y canciones)
  activarBotonesReproducir(document.querySelector('main'));
}

// ---------- F01b · Explorar ----------
// Para buscar sin importar tildes ni mayúsculas: «Río» → «rio».
function normalizar(texto) {
  return String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function pantallaExplorarFan() {
  // Sin sesión de fan, a iniciar sesión.
  const fan = fanActual();
  if (!fan) {
    location.replace('iniciar-sesion.html');
    return;
  }
  activarCambioDeTema(document.querySelector('[data-cambiar-tema]'));
  pintarAvatar(document.querySelector('[data-avatar-sesion]'), rutaRecurso(fan.foto), fan.nombrePerfil);

  const artistas = obtenerDatos('artistas');
  const generos = obtenerDatos('generos');
  const lanzamientos = obtenerDatos('lanzamientos');
  const cupos = obtenerDatos('cupos');
  const nombreGenero = id => (generos.find(g => g.id === id) || {}).nombre || '';

  // Filtros del menú (spec.md): Pop · Indie · Rock · preguntas abiertas.
  const filtros = [
    ...['pop', 'indie', 'rock'].map(id => ({ id, nombre: nombreGenero(id), cumple: a => a.generos.includes(id) })),
    { id: 'preguntas-abiertas', nombre: 'Preguntas abiertas', cumple: a => (cupos.find(c => c.artista === a.id) || {}).estado === 'abierto' }
  ];

  const busqueda = document.querySelector('[data-busqueda]');
  const borrar = document.querySelector('[data-borrar-busqueda]');
  const botonFiltros = document.querySelector('[data-abrir-filtros]');
  const menu = document.querySelector('[data-menu-filtros]');
  const filtroActivo = document.querySelector('[data-filtro-activo]');
  const resultados = document.querySelector('[data-resultados]');
  let filtro = null; // id del filtro elegido, o null

  // Resultados: artistas que coinciden con la búsqueda y el filtro; canciones si se busca.
  function pintarResultados() {
    const texto = busqueda.value.trim();
    const buscado = normalizar(texto.replace(/^@/, ''));
    const elegido = filtros.find(f => f.id === filtro);
    const coincide = a => !buscado ||
      normalizar(a.nombreArtistico).includes(buscado) ||
      normalizar(a.nombreUsuario).includes(buscado) ||
      normalizar(a.ciudad).includes(buscado) ||
      a.generos.some(id => normalizar(nombreGenero(id)).includes(buscado));
    const encontrados = artistas.filter(a => coincide(a) && (!elegido || elegido.cumple(a)));
    const canciones = buscado
      ? lanzamientos.filter(l => normalizar(l.nombreCancion).includes(buscado) || normalizar(l.nombreLanzamiento).includes(buscado))
      : [];

    borrar.hidden = !texto;
    filtroActivo.hidden = !elegido;
    if (elegido) document.querySelector('[data-nombre-filtro]').textContent = elegido.nombre;

    // Si no hay artistas pero sí canciones, solo se muestran las canciones.
    let html = '';
    if (encontrados.length) {
      html += `
        <section class="explorar__seccion" aria-labelledby="titulo-resultados">
          <div class="encabezado-seccion">
            <h2 class="encabezado-seccion__titulo" id="titulo-resultados">${buscado ? 'Artistas' : 'Artistas para descubrir'}</h2>
          </div>
          <div class="rejilla-tarjetas">${encontrados.map(htmlTarjetaArtista).join('')}</div>
        </section>`;
    } else if (!canciones.length) {
      html += `
        <section class="explorar__seccion" aria-labelledby="titulo-resultados">
          <h2 class="encabezado-seccion__titulo" id="titulo-resultados" hidden>Resultados</h2>
        <div class="tarjeta">
          <h3 class="tarjeta__titulo">Sin resultados</h3>
          <p class="tarjeta__texto">No encontramos artistas${texto ? ` para «${escapar(texto)}»` : ''}${elegido ? ' con este filtro' : ''}.
            Revisa los filtros o prueba con otro nombre o género.</p>
          ${elegido ? '<div class="tarjeta__acciones"><button type="button" class="boton boton--secundario boton--bloque" data-quitar-filtro>Quitar filtro</button></div>' : ''}
        </div>
        </section>`;
    }
    if (canciones.length) {
      html += `
        <section class="explorar__seccion" aria-labelledby="titulo-canciones">
          <div class="encabezado-seccion">
            <h2 class="encabezado-seccion__titulo" id="titulo-canciones">Canciones</h2>
          </div>
          <div class="tarjeta">${canciones.map(htmlFilaCancion).join('')}</div>
        </section>`;
    }
    resultados.innerHTML = html;
    activarBotonesReproducir(resultados);
  }

  // Menú de filtros: se abre con el botón; se cierra al elegir, al tocar fuera o con Esc.
  function pintarMenu() {
    menu.innerHTML = filtros.map(f => `
      <button type="button" class="menu__opcion" role="menuitemradio" aria-checked="${f.id === filtro}" data-filtro="${f.id}">
        ${escapar(f.nombre)}<svg class="icono icono--pequeno" aria-hidden="true"><use href="#icono-check"></use></svg>
      </button>`).join('');
  }
  function abrirMenu() {
    pintarMenu();
    menu.hidden = false;
    botonFiltros.setAttribute('aria-expanded', 'true');
    (menu.querySelector('[aria-checked="true"]') || menu.querySelector('.menu__opcion')).focus();
  }
  function cerrarMenu(devolverFoco) {
    if (menu.hidden) return;
    menu.hidden = true;
    botonFiltros.setAttribute('aria-expanded', 'false');
    if (devolverFoco) botonFiltros.focus();
  }
  function quitarFiltro() {
    filtro = null;
    pintarResultados();
  }

  botonFiltros.addEventListener('click', () => (menu.hidden ? abrirMenu() : cerrarMenu(true)));
  menu.addEventListener('click', evento => {
    const opcion = evento.target.closest('.menu__opcion');
    if (!opcion) return;
    // Tocar el filtro que ya estaba elegido lo quita.
    filtro = opcion.dataset.filtro === filtro ? null : opcion.dataset.filtro;
    cerrarMenu(true);
    pintarResultados();
  });
  // Flechas arriba y abajo para moverse entre opciones; Esc para cerrar.
  menu.addEventListener('keydown', evento => {
    const opciones = [...menu.querySelectorAll('.menu__opcion')];
    const actual = opciones.indexOf(document.activeElement);
    if (evento.key === 'ArrowDown') { evento.preventDefault(); opciones[(actual + 1) % opciones.length].focus(); }
    if (evento.key === 'ArrowUp') { evento.preventDefault(); opciones[(actual - 1 + opciones.length) % opciones.length].focus(); }
  });
  document.addEventListener('keydown', evento => { if (evento.key === 'Escape') cerrarMenu(true); });
  document.addEventListener('click', evento => {
    if (!evento.target.closest('.desplegable')) cerrarMenu(false);
  });

  // Buscar mientras se escribe
  busqueda.addEventListener('input', pintarResultados);
  busqueda.addEventListener('keydown', evento => { if (evento.key === 'Enter') busqueda.blur(); });
  borrar.addEventListener('click', () => {
    busqueda.value = '';
    busqueda.focus();
    pintarResultados();
  });
  // «Quitar filtro» (arriba o en el mensaje de sin resultados)
  document.querySelector('main').addEventListener('click', evento => {
    if (evento.target.closest('[data-quitar-filtro]')) quitarFiltro();
  });

  pintarResultados();
}

// ---------- Arranque ----------
// El tema guardado se aplica en todas las páginas apenas carga este archivo.
aplicarTema();
const PANTALLAS = {
  'index': pantallaIndex,
  'iniciar-sesion': pantallaIniciarSesion,
  'elegir-experiencia': pantallaElegirExperiencia,
  'crear-cuenta': pantallaCrearCuenta,
  'identidad-artista': pantallaIdentidadArtista,
  'perfil-basico-fan': pantallaPerfilBasicoFan,
  'presentacion-artista': pantallaPresentacionArtista,
  'estilo-musical-artista': pantallaEstiloMusicalArtista,
  'gustos-fan': pantallaGustosFan,
  'proyecto-musical-artista': pantallaProyectoMusicalArtista,
  'intereses-fan': pantallaInteresesFan,
  'perfil-listo-artista': pantallaPerfilListoArtista,
  'perfil-listo-fan': pantallaPerfilListoFan,
  'panel-artista': pantallaPanelArtista,
  'inicio-fan': pantallaInicioFan,
  'explorar-fan': pantallaExplorarFan
};

document.addEventListener('DOMContentLoaded', () => {
  const pantalla = PANTALLAS[document.body.dataset.pantalla];
  if (pantalla) pantalla();
});
