/* ==========================================================
   Looped · Comportamiento de la app
   Una función por pantalla. Cada página dice cuál es en
   <body data-pantalla="...">, y aquí se ejecuta solo la suya.
   ========================================================== */

// ---------- Datos ----------
// REAL: al abrir cada pantalla, cargarDatos() trae de Supabase lo que la
// app muestra y lo deja aquí, con los mismos nombres de campos de
// js/data.js (que queda solo como referencia de los datos iniciales).
let datosCargados = {};

// Única puerta a los datos: todas las pantallas leen por aquí.
function obtenerDatos(tipo) {
  return datosCargados[tipo] || [];
}

// Trae de Supabase todas las tablas que muestran las pantallas.
// Lanza un error si no hay conexión.
async function cargarDatos() {
  const tablas = ['generos', 'roles', 'intereses', 'artistas', 'fans', 'seguimientos', 'visitas',
    'miembros_fan_club', 'lanzamientos', 'cupos', 'preguntas', 'votos', 'respuestas', 'publicaciones'];
  const respuestas = await Promise.all(tablas.map(tabla => baseDatos.from(tabla).select('*')));
  const filas = {};
  respuestas.forEach((respuesta, i) => {
    if (respuesta.error) throw respuesta.error;
    filas[tablas[i]] = respuesta.data;
  });

  datosCargados = {
    generos: filas.generos,
    roles: filas.roles,
    intereses: filas.intereses,
    artistas: filas.artistas.map(fila => perfilDesdeFila('artista', fila)),
    fans: filas.fans.map(fila => Object.assign(perfilDesdeFila('fan', fila), {
      artistasQueSigue: filas.seguimientos.filter(s => s.fan === fila.id).map(s => s.artista),
      artistasVisitados: filas.visitas.filter(v => v.fan === fila.id).map(v => v.artista),
      fanFundadorDe: filas.visitas.filter(v => v.fan === fila.id && v.es_fan_fundador).map(v => v.artista),
      fanClubs: filas.miembros_fan_club.filter(m => m.fan === fila.id).map(m => m.artista)
    })),
    lanzamientos: filas.lanzamientos.map(fila => ({
      id: fila.id,
      artista: fila.artista,
      nombreLanzamiento: fila.nombre_lanzamiento,
      nombreCancion: fila.nombre_cancion,
      portada: fila.portada,
      audio: fila.audio,
      fechaPublicacion: fila.fecha_publicacion
    })),
    cupos: filas.cupos.map(fila => ({
      id: fila.id,
      artista: fila.artista,
      estado: fila.estado,
      totalPreguntas: fila.total_preguntas,
      preguntasUsadas: fila.preguntas_usadas,
      nivelMinimo: fila.nivel_minimo,
      fechaApertura: fila.fecha_apertura
    })),
    preguntas: filas.preguntas.map(fila => ({
      id: fila.id,
      artista: fila.artista,
      autor: fila.autor,
      autorEsFanClub: fila.autor_es_fan_club,
      primerContacto: fila.primer_contacto,
      texto: fila.texto,
      votos: fila.votos,
      estado: fila.estado,
      fecha: fila.fecha
    })),
    votos: filas.votos, // { fan, pregunta }
    // Las de «Solo para el Fan Club» solo llegan a sus miembros y al artista (regla de la base de datos).
    publicaciones: filas.publicaciones.map(fila => ({
      id: fila.id,
      artista: fila.artista,
      texto: fila.texto,
      lanzamiento: fila.lanzamiento,
      soloFanClub: fila.solo_fan_club,
      fecha: fila.fecha
    })),
    respuestas: filas.respuestas.map(fila => ({
      id: fila.id,
      pregunta: fila.pregunta,
      tipo: fila.tipo,
      texto: fila.texto,
      audio: fila.audio,
      duracionAudio: fila.duracion_audio,
      fecha: fila.fecha
    }))
  };
}

// ---------- Archivos en Supabase Storage ----------
// Sube un archivo a una carpeta («audios», «portadas»…) dentro de la
// carpeta de la cuenta, y devuelve su enlace público.
async function subirArchivo(carpeta, usuarioId, nombre, archivo, tipo) {
  const ruta = `${usuarioId}/${nombre}`;
  const { error } = await baseDatos.storage.from(carpeta).upload(ruta, archivo, { contentType: tipo });
  if (error) throw error;
  return baseDatos.storage.from(carpeta).getPublicUrl(ruta).data.publicUrl;
}

// Si un enlace es de un archivo nuestro en Supabase, lo borra.
// Los de assets/ (datos de ejemplo) no se tocan.
async function borrarArchivoSubido(enlace) {
  const coincide = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/.exec(enlace || '');
  if (!coincide) return;
  await baseDatos.storage.from(coincide[1]).remove([decodeURIComponent(coincide[2])]);
}

// REAL: borra el lanzamiento de Supabase, con su audio y su portada.
async function eliminarLanzamiento(lanzamiento) {
  const { error } = await baseDatos.from('lanzamientos').delete().eq('id', lanzamiento.id);
  if (error) throw error;
  // Si borrar un archivo falla, el lanzamiento igual quedó eliminado.
  try { await borrarArchivoSubido(lanzamiento.audio); } catch (e) { /* queda el archivo suelto */ }
  try { await borrarArchivoSubido(lanzamiento.portada); } catch (e) { /* queda el archivo suelto */ }
}


// ---------- Sesión ----------
// REAL: entra con Supabase Auth y busca el perfil de la cuenta.
// Devuelve { rol, perfil } (perfil es null si no terminó el registro)
// o lanza un error: 'datos-incorrectos' o 'sin-conexion'.
async function iniciarSesion(correo, contrasena) {
  let respuesta;
  try {
    respuesta = await baseDatos.auth.signInWithPassword({ email: correo, password: contrasena });
  } catch (e) {
    throw new Error('sin-conexion');
  }
  if (respuesta.error) {
    throw new Error(respuesta.error.code === 'invalid_credentials' ? 'datos-incorrectos' : 'sin-conexion');
  }
  const usuario = respuesta.data.user;

  // El rol se guardó con la cuenta al crearla. Si faltara, se busca en las dos tablas.
  const rolGuardado = (usuario.user_metadata || {}).rol;
  const tablas = rolGuardado === 'artista' ? ['artistas']
    : rolGuardado === 'fan' ? ['fans'] : ['fans', 'artistas'];
  for (const tabla of tablas) {
    const { data, error } = await baseDatos.from(tabla).select('*').eq('usuario_id', usuario.id).maybeSingle();
    if (error) throw new Error('sin-conexion');
    if (data) {
      const rol = tabla === 'artistas' ? 'artista' : 'fan';
      return { rol, perfil: perfilDesdeFila(rol, data, usuario.email), usuarioId: usuario.id };
    }
  }
  return { rol: rolGuardado || 'fan', perfil: null, usuarioId: usuario.id };
}

// Convierte una fila de Supabase al perfil que usan las pantallas
// (los mismos nombres de campos de js/data.js).
function perfilDesdeFila(rol, fila, correo) {
  const comun = { id: fila.id, nombreUsuario: fila.nombre_usuario, correo, foto: fila.foto };
  if (rol === 'artista') {
    return Object.assign(comun, {
      nombreArtistico: fila.nombre_artistico,
      presentacion: fila.presentacion || '',
      ciudad: fila.ciudad || '',
      generos: fila.generos || [],
      roles: fila.roles || [],
      seguidores: fila.seguidores,
      emergente: fila.emergente
    });
  }
  return Object.assign(comun, {
    nombrePerfil: fila.nombre_perfil,
    gustosMusicales: fila.gustos_musicales || [],
    intereses: fila.intereses || [],
    minutosEscucha: fila.minutos_escucha,
    artistasQueSigue: [],
    fanClubs: [],
    fanFundadorDe: [],
    fechaRegistro: fila.fecha_registro
  });
}

// PROVISIONAL: copia del perfil en este navegador, para las pantallas
// que aún no leen de Supabase. null si no hay ninguna.
function perfilGuardado() {
  try { return JSON.parse(localStorage.getItem('looped-perfil')); } catch (e) { return null; }
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
  if (!control) return; // p. ej. la tarjeta de audio: no tiene campo de texto
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

// ---------- Registro en curso ----------
// Lo que la persona va llenando en los pasos del registro (rol, correo…),
// guardado solo en esta pestaña. Nunca se guarda la contraseña.
// La cuenta ya existe en Supabase (se creó en «Crear cuenta»).
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

  const botonEntrar = document.querySelector('button[form="formulario-sesion"]');
  const textoBoton = botonEntrar.textContent;

  formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (botonEntrar.disabled) return; // ya se está entrando
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

    botonEntrar.disabled = true;
    botonEntrar.textContent = 'Entrando…';
    let sesion;
    try {
      sesion = await iniciarSesion(textoCorreo, contrasena.value);
    } catch (e) {
      botonEntrar.disabled = false;
      botonEntrar.textContent = textoBoton;
      if (e.message === 'datos-incorrectos') {
        mostrarError('contrasena', 'El correo o la contraseña no son correctos.');
        contrasena.focus();
      } else {
        mostrarError('correo', 'No pudimos entrar. Revisa tu conexión e inténtalo otra vez.');
        correo.focus();
      }
      return;
    }

    // Registro sin terminar: vuelve al primer paso del perfil de su rol.
    if (!sesion.perfil) {
      guardarRegistro({ rol: sesion.rol, correo: textoCorreo });
      location.href = sesion.rol === 'artista' ? 'identidad-artista.html' : 'perfil-basico-fan.html';
      return;
    }

    // PROVISIONAL: copia en este navegador para las pantallas que aún no leen de Supabase.
    try { localStorage.setItem('looped-perfil', JSON.stringify(sesion.perfil)); } catch (e) { /* sin almacenamiento */ }
    guardarSesion({ rol: sesion.rol, id: sesion.perfil.id });
    await traerAjustesDeLaCuenta(sesion.usuarioId, sesion.rol === 'fan' ? sesion.perfil.id : null);
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

  const botonContinuar = document.querySelector('button[form="formulario-cuenta"]');

  formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (botonContinuar.disabled) return; // ya se está creando la cuenta
    const textoCorreo = correo.value.trim();

    if (!correoValido(textoCorreo)) mostrarError('correo', 'Escribe un correo válido.');
    if (contrasena.value.length < 6) mostrarError('contrasena', 'La contraseña necesita al menos 6 caracteres.');

    const conError = formulario.querySelector('[aria-invalid="true"]');
    if (conError) {
      conError.focus();
      return;
    }

    // REAL: crea la cuenta en Supabase Auth. El rol (fan o artista) se
    // guarda con la cuenta, así al iniciar sesión la app sabe qué lado abrir.
    // Supabase revisa que el correo no tenga ya otra cuenta.
    botonContinuar.disabled = true;
    botonContinuar.textContent = 'Creando tu cuenta…';
    let respuesta;
    try {
      respuesta = await baseDatos.auth.signUp({
        email: textoCorreo,
        password: contrasena.value,
        options: { data: { rol } }
      });
    } catch (e) {
      respuesta = { error: { code: 'sin_conexion' } };
    }
    botonContinuar.disabled = false;
    botonContinuar.textContent = 'Continuar';

    const error = respuesta.error;
    if (error) {
      if (error.code === 'user_already_exists' || error.code === 'email_exists') {
        mostrarError('correo', 'Este correo ya tiene una cuenta. Inicia sesión.');
        correo.focus();
      } else if (error.code === 'weak_password') {
        mostrarError('contrasena', 'Esta contraseña es muy fácil de adivinar. Prueba con otra.');
        contrasena.focus();
      } else if (error.code === 'email_address_invalid') {
        mostrarError('correo', 'Escribe un correo válido.');
        correo.focus();
      } else {
        mostrarError('correo', 'No pudimos crear la cuenta. Revisa tu conexión e inténtalo otra vez.');
        correo.focus();
      }
      return;
    }

    // La contraseña nunca se guarda en la app: solo el correo, para los pasos siguientes.
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
// Lo escrito se recuerda en esta pestaña; el perfil se guarda en Supabase al final (guardarPerfil).
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

  const botonContinuar = document.querySelector('button[form="formulario-identidad"]');

  formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (botonContinuar && botonContinuar.disabled) return; // ya se está revisando
    const textoNombre = nombre.value.trim();
    const textoUsuario = limpiarUsuario(usuario.value);

    if (!textoNombre) mostrarError('nombre', errorNombre);
    if (!textoUsuario) mostrarError('usuario', 'Elige un nombre de usuario.');

    const conError = formulario.querySelector('[aria-invalid="true"]');
    if (conError) {
      conError.focus();
      return;
    }

    // REAL: revisa en Supabase que nadie más tenga este @usuario.
    if (botonContinuar) botonContinuar.disabled = true;
    const ocupado = await usuarioOcupado(textoUsuario);
    if (botonContinuar) botonContinuar.disabled = false;
    if (ocupado) {
      mostrarError('usuario', 'Este nombre de usuario ya está tomado. Prueba con otro.');
      usuario.focus();
      return;
    }

    guardarRegistro({ [campoNombre]: textoNombre, nombreUsuario: textoUsuario, foto });
    location.href = destino;
  });
}

