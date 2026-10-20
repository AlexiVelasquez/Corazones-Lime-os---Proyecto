# Plan y evidencia de pruebas del sistema T2

## Objetivo

Comprobar los flujos completos de Corazones Limeños, el caso de uso de inicio
de sesión y la separación de permisos por rutas solicitada en la rúbrica T2.

## Pruebas automatizadas

Ejecutar desde la carpeta del proyecto:

```powershell
npm run test:unit
npm run build
C:\xampp\php\php.exe -l backend\api.php
```

La suite cubre reglas de donación, registro, perfiles, estados, matriz de
permisos, guards reales de Angular, login, retorno seguro y renovación CSRF.

Resultado de la revisión del 19 de octubre de 2026:

- 5 archivos de pruebas aprobados.
- 58 pruebas automatizadas aprobadas.
- Compilación de producción aprobada.
- Sintaxis de `backend/api.php` aprobada.

## Casos funcionales del sistema

| ID | Escenario | Datos o acción | Resultado esperado |
|---|---|---|---|
| SYS-01 | Login donante | `donante@calidad.pe` y `12345678` | Abre `/panel/donante`. |
| SYS-02 | Login albergue | `albergue@calidad.pe` y `12345678` | Abre `/panel/albergue`. |
| SYS-03 | Login administrador | `admin@calidad.pe` y `12345678` | Abre `/panel/admin`. |
| SYS-04 | Credenciales inválidas | Contraseña incorrecta | Muestra error y no crea sesión. |
| SYS-05 | Doble envío | Presionar Ingresar repetidamente | Se procesa una sola solicitud. |
| SYS-06 | Donación completa | Juguete como nuevo, cantidad y entrega válidas | Registra la donación y muestra su código. |
| SYS-07 | Necesidad de albergue | Publicar y marcar cubierta | Solo el albergue aprobado puede modificarla. |
| SYS-08 | Flujo logístico | Admin asigna y albergue confirma | Pendiente → En tránsito → Entregado. |
| SYS-09 | Perfil | Editar datos y contraseña | Guarda únicamente el perfil autenticado. |
| SYS-10 | Registro donante | Datos completos | Crea cuenta de donante e inicia sesión. |
| SYS-11 | Registro albergue | Datos institucionales completos | Crea cuenta y estado Pendiente. |
| SYS-12 | Mapa de albergue | Elegir una sede del directorio | Muestra sus coordenadas, dirección y accesos a Google Maps. |
| SYS-13 | Mapa de entrega | Elegir un punto de recojo | Actualiza el mapa, referencia y horario del punto. |

Durante la verificación en navegador se ejecutaron SYS-01 y SYS-06. El login
abrió `/panel/donante` y la donación **Juguetes educativos en excelente estado**
con condición **Como nuevo** apareció en el historial con estado Pendiente.

## Casos de seguridad por rutas

| ID | Sesión | URL solicitada | Resultado esperado |
|---|---|---|---|
| SEG-01 | Sin sesión | `/perfil` | Redirige a `/ingresar?returnUrl=%2Fperfil`. |
| SEG-02 | Sin sesión | `/panel/admin` | Redirige al login. |
| SEG-03 | Donante | `/panel/admin` | Bloquea y vuelve a `/panel/donante`. |
| SEG-04 | Albergue | `/donar` | Bloquea y vuelve a `/panel/albergue`. |
| SEG-05 | Administrador | `/panel/donante` | Bloquea y vuelve a `/panel/admin`. |
| SEG-06 | Donante | `/panel/admin/donaciones` | Ignora el parámetro alterado y vuelve a su panel. |
| SEG-07 | Donante | `returnUrl=//sitio-externo` | Ignora el destino externo. |
| SEG-08 | Sin CSRF | `POST createDonation` | API responde 403. |
| SEG-09 | Rol incorrecto | Albergue llama `createDonation` | API responde 403. |
| SEG-10 | Recurso ajeno | Albergue modifica necesidad de otro | API no modifica el registro. |

SEG-03 se comprobó además en el navegador: al solicitar `/panel/admin` con la
sesión donante, Angular regresó a `/panel/donante` y mostró el mensaje de acceso
denegado. SEG-01 a SEG-07 también están cubiertos por pruebas automatizadas; las
comprobaciones de API requieren iniciar MySQL con las credenciales locales.

## Evidencia para la exposición

1. Mostrar la ejecución de la suite y el total de pruebas aprobadas.
2. Abrir una ruta privada sin sesión y luego iniciar sesión.
3. Intentar `/panel/admin` con la cuenta donante.
4. Ejecutar el flujo de donación con estado **Como nuevo**.
5. Enseñar en ZAP las cabeceras CSP, anti-clickjacking y `nosniff`.
6. Mostrar el reporte ZAP y explicar CWE-693, CWE-1021 y CWE-200.

