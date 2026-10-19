CREATE DATABASE IF NOT EXISTS corazones_limenos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE corazones_limenos;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS auditoria_sistema;
DROP TABLE IF EXISTS documentos_albergue;
DROP TABLE IF EXISTS mensajes_contacto;
DROP TABLE IF EXISTS aliados_corporativos;
DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS usuario_insignias;
DROP TABLE IF EXISTS insignias;
DROP TABLE IF EXISTS seguimiento_donacion;
DROP TABLE IF EXISTS ruta_donaciones;
DROP TABLE IF EXISTS rutas_recojo;
DROP TABLE IF EXISTS voluntarios;
DROP TABLE IF EXISTS necesidades;
DROP TABLE IF EXISTS detalle_donacion;
DROP TABLE IF EXISTS donaciones;
DROP TABLE IF EXISTS puntos_recojo;
DROP TABLE IF EXISTS campana_albergues;
DROP TABLE IF EXISTS campanas;
DROP TABLE IF EXISTS categorias_articulo;
DROP TABLE IF EXISTS albergues;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS distritos;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Catálogo de perfiles de acceso.
CREATE TABLE roles (
  id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  nombre VARCHAR(80) NOT NULL,
  descripcion VARCHAR(240) NOT NULL DEFAULT ''
) ENGINE=InnoDB;

