@echo off
title Corazones Limenos - Version portable
cd /d "%~dp0"
echo Iniciando Corazones Limenos sin instalar Angular...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor.ps1"
if errorlevel 1 (
  echo.
  echo No se pudo iniciar la aplicacion.
  pause
)
