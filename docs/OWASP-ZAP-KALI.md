# Analizar Corazones Limeños con OWASP ZAP desde Kali Linux

## 1. Configurar VirtualBox

1. Apaga completamente la máquina virtual Kali.
2. En VirtualBox abre **Configuración > Red > Adaptador 1**.
3. Marca **Habilitar adaptador de red**.
4. En **Conectado a** selecciona **NAT** y vuelve a iniciar Kali.

En la configuración NAT predeterminada, VirtualBox representa al equipo
Windows con la dirección `10.0.2.2`. No uses `localhost` dentro de Kali, porque
esa dirección representa a la propia máquina virtual.

Si utilizas **Adaptador puente**, consulta la IPv4 de Windows con `ipconfig` y
usa esa dirección. Por ejemplo, si Windows muestra `10.242.146.148`, desde Kali
debes abrir `http://10.242.146.148:8080/`. Kali debe recibir una dirección del
mismo rango mediante `ip addr`.

Si VirtualBox 7.2 bloquea el acceso al bucle local, apaga Kali y ejecuta en una
terminal de Windows, sustituyendo `Kali Linux` por el nombre exacto de la VM:

```powershell
VBoxManage modifyvm "Kali Linux" --nat-localhostreachable1 on
```

## 2. Iniciar el proyecto en Windows

1. Inicia **MySQL** desde XAMPP.
2. Ejecuta `INICIAR_PARA_ZAP.bat` desde la raíz del proyecto.
3. Si Windows pregunta por el Firewall, permite PHP y PowerShell solamente en
   **redes privadas**.
4. Mantén abierta la ventana del servidor mientras realizas el análisis.

Este inicio publica el frontend en el puerto `8080` y la API en el `8081`.
MySQL continúa limitado al equipo Windows y no necesita exponerse a Kali.

La configuración IPv4 también está declarada en `angular.json`: Angular CLI
escucha en `0.0.0.0:4200`. Si se inicia con `npm run start:ipv4`, desde Kali se
usa la IPv4 de Windows seguida de `:4200`. El modo portable para ZAP continúa
usando el puerto `8080`.

## 3. Comprobar la conexión desde Kali

En la terminal de Kali ejecuta:

```bash
ip route
curl -I http://10.0.2.2:8080/
curl http://10.0.2.2:8081/api.php?action=health
```

La primera petición debe mostrar `HTTP/1.1 200 OK`. La segunda debe responder:

```json
{"ok":true,"database":"corazones_limenos"}
```

También puedes abrir `http://10.0.2.2:8080/` en Firefox de Kali.

## 4. Ejecutar el análisis en ZAP

1. Abre **OWASP ZAP**.
2. En **Quick Start**, selecciona **Automated Scan**.
3. Escribe `http://10.0.2.2:8080/` en **URL to attack**.
4. Activa el rastreador para aplicaciones JavaScript disponible en tu versión
   de ZAP, como **Client Spider** o **Ajax Spider**.
5. Presiona **Attack** y espera a que terminen el rastreo y el análisis activo.
6. Recorre también el inicio de sesión y los tres paneles mediante **Manual
   Explore** para que ZAP registre las rutas protegidas.

Realiza análisis activos únicamente contra este proyecto local o contra
sistemas para los que tengas autorización.

## 5. Generar el reporte

1. Abre **Report > Generate Report…**.
2. Coloca como título `Reporte OWASP ZAP - Corazones Limeños`.
3. Selecciona el sitio `http://10.0.2.2:8080`.
4. Elige una plantilla HTML o PDF e incluye todos los niveles de riesgo.
5. Selecciona la carpeta de destino y presiona **Generate Report**.

Referencias oficiales:

- [Manual de red de Oracle VirtualBox](https://download.virtualbox.org/virtualbox/7.2.6/UserManual.pdf)
- [Quick Start de OWASP ZAP](https://www.zaproxy.org/docs/desktop/addons/quick-start/)
- [Generación de reportes de OWASP ZAP](https://www.zaproxy.org/docs/desktop/addons/report-generation/)
