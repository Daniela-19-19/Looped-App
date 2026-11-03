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
- **Botones del panel del artista:** los cuatro rellenos de acento, como en el manual. (70)
- **Logo:** blanco puro en oscuro y negro puro en claro. La firma mide al menos 144 px de ancho. (68, 69)
- **Fuera del kit por ahora:** reproductor, minirreproductor y atmósferas de fondo. Se agregan cuando se construyan esas pantallas.

## Historial de cambios

| fecha | cambio | por qué |
|---|---|---|
| 2026-11-01 | Primera versión del kit: `css/tokens.css`, `css/components.css` y `componentes.html` | Decisiones de la auditoría y del manual de marca |