// ¿Algún fan o artista ya usa este @usuario? Si no hay conexión responde
// que no: igual la base de datos lo vuelve a revisar al guardar el perfil.
async function usuarioOcupado(nombreUsuario) {
  try {
    const [fans, artistas] = await Promise.all([
      baseDatos.from('fans').select('id').eq('nombre_usuario', nombreUsuario).limit(1),
      baseDatos.from('artistas').select('id').eq('nombre_usuario', nombreUsuario).limit(1)
    ]);
    return Boolean((fans.data && fans.data.length) || (artistas.data && artistas.data.length));
  } catch (e) {
    return false;
  }
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
// Lo escrito se recuerda en esta pestaña; se guarda en Supabase al final (guardarPerfil).
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
// Lo marcado se recuerda en esta pestaña; se guarda en Supabase al final (guardarPerfil).
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

// Sube la foto de perfil (data URL) a la carpeta «fotos» de Supabase,
// dentro de la carpeta de la cuenta, y devuelve su enlace público.
async function subirFotoPerfil(usuarioId, fotoDataUrl) {
  const archivo = await (await fetch(fotoDataUrl)).blob();
  const ruta = `${usuarioId}/perfil-${Date.now()}.jpg`;
  const { error } = await baseDatos.storage.from('fotos').upload(ruta, archivo, { contentType: 'image/jpeg' });
  if (error) throw error;
  return baseDatos.storage.from('fotos').getPublicUrl(ruta).data.publicUrl;
}

// REAL: guarda el perfil en la tabla «fans» o «artistas», unido a la
// cuenta creada en «Crear cuenta». Devuelve el perfil guardado.
// Si algo falla, lanza un error con un mensaje para mostrar.
async function guardarPerfil(registro) {
  const { data: { user } } = await baseDatos.auth.getUser();
  if (!user) throw new Error('Tu sesión se cerró. Inicia sesión para terminar tu perfil.');

  let foto = null;
  if (registro.foto) {
    try { foto = await subirFotoPerfil(user.id, registro.foto); }
    catch (e) { throw new Error('No pudimos subir tu foto. Inténtalo otra vez.'); }
  }

  const esArtista = registro.rol === 'artista';
  const fila = esArtista ? {
    usuario_id: user.id,
    nombre_artistico: registro.nombreArtistico,
    nombre_usuario: registro.nombreUsuario,
    foto,
    presentacion: registro.presentacion || '',
    ciudad: registro.ciudad || null,
    generos: registro.generos || [],
    roles: registro.roles || []
  } : {
    usuario_id: user.id,
    nombre_perfil: registro.nombrePerfil,
    nombre_usuario: registro.nombreUsuario,
    foto,
    gustos_musicales: registro.gustosMusicales || [],
    intereses: registro.intereses || []
  };

  // upsert: si ya lo había guardado (p. ej. volvió atrás), lo actualiza.
  const { data, error } = await baseDatos
    .from(esArtista ? 'artistas' : 'fans')
    .upsert(fila, { onConflict: 'usuario_id' })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('Tu nombre de usuario ya está tomado. Vuelve atrás para cambiarlo.');
    throw new Error('No pudimos guardar tu perfil. Revisa tu conexión e inténtalo otra vez.');
  }

  // PROVISIONAL: copia en este navegador para las pantallas que aún no
  // leen de Supabase (inicio del fan, panel del artista…).
  const perfil = Object.assign(perfilDelRegistro(registro), { id: data.id, correo: user.email, foto });
  try { localStorage.setItem('looped-perfil', JSON.stringify(perfil)); } catch (e) { /* sin almacenamiento */ }
  guardarSesion({ rol: registro.rol, id: data.id });
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

  // Al entrar, el perfil se guarda en Supabase. replace: «atrás» no vuelve al registro.
  const botonEntrar = document.querySelector('[data-entrar]');
  const textoBoton = botonEntrar.textContent;
  botonEntrar.addEventListener('click', async () => {
    if (botonEntrar.disabled) return;
    botonEntrar.disabled = true;
    botonEntrar.textContent = 'Guardando…';
    try {
      await guardarPerfil(registro);
      location.replace(destino);
    } catch (e) {
      botonEntrar.disabled = false;
      botonEntrar.textContent = textoBoton;
      mostrarAviso(e.message || 'No pudimos guardar tu perfil. Inténtalo otra vez.');
    }
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
// Desde pages/ las rutas de los datos de ejemplo (assets/…, desde la raíz)
// necesitan «../». Los enlaces de Supabase (https:) y las imágenes
// guardadas como texto (data:) se usan tal cual.
const RAIZ = location.pathname.includes('/pages/') ? '../' : '';
function rutaRecurso(ruta) {
  if (!ruta || ruta.startsWith('local:')) return null; // «local:» era el guardado viejo en el navegador
  if (/^(data:|blob:|https?:)/.test(ruta)) return ruta;
  return RAIZ + ruta;
}

// Dirección para reproducir un audio.
async function urlDeAudio(ruta) {
  return rutaRecurso(ruta);
}

// Aviso flotante (toast) arriba de la pantalla, que se va solo.
function mostrarAviso(texto) {
  const caja = document.querySelector('[data-avisos]');
  if (!caja) return;
  const aviso = document.createElement('div');
  aviso.className = 'toast';
  aviso.setAttribute('role', 'status');
  aviso.innerHTML = `<p class="toast__texto">${escapar(texto)}</p>`;
  caja.append(aviso);
  setTimeout(() => aviso.remove(), 4000);
}

// Duración en minutos y segundos: 204 → «3:24».
function formatoDuracion(segundos) {
  const total = Math.round(segundos);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// Para poner textos de los datos dentro de HTML sin riesgo.
function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Quién inició sesión en este navegador: { rol, id } o null.
function leerSesion() {
  try { return JSON.parse(localStorage.getItem('looped-sesion')); } catch (e) { return null; }
}

// El artista de la sesión (de Supabase, o la copia del navegador). null si no hay.
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

// Decisión del equipo (09-11-2026): el nivel 1 sí es requisito (15 min de
// escucha); solo un cupo de nivel 0 deja participar a cualquiera.
function textoNivelMinimo(nivel) {
  return !nivel || nivel <= 0 ? 'Sin requisito de nivel' : `Nivel ${nivel} o superior`;
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
// REAL: se guarda en «preferencias» de la cuenta. Además se recuerda en
// este navegador para aplicarla apenas abre cada página, sin esperar a
// Supabase (así la pantalla no parpadea). Al iniciar sesión se trae de
// la cuenta con traerAjustesDeLaCuenta().
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
    guardarApariencia(preferencias.apariencia);
  });
  actualizar();
}

// El id de la cuenta que inició sesión (sin ir a internet), o null.
async function idDeLaCuenta() {
  if (typeof baseDatos === 'undefined') return null;
  const { data } = await baseDatos.auth.getSession();
  return data.session ? data.session.user.id : null;
}

// Guarda la apariencia en la cuenta. Si falla, queda en este navegador.
async function guardarApariencia(apariencia) {
  const usuarioId = await idDeLaCuenta();
  if (!usuarioId) return;
  await baseDatos.from('preferencias').upsert({
    usuario_id: usuarioId,
    apariencia: apariencia === 'claro' ? 'clara' : 'oscura'
  });
}

// Al iniciar sesión: trae la apariencia y (si es fan) su cola de la cuenta.
async function traerAjustesDeLaCuenta(usuarioId, fanId) {
  try {
    const { data: preferencias } = await baseDatos.from('preferencias')
      .select('apariencia').eq('usuario_id', usuarioId).maybeSingle();
    if (preferencias) {
      const locales = leerPreferencias();
      locales.apariencia = preferencias.apariencia === 'clara' ? 'claro' : 'oscuro';
      localStorage.setItem('looped-preferencias', JSON.stringify(locales));
    }
    // Otra cuenta no debe heredar la música de la anterior.
    localStorage.removeItem(CLAVE_REPRODUCTOR);
    if (!fanId) return;
    const { data: cola } = await baseDatos.from('colas').select('*').eq('fan', fanId).maybeSingle();
    if (cola && cola.canciones.length) {
      const actual = cola.canciones.includes(cola.cancion_actual) ? cola.cancion_actual : cola.canciones[0];
      localStorage.setItem(CLAVE_REPRODUCTOR, JSON.stringify({
        cola: cola.canciones,
        mezcla: [actual].concat(mezclar(cola.canciones.filter(id => id !== actual))),
        actual,
        tiempo: 0,
        sonando: false,
        aleatorio: cola.aleatorio,
        bucle: cola.bucle === 'toda' ? 'cola' : cola.bucle
      }));
    }
  } catch (e) {
    /* sin conexión o sin almacenamiento: se entra igual, con lo del navegador */
  }
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
// El fan de la sesión (de Supabase, o la copia del navegador). null si no hay.
function fanActual() {
  const sesion = leerSesion();
  if (!sesion || sesion.rol !== 'fan') return null;
  const propia = perfilGuardado();
  const fan = obtenerDatos('fans').find(f => f.id === sesion.id) || (propia && propia.id === sesion.id ? propia : null);
  if (!fan) return null;
  return { artistasQueSigue: [], fanClubs: [], fanFundadorDe: [], artistasVisitados: [], ...fan };
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

// ---------- Reproductor (minirreproductor y vista ampliada) ----------
// La app son páginas separadas y, al cambiar de página, el navegador corta
// el audio. Por eso el estado del reproductor (cola, canción, segundo, si
// sonaba, aleatorio y bucle) se guarda en este navegador y cada página lo
// retoma donde iba. La cola, además, se guarda en la cuenta del fan (guardarColaEnLaCuenta).
const CLAVE_REPRODUCTOR = 'looped-reproductor';
const MODOS_BUCLE = ['apagado', 'cola', 'una']; // cada toque pasa al siguiente
const TEXTO_BUCLE = { apagado: 'Bucle: apagado', cola: 'Bucle: toda la cola', una: 'Bucle: una canción' };

const reproductor = {
  audio: null,
  estado: null,          // { cola, mezcla, actual, tiempo, sonando, aleatorio, bucle }
  url: null,             // dirección del audio cargado
  ultimoTiempo: null,    // para contar los segundos escuchados
  segundosPendientes: 0, // escuchados y aún sin guardar en el nivel
  ultimoGuardado: 0,
  arrastrando: false,    // mientras se mueve la barra de avance
  abiertoDesde: null     // botón que abrió la vista ampliada (para devolver el foco)
};

function leerEstadoReproductor() {
  try { return JSON.parse(localStorage.getItem(CLAVE_REPRODUCTOR)); } catch (e) { return null; }
}
function guardarEstadoReproductor() {
  const estado = reproductor.estado;
  if (!estado) return;
  if (reproductor.audio && reproductor.url) {
    estado.tiempo = reproductor.audio.currentTime || 0;
    estado.sonando = !reproductor.audio.paused;
  }
  reproductor.ultimoGuardado = Date.now();
  try { localStorage.setItem(CLAVE_REPRODUCTOR, JSON.stringify(estado)); } catch (e) { /* sin espacio: no se guarda */ }
  guardarColaEnLaCuenta();
}

// REAL: la cola del fan (canciones, actual, aleatorio y bucle) se guarda
// en «colas». El segundo exacto y si sonaba quedan solo en este navegador,
// para seguir sonando al cambiar de página. Solo escribe si algo cambió.
let ultimaColaGuardada = '';
async function guardarColaEnLaCuenta() {
  const estado = reproductor.estado;
  const fan = fanActual();
  if (!estado || !fan || typeof baseDatos === 'undefined') return;
  const fila = {
    fan: fan.id,
    canciones: estado.cola,
    cancion_actual: estado.actual,
    aleatorio: Boolean(estado.aleatorio),
    bucle: estado.bucle === 'cola' ? 'toda' : estado.bucle
  };
  const texto = JSON.stringify(fila);
  if (texto === ultimaColaGuardada) return;
  ultimaColaGuardada = texto;
  const { error } = await baseDatos.from('colas').upsert(fila);
  if (error) ultimaColaGuardada = ''; // se intenta otra vez en el próximo cambio
}

function lanzamientoSonando() {
  const estado = reproductor.estado;
  return estado ? obtenerDatos('lanzamientos').find(l => l.id === estado.actual) || null : null;
}
// El orden en que suenan: el de la cola o, con aleatorio, el mezclado.
function ordenDeLaCola() {
  const estado = reproductor.estado;
  return estado.aleatorio ? estado.mezcla : estado.cola;
}
function estaSonando(id) {
  return Boolean(reproductor.estado && reproductor.estado.actual === id && reproductor.audio && !reproductor.audio.paused);
}

// Al tocar ▶ en una canción, la cola es esa canción y después las demás,
// de la más nueva a la más vieja. Aleatorio y bucle se mantienen.
function armarCola(id) {
  const otras = obtenerDatos('lanzamientos')
    .filter(l => l.id !== id)
    .sort((a, b) => new Date(b.fechaPublicacion) - new Date(a.fechaPublicacion))
    .map(l => l.id);
  const anterior = reproductor.estado || {};
  reproductor.estado = {
    cola: [id].concat(otras),
    mezcla: [id].concat(mezclar(otras)),
    actual: id,
    tiempo: 0,
    sonando: true,
    aleatorio: Boolean(anterior.aleatorio),
    bucle: anterior.bucle || 'apagado'
  };
}

// El único elemento <audio> de la página, con sus eventos.
function audioDelReproductor() {
  if (reproductor.audio) return reproductor.audio;
  const audio = new Audio();
  audio.preload = 'metadata';
  audio.addEventListener('timeupdate', () => {
    contarEscucha();
    actualizarReproductor();
    if (Date.now() - reproductor.ultimoGuardado > 2000) guardarEstadoReproductor();
  });
  audio.addEventListener('loadedmetadata', actualizarReproductor);
  audio.addEventListener('play', () => { guardarEstadoReproductor(); actualizarReproductor(); });
  audio.addEventListener('pause', () => {
    reproductor.ultimoTiempo = null;
    guardarSegundosEscucha();
    guardarEstadoReproductor();
    actualizarReproductor();
  });
  audio.addEventListener('ended', () => siguienteCancion(true));
  reproductor.audio = audio;
  return audio;
}

// Carga una canción de la cola. tiempo: segundo donde empieza. sonar: si arranca sola.
async function cargarCancion(id, { tiempo = 0, sonar = true } = {}) {
  const lanzamiento = obtenerDatos('lanzamientos').find(l => l.id === id);
  if (!lanzamiento) return false;
  const url = await urlDeAudio(lanzamiento.audio);
  if (!url) {
    mostrarAviso('Este audio no está disponible en este navegador.');
    return false;
  }
  const audio = audioDelReproductor();
  if (reproductor.url && reproductor.url.startsWith('blob:')) URL.revokeObjectURL(reproductor.url);
  reproductor.url = url;
  reproductor.estado.actual = id;
  reproductor.ultimoTiempo = null;
  audio.src = url;
  audio.loop = reproductor.estado.bucle === 'una';
  if (tiempo > 0) {
    audio.addEventListener('loadedmetadata', () => { audio.currentTime = Math.min(tiempo, audio.duration || tiempo); }, { once: true });
  }
  pintarReproductor();
  if (sonar) {
    try { await audio.play(); } catch (e) { /* el navegador pide tocar ▶ primero (p. ej. Safari) */ }
  }
  guardarEstadoReproductor();
  actualizarReproductor();
  return true;
}

// ▶ / ⏸ de una canción. Si es otra canción, arma la cola desde ella.
async function alternarCancion(id, abrir = false) {
  if (reproductor.estado && reproductor.estado.actual === id && reproductor.url) {
    alternarPausa();
    return;
  }
  armarCola(id);
  const cargo = await cargarCancion(id);
  if (cargo && abrir) abrirReproductor();
}
function alternarPausa() {
  const audio = reproductor.audio;
  if (!audio || !reproductor.url) return;
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
}

// Siguiente: al terminar la última, vuelve a la primera solo con bucle de cola.
function siguienteCancion(alTerminar = false) {
  const estado = reproductor.estado;
  if (!estado) return;
  const orden = ordenDeLaCola();
  const i = orden.indexOf(estado.actual);
  if (i < orden.length - 1) cargarCancion(orden[i + 1]);
  else if (estado.bucle === 'cola' || !alTerminar) cargarCancion(orden[0]);
  else actualizarReproductor(); // fin de la cola: se queda en pausa
}
// Anterior: si ya avanzó más de 3 segundos, vuelve al inicio de la canción.
function cancionAnterior() {
  const estado = reproductor.estado;
  const audio = reproductor.audio;
  if (!estado || !audio) return;
  const orden = ordenDeLaCola();
  const i = orden.indexOf(estado.actual);
  if (audio.currentTime > 3 || (i === 0 && estado.bucle !== 'cola')) audio.currentTime = 0;
  else cargarCancion(orden[i > 0 ? i - 1 : orden.length - 1]);
}

function alternarAleatorio() {
  const estado = reproductor.estado;
  estado.aleatorio = !estado.aleatorio;
  // La que suena queda primera y las demás se mezclan.
  if (estado.aleatorio) estado.mezcla = [estado.actual].concat(mezclar(estado.cola.filter(id => id !== estado.actual)));
  guardarEstadoReproductor();
  actualizarReproductor();
}
function cambiarBucle() {
  const estado = reproductor.estado;
  estado.bucle = MODOS_BUCLE[(MODOS_BUCLE.indexOf(estado.bucle) + 1) % MODOS_BUCLE.length];
  if (reproductor.audio) reproductor.audio.loop = estado.bucle === 'una';
  guardarEstadoReproductor();
  actualizarReproductor();
}

// ----- Editar la cola (pantalla Cola y botones ＋) -----
// Los cambios se hacen igual en la cola normal y en la mezclada, así el
// orden se respeta tenga o no aleatorio.
function enAmbosOrdenes(cambio) {
  const estado = reproductor.estado;
  estado.cola = cambio(estado.cola);
  estado.mezcla = cambio(estado.mezcla);
  guardarEstadoReproductor();
  if (reproductor.alCambiar) reproductor.alCambiar();
}

// Agregar: la canción sonará después de la actual y de las que ya se
// agregaron antes (como en otras apps de música). Si no suena nada, arranca.
function agregarACola(id) {
  const estado = reproductor.estado;
  if (!estado || !reproductor.url) {
    alternarCancion(id);
    return;
  }
  if (estado.actual === id) {
    mostrarAviso('Esta canción ya está sonando.');
    return;
  }
  estado.agregadas = (estado.agregadas || []).filter(x => x !== id);
  enAmbosOrdenes(orden => {
    const sin = orden.filter(x => x !== id);
    let posicion = sin.indexOf(estado.actual) + 1;
    while (posicion < sin.length && estado.agregadas.includes(sin[posicion])) posicion++;
    sin.splice(posicion, 0, id);
    return sin;
  });
  estado.agregadas.push(id);
  guardarEstadoReproductor();
  mostrarAviso('Agregada a la cola.');
}
function quitarDeCola(id) {
  const estado = reproductor.estado;
  estado.agregadas = (estado.agregadas || []).filter(x => x !== id);
  enAmbosOrdenes(orden => orden.filter(x => x !== id));
}
// Mueve una canción un lugar (-1 sube, 1 baja) en el orden que está sonando.
function moverEnCola(id, paso) {
  const estado = reproductor.estado;
  const clave = estado.aleatorio ? 'mezcla' : 'cola';
  const orden = estado[clave].slice();
  const i = orden.indexOf(id);
  const j = i + paso;
  if (i < 0 || j < 0 || j >= orden.length) return;
  [orden[i], orden[j]] = [orden[j], orden[i]];
  estado[clave] = orden;
  guardarEstadoReproductor();
  if (reproductor.alCambiar) reproductor.alCambiar();
}

// Minutos de escucha (spec.md): solo el fan, solo mientras suena de verdad.
function contarEscucha() {
  const audio = reproductor.audio;
  if (audio.paused) { reproductor.ultimoTiempo = null; return; }
  const t = audio.currentTime;
  if (reproductor.ultimoTiempo !== null) {
    const pasaron = t - reproductor.ultimoTiempo;
    if (pasaron > 0 && pasaron < 1.5) reproductor.segundosPendientes += pasaron; // saltos de la barra no cuentan
  }
  reproductor.ultimoTiempo = t;
  if (reproductor.segundosPendientes >= 5) guardarSegundosEscucha();
}
// REAL: suma lo escuchado en Supabase (función sumar_escucha) y avisa si
// el fan subió de nivel.
async function guardarSegundosEscucha() {
  const segundos = Math.round(reproductor.segundosPendientes);
  const fan = fanActual();
  if (!fan || segundos <= 0) return;
  reproductor.segundosPendientes -= segundos;
  const { data: minutos, error } = await baseDatos.rpc('sumar_escucha', { segundos });
  if (error || minutos === null) {
    reproductor.segundosPendientes += segundos; // se intenta otra vez en la próxima
    return;
  }
  const fanEnDatos = obtenerDatos('fans').find(f => f.id === fan.id);
  if (!fanEnDatos) return;
  const nivelAntes = nivelPorMinutos(fanEnDatos.minutosEscucha);
  fanEnDatos.minutosEscucha = minutos;
  const nivelDespues = nivelPorMinutos(minutos);
  if (nivelDespues > nivelAntes) mostrarAviso(`Subiste al nivel ${nivelDespues}.`);
}

// Para la música y borra la cola (lo usará «Cerrar sesión»).
function detenerMusica() {
  guardarSegundosEscucha();
  if (reproductor.audio) {
    reproductor.audio.pause();
    reproductor.audio.removeAttribute('src');
  }
  if (reproductor.url && reproductor.url.startsWith('blob:')) URL.revokeObjectURL(reproductor.url);
  reproductor.url = null;
  reproductor.estado = null;
  localStorage.removeItem(CLAVE_REPRODUCTOR);
  cerrarReproductor();
  pintarReproductor();
  actualizarReproductor();
}

// ----- Lo que se ve -----
function icono(nombre, clases = '') {
  return `<svg class="icono ${clases}" aria-hidden="true"><use href="#icono-${nombre}"></use></svg>`;
}

// Pone en la página el minirreproductor (sobre la navegación) y la vista ampliada.
function crearReproductor() {
  const pantalla = document.querySelector('.pantalla--con-navegacion');
  if (!pantalla || document.querySelector('[data-minirreproductor]')) return;
  pantalla.insertAdjacentHTML('beforeend', '<div class="minirreproductor pantalla__minirreproductor" data-minirreproductor hidden></div>');
  document.body.insertAdjacentHTML('beforeend', `
    <section class="reproductor" role="dialog" aria-modal="true" aria-labelledby="reproductor-titulo" data-reproductor></section>`);
  if (!document.querySelector('[data-avisos]')) {
    pantalla.insertAdjacentHTML('beforeend', '<div class="pantalla__avisos" aria-live="polite" data-avisos></div>');
  }

  const mini = document.querySelector('[data-minirreproductor]');
  const ampliado = document.querySelector('[data-reproductor]');
  mini.addEventListener('click', evento => {
    if (evento.target.closest('[data-abrir-reproductor]')) abrirReproductor(evento.target.closest('button'));
    else if (evento.target.closest('[data-alternar]')) alternarPausa();
  });
  ampliado.addEventListener('click', evento => {
    const boton = evento.target.closest('button');
    if (!boton) return;
    if (boton.matches('[data-cerrar-reproductor]')) cerrarReproductor();
    else if (boton.matches('[data-alternar]')) alternarPausa();
    else if (boton.matches('[data-siguiente]')) siguienteCancion();
    else if (boton.matches('[data-anterior]')) cancionAnterior();
    else if (boton.matches('[data-aleatorio]')) alternarAleatorio();
    else if (boton.matches('[data-bucle]')) cambiarBucle();
  });
  // Barra de avance: moverla cambia el segundo de la canción.
  ampliado.addEventListener('input', evento => {
    if (!evento.target.matches('[data-avance]') || !reproductor.audio) return;
    reproductor.arrastrando = true;
    reproductor.audio.currentTime = Number(evento.target.value);
    reproductor.ultimoTiempo = null;
    actualizarReproductor(true);
  });
  ampliado.addEventListener('change', evento => {
    if (evento.target.matches('[data-avance]')) reproductor.arrastrando = false;
  });
  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && ampliado.classList.contains('reproductor--abierto')) cerrarReproductor();
  });
  // Al salir de la página se guarda dónde iba, para retomarlo en la siguiente.
  window.addEventListener('pagehide', () => {
    guardarSegundosEscucha();
    guardarEstadoReproductor();
  });
}

// Dibuja el mini y la vista ampliada para la canción actual.
function pintarReproductor() {
  const mini = document.querySelector('[data-minirreproductor]');
  const ampliado = document.querySelector('[data-reproductor]');
  if (!mini) return;
  const lanzamiento = lanzamientoSonando();
  if (reproductor.alCambiar) reproductor.alCambiar(); // p. ej. la pantalla Cola
  if (!lanzamiento) {
    mini.hidden = true;
    mini.innerHTML = '';
    ampliado.innerHTML = '';
    return;
  }
  const artista = obtenerDatos('artistas').find(a => a.id === lanzamiento.artista);
  const nombreArtista = artista ? artista.nombreArtistico : '';
  const esFan = Boolean(fanActual());
  const cancion = escapar(lanzamiento.nombreCancion);

  mini.innerHTML = `
    <button type="button" class="minirreproductor__abrir" data-abrir-reproductor
      aria-label="Abrir reproductor: ${cancion}, de ${escapar(nombreArtista)}">
      ${lanzamiento.portada
        ? `<img class="portada portada--pequena" src="${escapar(rutaRecurso(lanzamiento.portada))}" alt="">`
        : '<span class="portada portada--pequena"></span>'}
      <span class="minirreproductor__info">
        <span class="minirreproductor__titulo">${cancion}</span>
        <span class="minirreproductor__detalle">${escapar(nombreArtista)}</span>
      </span>
    </button>
    <button type="button" class="boton-icono" data-alternar aria-label="Reproducir">${icono('reproducir')}</button>
    <div class="progreso minirreproductor__progreso" aria-hidden="true"><span class="progreso__barra" data-progreso-mini></span></div>`;
  mini.hidden = false;

  ampliado.innerHTML = `
    <div class="atmosfera atmosfera--inferior" aria-hidden="true"></div>
    <div class="reproductor__cuerpo">
      <header class="barra-superior">
        <button type="button" class="boton-icono" data-cerrar-reproductor aria-label="Cerrar reproductor">${icono('bajar')}</button>
        <span class="barra-superior__titulo" id="reproductor-titulo">Reproduciendo</span>
        ${esFan ? `<a class="boton-icono" href="cola-fan.html" aria-label="Ver la cola de reproducción">${icono('cola')}</a>` : '<span></span>'}
      </header>
      ${htmlPortada(lanzamiento, 'reproductor__portada')}
      <div class="reproductor__info">
        <h2 class="titulo titulo--medio">${cancion}</h2>
        <p class="texto--pequeno texto--suave reproductor__detalle">${escapar(nombreArtista)} · ${escapar(lanzamiento.nombreLanzamiento)}</p>
      </div>
      <div class="avance">
        <input class="avance__control" type="range" min="0" max="0" step="1" value="0" aria-label="Posición de la canción" data-avance>
        <div class="avance__tiempos"><span data-tiempo-actual>0:00</span><span data-tiempo-total>0:00</span></div>
      </div>
      <div class="reproductor__controles">
        <button type="button" class="boton-icono" data-aleatorio aria-label="Aleatorio" aria-pressed="false">${icono('aleatorio')}</button>
        <button type="button" class="boton-icono boton-icono--relleno" data-anterior aria-label="Canción anterior">${icono('cancion-anterior')}</button>
        <button type="button" class="boton-icono boton-icono--relleno boton-icono--grande" data-alternar aria-label="Reproducir">${icono('reproducir')}</button>
        <button type="button" class="boton-icono boton-icono--relleno" data-siguiente aria-label="Canción siguiente">${icono('cancion-siguiente')}</button>
        <button type="button" class="boton-icono" data-bucle aria-label="Bucle: apagado" aria-pressed="false">${icono('bucle')}</button>
      </div>
      ${esFan && artista ? `<a class="boton boton--secundario boton--bloque" href="perfil-artista-fan.html?id=${encodeURIComponent(artista.id)}">Conocer a ${escapar(nombreArtista)}</a>` : ''}
      ${lanzamiento.audio === AUDIO_DE_MUESTRA ? '<p class="texto--pequeno texto--suave reproductor__nota">Audio de muestra original para la demostración.</p>' : ''}
    </div>`;
}

// Pone al día botones, barra y tiempos (se llama varias veces por segundo).
function actualizarReproductor(desdeLaBarra = false) {
  const estado = reproductor.estado;
  const audio = reproductor.audio;
  const sonando = Boolean(estado && audio && !audio.paused);

  document.querySelectorAll('[data-minirreproductor] [data-alternar], [data-reproductor] [data-alternar]').forEach(boton => {
    boton.querySelector('use').setAttribute('href', sonando ? '#icono-pausa' : '#icono-reproducir');
    boton.setAttribute('aria-label', sonando ? 'Pausar' : 'Reproducir');
  });

  // Botones de las pantallas (data-reproducir="id"): ▶ o ⏸, y «Escuchar» o «Pausar».
  document.querySelectorAll('[data-reproducir]').forEach(boton => {
    const esta = estaSonando(boton.dataset.reproducir);
    boton.querySelector('use').setAttribute('href', esta ? '#icono-pausa' : '#icono-reproducir');
    const texto = boton.querySelector('[data-texto-reproducir]');
    if (texto) texto.textContent = esta ? 'Pausar' : texto.dataset.textoReproducir;
    // El nombre para lectores de pantalla empieza igual que el texto visible y dice qué suena.
    const accion = texto ? texto.textContent : (esta ? 'Pausar' : 'Reproducir');
    boton.setAttribute('aria-label', `${accion} ${boton.dataset.titulo}`);
  });

  if (!estado || !audio) return;
  const duracion = isFinite(audio.duration) ? audio.duration : 0;
  const tiempo = audio.currentTime || 0;
  const porcentaje = duracion ? (tiempo / duracion) * 100 : 0;

  const barraMini = document.querySelector('[data-progreso-mini]');
  if (barraMini) barraMini.style.width = `${porcentaje}%`;

  const barra = document.querySelector('[data-avance]');
  if (barra) {
    barra.max = String(Math.floor(duracion));
    if (!reproductor.arrastrando || desdeLaBarra) barra.value = String(Math.floor(tiempo));
    barra.style.setProperty('--avance', `${porcentaje}%`);
    barra.setAttribute('aria-valuetext', `${formatoDuracion(tiempo)} de ${formatoDuracion(duracion)}`);
  }
  const actual = document.querySelector('[data-tiempo-actual]');
  if (actual) actual.textContent = formatoDuracion(tiempo);
  const total = document.querySelector('[data-tiempo-total]');
  if (total) total.textContent = formatoDuracion(duracion);

  const aleatorio = document.querySelector('[data-aleatorio]');
  if (aleatorio) aleatorio.setAttribute('aria-pressed', String(estado.aleatorio));
  const bucle = document.querySelector('[data-bucle]');
  if (bucle) {
    bucle.setAttribute('aria-pressed', String(estado.bucle !== 'apagado'));
    bucle.setAttribute('aria-label', TEXTO_BUCLE[estado.bucle]);
    bucle.querySelector('use').setAttribute('href', estado.bucle === 'una' ? '#icono-bucle-una' : '#icono-bucle');
  }
}

function abrirReproductor(desde) {
  const ampliado = document.querySelector('[data-reproductor]');
  if (!ampliado || !lanzamientoSonando()) return;
  reproductor.abiertoDesde = desde || document.activeElement;
  ampliado.classList.add('reproductor--abierto');
  const pantalla = document.querySelector('.pantalla');
  if (pantalla) pantalla.inert = true; // lo de atrás no se puede tocar ni enfocar
  setTimeout(() => {
    const cerrar = ampliado.querySelector('[data-cerrar-reproductor]');
    if (cerrar) cerrar.focus();
  }, 50);
}
function cerrarReproductor() {
  const ampliado = document.querySelector('[data-reproductor]');
  if (!ampliado || !ampliado.classList.contains('reproductor--abierto')) return;
  ampliado.classList.remove('reproductor--abierto');
  const pantalla = document.querySelector('.pantalla');
  if (pantalla) pantalla.inert = false;
  const volver = reproductor.abiertoDesde && document.contains(reproductor.abiertoDesde)
    ? reproductor.abiertoDesde
    : document.querySelector('[data-abrir-reproductor]');
  if (volver) volver.focus();
}

// Al abrir cualquier página con navegación: pone el reproductor y retoma
// la canción donde iba (si el navegador no deja que suene solo, queda en pausa).
function iniciarReproductor() {
  crearReproductor();
  if (!document.querySelector('[data-minirreproductor]')) return;
  const guardado = leerEstadoReproductor();
  if (!guardado || !leerSesion()) return;
  const existen = obtenerDatos('lanzamientos').map(l => l.id);
  guardado.cola = guardado.cola.filter(id => existen.includes(id));
  guardado.mezcla = guardado.mezcla.filter(id => existen.includes(id));
  if (!existen.includes(guardado.actual)) {
    localStorage.removeItem(CLAVE_REPRODUCTOR); // la canción ya no existe
    return;
  }
  reproductor.estado = guardado;
  cargarCancion(guardado.actual, { tiempo: guardado.tiempo, sonar: guardado.sonando });
}

// Activa todos los botones data-reproducir que hay dentro de un contenedor.
// Los que tienen texto («Escuchar») también abren la vista ampliada.
function activarBotonesReproducir(contenedor) {
  contenedor.querySelectorAll('[data-reproducir]').forEach(boton => {
    boton.addEventListener('click', () => {
      alternarCancion(boton.dataset.reproducir, Boolean(boton.querySelector('[data-texto-reproducir]')));
    });
  });
  contenedor.querySelectorAll('[data-agregar-cola]').forEach(boton => {
    boton.addEventListener('click', () => agregarACola(boton.dataset.agregarCola));
  });
  actualizarReproductor();
}

// HTML de un botón de reproducir (▶) para un lanzamiento.
function botonReproducir(lanzamiento, clases) {
  return `<button type="button" class="boton-icono ${clases}" data-reproducir="${escapar(lanzamiento.id)}"
    data-titulo="${escapar(lanzamiento.nombreCancion)}" aria-label="Reproducir ${escapar(lanzamiento.nombreCancion)}">
    <svg class="icono" aria-hidden="true"><use href="#icono-reproducir"></use></svg></button>`;
}

// HTML del botón ＋ «Agregar a la cola».
function botonAgregarCola(lanzamiento, clases = 'boton-icono--pequeno') {
  return `<button type="button" class="boton-icono ${clases}" data-agregar-cola="${escapar(lanzamiento.id)}"
    aria-label="Agregar ${escapar(lanzamiento.nombreCancion)} a la cola">
    <svg class="icono" aria-hidden="true"><use href="#icono-agregar"></use></svg></button>`;
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
      ${botonAgregarCola(lanzamiento)}
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

// ---------- F01c · Nuevos lanzamientos ----------
// Misma oportunidad para todos: solo cuenta la fecha (ventana de 48 h), nunca
// los seguidores, y el orden se mezcla al azar en cada visita.
function mezclar(lista) {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function pantallaNuevosLanzamientosFan() {
  // Sin sesión de fan, a iniciar sesión.
  if (!fanActual()) {
    location.replace('iniciar-sesion.html');
    return;
  }
  const artistas = obtenerDatos('artistas');
  const lanzamientos = obtenerDatos('lanzamientos');
  const enVentana = mezclar(lanzamientos.filter(l => horasRestantesVentana(l) > 0));
  const anteriores = lanzamientos
    .filter(l => horasRestantesVentana(l) === 0)
    .sort((a, b) => new Date(b.fechaPublicacion) - new Date(a.fechaPublicacion));

  const cajaVentana = document.querySelector('[data-lista-ventana]');
  if (enVentana.length) {
    cajaVentana.innerHTML = enVentana.map(l => {
      const artista = artistas.find(a => a.id === l.artista);
      const nombreArtista = artista ? artista.nombreArtistico : '';
      return `
        <article class="tarjeta">
          <div class="tarjeta__cabecera">
            ${htmlPortada(l, 'portada--mediana')}
            <div>
              <h2 class="tarjeta__titulo">${escapar(l.nombreLanzamiento)}</h2>
              <p class="tarjeta__texto">${escapar(nombreArtista)}</p>
              <div class="etiquetas nuevos__etiquetas"><span class="etiqueta etiqueta--borde">Quedan ${horasRestantesVentana(l)} h</span></div>
            </div>
          </div>
          <div class="tarjeta__acciones acciones-cancion">
            <button type="button" class="boton" data-reproducir="${escapar(l.id)}" data-titulo="${escapar(l.nombreCancion)} de ${escapar(nombreArtista)}">
              <svg class="icono" aria-hidden="true"><use href="#icono-reproducir"></use></svg>
              <span data-texto-reproducir="Escuchar">Escuchar</span>
            </button>
            ${botonAgregarCola(l, 'boton-icono--borde')}
            <a class="boton-icono boton-icono--borde" href="perfil-artista-fan.html?id=${encodeURIComponent(l.artista)}"
              aria-label="Ver perfil de ${escapar(nombreArtista)}">
              <svg class="icono" aria-hidden="true"><use href="#icono-perfil"></use></svg>
            </a>
          </div>
        </article>`;
    }).join('');
  } else {
    cajaVentana.innerHTML = `
      <div class="tarjeta">
        <h2 class="tarjeta__titulo">No hay lanzamientos en su ventana</h2>
        <p class="tarjeta__texto">Cuando un artista publique, aparecerá aquí durante sus primeras 48 horas.</p>
      </div>`;
  }

  if (anteriores.length) {
    document.querySelector('[data-lista-anteriores]').innerHTML = anteriores.map(htmlFilaCancion).join('');
  } else {
    document.querySelector('[data-seccion-anteriores]').remove();
  }

  activarBotonesReproducir(document.querySelector('main'));
}

// ---------- F02 · Perfil del artista (visto por el fan) ----------

function pantallaPerfilArtistaFan() {
  // Sin sesión de fan, a iniciar sesión.
  let fan = fanActual();
  if (!fan) {
    location.replace('iniciar-sesion.html');
    return;
  }

  // Volver: a la pantalla anterior si venimos de la app; si no, a Inicio.
  document.querySelector('[data-volver]').addEventListener('click', evento => {
    if (document.referrer && new URL(document.referrer).origin === location.origin) {
      evento.preventDefault();
      history.back();
    }
  });

  const id = new URLSearchParams(location.search).get('id');
  let artista = obtenerDatos('artistas').find(a => a.id === id);
  if (!artista) return; // queda el mensaje del HTML

  // El fan de la sesión dentro de los datos cargados: aquí se anotan los
  // cambios (seguir, visita) para redibujar sin volver a cargar todo.
  const fanEnDatos = obtenerDatos('fans').find(f => f.id === fan.id);
  const artistaEnDatos = obtenerDatos('artistas').find(a => a.id === id);

  // Fan fundador (spec.md): en la primera visita, si el artista tiene menos
  // de 1000 seguidores. REAL: se guarda la visita y la base de datos decide.
  async function registrarVisita() {
    if (!fanEnDatos || fan.artistasVisitados.includes(id)) return;
    const { data, error } = await baseDatos.from('visitas')
      .insert({ fan: fan.id, artista: id }).select().single();
    if (error) return; // si falla, se intenta en la próxima visita
    fanEnDatos.artistasVisitados = fanEnDatos.artistasVisitados.concat(id);
    if (data.es_fan_fundador) {
      fanEnDatos.fanFundadorDe = fanEnDatos.fanFundadorDe.concat(id);
      fan = fanActual();
      pintar();
      mostrarAviso(`Eres fan fundador de ${artista.nombreArtistico}. Lo descubriste en su comienzo.`);
    }
  }

  document.title = `Looped · ${artista.nombreArtistico}`;
  const caja = document.querySelector('[data-perfil-artista]');
  const generos = obtenerDatos('generos');
  const cupo = obtenerDatos('cupos').find(c => c.artista === id);
  const lanzamientos = obtenerDatos('lanzamientos')
    .filter(l => l.artista === id)
    .sort((a, b) => new Date(b.fechaPublicacion) - new Date(a.fechaPublicacion));

  function pintar() {
    const sigue = fan.artistasQueSigue.includes(id);
    const fundador = fan.fanFundadorDe.includes(id);
    const enFanClub = fan.fanClubs.includes(id);
    const nombre = escapar(artista.nombreArtistico);
    const avatar = artista.foto
      ? `<span class="avatar avatar--grande"><img src="${escapar(rutaRecurso(artista.foto))}" alt="Foto de ${nombre}"></span>`
      : `<span class="avatar avatar--grande avatar--acento" aria-hidden="true">${escapar(iniciales(artista.nombreArtistico))}</span>`;
    const etiquetas = [
      fundador ? '<span class="etiqueta etiqueta--reconocimiento">Fan fundador</span>' : '',
      enFanClub ? '<span class="etiqueta etiqueta--acento">Fan Club</span>' : '',
      ...artista.generos.slice(0, 3).map(g => {
        const genero = generos.find(x => x.id === g);
        return `<span class="etiqueta etiqueta--borde">${escapar(genero ? genero.nombre : g)}</span>`;
      })
    ].join('');
    const estadoCupo = cupo && cupo.estado === 'abierto'
      ? `Cupo abierto, quedan ${Math.max(0, cupo.totalPreguntas - cupo.preguntasUsadas)} respuestas`
      : 'Cupo cerrado';

    let musica = `<div class="tarjeta"><p class="tarjeta__texto">Todavía no hay lanzamientos.</p></div>`;
    if (lanzamientos.length) {
      const ultimo = lanzamientos[0];
      const enVentana = horasRestantesVentana(ultimo) > 0;
      musica = `
        <article class="tarjeta">
          <div class="tarjeta__cabecera">
            ${htmlPortada(ultimo, 'portada--mediana')}
            <div>
              <h3 class="tarjeta__titulo">${escapar(ultimo.nombreLanzamiento)}</h3>
              <p class="tarjeta__texto">${escapar(ultimo.nombreCancion)}</p>
              <div class="etiquetas perfil-artista__etiquetas-musica"><span class="etiqueta etiqueta--borde">${enVentana ? 'Nuevo lanzamiento' : escapar(haceCuanto(ultimo.fechaPublicacion))}</span></div>
            </div>
          </div>
          <div class="tarjeta__acciones acciones-cancion">
            <button type="button" class="boton boton--secundario" data-reproducir="${escapar(ultimo.id)}" data-titulo="${escapar(ultimo.nombreCancion)}">
              <svg class="icono" aria-hidden="true"><use href="#icono-reproducir"></use></svg>
              <span data-texto-reproducir="Escuchar">Escuchar</span>
            </button>
            ${botonAgregarCola(ultimo, 'boton-icono--borde')}
          </div>
        </article>
        ${lanzamientos.length > 1 ? `<div class="tarjeta perfil-artista__mas">${lanzamientos.slice(1).map(htmlFilaCancion).join('')}</div>` : ''}`;
    }

    caja.innerHTML = `
      <div class="perfil-artista__cabecera">
        ${avatar}
        <div>
          <h1 class="titulo titulo--medio">${nombre}</h1>
          <p class="texto--pequeno texto--suave">@${escapar(artista.nombreUsuario)}${artista.ciudad ? ' · ' + escapar(artista.ciudad) : ''}</p>
        </div>
      </div>
      ${etiquetas ? `<div class="etiquetas perfil-artista__etiquetas">${etiquetas}</div>` : ''}
      <div class="perfil-artista__acciones">
        <button type="button" class="boton boton--secundario" aria-pressed="${sigue}" data-seguir>${sigue ? 'Siguiendo' : 'Seguir'}</button>
        <a class="boton" href="conectar-fan.html?id=${encodeURIComponent(id)}">Conectar</a>
      </div>
      <p class="rotulo rotulo--pequeno texto--suave perfil-artista__estado">${artista.seguidores.toLocaleString('es-CO')} seguidores · ${estadoCupo}</p>

      <section class="perfil-artista__seccion" aria-labelledby="titulo-su-musica">
        <div class="encabezado-seccion"><h2 class="encabezado-seccion__titulo" id="titulo-su-musica">Su música</h2></div>
        ${musica}
      </section>

      <section class="perfil-artista__seccion" aria-labelledby="titulo-conoce">
        <div class="encabezado-seccion"><h2 class="encabezado-seccion__titulo" id="titulo-conoce">Conoce a ${nombre}</h2></div>
        <div class="rejilla-tarjetas rejilla-tarjetas--dos">
          <article class="tarjeta">
            <p class="tarjeta__texto tarjeta__texto--principal">${escapar(artista.presentacion || 'Todavía no ha escrito su presentación.')}</p>
          </article>
          <article class="tarjeta">
            <h3 class="tarjeta__titulo">Fan Club de ${nombre}</h3>
            <p class="tarjeta__texto">${enFanClub ? 'Ya eres miembro. Revisa el contenido exclusivo.' : 'Contenido exclusivo y prioridad dentro de su cupo.'}</p>
            <div class="tarjeta__acciones">
              <a class="boton boton--secundario boton--bloque" href="${enFanClub ? 'contenido-fan-club-fan.html' : 'fan-club-fan.html'}?id=${encodeURIComponent(id)}">${enFanClub ? 'Ver contenido' : 'Explorar Fan Club'}</a>
            </div>
          </article>
        </div>
        <div class="perfil-artista__comunidad">
          <a class="boton boton--terciario" href="comunidad-fan.html?id=${encodeURIComponent(id)}">Ver comunidad</a>
        </div>
      </section>`;

    activarBotonesReproducir(caja);

    // Seguir / dejar de seguir. REAL: guarda o borra la fila en «seguimientos»;
    // la base de datos suma o resta el seguidor sola.
    const botonSeguir = caja.querySelector('[data-seguir]');
    botonSeguir.addEventListener('click', async () => {
      if (botonSeguir.disabled) return;
      botonSeguir.disabled = true;
      const seguia = fan.artistasQueSigue.includes(id);
      const { error } = seguia
        ? await baseDatos.from('seguimientos').delete().match({ fan: fan.id, artista: id })
        : await baseDatos.from('seguimientos').insert({ fan: fan.id, artista: id });
      if (error || !fanEnDatos) {
        botonSeguir.disabled = false;
        mostrarAviso('No pudimos guardar el cambio. Revisa tu conexión e inténtalo otra vez.');
        return;
      }
      fanEnDatos.artistasQueSigue = seguia
        ? fanEnDatos.artistasQueSigue.filter(x => x !== id)
        : fanEnDatos.artistasQueSigue.concat(id);
      artistaEnDatos.seguidores = Math.max(0, artistaEnDatos.seguidores + (seguia ? -1 : 1));
      fan = fanActual();
      artista = artistaEnDatos;
      pintar();
      caja.querySelector('[data-seguir]').focus(); // el foco no se pierde al redibujar
    });
  }
  pintar();
  registrarVisita();
}

// ---------- F05 · Conectar con el artista ----------
// Minutos de escucha que pide llegar a un nivel (tabla de spec.md).
function minutosParaNivel(nivel) {
  let total = 0;
  for (let n = 0; n < nivel; n++) total += Math.round(15 * Math.pow(1.5, n));
  return total;
}

// Qué le pasa a una pregunta, dicho para el fan.
function textoEstadoPregunta(pregunta, artista) {
  switch (pregunta.estado) {
    case 'nueva':
    case 'pendiente': return 'En cola. El artista decide qué responder.';
    case 'seleccionada': return `${artista.nombreArtistico} seleccionó esta pregunta. Espera su respuesta.`;
    case 'respondida': return 'La respuesta está disponible.';
    case 'descartada': return 'No fue seleccionada en este cupo.';
  }
  return '';
}

// ¿Puede el fan participar en el cupo del artista? Devuelve el caso:
// 'cerrado', 'nivel' (no le alcanza) o 'abierto'. La base de datos
// revisa lo mismo al guardar (supabase/cambio-03-preguntas-y-votos.sql).
function participacion(fan, cupo) {
  if (!cupo || cupo.estado !== 'abierto') return 'cerrado';
  if (nivelPorMinutos(fan.minutosEscucha) < cupo.nivelMinimo) return 'nivel';
  return 'abierto';
}

// Mensaje para el fan cuando la base de datos no deja preguntar o votar.
function mensajeErrorParticipacion(error) {
  const texto = (error && error.message) || '';
  if (texto.includes('cupo-cerrado')) return 'El cupo ya no está abierto.';
  if (texto.includes('nivel-insuficiente')) return 'Todavía no tienes el nivel que pide este cupo.';
  if (texto.includes('voto-propio')) return 'No puedes votar tu propia pregunta.';
  return 'No pudimos guardar. Revisa tu conexión e inténtalo otra vez.';
}

function pantallaConectarFan() {
  // Sin sesión de fan, a iniciar sesión.
  const fan = fanActual();
  if (!fan) {
    location.replace('iniciar-sesion.html');
    return;
  }
  const id = new URLSearchParams(location.search).get('id');
  const artista = obtenerDatos('artistas').find(a => a.id === id);
  const caja = document.querySelector('[data-conectar]');
  // Volver: al perfil de este artista.
  const volver = document.querySelector('[data-volver]');
  if (!artista) return; // queda el mensaje del HTML
  volver.href = `perfil-artista-fan.html?id=${encodeURIComponent(id)}`;

  const nombre = escapar(artista.nombreArtistico);
  document.title = `Looped · Conecta con ${artista.nombreArtistico}`;
  document.querySelector('[data-titulo-conectar]').textContent = `Conecta con ${artista.nombreArtistico}`;
  if (new URLSearchParams(location.search).get('enviada')) mostrarAviso('Pregunta enviada. Está en cola.');

  const cupo = obtenerDatos('cupos').find(c => c.artista === id);
  const caso = participacion(fan, cupo);
  const sigue = fan.artistasQueSigue.includes(id);
  const nombresFans = Object.fromEntries(obtenerDatos('fans').map(f => [f.id, f.nombrePerfil]));

  function pintar() {
    const votos = obtenerDatos('votos');
    const preguntas = obtenerDatos('preguntas').filter(p => p.artista === id);
    const mias = preguntas.filter(p => p.autor === fan.id)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const comunidad = preguntas
      .filter(p => p.autor !== fan.id && ['nueva', 'pendiente', 'seleccionada'].includes(p.estado))
      .sort((a, b) => (b.votos - a.votos) || (new Date(a.fecha) - new Date(b.fecha)));

    // Encabezado, tarjetas y botón según el caso del flujo.
    let titulo, bajada, tarjetas, acciones;
    if (caso === 'cerrado') {
      titulo = 'Volvamos a encontrarnos.';
      bajada = 'El artista todavía no ha abierto un nuevo cupo.';
      tarjetas = `
        <section class="tarjeta"><h2 class="tarjeta__titulo">Cupo cerrado</h2><p class="tarjeta__texto">${nombre} aún no ha abierto un nuevo cupo.</p></section>
        <section class="tarjeta"><h2 class="tarjeta__titulo">Qué puedes hacer</h2><p class="tarjeta__texto">Sigue escuchando y vuelve cuando haya un nuevo espacio para participar.</p></section>`;
      acciones = `<a class="boton" href="${escapar(volver.href)}">Volver al perfil</a>`;
    } else if (caso === 'nivel') {
      const nivel = nivelPorMinutos(fan.minutosEscucha);
      const meta = minutosParaNivel(cupo.nivelMinimo);
      const faltan = Math.max(1, meta - fan.minutosEscucha);
      const avance = Math.min(100, (fan.minutosEscucha / meta) * 100);
      titulo = 'Revisa las condiciones.';
      bajada = 'Todavía no puedes enviar una pregunta o votar.';
      tarjetas = `
        <section class="tarjeta">
          <h2 class="tarjeta__titulo">Revisa las condiciones</h2>
          <p class="tarjeta__texto">Este cupo pide nivel ${cupo.nivelMinimo} o superior. Tu nivel actual es ${nivel}.</p>
          <div class="progreso" role="progressbar" aria-label="Avance hacia el nivel ${cupo.nivelMinimo}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(avance)}"><span class="progreso__barra" style="width: ${avance.toFixed(1)}%"></span></div>
          <p class="tarjeta__texto">Te faltan ${faltan} min de escucha registrada.</p>
        </section>`;
      const ultimo = obtenerDatos('lanzamientos').filter(l => l.artista === id)
        .sort((a, b) => new Date(b.fechaPublicacion) - new Date(a.fechaPublicacion))[0];
      acciones = `<a class="boton" href="${escapar(volver.href)}">Volver al perfil</a>` + (ultimo ? `
        <button type="button" class="boton boton--secundario" data-reproducir="${escapar(ultimo.id)}" data-titulo="${escapar(ultimo.nombreCancion)}">
          <svg class="icono" aria-hidden="true"><use href="#icono-reproducir"></use></svg>
          <span data-texto-reproducir="Escuchar a ${nombre}">Escuchar a ${nombre}</span>
        </button>` : '');
    } else {
      titulo = sigue ? 'Sigue la conversación.' : 'Tu primer contacto.';
      bajada = sigue ? 'Continúa tu relación con el artista.' : 'Puedes participar aunque todavía no sigas al artista.';
      tarjetas = `
        <section class="tarjeta">
          <h2 class="tarjeta__titulo">Cupo abierto</h2>
          <p class="tarjeta__texto">Puedes enviar una pregunta si cumples las condiciones.</p>
          <div class="tarjeta__encabezado"><span class="texto--pequeno texto--suave">Respuestas disponibles</span><b class="texto--pequeno">${Math.max(0, cupo.totalPreguntas - cupo.preguntasUsadas)} de ${cupo.totalPreguntas}</b></div>
          <div class="tarjeta__encabezado"><span class="texto--pequeno texto--suave">Condición</span><b class="texto--pequeno">${escapar(textoNivelMinimo(cupo.nivelMinimo))}</b></div>
        </section>`;
      acciones = `<a class="boton" href="escribir-pregunta-fan.html?id=${encodeURIComponent(id)}">Hacer una pregunta</a>`;
    }

    const tarjetaMia = p => {
      const respondida = p.estado === 'respondida';
      const etiqueta = respondida ? '<span class="etiqueta etiqueta--reconocimiento">Respondida</span>'
        : p.estado === 'seleccionada' ? '<span class="etiqueta etiqueta--borde">Seleccionada</span>' : '';
      return `
        <article class="tarjeta">
          <div class="tarjeta__encabezado"><span class="tarjeta__meta">Para ${nombre}</span>${etiqueta}</div>
          <p class="tarjeta__texto tarjeta__texto--principal">${escapar(p.texto)}</p>
          <p class="tarjeta__texto">${escapar(textoEstadoPregunta(p, artista))}</p>
          <div class="tarjeta__acciones">
            <a class="boton ${respondida ? 'boton--secundario' : 'boton--terciario'}" href="tu-conexion-fan.html?id=${encodeURIComponent(p.id)}">${respondida ? 'Ver respuesta' : 'Ver mi pregunta'}</a>
          </div>
        </article>`;
    };
    const tarjetaComunidad = p => {
      const voto = votos.some(v => v.fan === fan.id && v.pregunta === p.id);
      return `
        <article class="tarjeta">
          <div class="tarjeta__encabezado">
            <span class="tarjeta__meta">${escapar(nombresFans[p.autor] || 'Fan')}${p.autorEsFanClub ? ' · Fan Club' : ''}</span>
            <span class="votos" aria-label="${p.votos} ${p.votos === 1 ? 'voto' : 'votos'}"><svg class="icono icono--pequeno" aria-hidden="true"><use href="#icono-votos"></use></svg>${p.votos}</span>
          </div>
          <p class="tarjeta__texto tarjeta__texto--principal">${escapar(p.texto)}</p>
          <p class="tarjeta__texto">${voto ? 'Tu voto está registrado.' : escapar(textoEstadoPregunta(p, artista))}</p>
          <div class="tarjeta__acciones">
            <button type="button" class="boton boton--terciario" data-votar="${escapar(p.id)}" aria-pressed="${voto}" ${caso === 'abierto' ? '' : 'disabled'}>${voto ? 'Retirar voto' : 'Votar'}</button>
          </div>
        </article>`;
    };

    caja.innerHTML = `
      <div class="encabezado-pagina">
        <h1 class="titulo titulo--medio">${titulo}</h1>
        <p class="encabezado-pagina__bajada">${bajada}</p>
      </div>
      <div class="rejilla-tarjetas rejilla-tarjetas--dos">${tarjetas}</div>
      <div class="conectar__acciones">${acciones}</div>

      ${mias.length ? `
      <section class="conectar__seccion" aria-labelledby="titulo-tus-preguntas">
        <div class="encabezado-seccion"><h2 class="encabezado-seccion__titulo" id="titulo-tus-preguntas">Tus preguntas</h2></div>
        <div class="rejilla-tarjetas rejilla-tarjetas--dos">${mias.map(tarjetaMia).join('')}</div>
      </section>` : ''}

      <section class="conectar__seccion" aria-labelledby="titulo-comunidad">
        <div class="encabezado-seccion"><h2 class="encabezado-seccion__titulo" id="titulo-comunidad">Preguntas de la comunidad</h2></div>
        ${comunidad.length
          ? `<div class="rejilla-tarjetas rejilla-tarjetas--dos">${comunidad.map(tarjetaComunidad).join('')}</div>`
          : '<div class="tarjeta"><p class="tarjeta__texto">Todavía no hay preguntas de otros fans en este cupo.</p></div>'}
        <p class="texto--pequeno texto--suave conectar__nota">Votar ayuda al artista a ver qué interesa más. No garantiza una respuesta.</p>
      </section>`;

    activarBotonesReproducir(caja);
  }

  // Votar o retirar el voto. REAL: guarda o borra en «votos»; la base de
  // datos suma o resta el voto de la pregunta y revisa cupo y nivel.
  caja.addEventListener('click', async evento => {
    const boton = evento.target.closest('[data-votar]');
    if (!boton || boton.disabled) return;
    boton.disabled = true;
    const preguntaId = boton.dataset.votar;
    const votos = obtenerDatos('votos');
    const yaVoto = votos.some(v => v.fan === fan.id && v.pregunta === preguntaId);
    const { error } = yaVoto
      ? await baseDatos.from('votos').delete().match({ fan: fan.id, pregunta: preguntaId })
      : await baseDatos.from('votos').insert({ fan: fan.id, pregunta: preguntaId });
    if (error) {
      boton.disabled = false;
      mostrarAviso(mensajeErrorParticipacion(error));
      return;
    }
    const pregunta = obtenerDatos('preguntas').find(p => p.id === preguntaId);
    if (yaVoto) {
      datosCargados.votos = votos.filter(v => !(v.fan === fan.id && v.pregunta === preguntaId));
      pregunta.votos = Math.max(0, pregunta.votos - 1);
    } else {
      datosCargados.votos = votos.concat({ fan: fan.id, pregunta: preguntaId });
      pregunta.votos += 1;
    }
    pintar(); // reordena la lista por votos
    const mismo = caja.querySelector(`[data-votar="${CSS.escape(preguntaId)}"]`);
    if (mismo) mismo.focus(); // el foco sigue en la pregunta votada
    mostrarAviso(yaVoto ? 'Retiraste tu voto.' : 'Voto registrado.');
  });

  pintar();
}

// ---------- F05e · Escribir pregunta ----------
function pantallaEscribirPreguntaFan() {
  // Sin sesión de fan, a iniciar sesión.
  const fan = fanActual();
  if (!fan) {
    location.replace('iniciar-sesion.html');
    return;
  }
  const id = new URLSearchParams(location.search).get('id');
  const artista = obtenerDatos('artistas').find(a => a.id === id);
  if (!artista) {
    location.replace('explorar-fan.html');
    return;
  }
  const conectar = `conectar-fan.html?id=${encodeURIComponent(id)}`;
  document.querySelector('[data-volver-conectar]').href = conectar;
  document.querySelector('[data-nombre-artista]').textContent = artista.nombreArtistico;

  // Si ya no puede participar (cupo cerrado o nivel), vuelve a Conectar, que explica por qué.
  const cupo = obtenerDatos('cupos').find(c => c.artista === id);
  if (participacion(fan, cupo) !== 'abierto') {
    location.replace(conectar);
    return;
  }

  const formulario = document.getElementById('formulario-pregunta');
  const pregunta = document.getElementById('pregunta');
  const boton = document.querySelector('button[form="formulario-pregunta"]');
  activarContador(pregunta, document.querySelector('[data-contador]'));
  pregunta.addEventListener('input', () => mostrarError('pregunta', ''));

  formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (boton.disabled) return;
    const texto = pregunta.value.trim();
    if (texto.length < 5) {
      mostrarError('pregunta', texto ? 'Escribe al menos 5 caracteres.' : 'Escribe tu pregunta.');
      pregunta.focus();
      return;
    }

    // REAL: se guarda en «preguntas» y llega a la bandeja del artista.
    // La base de datos revisa cupo y nivel, y marca primer contacto y Fan Club.
    boton.disabled = true;
    boton.textContent = 'Enviando…';
    const { data, error } = await baseDatos.from('preguntas')
      .insert({ artista: id, autor: fan.id, texto }).select('id').single();
    if (error) {
      boton.disabled = false;
      boton.textContent = 'Enviar pregunta';
      mostrarAviso(mensajeErrorParticipacion(error));
      return;
    }
    // Como en el diseño: después de enviar, «Tu conexión» muestra la pregunta en cola.
    location.replace(`tu-conexion-fan.html?id=${encodeURIComponent(data.id)}&enviada=1`);
  });
}

// ---------- Preguntas y respuestas: piezas compartidas ----------
// Votos de una pregunta (corazón con número).
function htmlVotos(votos) {
  return `<span class="votos" aria-label="${votos} ${votos === 1 ? 'voto' : 'votos'}"><svg class="icono icono--pequeno" aria-hidden="true"><use href="#icono-votos"></use></svg>${votos}</span>`;
}

// Qué le pasa a una pregunta, dicho para el artista.
const PISTA_PREGUNTA = {
  nueva: 'Selecciona una pregunta para decidir si la respondes.',
  pendiente: 'Puedes mantenerla en cola o descartarla.',
  seleccionada: 'La seleccionaste. Falta enviar tu respuesta.',
  respondida: 'Respuesta enviada al fan.',
  descartada: 'Descartada.'
};

// Tarjeta de una pregunta en el lado del artista. Con «accion», lleva a
// revisarla o, si ya está respondida, a ver la respuesta.
function htmlPreguntaArtista(pregunta, { accion = true, etiqueta = '' } = {}) {
  const autor = obtenerDatos('fans').find(f => f.id === pregunta.autor);
  const detalles = [autor ? autor.nombrePerfil : 'Fan'];
  if (pregunta.autorEsFanClub) detalles.push('Fan Club');
  if (pregunta.primerContacto) detalles.push('Primer contacto');
  const enlace = encodeURIComponent(pregunta.id);
  const boton = !accion ? ''
    : pregunta.estado === 'respondida'
      ? `<a class="boton boton--secundario boton--bloque" href="respuesta-artista.html?id=${enlace}">Ver respuesta</a>`
      : `<a class="boton boton--bloque" href="revisar-pregunta-artista.html?id=${enlace}">Revisar pregunta</a>`;
  return `
    <article class="tarjeta">
      <div class="tarjeta__encabezado">
        <span class="tarjeta__meta">${escapar(detalles.join(' · '))}</span>
        ${etiqueta || htmlVotos(pregunta.votos)}
      </div>
      <p class="tarjeta__texto tarjeta__texto--principal">${escapar(pregunta.texto)}</p>
      <p class="tarjeta__texto">${PISTA_PREGUNTA[pregunta.estado] || ''}</p>
      ${boton ? `<div class="tarjeta__acciones">${boton}</div>` : ''}
    </article>`;
}

// Estado del cupo en una línea, para el artista.
function textoCupoArtista(cupo) {
  if (cupo && cupo.estado === 'abierto') {
    return `Cupo abierto · te quedan ${Math.max(0, cupo.totalPreguntas - cupo.preguntasUsadas)} de ${cupo.totalPreguntas} respuestas`;
  }
  if (cupo && cupo.estado === 'completo') return 'Cupo completo · abre uno nuevo para responder';
  return 'Cupo cerrado · ábrelo para responder';
}

// Nota de voz con el componente .avance del kit: botón Escuchar/Pausar,
// barra para moverse y tiempos.
function htmlNotaDeVoz(duracion) {
  return `
    <div class="nota-voz" data-nota-voz>
      <button type="button" class="boton boton--secundario boton--bloque" data-nota-boton>
        <svg class="icono" aria-hidden="true"><use href="#icono-reproducir"></use></svg>
        <span>Escuchar nota</span>
      </button>
      <div class="avance">
        <input class="avance__control" type="range" min="0" max="1000" value="0" aria-label="Posición de la nota de voz" style="--avance: 0%">
        <div class="avance__tiempos"><span data-nota-actual>0:00</span><span data-nota-total>${formatoDuracion(duracion || 0)}</span></div>
      </div>
    </div>`;
}

// Hace sonar la nota de voz dibujada con htmlNotaDeVoz(). Devuelve el audio.
// Al sonar, pausa la música del reproductor para no oír las dos a la vez.
function activarNotaDeVoz(caja, url, duracionGuardada) {
  const nota = caja.querySelector('[data-nota-voz]');
  if (!nota) return null;
  const audio = new Audio();
  audio.preload = 'metadata';
  audio.src = url;
  const boton = nota.querySelector('[data-nota-boton]');
  const control = nota.querySelector('.avance__control');
  // Algunas grabaciones no traen su duración: se usa la guardada.
  const duracion = () => (isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duracionGuardada || 0);

  function pintar() {
    const total = duracion();
    const porcentaje = total ? Math.min(100, (audio.currentTime / total) * 100) : 0;
    control.value = Math.round(porcentaje * 10);
    control.style.setProperty('--avance', `${porcentaje}%`);
    nota.querySelector('[data-nota-actual]').textContent = formatoDuracion(audio.currentTime);
    nota.querySelector('[data-nota-total]').textContent = formatoDuracion(total);
    const sonando = !audio.paused;
    boton.querySelector('use').setAttribute('href', sonando ? '#icono-pausa' : '#icono-reproducir');
    boton.querySelector('span').textContent = sonando ? 'Pausar nota' : 'Escuchar nota';
  }

  boton.addEventListener('click', () => {
    if (audio.paused) {
      if (reproductor.audio && !reproductor.audio.paused) reproductor.audio.pause();
      audio.play().catch(() => mostrarAviso('No pudimos reproducir la nota de voz.'));
    } else {
      audio.pause();
    }
  });
  control.addEventListener('input', () => {
    if (duracion()) audio.currentTime = (control.value / 1000) * duracion();
    pintar();
  });
  ['timeupdate', 'play', 'pause', 'ended', 'loadedmetadata'].forEach(nombre => audio.addEventListener(nombre, pintar));
  return audio;
}

// Tarjeta de una respuesta (texto o nota de voz).
function htmlRespuesta(respuesta, titulo, { etiquetaTitulo = 'h2' } = {}) {
  const contenido = respuesta.tipo === 'voz'
    ? `<p class="tarjeta__meta">Nota de voz</p>${htmlNotaDeVoz(respuesta.duracionAudio)}`
    : `<p class="tarjeta__texto tarjeta__texto--principal">${escapar(respuesta.texto)}</p>`;
  return `
    <section class="tarjeta">
      <${etiquetaTitulo} class="tarjeta__titulo">${escapar(titulo)}</${etiquetaTitulo}>
      ${contenido}
      <p class="tarjeta__meta">${escapar(haceCuanto(respuesta.fecha))}</p>
    </section>`;
}

// La pregunta pedida en la dirección (?id=), si es de este artista.
function preguntaDelArtista(artista) {
  const id = new URLSearchParams(location.search).get('id');
  return obtenerDatos('preguntas').find(p => p.id === id && p.artista === artista.id) || null;
}

// ---------- R04 · Bandeja de preguntas ----------
const FILTROS_BANDEJA = [['nuevas', 'Nuevas'], ['votadas', 'Más votadas'], ['pendientes', 'Pendientes'], ['respondidas', 'Respondidas']];
const BANDEJA_VACIA = {
  nuevas: ['No hay preguntas nuevas', 'Cuando tus fans participen, sus preguntas aparecerán aquí.'],
  votadas: ['Sin preguntas en cola', 'Las preguntas con más votos aparecerán primero.'],
  pendientes: ['Nada pendiente', 'Aquí verás las preguntas que mantengas en cola o hayas seleccionado.'],
  respondidas: ['Aún no respondes', 'Tus respuestas enviadas quedarán aquí.']
};

// Las preguntas de cada filtro. Orden (decisión del equipo): más votadas
// primero; si empatan, Fan Club primero. Nuevas y más votadas: solo de
// fans con el nivel mínimo del cupo (spec.md).
function preguntasDeBandeja(artistaId, filtro) {
  const cupo = obtenerDatos('cupos').find(c => c.artista === artistaId);
  const nivelMinimo = cupo ? cupo.nivelMinimo : 0;
  const fans = obtenerDatos('fans');
  const conNivel = p => {
    const autor = fans.find(f => f.id === p.autor);
    return autor && nivelPorMinutos(autor.minutosEscucha) >= nivelMinimo;
  };
  const prioridad = (a, b) => (b.votos - a.votos) || (b.autorEsFanClub - a.autorEsFanClub) || (new Date(a.fecha) - new Date(b.fecha));
  const lista = obtenerDatos('preguntas').filter(p => p.artista === artistaId);
  if (filtro === 'nuevas') return preguntasNuevas(artistaId);
  if (filtro === 'votadas') {
    return lista.filter(p => ['nueva', 'pendiente', 'seleccionada'].includes(p.estado)).filter(conNivel).sort(prioridad);
  }
  if (filtro === 'pendientes') return lista.filter(p => ['pendiente', 'seleccionada'].includes(p.estado)).sort(prioridad);
  if (filtro === 'respondidas') {
    const respuestas = obtenerDatos('respuestas');
    const fecha = p => (respuestas.find(r => r.pregunta === p.id) || p).fecha;
    return lista.filter(p => p.estado === 'respondida').sort((a, b) => new Date(fecha(b)) - new Date(fecha(a)));
  }
  return [];
}

function pantallaBandejaArtista() {
  // Sin sesión de artista, a iniciar sesión.
  const artista = artistaActual();
  if (!artista) {
    location.replace('iniciar-sesion.html');
    return;
  }
  const parametros = new URLSearchParams(location.search);
  let filtro = FILTROS_BANDEJA.some(([clave]) => clave === parametros.get('f')) ? parametros.get('f') : 'nuevas';
  // Aviso al volver de revisar una pregunta.
  if (parametros.get('aviso') === 'cola') mostrarAviso('La pregunta sigue en cola.');
  if (parametros.get('aviso') === 'descartada') mostrarAviso('Pregunta descartada.');

  const cupo = obtenerDatos('cupos').find(c => c.artista === artista.id);
  document.querySelector('[data-estado-cupo]').textContent = textoCupoArtista(cupo);

  // Punto de novedades en la pestaña si hay preguntas nuevas.
  const nuevas = preguntasNuevas(artista.id);
  if (nuevas.length) {
    const pestana = document.querySelector('[data-pestana-preguntas]');
    pestana.insertAdjacentHTML('beforeend', '<i class="navegacion__aviso" aria-hidden="true"></i>');
    pestana.setAttribute('aria-label', `Preguntas, ${nuevas.length} nuevas`);
  }

  const filtros = document.querySelector('[data-filtros]');
  const caja = document.querySelector('[data-lista-preguntas]');
  const notaFanClub = document.querySelector('[data-nota-fan-club]');

  function pintar() {
    filtros.innerHTML = FILTROS_BANDEJA.map(([clave, nombre]) => {
      const cuantas = preguntasDeBandeja(artista.id, clave).length;
      const texto = nombre + (cuantas && clave !== 'respondidas' ? ` · ${cuantas}` : '');
      return `<button type="button" class="boton boton--secundario" data-filtro="${clave}" aria-pressed="${clave === filtro}">${texto}</button>`;
    }).join('');
    const lista = preguntasDeBandeja(artista.id, filtro);
    notaFanClub.hidden = !(filtro === 'nuevas' && lista.some(p => p.autorEsFanClub));
    const [titulo, texto] = BANDEJA_VACIA[filtro];
    caja.innerHTML = lista.length
      ? lista.map(p => htmlPreguntaArtista(p)).join('')
      : `<div class="tarjeta"><h2 class="tarjeta__titulo">${titulo}</h2><p class="tarjeta__texto">${texto}</p></div>`;
  }

  filtros.addEventListener('click', evento => {
    const boton = evento.target.closest('[data-filtro]');
    if (!boton) return;
    filtro = boton.dataset.filtro;
    // El filtro queda en la dirección: al volver de revisar, sigue el mismo.
    history.replaceState(null, '', `?f=${filtro}`);
    pintar();
    filtros.querySelector(`[data-filtro="${filtro}"]`).focus();
  });
  pintar();
}

// ---------- R05 · Revisar pregunta ----------
// Cambia el estado de una pregunta del artista. REAL: en «preguntas»
// (el artista solo puede cambiar el estado de las suyas).
async function cambiarEstadoPregunta(preguntaId, estado) {
  const { data, error } = await baseDatos.from('preguntas')
    .update({ estado }).eq('id', preguntaId).select('id');
  return !error && data && data.length > 0;
}

function pantallaRevisarPreguntaArtista() {
  const artista = artistaActual();
  if (!artista) {
    location.replace('iniciar-sesion.html');
    return;
  }
  const pregunta = preguntaDelArtista(artista);
  if (!pregunta) return; // queda el mensaje del HTML
  const caja = document.querySelector('[data-revisar]');
  const enlace = encodeURIComponent(pregunta.id);
  const autor = obtenerDatos('fans').find(f => f.id === pregunta.autor);
  const cupo = obtenerDatos('cupos').find(c => c.artista === artista.id);
  const puedeResponder = cupo && cupo.estado === 'abierto' && cupo.preguntasUsadas < cupo.totalPreguntas;
  const respondida = pregunta.estado === 'respondida';

  let acciones;
  if (respondida) {
    acciones = `<a class="boton" href="respuesta-artista.html?id=${enlace}">Ver respuesta</a>`;
  } else {
    acciones = (puedeResponder
      ? '<button type="button" class="boton" data-responder>Responder</button>'
      : '<a class="boton" href="cupos-artista.html">Abrir cupo</a>')
      + (pregunta.estado !== 'pendiente' ? '<button type="button" class="boton boton--secundario" data-mantener>Mantener en cola</button>' : '')
      + (pregunta.estado !== 'descartada' ? '<button type="button" class="boton boton--terciario" data-descartar>Descartar</button>' : '');
  }

  caja.innerHTML = `
    <div class="encabezado-pagina">
      <h1 class="titulo titulo--medio">Pregunta de ${escapar(autor ? autor.nombrePerfil : 'un fan')}.</h1>
      <p class="encabezado-pagina__bajada">${escapar(textoCupoArtista(cupo))}</p>
    </div>
    ${htmlPreguntaArtista(pregunta, { accion: false })}
    ${!puedeResponder && !respondida ? `
    <div class="aviso aviso--advertencia pregunta__bloque">
      <svg class="icono" aria-hidden="true"><use href="#icono-alerta"></use></svg>
      <p><b>Tu cupo no está abierto.</b> Abre un cupo para responder. Puedes mantener la pregunta en cola mientras tanto.</p>
    </div>` : ''}
    <div class="pregunta__acciones">${acciones}</div>`;

  // Cada botón queda quieto mientras se guarda.
  function ocupado(boton, si) {
    caja.querySelectorAll('.pregunta__acciones .boton').forEach(b => { b.disabled = si; });
    if (boton) boton.setAttribute('aria-busy', String(si));
  }

  const responder = caja.querySelector('[data-responder]');
  if (responder) responder.addEventListener('click', async () => {
    ocupado(responder, true);
    // Al elegir responder, la pregunta queda «seleccionada» (el fan lo ve).
    if (pregunta.estado !== 'seleccionada' && !(await cambiarEstadoPregunta(pregunta.id, 'seleccionada'))) {
      ocupado(responder, false);
      mostrarAviso('No pudimos guardar el cambio. Revisa tu conexión e inténtalo otra vez.');
      return;
    }
    location.href = `responder-artista.html?id=${enlace}`;
  });

  const mantener = caja.querySelector('[data-mantener]');
  if (mantener) mantener.addEventListener('click', async () => {
    ocupado(mantener, true);
    if (!(await cambiarEstadoPregunta(pregunta.id, 'pendiente'))) {
      ocupado(mantener, false);
      mostrarAviso('No pudimos guardar el cambio. Revisa tu conexión e inténtalo otra vez.');
      return;
    }
    location.replace('bandeja-artista.html?f=pendientes&aviso=cola');
  });

  // Descartar: primero se confirma en el diálogo.
  const botonDescartar = caja.querySelector('[data-descartar]');
  const velo = document.querySelector('[data-velo-descartar]');
  const botonConfirmar = document.querySelector('[data-confirmar-descartar]');
  const botonCancelar = document.querySelector('[data-cancelar-descartar]');
  function cerrarDialogo() {
    velo.hidden = true;
    botonDescartar.focus();
  }
  if (botonDescartar) {
    botonDescartar.addEventListener('click', () => {
      velo.hidden = false;
      botonCancelar.focus(); // el foco empieza en la opción segura
    });
    botonCancelar.addEventListener('click', cerrarDialogo);
    velo.addEventListener('click', evento => { if (evento.target === velo) cerrarDialogo(); });
    document.addEventListener('keydown', evento => {
      if (evento.key === 'Escape' && !velo.hidden) cerrarDialogo();
    });
    botonConfirmar.addEventListener('click', async () => {
      botonConfirmar.disabled = true;
      if (!(await cambiarEstadoPregunta(pregunta.id, 'descartada'))) {
        botonConfirmar.disabled = false;
        cerrarDialogo();
        mostrarAviso('No pudimos descartar la pregunta. Revisa tu conexión e inténtalo otra vez.');
        return;
      }
      location.replace('bandeja-artista.html?aviso=descartada');
    });
  }
}

// ---------- R06 · Responder (texto o nota de voz) ----------
const MAXIMO_NOTA_VOZ = 60; // segundos (diseño: «hasta 60 segundos»)

function mensajeErrorRespuesta(error) {
  const texto = (error && error.message) || '';
  if (texto.includes('cupo-sin-respuestas')) return 'Tu cupo ya no tiene respuestas disponibles.';
  if (texto.includes('ya-respondida')) return 'Esta pregunta ya tiene respuesta.';
  if (texto.includes('sin-sesion')) return 'Tu sesión se cerró. Inicia sesión otra vez para responder.';
  return 'No pudimos enviar la respuesta. Revisa tu conexión e inténtalo otra vez.';
}

function pantallaResponderArtista() {
  const artista = artistaActual();
  if (!artista) {
    location.replace('iniciar-sesion.html');
    return;
  }
  const pregunta = preguntaDelArtista(artista);
  if (!pregunta) return; // queda el mensaje del HTML
  const enlace = encodeURIComponent(pregunta.id);
  if (pregunta.estado === 'respondida') {
    location.replace(`respuesta-artista.html?id=${enlace}`);
    return;
  }
  document.querySelector('[data-volver]').href = `revisar-pregunta-artista.html?id=${enlace}`;
  const caja = document.querySelector('[data-responder]');
  const autor = obtenerDatos('fans').find(f => f.id === pregunta.autor);
  const cupo = obtenerDatos('cupos').find(c => c.artista === artista.id);
  const quedan = cupo ? Math.max(0, cupo.totalPreguntas - cupo.preguntasUsadas) : 0;

  // Estado de la pantalla: modo (texto o voz) y, en voz, la vista
  // (permiso, grabando, revisar o error).
  let modo = 'texto';
  let vista = 'permiso';
  let borrador = '';
  let textoError = '';
  let notaAudio = null;
  const grabacion = { stream: null, recorder: null, partes: [], blob: null, url: null, inicio: 0, duracion: 0, reloj: null };

  // Suelta el micrófono y borra la nota grabada.
  function limpiarGrabacion() {
    clearInterval(grabacion.reloj);
    if (grabacion.recorder && grabacion.recorder.state !== 'inactive') {
      grabacion.recorder.onstop = null;
      grabacion.recorder.stop();
    }
    if (grabacion.stream) grabacion.stream.getTracks().forEach(pista => pista.stop());
    if (grabacion.url) URL.revokeObjectURL(grabacion.url);
    if (notaAudio) notaAudio.pause();
    Object.assign(grabacion, { stream: null, recorder: null, partes: [], blob: null, url: null, duracion: 0, reloj: null });
  }

  function htmlContenido() {
    if (modo === 'texto') {
      return `
        <form id="formulario-respuesta" novalidate>
          <div class="campo" data-campo="respuesta">
            <label class="campo__etiqueta" for="respuesta">Tu respuesta</label>
            <textarea class="area-texto" id="respuesta" name="respuesta" maxlength="500"
              placeholder="Comparte tu respuesta" aria-describedby="contador-respuesta error-respuesta">${escapar(borrador)}</textarea>
            <span class="campo__contador" id="contador-respuesta" data-contador>0/500</span>
            <p class="campo__mensaje-error" id="error-respuesta" role="alert"></p>
          </div>
        </form>
        <div class="pregunta__acciones"><button type="submit" class="boton" form="formulario-respuesta" data-enviar>Enviar respuesta</button></div>`;
    }
    if (vista === 'grabando') {
      return `
        <section class="tarjeta">
          <h2 class="tarjeta__titulo">Grabando</h2>
          <p class="titulo" data-cronometro aria-live="off">0:00</p>
          <div class="progreso" role="progressbar" aria-label="Tiempo de la nota" aria-valuemin="0" aria-valuemax="${MAXIMO_NOTA_VOZ}" aria-valuenow="0"><span class="progreso__barra" style="width: 0%"></span></div>
          <div class="tarjeta__acciones"><button type="button" class="boton boton--bloque" data-detener>Detener grabación</button></div>
        </section>`;
    }
    if (vista === 'revisar') {
      return `
        <section class="tarjeta">
          <h2 class="tarjeta__titulo">Escucha tu nota.</h2>
          <p class="tarjeta__texto">Revísala antes de enviarla.</p>
          ${htmlNotaDeVoz(grabacion.duracion)}
          <div class="tarjeta__acciones pregunta__acciones">
            <button type="button" class="boton" data-enviar-voz>Enviar nota de voz</button>
            <button type="button" class="boton boton--terciario" data-grabar-de-nuevo>Grabar de nuevo</button>
          </div>
        </section>`;
    }
    if (vista === 'error') {
      return `
        <section class="tarjeta">
          <h2 class="tarjeta__titulo">No pudimos grabar.</h2>
          <p class="tarjeta__texto">${escapar(textoError)}</p>
          <div class="tarjeta__acciones pregunta__acciones">
            <button type="button" class="boton" data-a-texto>Responder con texto</button>
            <button type="button" class="boton boton--terciario" data-grabar>Intentar de nuevo</button>
          </div>
        </section>`;
    }
    return `
      <section class="tarjeta">
        <h2 class="tarjeta__titulo">Tu voz también conecta.</h2>
        <p class="tarjeta__texto">Necesitamos acceder al micrófono cuando empieces a grabar. La nota puede durar hasta ${MAXIMO_NOTA_VOZ} segundos.</p>
        <div class="tarjeta__acciones">
          <button type="button" class="boton boton--bloque" data-grabar>
            <svg class="icono" aria-hidden="true"><use href="#icono-microfono"></use></svg>
            <span>Grabar nota</span>
          </button>
        </div>
      </section>`;
  }

  function pintar() {
    if (notaAudio) notaAudio.pause();
    notaAudio = null;
    caja.innerHTML = `
      <p class="texto--pequeno texto--suave">${escapar(autor ? autor.nombrePerfil : 'Un fan')} preguntó:</p>
      <h1 class="titulo titulo--pequeno responder__pregunta">${escapar(pregunta.texto)}</h1>
      <div class="selector pregunta__bloque" role="group" aria-label="Tipo de respuesta">
        <button type="button" class="boton boton--secundario" data-modo="texto" aria-pressed="${modo === 'texto'}">Texto</button>
        <button type="button" class="boton boton--secundario" data-modo="voz" aria-pressed="${modo === 'voz'}">Nota de voz</button>
      </div>
      <div class="pregunta__bloque">${htmlContenido()}</div>
      <p class="texto--pequeno texto--suave pregunta__bloque">Te quedan ${quedan} de ${cupo ? cupo.totalPreguntas : 0} respuestas en este cupo. Enviar consume una.</p>`;

    const area = caja.querySelector('#respuesta');
    if (area) {
      activarContador(area, caja.querySelector('[data-contador]'));
      area.addEventListener('input', () => { borrador = area.value; mostrarError('respuesta', ''); });
      caja.querySelector('#formulario-respuesta').addEventListener('submit', evento => {
        evento.preventDefault();
        if (!area.value.trim()) {
          mostrarError('respuesta', 'Escribe tu respuesta.');
          area.focus();
          return;
        }
        enviar('texto', caja.querySelector('[data-enviar]'));
      });
    }
    if (vista === 'revisar' && modo === 'voz') notaAudio = activarNotaDeVoz(caja, grabacion.url, grabacion.duracion);
  }

  // Avanza el cronómetro mientras graba; a los 60 s se detiene sola.
  function avanzarReloj() {
    const segundos = (Date.now() - grabacion.inicio) / 1000;
    const cronometro = caja.querySelector('[data-cronometro]');
    const barra = caja.querySelector('.progreso__barra');
    if (cronometro) cronometro.textContent = formatoDuracion(Math.floor(segundos));
    if (barra) {
      barra.style.width = `${Math.min(100, (segundos / MAXIMO_NOTA_VOZ) * 100)}%`;
      barra.parentElement.setAttribute('aria-valuenow', String(Math.floor(segundos)));
    }
    if (segundos >= MAXIMO_NOTA_VOZ) detener();
  }

  // REAL: graba con el micrófono del dispositivo.
  async function grabar() {
    limpiarGrabacion();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      vista = 'error';
      textoError = 'Este navegador no permite grabar audio. Responde con texto o prueba con otro navegador.';
      pintar();
      return;
    }
    try {
      grabacion.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      vista = 'error';
      textoError = 'Revisa el permiso del micrófono o elige una respuesta de texto.';
      pintar();
      return;
    }
    if (reproductor.audio && !reproductor.audio.paused) reproductor.audio.pause();
    const tipos = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'];
    const tipo = tipos.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
    const recorder = new MediaRecorder(grabacion.stream, tipo ? { mimeType: tipo } : undefined);
    grabacion.recorder = recorder;
    grabacion.partes = [];
    recorder.ondataavailable = evento => { if (evento.data.size) grabacion.partes.push(evento.data); };
    recorder.onstop = () => {
      clearInterval(grabacion.reloj);
      grabacion.duracion = (Date.now() - grabacion.inicio) / 1000;
      grabacion.blob = new Blob(grabacion.partes, { type: recorder.mimeType || tipo || 'audio/webm' });
      grabacion.url = URL.createObjectURL(grabacion.blob);
      if (grabacion.stream) grabacion.stream.getTracks().forEach(pista => pista.stop());
      grabacion.stream = null;
      grabacion.recorder = null;
      if (grabacion.duracion < 1) {
        vista = 'permiso';
        mostrarAviso('La nota fue muy corta. Inténtalo de nuevo.');
      } else {
        vista = 'revisar';
      }
      pintar();
      const siguiente = caja.querySelector('[data-enviar-voz], [data-grabar]');
      if (siguiente) siguiente.focus();
    };
    grabacion.inicio = Date.now();
    recorder.start(250);
    vista = 'grabando';
    pintar();
    caja.querySelector('[data-detener]').focus();
    grabacion.reloj = setInterval(avanzarReloj, 250);
  }

  function detener() {
    clearInterval(grabacion.reloj);
    if (grabacion.recorder && grabacion.recorder.state !== 'inactive') grabacion.recorder.stop();
  }

  // REAL: la nota de voz se sube a «notas-voz» y la respuesta se guarda con
  // responder_pregunta() (respuesta, estado, cupo y notificación al fan juntos).
  async function enviar(tipo, boton) {
    const textoBoton = boton.textContent;
    boton.disabled = true;
    boton.textContent = 'Enviando…';
    let audio = null;
    try {
      if (tipo === 'voz') {
        const usuarioId = await idDeLaCuenta();
        if (!usuarioId) throw new Error('sin-sesion');
        const clase = grabacion.blob.type.split(';')[0] || 'audio/webm';
        const extension = clase.includes('mp4') ? 'm4a' : clase.includes('ogg') ? 'ogg' : 'webm';
        audio = await subirArchivo('notas-voz', usuarioId, `nota-${Date.now()}.${extension}`, grabacion.blob, clase);
      }
      const { error } = await baseDatos.rpc('responder_pregunta', {
        pregunta_id: pregunta.id,
        tipo_respuesta: tipo,
        texto_respuesta: tipo === 'texto' ? borrador.trim() : null,
        audio_respuesta: audio,
        duracion: tipo === 'voz' ? Math.round(grabacion.duracion) : null
      });
      if (error) throw error;
      limpiarGrabacion();
      location.replace(`respuesta-enviada-artista.html?id=${enlace}`);
    } catch (e) {
      if (audio) borrarArchivoSubido(audio).catch(() => {}); // no deja el audio suelto
      boton.disabled = false;
      boton.textContent = textoBoton;
      mostrarAviso(mensajeErrorRespuesta(e));
    }
  }

  caja.addEventListener('click', evento => {
    const boton = evento.target.closest('button');
    if (!boton) return;
    if (boton.matches('[data-modo]')) {
      if (boton.dataset.modo === modo) return;
      if (vista === 'grabando') { limpiarGrabacion(); vista = 'permiso'; }
      modo = boton.dataset.modo;
      pintar();
      caja.querySelector(`[data-modo="${modo}"]`).focus();
    } else if (boton.matches('[data-grabar]')) {
      grabar();
    } else if (boton.matches('[data-detener]')) {
      detener();
    } else if (boton.matches('[data-grabar-de-nuevo]')) {
      limpiarGrabacion();
      vista = 'permiso';
      pintar();
      caja.querySelector('[data-grabar]').focus();
    } else if (boton.matches('[data-a-texto]')) {
      modo = 'texto';
      pintar();
      caja.querySelector('#respuesta').focus();
    } else if (boton.matches('[data-enviar-voz]')) {
      enviar('voz', boton);
    }
  });
  // Al salir de la pantalla se suelta el micrófono.
  window.addEventListener('pagehide', limpiarGrabacion);
  pintar();
}

