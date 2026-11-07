/* ==========================================================
   Looped · Datos de ejemplo iniciales
   Una lista por cada tipo de dato de spec.md («Datos»). Cada
   elemento tiene un id y siempre los mismos campos, para pasarlos
   después a Supabase sin cambiar el diseño.
   Nunca se guardan contraseñas aquí: el repositorio es público.
   Las rutas de imágenes son desde la raíz del proyecto.
   ========================================================== */
const DATOS = {
  // fans: una cuenta de ejemplo para probar el inicio de sesión del fan.
  fans: [
    {
      id: 'fan-alex',
      nombrePerfil: 'Alex',
      nombreUsuario: 'alex',
      correo: 'alex@ejemplo.com',
      foto: null,
      gustosMusicales: ['Indie', 'Pop'],
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
      generos: ['Indie', 'Pop'],
      roles: ['Solista', 'Compositor o compositora'],
      seguidores: 312,
      emergente: true
    }
  ]
};
