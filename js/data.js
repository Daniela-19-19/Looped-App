/* ==========================================================
   Looped · Datos de ejemplo iniciales
   Una lista por cada tipo de dato de spec.md («Datos»). Cada
   elemento tiene un id y siempre los mismos campos, para pasarlos
   después a Supabase sin cambiar el diseño.
   Nunca se guardan contraseñas aquí: el repositorio es público.
   Las rutas de imágenes son desde la raíz del proyecto.
   ========================================================== */
const DATOS = {
  // generos: los que se pueden marcar en el registro, el perfil y los filtros.
  generos: [
    { id: 'pop', nombre: 'Pop' },
    { id: 'rock', nombre: 'Rock' },
    { id: 'indie', nombre: 'Indie' },
    { id: 'electronica', nombre: 'Electrónica' },
    { id: 'hip-hop', nombre: 'Hip hop' },
    { id: 'rnb', nombre: 'R&B' },
    { id: 'jazz', nombre: 'Jazz' },
    { id: 'musica-latina', nombre: 'Música latina' }
  ],

  // roles: cómo hace música un artista (proyecto musical y perfil).
  roles: [
    { id: 'solista', nombre: 'Solista' },
    { id: 'integrante-banda', nombre: 'Integrante de una banda' },
    { id: 'compositor', nombre: 'Compositor o compositora' },
    { id: 'productor', nombre: 'Productor o productora' },
    { id: 'instrumentista', nombre: 'Instrumentista' }
  ],

  // intereses: qué busca un fan en Looped (registro y perfil).
  intereses: [
    { id: 'descubrir-artistas', nombre: 'Descubrir nuevos artistas' },
    { id: 'nuevos-lanzamientos', nombre: 'Escuchar nuevos lanzamientos' },
    { id: 'conocer-artistas', nombre: 'Conocer a los artistas' },
    { id: 'comunidades', nombre: 'Participar en comunidades' }
  ],

  // fans: Alex (para probar el inicio de sesión) y los autores de las preguntas.
  // minutosEscucha define el nivel (tabla de spec.md: 15 min el nivel 1…).
  fans: [
    {
      id: 'fan-alex',
      nombrePerfil: 'Alex',
      nombreUsuario: 'alex',
      correo: 'alex@ejemplo.com',
      foto: null,
      gustosMusicales: ['indie', 'pop'], // ids de DATOS.generos
      intereses: [],
      minutosEscucha: 45, // nivel 2
      artistasQueSigue: ['nadia-cruz'],
      fanClubs: [],
      fanFundadorDe: [],
      fechaRegistro: '2026-11-01'
    },
    {
      id: 'fan-tomas',
      nombrePerfil: 'Tomás',
      nombreUsuario: 'tomas',
      correo: 'tomas@ejemplo.com',
      foto: null,
      gustosMusicales: ['indie'],
      intereses: ['conocer-artistas'],
      minutosEscucha: 80,
      artistasQueSigue: ['mara-sol'],
      fanClubs: [],
      fanFundadorDe: [],
      fechaRegistro: '2026-10-20'
    },
    {
      id: 'fan-lucia',
      nombrePerfil: 'Lucía',
      nombreUsuario: 'lucia',
      correo: 'lucia@ejemplo.com',
      foto: null,
      gustosMusicales: ['pop'],
      intereses: ['comunidades'],
      minutosEscucha: 130,
      artistasQueSigue: ['mara-sol'],
      fanClubs: ['mara-sol'],
      fanFundadorDe: ['mara-sol'],
      fechaRegistro: '2026-10-12'
    },
    {
      id: 'fan-sebastian',
      nombrePerfil: 'Sebastián',
      nombreUsuario: 'sebastian',
      correo: 'sebastian@ejemplo.com',
      foto: null,
      gustosMusicales: ['indie', 'rock'],
      intereses: ['nuevos-lanzamientos'],
      minutosEscucha: 40,
      artistasQueSigue: ['mara-sol'],
      fanClubs: [],
      fanFundadorDe: [],
      fechaRegistro: '2026-10-25'
    }
  ],

  // artistas: los cuatro del diseño.
  artistas: [
    {
      id: 'mara-sol',
      nombreArtistico: 'Mara Sol',
      nombreUsuario: 'marasol',
      correo: 'mara@ejemplo.com',
      foto: 'assets/mara-sol.jpg',
      presentacion: 'Canciones íntimas y melodías que encuentran su espacio.',
      ciudad: 'Bogotá',
      generos: ['indie', 'pop'], // ids de DATOS.generos
      roles: ['solista', 'compositor'], // ids de DATOS.roles
      seguidores: 312,
      emergente: true
    },
    {
      id: 'rio-lento',
      nombreArtistico: 'Río Lento',
      nombreUsuario: 'riolento',
      correo: 'rio@ejemplo.com',
      foto: null,
      presentacion: 'Dúo de electrónica tranquila para caminar de noche.',
      ciudad: 'Medellín',
      generos: ['electronica'],
      roles: ['productor'],
      seguidores: 2840,
      emergente: true
    },
    {
      id: 'nadia-cruz',
      nombreArtistico: 'Nadia Cruz',
      nombreUsuario: 'nadiacruz',
      correo: 'nadia@ejemplo.com',
      foto: null,
      presentacion: 'R&B con guitarras limpias y letras que cuentan lo cotidiano.',
      ciudad: 'Cali',
      generos: ['rnb', 'musica-latina'],
      roles: ['solista'],
      seguidores: 640,
      emergente: true
    },
    {
      id: 'los-faroles',
      nombreArtistico: 'Los Faroles',
      nombreUsuario: 'losfaroles',
      correo: 'faroles@ejemplo.com',
      foto: null,
      presentacion: 'Banda de rock que ensaya en un garaje desde 2019.',
      ciudad: 'Bucaramanga',
      generos: ['rock', 'indie'],
      roles: ['integrante-banda'],
      seguidores: 5120,
      emergente: false
    }
  ],

  // Las fechas de ejemplo se calculan desde «ahora» (3600000 ms = 1 hora),
  // así la ventana de 48 h siempre se puede probar. Con Supabase serán
  // fechas reales.

  // lanzamientos: la ventana de visibilidad (48 h) sale de fechaPublicacion.
  lanzamientos: [
    {
      id: 'segundo-sol',
      artista: 'mara-sol',
      nombreLanzamiento: 'Segundo sol',
      nombreCancion: 'Aire de vuelta',
      portada: 'assets/portada-segundo-sol.jpg',
      audio: 'assets/audio-muestra.mp3',
      fechaPublicacion: new Date(Date.now() - 5 * 3600000).toISOString()
    },
    {
      id: 'nocturna',
      artista: 'rio-lento',
      nombreLanzamiento: 'Nocturna',
      nombreCancion: 'Calle 10',
      portada: null,
      audio: 'assets/audio-muestra.mp3',
      fechaPublicacion: new Date(Date.now() - 30 * 3600000).toISOString()
    },
    {
      id: 'cerca',
      artista: 'nadia-cruz',
      nombreLanzamiento: 'Cerca',
      nombreCancion: 'Tarde de lunes',
      portada: null,
      audio: 'assets/audio-muestra.mp3',
      fechaPublicacion: new Date(Date.now() - 9 * 24 * 3600000).toISOString()
    },
    {
      id: 'garaje',
      artista: 'los-faroles',
      nombreLanzamiento: 'Garaje',
      nombreCancion: 'Ruido blanco',
      portada: null,
      audio: 'assets/audio-muestra.mp3',
      fechaPublicacion: new Date(Date.now() - 20 * 24 * 3600000).toISOString()
    }
  ],

  // cupos: uno por artista. estado: 'abierto', 'completo' o 'cerrado'.
  cupos: [
    { id: 'cupo-mara-sol', artista: 'mara-sol', estado: 'abierto', totalPreguntas: 5, preguntasUsadas: 1, nivelMinimo: 1, fechaApertura: new Date(Date.now() - 3 * 3600000).toISOString() },
    { id: 'cupo-rio-lento', artista: 'rio-lento', estado: 'cerrado', totalPreguntas: 3, preguntasUsadas: 3, nivelMinimo: 1, fechaApertura: null },
    { id: 'cupo-nadia-cruz', artista: 'nadia-cruz', estado: 'abierto', totalPreguntas: 10, preguntasUsadas: 2, nivelMinimo: 2, fechaApertura: new Date(Date.now() - 20 * 3600000).toISOString() },
    { id: 'cupo-los-faroles', artista: 'los-faroles', estado: 'abierto', totalPreguntas: 4, preguntasUsadas: 1, nivelMinimo: 1, fechaApertura: new Date(Date.now() - 30 * 3600000).toISOString() }
  ],

  // preguntas: autor es el id de un fan.
  // estado: 'nueva', 'pendiente', 'seleccionada', 'respondida' o 'descartada'.
  preguntas: [
    { id: 'pregunta-tomas', artista: 'mara-sol', autor: 'fan-tomas', autorEsFanClub: false, primerContacto: false, texto: '¿Cómo nació Aire de vuelta?', votos: 14, estado: 'nueva', fecha: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 'pregunta-lucia', artista: 'mara-sol', autor: 'fan-lucia', autorEsFanClub: true, primerContacto: false, texto: '¿Vas a tocar Segundo sol en vivo este año?', votos: 6, estado: 'nueva', fecha: new Date(Date.now() - 1 * 3600000).toISOString() },
    { id: 'pregunta-alex', artista: 'nadia-cruz', autor: 'fan-alex', autorEsFanClub: false, primerContacto: false, texto: '¿Qué canción te gustaría que escucháramos primero?', votos: 2, estado: 'pendiente', fecha: new Date(Date.now() - 6 * 3600000).toISOString() },
    { id: 'pregunta-sebastian', artista: 'mara-sol', autor: 'fan-sebastian', autorEsFanClub: false, primerContacto: false, texto: '¿Qué instrumento usaste para la introducción?', votos: 3, estado: 'respondida', fecha: new Date(Date.now() - 40 * 3600000).toISOString() }
  ],

  // respuestas: tipo 'texto' o 'voz' (con audio y su duración en segundos).
  respuestas: [
    { id: 'respuesta-sebastian', pregunta: 'pregunta-sebastian', tipo: 'texto', texto: 'Una guitarra de nylon que encontré en casa de mi abuela. La grabé con el celular primero.', audio: null, duracionAudio: null, fecha: new Date(Date.now() - 30 * 3600000).toISOString() }
  ]
};
