# Validación de la rúbrica T2

## Resultado de la revisión

| Requisito de la rúbrica | Estado | Evidencia preparada |
|---|---|---|
| Diagramas corregidos | Cumplido | `docs/DIAGRAMAS-SISTEMA-T2.md` contiene casos de uso, actividad, secuencia, arquitectura y matriz de rutas coherentes con el código. |
| Coevaluación | Preparado para completar | `docs/COEVALUACION.md` incluye escala, criterios y espacio para integrantes. Debe completarse con nombres y puntajes reales. |
| Pruebas del sistema completas | Cumplido | 49 pruebas automatizadas, compilación y verificación visible de login, rutas y donación; matriz funcional en `docs/PRUEBAS-SISTEMA-T2.md`. |
| Validación de acceso por rutas OWASP | Cumplido | Guards por rol, comprobación en API, CSRF, sesión y casos SEG-01 a SEG-10. |
| Caso de uso inicio de sesión | Cumplido | Validación, estado de carga, bloqueo de doble envío, mensajes, sesión por rol, retorno seguro, cierre y renovación CSRF. |

## Correcciones realizadas durante la revisión

- Se unificó el valor **como nuevo** entre Angular, PHP y MySQL.
- Se validan correo y contraseña antes de solicitar autenticación.
- El botón de ingreso se bloquea mientras la solicitud está en curso.
- El retorno posterior al login acepta perfil, donación o panel solo cuando el
  rol tiene permiso, y rechaza URL externas.
- El cliente renueva una vez el token CSRF cuando la sesión de seguridad expira.
- Se añadieron pruebas de los guards reales, del login y de la recuperación CSRF.

## Preparación de la exposición de 15 minutos

| Minutos | Contenido |
|:---:|---|
| 0 a 2 | Problema, usuarios y arquitectura. |
| 2 a 6 | Login, roles y demostración de rutas bloqueadas. |
| 6 a 10 | Donación y flujo operativo admin-albergue. |
| 10 a 13 | Pruebas automatizadas y resultados de ZAP. |
| 13 a 15 | Diagramas, conclusiones y preguntas. |

La coevaluación y los nombres de los expositores requieren datos reales del
grupo y deben completarse antes de comprimir la entrega.
