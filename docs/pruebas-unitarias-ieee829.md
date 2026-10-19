# Especificación de pruebas unitarias - IEEE 829

## Proyecto

Corazones Limeños - plataforma de donaciones para albergues de Lima.

## Herramienta utilizada

El proyecto está desarrollado con Angular y TypeScript. Las pruebas se ejecutan con **Vitest**, mediante el ejecutor oficial de Angular CLI. JUnit corresponde a proyectos Java; Vitest utiliza la misma estructura de la familia xUnit: preparación, ejecución y aserción del resultado.

Archivos principales:

- Código bajo prueba: `src/app/business-rules.ts`
- Clase de prueba: `src/app/business-rules.spec.ts`
- Comando de ejecución: `npm run test:unit`

## Casos de prueba

| ID | Historia de usuario | Nombre de la prueba | Prioridad | Precondición | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|---|---|
| CP-UNIT-001 | HU-DON-01 | Aceptar categoría Juguetes | Alta | Formulario de donación iniciado | `Juguetes` | Categoría válida | Categoría válida | PASS |
| CP-UNIT-002 | HU-DON-01 | Rechazar categoría desconocida | Alta | Formulario de donación iniciado | vacío, `Dinero` | Validación rechazada | Validación rechazada | PASS |
| CP-UNIT-003 | HU-DON-02 | Aceptar detalle y cantidad válidos | Alta | Categoría seleccionada | `Cinco pelotas nuevas`, `5` | Detalle válido | Detalle válido | PASS |
| CP-UNIT-004 | HU-DON-02 | Rechazar descripción corta | Alta | Categoría seleccionada | `pan`, `1` | Mensaje de mínimo 5 caracteres | Mensaje esperado | PASS |
| CP-UNIT-005 | HU-DON-02 | Rechazar cantidad fuera del rango | Alta | Categoría seleccionada | `0`, `1001`, `1.5`, `NaN` | Validación rechazada | Validación rechazada | PASS |
| CP-UNIT-006 | HU-DON-02 | Aceptar cantidades límite | Media | Categoría seleccionada | `1`, `1000` | Ambos límites válidos | Ambos límites válidos | PASS |
| CP-UNIT-007 | HU-DON-03 | Exigir punto de recojo | Alta | Método `dropoff` | Distrito vacío y Miraflores | Vacío inválido; Miraflores válido | Resultado esperado | PASS |
| CP-UNIT-008 | HU-DON-03 | Validar recojo a domicilio | Alta | Método `pickup` | Dirección y horario | Solo acepta datos completos | Resultado esperado | PASS |
| CP-UNIT-009 | HU-DON-03 | Validar albergue aprobado | Alta | Donación completa | `renacer` aprobado/no aprobado | Solo registra al aprobado | Resultado esperado | PASS |
| CP-UNIT-010 | HU-DON-02 | Limitar contador de cajas | Media | Formulario de detalle | `-5`, `15`, `1500` | `1`, `15`, `1000` | `1`, `15`, `1000` | PASS |
| CP-UNIT-011 | HU-ADM-01 | Asignar ruta como administrador | Alta | Donación pendiente | Pendiente + administrador | En tránsito | En tránsito | PASS |
| CP-UNIT-012 | HU-ALB-01 | Confirmar recepción como albergue | Alta | Donación en tránsito | En tránsito + albergue | Entregado | Entregado | PASS |
| CP-UNIT-013 | HU-SEG-01 | Bloquear transición no autorizada | Alta | Sesión iniciada | Combinaciones de rol y estado no permitidas | El estado no cambia | El estado no cambia | PASS |
| CP-UNIT-014 | HU-PER-01 | Validar formato de correo | Alta | Edición de perfil | correo válido e inválido | `true`, `false` | `true`, `false` | PASS |
| CP-UNIT-015 | HU-PER-01 | Validar teléfono | Media | Edición de perfil | `+51 987654321`, `123` | `true`, `false` | `true`, `false` | PASS |
| CP-UNIT-016 | HU-SEG-02 | Aceptar cambio de contraseña | Alta | Usuario autenticado | Actual correcta y nuevas iguales | Validación aceptada | Validación aceptada | PASS |
| CP-UNIT-017 | HU-SEG-02 | Rechazar contraseña actual incorrecta | Alta | Usuario autenticado | Actual incorrecta | Validación rechazada | Validación rechazada | PASS |
| CP-UNIT-018 | HU-SEG-02 | Rechazar contraseñas nuevas diferentes | Alta | Usuario autenticado | Nuevas diferentes | Validación rechazada | Validación rechazada | PASS |
| CP-UNIT-019 | HU-REG-01 | Registrar donante válido | Alta | Formulario completo | Datos válidos | Registro aceptado | Registro aceptado | PASS |
| CP-UNIT-020 | HU-SEG-03 | Bloquear registro público de administrador | Alta | Formulario de registro | Rol `admin` | Validación rechazada | Validación rechazada | PASS |
| CP-UNIT-021 | HU-REG-01 | Exigir contraseña compleja | Alta | Formulario de registro | `simple` | Validación rechazada | Validación rechazada | PASS |
| CP-UNIT-022 | HU-REG-01 | Exigir contraseñas coincidentes | Alta | Formulario de registro | Contraseñas distintas | Validación rechazada | Validación rechazada | PASS |
| CP-UNIT-023 | HU-ALB-02 | Exigir datos institucionales | Alta | Registro de albergue | Datos incompletos | Validación rechazada | Validación rechazada | PASS |
| CP-UNIT-024 | HU-ALB-02 | Registrar solicitud de albergue | Alta | Formulario completo | RUC, dirección y descripción válidos | Registro aceptado | Registro aceptado | PASS |
| CP-UNIT-025 | HU-SEG-04 | Bloquear áreas protegidas sin sesión | Alta | Usuario anónimo | Perfil y donación | Acceso denegado | Acceso denegado | PASS |
| CP-UNIT-026 | HU-SEG-04 | Restringir donaciones por rol | Alta | Sesión iniciada | Donante, albergue y admin | Solo accede donante | Solo accede donante | PASS |
| CP-UNIT-027 | HU-SEG-04 | Separar paneles por rol | Alta | Sesión iniciada | Tres roles y tres paneles | Cada rol abre solo su panel | Resultado esperado | PASS |
| CP-UNIT-028 | HU-PER-01 | Permitir perfil a usuarios autenticados | Media | Sesión iniciada | Tres roles | Los tres acceden a su perfil | Resultado esperado | PASS |
| CP-UNIT-029 | HU-SEG-04 | Conservar retorno interno permitido | Alta | Login requerido | Perfil, donación y panel propio | Retorno aceptado | Resultado esperado | PASS |
| CP-UNIT-030 | HU-SEG-04 | Bloquear retorno externo o de otro rol | Alta | Login requerido | URL externa y panel ajeno | Retorno rechazado | Resultado esperado | PASS |
| CP-UNIT-031 | HU-SEG-04 | Redirigir anónimo al login | Alta | Sin sesión | `/perfil` | Login con `returnUrl` | Resultado esperado | PASS |
| CP-UNIT-032 | HU-DON-01 | Autorizar ruta de donación | Alta | Sesión donante | `/donar` | Acceso permitido | Acceso permitido | PASS |
| CP-UNIT-033 | HU-SEG-04 | Bloquear área de otro rol | Alta | Sesión donante | `/panel/admin` | Regreso al panel propio | Resultado esperado | PASS |
| CP-UNIT-034 | HU-SEG-04 | Bloquear parámetro de rol alterado | Alta | Sesión donante | `role=admin` | Regreso al panel propio | Resultado esperado | PASS |
| CP-UNIT-035 | HU-LOGIN-01 | Evitar login con sesión activa | Media | Sesión donante | `/ingresar` | Redirección al panel | Resultado esperado | PASS |
| CP-UNIT-036 | HU-SEG-04 | Comprobar guards en rutas privadas | Alta | Configuración de rutas | Nueve rutas privadas | Todas tienen guard | Resultado esperado | PASS |
| CP-UNIT-037 | HU-LOGIN-01 | Validar campos antes de autenticar | Alta | Formulario de login | Correo inválido y clave vacía | No llama a la API | Resultado esperado | PASS |
| CP-UNIT-038 | HU-LOGIN-01 | Mostrar error de autenticación | Alta | Formulario completo | Contraseña incorrecta | Mensaje y sin navegación | Resultado esperado | PASS |
| CP-UNIT-039 | HU-LOGIN-01 | Redirigir según rol | Alta | Credenciales válidas | Cuenta donante | Panel donante | Panel donante | PASS |
| CP-UNIT-040 | HU-LOGIN-01 | Recuperar ruta autorizada | Alta | Login desde donación | `/donar/entrega` | Regresa al flujo | Resultado esperado | PASS |
| CP-UNIT-041 | HU-SEG-04 | Impedir redirección abierta | Alta | Credenciales válidas | URL externa | Abre panel propio | Resultado esperado | PASS |
| CP-UNIT-042 | HU-LOGIN-01 | Evitar doble envío | Alta | Login en curso | Dos envíos seguidos | Una solicitud | Una solicitud | PASS |
| CP-UNIT-043 | HU-SEG-05 | Renovar CSRF expirado | Alta | Token expirado | Respuesta `CSRF_INVALID` | Renueva y reintenta una vez | Resultado esperado | PASS |
| CP-UNIT-044 | HU-SEG-05 | No reintentar un 403 de rol | Alta | Rol sin permiso | Respuesta `FORBIDDEN` | Propaga el rechazo | Resultado esperado | PASS |
| CP-UNIT-051 | HU-ADM-01 | Crear cuenta administrativa | Alta | Sesión con rol administrador | Datos válidos | Cuenta admin creada | Resultado esperado | PASS |
| CP-UNIT-052 | HU-ADM-01 | Bloquear alta admin por otro rol | Alta | Sesión con rol donante | Datos válidos | Operación rechazada | Resultado esperado | PASS |

## Procedimiento de ejecución

1. Abrir una terminal en la carpeta `Proyectocalidad`.
2. Ejecutar `npm install` si las dependencias aún no están instaladas.
3. Ejecutar `npm run test:unit`.
4. Verificar que Vitest indique **57 pruebas** en estado `passed` (los casos
   parametrizados de CP-UNIT-005 se contabilizan por cada dato de entrada).

## Relación con TDD

La estructura permite aplicar el ciclo solicitado:

1. **Red:** crear un caso nuevo en `business-rules.spec.ts` y comprobar que falle.
2. **Green:** implementar la regla mínima en `business-rules.ts` hasta que pase.
3. **Refactor:** mejorar el código sin modificar los resultados observables; volver a ejecutar toda la suite para prevenir regresiones.