// ---------- R06f · Respuesta enviada ----------
function pantallaRespuestaEnviadaArtista() {
  const artista = artistaActual();
  if (!artista) {
    location.replace('iniciar-sesion.html');
    return;
  }
  const pregunta = preguntaDelArtista(artista);
  if (!pregunta || pregunta.estado !== 'respondida') return; // queda el mensaje del HTML
  const cupo = obtenerDatos('cupos').find(c => c.artista === artista.id);
  const quedan = cupo ? Math.max(0, cupo.totalPreguntas - cupo.preguntasUsadas) : 0;
  const nota = cupo && cupo.estado === 'completo'
    ? 'Completaste tu cupo. Puedes abrir uno nuevo cuando tengas disponibilidad.'
    : `Te quedan ${quedan} ${quedan === 1 ? 'respuesta' : 'respuestas'} en este cupo.`;
  document.querySelector('[data-respuesta-enviada]').innerHTML = `
    <div class="encabezado-pagina">
      <h1 class="titulo titulo--medio">La conversación continúa.</h1>
      <p class="encabezado-pagina__bajada">Tu respuesta llegó al fan y su pregunta quedó respondida.</p>
    </div>
    ${htmlPreguntaArtista(pregunta, { etiqueta: '<span class="etiqueta etiqueta--reconocimiento">Respondida</span>' })}
    <p class="texto--pequeno texto--suave pregunta__bloque">${nota}</p>
    <div class="pregunta__acciones"><a class="boton" href="bandeja-artista.html?f=respondidas">Volver a preguntas</a></div>`;
}

