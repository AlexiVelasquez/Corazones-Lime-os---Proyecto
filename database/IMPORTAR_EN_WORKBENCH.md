# Importar la base de datos en MySQL Workbench

1. Inicia **MySQL** desde XAMPP Control Panel.
2. Abre MySQL Workbench y entra a la conexión local `127.0.0.1:3306`.
3. Selecciona **File > Open SQL Script**.
4. Abre `database/corazones_limenos.sql`.
5. Presiona el botón del rayo para ejecutar todo el script.
6. Actualiza el panel **Schemas**. Debe aparecer `corazones_limenos`.
7. En la raíz del proyecto ejecuta `INICIAR_CON_BASE_DE_DATOS.bat`.

La configuración predeterminada corresponde a XAMPP: usuario `root` sin
contraseña. Si tu servidor utiliza otra contraseña, copia
`backend/config.local.php.example` como `backend/config.local.php` y modifica
sus valores. Ese archivo está excluido de Git para no publicar credenciales.

> El script recrea las tablas para obtener un entorno de demostración limpio.
> Si ya tienes datos importantes, crea una copia de seguridad antes de volver
> a ejecutarlo.

## Tablas

El modelo contiene **22 tablas relacionadas**:

- Seguridad y catálogos: `roles`, `distritos`, `usuarios` y
  `categorias_articulo`.
- Albergues: `albergues`, `documentos_albergue` y `necesidades`.
- Donaciones: `donaciones`, `detalle_donacion` y
  `seguimiento_donacion`.
- Campañas: `campanas` y `campana_albergues`.
- Logística: `puntos_recojo`, `voluntarios`, `rutas_recojo` y
  `ruta_donaciones`.
- Impacto: `insignias`, `usuario_insignias` y `notificaciones`.
- Gestión: `aliados_corporativos`, `mensajes_contacto` y
  `auditoria_sistema`.

Para comprobar la cantidad desde Workbench, ejecuta:

```sql
SELECT COUNT(*) AS total_tablas
FROM information_schema.tables
WHERE table_schema = 'corazones_limenos';
```

El resultado debe ser `22`.

## Comprobar la API

Con el sistema iniciado, abre:

`http://127.0.0.1:8081/api.php?action=health`

Debe responder: `{"ok":true,"database":"corazones_limenos"}`.
