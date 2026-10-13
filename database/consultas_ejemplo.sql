USE corazones_limenos;

-- Cuentas disponibles, sin exponer las contraseñas.
SELECT id, rol, nombres, apellidos, correo, distrito, activo
FROM usuarios
ORDER BY rol, nombres;

-- Donaciones con el nombre del donante y del albergue.
SELECT
  d.id,
  d.fecha,
  CONCAT(u.nombres, ' ', u.apellidos) AS donante,
  a.nombre AS albergue,
  d.categoria,
  d.descripcion,
  d.cantidad,
  d.estado
FROM donaciones d
INNER JOIN usuarios u ON u.id = d.donante_id
INNER JOIN albergues a ON a.id = d.albergue_id
ORDER BY d.creado_en DESC;

-- Necesidades activas publicadas en el directorio.
SELECT a.nombre AS albergue, a.distrito, n.categoria, n.descripcion
FROM necesidades n
INNER JOIN albergues a ON a.id = n.albergue_id
WHERE n.activa = 1 AND a.estado = 'Aprobado'
ORDER BY a.nombre, n.creado_en DESC;

-- Resumen de impacto por albergue.
SELECT
  a.nombre AS albergue,
  COUNT(d.id) AS donaciones,
  COALESCE(SUM(d.cantidad), 0) AS cajas,
  SUM(d.estado = 'Entregado') AS entregas_confirmadas
FROM albergues a
LEFT JOIN donaciones d ON d.albergue_id = a.id
GROUP BY a.id, a.nombre
ORDER BY cajas DESC;
