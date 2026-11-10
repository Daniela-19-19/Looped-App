# Decisiones del design kit

Resumen de lo que decidimos para el design kit de Looped. El análisis completo, fila por fila, está en `auditoria-design-kit.md`; los números entre paréntesis son las filas de esa auditoría.

Cuando cambie algo del kit, se anota aquí: qué cambió, por qué y en qué fecha.

## Fuentes

- **Títulos y botones:** Neulis Neue Medium (500). **Lectura y etiquetas:** Neue Haas Unica Regular (400) y Medium (500). (18–20)
- Se cargan desde **Adobe Fonts**, proyecto web `https://use.typekit.net/mgo6vlr.css`, al inicio de `css/tokens.css`.
- Respaldo de **Google Fonts**: Outfit (títulos) y Manrope (texto). El navegador solo los usa si Adobe no carga.
- Respaldo final: Arial.
- **Excepción aprobada (03-11-2026):** las fuentes de la marca se cargan desde Adobe Fonts y no desde Google Fonts ni desde `assets/fuentes/`, porque Neulis Neue y Neue Haas Unica no están en Google Fonts. Se comprobó que el proyecto web `mgo6vlr` carga desde cualquier dominio, incluido Vercel, sin registrarlo. Pendiente: revisarlo en la app publicada. Si Adobe falla, se usan Outfit y Manrope de Google Fonts.

## Color

- **Dos temas por rol:** violeta para artista y turquesa para fan. Con el turquesa, el texto encima va oscuro. (8)
- **Dos apariencias:** oscura y clara. La clara usa los valores del manual: `#F7F6FA`, `#1B1723`, `#625C6D` y superficies blancas. (16)
- **Coral `#FF6848` = solo reconocimiento** (Fan Club, insignias, avisos nuevos). En el kit se llama `--color-secundario`. (10)
- **Error con color propio:** `#FF5468` en oscuro y `#C8233A` en claro. Contraste de al menos 5,2 a 1. (10)
- **Sin color de éxito** hasta que una pantalla lo necesite.
- **Foco del artista `#B07BFF`:** se mantiene, pero falta agregarlo al manual. (72)
- **Accesibilidad desde la app** (decisión del equipo del 2026-11-10): además de lo que pide el sistema del dispositivo, la persona puede elegir en Accesibilidad (F12). `data-movimiento="reducido"` en `<html>` deja en 0 las duraciones (como `prefers-reduced-motion`). `data-transparencia="reducida"` vuelve sólido el vidrio: `--color-vidrio` toma el color de `--color-superficie` y el desenfoque queda en 0.

## Tipografía

- Escala del manual, sin tamaños extra:
  - `--texto-xs` 12/16
  - `--texto-sm` 14/20
  - `--texto-base` 16/24
  - `--texto-lg` 20/28
  - `--texto-xl` 24/32
  - `--texto-2xl` 32/40
- Los títulos de 18 px pasan a 20 px. (22)
- Todos los botones van a 16 px. (24)
- Las pestañas pasan de 11 a 12 px, el mínimo de la marca. (27)
- Los números grandes (cupo y cronómetro) bajan a 32 px. (28)

## Forma y medidas

- **Espacios** de 4 en 4 px: `--espacio-1` (4) a `--espacio-8` (32). (29–35)
- **Radios:**
  - `--radio-xs` 8: casillas.
  - `--radio-sm` 12: portadas pequeñas.
  - `--radio-md` 16: fotos.
  - `--radio-lg` 24: tarjetas, área de texto y avisos flotantes.
  - `--radio-xl` 32: diálogos.
  - `--radio-total`: cápsulas y círculos.
- Los elementos flotantes pasan de 20 a 24 px. (36–44)
- **Bordes** dibujados siempre con sombra interior de 1 px, para que el tamaño no cambie al marcar o enfocar. (46)
- **Sombras:** `--sombra-suave` para la barra flotante, los avisos y el diálogo; `--sombra-media` para la portada del reproductor. (47)
- **Altura de controles:** 48 px. El selector deja de medir 44 y pasa a 48. (50)

## Componentes

