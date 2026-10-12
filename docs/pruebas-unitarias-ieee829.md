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

## Procedimiento de ejecución

1. Abrir una terminal en la carpeta `Proyectocalidad`.
2. Ejecutar `npm install` si las dependencias aún no están instaladas.
3. Ejecutar `npm run test:unit`.
4. Verificar que Vitest indique todos los archivos y casos en estado `passed`.

## Relación con TDD

La estructura permite aplicar el ciclo solicitado:

1. **Red:** crear un caso nuevo en `business-rules.spec.ts` y comprobar que falle.
2. **Green:** implementar la regla mínima en `business-rules.ts` hasta que pase.
3. **Refactor:** mejorar el código sin modificar los resultados observables; volver a ejecutar toda la suite para prevenir regresiones.
