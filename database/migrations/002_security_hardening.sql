USE corazones_limenos;

-- Permite que PHP migre las contraseñas SHA-256 antiguas a password_hash
-- gradualmente cada vez que un usuario inicia sesión correctamente.
ALTER TABLE usuarios
  MODIFY clave_hash VARCHAR(255) NOT NULL;