// ---------- R06 preview · Respuesta del artista (como la verá el fan) ----------
function pantallaRespuestaArtista() {
  const artista = artistaActual();
  if (!artista) {
    location.replace('iniciar-sesion.html');
    return;
  }
  const pregunta = preguntaDelArtista(artista);
  const respuesta = pregunta && obtenerDatos('respuestas').find(r => r.pregunta === pregunta.id);
  if (!respuesta) return; // queda el mensaje del HTML
  const caja = document.querySelector('[data-respuesta-artista]');
  caja.innerHTML = `
    ${htmlPreguntaArtista(pregunta, { accion: false })}
    <div class="pregunta__bloque">${htmlRespuesta(respuesta, 'Tu respuesta', { etiquetaTitulo: 'h1' })}</div>
    <div class="pregunta__acciones"><a class="boton boton--terciario" href="bandeja-artista.html?f=respondidas">Volver a preguntas</a></div>`;
  if (respuesta.tipo === 'voz') activarNotaDeVoz(caja, rutaRecurso(respuesta.audio), respuesta.duracionAudio);
}

// ---------- F06 · Tu conexión: estado y respuesta ----------
function pantallaTuConexionFan() {
  const fan = fanActual();
  if (!fan) {
    location.replace('iniciar-sesion.html');
    return;
  }
  const parametros = new URLSearchParams(location.search);
  const pregunta = obtenerDatos('preguntas').find(p => p.id === parametros.get('id'));
  const artista = pregunta && obtenerDatos('artistas').find(a => a.id === pregunta.artista);
  if (!artista) return; // queda el mensaje del HTML
  const mia = pregunta.autor === fan.id;
  const nombre = escapar(artista.nombreArtistico);
  const alArtista = `perfil-artista-fan.html?id=${encodeURIComponent(artista.id)}`;
  document.querySelector('[data-volver]').href = alArtista;
  document.querySelector('.barra-superior__titulo').textContent = mia ? 'Tu conexión' : 'Conversación';
  document.title = `Looped · ${mia ? 'Tu conexión' : 'Conversación'}`;
  if (parametros.get('enviada')) mostrarAviso('Pregunta enviada. Está en cola.');

  const autor = obtenerDatos('fans').find(f => f.id === pregunta.autor);
  const respuesta = obtenerDatos('respuestas').find(r => r.pregunta === pregunta.id);
  let estado;
  if (pregunta.estado === 'respondida' && respuesta) {
    estado = htmlRespuesta(respuesta, `La respuesta de ${artista.nombreArtistico}`)
      + (mia ? '<div class="etiquetas pregunta__bloque"><span class="etiqueta etiqueta--reconocimiento">Te escucharon</span></div>' : '');
  } else if (pregunta.estado === 'seleccionada') {
    estado = `<section class="tarjeta"><h2 class="tarjeta__titulo">Esperando respuesta</h2><p class="tarjeta__texto">${nombre} seleccionó tu pregunta y todavía no ha enviado su respuesta.</p></section>`;
  } else if (pregunta.estado === 'descartada') {
    estado = '<section class="tarjeta"><h2 class="tarjeta__titulo">No seleccionada</h2><p class="tarjeta__texto">El artista no eligió esta pregunta en este cupo. Puedes participar de nuevo cuando haya espacio.</p></section>';
  } else {
    estado = '<section class="tarjeta"><h2 class="tarjeta__titulo">Pregunta enviada</h2><p class="tarjeta__texto">Tu pregunta está en cola. El artista decidirá cuáles responder.</p></section>';
  }

  const caja = document.querySelector('[data-tu-conexion]');
  caja.innerHTML = `
    <div class="encabezado-pagina">
      <h1 class="titulo titulo--medio">${mia ? 'Tu pregunta' : `Pregunta de ${escapar(autor ? autor.nombrePerfil : 'un fan')}`} a ${nombre}.</h1>
    </div>
    <article class="tarjeta">
      <div class="tarjeta__encabezado">
        <span class="tarjeta__meta">${mia ? 'Tú' : escapar(autor ? autor.nombrePerfil : 'Fan')}</span>
        ${pregunta.votos ? htmlVotos(pregunta.votos) : ''}
      </div>
      <p class="tarjeta__texto tarjeta__texto--principal">${escapar(pregunta.texto)}</p>
      <p class="tarjeta__texto">${escapar(textoEstadoPregunta(pregunta, artista))}</p>
    </article>
    <div class="pregunta__bloque">${estado}</div>
    <div class="pregunta__acciones">
      <a class="boton ${pregunta.estado === 'respondida' ? 'boton--terciario' : ''}" href="${alArtista}">Volver al artista</a>
    </div>`;
  if (respuesta && respuesta.tipo === 'voz') activarNotaDeVoz(caja, rutaRecurso(respuesta.audio), respuesta.duracionAudio);
}

