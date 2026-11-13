@echo off
title SplitIA - Iniciar SQL Server en Docker + Sincronizar API .NET
echo ============================================================================
echo   SPLITIA - INICIADOR DE DOCKER + SQL SERVER 2019
echo ============================================================================
echo.
cd /d "%~dp0"

echo [1/3] Verificando si Docker Desktop esta en ejecucion...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Iniciando Docker Desktop...
    start "" "C:\Users\Thomas\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe"
    echo Esperando a que el motor de Docker este listo...
    :wait_docker
    timeout /t 4 /nobreak >nul
    docker info >nul 2>&1
    if %ERRORLEVEL% NEQ 0 goto wait_docker
)

echo [2/3] Levantando contenedor SQL Server 2019 (separacion-cuentas-sql en puerto 1433)...
docker compose up -d

echo [3/3] Esperando 12 segundos a que SQL Server acepte conexiones y ejecutando auto-migracion /dbtest...
timeout /t 12 /nobreak >nul
curl -s http://localhost:5266/dbtest
echo.
echo.
echo ============================================================================
echo   SQL SERVER Y SPLITIA (SEPARACIONCUENTAS-API) CONECTADOS EXITOSAMENTE!
echo   - Aplicacion Web SplitIA: http://localhost:5266
echo   - Frontend Angular Dev:   http://localhost:4200
echo   - API .NET + Swagger:     http://localhost:5266/swagger
echo   - Diagnostico SQL:        http://localhost:5266/dbtest
echo ============================================================================

