USE corazones_limenos;

-- Actualiza solo las cuentas de demostración de la entrega académica.
-- El backend migrará este SHA-256 a password_hash después del primer acceso.
UPDATE usuarios
SET clave_hash = SHA2('12345678', 256)
WHERE correo IN (
  'donante@calidad.pe',
  'albergue@calidad.pe',
  'patitas@calidad.pe',
  'renacer@calidad.pe',
  'admin@calidad.pe'
);
