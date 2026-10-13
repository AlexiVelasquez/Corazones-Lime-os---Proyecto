CREATE DATABASE IF NOT EXISTS corazones_limenos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE corazones_limenos;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS mensajes_contacto;
DROP TABLE IF EXISTS necesidades;
DROP TABLE IF EXISTS donaciones;
DROP TABLE IF EXISTS albergues;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE usuarios (
  id VARCHAR(40) PRIMARY KEY,
  rol ENUM('donante', 'albergue', 'admin') NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL DEFAULT '',
  correo VARCHAR(160) NOT NULL UNIQUE,
  telefono VARCHAR(20) NOT NULL,
  distrito VARCHAR(100) NOT NULL,
  clave_hash CHAR(64) NOT NULL,
  foto MEDIUMTEXT NULL,
  notificar_impacto TINYINT(1) NOT NULL DEFAULT 1,
  notificar_campanas TINYINT(1) NOT NULL DEFAULT 1,
  notificar_resumen TINYINT(1) NOT NULL DEFAULT 0,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE albergues (
  id VARCHAR(40) PRIMARY KEY,
  usuario_id VARCHAR(40) NULL UNIQUE,
  nombre VARCHAR(160) NOT NULL,
  distrito VARCHAR(100) NOT NULL,
  descripcion VARCHAR(500) NOT NULL DEFAULT '',
  estado ENUM('Pendiente', 'Aprobado', 'Rechazado') NOT NULL DEFAULT 'Pendiente',
  imagen VARCHAR(255) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_albergue_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_albergue_estado (estado),
  INDEX idx_albergue_distrito (distrito)
) ENGINE=InnoDB;

CREATE TABLE donaciones (
  id VARCHAR(40) PRIMARY KEY,
  donante_id VARCHAR(40) NOT NULL,
  albergue_id VARCHAR(40) NOT NULL,
  categoria ENUM('Juguetes', 'Víveres') NOT NULL,
  descripcion VARCHAR(300) NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  estado_articulos ENUM('nuevo', 'como nuevo', 'usado') NOT NULL DEFAULT 'nuevo',
  metodo_entrega ENUM('dropoff', 'pickup') NOT NULL,
  distrito VARCHAR(120) NOT NULL DEFAULT '',
  direccion VARCHAR(220) NOT NULL DEFAULT '',
  referencia VARCHAR(220) NOT NULL DEFAULT '',
  horario VARCHAR(120) NOT NULL DEFAULT '',
  fecha DATE NOT NULL,
  estado ENUM('Pendiente', 'En tránsito', 'Entregado') NOT NULL DEFAULT 'Pendiente',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_donacion_donante FOREIGN KEY (donante_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_donacion_albergue FOREIGN KEY (albergue_id) REFERENCES albergues(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_donacion_cantidad CHECK (cantidad BETWEEN 1 AND 1000),
  INDEX idx_donacion_donante (donante_id),
  INDEX idx_donacion_albergue (albergue_id),
  INDEX idx_donacion_estado (estado)
) ENGINE=InnoDB;

CREATE TABLE necesidades (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  albergue_id VARCHAR(40) NOT NULL,
  descripcion VARCHAR(180) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  activa TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_necesidad_albergue FOREIGN KEY (albergue_id) REFERENCES albergues(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_necesidad_albergue_activa (albergue_id, activa)
) ENGINE=InnoDB;

CREATE TABLE mensajes_contacto (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(160) NOT NULL,
  correo VARCHAR(160) NOT NULL,
  asunto VARCHAR(160) NOT NULL,
  mensaje TEXT NOT NULL,
  estado ENUM('Nuevo', 'Atendido') NOT NULL DEFAULT 'Nuevo',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mensaje_estado (estado)
) ENGINE=InnoDB;

INSERT INTO usuarios
  (id, rol, nombres, apellidos, correo, telefono, distrito, clave_hash,
   notificar_impacto, notificar_campanas, notificar_resumen)
VALUES
  ('carlos', 'donante', 'Carlos', 'Mendoza', 'donante@calidad.pe', '987654321', 'Miraflores', SHA2('Demo123!', 256), 1, 1, 0),
  ('esperanza', 'albergue', 'Hogar de la Esperanza', '', 'albergue@calidad.pe', '987654322', 'San Juan de Lurigancho', SHA2('Demo123!', 256), 1, 1, 0),
  ('patitas', 'albergue', 'Patitas Felices', '', 'patitas@calidad.pe', '987654324', 'Villa El Salvador', SHA2('Demo123!', 256), 1, 1, 0),
  ('renacer', 'albergue', 'Renacer - Adulto Mayor', '', 'renacer@calidad.pe', '987654325', 'Comas', SHA2('Demo123!', 256), 1, 1, 0),
  ('admin', 'admin', 'María', 'García', 'admin@calidad.pe', '987654323', 'San Isidro', SHA2('Demo123!', 256), 1, 1, 0);

INSERT INTO albergues (id, usuario_id, nombre, distrito, descripcion, estado, imagen) VALUES
  ('esperanza', 'esperanza', 'Hogar de la Esperanza', 'San Juan de Lurigancho', 'Refugio y alimentación para niños y adolescentes.', 'Aprobado', '/assets/images/albergue-esperanza.jpg'),
  ('patitas', 'patitas', 'Patitas Felices', 'Villa El Salvador', 'Rescate y rehabilitación de perros y gatos.', 'Aprobado', '/assets/images/albergue-patitas.jpg'),
  ('renacer', 'renacer', 'Renacer - Adulto Mayor', 'Comas', 'Cuidado para adultos mayores en situación vulnerable.', 'Aprobado', '/assets/images/albergue-renacer.jpg'),
  ('sanjose', NULL, 'Refugio San José', 'Los Olivos', 'Solicitud pendiente de revisión.', 'Pendiente', NULL),
  ('nuevo', NULL, 'Hogar Esperanza', 'San Martín de Porres', 'Solicitud pendiente de revisión.', 'Pendiente', NULL);

INSERT INTO donaciones
  (id, donante_id, albergue_id, categoria, descripcion, cantidad, estado_articulos,
   metodo_entrega, distrito, direccion, referencia, horario, fecha, estado)
VALUES
  ('CL-1001', 'carlos', 'esperanza', 'Víveres', 'Canasta de víveres básicos', 2, 'nuevo', 'dropoff', 'Comas', '', '', '', '2026-09-01', 'Entregado'),
  ('CL-1002', 'carlos', 'esperanza', 'Juguetes', '8 pelotas de fútbol', 1, 'como nuevo', 'dropoff', 'Miraflores', '', '', '', '2026-09-09', 'En tránsito');

INSERT INTO necesidades (albergue_id, descripcion, categoria, activa) VALUES
  ('esperanza', '20 pelotas de fútbol', 'Juguetes', 1),
  ('esperanza', '50 kg de arroz', 'Alimentos no perecibles', 1),
  ('patitas', 'Alimento balanceado para perros', 'Alimentos', 1),
  ('renacer', 'Leche y avena', 'Alimentos no perecibles', 1);
