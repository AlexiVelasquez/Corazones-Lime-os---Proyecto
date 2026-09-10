# Corazones Limeños — Proyecto Calidad

Aplicación Angular que convierte las pantallas de referencia de Stitch en una experiencia funcional para donantes, albergues y administradores.

## Ejecutar

```bash
npm install
npm start
```

Abre `http://localhost:4200/`.

## Usuarios de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Donante | `donante@calidad.pe` | `Demo123!` |
| Albergue | `albergue@calidad.pe` | `Demo123!` |
| Administrador | `admin@calidad.pe` | `Demo123!` |

En `/ingresar` puedes completar cualquiera de estas cuentas con un clic.

## Funcionalidad incluida

- Landing page, directorio filtrable, contacto y preguntas frecuentes.
- Donación en tres pasos con validación, punto de entrega o recojo a domicilio.
- Panel del donante con seguimiento e insignias.
- Panel del albergue para publicar necesidades y confirmar recepciones.
- Panel administrativo para aprobar albergues, asignar rutas y exportar CSV.
- Perfil, preferencias, foto y cambio de contraseña.

Los datos de esta versión de demostración se guardan en `localStorage`. No existe un backend ni se envían correos reales. Para reiniciar los datos, borra el almacenamiento del sitio desde el navegador.
