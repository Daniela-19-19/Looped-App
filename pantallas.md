# Pantallas de Looped

Seguimiento de la construcción. Los tramos y las pantallas siguen el «Orden de construcción» de `spec.md`; el detalle de cada una (contenido, qué es Real y «Está lista cuando») está en su sección de `spec.md`. El diseño de todas está en `disenos/prototipo.html`.

**Columnas:**
- **Con kit:** la página está construida con `css/tokens.css`, `css/components.css` y `css/styles.css`.
- **Datos en data.js:** los datos que muestra salen de `js/data.js` (a través de `obtenerDatos()`). «—» si la pantalla no muestra datos.
- **Revisada vs spec:** la marca el equipo cuando aprueba la pantalla.

## Revisión responsive (para cada pantalla)

Antes de marcar «Revisada vs spec», abran la pantalla en el navegador, presionen Cmd + Opción + I y después Cmd + Shift + M (vista de dispositivo), y repasen esta lista. Es la misma de «Criterios para todas las pantallas» en `spec.md`.

- [ ] 320 px: nada se corta ni se monta.
- [ ] 375 px: se ve igual al diseño.
- [ ] 768 px: se adapta sin huecos raros.
- [ ] 1280 px: columna centrada, nada estirado.
- [ ] Arrastrar el borde de la ventana de angosta a ancha: nada salta ni se rompe.
- [ ] Sin barra de desplazamiento horizontal.
- [ ] Zoom al 200 %: todo se lee y se puede tocar.
- [ ] Con teclado (Tab): se ve el foco y se llega a todo.
- [ ] En un celular de verdad (con el link de Vercel): el teclado no tapa el botón principal.

## Lista de pantallas

Los nombres de archivo llevan `-fan` o `-artista` cuando la pantalla es de un solo lado. Las de configuración son compartidas: el color lo pone el rol de la sesión.

### 1 · Entrada común

| Código | Pantalla | Archivo | Con kit | Datos en data.js | Revisada vs spec |
|---|---|---|---|---|---|
| A00 | Splash | `index.html` | ✅ | — | |
| A01 | Bienvenida | `pages/bienvenida.html` | ✅ | — | |
| A02 | Iniciar sesión | `pages/iniciar-sesion.html` | ✅ | ✅ | |
| A03 | Crear cuenta: elegir experiencia | `pages/elegir-experiencia.html` | ✅ | — | |
| A03f / A03r | Crear cuenta | `pages/crear-cuenta.html` | ✅ | ✅ | |

### 2 · Registro

| Código | Pantalla | Archivo | Con kit | Datos en data.js | Revisada vs spec |
|---|---|---|---|---|---|
| A05r | Identidad del artista | `pages/identidad-artista.html` | ✅ | — | |
| A06r | Presentación | `pages/presentacion-artista.html` | ✅ | — | |
| A07r | Estilo musical | `pages/estilo-musical-artista.html` | ✅ | ✅ | |
| A08r | Proyecto musical | `pages/proyecto-musical-artista.html` | ✅ | ✅ | |
| A09r | Perfil del artista listo | `pages/perfil-listo-artista.html` | ✅ | ✅ | |
| A05f | Perfil básico del fan | `pages/perfil-basico-fan.html` | ✅ | — | |
| A06f | Gustos musicales | `pages/gustos-fan.html` | ✅ | ✅ | |
| A07f | Intereses | `pages/intereses-fan.html` | ✅ | ✅ | |
| A08f | Perfil del fan listo | `pages/perfil-listo-fan.html` | ✅ | ✅ | |

### 3 · Inicio de cada lado

| Código | Pantalla | Archivo | Con kit | Datos en data.js | Revisada vs spec |
|---|---|---|---|---|---|
| R01 | Panel del artista (con su navegación inferior) | `pages/panel-artista.html` | | | |
| F01a | Inicio del fan (con su navegación inferior) | `pages/inicio-fan.html` | | | |
| F01b | Explorar | `pages/explorar-fan.html` | | | |