// ---------- Comunidad: piezas compartidas ----------
// Foto pequeña del artista (o sus iniciales).
function htmlAvatarArtista(artista) {
  return artista.foto
    ? `<span class="avatar avatar--pequeno"><img src="${escapar(rutaRecurso(artista.foto))}" alt=""></span>`
    : `<span class="avatar avatar--pequeno avatar--acento" aria-hidden="true">${escapar(iniciales(artista.nombreArtistico))}</span>`;
}

// Botón «Escuchar lanzamiento» de una publicación (si incluye uno que existe).
function htmlEscucharPublicacion(publicacion) {
  const lanzamiento = publicacion.lanzamiento && obtenerDatos('lanzamientos').find(l => l.id === publicacion.lanzamiento);
  if (!lanzamiento) return '';
  return `
    <div class="tarjeta__acciones">
      <button type="button" class="boton boton--secundario" data-reproducir="${escapar(lanzamiento.id)}" data-titulo="${escapar(lanzamiento.nombreCancion)}">
        <svg class="icono" aria-hidden="true"><use href="#icono-reproducir"></use></svg>
        <span data-texto-reproducir="Escuchar lanzamiento">Escuchar lanzamiento</span>
      </button>
    </div>`;
}

// Fecha de la respuesta de una pregunta (para ordenar las conversaciones).
function fechaDeRespuesta(pregunta) {
  const respuesta = obtenerDatos('respuestas').find(r => r.pregunta === pregunta.id);
  return respuesta ? respuesta.fecha : pregunta.fecha;
}