-- 2. Catálogo geográfico para Lima Metropolitana.
CREATE TABLE distritos (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  provincia VARCHAR(100) NOT NULL DEFAULT 'Lima',
  activo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- 3. Cuentas del sistema.
CREATE TABLE usuarios (
  id VARCHAR(40) PRIMARY KEY,
  rol_id TINYINT UNSIGNED NOT NULL,
  distrito_id SMALLINT UNSIGNED NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL DEFAULT '',
  correo VARCHAR(160) NOT NULL UNIQUE,
  telefono VARCHAR(20) NOT NULL,
  clave_hash VARCHAR(255) NOT NULL,
  foto MEDIUMTEXT NULL,
  notificar_impacto TINYINT(1) NOT NULL DEFAULT 1,
  notificar_campanas TINYINT(1) NOT NULL DEFAULT 1,
  notificar_resumen TINYINT(1) NOT NULL DEFAULT 0,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  ultimo_acceso DATETIME NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES roles(id),
  CONSTRAINT fk_usuario_distrito FOREIGN KEY (distrito_id) REFERENCES distritos(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_usuario_rol (rol_id),
  INDEX idx_usuario_distrito (distrito_id)
) ENGINE=InnoDB;

-- 4. Directorio y proceso de aprobación de albergues.
CREATE TABLE albergues (
  id VARCHAR(40) PRIMARY KEY,
  usuario_id VARCHAR(40) NULL UNIQUE,
  distrito_id SMALLINT UNSIGNED NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  ruc VARCHAR(11) NULL UNIQUE,
  descripcion VARCHAR(500) NOT NULL DEFAULT '',
  direccion VARCHAR(220) NOT NULL DEFAULT '',
  aforo INT UNSIGNED NULL,
  estado ENUM('Pendiente', 'Aprobado', 'Rechazado') NOT NULL DEFAULT 'Pendiente',
  imagen VARCHAR(255) NULL,
  latitud DECIMAL(10,7) NULL,
  longitud DECIMAL(10,7) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_albergue_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_albergue_distrito FOREIGN KEY (distrito_id) REFERENCES distritos(id),
  INDEX idx_albergue_estado (estado),
  INDEX idx_albergue_distrito (distrito_id)
) ENGINE=InnoDB;

-- 5. Clasificación reutilizable de artículos.
CREATE TABLE categorias_articulo (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(240) NOT NULL DEFAULT '',
  icono VARCHAR(30) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- 6. Campañas de recaudación.
CREATE TABLE campanas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(160) NOT NULL,
  descripcion TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  meta_unidades INT UNSIGNED NOT NULL,
  estado ENUM('Planificada', 'Activa', 'Finalizada', 'Cancelada') NOT NULL DEFAULT 'Planificada',
  imagen VARCHAR(255) NULL,
  creado_por VARCHAR(40) NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_campana_creador FOREIGN KEY (creado_por) REFERENCES usuarios(id),
  CONSTRAINT chk_campana_fechas CHECK (fecha_fin >= fecha_inicio),
  INDEX idx_campana_estado_fechas (estado, fecha_inicio, fecha_fin)
) ENGINE=InnoDB;

-- 7. Albergues beneficiarios por campaña.
CREATE TABLE campana_albergues (
  campana_id BIGINT UNSIGNED NOT NULL,
  albergue_id VARCHAR(40) NOT NULL,
  meta_unidades INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (campana_id, albergue_id),
  CONSTRAINT fk_ca_campana FOREIGN KEY (campana_id) REFERENCES campanas(id) ON DELETE CASCADE,
  CONSTRAINT fk_ca_albergue FOREIGN KEY (albergue_id) REFERENCES albergues(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Lugares aliados donde se reciben aportes.
CREATE TABLE puntos_recojo (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  distrito_id SMALLINT UNSIGNED NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  direccion VARCHAR(220) NOT NULL,
  referencia VARCHAR(220) NOT NULL DEFAULT '',
  horario VARCHAR(160) NOT NULL,
  latitud DECIMAL(10,7) NULL,
  longitud DECIMAL(10,7) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_punto_distrito FOREIGN KEY (distrito_id) REFERENCES distritos(id),
  INDEX idx_punto_distrito_activo (distrito_id, activo)
) ENGINE=InnoDB;

-- 9. Cabecera de cada donación.
CREATE TABLE donaciones (
  id VARCHAR(40) PRIMARY KEY,
  donante_id VARCHAR(40) NOT NULL,
  albergue_id VARCHAR(40) NOT NULL,
  campana_id BIGINT UNSIGNED NULL,
  punto_recojo_id BIGINT UNSIGNED NULL,
  metodo_entrega ENUM('dropoff', 'pickup') NOT NULL,
  ubicacion_entrega VARCHAR(160) NOT NULL DEFAULT '',
  direccion VARCHAR(220) NOT NULL DEFAULT '',
  referencia VARCHAR(220) NOT NULL DEFAULT '',
  horario_preferido VARCHAR(120) NOT NULL DEFAULT '',
  fecha_programada DATE NOT NULL,
  estado ENUM('Pendiente', 'En tránsito', 'Entregado', 'Cancelado') NOT NULL DEFAULT 'Pendiente',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_donacion_donante FOREIGN KEY (donante_id) REFERENCES usuarios(id),
  CONSTRAINT fk_donacion_albergue FOREIGN KEY (albergue_id) REFERENCES albergues(id),
  CONSTRAINT fk_donacion_campana FOREIGN KEY (campana_id) REFERENCES campanas(id) ON DELETE SET NULL,
  CONSTRAINT fk_donacion_punto FOREIGN KEY (punto_recojo_id) REFERENCES puntos_recojo(id) ON DELETE SET NULL,
  INDEX idx_donacion_donante (donante_id),
  INDEX idx_donacion_albergue_estado (albergue_id, estado),
  INDEX idx_donacion_fecha (fecha_programada)
) ENGINE=InnoDB;

-- 10. Uno o más artículos incluidos en la donación.
CREATE TABLE detalle_donacion (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  donacion_id VARCHAR(40) NOT NULL,
  categoria_id SMALLINT UNSIGNED NOT NULL,
  descripcion VARCHAR(300) NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  estado_articulos ENUM('nuevo', 'como nuevo', 'usado') NOT NULL DEFAULT 'nuevo',
  CONSTRAINT fk_detalle_donacion FOREIGN KEY (donacion_id) REFERENCES donaciones(id) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_articulo(id),
  CONSTRAINT chk_detalle_cantidad CHECK (cantidad BETWEEN 1 AND 1000),
  INDEX idx_detalle_donacion (donacion_id),
  INDEX idx_detalle_categoria (categoria_id)
) ENGINE=InnoDB;

-- 11. Solicitudes urgentes publicadas por los albergues.
CREATE TABLE necesidades (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  albergue_id VARCHAR(40) NOT NULL,
  categoria_id SMALLINT UNSIGNED NOT NULL,
  descripcion VARCHAR(180) NOT NULL,
  cantidad_requerida INT UNSIGNED NULL,
  prioridad ENUM('Baja', 'Media', 'Alta', 'Urgente') NOT NULL DEFAULT 'Media',
  fecha_limite DATE NULL,
  activa TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_necesidad_albergue FOREIGN KEY (albergue_id) REFERENCES albergues(id) ON DELETE CASCADE,
  CONSTRAINT fk_necesidad_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_articulo(id),
  INDEX idx_necesidad_albergue_activa (albergue_id, activa),
  INDEX idx_necesidad_prioridad (prioridad)
) ENGINE=InnoDB;

-- 12. Personal voluntario que realiza recojos y entregas.
CREATE TABLE voluntarios (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  documento VARCHAR(15) NOT NULL UNIQUE,
  telefono VARCHAR(20) NOT NULL,
  correo VARCHAR(160) NOT NULL UNIQUE,
  licencia_conducir VARCHAR(20) NULL,
  disponible TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 13. Rutas logísticas administradas por la plataforma.
CREATE TABLE rutas_recojo (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  voluntario_id BIGINT UNSIGNED NOT NULL,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NULL,
  vehiculo VARCHAR(100) NOT NULL DEFAULT '',
  placa VARCHAR(10) NOT NULL DEFAULT '',
  estado ENUM('Planificada', 'En curso', 'Completada', 'Cancelada') NOT NULL DEFAULT 'Planificada',
  observaciones VARCHAR(300) NOT NULL DEFAULT '',
  CONSTRAINT fk_ruta_voluntario FOREIGN KEY (voluntario_id) REFERENCES voluntarios(id),
  INDEX idx_ruta_fecha_estado (fecha, estado)
) ENGINE=InnoDB;

-- 14. Donaciones asignadas y ordenadas dentro de cada ruta.
CREATE TABLE ruta_donaciones (
  ruta_id BIGINT UNSIGNED NOT NULL,
  donacion_id VARCHAR(40) NOT NULL UNIQUE,
  orden_parada SMALLINT UNSIGNED NOT NULL,
  hora_estimada TIME NULL,
  PRIMARY KEY (ruta_id, donacion_id),
  CONSTRAINT fk_rd_ruta FOREIGN KEY (ruta_id) REFERENCES rutas_recojo(id) ON DELETE CASCADE,
  CONSTRAINT fk_rd_donacion FOREIGN KEY (donacion_id) REFERENCES donaciones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. Historial visible para el seguimiento de una donación.
CREATE TABLE seguimiento_donacion (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  donacion_id VARCHAR(40) NOT NULL,
  estado ENUM('Pendiente', 'En tránsito', 'Entregado', 'Cancelado') NOT NULL,
  comentario VARCHAR(300) NOT NULL DEFAULT '',
  registrado_por VARCHAR(40) NULL,
  registrado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_seguimiento_donacion FOREIGN KEY (donacion_id) REFERENCES donaciones(id) ON DELETE CASCADE,
  CONSTRAINT fk_seguimiento_usuario FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_seguimiento_donacion_fecha (donacion_id, registrado_en)
) ENGINE=InnoDB;

-- 16. Catálogo de reconocimientos por impacto.
CREATE TABLE insignias (
  id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(40) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(240) NOT NULL,
  icono VARCHAR(30) NOT NULL,
  meta_donaciones INT UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- 17. Insignias obtenidas por cada donante.
CREATE TABLE usuario_insignias (
  usuario_id VARCHAR(40) NOT NULL,
  insignia_id SMALLINT UNSIGNED NOT NULL,
  otorgada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, insignia_id),
  CONSTRAINT fk_ui_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_ui_insignia FOREIGN KEY (insignia_id) REFERENCES insignias(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 18. Avisos internos para cualquier tipo de usuario.
CREATE TABLE notificaciones (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id VARCHAR(40) NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  mensaje VARCHAR(500) NOT NULL,
  tipo ENUM('Impacto', 'Campaña', 'Donación', 'Sistema') NOT NULL DEFAULT 'Sistema',
  leida TINYINT(1) NOT NULL DEFAULT 0,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notificacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_notificacion_usuario_leida (usuario_id, leida, creado_en)
) ENGINE=InnoDB;

-- 19. Empresas y organizaciones que apoyan las campañas.
CREATE TABLE aliados_corporativos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  razon_social VARCHAR(180) NOT NULL,
  ruc VARCHAR(11) NOT NULL UNIQUE,
  contacto VARCHAR(160) NOT NULL,
  correo VARCHAR(160) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  tipo_aporte ENUM('Dinero', 'Productos', 'Transporte', 'Difusión') NOT NULL,
  monto_referencial DECIMAL(12,2) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 20. Consultas enviadas desde la página pública.
CREATE TABLE mensajes_contacto (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(160) NOT NULL,
  correo VARCHAR(160) NOT NULL,
  asunto VARCHAR(160) NOT NULL,
  mensaje TEXT NOT NULL,
  estado ENUM('Nuevo', 'En revisión', 'Atendido') NOT NULL DEFAULT 'Nuevo',
  atendido_por VARCHAR(40) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atendido_en DATETIME NULL,
  CONSTRAINT fk_mensaje_atendido FOREIGN KEY (atendido_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_mensaje_estado (estado)
) ENGINE=InnoDB;

-- 21. Sustentos del proceso de validación de albergues.
CREATE TABLE documentos_albergue (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  albergue_id VARCHAR(40) NOT NULL,
  tipo ENUM('RUC', 'Licencia', 'Constancia', 'Identidad', 'Otro') NOT NULL,
  nombre_archivo VARCHAR(200) NOT NULL,
  ruta_archivo VARCHAR(300) NOT NULL,
  estado ENUM('Pendiente', 'Validado', 'Observado') NOT NULL DEFAULT 'Pendiente',
  observacion VARCHAR(300) NOT NULL DEFAULT '',
  subido_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_documento_albergue FOREIGN KEY (albergue_id) REFERENCES albergues(id) ON DELETE CASCADE,
  INDEX idx_documento_albergue_estado (albergue_id, estado)
) ENGINE=InnoDB;

-- 22. Registro administrativo de acciones relevantes.
CREATE TABLE auditoria_sistema (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id VARCHAR(40) NULL,
  accion VARCHAR(80) NOT NULL,
  entidad VARCHAR(80) NOT NULL,
  entidad_id VARCHAR(80) NOT NULL,
  detalle JSON NULL,
  ip VARCHAR(45) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_auditoria_entidad (entidad, entidad_id),
  INDEX idx_auditoria_fecha (creado_en)
) ENGINE=InnoDB;

INSERT INTO roles (id, codigo, nombre, descripcion) VALUES
  (1, 'donante', 'Donante', 'Persona que registra y sigue sus donaciones.'),
  (2, 'albergue', 'Albergue', 'Institución beneficiaria que publica necesidades.'),
  (3, 'admin', 'Administrador', 'Responsable de supervisar la plataforma y la logística.');

INSERT INTO distritos (id, nombre) VALUES
  (1, 'Miraflores'), (2, 'San Isidro'), (3, 'Comas'),
  (4, 'San Juan de Lurigancho'), (5, 'Villa El Salvador'),
  (6, 'Los Olivos'), (7, 'San Martín de Porres'),
  (8, 'Santiago de Surco'), (9, 'Lima Cercado'), (10, 'La Molina');

INSERT INTO usuarios
  (id, rol_id, distrito_id, nombres, apellidos, correo, telefono, clave_hash,
   notificar_impacto, notificar_campanas, notificar_resumen)
VALUES
  ('carlos', 1, 1, 'Carlos', 'Mendoza', 'donante@calidad.pe', '987654321', SHA2('Demo123!', 256), 1, 1, 0),
  ('esperanza', 2, 4, 'Hogar de la Esperanza', '', 'albergue@calidad.pe', '987654322', SHA2('Demo123!', 256), 1, 1, 0),
  ('patitas', 2, 5, 'Patitas Felices', '', 'patitas@calidad.pe', '987654324', SHA2('Demo123!', 256), 1, 1, 0),
  ('renacer', 2, 3, 'Renacer - Adulto Mayor', '', 'renacer@calidad.pe', '987654325', SHA2('Demo123!', 256), 1, 1, 0),
  ('admin', 3, 2, 'María', 'García', 'admin@calidad.pe', '987654323', SHA2('Demo123!', 256), 1, 1, 0);

INSERT INTO albergues
  (id, usuario_id, distrito_id, nombre, ruc, descripcion, direccion, aforo, estado, imagen, latitud, longitud)
VALUES
  ('esperanza', 'esperanza', 4, 'Hogar de la Esperanza', '20123456781', 'Refugio y alimentación para niños y adolescentes.', 'Av. Los Jardines 450', 80, 'Aprobado', '/assets/images/albergue-esperanza.jpg', -12.0153000, -77.0063000),
  ('patitas', 'patitas', 5, 'Patitas Felices', '20123456782', 'Rescate y rehabilitación de perros y gatos.', 'Av. Central 820', 120, 'Aprobado', '/assets/images/albergue-patitas.jpg', -12.2137000, -76.9375000),
  ('renacer', 'renacer', 3, 'Renacer - Adulto Mayor', '20123456783', 'Cuidado para adultos mayores en situación vulnerable.', 'Jr. Primavera 180', 60, 'Aprobado', '/assets/images/albergue-renacer.jpg', -11.9360000, -77.0558000),
  ('sanjose', NULL, 6, 'Refugio San José', '20123456784', 'Solicitud pendiente de revisión.', 'Av. Universitaria 1550', 45, 'Pendiente', NULL, -11.9827000, -77.0715000),
  ('nuevo', NULL, 7, 'Hogar Esperanza', '20123456785', 'Solicitud pendiente de revisión.', 'Jr. Lima 240', 50, 'Pendiente', NULL, -12.0061000, -77.0838000);

INSERT INTO categorias_articulo (id, nombre, descripcion, icono) VALUES
  (1, 'Juguetes', 'Juguetes nuevos o en excelente estado.', '🧸'),
  (2, 'Víveres', 'Canastas y productos de consumo humano.', '🥫'),
  (3, 'Alimentos no perecibles', 'Arroz, avena, leche, conservas y similares.', '🍚'),
  (4, 'Ropa de invierno', 'Abrigos, frazadas y prendas de temporada.', '🧥'),
  (5, 'Útiles escolares', 'Cuadernos, colores, mochilas y materiales.', '📚'),
  (6, 'Alimentos para mascotas', 'Alimento balanceado para perros y gatos.', '🐾');

INSERT INTO campanas
  (id, nombre, descripcion, fecha_inicio, fecha_fin, meta_unidades, estado, creado_por)
VALUES
  (1, 'Navidad con Corazón 2026', 'Recolección de juguetes y víveres para albergues de Lima.', '2026-10-01', '2026-12-20', 1000, 'Activa', 'admin'),
  (2, 'Abriga Lima', 'Campaña de ropa de invierno y frazadas.', '2026-05-01', '2026-07-31', 600, 'Finalizada', 'admin');

INSERT INTO campana_albergues (campana_id, albergue_id, meta_unidades) VALUES
  (1, 'esperanza', 400), (1, 'patitas', 250), (1, 'renacer', 350),
  (2, 'esperanza', 300), (2, 'renacer', 300);

INSERT INTO puntos_recojo
  (id, distrito_id, nombre, direccion, referencia, horario, latitud, longitud)
VALUES
  (1, 1, 'Sede Central Miraflores', 'Av. Larco 880', 'A una cuadra del parque Kennedy', 'Lun-Sáb 09:00-18:00', -12.1212310, -77.0297220),
  (2, 2, 'Centro Comunitario San Isidro', 'Av. Arequipa 3200', 'Ingreso por la puerta lateral', 'Lun-Vie 09:00-17:00', -12.0965260, -77.0352450),
  (3, 8, 'Punto Aliado Surco', 'Av. Caminos del Inca 450', 'Frente al centro comercial', 'Lun-Dom 10:00-19:00', -12.1124120, -76.9916220),
  (4, 9, 'Punto Aliado Lima Cercado', 'Av. Abancay 250', 'Módulo de recepción', 'Lun-Sáb 08:00-16:00', -12.0475310, -77.0288900);

INSERT INTO donaciones
  (id, donante_id, albergue_id, campana_id, punto_recojo_id, metodo_entrega,
   ubicacion_entrega, direccion, referencia, horario_preferido, fecha_programada, estado)
VALUES
  ('CL-1001', 'carlos', 'esperanza', 1, 1, 'dropoff', 'Miraflores — Sede Central', '', '', '', '2026-09-01', 'Entregado'),
  ('CL-1002', 'carlos', 'esperanza', 1, 1, 'dropoff', 'Miraflores — Sede Central', '', '', '', '2026-09-09', 'En tránsito');

INSERT INTO detalle_donacion
  (donacion_id, categoria_id, descripcion, cantidad, estado_articulos)
VALUES
  ('CL-1001', 2, 'Canasta de víveres básicos', 2, 'nuevo'),
  ('CL-1002', 1, '8 pelotas de fútbol', 1, 'como nuevo');

INSERT INTO necesidades
  (albergue_id, categoria_id, descripcion, cantidad_requerida, prioridad, fecha_limite, activa)
VALUES
  ('esperanza', 1, '20 pelotas de fútbol', 20, 'Alta', '2026-12-10', 1),
  ('esperanza', 3, '50 kg de arroz', 50, 'Urgente', '2026-11-30', 1),
  ('patitas', 6, 'Alimento balanceado para perros', 30, 'Alta', '2026-11-15', 1),
  ('renacer', 3, 'Leche y avena', 40, 'Alta', '2026-11-20', 1);

INSERT INTO voluntarios
  (id, nombres, apellidos, documento, telefono, correo, licencia_conducir, disponible)
VALUES
  (1, 'Luis', 'Ramírez', '71234567', '986111222', 'luis.voluntario@calidad.pe', 'Q71234567', 1),
  (2, 'Andrea', 'Torres', '72345678', '986333444', 'andrea.voluntaria@calidad.pe', NULL, 1);

INSERT INTO rutas_recojo
  (id, voluntario_id, codigo, fecha, hora_inicio, vehiculo, placa, estado, observaciones)
VALUES
  (1, 1, 'RUTA-LIMA-001', '2026-09-09', '09:00:00', 'Furgón', 'ABC-123', 'En curso', 'Ruta de recojo y entrega del sector centro.');

INSERT INTO ruta_donaciones (ruta_id, donacion_id, orden_parada, hora_estimada) VALUES
  (1, 'CL-1002', 1, '10:30:00');

INSERT INTO seguimiento_donacion
  (donacion_id, estado, comentario, registrado_por, registrado_en)
VALUES
  ('CL-1001', 'Pendiente', 'Donación registrada.', 'carlos', '2026-09-01 09:10:00'),
  ('CL-1001', 'Entregado', 'Recepción confirmada por el albergue.', 'esperanza', '2026-09-01 16:45:00'),
  ('CL-1002', 'Pendiente', 'Donación registrada.', 'carlos', '2026-09-09 08:30:00'),
  ('CL-1002', 'En tránsito', 'Asignada a la ruta RUTA-LIMA-001.', 'admin', '2026-09-09 09:00:00');

INSERT INTO insignias (id, codigo, nombre, descripcion, icono, meta_donaciones) VALUES
  (1, 'CORAZON_FIEL', 'Corazón fiel', 'Realizó su primera donación.', '♥', 1),
  (2, 'NUTRIDOR', 'Nutridor', 'Entregó una donación de víveres.', '🥫', 1),
  (3, 'SANTA', 'Santa', 'Completó tres donaciones de juguetes.', '🧸', 3),
  (4, 'COMUNIDAD', 'Comunidad', 'Completó diez donaciones.', '♧', 10);

INSERT INTO usuario_insignias (usuario_id, insignia_id, otorgada_en) VALUES
  ('carlos', 1, '2026-09-01 16:45:00'),
  ('carlos', 2, '2026-09-01 16:45:00');

INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, leida) VALUES
  ('carlos', 'Donación recibida', 'Hogar de la Esperanza confirmó la recepción de CL-1001.', 'Donación', 1),
  ('carlos', 'Donación en camino', 'Tu donación CL-1002 fue asignada a una ruta.', 'Donación', 0),
  ('esperanza', 'Nueva donación', 'Tienes una donación en tránsito.', 'Donación', 0),
  ('admin', 'Albergues pendientes', 'Existen dos solicitudes por revisar.', 'Sistema', 0);

INSERT INTO aliados_corporativos
  (razon_social, ruc, contacto, correo, telefono, tipo_aporte, monto_referencial)
VALUES
  ('Transportes Solidarios SAC', '20555555551', 'Paola Ruiz', 'alianzas@transportessolidarios.pe', '014445555', 'Transporte', 5000.00),
  ('Mercados Unidos SA', '20555555552', 'Diego León', 'responsabilidad@mercadosunidos.pe', '014446666', 'Productos', 8500.00);

INSERT INTO documentos_albergue
  (albergue_id, tipo, nombre_archivo, ruta_archivo, estado, observacion)
VALUES
  ('sanjose', 'RUC', 'ruc-san-jose.pdf', '/documentos/sanjose/ruc-san-jose.pdf', 'Validado', ''),
  ('sanjose', 'Licencia', 'licencia-san-jose.pdf', '/documentos/sanjose/licencia-san-jose.pdf', 'Pendiente', ''),
  ('nuevo', 'Constancia', 'constancia-hogar-esperanza.pdf', '/documentos/nuevo/constancia.pdf', 'Observado', 'Falta firma del representante legal.');

INSERT INTO auditoria_sistema (usuario_id, accion, entidad, entidad_id, detalle, ip) VALUES
  ('admin', 'CREAR_RUTA', 'rutas_recojo', '1', JSON_OBJECT('codigo', 'RUTA-LIMA-001'), '127.0.0.1'),
  ('admin', 'ASIGNAR_DONACION', 'donaciones', 'CL-1002', JSON_OBJECT('ruta', 'RUTA-LIMA-001'), '127.0.0.1');
