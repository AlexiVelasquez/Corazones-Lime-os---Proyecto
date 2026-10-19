# Diagramas corregidos del sistema

Los diagramas representan la implementación actual de Corazones Limeños. La
autorización se valida en Angular para la navegación y se vuelve a comprobar en
la API antes de consultar o modificar información.

## Diagrama de casos de uso

```mermaid
flowchart LR
  visitante[Visitante]
  donante[Donante]
  albergue[Albergue]
  admin[Administrador]

  inicio((Consultar landing))
  directorio((Consultar albergues))
  contacto((Enviar consulta))
  registro((Registrar cuenta))
  login((Iniciar sesión))
  donar((Registrar donación))
  seguimiento((Consultar seguimiento))
  necesidades((Gestionar necesidades))
  recepcion((Confirmar recepción))
  aprobacion((Aprobar albergues))
  rutas((Asignar rutas))
  reporte((Exportar reporte))
  perfil((Gestionar perfil))

  visitante --> inicio
  visitante --> directorio
  visitante --> contacto
  visitante --> registro
  visitante --> login
  donante --> donar
  donante --> seguimiento
  donante --> perfil
  albergue --> necesidades
  albergue --> recepcion
  albergue --> perfil
  admin --> aprobacion
  admin --> rutas
  admin --> reporte
  admin --> perfil
```

## Actividad del inicio de sesión

```mermaid
flowchart TD
  A[Usuario abre Ingresar] --> B[Completa correo y contraseña]
  B --> C{Formato válido}
  C -- No --> D[Mostrar validación]
  C -- Sí --> E[Enviar JSON con token CSRF]
  E --> F{Token vigente}
  F -- No --> G[Renovar token una vez]
  G --> E
  F -- Sí --> H{Credenciales válidas y cuenta activa}
  H -- No --> I[Registrar intento y mostrar error genérico]
  H -- Sí --> J[Regenerar ID de sesión]
  J --> K[Identificar rol]
  K --> L{Return URL interna y autorizada}
  L -- Sí --> M[Abrir ruta solicitada]
  L -- No --> N[Abrir panel del rol]
```

## Secuencia de autenticación y autorización

```mermaid
sequenceDiagram
  actor U as Usuario
  participant A as Angular
  participant G as Guard
  participant P as API PHP
  participant D as MySQL

  U->>A: Solicita una ruta privada
  A->>G: Evalúa sesión y rol
  alt Sin sesión
    G-->>A: Redirige a /ingresar con returnUrl
    U->>A: Envía credenciales
    A->>P: POST login con CSRF
    P->>D: Busca cuenta activa
    D-->>P: Rol y hash de contraseña
    P-->>A: Sesión HttpOnly y cuenta
    A->>G: Reevalúa destino permitido
  else Sesión con rol incorrecto
    G-->>A: Redirige al panel propio
  else Sesión autorizada
    G-->>A: Permite navegación
  end
  A->>P: Solicita o modifica un recurso
  P->>P: Verifica CSRF sesión rol y propiedad
  P->>D: Ejecuta consulta preparada
  D-->>P: Resultado
  P-->>A: JSON sin detalles internos
```

## Arquitectura y despliegue para la demostración

```mermaid
flowchart LR
  subgraph Windows[Equipo Windows]
    Browser[Navegador]
    Angular[Angular 4200 o portable 8080]
    API[API PHP 8081]
    DB[(MySQL corazones_limenos)]
    Browser --> Angular
    Angular -->|JSON cookies y CSRF| API
    API -->|PDO y consultas preparadas| DB
  end

  subgraph Kali[VirtualBox Kali]
    ZAP[OWASP ZAP]
  end

  ZAP -->|IPv4 privada 4200 o 8080| Angular
  ZAP -->|Verificación autorizada| API
```

## Matriz resumida de rutas

| Ruta | Público | Donante | Albergue | Administrador |
|---|:---:|:---:|:---:|:---:|
| `/`, `/albergues`, `/contacto` | Sí | Sí | Sí | Sí |
| `/donar` y subrutas | No | Sí | No | No |
| `/panel/donante` | No | Sí | No | No |
| `/panel/albergue` | No | No | Sí | No |
| `/panel/admin` | No | No | No | Sí |
| `/perfil` | No | Sí | Sí | Sí |