// ---------- F04 · Comunidad (fan) ----------
// Con ?id= muestra la comunidad de un artista; sin él, la de todos
// (primero los artistas que el fan sigue). Las publicaciones «Solo para
// el Fan Club» no salen aquí: son el contenido del Fan Club.
function pantallaComunidadFan() {
  const fan = fanActual();
  if (!fan) {
    location.replace('iniciar-sesion.html');
    return;
  }
  const id = new URLSearchParams(location.search).get('id');
  const artistas = obtenerDatos('artistas');
  const delArtista = id ? artistas.find(a => a.id === id) : null;
  const caja = document.querySelector('[data-comunidad]');
  if (id && !delArtista) return; // queda el mensaje del HTML
  if (delArtista) {
    document.querySelector('[data-volver]').href = `perfil-artista-fan.html?id=${encodeURIComponent(id)}`;
    document.title = `Looped · Comunidad de ${delArtista.nombreArtistico}`;
  }

  const sigue = artistaId => fan.artistasQueSigue.includes(artistaId);
  const publicaciones = obtenerDatos('publicaciones')
    .filter(p => !p.soloFanClub && (!id || p.artista === id))
    .sort((a, b) => (id ? 0 : sigue(b.artista) - sigue(a.artista)) || (new Date(b.fecha) - new Date(a.fecha)));
  const conversaciones = obtenerDatos('preguntas')
    .filter(p => p.estado === 'respondida' && (!id || p.artista === id))
    .sort((a, b) => new Date(fechaDeRespuesta(b)) - new Date(fechaDeRespuesta(a)))
    .slice(0, 6);
  // «Preguntar a…»: el artista de esta comunidad o, en la general, uno que
  // siga con el cupo abierto (si no, cualquiera con el cupo abierto).
  const cupoAbierto = artistaId => {
    const cupo = obtenerDatos('cupos').find(c => c.artista === artistaId);
    return cupo && cupo.estado === 'abierto';
  };
  const destino = delArtista
    || artistas.find(a => sigue(a.id) && cupoAbierto(a.id))
    || artistas.find(a => cupoAbierto(a.id));
  const fans = obtenerDatos('fans');
  const respuestas = obtenerDatos('respuestas');

  const tarjetaPublicacion = publicacion => {
    const artista = artistas.find(a => a.id === publicacion.artista);
    if (!artista) return '';
    return `
      <article class="tarjeta">
        <a class="tarjeta__cabecera comunidad__autor" href="perfil-artista-fan.html?id=${encodeURIComponent(artista.id)}" aria-label="Ver perfil de ${escapar(artista.nombreArtistico)}">
          ${htmlAvatarArtista(artista)}
          <span><b class="texto--pequeno">${escapar(artista.nombreArtistico)}</b><span class="tarjeta__meta">${escapar(haceCuanto(publicacion.fecha))}</span></span>
        </a>
        <p class="tarjeta__texto tarjeta__texto--principal">${escapar(publicacion.texto)}</p>
        ${htmlEscucharPublicacion(publicacion)}
      </article>`;
  };
  const tarjetaConversacion = pregunta => {
    const artista = artistas.find(a => a.id === pregunta.artista);
    const autor = fans.find(f => f.id === pregunta.autor);
    const respuesta = respuestas.find(r => r.pregunta === pregunta.id);
    const quien = pregunta.autor === fan.id ? 'Tú' : (autor ? autor.nombrePerfil : 'Fan');
    return `
      <article class="tarjeta">
        <div class="tarjeta__encabezado">
          <span class="tarjeta__meta">${escapar(quien)} → ${escapar(artista ? artista.nombreArtistico : '')}</span>
          ${respuesta && respuesta.tipo === 'voz' ? '<span class="etiqueta etiqueta--borde">Nota de voz</span>' : ''}
        </div>
        <p class="tarjeta__texto tarjeta__texto--principal">${escapar(pregunta.texto)}</p>
        <p class="tarjeta__texto">La respuesta está disponible.</p>
        <div class="tarjeta__acciones"><a class="boton boton--secundario" href="tu-conexion-fan.html?id=${encodeURIComponent(pregunta.id)}">Ver respuesta</a></div>
      </article>`;
  };

  caja.innerHTML = `
    <div class="encabezado-pagina">
      <h1 class="titulo titulo--medio">${delArtista ? `Comunidad de ${escapar(delArtista.nombreArtistico)}` : 'Comunidad'}</h1>
      <p class="encabezado-pagina__bajada">Publicaciones de artistas y respuestas que comparten con sus fans.</p>
    </div>
    ${publicaciones.length
      ? `<div class="rejilla-tarjetas rejilla-tarjetas--dos">${publicaciones.map(tarjetaPublicacion).join('')}</div>`
      : '<div class="tarjeta"><p class="tarjeta__texto">Todavía no hay publicaciones.</p></div>'}
    <section class="comunidad__seccion" aria-labelledby="titulo-conversaciones">
      <div class="encabezado-seccion"><h2 class="encabezado-seccion__titulo" id="titulo-conversaciones">Conversaciones</h2></div>
      ${conversaciones.length
        ? `<div class="rejilla-tarjetas rejilla-tarjetas--dos">${conversaciones.map(tarjetaConversacion).join('')}</div>`
        : '<div class="tarjeta"><p class="tarjeta__texto">Cuando un artista responda, la conversación aparecerá aquí.</p></div>'}
    </section>
    ${destino ? `<div class="pregunta__acciones"><a class="boton" href="conectar-fan.html?id=${encodeURIComponent(destino.id)}">Preguntar a ${escapar(destino.nombreArtistico)}</a></div>` : ''}`;
  activarBotonesReproducir(caja);
}

