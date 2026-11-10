-- ==========================================================
-- Looped · Datos iniciales (los mismos de js/data.js)
-- Córrelo en SQL Editor DESPUÉS de esquema.sql, una sola vez.
-- Las fechas se calculan desde «ahora», así la ventana de 48 h
-- se puede probar. Las imágenes y el audio de ejemplo están en
-- la carpeta assets/ del proyecto.
-- ==========================================================

insert into generos (id, nombre) values
  ('pop', 'Pop'),
  ('rock', 'Rock'),
  ('indie', 'Indie'),
  ('electronica', 'Electrónica'),
  ('hip-hop', 'Hip hop'),
  ('rnb', 'R&B'),
  ('jazz', 'Jazz'),
  ('musica-latina', 'Música latina');

insert into roles (id, nombre) values
  ('solista', 'Solista'),
  ('integrante-banda', 'Integrante de una banda'),
  ('compositor', 'Compositor o compositora'),
  ('productor', 'Productor o productora'),
  ('instrumentista', 'Instrumentista');

insert into intereses (id, nombre) values
  ('descubrir-artistas', 'Descubrir nuevos artistas'),
  ('nuevos-lanzamientos', 'Escuchar nuevos lanzamientos'),
  ('conocer-artistas', 'Conocer a los artistas'),
  ('comunidades', 'Participar en comunidades');

insert into fans (id, nombre_perfil, nombre_usuario, gustos_musicales, intereses, minutos_escucha, fecha_registro) values
  ('fan-alex', 'Alex', 'alex', '{indie,pop}', '{}', 45, '2026-11-01'),
  ('fan-tomas', 'Tomás', 'tomas', '{indie}', '{conocer-artistas}', 80, '2026-10-20'),
  ('fan-lucia', 'Lucía', 'lucia', '{pop}', '{comunidades}', 130, '2026-10-12'),
  ('fan-sebastian', 'Sebastián', 'sebastian', '{indie,rock}', '{nuevos-lanzamientos}', 40, '2026-10-25');
update fans set segundos_escucha = minutos_escucha * 60;

insert into artistas (id, nombre_artistico, nombre_usuario, foto, presentacion, ciudad, generos, roles, emergente) values
  ('mara-sol', 'Mara Sol', 'marasol', 'assets/mara-sol.jpg', 'Canciones íntimas y melodías que encuentran su espacio.', 'Bogotá', '{indie,pop}', '{solista,compositor}', true),
  ('rio-lento', 'Río Lento', 'riolento', null, 'Dúo de electrónica tranquila para caminar de noche.', 'Medellín', '{electronica}', '{productor}', true),
  ('nadia-cruz', 'Nadia Cruz', 'nadiacruz', null, 'R&B con guitarras limpias y letras que cuentan lo cotidiano.', 'Cali', '{rnb,musica-latina}', '{solista}', true),
  ('los-faroles', 'Los Faroles', 'losfaroles', null, 'Banda de rock que ensaya en un garaje desde 2019.', 'Bucaramanga', '{rock,indie}', '{integrante-banda}', false);

insert into seguimientos (fan, artista) values
  ('fan-alex', 'nadia-cruz'),
  ('fan-tomas', 'mara-sol'),
  ('fan-lucia', 'mara-sol'),
  ('fan-sebastian', 'mara-sol');

-- Lucía visitó a Mara Sol cuando tenía menos de 1000 seguidores: fan fundador.
insert into visitas (fan, artista) values
  ('fan-lucia', 'mara-sol');

insert into miembros_fan_club (fan, artista) values
  ('fan-lucia', 'mara-sol');

-- Los seguidores de ejemplo (los seguimientos de arriba ya sumaron algunos).
update artistas set seguidores = 312 where id = 'mara-sol';
update artistas set seguidores = 2840 where id = 'rio-lento';
update artistas set seguidores = 640 where id = 'nadia-cruz';
update artistas set seguidores = 5120 where id = 'los-faroles';

insert into lanzamientos (id, artista, nombre_lanzamiento, nombre_cancion, portada, audio, fecha_publicacion) values
  ('segundo-sol', 'mara-sol', 'Segundo sol', 'Aire de vuelta', 'assets/portada-segundo-sol.jpg', 'assets/audio-muestra.mp3', now() - interval '5 hours'),
  ('nocturna', 'rio-lento', 'Nocturna', 'Calle 10', null, 'assets/audio-muestra.mp3', now() - interval '30 hours'),
  ('cerca', 'nadia-cruz', 'Cerca', 'Tarde de lunes', null, 'assets/audio-muestra.mp3', now() - interval '9 days'),
  ('garaje', 'los-faroles', 'Garaje', 'Ruido blanco', null, 'assets/audio-muestra.mp3', now() - interval '20 days');

insert into cupos (id, artista, estado, total_preguntas, preguntas_usadas, nivel_minimo, fecha_apertura) values
  ('cupo-mara-sol', 'mara-sol', 'abierto', 5, 1, 1, now() - interval '3 hours'),
  ('cupo-rio-lento', 'rio-lento', 'cerrado', 3, 3, 1, null),
  ('cupo-nadia-cruz', 'nadia-cruz', 'abierto', 10, 2, 2, now() - interval '20 hours'),
  ('cupo-los-faroles', 'los-faroles', 'abierto', 4, 1, 1, now() - interval '30 hours');

-- Las preguntas de ejemplo traen sus votos y estados: se apaga un momento
-- la regla que pone en 0 los votos de las preguntas nuevas.
alter table preguntas disable trigger preguntas_preparar;
insert into preguntas (id, artista, autor, autor_es_fan_club, primer_contacto, texto, votos, estado, fecha) values
  ('pregunta-tomas', 'mara-sol', 'fan-tomas', false, false, '¿Cómo nació Aire de vuelta?', 14, 'nueva', now() - interval '2 hours'),
  ('pregunta-lucia', 'mara-sol', 'fan-lucia', true, false, '¿Vas a tocar Segundo sol en vivo este año?', 6, 'nueva', now() - interval '1 hour'),
  ('pregunta-alex', 'nadia-cruz', 'fan-alex', false, false, '¿Qué canción te gustaría que escucháramos primero?', 2, 'pendiente', now() - interval '6 hours'),
  ('pregunta-sebastian', 'mara-sol', 'fan-sebastian', false, false, '¿Qué instrumento usaste para la introducción?', 3, 'respondida', now() - interval '40 hours');
alter table preguntas enable trigger preguntas_preparar;

insert into respuestas (id, pregunta, tipo, texto, fecha) values
  ('respuesta-sebastian', 'pregunta-sebastian', 'texto', 'Una guitarra de nylon que encontré en casa de mi abuela. La grabé con el celular primero.', now() - interval '30 hours');
