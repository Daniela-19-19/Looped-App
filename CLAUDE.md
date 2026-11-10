## Qué es este proyecto
Looped: una app de música con espacios de conversación que el artista controla, para artistas independientes que quieren acercarse a sus fans sin perder el control de su tiempo. Es el MVP de un equipo del curso Lenguajes Digitales 3. Más contexto en README.md.

## Documentos que debes leer antes de construir
- spec.md: qué se construye (flujo, datos y pantallas). Si no existe o algo no está ahí, pregunta antes de inventar.
- css/tokens.css y css/components.css: el design kit. componentes.html (en la raíz) muestra todos los componentes.

## Tecnología (no cambiar sin preguntar)
- HTML, CSS y JavaScript puro. Sin frameworks ni librerías (nada de React, Vue, Tailwind ni TypeScript) y sin paso de compilación: todo debe funcionar abriendo los archivos en el navegador.
- La app se publicará en Vercel, conectada a este repositorio.
- La base de datos es Supabase: cuentas, música, preguntas y todo lo demás se guardan ahí de verdad. Los datos de ejemplo (Mara Sol y los demás artistas) son solo los datos iniciales.

## Estructura del proyecto
- disenos/: diseños originales. Solo de referencia: nunca los modifiques.
- assets/: todas las imágenes, logos e íconos de la app. Usa siempre las de aquí, nunca links de imágenes de internet.
- css/: estilos. tokens.css (decisiones base), components.css (componentes) y styles.css (estilos generales de las pantallas).
- js/: código. app.js (comportamiento) y data.js (datos de ejemplo iniciales, separados del diseño).
- index.html: la pantalla de inicio, la puerta de entrada de la app. Las demás pantallas van en la carpeta pages/.
- componentes.html: en la raíz, junto a index.html. Muestra todos los componentes del design kit.
- Nombres de archivos y carpetas: minúsculas, sin tildes, ñ ni espacios, con guiones.

## Reglas de trabajo
1. Antes de crear o modificar archivos, explica tu plan en pocas líneas y espera aprobación.
2. Trabaja una pantalla o una función a la vez.
3. Usa solo los tokens y componentes del design kit. Si necesitas un estilo o componente que no existe, pregunta: primero se agrega al kit y a componentes.html, y después se usa.
4. Nunca escribas claves, contraseñas ni tokens de acceso en el código: este repositorio es público.
5. Si algo que te pedimos contradice spec.md, avísanos antes de hacerlo.
6. Al terminar cada tarea, explica en lenguaje simple qué cambiaste y por qué. Somos un equipo aprendiendo.
7. Antes de cada comando de git, explica en una frase qué hace.

