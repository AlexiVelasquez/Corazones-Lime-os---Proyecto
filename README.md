# Corazones Limeños — Proyecto Calidad

Aplicación Angular que convierte las pantallas de referencia de Stitch en una experiencia funcional para donantes, albergues y administradores.

## Ejecutar

```bash
npm install
npm start
```

Abre `http://localhost:4200/`.

## Ejecutar sin instalar Angular ni usar internet

El repositorio incluye una versión compilada en `portable/`. En cualquier
computadora Windows:

1. Descarga o copia el repositorio.
2. Abre la carpeta `portable`.
3. Haz doble clic en `iniciar.bat`.

El sistema abrirá `http://127.0.0.1:8080/` y funcionará sin Angular CLI,
Node.js, `npm install` ni conexión a internet. Debe copiarse la carpeta
`portable` completa; no se debe abrir `app/index.html` directamente.

También se puede ejecutar `INICIAR_SIN_INSTALAR.bat`, ubicado en la raíz del
repositorio. No ejecutes `npm ci` en una computadora sin internet.

### Error `EBADENGINE` o `Exit handler never called`

Si la terminal muestra Node `24.13.1` y npm `11.8.0`, esa instalación no es
compatible con las dependencias actuales de Angular CLI. Para desarrollar con
Node y npm se requiere una de estas versiones de Node:

- Node 22.22.2 o una versión 22 posterior compatible.
- Node 24.15.0 o posterior.
- Node 26 o posterior.

En las computadoras con firewall usa `INICIAR_SIN_INSTALAR.bat`. Esta ejecución
no instala paquetes y no modifica la instalación de Node de la computadora.

Cuando se modifique el código fuente, la versión portable se actualiza desde
una computadora de desarrollo con:

```bash
npm run build:portable
```

## Usuarios de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Donante | `donante@calidad.pe` | `Demo123!` |
| Hogar de la Esperanza | `albergue@calidad.pe` | `Demo123!` |
| Patitas Felices | `patitas@calidad.pe` | `Demo123!` |
| Renacer - Adulto Mayor | `renacer@calidad.pe` | `Demo123!` |
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

## Pruebas unitarias

```bash
npm run test:unit
```

Las reglas del negocio y sus casos están en `src/app/business-rules.ts` y `src/app/business-rules.spec.ts`. La documentación IEEE 829 se encuentra en `docs/pruebas-unitarias-ieee829.md`.
