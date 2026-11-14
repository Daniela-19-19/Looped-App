# Spec de Looped (MVP)

Plano de construcción: qué se construye, en qué orden y cuándo está lista cada pantalla.

**Fuentes:** brief (`01-brief.md`), flujograma del MVP (17-10-2026) y diseños (`disenos/prototipo.html`) del repositorio del proceso https://github.com/Daniela-19-19/Looped, más las decisiones del equipo del 01-11-2026 y del 02-11-2026.

**Diseño:** las 49 pantallas están en un solo archivo, `disenos/prototipo.html`; cada una cuenta como pantalla aparte. Además hay una pantalla nueva sin diseño todavía: la cola de reproducción. Se construyen con el design kit (`css/tokens.css`, `css/components.css`, `componentes.html`).

**Cómo leer «Qué funciona de verdad»:**
- **Real:** funciona y se guarda en el backend.
- **Simulado:** se ve y se puede tocar, pero con datos de mentira.
- **Después:** no entra en el MVP.

## Decisiones del equipo

1. **Backend:** todo será Real. Las cuentas, los perfiles, la música, las preguntas, los votos, las respuestas, los cupos, las publicaciones, los niveles y las notificaciones se guardan en Supabase (la base de datos indicada en `CLAUDE.md`). Los archivos (audio, portadas, fotos y notas de voz) también.
2. **Fan y artista con la misma importancia:** los dos lados tienen que estar listos para el MVP. Se construyen a la par.
3. **Cuentas e inicio de sesión:** la cuenta se crea por separado como fan o como artista, y un mismo correo pertenece a una sola cuenta. Al iniciar sesión, la app reconoce el rol de la cuenta y abre su lado: el fan su inicio y el artista su panel. Así el artista conserva su información y su música publicada.
4. **Primer contacto, fan fundador y ventana de visibilidad de 48 h:** entran en el MVP.
5. **Umbral de «Fan fundador»:** 1000 seguidores.
6. **Nivel del fan:** el nivel 1 pide 15 minutos de escucha y cada nivel siguiente pide 1,5 veces lo que pidió el anterior (ver la tabla en «Datos»).
7. **Prioridad de las preguntas:** primero las más votadas, y solo de fans con el nivel suficiente para ese cupo.
8. **Música:** subida de audio real y reproductor completo: anterior, reproducir o pausar, siguiente, aleatorio, bucle y cola de reproducción que el fan puede editar.
9. **Notificaciones al celular (push):** entran en el MVP.
10. **Datos de ejemplo** (Mara Sol, Río Lento, Nadia Cruz, Los Faroles y sus lanzamientos y preguntas): se mantienen por ahora como datos iniciales. Decisión del equipo del 10-11-2026: como los datos ahora son reales y compartidos en Supabase, la opción «Borrar datos de la demostración» pasa a ser «Borrar datos de este dispositivo»: cierra la sesión y borra solo lo guardado en el navegador (preferencias y música), sin tocar Supabase.

11. **Fan Club, lo más sencillo posible:**
    - Entrar es gratis en el MVP. El cobro (suscripción) queda para Después.
    - El contenido exclusivo lo crea el artista desde «Nueva publicación», marcando la casilla «Solo para el Fan Club». No hace falta una pantalla nueva.

12. **Varias cuentas en el mismo dispositivo** (decisión del equipo del 14-11-2026): una persona puede entrar con varias cuentas en el mismo celular o computador y cambiar entre ellas sin escribir la contraseña cada vez.
    - Se cambia desde el perfil (Perfil del fan y Perfil propio del artista) y desde Configuración.
    - Tocar la foto de la sesión en la barra de arriba (Inicio y Explorar del fan, panel del artista) abre el diálogo «Tu cuenta», con cambiar de cuenta y cerrar sesión; ya no lleva al perfil, porque al perfil se llega con la pestaña de abajo (decisión del equipo del 14-11-2026). Como el artista no tiene pestaña «Perfil», su diálogo trae «Ver tu perfil».
    - Atajo, como en Instagram: mantener presionada la pestaña «Perfil» del fan (en cualquier pantalla con navegación). En computador, el clic derecho hace lo mismo. Los botones visibles se mantienen porque el gesto no se puede hacer con teclado ni lector de pantalla.
    - La pestaña «Perfil» conserva su ícono: la foto de la persona ya se ve en la barra de arriba.
    - Las cuentas pueden ser de los dos roles: un artista puede tener también una cuenta de fan. Al cambiar, la app toma el color y la navegación del rol de esa cuenta.
    - «Cerrar sesión» saca solo la cuenta actual y solo en este dispositivo: si queda otra cuenta guardada, entra a esa; si no, vuelve a la bienvenida. Nunca borra la cuenta de Supabase.
    - «Borrar datos de este dispositivo» saca todas las cuentas.
    - No se guardan contraseñas: el navegador guarda la sesión de cada cuenta. Si la sesión de una cuenta vence, al elegirla se pide la contraseña otra vez.
    - Las notificaciones al celular (push) llegan solo para la cuenta activa; las demás ven sus avisos al volver a entrar.

13. **Spotify, con links** (decisión del equipo del 14-11-2026): la música de Spotify se muestra en Looped con el reproductor que Spotify deja insertar en una página, a partir de links que pega cada persona. No hay inicio de sesión con Spotify.
    - Por qué así: Spotify no entrega los archivos de audio ni deja copiarlos, y conectar la cuenta de Spotify (su API) solo lo permite a unas pocas cuentas agregadas a mano mientras Spotify no apruebe la app.
    - Artista: pega el link de su perfil de artista en Spotify; su perfil en Looped muestra «También en Spotify».
    - Fan: pega hasta 3 links de listas públicas de Spotify; su perfil muestra «Tus listas de Spotify».
    - La música de Spotify suena en el reproductor de Spotify, no en el de Looped: no suma minutos de escucha ni entra a la cola. Si la persona no tiene sesión de Spotify abierta en ese navegador, Spotify puede poner solo una muestra de cada canción.
    - Solo se aceptan links de open.spotify.com (o `spotify:artist:…` / `spotify:playlist:…`). Se guarda solo el código de 22 caracteres del perfil o de la lista.

14. **Cuenta y acceso** (decisión del 14-11-2026; pantallas sin diseño en el prototipo, hechas con el kit): con cuentas reales, quien olvida su contraseña no puede quedar por fuera.
    - Recuperar la contraseña con un link que llega al correo (Supabase Auth). Por seguridad, la app nunca dice si un correo tiene cuenta o no.
    - Pantalla «Cuenta» en Configuración: cambiar el correo (se confirma con un link en el correo nuevo) y la contraseña (pide la actual).
    - «Eliminar mi cuenta» en la pantalla «Cuenta»: pide la contraseña y borra para siempre la cuenta, el perfil y todo lo suyo (base de datos y archivos). Si queda otra cuenta guardada en el dispositivo, entra a esa.
    - Página «No encontrada» para links rotos o viejos.
    - En el panel de Supabase hace falta: (1) agregar la dirección de Vercel en Authentication → URL Configuration, para que los links del correo vuelvan a la app; (2) para que los correos lleguen a cualquier persona, un servicio de correo propio (SMTP), porque el que trae Supabase solo envía a los miembros del equipo del proyecto y pocos por hora.

15. **Artistas que sigues** (decisión del 14-11-2026; pantalla sin diseño en el prototipo, hecha con el kit): el fan sigue artistas, pero no tenía dónde verlos juntos. Se llega desde su perfil.

## Orden de construcción

Fan y artista avanzan a la par: cada bloque trae su parte de los dos lados, así lo que hace uno se puede probar desde el otro. Dentro de cada bloque se sigue el flujo. El orden de los bloques es una propuesta.

