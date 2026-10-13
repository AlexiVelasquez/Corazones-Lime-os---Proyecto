USE corazones_limenos;

-- Confirmar que se crearon las 22 tablas.
SELECT COUNT(*) AS total_tablas
FROM information_schema.tables
WHERE table_schema = 'corazones_limenos';

-- Cuentas disponibles con rol y distrito, sin exponer contraseñas.
SELECT u.id, r.nombre AS rol, u.nombres, u.apellidos, u.correo,
       d.nombre AS distrito, u.activo
FROM usuarios u
INNER JOIN roles r ON r.id = u.rol_id
LEFT JOIN distritos d ON d.id = u.distrito_id
ORDER BY r.nombre, u.nombres;

-- Donaciones con su primer artículo, donante y albergue.
SELECT
  do.id,
  do.fecha_programada,
  CONCAT(u.nombres, ' ', u.apellidos) AS donante,
  a.nombre AS albergue,
  c.nombre AS categoria,
  dd.descripcion,
  dd.cantidad,
  do.estado
FROM donaciones do
INNER JOIN usuarios u ON u.id = do.donante_id
INNER JOIN albergues a ON a.id = do.albergue_id
INNER JOIN detalle_donacion dd ON dd.donacion_id = do.id
INNER JOIN categorias_articulo c ON c.id = dd.categoria_id
ORDER BY do.creado_en DESC;

-- Necesidades activas por prioridad.
SELECT a.nombre AS albergue, d.nombre AS distrito, c.nombre AS categoria,
       n.descripcion, n.cantidad_requerida, n.prioridad, n.fecha_limite
FROM necesidades n
INNER JOIN albergues a ON a.id = n.albergue_id
INNER JOIN distritos d ON d.id = a.distrito_id
INNER JOIN categorias_articulo c ON c.id = n.categoria_id
WHERE n.activa = 1 AND a.estado = 'Aprobado'
ORDER BY FIELD(n.prioridad, 'Urgente', 'Alta', 'Media', 'Baja'), n.fecha_limite;

-- Resumen de impacto por albergue.
SELECT
  a.nombre AS albergue,
  COUNT(DISTINCT do.id) AS donaciones,
  COALESCE(SUM(dd.cantidad), 0) AS unidades,
  COUNT(DISTINCT CASE WHEN do.estado = 'Entregado' THEN do.id END) AS entregas_confirmadas
FROM albergues a
LEFT JOIN donaciones do ON do.albergue_id = a.id
LEFT JOIN detalle_donacion dd ON dd.donacion_id = do.id
GROUP BY a.id, a.nombre
ORDER BY unidades DESC;

-- Ruta logística con voluntario y paradas asignadas.
SELECT r.codigo, r.fecha, r.estado,
       CONCAT(v.nombres, ' ', v.apellidos) AS voluntario,
       rd.orden_parada, rd.donacion_id, a.nombre AS destino
FROM rutas_recojo r
INNER JOIN voluntarios v ON v.id = r.voluntario_id
LEFT JOIN ruta_donaciones rd ON rd.ruta_id = r.id
LEFT JOIN donaciones do ON do.id = rd.donacion_id
LEFT JOIN albergues a ON a.id = do.albergue_id
ORDER BY r.fecha, rd.orden_parada;

-- Historial completo de seguimiento de una donación.
SELECT s.donacion_id, s.estado, s.comentario,
       CONCAT_WS(' ', u.nombres, u.apellidos) AS registrado_por,
       s.registrado_en
FROM seguimiento_donacion s
LEFT JOIN usuarios u ON u.id = s.registrado_por
ORDER BY s.donacion_id, s.registrado_en;

-- Avance de las campañas respecto a la meta.
SELECT c.nombre, c.meta_unidades,
       COALESCE(SUM(dd.cantidad), 0) AS unidades_recibidas,
       ROUND(COALESCE(SUM(dd.cantidad), 0) * 100 / c.meta_unidades, 2) AS porcentaje_avance
FROM campanas c
LEFT JOIN donaciones do ON do.campana_id = c.id
LEFT JOIN detalle_donacion dd ON dd.donacion_id = do.id
GROUP BY c.id, c.nombre, c.meta_unidades;