## Componentes disponibles
Definidos en css/components.css y mostrados en componentes.html (ahí está el HTML completo de cada uno). Decisiones en decisiones-design-kit.md.
- Rol y apariencia: en `<html>` usa `data-rol="fan"` o `data-rol="artista"`, y `data-tema="claro"` para el tema claro (sin el atributo, la apariencia es oscura).
- Tamaños de pantalla: celular (menos de 768 px), tablet (768 px o más) y computador (1024 px o más). Las pantallas con navegación usan `.pantalla--con-navegacion` y la navegación `.navegacion--adaptable`; los formularios quedan en una columna angosta. Ver «Criterios para todas las pantallas» en spec.md.
- Íconos: copia el bloque `<svg>` con los `<symbol>` del inicio de componentes.html y usa `<svg class="icono" aria-hidden="true"><use href="#icono-atras"></use></svg>`. Variante: `.icono--pequeno`. Para mostrar u ocultar: `#icono-ver` y `#icono-ocultar`. Votos: `#icono-votos`. Reproducir y pausar: `#icono-reproducir` y `#icono-pausa`. Filtros: `#icono-filtro`. Archivos: `#icono-audio` y `#icono-imagen`. Archivos de referencia en assets/iconos/.
- Texto: `.titulo` (32), `.titulo--medio` (24), `.titulo--pequeno` (20), `.texto`, `.texto--pequeno`, `.texto--suave`, `.rotulo`, `.rotulo--pequeno`. Ej.: `<h1 class="titulo">Descubre</h1>`
- `.logo` con `.logo--blanco` y `.logo--negro` (pon las dos imágenes; el CSS muestra la correcta). Ej.: `<img class="logo logo--blanco" src="assets/logo-firma-blanco.svg" alt="Looped">`
- `.boton` (principal), `.boton--secundario`, `.boton--terciario`, `.boton--peligro`, `.boton--pequeno`, `.boton--bloque`, `.boton--rellenar` (con `.boton--secundario`: se llena del color del rol al pasar el mouse, enfocarlo o presionarlo; con `data-rol="fan"` o `"artista"` en el botón toma el color de ese rol). Ej.: `<button type="button" class="boton boton--bloque">Continuar</button>`
- `.boton-icono`, `.boton-icono--borde`, `.boton-icono--relleno`, `.boton-icono--pequeno`, `.boton-icono--grande` (siempre con `aria-label`). Ej.: `<button type="button" class="boton-icono" aria-label="Volver">…ícono…</button>`
- `.enlace`. Ej.: `<a class="enlace" href="#">Ver más</a>`
- `.barra-superior` + `.barra-superior__titulo`. Ej.: `<header class="barra-superior">botón volver · <h1 class="barra-superior__titulo">Tu música</h1> · <span></span></header>`
- `.barra-marca` + `.barra-marca__acciones` (+ `.barra-marca__logo` en el `<span>` del logo, que en computador se oculta porque el logo pasa a la barra lateral). Ej.: `<header class="barra-marca"><span>logos</span><div class="barra-marca__acciones">botones</div></header>`
- `.encabezado-pagina` + `.encabezado-pagina__bajada`. Ej.: `<div class="encabezado-pagina"><h1 class="titulo">Descubre</h1><p class="encabezado-pagina__bajada">…</p></div>`
- `.encabezado-seccion` + `.encabezado-seccion__titulo`. Ej.: `<div class="encabezado-seccion"><h2 class="encabezado-seccion__titulo">Tus preguntas</h2><a class="enlace" href="#">Ver más</a></div>`
- `.rejilla-tarjetas`, `.rejilla-tarjetas--dos`: tarjetas en 1, 2 o 3 columnas según el ancho. Ej.: `<div class="rejilla-tarjetas">…tarjetas…</div>`
- `.tarjeta` (`__titulo`, `__texto`, `__meta`, `__acciones`, `__info`, `__cabecera`: foto + nombre en fila, `__encabezado`: izquierda y derecha, p. ej. autor y votos; `__texto--principal`: texto grande y claro, p. ej. una pregunta), `.tarjeta--tocable`, `.tarjeta--fila`, `.tarjeta--acento`, `.tarjeta--destacada`, `.tarjeta--persona`. Ej.: `<div class="tarjeta"><h3 class="tarjeta__titulo">Preguntas abiertas</h3><p class="tarjeta__texto">…</p></div>`
- `.aviso`, `.aviso--advertencia`. Ej.: `<div class="aviso">ícono<p>Mensaje</p></div>`
- `.velo` + `.dialogo` (`__titulo`, `__texto`, `__acciones`). Ej.: `<div class="velo" hidden><div class="dialogo" role="dialog" aria-modal="true">…</div></div>`
- `.navegacion` + `.navegacion__pestana` (+ `.navegacion__aviso`: punto de novedades; `.navegacion--adaptable` + `.navegacion__marca`: en computador se vuelve barra lateral con logo) (la actual con `aria-current="page"`). Ej.: `<nav class="navegacion"><a class="navegacion__pestana" href="#" aria-current="page">ícono<span>Inicio</span></a>…</nav>`
- `.campo` (`__etiqueta`, `__control`, `__ayuda`, `__mensaje-error`, `__contador`), `.campo--error`, `.area-texto`. Ej.: `<label class="campo"><span class="campo__etiqueta">Correo</span><input class="campo__control" type="email"></label>`
- Campo con botón adentro (mostrar la contraseña): `.campo__grupo` + `.campo__boton`. Ej.: `<div class="campo"><label class="campo__etiqueta" for="clave">Contraseña</label><div class="campo__grupo"><input class="campo__control" id="clave" type="password"><button type="button" class="boton-icono boton-icono--relleno campo__boton" aria-label="Mostrar contraseña">ícono</button></div></div>`
- `.atmosfera` (manchas de fondo, primer hijo de `.pantalla`): `.atmosfera--inferior`, `.atmosfera--lateral`, `.atmosfera--centro`, `.atmosfera--superior`. Ej.: `<div class="atmosfera atmosfera--lateral" aria-hidden="true"></div>`
- `.buscador` (con ✕ opcional: un `.boton-icono--pequeno` adentro). Ej.: `<label class="buscador">ícono<input type="search" aria-label="Buscar"></label>`
- `.desplegable` + `.menu` + `.menu__opcion` (menú que se abre debajo de un botón; la opción elegida lleva `aria-checked="true"`). Ej.: `<div class="desplegable"><button class="boton-icono boton-icono--relleno" aria-haspopup="true" aria-expanded="false" aria-label="Filtros">…</button><div class="menu" role="menu" hidden><button class="menu__opcion" role="menuitemradio" aria-checked="false">Pop ícono check</button></div></div>`
- `.casilla` + `.casilla__caja`. Ej.: `<label class="casilla"><input type="checkbox"><span class="casilla__caja">ícono check</span>Indie</label>`
- `.casillas` (un `<fieldset>` que agrupa casillas), `.casillas--dos-columnas`. Ej.: `<fieldset class="casillas casillas--dos-columnas" aria-labelledby="id-del-titulo">…casillas…</fieldset>`
- `.chips` + `.chip`, y `.selector` (con `.boton--secundario` dentro); lo elegido lleva `aria-pressed="true"`. Ej.: `<button type="button" class="chip" aria-pressed="true">Emergentes</button>`
- `.votos` (corazón con número). Ej.: `<span class="votos" aria-label="6 votos"><svg class="icono icono--pequeno" aria-hidden="true"><use href="#icono-votos"></use></svg>6</span>`
- `.etiquetas` (grupo en fila). `.etiqueta`, `.etiqueta--acento`, `.etiqueta--reconocimiento`, `.etiqueta--borde`. Ej.: `<span class="etiqueta etiqueta--reconocimiento">Fan fundador</span>`
- `.avatar`, `.avatar--pequeno`, `.avatar--grande`, `.avatar--acento`. Ej.: `<span class="avatar"><img src="assets/mara-sol.jpg" alt=""></span>`
- `.selector-foto` (`__entrada`, `__titulo`, `__texto`) con un `.avatar--grande` adentro: foto de perfil opcional. Ej.: `<label class="selector-foto"><input class="selector-foto__entrada" type="file" accept="image/*"><span class="avatar avatar--grande">iniciales o img</span><span><span class="selector-foto__titulo">Foto de perfil</span><span class="selector-foto__texto">Puedes añadirla después.</span></span></label>`
- `.portada`, `.portada--pequena`, `.portada--mediana`. Ej.: `<img class="portada portada--mediana" src="assets/portada-segundo-sol.jpg" alt="Portada de Segundo sol">`
- `.fila-lista` (`__info`, `__titulo`, `__detalle`). Ej.: `<button class="fila-lista">portada<span class="fila-lista__info"><b class="fila-lista__titulo">Segundo sol</b><span class="fila-lista__detalle">Mara Sol</span></span></button>`
- `.progreso` + `.progreso__barra`, `.progreso--fino`. Ej.: `<div class="progreso"><span class="progreso__barra" style="width: 60%"></span></div>`
- `.minirreproductor` (`__abrir`, `__info`, `__titulo`, `__detalle`, `__progreso`) y `.reproductor` (`--abierto`, `__cuerpo`, `__portada`, `__info`, `__detalle`, `__controles`, `__nota`) con `.avance` (`__control`, `__tiempos`). Los pone js/app.js en las pantallas con navegación; el HTML completo está en componentes.html. Íconos: `#icono-cancion-anterior`, `#icono-cancion-siguiente`, `#icono-aleatorio`, `#icono-bucle`, `#icono-bucle-una`, `#icono-cola`, `#icono-bajar`. Opciones (⋯) de una fila: `#icono-opciones`. Un `.boton-icono` con `aria-pressed="true"` se rellena del color del rol.
- `.toast` + `.toast__texto`. Ej.: `<div class="toast" role="status"><p class="toast__texto">Pregunta enviada.</p></div>`
