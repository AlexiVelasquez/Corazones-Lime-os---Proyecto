# Corazones Limeños — Proyecto Calidad

Aplicación Angular que convierte las pantallas de referencia de Stitch en una experiencia funcional para donantes, albergues y administradores.

## Ejecutar

```bash
npm install
npm start
```

Abre `http://localhost:4200/`.

El servidor de desarrollo está configurado en `angular.json` con
`host: 0.0.0.0` y `port: 4200`. Esto fuerza la escucha mediante IPv4 en todas
las interfaces. Desde otra computadora o Kali se debe usar la IPv4 de Windows,
por ejemplo `http://10.242.146.148:4200/`; `0.0.0.0` no se escribe en el
navegador.

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

Al ejecutar la versión portable sin MySQL, los datos de demostración se
guardan en `localStorage`. Con `INICIAR_CON_BASE_DE_DATOS.bat` o
`INICIAR_PARA_ZAP.bat`, la aplicación utiliza la API PHP y MySQL. No se envían
correos reales.

## Pruebas unitarias

```bash
npm run test:unit
```

Las reglas del negocio y sus casos están en `src/app/business-rules.ts` y `src/app/business-rules.spec.ts`. La documentación IEEE 829 se encuentra en `docs/pruebas-unitarias-ieee829.md`.

## MySQL y MySQL Workbench

La base de datos se encuentra en `database/corazones_limenos.sql`. Incluye
**22 tablas relacionadas** para usuarios y roles, albergues, campañas,
donaciones y sus artículos, necesidades, puntos de recojo, rutas, voluntarios,
seguimiento, insignias, notificaciones, aliados y auditoría. También incorpora
datos completos de demostración.

1. Inicia el servicio MySQL.
2. En MySQL Workbench selecciona **File > Open SQL Script**.
3. Abre `database/corazones_limenos.sql` y ejecuta todo el script.
4. Si tu usuario `root` tiene contraseña, copia
   `backend/config.local.php.example` como `backend/config.local.php` y coloca
   ahí tus credenciales.
5. Ejecuta `INICIAR_CON_BASE_DE_DATOS.bat`.

La aplicación se abre en `http://127.0.0.1:8080/` y la API PHP en
`http://127.0.0.1:8081/api.php`. Cuando la conexión está activa aparece el
indicador **MySQL conectado**. Si MySQL está apagado, el frontend conserva el
modo local para que la demostración siga funcionando.

Las instrucciones detalladas están en `database/IMPORTAR_EN_WORKBENCH.md`.

## OWASP ZAP desde Kali Linux en VirtualBox

Para exponer la aplicación únicamente durante la práctica de seguridad,
inicia MySQL y ejecuta `INICIAR_PARA_ZAP.bat`. Con el adaptador de Kali en modo
NAT, abre `http://10.0.2.2:8080/` desde Kali y usa esa misma dirección como
objetivo en ZAP. La guía completa está en `docs/OWASP-ZAP-KALI.md`.