1. **Entrada común:** splash, bienvenida, iniciar sesión, elegir experiencia, crear cuenta.
2. **Registro:**
   - Artista: identidad, presentación, estilo musical, proyecto musical, perfil listo.
   - Fan: perfil básico, gustos, intereses, perfil listo.
3. **Inicio de cada lado:**
   - Artista: panel y navegación inferior del artista.
   - Fan: inicio, explorar y navegación inferior del fan.
4. **Música:**
   - Artista: música, publicar lanzamiento, lanzamiento.
   - Fan: nuevos lanzamientos, perfil del artista, reproductor y cola de reproducción.
5. **Cupo y preguntas:**
   - Artista: cupos, configurar cupo, bandeja, revisar pregunta, responder, respuesta enviada, respuesta del artista.
   - Fan: conexión activa, conectar, escribir pregunta, tu conexión.
6. **Comunidad:**
   - Artista: comunidad, nueva publicación (con la casilla del Fan Club).
   - Fan: comunidad.
7. **Perfiles:**
   - Artista: perfil propio, editar perfil.
   - Fan: perfil, tu recorrido, editar perfil.
8. **Fan Club:** conocer y contenido.
9. **Compartidas:** configuración, apariencia, notificaciones, accesibilidad.
10. **Varias cuentas** (decisión 12): cambiar de cuenta y agregar otra cuenta.
11. **Spotify** (decisión 13): links en editar perfil y reproductor de Spotify en los perfiles.
12. **Cuenta y acceso** (decisión 14): recuperar contraseña, nueva contraseña, cuenta y página no encontrada.
13. **Artistas que sigues** (decisión 15).

## Flujo

**Entrada (común)**
splash → bienvenida → ¿ya tienes cuenta?
- **Sí:** iniciar sesión → el inicio de su rol: el fan va a su inicio y el artista a su panel.
  - ¿Olvidó su contraseña? → recuperar contraseña → link en el correo → nueva contraseña → el inicio de su rol.
- **No:** elegir experiencia → crear cuenta → perfil básico → perfil listo.
  - **Fan:** nombre y usuario → gustos musicales → intereses → perfil listo → inicio del fan.
  - **Artista:** identidad → presentación → estilo musical → proyecto musical → perfil listo → panel del artista.

**Flujo fan** (navegación inferior: Inicio · Explorar · Comunidad · Perfil)
- inicio → nuevos lanzamientos (ventana de 48 h) o conexión activa → perfil del artista.
- explorar (buscador y filtros) → perfil del artista.
- perfil del artista → escuchar música (reproductor y cola de reproducción) · conocer al artista · comunidad · conectar.
  - Si el artista está por debajo de 1000 seguidores, el fan recibe el reconocimiento «Fan fundador».
- conectar → ¿ya sigues al artista?
  - **No:** primer contacto (puede interactuar sin seguirlo).
  - **Sí:** conexión con el artista.
- → ¿tiene cupo abierto?
  - **No:** cupo cerrado.
  - **Sí:** ¿cumples las condiciones (nivel mínimo)?
    - **No:** revisar requisitos.
    - **Sí:** escribir pregunta (o votar una existente) → pregunta en cola → ¿fue seleccionada?
      - **No:** esperar en cola.
      - **Sí:** ¿el artista responde? → recibir respuesta (texto o nota de voz).
- perfil del fan → artistas que sigues · tu recorrido (nivel) · Fan Club (conocer → contenido) · editar perfil · configuración.

**Flujo artista** (navegación inferior: Música · Preguntas · Comunidad · Cupo)
- panel → música → publicar lanzamiento → lanzamiento publicado (entra a la ventana de 48 h).
- panel → bandeja de preguntas → revisar pregunta → ¿responder?
  - **No:** mantener en cola o descartar.
  - **Sí:** responder con texto o nota de voz → respuesta enviada (se notifica al fan) → ver la respuesta.
- panel → comunidad → nueva publicación (para todos o solo para el Fan Club).
- panel → cupo → configurar cupo → abrir cupo → cupo activo → recibir preguntas y votos hasta completarlo → cupo completo o cerrado → abrir nuevo cupo.
- panel → perfil propio → editar perfil · configuración.

**Compartidas por los dos perfiles**
configuración → cuenta (correo y contraseña) · apariencia · notificaciones · accesibilidad · cuentas · cerrar sesión (detiene la música; si hay otra cuenta guardada entra a esa, si no vuelve a bienvenida).

perfil o configuración → cambiar de cuenta → elegir una cuenta guardada (abre el inicio de su rol) o agregar otra cuenta (iniciar sesión o crear cuenta, sin cerrar la actual).

**Nivel del fan** (en segundo plano): los minutos de escucha suben el nivel (15 minutos el primero, y cada nivel pide 1,5 veces más que el anterior) → nuevos beneficios → invitación al Fan Club.

## Datos

Lo que la app muestra o guarda, tal como aparece en los diseños. Todo se guarda en Supabase.

**fans**: nombre de perfil, nombre de usuario, correo, contraseña, foto, gustos musicales (géneros), intereses, minutos de escucha acumulados (definen el nivel), artistas que sigue, Fan Clubs a los que pertenece, artistas de los que es fan fundador, fecha de registro, listas de Spotify (hasta 3, opcional, decisión 13).

**artistas**: nombre artístico, nombre de usuario, correo, contraseña, foto, presentación, ciudad (opcional), géneros, roles (solista, compositor, productor, integrante de banda…), número de seguidores, si es emergente, perfil de Spotify (opcional, decisión 13).

**cupos** (uno activo por artista): estado (abierto, completo, cerrado), total de preguntas (1 a 100), preguntas usadas, nivel mínimo para participar, fecha de apertura.

**lanzamientos**: artista, nombre del lanzamiento, nombre de la canción, portada, archivo de audio, fecha de publicación. La ventana de visibilidad se calcula a partir de la fecha: 48 horas.

**preguntas**: artista, autor (fan), si el autor es del Fan Club, si es de primer contacto, texto, número de votos, estado (nueva, pendiente, seleccionada, respondida, descartada), fecha.

**votos**: fan, pregunta.

**respuestas**: pregunta, tipo (texto o nota de voz), texto o archivo de audio, duración del audio, fecha.

**publicaciones** (comunidad del artista): artista, texto, lanzamiento relacionado (opcional), si es solo para el Fan Club, fecha. Las que son solo para el Fan Club son el contenido exclusivo.

**cola de reproducción** (una por fan): canciones en orden, canción actual, aleatorio (sí o no), bucle (apagado, una canción o toda la cola).

**notificaciones**: para quién (fan o artista), texto, acción (a qué pantalla lleva), fecha, si fue leída, si se envió al celular.

**preferencias** (por persona): apariencia (clara u oscura), reducir movimiento, reducir transparencia, notificaciones activadas.

**Reglas:**
- Un correo pertenece a una sola cuenta, de fan o de artista. Al iniciar sesión, la app lee el rol guardado y abre su lado.
- Nivel del fan: el nivel 1 pide 15 minutos de escucha y cada nivel siguiente pide 1,5 veces lo que pidió el anterior, redondeado al minuto. El fan empieza en el nivel 0.

  | Nivel | Minutos de ese nivel | Total acumulado |
  |---|---|---|
  | 1 | 15 | 15 |
  | 2 | 23 | 38 |
  | 3 | 34 | 72 |
  | 4 | 51 | 123 |
  | 5 | 76 | 199 (unas 3 h) |
  | 6 | 114 | 313 |
  | 7 | 171 | 484 |
  | 8 | 256 | 740 |
  | 9 | 384 | 1124 |
  | 10 | 577 | 1701 (unas 28 h) |