- **Elegido:** chips y selectores marcan lo elegido igual, con borde y fondo tenue del color del rol. (60)
- **Íconos:** 24 px y 20 px; el de 22 px desaparece. (63)
- **Portadas:** la de 46 px pasa a 48. (64)
- **Botones del panel del artista:** los cuatro van con borde y se rellenan de acento solo al pasar el mouse, tocarlos o enfocarlos (`.boton--secundario.boton--rellenar`). Decisión del equipo del 07-11-2026; antes eran los cuatro rellenos, y después solo «Mi música». (70)
- **Logo:** blanco puro en oscuro y negro puro en claro. La firma mide al menos 144 px de ancho. (68, 69)
- **Logo animado** (`.logo-animado`): solo en el splash, a 240 px. Con «reducir movimiento», aparece quieto.
- **Logo mediano** (`.logo--medio`): 200 px, en la bienvenida.
- **Atmósferas** (`.atmosfera`): violeta sin rol y para artista; turquesa y azul para fan; más suaves en claro. El violeta oscuro queda en una sola transparencia, `.35`. Variantes inferior (bienvenida), lateral (formularios, desde iniciar sesión) y centro (una sola mancha, en elegir experiencia) y superior (pantallas con barra de marca, desde el panel del artista). (11)
- **Campo con botón** (`.campo__grupo` + `.campo__boton`): botón de ícono relleno dentro del campo, para mostrar u ocultar la contraseña. Usa los íconos `ver` y `ocultar`.
- **Ancho de pantalla** (`--ancho-pantalla`): 440 px como máximo para los formularios y para el contenido en celular.
- **Responsive: barra lateral + rejillas** (decisión del equipo del 07-11-2026). Tablet desde 768 px: contenido hasta 720 px (`--ancho-pantalla-media`) y tarjetas en 2 columnas. Computador desde 1024 px: la navegación se vuelve barra lateral de 240 px (`--ancho-barra-lateral`, `.navegacion--adaptable`), contenido hasta 1200 px (`--ancho-pantalla-amplia`), tarjetas en 2 o 3 columnas (`.rejilla-tarjetas`) y títulos un paso más grandes (`--texto-3xl`, 40 px). Los formularios siguen angostos y se centran a lo alto.
- **Selector de foto** (`.selector-foto`): avatar de 64 px con «Foto de perfil» al lado; toda la fila abre la galería. Al pasar el mouse, el círculo toma el borde del color del rol.
- **Contador de caracteres** (`.campo__contador`): «0/160» en 12 px, gris y a la derecha, debajo del área de texto.
- **Grupo de casillas** (`.casillas`): un `<fieldset>` sin borde; una columna, o dos con `.casillas--dos-columnas` (géneros).
- **Cabecera de tarjeta** (`.tarjeta__cabecera`): foto a la izquierda y nombre con detalle a la derecha; los textos largos se parten.
- **Grupo de etiquetas** (`.etiquetas`): etiquetas en fila con 8 px entre ellas; pasan a la línea siguiente si no caben.
- **Aviso en la navegación** (`.navegacion__aviso`): punto coral de 8 px sobre el ícono cuando hay novedades; el `aria-label` de la pestaña dice cuántas.
- **Encabezado de tarjeta** (`.tarjeta__encabezado`) y **votos** (`.votos`, ícono `votos`): para las preguntas («Lucía · Fan Club | ♥ 6») y el cupo («Preguntas abiertas | 3 de 5»). El ícono `votos` es el mismo corazón de `cupo`, con nombre propio para que el código se entienda.
- **Enlaces con forma de chip o tarjeta:** `.chip` y `.tarjeta--tocable` pueden ser `<a>` sin subrayado. En `.tarjeta--fila`, el texto va en `.tarjeta__info`.
- **Chips a 48 px de alto** (antes 36): cumplen el área táctil mínima de la revisión responsive.
- **Menú desplegable** (`.desplegable`, `.menu`, `.menu__opcion`): vidrio como la navegación, opciones de 48 px y ✓ en la elegida; se cierra al tocar fuera o con Esc. Ícono `filtro`. El buscador puede llevar una ✕ para borrar lo escrito.
- **Reproductor** (`.reproductor`, `.reproductor--abierto`): vista ampliada que sube desde abajo y cubre la pantalla. Decisión del equipo (2026-11-09): los cinco controles en una fila (aleatorio, anterior, reproducir o pausar, siguiente, bucle) y la cola arriba a la derecha, en la barra superior.
- **Minirreproductor** (`.minirreproductor`): cápsula de vidrio sobre la navegación; en computador va abajo, a la derecha de la barra lateral.
- **Barra de avance** (`.avance`): control deslizante con los tiempos; lo avanzado se pinta con la variable `--avance`.
- **Botón de ícono prendido** (`.boton-icono[aria-pressed="true"]`): se rellena del color del rol (aleatorio y bucle). Se usa relleno y no solo color de ícono porque el turquesa sobre blanco no tiene contraste suficiente.
- **Íconos** `cancion-anterior`, `cancion-siguiente`, `aleatorio`, `bucle`, `bucle-una`, `cola` y `bajar`; `opciones` (⋯) para el menú de cada canción en la cola.

