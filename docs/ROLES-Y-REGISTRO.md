# Registro de cuentas y roles

## Tipos de cuenta

| Rol | Forma de acceso | Funciones permitidas |
|---|---|---|
| Donante | Registro público o cuenta de demostración | Registrar donaciones, consultar su seguimiento, ver insignias y gestionar su perfil. |
| Albergue | Registro público sujeto a aprobación | Consultar aportes asignados, publicar necesidades cuando esté aprobado, confirmar recepciones y gestionar su perfil. |
| Administrador | Cuenta asignada internamente | Aprobar o rechazar albergues, asignar donaciones a rutas, consultar métricas y reportes globales. |

El administrador no aparece como opción en el formulario de registro para
evitar que una persona se otorgue privilegios de supervisión.

## Flujo de registro

1. El usuario abre `/registro` y elige **Donante** o **Albergue**.
2. Completa los datos del responsable, contacto, distrito y contraseña.
3. Si eligió albergue, también registra nombre institucional, RUC, dirección y
   descripción de su labor.
4. El sistema comprueba que el correo y el RUC no estén registrados.
5. La cuenta queda autenticada y entra en el panel correspondiente.
6. Un albergue nuevo permanece **Pendiente** hasta que un administrador lo
   apruebe. Mientras tanto puede revisar su panel y perfil, pero no publicar
   necesidades.

La contraseña exige al menos ocho caracteres, una mayúscula, una minúscula y
un número. El formulario también verifica correo, teléfono, distrito,
coincidencia de contraseñas y aceptación de los términos.

## Matriz de autorización

| Acción | Donante | Albergue | Administrador |
|---|:---:|:---:|:---:|
| Crear una donación propia | Sí | No | No |
| Ver sus donaciones | Sí | No | No |
| Ver donaciones destinadas al albergue | No | Sí | No |
| Consultar todas las donaciones | No | No | Sí |
| Publicar necesidades | No | Sí, si está aprobado | No |
| Activar o cerrar sus necesidades | No | Sí | No |
| Pasar una donación a «En tránsito» | No | No | Sí |
| Confirmar una entrega «Entregada» | No | Sí, si está asignada | No |
| Aprobar o rechazar albergues | No | No | Sí |
| Editar su propio perfil y contraseña | Sí | Sí | Sí |

Las rutas Angular impiden abrir paneles ajenos y redirigen al panel correcto.
La API PHP vuelve a verificar la sesión y el rol antes de modificar datos; por
eso cambiar la URL o enviar una petición manual no concede permisos.

## Estados de un albergue

- **Pendiente:** solicitud recibida; aún no puede publicar necesidades.
- **Aprobado:** institución validada y con funciones operativas habilitadas.
- **Rechazado:** solicitud denegada; no puede operar como albergue.

## Estados de una donación

1. **Pendiente:** el donante registró el aporte.
2. **En tránsito:** el administrador incorporó la entrega a la operación.
3. **Entregado:** el albergue receptor confirmó la recepción.

No se permiten saltos ni retrocesos entre estados desde la API.