- Fan Club: entrar es gratis en el MVP.
- «Fan fundador»: se otorga al visitar a un artista con menos de 1000 seguidores.
- Ventana de visibilidad: 48 h desde la publicación.
- Tamaño del cupo: de 1 a 100 preguntas.
- Prioridad de las preguntas: más votadas primero, y solo de fans con el nivel mínimo del cupo.

## Pantallas

En el orden del flujo. En todas, «Archivo de diseño» es `disenos/prototipo.html`, compartido con las demás pantallas.

### Criterios para todas las pantallas (responsive)
Decisión del equipo del 07-11-2026: todas las pantallas deben servir en celular y en computador sin que se rompa el diseño. Además de su propio «Está lista cuando», cada pantalla cumple:
- Se ve bien en 320 px (celular pequeño), 375 px (celular), 768 px (tablet), 1024 px y 1280 px (computador), y al arrastrar el borde de la ventana entre esos anchos.
- No aparece barra de desplazamiento horizontal.
- Ningún texto se corta, se sale de su caja ni queda encima de otro elemento.
- Los botones y enlaces miden al menos 48 px de alto y no quedan pegados entre sí. Excepción (decisión del equipo del 14-11-2026): «Cambiar de cuenta» en el perfil del fan usa el botón pequeño (40 px), para que pese menos que los demás.
- Con zoom al 200 % todo se sigue leyendo y usando.
- En celular, al abrir el teclado, el campo que se escribe y el botón principal se pueden alcanzar.
- Se adapta a cada tamaño (decisión del equipo del 07-11-2026: «barra lateral + rejillas»):
  - **Celular** (menos de 768 px): una columna, con la navegación abajo.
  - **Tablet** (768 px o más): el contenido se ensancha (hasta 720 px) y las listas de tarjetas van en 2 columnas.
  - **Computador** (1024 px o más): la navegación pasa a ser una barra lateral a la izquierda, el contenido usa hasta 1200 px, las listas van en 2 o 3 columnas, las secciones grandes quedan lado a lado y los títulos crecen.
  - **Formularios** (entrada y registro): siempre en una columna angosta (440 px), centrada también a lo alto en pantallas grandes.
- Funciona con mouse, con el dedo y con teclado (foco visible).

### A00 · Splash
- **Objetivo:** Esta pantalla existe para que cualquier persona reconozca la marca al abrir la app. Sabemos que funciona si ve el logo animado y pasa sola a la bienvenida.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - El logo se anima y a los 3,5 s pasa a la bienvenida; un toque lo adelanta.
  - Con «reducir movimiento» activado, la animación dura menos de 1 s.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### A01 · Bienvenida
- **Objetivo:** Esta pantalla existe para que una persona nueva o que ya tiene cuenta pueda elegir cómo entrar. Sabemos que funciona si toca «Crear cuenta» o «Iniciar sesión» sin dudar.
- **Contenido:**
  1. Logo.
  2. «Música que conecta.» y la bajada.
  3. Botones «Crear cuenta» e «Iniciar sesión».
- **Qué funciona de verdad:**
  - Crear cuenta: Real (navega).
  - Iniciar sesión: Real (navega).
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Cada botón lleva a su pantalla.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### A02 · Iniciar sesión
- **Objetivo:** Esta pantalla existe para que un fan o un artista con cuenta pueda volver a entrar y encontrar su información. Sabemos que funciona si entra al inicio de su rol con correo y contraseña.
- **Contenido:**
  1. «Qué bueno verte.»
  2. Campos de correo y contraseña (con botón para mostrarla).
  3. Botón «Iniciar sesión».
  4. Enlace «Crear una cuenta».
  5. Enlace «¿Olvidaste tu contraseña?» (decisión 14): lleva a «Recuperar contraseña» con el correo ya escrito.
- **Qué funciona de verdad:**
  - Iniciar sesión: Real. La app reconoce si la cuenta es de fan o de artista: el fan llega a su inicio y el artista a su panel.
  - Mostrar u ocultar la contraseña: Real.
  - Agregar otra cuenta (decisión 12): si se llega desde «Agregar otra cuenta», la cuenta actual queda guardada y la nueva pasa a ser la activa. Un botón «Volver» regresa a la cuenta actual sin cambiar nada.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Con un correo mal escrito, sin contraseña o con datos incorrectos, aparece el error debajo del campo, en rojo de error.
  - Un artista que inicia sesión ve su panel con sus lanzamientos.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### A03 · Crear cuenta: elegir experiencia
- **Objetivo:** Esta pantalla existe para que una persona nueva pueda elegir si se registra como fan o como artista. Sabemos que funciona si elige una opción y pasa al formulario correcto.
- **Contenido:**
  1. «¿Cómo quieres registrarte?»
  2. Opción fan.
  3. Opción artista.
- **Qué funciona de verdad:**
  - Elegir fan o artista: Real (define el rol de la cuenta y el color de la app).
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Elegir fan pinta la app de turquesa y elegir artista, de violeta.
  - Lleva a «Crear cuenta» con el rol elegido.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### A03f / A03r · Crear cuenta
- **Archivo de diseño:** la misma pantalla para fan y artista.
- **Objetivo:** Esta pantalla existe para que una persona nueva pueda crear su cuenta con correo y contraseña. Sabemos que funciona si avanza al perfil básico sin errores.
- **Contenido:**
  1. «Crea tu cuenta de fan» o «… de artista».
  2. Campos de correo y contraseña.
  3. Botón «Continuar».
  4. Enlace «Ya tengo una cuenta».
- **Qué funciona de verdad:**
  - Crear la cuenta: Real.
- **Nota:** la foto de perfil opcional va en el paso siguiente («Dale tu nombre» o «Tu identidad como artista»), como en el diseño (decisión del equipo del 07-11-2026).
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Valida el correo y la contraseña y muestra el error debajo del campo.
  - Un correo ya registrado muestra un error.
  - «Continuar» lleva al primer paso del perfil del rol elegido.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### A05f · Perfil básico del fan
- **Objetivo:** Esta pantalla existe para que el fan pueda decir cómo quiere que lo vean. Sabemos que funciona si completa su nombre y su usuario y continúa.
- **Contenido:**
  1. «Dale tu nombre.»
  2. Foto de perfil opcional.
  3. Campos «Nombre de perfil» y «Nombre de usuario».
  4. Botón «Continuar».
- **Qué funciona de verdad:**
  - Guardar el nombre y el usuario: Real.
  - Subir la foto: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - No deja continuar con campos vacíos.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### A06f · Gustos musicales
- **Objetivo:** Esta pantalla existe para que el fan pueda indicar qué música escucha. Sabemos que funciona si marca al menos un género o elige «Lo haré después».
- **Contenido:**
  1. «¿Qué te gusta escuchar?»
  2. Lista de géneros con casillas.
  3. Botones «Continuar» y «Lo haré después».
- **Qué funciona de verdad:**
  - Marcar géneros: Real.
  - «Lo haré después»: Real (avanza sin guardar).
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Las casillas usan el componente `.casilla`.
  - Los dos botones avanzan.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### A07f · Intereses
- **Objetivo:** Esta pantalla existe para que el fan pueda decir qué busca en Looped. Sabemos que funciona si marca intereses o elige «Lo haré después».
- **Contenido:**
  1. «¿Qué buscas en Looped?»
  2. Lista de intereses con casillas.
  3. Botones «Continuar» y «Lo haré después».
- **Qué funciona de verdad:**
  - Marcar intereses: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Los dos botones avanzan.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### A08f · Perfil del fan listo
- **Objetivo:** Esta pantalla existe para que el fan confirme que su perfil quedó creado. Sabemos que funciona si toca «Empezar a descubrir» y llega a su inicio.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Muestra «Ya eres parte de Looped.» con el nombre del fan.
  - «Empezar a descubrir» lleva al inicio del fan.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### A05r · Identidad del artista