### 4 · Música

| Código | Pantalla | Archivo | Con kit | Datos en data.js | Revisada vs spec |
|---|---|---|---|---|---|
| R02 | Música | `pages/musica-artista.html` | | | |
| R03 | Publicar lanzamiento | `pages/publicar-lanzamiento-artista.html` | | | |
| R03b | Lanzamiento | `pages/lanzamiento-artista.html` | | | |
| F01c | Nuevos lanzamientos | `pages/nuevos-lanzamientos-fan.html` | | | |
| F02 | Perfil del artista (visto por el fan) | `pages/perfil-artista-fan.html` | | | |
| — | Reproductor (minirreproductor y vista ampliada) | capa sobre las pantallas del fan | | | |
| — | Cola de reproducción (sin diseño todavía) | `pages/cola-fan.html` | | | |

### 5 · Cupo y preguntas

| Código | Pantalla | Archivo | Con kit | Datos en data.js | Revisada vs spec |
|---|---|---|---|---|---|
| R08 | Cupos | `pages/cupos-artista.html` | | | |
| — | Configurar cupo | `pages/configurar-cupo-artista.html` | | | |
| R04 | Bandeja de preguntas | `pages/bandeja-artista.html` | | | |
| R05 | Revisar pregunta | `pages/revisar-pregunta-artista.html` | | | |
| R06 | Responder (texto o nota de voz) | `pages/responder-artista.html` | | | |
| R06f | Respuesta enviada | `pages/respuesta-enviada-artista.html` | | | |
| R06 preview | Respuesta del artista | `pages/respuesta-artista.html` | | | |
| — | Conexión activa | `pages/conexion-activa-fan.html` | | | |
| F05 | Conectar con el artista | `pages/conectar-fan.html` | | | |
| F05e | Escribir pregunta | `pages/escribir-pregunta-fan.html` | | | |
| F06 | Tu conexión: estado y respuesta | `pages/tu-conexion-fan.html` | | | |

### 6 · Comunidad

| Código | Pantalla | Archivo | Con kit | Datos en data.js | Revisada vs spec |
|---|---|---|---|---|---|
| R07 | Comunidad del artista | `pages/comunidad-artista.html` | | | |
| — | Nueva publicación | `pages/nueva-publicacion-artista.html` | | | |
| F04 | Comunidad (vista por el fan) | `pages/comunidad-fan.html` | | | |

### 7 · Perfiles

| Código | Pantalla | Archivo | Con kit | Datos en data.js | Revisada vs spec |
|---|---|---|---|---|---|
| P04 | Perfil del artista (propio) | `pages/perfil-propio-artista.html` | | | |
| P02 / P03 | Editar perfil del artista | `pages/editar-perfil-artista.html` | | | |
| F07a | Perfil del fan | `pages/perfil-fan.html` | | | |
| F07b | Tu recorrido | `pages/recorrido-fan.html` | | | |
| P01 | Editar perfil del fan | `pages/editar-perfil-fan.html` | | | |

### 8 · Fan Club

| Código | Pantalla | Archivo | Con kit | Datos en data.js | Revisada vs spec |
|---|---|---|---|---|---|
| F08a | Conocer el Fan Club | `pages/fan-club-fan.html` | | | |
| F08b | Contenido del Fan Club | `pages/contenido-fan-club-fan.html` | | | |

### 9 · Compartidas

| Código | Pantalla | Archivo | Con kit | Datos en data.js | Revisada vs spec |
|---|---|---|---|---|---|
| F09 / R09 | Configuración | `pages/configuracion.html` | | | |
| F10 / R10 | Apariencia | `pages/apariencia.html` | | | |
| F11 / R11 | Notificaciones | `pages/notificaciones.html` | | | |
| F12 / R12 | Accesibilidad | `pages/accesibilidad.html` | | | |
