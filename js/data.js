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

  // fans: una cuenta de ejemplo para probar el inicio de sesión del fan.
  fans: [
    {
      id: 'fan-alex',
      nombrePerfil: 'Alex',
      nombreUsuario: 'alex',
      correo: 'alex@ejemplo.com',
      foto: null,
      gustosMusicales: ['indie', 'pop'], // ids de DATOS.generos
      intereses: [],
      minutosEscucha: 0,
      artistasQueSigue: [],
      fanClubs: [],
      fanFundadorDe: [],
      fechaRegistro: '2026-11-01'
    }
  ],

  // artistas: Mara Sol, con sus datos del diseño.
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
    }
  ]
};