- **Objetivo:** Esta pantalla existe para que el artista pueda decir cómo lo van a encontrar. Sabemos que funciona si completa su nombre artístico y su usuario.
- **Contenido:**
  1. «Tu identidad como artista.»
  2. Foto de perfil opcional.
  3. Campos «Nombre artístico» y «Nombre de usuario».
  4. Botón «Continuar».
- **Qué funciona de verdad:**
  - Guardar la identidad: Real.
  - Subir la foto: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - No deja continuar con campos vacíos.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### A06r · Presentación
- **Objetivo:** Esta pantalla existe para que el artista pueda presentarse a sus fans. Sabemos que funciona si escribe su presentación y continúa.
- **Contenido:**
  1. «Cuéntanos sobre ti.»
  2. Área de texto «Presentación».
  3. Campo «Ciudad, opcional».
  4. Botón «Continuar».
- **Qué funciona de verdad:**
  - Guardar la presentación y la ciudad: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - La ciudad se puede dejar vacía.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### A07r · Estilo musical
- **Objetivo:** Esta pantalla existe para que el artista pueda indicar qué música hace. Sabemos que funciona si marca géneros o elige «Lo haré después».
- **Contenido:**
  1. «¿Qué música haces?»
  2. Lista de géneros con casillas.
  3. Botones «Continuar» y «Lo haré después».
- **Qué funciona de verdad:**
  - Marcar géneros: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Los dos botones avanzan.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### A08r · Proyecto musical
- **Objetivo:** Esta pantalla existe para que el artista pueda decir cómo hace música (solista, banda, productor…). Sabemos que funciona si marca sus roles y completa su perfil.
- **Contenido:**
  1. «¿Cómo haces música?»
  2. Lista de roles con casillas.
  3. Botones «Completar mi perfil» y «Lo haré después».
- **Qué funciona de verdad:**
  - Marcar roles: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Los dos botones avanzan al perfil listo.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### A09r · Perfil del artista listo
- **Objetivo:** Esta pantalla existe para que el artista confirme que su espacio está listo y sepa qué hacer después. Sabemos que funciona si entra a su panel.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Muestra «Tu espacio está listo.» con su nombre y el botón «Ir a mi panel». (Decisión del equipo del 07-11-2026: «Escuchar» y «Ver mi recorrido» no van, como en el diseño; el artista nuevo aún no tiene música y el recorrido es del fan.)
  - «Ir a mi panel» lleva al panel del artista.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F01a · Inicio (fan)
- **Objetivo:** Esta pantalla existe para que el fan pueda descubrir artistas y lanzamientos nuevos y retomar sus conexiones. Sabemos que funciona si desde aquí llega al perfil de un artista o a escuchar un lanzamiento.
- **Contenido:**
  1. Barra de marca: logo, tema y foto (abre el diálogo «Tu cuenta», decisión 12).
  2. «Descubre algo nuevo».
  3. Lanzamiento destacado: «En sus primeras 48 h» o «Último lanzamiento».
  4. «Una conexión real» (tarjeta de un artista).
  5. «Tus preguntas».
  6. «Explora a tu manera»: chips Todos los artistas · Con cupo abierto · Con nuevo lanzamiento · Emergentes.
  7. «Tu recorrido».
  8. «Artistas».
  9. «Canciones».
  10. Navegación inferior.
- **Qué funciona de verdad:**
  - Reproducir el lanzamiento destacado: Real.
  - Abrir el perfil del artista: Real.
  - Chips de exploración: Real (filtran artistas reales).
  - Enlaces «Ver más» y «Ver conexión activa»: Real.
  - Navegación inferior: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - El lanzamiento destacado reproduce el audio y abre el minirreproductor.
  - Las tarjetas llevan al perfil del artista.
  - La navegación inferior marca «Inicio».
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F01b · Explorar
- **Objetivo:** Esta pantalla existe para que el fan pueda buscar un artista concreto. Sabemos que funciona si escribe un nombre (por ejemplo «Mara») y abre su perfil desde los resultados.
- **Contenido:**
  1. «Explorar».
  2. Buscador con filtro.
  3. Menú de filtros: Pop · Indie · Rock · preguntas abiertas.
  4. Resultados.
  5. Mensaje cuando no hay coincidencias.
- **Qué funciona de verdad:**
  - Buscar: Real (busca en los artistas guardados).
  - Filtros: Real. Se aplican al elegirlos y se cierran tocando fuera.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Escribir filtra los resultados.
  - Sin resultados aparece «revisar filtros».
  - Un resultado abre el perfil del artista.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F01c · Nuevos lanzamientos (ventana de visibilidad)
- **Objetivo:** Esta pantalla existe para que el fan pueda escuchar lanzamientos recién publicados, con la misma visibilidad sin importar el tamaño del artista. Sabemos que funciona si escucha un lanzamiento de esta lista.
- **Contenido:**
  1. «Un espacio para sonar».
  2. Lanzamientos de las últimas 48 h.
  3. «Escucha el lanzamiento».
- **Qué funciona de verdad:**
  - Reproducir: Real.
  - Ventana de 48 h: Real (se calcula con la fecha de publicación).
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Solo aparecen lanzamientos de menos de 48 h, sin importar los seguidores del artista.
  - Cada uno se puede reproducir.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### Conexión activa
- **Objetivo:** Esta pantalla existe para que el fan pueda ver con qué artistas puede hablar ahora. Sabemos que funciona si abre el perfil de un artista con cupo abierto.
- **Contenido:**
  1. «Conexión activa».
  2. «Artistas con cupo abierto».
  3. «Volverán a abrir» (artistas con el cupo cerrado).
- **Qué funciona de verdad:**
  - Lista según el estado real del cupo: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Separa a los artistas con cupo abierto de los que tienen el cupo cerrado.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F02 · Perfil del artista (visto por el fan)
- **Objetivo:** Esta pantalla existe para que el fan pueda conocer a un artista, escuchar su música y conectar con él. Sabemos que funciona si toca «Conectar», escucha una canción o entra a su comunidad.
- **Contenido:**
  1. Nombre y foto.
  2. Botón «Conectar».
  3. «Su música».
  4. «Conoce a …» (presentación).
  5. «Ver comunidad».
  6. Reconocimiento «Fan fundador» cuando aplica.
  7. «También en Spotify» (decisión 13), solo si el artista pegó su link: el reproductor de Spotify con su perfil.
- **Qué funciona de verdad:**
  - Escuchar: Real.
  - También en Spotify: Real (reproductor de Spotify; no suma minutos).
  - Conectar: Real.
  - Ver comunidad: Real.
  - Seguir al artista: Real.
  - Fan fundador: Real (si el artista tiene menos de 1000 seguidores en la primera visita).
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Las tres acciones llevan a su pantalla.
  - Visitar a un artista con menos de 1000 seguidores muestra «Fan fundador» y queda en el perfil del fan.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### Reproductor (minirreproductor y vista ampliada)
- **Archivo de diseño:** capa que aparece sobre las demás pantallas.
- **Objetivo:** Esta pantalla existe para que el fan pueda escuchar música mientras navega. Sabemos que funciona si una canción suena, se puede pausar, se abre en grande y sigue con la cola.
- **Contenido:**
  1. Portada.
  2. Canción y artista.
  3. Barra de avance con tiempos.
  4. Controles: anterior, reproducir o pausar, siguiente.
  5. Aleatorio y bucle. **Nuevo, no está en el diseño.**
  6. Botón para abrir la cola de reproducción. **Nuevo, no está en el diseño.**
  7. Minirreproductor sobre la navegación.