## Historial de cambios

| fecha | cambio | por qué |
|---|---|---|
| 2026-11-01 | Primera versión del kit: `css/tokens.css`, `css/components.css` y `componentes.html` | Decisiones de la auditoría y del manual de marca |
| 2026-11-03 | Logo animado, color del logo, color del brillo y tiempos de la animación | Construcción del splash (A00) |
| 2026-11-03 | Logo mediano, atmósfera inferior y ancho de pantalla | Construcción de la bienvenida (A01) |
| 2026-11-07 | Atmósfera lateral, campo con botón e ícono «ocultar» | Construcción de iniciar sesión (A02) |
| 2026-11-07 | Atmósfera centro | Construcción de elegir experiencia (A03) |
| 2026-11-07 | Botón que se rellena al pasar (`.boton--rellenar`) | Pedido del equipo: en elegir experiencia, cada opción se pinta del color de su rol (turquesa o violeta) |
| 2026-11-07 | Selector de foto (`.selector-foto`) | Construcción de identidad del artista (A05r) y perfil básico del fan (A05f) |
| 2026-11-07 | Contador de caracteres (`.campo__contador`) | Construcción de presentación (A06r); también lo usará escribir pregunta (F05e) |
| 2026-11-07 | Grupo de casillas (`.casillas`, `.casillas--dos-columnas`) | Construcción de estilo musical (A07r) y gustos musicales (A06f) |
| 2026-11-07 | Cabecera de tarjeta (`.tarjeta__cabecera`) y grupo de etiquetas (`.etiquetas`) | Construcción de perfil listo del artista (A09r) y del fan (A08f) |
| 2026-11-07 | Atmósfera superior, aviso en la navegación, encabezado de tarjeta, texto principal de tarjeta, votos e ícono `votos` | Construcción del panel del artista (R01) |
| 2026-11-07 | Ícono `pausa`; `.chip` y `.tarjeta--tocable` como enlaces; `.tarjeta--fila > .tarjeta__info` | Construcción del inicio del fan (F01a) |
| 2026-11-07 | Chips de 36 a 48 px de alto | Revisión responsive: área táctil mínima de 48 px |
| 2026-11-07 | Responsive: tokens de ancho, títulos más grandes en computador, navegación adaptable (barra lateral) y rejilla de tarjetas | Pedido del equipo: la app debe aprovechar tablet y computador |
| 2026-11-07 | Panel del artista: solo «Mi música» relleno, los otros tres con borde | Pedido del equipo |
| 2026-11-07 | Menú desplegable, ícono `filtro` y ✕ del buscador | Construcción de explorar (F01b) |
| 2026-11-07 | Panel del artista: los cuatro botones con borde, morados solo al pasar, tocar o enfocar; `.boton--rellenar` también se rellena al presionar | Pedido del equipo |
| 2026-11-07 | Íconos `audio` e `imagen` | Construcción de publicar lanzamiento (R03) |
| 2026-11-09 | Reproductor, minirreproductor, barra de avance, botón de ícono prendido e íconos del reproductor | Construcción del reproductor (tramo 4) |
| 2026-11-09 | Ícono `opciones` (⋯) | Construcción de la cola de reproducción (menú en cada fila, aprobado por el equipo) |
| 2026-11-10 | Accesibilidad desde la app: `data-movimiento="reducido"` y `data-transparencia="reducida"`, con sus selectores en componentes.html | Construcción de accesibilidad (F12 / R12): «Reducir movimiento» y «Reducir transparencia» |
