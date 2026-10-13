@echo off
cd /d "%~dp0"
echo Iniciando Corazones Limenos para analizarlo desde Kali con OWASP ZAP...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\iniciar-con-bd.ps1" -NetworkAccess