- **Qué funciona de verdad:**
  - Reproducir, pausar, anterior, siguiente y mover la barra de avance: Real (audio subido por los artistas).
  - Aleatorio: Real (mezcla el orden de la cola).
  - Bucle: Real (apagado, repetir una canción o repetir toda la cola).
  - Sumar minutos de escucha al nivel: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado, más los controles nuevos aprobados por el equipo.
  - El audio suena y se pausa.
  - Al terminar una canción suena la siguiente de la cola.
  - Con bucle en «una canción», la misma canción vuelve a empezar; con bucle en «toda la cola», al terminar la última vuelve la primera.
  - El minirreproductor abre la vista ampliada.
  - Cerrar sesión detiene la música.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).
- **Decisiones del equipo (09-11-2026):**
  - Los controles van en una sola fila: aleatorio, anterior, reproducir o pausar, siguiente y bucle. El botón de la cola va arriba a la derecha.
  - Como la app son páginas separadas, al cambiar de página la canción se retoma en el mismo segundo (hay un corte breve; si el navegador no deja que suene sola, queda en pausa y se toca ▶).
  - Al tocar ▶ en una canción, la cola es esa canción y después los demás lanzamientos, del más nuevo al más viejo.

### Cola de reproducción (pantalla nueva)
- **Archivo de diseño:** no tiene diseño en el prototipo. **Diseño aprobado por el equipo (09-11-2026):** «Sonando ahora» (tarjeta con la canción actual), aviso «Aleatorio activado» cuando aplica, «A continuación» (filas con portada, nombre y artista) y un menú ⋯ en cada fila con Reproducir ahora, Subir, Bajar y Quitar. Un botón ＋ «Agregar a la cola» en las canciones de Inicio, Explorar, Nuevos lanzamientos y el perfil del artista; la canción agregada suena después de la actual (y de las agregadas antes).
- **Objetivo:** Esta pantalla existe para que el fan pueda ver y ordenar lo que va a sonar. Sabemos que funciona si cambia el orden o quita una canción y el reproductor lo respeta.
- **Contenido:**
  1. Canción que suena ahora.
  2. Lista «A continuación», cada canción con portada, nombre y artista.
  3. Cada canción se puede mover de lugar y quitar.
  4. «Agregar a la cola», desde las canciones del perfil del artista y de los lanzamientos.
- **Qué funciona de verdad:**
  - Agregar, quitar y reordenar canciones: Real (la cola queda guardada).
- **Está lista cuando:**
  - Al reordenar o quitar canciones, el reproductor sigue el nuevo orden.
  - Con aleatorio activado, la lista muestra el orden mezclado.
  - Se puede usar con el dedo en celular y con teclado.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F04 · Comunidad
- **Objetivo:** Esta pantalla existe para que el fan pueda leer las publicaciones del artista y las preguntas ya respondidas. Sabemos que funciona si abre una respuesta o pregunta algo desde aquí.
- **Contenido:**
  1. «Comunidad de …»
  2. «Escuchar lanzamiento».
  3. «Conversaciones» (publicaciones y respuestas).
  4. «Ver respuesta».
  5. «Preguntar a …»
- **Qué funciona de verdad:**
  - Ver publicaciones y respuestas: Real.
  - Escuchar una respuesta de voz: Real.
  - Preguntar: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Las respuestas de voz se pueden reproducir y pausar.
  - «Preguntar a …» lleva a «Conectar».
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F05 · Conectar con el artista
- **Objetivo:** Esta pantalla existe para que el fan pueda saber si puede preguntarle algo al artista y hacerlo. Sabemos que funciona si, con el cupo abierto y el nivel suficiente, envía o vota una pregunta.
- **Contenido** (cambia según el estado):
  1. Primer contacto si todavía no sigue al artista, o conexión si ya lo sigue.
  2. Estado del cupo: abierto, o «Cupo cerrado» con «Qué puedes hacer».
  3. Condiciones («Revisa las condiciones»: nivel mínimo y barra de progreso).
  4. «Hacer una pregunta».
  5. «Tus preguntas».
  6. «Preguntas de la comunidad», ordenadas por votos.
  7. «Volver al perfil» y «Escuchar a …»
- **Qué funciona de verdad:**
  - Estado del cupo: Real.
  - Votar una pregunta: Real.
  - Hacer una pregunta: Real.
  - Revisar requisitos: Real.
  - Primer contacto: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Muestra los tres casos del flujo: cupo cerrado, no cumple condiciones y cupo abierto.
  - Votar suma un voto, se ve marcado y reordena la lista.
  - Un fan sin el nivel mínimo no puede preguntar y ve cuánto le falta.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F05e · Escribir pregunta
- **Objetivo:** Esta pantalla existe para que el fan pueda escribir y enviar su pregunta al artista. Sabemos que funciona si la envía y la ve en cola.
- **Contenido:**
  1. «Pregunta a …»
  2. Área de texto «Tu pregunta», con contador.
  3. Botones «Enviar pregunta» y «Revisar».
- **Qué funciona de verdad:**
  - Enviar la pregunta: Real. Llega a la bandeja del artista.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - No deja enviar una pregunta vacía.
  - Al enviarla aparece un aviso flotante de confirmación.
  - La pregunta aparece en «Tus preguntas» como «en cola» y en la bandeja del artista.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F06 · Tu conexión: estado y respuesta
- **Objetivo:** Esta pantalla existe para que el fan pueda ver en qué va su pregunta y leer o escuchar la respuesta. Sabemos que funciona si ve el estado correcto y, si ya hay respuesta, la abre.
- **Contenido:**
  1. Pregunta.
  2. Estado: pregunta enviada, esperando respuesta, no seleccionada o «La respuesta de …»
  3. Respuesta en texto o nota de voz.
  4. «Volver al artista».
- **Qué funciona de verdad:**
  - Ver el estado: Real.
  - Escuchar la nota de voz: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Cada estado tiene su texto.
  - La nota de voz se reproduce y se pausa.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F07a · Perfil del fan
- **Objetivo:** Esta pantalla existe para que el fan pueda ver su actividad y sus reconocimientos. Sabemos que funciona si llega desde aquí a su recorrido, al Fan Club o a editar su perfil.
- **Contenido:**
  1. «Tu perfil»: nombre, foto y nivel.
  2. «Tus preguntas».
  3. «Reconocimientos» (incluye «Fan fundador»).
  4. «Explorar Fan Club».
  5. «Completar mi perfil».
  6. «Configuración».
  7. «Cambiar de cuenta» (decisión 12): abre el diálogo «Cambiar de cuenta».
  8. «Tus listas de Spotify» (decisión 13), solo si pegó alguna: el reproductor de Spotify con cada lista.
  9. «Artistas que sigues · N» (decisión 15): lleva a la lista de artistas que sigue.
- **Qué funciona de verdad:**
  - Datos, nivel y reconocimientos: Real.
  - Tus listas de Spotify: Real (reproductor de Spotify; no suma minutos).
  - Botones: Real (navegan).
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Los botones llevan a su pantalla.
  - La navegación inferior marca «Perfil».
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F07b · Tu recorrido
- **Objetivo:** Esta pantalla existe para que el fan pueda entender cómo sube de nivel escuchando. Sabemos que funciona si ve su nivel, cuánto le falta y qué beneficios trae.
- **Contenido:**
  1. «Cada escucha te acerca.»
  2. Nivel actual y progreso.
  3. «Nuevos beneficios».
  4. «Continuar escuchando».
- **Qué funciona de verdad:**
  - Nivel por minutos de escucha: Real (15 minutos para el nivel 1; cada nivel siguiente pide 1,5 veces lo del anterior).
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - La barra de progreso refleja los minutos escuchados hacia el siguiente nivel.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F08a · Conocer el Fan Club
- **Objetivo:** Esta pantalla existe para que el fan pueda decidir si entra al Fan Club de un artista. Sabemos que funciona si toca «Entrar al Fan Club» o «Continuar normalmente».
- **Contenido:**
  1. «Un poco más cerca.»
  2. Beneficios: «Contenido exclusivo» y «Prioridad en preguntas».
  3. Botones «Entrar al Fan Club» y «Continuar normalmente».