// ---------- R07 · Comunidad del artista ----------
function pantallaComunidadArtista() {
  const artista = artistaActual();
  if (!artista) {
    location.replace('iniciar-sesion.html');
    return;
  }
  const caja = document.querySelector('[data-publicaciones]');
  if (new URLSearchParams(location.search).get('aviso') === 'publicada') mostrarAviso('Publicación compartida.');
  const respondidas = obtenerDatos('preguntas').filter(p => p.artista === artista.id && p.estado === 'respondida').length;
  document.querySelector('[data-resumen-comunidad]').textContent =
    `${artista.seguidores.toLocaleString('es-CO')} seguidores · ${respondidas} ${respondidas === 1 ? 'respuesta compartida' : 'respuestas compartidas'}`;

  function pintar() {
    const publicaciones = obtenerDatos('publicaciones')
      .filter(p => p.artista === artista.id)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const lanzamientos = obtenerDatos('lanzamientos');
    caja.innerHTML = publicaciones.length ? publicaciones.map(publicacion => {
      const lanzamiento = publicacion.lanzamiento && lanzamientos.find(l => l.id === publicacion.lanzamiento);
      const etiquetas = [
        publicacion.soloFanClub ? '<span class="etiqueta etiqueta--acento">Fan Club</span>' : '',
        lanzamiento ? `<span class="etiqueta etiqueta--borde">Incluye ${escapar(lanzamiento.nombreLanzamiento)}</span>` : ''
      ].join('');
      return `
        <article class="tarjeta">
          <div class="tarjeta__encabezado">
            <div class="tarjeta__cabecera">
              ${htmlAvatarArtista(artista)}
              <span><b class="texto--pequeno">${escapar(artista.nombreArtistico)}</b><span class="tarjeta__meta">${escapar(haceCuanto(publicacion.fecha))}</span></span>
            </div>
            <button type="button" class="boton-icono boton-icono--pequeno" data-eliminar-publicacion="${escapar(publicacion.id)}" aria-label="Eliminar publicación">
              <svg class="icono icono--pequeno" aria-hidden="true"><use href="#icono-eliminar"></use></svg>
            </button>
          </div>
          <p class="tarjeta__texto tarjeta__texto--principal">${escapar(publicacion.texto)}</p>
          ${etiquetas ? `<div class="etiquetas">${etiquetas}</div>` : ''}
        </article>`;
    }).join('') : '<div class="tarjeta"><p class="tarjeta__texto">Todavía no has publicado. Cuéntales a tus fans en qué estás trabajando.</p></div>';
  }

  // Eliminar: primero se confirma en el diálogo.
  const velo = document.querySelector('[data-velo-eliminar]');
  const botonConfirmar = document.querySelector('[data-confirmar-eliminar]');
  const botonCancelar = document.querySelector('[data-cancelar-eliminar]');
  let porEliminar = null; // id de la publicación elegida
  function cerrarDialogo() {
    velo.hidden = true;
    const boton = porEliminar && caja.querySelector(`[data-eliminar-publicacion="${CSS.escape(porEliminar)}"]`);
    if (boton) boton.focus();
  }
  caja.addEventListener('click', evento => {
    const boton = evento.target.closest('[data-eliminar-publicacion]');
    if (!boton) return;
    porEliminar = boton.dataset.eliminarPublicacion;
    velo.hidden = false;
    botonCancelar.focus(); // el foco empieza en la opción segura
  });
  botonCancelar.addEventListener('click', cerrarDialogo);
  velo.addEventListener('click', evento => { if (evento.target === velo) cerrarDialogo(); });
  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && !velo.hidden) cerrarDialogo();
  });
  // REAL: borra la publicación de Supabase.
  botonConfirmar.addEventListener('click', async () => {
    botonConfirmar.disabled = true;
    const { data, error } = await baseDatos.from('publicaciones').delete().eq('id', porEliminar).select('id');
    botonConfirmar.disabled = false;
    velo.hidden = true;
    if (error || !data || !data.length) {
      mostrarAviso('No pudimos eliminar la publicación. Revisa tu conexión e inténtalo otra vez.');
      return;
    }
    datosCargados.publicaciones = obtenerDatos('publicaciones').filter(p => p.id !== porEliminar);
    porEliminar = null;
    pintar();
    mostrarAviso('Publicación eliminada.');
    document.querySelector('[data-nueva-publicacion]').focus();
  });

  pintar();
}

// ---------- Nueva publicación ----------
function pantallaNuevaPublicacionArtista() {
  const artista = artistaActual();
  if (!artista) {
    location.replace('iniciar-sesion.html');
    return;
  }
  // Lanzamiento relacionado: el que viene de «Compartir en tu comunidad»
  // (marcado) o, si no, el último del artista (sin marcar), como en el diseño.
  const pedido = new URLSearchParams(location.search).get('lanzamiento');
  const propios = obtenerDatos('lanzamientos').filter(l => l.artista === artista.id)
    .sort((a, b) => new Date(b.fechaPublicacion) - new Date(a.fechaPublicacion));
  const lanzamiento = propios.find(l => l.id === pedido) || propios[0] || null;
  const casillaLanzamiento = document.querySelector('[data-casilla-lanzamiento]');
  if (!lanzamiento) {
    casillaLanzamiento.remove(); // sin lanzamientos no hay nada que incluir
  } else {
    document.querySelector('[data-nombre-lanzamiento]').textContent = `Incluir ${lanzamiento.nombreLanzamiento}`;
    document.getElementById('incluir-lanzamiento').checked = Boolean(pedido && lanzamiento.id === pedido);
  }
  if (pedido && lanzamiento && lanzamiento.id === pedido) {
    document.querySelector('[data-volver]').href = `lanzamiento-artista.html?id=${encodeURIComponent(pedido)}`;
  }

  const formulario = document.getElementById('formulario-publicacion');
  const texto = document.getElementById('publicacion');
  const boton = document.querySelector('button[form="formulario-publicacion"]');
  activarContador(texto, document.querySelector('[data-contador]'));
  texto.addEventListener('input', () => mostrarError('publicacion', ''));

  formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (boton.disabled) return;
    const contenido = texto.value.trim();
    if (!contenido) {
      mostrarError('publicacion', 'Escribe tu publicación.');
      texto.focus();
      return;
    }
    // REAL: se guarda en «publicaciones». Con «Solo para el Fan Club», solo
    // la ven los miembros del Fan Club (regla de la base de datos).
    boton.disabled = true;
    boton.textContent = 'Publicando…';
    const incluir = lanzamiento && document.getElementById('incluir-lanzamiento').checked;
    const { error } = await baseDatos.from('publicaciones').insert({
      artista: artista.id,
      texto: contenido,
      lanzamiento: incluir ? lanzamiento.id : null,
      solo_fan_club: document.getElementById('solo-fan-club').checked
    });
    if (error) {
      boton.disabled = false;
      boton.textContent = 'Publicar';
      mostrarAviso('No pudimos publicar. Revisa tu conexión e inténtalo otra vez.');
      return;
    }
    location.replace('comunidad-artista.html?aviso=publicada');
  });
}

// ---------- R08 · Cupos ----------
// Una fila de dato y valor dentro de una tarjeta («Respuestas: 5»).
function htmlDato(nombre, valor) {
  return `<div class="tarjeta__encabezado"><span class="texto--pequeno texto--suave">${escapar(nombre)}</span><b class="texto--pequeno">${escapar(valor)}</b></div>`;
}

function pantallaCuposArtista() {
  const artista = artistaActual();
  if (!artista) {
    location.replace('iniciar-sesion.html');
    return;
  }
  const caja = document.querySelector('[data-cupos]');
  if (new URLSearchParams(location.search).get('aviso') === 'guardado') mostrarAviso('Cupo listo. Ábrelo cuando quieras.');

  function pintar() {
    const cupo = obtenerDatos('cupos').find(c => c.artista === artista.id);
    // Un artista nuevo todavía no tiene cupo: primero lo configura.
    if (!cupo) {
      caja.innerHTML = `
        <div class="encabezado-pagina">
          <h1 class="titulo titulo--medio">Un espacio para tu comunidad.</h1>
          <p class="encabezado-pagina__bajada">Decide cuántas respuestas das y quién puede preguntarte.</p>
        </div>
        <section class="tarjeta"><h2 class="tarjeta__titulo">Todavía no tienes cupo</h2><p class="tarjeta__texto">Configúralo para que tus fans puedan enviarte preguntas.</p></section>
        <div class="pregunta__acciones"><a class="boton" href="configurar-cupo-artista.html">Configurar cupo</a></div>`;
      return;
    }
    const total = cupo.totalPreguntas;
    const usadas = cupo.preguntasUsadas;
    if (cupo.estado === 'abierto') {
      const porcentaje = Math.min(100, (usadas / total) * 100);
      caja.innerHTML = `
        <div class="encabezado-pagina">
          <h1 class="titulo titulo--medio">Un espacio para tu comunidad.</h1>
          <p class="encabezado-pagina__bajada">Recibe preguntas y votos dentro de tu disponibilidad.</p>
        </div>
        <div class="rejilla-tarjetas rejilla-tarjetas--dos">
          <section class="tarjeta">
            <div class="tarjeta__encabezado"><h2 class="tarjeta__titulo">Cupo abierto</h2><span class="etiqueta etiqueta--acento">${usadas} de ${total}</span></div>
            <p class="rotulo rotulo--pequeno texto--suave cupos__rotulo">Respuestas disponibles</p>
            <p class="titulo">${Math.max(0, total - usadas)}</p>
            <div class="progreso" role="progressbar" aria-label="Respuestas usadas" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${usadas}"><span class="progreso__barra" style="width: ${porcentaje.toFixed(1)}%"></span></div>
            <p class="tarjeta__texto">Has respondido ${usadas} de ${total}. Las preguntas en cola no consumen tu cupo.</p>
          </section>
          <section class="tarjeta">
            <h2 class="tarjeta__titulo">Tu disponibilidad</h2>
            ${htmlDato('Respuestas', String(total))}
            ${htmlDato('Condición', textoNivelMinimo(cupo.nivelMinimo))}
            ${cupo.fechaApertura ? htmlDato('Abierto', haceCuanto(cupo.fechaApertura)) : ''}
          </section>
        </div>
        <div class="pregunta__acciones">
          <a class="boton" href="bandeja-artista.html">Ver preguntas</a>
          <button type="button" class="boton boton--terciario" data-cerrar-cupo>Cerrar cupo</button>
        </div>`;
    } else if (cupo.estado === 'completo') {
      caja.innerHTML = `
        <div class="encabezado-pagina">
          <h1 class="titulo titulo--medio">Este espacio ya se completó.</h1>
          <p class="encabezado-pagina__bajada">Puedes volver a abrir uno cuando tengas disponibilidad.</p>
        </div>
        <section class="tarjeta"><h2 class="tarjeta__titulo">Cupo completo</h2><p class="tarjeta__texto">Respondiste ${usadas} de ${total}. Las preguntas que quedaron en cola siguen en tu bandeja.</p></section>
        <div class="pregunta__acciones"><a class="boton" href="configurar-cupo-artista.html">Abrir nuevo cupo</a></div>`;
    } else {
      caja.innerHTML = `
        <p class="rotulo texto--suave cupos__rotulo">Respuestas que podrás dar</p>
        <p class="titulo">${total}</p>
        <p class="texto">${escapar(textoNivelMinimo(cupo.nivelMinimo))}</p>
        <div class="encabezado-pagina cupos__encabezado">
          <h1 class="titulo titulo--medio">Todo listo para conectar.</h1>
          <p class="encabezado-pagina__bajada">Tu disponibilidad está configurada.</p>
        </div>
        <section class="tarjeta"><h2 class="tarjeta__titulo">Cupo cerrado</h2><p class="tarjeta__texto">Tu configuración está lista para abrir un nuevo cupo.</p></section>
        <div class="pregunta__acciones">
          <button type="button" class="boton" data-abrir-cupo>Abrir cupo</button>
          <a class="boton boton--terciario" href="configurar-cupo-artista.html">Editar cupo</a>
        </div>`;
    }
  }

  // REAL: cambia el cupo en Supabase y lo anota en los datos cargados.
  async function guardarCupo(cambios) {
    const { data, error } = await baseDatos.from('cupos')
      .update(cambios).eq('artista', artista.id).select().single();
    if (error || !data) return false;
    Object.assign(obtenerDatos('cupos').find(c => c.artista === artista.id), {
      estado: data.estado,
      preguntasUsadas: data.preguntas_usadas,
      fechaApertura: data.fecha_apertura
    });
    return true;
  }

  // Abrir: empieza de cero y desde ahora.
  caja.addEventListener('click', async evento => {
    const abrir = evento.target.closest('[data-abrir-cupo]');
    if (!abrir || abrir.disabled) return;
    abrir.disabled = true;
    const listo = await guardarCupo({ estado: 'abierto', preguntas_usadas: 0, fecha_apertura: new Date().toISOString() });
    if (!listo) {
      abrir.disabled = false;
      mostrarAviso('No pudimos abrir el cupo. Revisa tu conexión e inténtalo otra vez.');
      return;
    }
    pintar();
    mostrarAviso('Cupo abierto. Tus fans ya pueden participar.');
    caja.querySelector('[data-cerrar-cupo]').focus();
  });

  // Cerrar: primero se confirma en el diálogo.
  const velo = document.querySelector('[data-velo-cerrar]');
  const botonConfirmar = document.querySelector('[data-confirmar-cerrar]');
  const botonCancelar = document.querySelector('[data-cancelar-cerrar]');
  function cerrarDialogo() {
    velo.hidden = true;
    const boton = caja.querySelector('[data-cerrar-cupo]');
    if (boton) boton.focus();
  }
  caja.addEventListener('click', evento => {
    if (!evento.target.closest('[data-cerrar-cupo]')) return;
    velo.hidden = false;
    botonCancelar.focus(); // el foco empieza en la opción segura
  });
  botonCancelar.addEventListener('click', cerrarDialogo);
  velo.addEventListener('click', evento => { if (evento.target === velo) cerrarDialogo(); });
  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && !velo.hidden) cerrarDialogo();
  });
  botonConfirmar.addEventListener('click', async () => {
    botonConfirmar.disabled = true;
    const listo = await guardarCupo({ estado: 'cerrado' });
    botonConfirmar.disabled = false;
    velo.hidden = true;
    if (!listo) {
      mostrarAviso('No pudimos cerrar el cupo. Revisa tu conexión e inténtalo otra vez.');
      return;
    }
    pintar();
    mostrarAviso('Cupo cerrado. Las preguntas en cola se conservan.');
    caja.querySelector('[data-abrir-cupo]').focus();
  });

  pintar();
}

// ---------- Configurar cupo ----------
function pantallaConfigurarCupoArtista() {
  const artista = artistaActual();
  if (!artista) {
    location.replace('iniciar-sesion.html');
    return;
  }
  const cupo = obtenerDatos('cupos').find(c => c.artista === artista.id);
  // Un cupo abierto no se configura: primero se cierra.
  if (cupo && cupo.estado === 'abierto') {
    location.replace('cupos-artista.html');
    return;
  }

  const formulario = document.getElementById('formulario-cupo');
  const respuestas = document.getElementById('respuestas');
  const niveles = document.querySelector('[data-niveles]');
  const boton = document.querySelector('button[form="formulario-cupo"]');
  let nivel = cupo ? Math.min(3, cupo.nivelMinimo) : 1;
  respuestas.value = cupo ? cupo.totalPreguntas : 5;

  function pintarNivel() {
    niveles.querySelectorAll('[data-nivel]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.nivel) === nivel)));
  }
  niveles.addEventListener('click', evento => {
    const elegido = evento.target.closest('[data-nivel]');
    if (!elegido) return;
    nivel = Number(elegido.dataset.nivel);
    pintarNivel();
  });
  respuestas.addEventListener('input', () => mostrarError('respuestas', ''));
  pintarNivel();

  formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (boton.disabled) return;
    const total = Number(respuestas.value);
    // Solo números enteros de 1 a 100 (spec.md).
    if (!Number.isInteger(total) || total < 1 || total > 100) {
      mostrarError('respuestas', 'Escribe un número entero de 1 a 100.');
      respuestas.focus();
      return;
    }
    // REAL: guarda el cupo cerrado y listo para abrir. Si el artista no
    // tenía cupo, aquí se crea.
    boton.disabled = true;
    const { error } = await baseDatos.from('cupos').upsert({
      artista: artista.id,
      estado: 'cerrado',
      total_preguntas: total,
      preguntas_usadas: 0,
      nivel_minimo: nivel
    }, { onConflict: 'artista' });
    if (error) {
      boton.disabled = false;
      mostrarAviso('No pudimos guardar el cupo. Revisa tu conexión e inténtalo otra vez.');
      return;
    }
    location.replace('cupos-artista.html?aviso=guardado');
  });
}

// ---------- Cola de reproducción ----------
// Diseño aprobado por el equipo (09-11-2026): «Sonando ahora», «A continuación»
// y un menú ⋯ en cada canción con Reproducir ahora, Subir, Bajar y Quitar.
function pantallaColaFan() {
  // Sin sesión de fan, a iniciar sesión.
  if (!fanActual()) {
    location.replace('iniciar-sesion.html');
    return;
  }
  // Volver: a la pantalla anterior si venimos de la app; si no, a Inicio.
  document.querySelector('[data-volver]').addEventListener('click', evento => {
    if (document.referrer && new URL(document.referrer).origin === location.origin) {
      evento.preventDefault();
      history.back();
    }
  });

  const caja = document.querySelector('[data-cola]');
  const artistas = obtenerDatos('artistas');
  const nombreArtista = l => {
    const artista = artistas.find(a => a.id === l.artista);
    return artista ? artista.nombreArtistico : '';
  };
  let menuAbierto = null; // { menu, boton }

  function pintar(enfocar) {
    const estado = reproductor.estado;
    const actual = lanzamientoSonando();
    if (!estado || !actual) {
      caja.innerHTML = `
        <div class="tarjeta">
          <h2 class="tarjeta__titulo">Todavía no suena nada</h2>
          <p class="tarjeta__texto">Toca ▶ en una canción y aquí verás lo que sigue.</p>
          <div class="tarjeta__acciones"><a class="boton boton--secundario boton--bloque" href="nuevos-lanzamientos-fan.html">Ver nuevos lanzamientos</a></div>
        </div>`;
      return;
    }
    const lanzamientos = obtenerDatos('lanzamientos');
    const orden = ordenDeLaCola();
    const siguientes = orden.slice(orden.indexOf(estado.actual) + 1)
      .map(id => lanzamientos.find(l => l.id === id))
      .filter(Boolean);

    const filas = siguientes.map((l, i) => {
      const menuId = `menu-cola-${i}`;
      const nombre = escapar(l.nombreCancion);
      return `
        <div class="fila-lista">
          ${htmlPortada(l, 'portada--pequena')}
          <span class="fila-lista__info">
            <b class="fila-lista__titulo">${nombre}</b>
            <span class="fila-lista__detalle">${escapar(nombreArtista(l))}</span>
          </span>
          <div class="desplegable">
            <button type="button" class="boton-icono boton-icono--pequeno" data-opciones="${escapar(l.id)}"
              aria-label="Opciones de ${nombre}" aria-haspopup="true" aria-expanded="false" aria-controls="${menuId}">
              <svg class="icono" aria-hidden="true"><use href="#icono-opciones"></use></svg>
            </button>
            <div class="menu" id="${menuId}" role="menu" aria-label="Opciones de ${nombre}" hidden>
              <button type="button" class="menu__opcion" role="menuitem" data-accion="reproducir" data-id="${escapar(l.id)}">Reproducir ahora</button>
              ${i > 0 ? `<button type="button" class="menu__opcion" role="menuitem" data-accion="subir" data-id="${escapar(l.id)}">Subir</button>` : ''}
              ${i < siguientes.length - 1 ? `<button type="button" class="menu__opcion" role="menuitem" data-accion="bajar" data-id="${escapar(l.id)}">Bajar</button>` : ''}
              <button type="button" class="menu__opcion" role="menuitem" data-accion="quitar" data-id="${escapar(l.id)}">Quitar</button>
            </div>
          </div>
        </div>`;
    }).join('');

    caja.innerHTML = `
      <section class="cola__seccion" aria-labelledby="titulo-sonando">
        <div class="encabezado-seccion"><h2 class="encabezado-seccion__titulo" id="titulo-sonando">Sonando ahora</h2></div>
        <div class="tarjeta">
          <div class="fila-lista">
            ${htmlPortada(actual, 'portada--pequena')}
            <span class="fila-lista__info">
              <b class="fila-lista__titulo">${escapar(actual.nombreCancion)}</b>
              <span class="fila-lista__detalle">${escapar(nombreArtista(actual))}</span>
            </span>
            ${botonReproducir(actual, 'boton-icono--relleno boton-icono--pequeno')}
          </div>
        </div>
        ${estado.aleatorio ? '<div class="etiquetas cola__etiquetas"><span class="etiqueta etiqueta--acento">Aleatorio activado</span></div>' : ''}
      </section>
      <section class="cola__seccion" aria-labelledby="titulo-siguen">
        <div class="encabezado-seccion"><h2 class="encabezado-seccion__titulo" id="titulo-siguen">A continuación</h2></div>
        ${siguientes.length
          ? `<div class="tarjeta">${filas}</div>`
          : `<div class="tarjeta">
              <p class="tarjeta__texto">No hay más canciones en la cola.</p>
              <div class="tarjeta__acciones"><a class="boton boton--secundario boton--bloque" href="nuevos-lanzamientos-fan.html">Ver nuevos lanzamientos</a></div>
            </div>`}
      </section>`;
    activarBotonesReproducir(caja);

    // Después de mover o quitar, el foco queda en un lugar útil (teclado).
    if (enfocar) {
      const destino = caja.querySelector(`[data-opciones="${enfocar}"]`) || caja.querySelector('[data-opciones]') || caja.querySelector('#titulo-siguen');
      if (destino) {
        if (destino.id === 'titulo-siguen') destino.tabIndex = -1;
        destino.focus();
      }
    }
  }

  function cerrarMenu(devolverFoco) {
    if (!menuAbierto) return;
    menuAbierto.menu.hidden = true;
    menuAbierto.boton.setAttribute('aria-expanded', 'false');
    if (devolverFoco) menuAbierto.boton.focus();
    menuAbierto = null;
  }

  caja.addEventListener('click', evento => {
    const botonMenu = evento.target.closest('[data-opciones]');
    if (botonMenu) {
      const yaAbierto = menuAbierto && menuAbierto.boton === botonMenu;
      cerrarMenu(false);
      if (yaAbierto) { botonMenu.focus(); return; }
      const menu = botonMenu.nextElementSibling;
      menu.hidden = false;
      botonMenu.setAttribute('aria-expanded', 'true');
      menuAbierto = { menu, boton: botonMenu };
      menu.querySelector('.menu__opcion').focus();
      return;
    }
    const opcion = evento.target.closest('.menu__opcion');
    if (!opcion) return;
    const id = opcion.dataset.id;
    const accion = opcion.dataset.accion;
    // El que sigue en la lista, para dejar ahí el foco si esta canción se va.
    const filas = [...caja.querySelectorAll('[data-opciones]')].map(b => b.dataset.opciones);
    const vecino = filas[filas.indexOf(id) + 1] || filas[filas.indexOf(id) - 1];
    menuAbierto = null;
    if (accion === 'reproducir') cargarCancion(id);
    if (accion === 'subir') { moverEnCola(id, -1); pintar(id); }
    if (accion === 'bajar') { moverEnCola(id, 1); pintar(id); }
    if (accion === 'quitar') { quitarDeCola(id); pintar(vecino); mostrarAviso('Quitada de la cola.'); }
  });
  // Flechas arriba y abajo dentro del menú; Esc lo cierra.
  caja.addEventListener('keydown', evento => {
    if (!menuAbierto) return;
    const opciones = [...menuAbierto.menu.querySelectorAll('.menu__opcion')];
    const actual = opciones.indexOf(document.activeElement);
    if (evento.key === 'ArrowDown') { evento.preventDefault(); opciones[(actual + 1) % opciones.length].focus(); }
    if (evento.key === 'ArrowUp') { evento.preventDefault(); opciones[(actual - 1 + opciones.length) % opciones.length].focus(); }
    if (evento.key === 'Escape') cerrarMenu(true);
  });
  document.addEventListener('click', evento => {
    if (!evento.target.closest('.desplegable')) cerrarMenu(false);
  });

  // Cuando cambia la canción o la cola (p. ej. termina una), se vuelve a dibujar.
  reproductor.alCambiar = () => { if (!menuAbierto) pintar(); };
  pintar();
}

