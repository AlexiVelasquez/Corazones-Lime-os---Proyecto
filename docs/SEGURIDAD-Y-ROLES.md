# Seguridad, sesiones y permisos

## Matriz de acceso

| Ruta o acción | Público | Donante | Albergue | Administrador |
|---|:---:|:---:|:---:|:---:|
| Inicio, directorio y contacto | Sí | Sí | Sí | Sí |
| Ingreso y registro | Sí | Redirige a su panel | Redirige a su panel | Redirige a su panel |
| `/donar`, `/donar/detalle`, `/donar/entrega` | No | Sí | No | No |
| `/panel/donante` | No | Sí | No | No |
| `/panel/albergue` | No | No | Sí | No |
| `/panel/admin` | No | No | No | Sí |
| `/panel/:role/donaciones` y `/albergues` | No | Solo su rol | Solo su rol | Solo su rol |
| `/perfil` | No | Sí | Sí | Sí |

Angular aplica esta matriz con guards después de esperar la restauración de la
sesión. Una denegación dirige al ingreso o al panel propio y muestra un mensaje.
Esto mejora la navegación, pero la barrera de seguridad definitiva está en PHP:
cada operación vuelve a validar sesión, rol y propiedad del recurso.

## Controles implementados en la API

- Cookies de sesión `HttpOnly` y `SameSite=Strict`; `Secure` se activa al usar HTTPS.
- Sesión expirada después de 30 minutos de inactividad y rotada cada 10 minutos.
- Token CSRF de 256 bits obligatorio para todas las operaciones `POST`.
- CORS limitado al mismo equipo y a los puertos de frontend 4200/8080.
- Lista explícita de métodos y acciones; las combinaciones incorrectas devuelven 405.
- Límites de intentos para ingreso, registro y formulario de contacto.
- Cuerpo JSON limitado a 1 MB, tipos y longitudes comprobados en servidor.
- Consultas preparadas PDO y autorización por propiedad en donaciones/necesidades.
- Mensajes de error genéricos para el cliente; el detalle técnico va al log de PHP.
- Contraseñas nuevas con `password_hash`; las SHA-256 anteriores se actualizan al
  siguiente inicio de sesión cuando la columna admite 255 caracteres.

## Cabeceras frente a ZAP

El servidor Angular, el servidor portable y la API envían `Content-Security-Policy`,
`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` y
`Permissions-Policy`. Estas cabeceras corrigen las alertas observadas de CSP
ausente y protección anti-clickjacking ausente.

No se añade HSTS durante la práctica porque el proyecto se ejecuta por HTTP en
una red privada. HSTS debe habilitarse únicamente al desplegar con un certificado
HTTPS válido.

## Base existente

En MySQL Workbench abre y ejecuta:

```text
database/migrations/002_security_hardening.sql
```

Una importación nueva de `database/corazones_limenos.sql` ya contiene el cambio.