- **Qué funciona de verdad:**
  - Entrar al Fan Club: Real (queda guardado). Gratis en el MVP.
  - Pago: Después.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - «Entrar» lleva al contenido del Fan Club.
  - «Continuar» vuelve atrás.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F08b · Contenido del Fan Club
- **Objetivo:** Esta pantalla existe para que un miembro del Fan Club pueda ver el contenido exclusivo del artista. Sabemos que funciona si lee «Detrás de la canción».
- **Contenido:**
  1. «Fan Club de …»
  2. «Detrás de la canción.»
  3. Notas del proceso («La primera idea»).
  4. «Conectar con …»
  5. «Salir del Fan Club», con diálogo de confirmación.
- **Qué funciona de verdad:**
  - Ver el contenido: Real. Son las publicaciones que el artista marcó «Solo para el Fan Club» en «Nueva publicación».
  - Salir del Fan Club: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Solo lo ven los miembros del Fan Club.
  - «Salir» pide confirmación antes de hacerlo.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### P01 · Editar perfil del fan
- **Objetivo:** Esta pantalla existe para que el fan pueda cambiar sus datos y sus gustos. Sabemos que funciona si guarda un cambio y lo ve reflejado en su perfil.
- **Contenido:**
  1. Foto (cambiar o quitar).
  2. Nombre de perfil y nombre de usuario.
  3. Gustos musicales.
  4. Intereses.
  5. «Tus listas de Spotify» (decisión 13): hasta 3 links de listas, opcionales.
  6. «Guardar cambios».
  7. Acceso a sus preguntas («Ver respuesta», «Revisar pregunta»).
- **Qué funciona de verdad:**
  - Guardar cambios: Real.
  - Cambiar o quitar la foto: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Los cambios aparecen en el perfil al volver y siguen ahí al volver a iniciar sesión.
  - Un link que no es de una lista de Spotify muestra el error debajo de su campo y no se guarda.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### R01 · Panel del artista
- **Objetivo:** Esta pantalla existe para que el artista pueda ver de un vistazo su música, sus preguntas, su comunidad y su cupo. Sabemos que funciona si llega desde aquí a la sección que necesita.
- **Contenido:**
  1. «Tu panel de artista».
  2. Cuatro botones: Mi música · Preguntas de fans · Comunidad · Disponibilidad. Los cuatro van con borde y se ponen violeta solo al pasar el mouse, tocarlos o enfocarlos (decisión del equipo del 07-11-2026).
  3. «Tu último lanzamiento» y «Publicar lanzamiento».
  4. «Disponibilidad» (estado del cupo).
  5. «Preguntas».
  6. Navegación inferior.
- **Qué funciona de verdad:**
  - Datos del panel: Real.
  - Aviso de preguntas nuevas: Real.
  - Botones: Real (navegan).
- **Está lista cuando:**
  - Se ve igual al diseño aprobado, con los cuatro botones con borde, que se ponen violeta al pasar el mouse, tocarlos o enfocarlos.
  - Cada botón lleva a su sección.
  - Muestra el último lanzamiento y el estado del cupo reales del artista.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### R02 · Música
- **Objetivo:** Esta pantalla existe para que el artista pueda ver sus lanzamientos y publicar uno nuevo. Sabemos que funciona si abre un lanzamiento o empieza a publicar.
- **Contenido:**
  1. «Lo que estás creando.»
  2. Lista de lanzamientos.
  3. Botones «Publicar lanzamiento» y «Ver lanzamiento».
- **Qué funciona de verdad:**
  - Lista de lanzamientos: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Los botones llevan a su pantalla.
  - La navegación inferior marca «Música».
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### R03 · Publicar lanzamiento
- **Objetivo:** Esta pantalla existe para que el artista pueda subir y publicar música nueva. Sabemos que funciona si completa los datos, sube el audio y publica.
- **Contenido:**
  1. «Dale espacio a tu música.»
  2. Nombre del lanzamiento y nombre de la canción.
  3. Portada.
  4. Audio: subir archivo y «Escuchar». El diseño también tiene «Usar audio de muestra».
  5. «Publicar lanzamiento».
- **Qué funciona de verdad:**
  - Subir el audio y la portada: Real.
  - Publicar: Real (entra a la ventana de 48 h).
  - «Usar audio de muestra»: se mantiene con los datos de ejemplo (decisión 10).
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - No deja publicar sin nombre ni audio.
  - Al publicar, lleva a la pantalla del lanzamiento.
  - El lanzamiento aparece en «Nuevos lanzamientos» para los fans.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### R03b · Lanzamiento
- **Objetivo:** Esta pantalla existe para que el artista pueda ver su lanzamiento publicado y compartirlo con su comunidad. Sabemos que funciona si lo escucha o lo comparte.
- **Contenido:**
  1. «Tu música ya tiene espacio.» (recién publicado) o el título.
  2. Portada.
  3. Estado de la ventana de 48 h.
  4. «Escuchar lanzamiento».
  5. «Compartir en tu comunidad».
  6. «Eliminar lanzamiento», con confirmación.
- **Qué funciona de verdad:**
  - Escuchar: Real.
  - Compartir: Real.
  - Eliminar: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Eliminar pide confirmación y lo quita también para los fans.
  - Compartir lleva a «Nueva publicación» con el lanzamiento.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### R04 · Bandeja de preguntas
- **Objetivo:** Esta pantalla existe para que el artista pueda ver las preguntas de sus fans ordenadas por prioridad. Sabemos que funciona si abre una pregunta para revisarla.
- **Contenido:**
  1. «Preguntas».
  2. Selector: nuevas, votadas, pendientes, respondidas.
  3. Lista de preguntas con autor y votos.
  4. Mensaje cuando la bandeja está vacía.
- **Qué funciona de verdad:**
  - Recibir las preguntas de los fans: Real.
  - Cambiar de filtro: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Las preguntas se ordenan por votos y solo aparecen las de fans con el nivel mínimo.
  - Cada filtro muestra lo suyo.
  - La navegación inferior marca «Preguntas».
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### R05 · Revisar pregunta
- **Objetivo:** Esta pantalla existe para que el artista pueda decidir si responde una pregunta. Sabemos que funciona si elige responder, mantener en cola o descartar.
- **Contenido:**
  1. «Pregunta de …»
  2. Texto y votos.
  3. Aviso (por ejemplo, cupo lleno).
  4. Botones «Responder», «Mantener en cola» y «Descartar» (este último con confirmación).
  5. «Abrir cupo» si está cerrado.
- **Qué funciona de verdad:**
  - Responder, mantener en cola y descartar: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Descartar pide confirmación.
  - Cada acción cambia el estado de la pregunta, y el fan lo ve en «Tu conexión».
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### R06 · Responder (texto o nota de voz)
- **Objetivo:** Esta pantalla existe para que el artista pueda responder con texto o con su voz. Sabemos que funciona si envía la respuesta.
- **Contenido:**
  1. Pregunta.
  2. Selector «Texto» o «Nota de voz».
  3. **Texto:** «Tu respuesta» y «Enviar respuesta».
  4. **Voz:** «Tu voz también conecta.», «Grabar nota», «Grabando», «Detener grabación», «Escucha tu nota.», «Enviar nota de voz» y «Grabar de nuevo».
  5. Error de micrófono: «No pudimos grabar.», «Responder con texto» e «Intentar de nuevo».
