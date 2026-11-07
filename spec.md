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
10. **Datos de ejemplo** (Mara Sol, Río Lento, Nadia Cruz, Los Faroles y sus lanzamientos y preguntas): se mantienen por ahora como datos iniciales, igual que la opción «Borrar datos de la demostración».

11. **Fan Club, lo más sencillo posible:**
    - Entrar es gratis en el MVP. El cobro (suscripción) queda para Después.
    - El contenido exclusivo lo crea el artista desde «Nueva publicación», marcando la casilla «Solo para el Fan Club». No hace falta una pantalla nueva.

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

## Flujo

**Entrada (común)**
splash → bienvenida → ¿ya tienes cuenta?
- **Sí:** iniciar sesión → el inicio de su rol: el fan va a su inicio y el artista a su panel.
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
- perfil del fan → tu recorrido (nivel) · Fan Club (conocer → contenido) · editar perfil · configuración.

**Flujo artista** (navegación inferior: Música · Preguntas · Comunidad · Cupo)
- panel → música → publicar lanzamiento → lanzamiento publicado (entra a la ventana de 48 h).
- panel → bandeja de preguntas → revisar pregunta → ¿responder?
  - **No:** mantener en cola o descartar.
  - **Sí:** responder con texto o nota de voz → respuesta enviada (se notifica al fan) → ver la respuesta.
- panel → comunidad → nueva publicación (para todos o solo para el Fan Club).
- panel → cupo → configurar cupo → abrir cupo → cupo activo → recibir preguntas y votos hasta completarlo → cupo completo o cerrado → abrir nuevo cupo.
- panel → perfil propio → editar perfil · configuración.

**Compartidas por los dos perfiles**
configuración → apariencia · notificaciones · accesibilidad · cerrar sesión (detiene la música y vuelve a bienvenida).

**Nivel del fan** (en segundo plano): los minutos de escucha suben el nivel (15 minutos el primero, y cada nivel pide 1,5 veces más que el anterior) → nuevos beneficios → invitación al Fan Club.

## Datos

Lo que la app muestra o guarda, tal como aparece en los diseños. Todo se guarda en Supabase.

**fans**: nombre de perfil, nombre de usuario, correo, contraseña, foto, gustos musicales (géneros), intereses, minutos de escucha acumulados (definen el nivel), artistas que sigue, Fan Clubs a los que pertenece, artistas de los que es fan fundador, fecha de registro.

**artistas**: nombre artístico, nombre de usuario, correo, contraseña, foto, presentación, ciudad (opcional), géneros, roles (solista, compositor, productor, integrante de banda…), número de seguidores, si es emergente.

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
- Se ve bien en 320 px (celular pequeño), 375 px (celular), 768 px (tablet) y 1280 px (computador), y al arrastrar el borde de la ventana entre esos anchos.
- No aparece barra de desplazamiento horizontal.
- Ningún texto se corta, se sale de su caja ni queda encima de otro elemento.
- Los botones y enlaces miden al menos 48 px de alto y no quedan pegados entre sí.
- Con zoom al 200 % todo se sigue leyendo y usando.
- En celular, al abrir el teclado, el campo que se escribe y el botón principal se pueden alcanzar.
- En computador, el contenido queda en una columna centrada de máximo 440 px (`--ancho-pantalla`); no se estira de lado a lado.
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
- **Qué funciona de verdad:**
  - Iniciar sesión: Real. La app reconoce si la cuenta es de fan o de artista: el fan llega a su inicio y el artista a su panel.
  - Mostrar u ocultar la contraseña: Real.
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
  - Muestra «Tu espacio está listo.» con su nombre, y los botones «Ir a mi panel», «Escuchar» y «Ver mi recorrido».
  - «Ir a mi panel» lleva al panel del artista.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F01a · Inicio (fan)
- **Objetivo:** Esta pantalla existe para que el fan pueda descubrir artistas y lanzamientos nuevos y retomar sus conexiones. Sabemos que funciona si desde aquí llega al perfil de un artista o a escuchar un lanzamiento.
- **Contenido:**
  1. Barra de marca: logo, tema y perfil.
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
- **Qué funciona de verdad:**
  - Escuchar: Real.
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
- **Nota:** el reproductor, el minirreproductor y los íconos de aleatorio, bucle y cola no están todavía en el design kit. Hay que agregarlos al kit y a `componentes.html` antes de construirlo.

### Cola de reproducción (pantalla nueva)
- **Archivo de diseño:** no tiene diseño todavía. El equipo debe diseñarla o aprobarla antes de construirla.
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
- **Qué funciona de verdad:**
  - Datos, nivel y reconocimientos: Real.
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
  5. «Guardar cambios».
  6. Acceso a sus preguntas («Ver respuesta», «Revisar pregunta»).
- **Qué funciona de verdad:**
  - Guardar cambios: Real.
  - Cambiar o quitar la foto: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Los cambios aparecen en el perfil al volver y siguen ahí al volver a iniciar sesión.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### R01 · Panel del artista
- **Objetivo:** Esta pantalla existe para que el artista pueda ver de un vistazo su música, sus preguntas, su comunidad y su cupo. Sabemos que funciona si llega desde aquí a la sección que necesita.
- **Contenido:**
  1. «Tu panel de artista».
  2. Cuatro botones rellenos: Mi música · Preguntas de fans · Comunidad · Disponibilidad.
  3. «Tu último lanzamiento» y «Publicar lanzamiento».
  4. «Disponibilidad» (estado del cupo).
  5. «Preguntas».
  6. Navegación inferior.
- **Qué funciona de verdad:**
  - Datos del panel: Real.
  - Aviso de preguntas nuevas: Real.
  - Botones: Real (navegan).
- **Está lista cuando:**
  - Se ve igual al diseño aprobado, con los cuatro botones rellenos de violeta.
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
  - Muestra «La conversación continúa.», «Ver respuesta» y «Volver a preguntas».
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
  2. Presentación y ciudad.
  3. Géneros.
  4. Roles.
- **Qué funciona de verdad:**
  - Guardar cambios: Real.
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Los cambios aparecen en el perfil y los ven los fans.
  - Funciona en celular (375 px) y en computador (1280 px), sin romperse en los anchos de en medio (ver «Criterios para todas las pantallas»).

### F09 / R09 · Configuración
- **Archivo de diseño:** la misma pantalla para fan y artista.
- **Objetivo:** Esta pantalla existe para que cualquier persona pueda ajustar la app a su manera o salir. Sabemos que funciona si entra a un ajuste o cierra sesión.
- **Contenido:**
  1. «A tu manera.»
  2. Apariencia, notificaciones y accesibilidad.
  3. «Cerrar sesión».
  4. «Borrar datos de la demostración», con confirmación.
- **Qué funciona de verdad:**
  - Cerrar sesión: Real.
  - Borrar datos de la demostración: se mantiene por ahora (decisión 10).
- **Está lista cuando:**
  - Se ve igual al diseño aprobado.
  - Cerrar sesión detiene la música y vuelve a la bienvenida.
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
