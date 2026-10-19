USE corazones_limenos;

SET @add_latitud = IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'albergues' AND COLUMN_NAME = 'latitud'
  ),
  'SELECT 1',
  'ALTER TABLE albergues ADD COLUMN latitud DECIMAL(10,7) NULL AFTER imagen'
);
PREPARE stmt FROM @add_latitud;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_longitud = IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'albergues' AND COLUMN_NAME = 'longitud'
  ),
  'SELECT 1',
  'ALTER TABLE albergues ADD COLUMN longitud DECIMAL(10,7) NULL AFTER latitud'
);
PREPARE stmt FROM @add_longitud;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE albergues SET latitud = -12.0153000, longitud = -77.0063000 WHERE id = 'esperanza';
UPDATE albergues SET latitud = -12.2137000, longitud = -76.9375000 WHERE id = 'patitas';
UPDATE albergues SET latitud = -11.9360000, longitud = -77.0558000 WHERE id = 'renacer';
UPDATE albergues SET latitud = -11.9827000, longitud = -77.0715000 WHERE id = 'sanjose';
UPDATE albergues SET latitud = -12.0061000, longitud = -77.0838000 WHERE id = 'nuevo';