- **Qué funciona de verdad:**
  - Grabar con el micrófono: Real.
  - Enviar la respuesta (texto o audio): Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Se puede grabar, escuchar y regrabar antes de enviar.
  - Si se niega el permiso del micrófono, aparece el estado de error.
  - El cronómetro usa el tamaño de 32 px.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### R06f · Respuesta enviada
- **Objetivo:** Esta pantalla existe para que el artista confirme que su respuesta llegó y que se avisó al fan. Sabemos que funciona si vuelve a la bandeja o ve la respuesta.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Muestra «La conexión continúa.» (como en el diseño; decisión del 14-11-2026), «Ver respuesta» y «Volver a preguntas».
  - El fan recibe la notificación en la app y en el celular.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### R06 preview · Respuesta del artista
- **Objetivo:** Esta pantalla existe para que el artista pueda ver su respuesta como la verá el fan. Sabemos que funciona si la lee o la escucha.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - La nota de voz se reproduce.
  - «Volver a preguntas» funciona.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### R07 · Comunidad del artista
- **Objetivo:** Esta pantalla existe para que el artista pueda contarle a su comunidad lo que viene. Sabemos que funciona si crea una publicación.
- **Contenido:**
  1. «Comparte lo que viene.»
  2. «Nueva publicación».
  3. Publicaciones anteriores, cada una con «Eliminar» y confirmación.
- **Qué funciona de verdad:**
  - Ver publicaciones: Real.
  - Eliminar: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Eliminar pide confirmación.
  - La navegación inferior marca «Comunidad».
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### Nueva publicación
- **Objetivo:** Esta pantalla existe para que el artista pueda escribir una publicación para su comunidad. Sabemos que funciona si la publica y aparece en su comunidad.
- **Contenido:**
  1. «Acerca tu proceso.»
  2. Área de texto «Tu publicación».
  3. Lanzamiento relacionado (si viene de compartir).
  4. Casilla «Solo para el Fan Club». **Nuevo, no está en el diseño** (usa el componente `.casilla` del kit).
  5. «Publicar».
- **Qué funciona de verdad:**
  - Publicar: Real.
  - Solo para el Fan Club: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado, más la casilla.
  - No deja publicar un texto vacío.
  - Sin la casilla, aparece en la comunidad del artista y en la que ven los fans.
  - Con la casilla, aparece solo en el contenido del Fan Club de ese artista.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### R08 · Cupos
- **Objetivo:** Esta pantalla existe para que el artista pueda controlar cuántas preguntas recibe. Sabemos que funciona si abre, cierra o reabre su cupo y ve cuántas preguntas quedan.
- **Contenido** (según el estado):
  1. «Un espacio para tu comunidad.»
  2. **Cupo abierto:** número de preguntas (32 px), progreso, «Ver preguntas» y «Cerrar cupo» (con confirmación).
  3. **Cupo completo:** «Este espacio ya se completó.» y «Abrir nuevo cupo».
  4. **Cupo cerrado:** «Todo listo para conectar.», «Abrir cupo» y «Editar cupo».
- **Qué funciona de verdad:**
  - Abrir, cerrar y completar el cupo: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado en los tres estados.
  - Cerrar pide confirmación.
  - El progreso cuenta las preguntas respondidas.
  - Con el cupo cerrado o completo, los fans ya no pueden preguntar.
  - La navegación inferior marca «Cupo».
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### Configurar cupo
- **Objetivo:** Esta pantalla existe para que el artista pueda decidir cuántas preguntas recibe y quién puede preguntar. Sabemos que funciona si guarda un cupo y lo ve abierto.
- **Contenido:**
  1. «El espacio lo decides tú.»
  2. Número de preguntas (selector de 1 a 100).
  3. «Nivel mínimo para participar».
  4. «Revisar cupo».
- **Qué funciona de verdad:**
  - Guardar la configuración: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - No acepta números fuera de 1 a 100.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### P04 · Perfil del artista (propio)
- **Objetivo:** Esta pantalla existe para que el artista pueda ver cómo lo ven sus fans y editar su información. Sabemos que funciona si llega a editar su perfil o a la configuración.
- **Contenido:**
  1. «Tu perfil»: nombre y foto.
  2. «Completar mi perfil».
  3. «Ver lanzamiento».
  4. «Configuración».
  5. «Cambiar de cuenta» (decisión 12): abre el diálogo «Cambiar de cuenta».
  6. «Tu música en Spotify» (decisión 13), solo si pegó su link: así lo ven los fans.
- **Qué funciona de verdad:**
  - Datos del perfil: Real.
  - Botones: Real (navegan).
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Los botones llevan a su pantalla.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### P02 / P03 · Editar perfil del artista
- **Objetivo:** Esta pantalla existe para que el artista pueda cambiar su identidad, su presentación, sus géneros y sus roles. Sabemos que funciona si guarda un cambio y lo ve en su perfil.
- **Contenido:**
  1. Identidad: foto, nombre artístico y usuario.
  2. Presentación, ciudad y perfil de Spotify (opcional, decisión 13).
  3. Géneros.
  4. Roles.
- **Qué funciona de verdad:**
  - Guardar cambios: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Los cambios aparecen en el perfil y los ven los fans.
  - Un link que no es de un perfil de artista de Spotify muestra el error debajo del campo y no se guarda.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F09 / R09 · Configuración
- **Archivo de diseño:** la misma pantalla para fan y artista.
- **Objetivo:** Esta pantalla existe para que cualquier persona pueda ajustar la app a su manera o salir. Sabemos que funciona si entra a un ajuste o cierra sesión.
- **Contenido:**
  1. «A tu manera.»
  2. Cuenta (decisión 14), apariencia, notificaciones y accesibilidad.
  3. «Cuentas» (decisión 12): las cuentas guardadas en este dispositivo, la activa marcada, y «Agregar otra cuenta».
  4. «Cerrar sesión».
  5. «Borrar datos de este dispositivo», con confirmación (decisión 10).
- **Qué funciona de verdad:**
  - Cuentas: Real (cambiar y agregar cuentas).
  - Cerrar sesión: Real. Saca solo la cuenta actual, solo en este dispositivo.
  - Borrar datos de este dispositivo: Real (cierra todas las cuentas y limpia el navegador; no toca Supabase).
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Cerrar sesión detiene la música; si queda otra cuenta guardada entra a esa, si no vuelve a la bienvenida.
  - Borrar datos pide confirmación.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F10 / R10 · Apariencia
- **Objetivo:** Esta pantalla existe para que cualquier persona pueda elegir la apariencia clara u oscura. Sabemos que funciona si el cambio se ve de inmediato.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Elegir claro u oscuro cambia toda la app sin perder el color del rol.
  - La elección se guarda y sigue igual al volver a iniciar sesión (Real).
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F11 / R11 · Notificaciones
- **Objetivo:** Esta pantalla existe para que cualquier persona pueda controlar sus avisos y ver los recientes. Sabemos que funciona si activa o desactiva los avisos y abre uno reciente.
- **Contenido:**
  1. «Tus avisos, bajo control.»
  2. Interruptor de avisos.
  3. «Recientes» (cada aviso lleva a su pantalla).
- **Qué funciona de verdad:**
  - Avisos dentro de la app: Real.
  - Notificaciones al celular (push): Real. Piden permiso a la persona; en iPhone solo llegan si la app se agregó a la pantalla de inicio.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Al tocar un aviso se abre su pantalla.
  - Con los avisos desactivados no llegan notificaciones al celular.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F12 / R12 · Accesibilidad