// ---------- R02 · Música ----------
function pantallaMusicaArtista() {
  // Sin sesión de artista, a iniciar sesión.
  const artista = artistaActual();
  if (!artista) {
    location.replace('iniciar-sesion.html');
    return;
  }

  const lanzamientos = obtenerDatos('lanzamientos')
    .filter(l => l.artista === artista.id)
    .sort((a, b) => new Date(b.fechaPublicacion) - new Date(a.fechaPublicacion));
  const lista = document.querySelector('[data-lista-lanzamientos]');

  // Si venimos de eliminar un lanzamiento, lo confirmamos y limpiamos la dirección.
  if (new URLSearchParams(location.search).has('eliminado')) {
    mostrarAviso('Lanzamiento eliminado.');
    history.replaceState(null, '', location.pathname);
  }

  if (!lanzamientos.length) {
    lista.innerHTML = `
      <div class="tarjeta">
        <h2 class="tarjeta__titulo">Aún no has publicado música.</h2>
        <p class="tarjeta__texto">Cuando publiques un lanzamiento, aparecerá aquí y entrará a la ventana de 48 h de los fans.</p>
      </div>`;
    return;
  }

  lista.innerHTML = lanzamientos.map(l => {
    const horas = horasRestantesVentana(l);
    const estado = horas > 0 ? `Ventana activa · ${horas} h` : haceCuanto(l.fechaPublicacion);
    return `
      <article class="tarjeta">
        <div class="tarjeta__cabecera">
          ${htmlPortada(l, 'portada--mediana')}
          <div>
            <h2 class="tarjeta__titulo">${escapar(l.nombreLanzamiento)}</h2>
            <p class="tarjeta__texto">${escapar(l.nombreCancion)}</p>
            <div class="etiquetas musica__etiquetas"><span class="etiqueta etiqueta--borde">${escapar(estado)}</span></div>
          </div>
        </div>
        <div class="tarjeta__acciones">
          <a class="boton boton--secundario boton--bloque" href="lanzamiento-artista.html?id=${encodeURIComponent(l.id)}"
            aria-label="Ver lanzamiento ${escapar(l.nombreLanzamiento)}">Ver lanzamiento</a>
        </div>
      </article>`;
  }).join('');
}

// ---------- R03b · Lanzamiento ----------
function pantallaLanzamientoArtista() {
  // Sin sesión de artista, a iniciar sesión.
  const artista = artistaActual();
  if (!artista) {
    location.replace('iniciar-sesion.html');
    return;
  }

  const parametros = new URLSearchParams(location.search);
  const id = parametros.get('id');
  const recienPublicado = parametros.get('nuevo') === '1';
  // Solo el artista dueño ve su lanzamiento aquí. Si no existe, queda el mensaje del HTML.
  const lanzamiento = obtenerDatos('lanzamientos').find(l => l.id === id && l.artista === artista.id);
  if (!lanzamiento) return;

  const horas = horasRestantesVentana(lanzamiento);
  const enVentana = horas > 0;
  document.title = `Looped · ${lanzamiento.nombreLanzamiento}`;

  document.querySelector('[data-lanzamiento]').innerHTML = `
    <div class="encabezado-pagina">
      <h1 class="titulo titulo--medio">${recienPublicado ? 'Tu música ya tiene espacio.' : escapar(lanzamiento.nombreLanzamiento)}</h1>
      <p class="encabezado-pagina__bajada">${enVentana
        ? 'El lanzamiento está en la ventana justa de 48 horas.'
        : 'Ya pasó su ventana inicial y sigue en el descubrimiento habitual.'}</p>
    </div>
    <div class="etiquetas">
      <span class="etiqueta ${enVentana ? 'etiqueta--acento' : 'etiqueta--borde'}">${enVentana
        ? `Ventana activa · quedan ${horas} h`
        : `Publicado ${escapar(haceCuanto(lanzamiento.fechaPublicacion).toLowerCase())}`}</span>
    </div>
    <article class="tarjeta lanzamiento__tarjeta">
      ${htmlPortada(lanzamiento)}
      <h2 class="titulo titulo--pequeno lanzamiento__nombre">${escapar(lanzamiento.nombreLanzamiento)}</h2>
      <p class="texto--pequeno texto--suave">${escapar(lanzamiento.nombreCancion)}</p>
      <p class="tarjeta__texto">La misma oportunidad de ser descubierto.</p>
      <div class="tarjeta__acciones">
        <button type="button" class="boton boton--bloque" data-reproducir="${escapar(lanzamiento.id)}" data-titulo="${escapar(lanzamiento.nombreCancion)}">
          <svg class="icono" aria-hidden="true"><use href="#icono-reproducir"></use></svg>
          <span data-texto-reproducir="Escuchar lanzamiento">Escuchar lanzamiento</span>
        </button>
        <a class="boton boton--secundario boton--rellenar boton--bloque"
          href="nueva-publicacion-artista.html?lanzamiento=${encodeURIComponent(lanzamiento.id)}">Compartir en tu comunidad</a>
      </div>
    </article>
    <div class="lanzamiento__eliminar">
      <button type="button" class="boton boton--terciario" data-eliminar>Eliminar lanzamiento</button>
    </div>`;

  activarBotonesReproducir(document.querySelector('[data-lanzamiento]'));

  // Eliminar: primero se confirma en el diálogo.
  const velo = document.querySelector('[data-velo-eliminar]');
  const botonEliminar = document.querySelector('[data-eliminar]');
  const botonConfirmar = document.querySelector('[data-confirmar-eliminar]');
  const botonCancelar = document.querySelector('[data-cancelar-eliminar]');

  function cerrarDialogo() {
    velo.hidden = true;
    botonEliminar.focus();
  }
  botonEliminar.addEventListener('click', () => {
    velo.hidden = false;
    botonCancelar.focus(); // el foco empieza en la opción segura
  });
  botonCancelar.addEventListener('click', cerrarDialogo);
  velo.addEventListener('click', evento => { if (evento.target === velo) cerrarDialogo(); });
  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && !velo.hidden) cerrarDialogo();
  });
  botonConfirmar.addEventListener('click', async () => {
    botonConfirmar.disabled = true;
    if (reproductor.estado && reproductor.estado.actual === lanzamiento.id) detenerMusica();
    try {
      await eliminarLanzamiento(lanzamiento);
      location.replace('musica-artista.html?eliminado=1');
    } catch (e) {
      botonConfirmar.disabled = false;
      cerrarDialogo();
      mostrarAviso('No pudimos eliminar el lanzamiento. Revisa tu conexión e inténtalo otra vez.');
    }
  });
}

// ---------- R03 · Publicar lanzamiento ----------
// Lee la duración de un audio (en segundos). Rechaza si no se puede leer.
function leerDuracion(url) {
  return new Promise((resolver, rechazar) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => resolver(audio.duration);
    audio.onerror = () => rechazar(new Error('audio'));
    audio.src = url;
  });
}

const MAXIMO_AUDIO = 25 * 1024 * 1024; // 25 MB
const AUDIO_DE_MUESTRA = 'assets/audio-muestra.mp3';

function pantallaPublicarLanzamiento() {
  // Sin sesión de artista, a iniciar sesión.
  const artista = artistaActual();
  if (!artista) {
    location.replace('iniciar-sesion.html');
    return;
  }

  const formulario = document.getElementById('formulario-lanzamiento');
  const nombreLanzamiento = document.getElementById('nombre-lanzamiento');
  const nombreCancion = document.getElementById('nombre-cancion');
  const entradaAudio = document.querySelector('[data-entrada-audio]');
  const entradaPortada = document.querySelector('[data-entrada-portada]');
  const botonEscuchar = document.querySelector('[data-escuchar-audio]');
  const botonMuestra = document.querySelector('[data-audio-muestra]');
  const botonPublicar = document.querySelector('[data-publicar]');

  // Lo elegido hasta ahora. audio: un archivo (File) o la ruta del de muestra.
  const borrador = { audio: null, nombreAudio: '', duracion: 0, urlAudio: null, portada: null };
  let escucha = null; // el audio que suena al tocar «Escuchar»

  function pararEscucha() {
    if (escucha) escucha.pause();
    escucha = null;
    botonEscuchar.textContent = 'Escuchar';
  }

  function pintarAudio() {
    const hay = Boolean(borrador.audio);
    document.querySelector('[data-titulo-audio]').textContent = hay ? 'Audio seleccionado' : 'Audio';
    document.querySelector('[data-detalle-audio]').textContent = hay
      ? `${borrador.nombreAudio}${borrador.duracion ? ' · ' + formatoDuracion(borrador.duracion) : ''}`
      : 'MP3, M4A, WAV u OGG. Hasta 25 MB.';
    document.querySelector('[data-elegir-audio]').textContent = hay ? 'Cambiar audio' : 'Seleccionar audio';
    botonEscuchar.hidden = !hay;
    botonMuestra.hidden = hay;
  }

  async function usarAudio(audio, nombre, url) {
    try {
      const duracion = await leerDuracion(url);
      pararEscucha();
      if (borrador.urlAudio && borrador.urlAudio.startsWith('blob:')) URL.revokeObjectURL(borrador.urlAudio);
      Object.assign(borrador, { audio, nombreAudio: nombre, duracion, urlAudio: url });
      mostrarError('audio', '');
      pintarAudio();
    } catch (e) {
      mostrarAviso('No pudimos leer ese audio. Prueba con MP3 o M4A.');
    }
  }

  // Seleccionar o cambiar el audio
  document.querySelector('[data-elegir-audio]').addEventListener('click', () => entradaAudio.click());
  entradaAudio.addEventListener('change', () => {
    const archivo = entradaAudio.files[0];
    entradaAudio.value = '';
    if (!archivo) return;
    if (archivo.size > MAXIMO_AUDIO) {
      mostrarAviso('El audio supera 25 MB. Elige un archivo más liviano.');
      return;
    }
    usarAudio(archivo, archivo.name, URL.createObjectURL(archivo));
  });
  // Audio de muestra (decisión 10 de spec.md)
  botonMuestra.addEventListener('click', () => usarAudio(AUDIO_DE_MUESTRA, 'Muestra instrumental', rutaRecurso(AUDIO_DE_MUESTRA)));
  // Escuchar antes de publicar
  botonEscuchar.addEventListener('click', () => {
    if (escucha) { pararEscucha(); return; }
    escucha = new Audio(borrador.urlAudio);
    escucha.addEventListener('ended', pararEscucha);
    escucha.play();
    botonEscuchar.textContent = 'Pausar';
  });

  // Portada (opcional): se achica a 800 px y se muestra en miniatura.
  document.querySelector('[data-elegir-portada]').addEventListener('click', () => entradaPortada.click());
  entradaPortada.addEventListener('change', async () => {
    const archivo = entradaPortada.files[0];
    entradaPortada.value = '';
    if (!archivo) return;
    try {
      borrador.portada = await reducirImagen(archivo, 800);
      document.querySelector('[data-miniatura-portada]').innerHTML =
        `<img class="portada portada--pequena" src="${borrador.portada}" alt="Portada elegida">`;
      document.querySelector('[data-detalle-portada]').textContent = 'Portada seleccionada';
      document.querySelector('[data-elegir-portada]').textContent = 'Cambiar portada';
    } catch (e) {
      mostrarAviso('No pudimos usar esa imagen. Prueba con otra.');
    }
  });

  nombreLanzamiento.addEventListener('input', () => mostrarError('nombre-lanzamiento', ''));
  nombreCancion.addEventListener('input', () => mostrarError('nombre-cancion', ''));

  formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    const titulo = nombreLanzamiento.value.trim();
    const cancion = nombreCancion.value.trim();
    if (!titulo) mostrarError('nombre-lanzamiento', 'Escribe el nombre del lanzamiento.');
    if (!cancion) mostrarError('nombre-cancion', 'Escribe el nombre de la canción.');
    if (!borrador.audio) mostrarError('audio', 'Elige el audio o usa el de muestra.');
    if (!titulo || !cancion || !borrador.audio) {
      const primero = formulario.querySelector('[aria-invalid="true"]');
      if (primero) primero.focus();
      return;
    }

    // REAL: sube el audio y la portada a Supabase y guarda el lanzamiento.
    // Al guardarlo con la fecha de ahora, entra a la ventana de 48 h.
    const textoBoton = botonPublicar.textContent;
    botonPublicar.disabled = true;
    botonPublicar.textContent = 'Publicando…';
    pararEscucha();
    const marca = Date.now(); // para que cada archivo tenga un nombre distinto
    const subidos = []; // si algo falla, se borran los archivos que alcanzaron a subir
    try {
      const { data: { user } } = await baseDatos.auth.getUser();
      if (!user) throw new Error('sin-sesion');

      // El audio de muestra ya está en assets/: se guarda su ruta, sin subirlo.
      let audio = borrador.audio;
      if (typeof audio !== 'string') {
        const extension = (audio.name.split('.').pop() || 'mp3').toLowerCase();
        audio = await subirArchivo('audios', user.id, `audio-${marca}.${extension}`, audio, audio.type || 'audio/mpeg');
        subidos.push(audio);
      }
      let portada = null;
      if (borrador.portada) {
        const imagen = await (await fetch(borrador.portada)).blob();
        portada = await subirArchivo('portadas', user.id, `portada-${marca}.jpg`, imagen, 'image/jpeg');
        subidos.push(portada);
      }

      const { data, error } = await baseDatos.from('lanzamientos').insert({
        artista: artista.id,
        nombre_lanzamiento: titulo,
        nombre_cancion: cancion,
        portada,
        audio
      }).select().single();
      if (error) throw error;
      location.href = `lanzamiento-artista.html?id=${encodeURIComponent(data.id)}&nuevo=1`;
    } catch (e) {
      subidos.forEach(enlace => borrarArchivoSubido(enlace).catch(() => {}));
      botonPublicar.disabled = false;
      botonPublicar.textContent = textoBoton;
      mostrarAviso(e.message === 'sin-sesion'
        ? 'Tu sesión se cerró. Inicia sesión otra vez para publicar.'
        : 'No pudimos publicar el lanzamiento. Revisa tu conexión e inténtalo otra vez.');
    }
  });

  pintarAudio();
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
  'explorar-fan': pantallaExplorarFan,
  'musica-artista': pantallaMusicaArtista,
  'publicar-lanzamiento-artista': pantallaPublicarLanzamiento,
  'lanzamiento-artista': pantallaLanzamientoArtista,
  'nuevos-lanzamientos-fan': pantallaNuevosLanzamientosFan,
  'perfil-artista-fan': pantallaPerfilArtistaFan,
  'cola-fan': pantallaColaFan,
  'conectar-fan': pantallaConectarFan,
  'escribir-pregunta-fan': pantallaEscribirPreguntaFan,
  'bandeja-artista': pantallaBandejaArtista,
  'revisar-pregunta-artista': pantallaRevisarPreguntaArtista,
  'responder-artista': pantallaResponderArtista,
  'respuesta-enviada-artista': pantallaRespuestaEnviadaArtista,
  'respuesta-artista': pantallaRespuestaArtista,
  'tu-conexion-fan': pantallaTuConexionFan,
  'cupos-artista': pantallaCuposArtista,
  'configurar-cupo-artista': pantallaConfigurarCupoArtista,
  'comunidad-fan': pantallaComunidadFan,
  'comunidad-artista': pantallaComunidadArtista,
  'nueva-publicacion-artista': pantallaNuevaPublicacionArtista
};

document.addEventListener('DOMContentLoaded', async () => {
  // Primero se traen los datos de Supabase (en las páginas que cargan la conexión).
  if (typeof baseDatos !== 'undefined') {
    try {
      await cargarDatos();
    } catch (e) {
      // Sin conexión: la pantalla se muestra igual, vacía, con un aviso arriba.
      const contenido = document.querySelector('main');
      if (contenido) {
        const aviso = document.createElement('div');
        aviso.className = 'aviso aviso--advertencia';
        aviso.setAttribute('role', 'alert');
        aviso.innerHTML = '<p>No pudimos cargar los datos. Revisa tu conexión y recarga la página.</p>';
        contenido.prepend(aviso);
      }
    }
  }
  const pantalla = PANTALLAS[document.body.dataset.pantalla];
  if (pantalla) pantalla();
  iniciarReproductor(); // solo aparece en las pantallas con navegación
});