- **Objetivo:** Esta pantalla existe para que cualquier persona pueda reducir el movimiento y las transparencias. Sabemos que funciona si, al activarlas, las animaciones y el vidrio cambian.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - «Reducir movimiento» acorta las animaciones.
  - «Reducir transparencia» vuelve opaca la barra flotante.
  - La elección se guarda (Real).
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### Tu cuenta: cambiar de cuenta (diálogo nuevo, sin diseño todavía)
- **Archivo:** no es una página: es un diálogo (`.velo` + `.dialogo`) que se abre desde Perfil del fan, Perfil propio del artista y Configuración. Lo pone `js/app.js`.
- **Objetivo:** Este diálogo existe para que una persona con varias cuentas pueda pasar de una a otra sin escribir la contraseña (decisión 12). Sabemos que funciona si cambia de cuenta y llega al inicio del rol de esa cuenta.
- **Contenido:**
  1. Título «Tu cuenta».
  2. Una fila (`.fila-lista`) por cada cuenta guardada: foto (`.avatar`), nombre y «Fan» o «Artista». La activa va marcada.
  3. Solo para el artista: «Ver tu perfil» (no tiene pestaña «Perfil»).
  4. «Agregar otra cuenta»: abre Iniciar sesión sin cerrar la cuenta actual (desde ahí también se puede crear una cuenta).
  5. «Cerrar sesión»: saca la cuenta en uso (si queda otra guardada, entra a esa).
  6. Botón para cerrar el diálogo.
- **Cómo se abre:** tocando la foto de la sesión en la barra de arriba, con los botones «Cambiar de cuenta» (perfiles) o manteniendo presionada la pestaña «Perfil» del fan (decisión 12). Al soltar, la pestaña no navega.
- **Qué funciona de verdad:**
  - Lista de cuentas y cambio de cuenta: Real (sesiones de Supabase guardadas en el navegador; no se guardan contraseñas).
  - Agregar otra cuenta: Real.
- **Está lista cuando:**
  - Mantener presionado medio segundo abre el diálogo; si el dedo se mueve (para desplazar la pantalla), no se abre. El celular no muestra su menú de enlaces.
  - Al elegir otra cuenta, se detiene la música y se abre el inicio del fan o el panel del artista, con el color de ese rol.
  - Si la sesión de esa cuenta venció, lleva a Iniciar sesión con el correo ya escrito.
  - Con una sola cuenta guardada, el diálogo muestra esa cuenta y «Agregar otra cuenta».
  - Se cierra con Escape, con el botón y tocando fuera; el foco vuelve al botón que lo abrió.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### A02b · Recuperar contraseña (pantalla nueva, decisión 14)
- **Archivo:** `pages/recuperar-contrasena.html`. Sin diseño en el prototipo: formulario del kit, como Iniciar sesión.
- **Objetivo:** Esta pantalla existe para que alguien que olvidó su contraseña pueda pedir un link para crear una nueva. Sabemos que funciona si pide el link y le llega al correo.
- **Contenido:**
  1. «¿Olvidaste tu contraseña?» y la bajada.
  2. Campo de correo (con el que escribió en Iniciar sesión, si lo escribió).
  3. Botón «Enviar link» (con borde; se pinta del color del rol solo al pasar el mouse, enfocarlo o presionarlo, como en el panel del artista) y enlace «Volver a iniciar sesión».
  4. Después de enviar: «Revisa tu correo.», con la nota de buscar también en spam, y «Volver a iniciar sesión».
- **Qué funciona de verdad:**
  - Enviar el link: Real (Supabase Auth).
- **Está lista cuando:**
  - Un correo mal escrito muestra el error debajo del campo.
  - Con cualquier correo bien escrito muestra «Revisa tu correo.»: nunca dice si el correo tiene cuenta.
  - Si se pide muchas veces seguidas, explica que hay que esperar unos minutos.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### A02c · Nueva contraseña (pantalla nueva, decisión 14)
- **Archivo:** `pages/nueva-contrasena.html`. Es a donde lleva el link del correo.
- **Objetivo:** Esta pantalla existe para que la persona cree su contraseña nueva y vuelva a entrar. Sabemos que funciona si la guarda y llega al inicio de su rol.
- **Contenido:**
  1. «Crea tu nueva contraseña.»
  2. Campos «Contraseña nueva» y «Repite la contraseña» (con botón para mostrarlas).
  3. Botón «Guardar contraseña» (con borde; se pinta solo al pasar el mouse, enfocarlo o presionarlo).
  4. Si el link venció o ya se usó: «Este link ya no sirve.» y «Pedir otro link».
- **Qué funciona de verdad:**
  - Guardar la contraseña: Real. Al guardarla, entra a la cuenta y abre su inicio o su panel.
- **Está lista cuando:**
  - Pide al menos 6 caracteres y que las dos contraseñas sean iguales, con el error debajo del campo.
  - Con un link vencido muestra el estado de error y deja pedir otro.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F13 / R13 · Cuenta (pantalla nueva, decisión 14)
- **Archivo:** `pages/cuenta.html`. La misma para fan y artista (toma el color del rol), como las demás de Configuración.
- **Objetivo:** Esta pantalla existe para que la persona pueda cambiar su correo y su contraseña. Sabemos que funciona si cambia uno de los dos y puede entrar con el dato nuevo.
- **Contenido:**
  1. «Tu cuenta.» y la bajada.
  2. «Correo»: el correo actual, campo «Correo nuevo» y «Cambiar correo».
  3. «Contraseña»: campos «Contraseña actual» y «Contraseña nueva», y «Cambiar contraseña».
  4. «Eliminar cuenta»: qué se borra y «Eliminar mi cuenta» (`.boton--peligro`), con un diálogo que pide la contraseña.
- **Qué funciona de verdad:**
  - Cambiar el correo: Real. Llega un link al correo nuevo; el cambio se aplica al abrirlo.
  - Cambiar la contraseña: Real. Primero revisa la contraseña actual.
  - Eliminar la cuenta: Real (supabase/cambio-08-eliminar-cuenta.sql). Borra la cuenta, el perfil y todo lo suyo, y sus archivos.
- **Está lista cuando:**
  - Un correo mal escrito, igual al actual o que ya tiene cuenta muestra el error debajo del campo.
  - Una contraseña actual incorrecta muestra el error y no cambia nada.
  - Eliminar pide la contraseña; con una incorrecta no borra nada. Al eliminar, la persona sale de la cuenta y ya no puede entrar con ese correo.
  - Al terminar aparece un aviso flotante de confirmación.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### 404 · Página no encontrada (pantalla nueva, decisión 14)
- **Archivo:** `404.html`, en la raíz. Vercel la muestra sola cuando un link no existe.
- **Objetivo:** Esta pantalla existe para que quien abre un link roto no se pierda. Sabemos que funciona si vuelve a Looped desde aquí.
- **Contenido:**
  1. Logo.
  2. «No encontramos esta página.» y la bajada.
  3. Botón «Ir a Looped».
- **Está lista cuando:**
  - Un link que no existe en Vercel muestra esta página con los estilos de Looped (claro u oscuro, según la preferencia guardada).
  - «Ir a Looped» abre la app.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F07c · Artistas que sigues (pantalla nueva, decisión 15)
- **Archivo:** `pages/siguiendo-fan.html`.
- **Objetivo:** Esta pantalla existe para que el fan vea juntos a los artistas que sigue y vuelva a ellos. Sabemos que funciona si abre el perfil de uno desde aquí.
- **Contenido:**
  1. «Artistas que sigues.» y cuántos son.
  2. Tarjetas de los artistas (foto, nombre y estado del cupo), ordenadas por nombre.
  3. Si no sigue a nadie: «Todavía no sigues a nadie.» y «Explorar artistas».
- **Qué funciona de verdad:**
  - Lista de artistas que sigue: Real.
- **Está lista cuando:**
  - Cada tarjeta abre el perfil del artista; al dejar de seguirlo allí, ya no aparece aquí.
  - La navegación inferior marca «Perfil».
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).
