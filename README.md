# SplitIA — Gestión Inteligente de Cuentas Compartidas

Aplicación full-stack (**Angular 19** + **ASP.NET Core .NET 10** + **Dapper** + **SQL Server**) para gestionar la separación de gastos y cuentas compartidas entre usuarios, calcular devoluciones en tiempo real, controlar cuotas por participante, registrar pagos y administrar el sistema desde una consola ejecutiva.

---

## Tecnologías utilizadas

- **Backend:** .NET 10, ASP.NET Core Web API (arquitectura CQRS por capas), Dapper, Dapper.Contrib, `Microsoft.Data.SqlClient`, Swagger / OpenAPI
- **Frontend:** Angular 19 (Standalone Components, Signals, Router), compilado en `ApiCQRS/wwwroot` y con fuente en `SeparacionCuentas-Frontend`
- **Base de datos:** SQL Server (`SeparacionCuentas`) con DDL, vistas analíticas, procedimientos almacenados y trigger de auditoría
- **Contenedores:** Docker y Docker Compose (`mcr.microsoft.com/mssql/server:2019-latest`, `ApiCQRS` y Nginx para frontend)
- **Control de versiones:** Git y GitHub

---

## Arquitectura del repositorio

```text
SeparacionCuentas-API
│
├── ApiCQRS                          # API Web .NET 10 + host estático de SplitIA
│   ├── Controllers
│   │   ├── AuthController.cs        # Autenticación SHA-256 y registro (/api/Auth)
│   │   ├── UsuarioController.cs     # CRUD de usuarios y participantes (/api/Usuario)
│   │   ├── CuentaController.cs      # CRUD de cuentas y devoluciones CTE (/api/Cuenta)
│   │   ├── DivisionController.cs    # CRUD de cuotas/divisiones (/api/Division)
│   │   └── SistemaController.cs     # Vistas SQL, ítems, métodos de pago, notificaciones y auditoría (/api/Sistema)
│   ├── DDLs/script.sql              # Esquema completo de BD, índices, vistas, SPs y trigger
│   ├── Properties/launchSettings.json
│   ├── wwwroot/                     # Bundle Angular compilado servido en http://localhost:5266
│   ├── Program.cs                   # Configuración DI, CORS, Swagger, /dbtest y auto-inicialización SQL
│   └── appsettings.json
│
├── ApiCQRS.Models                   # Entidades y DTOs (Usuario, Cuenta, Division, ItemConsumo, MetodoPagoUsuario, NotificacionUsuario, AuditoriaEvento, AuthDtos, DTOs de respuesta)
├── ApiCQRS.Query                    # Consultas de lectura con Dapper y CTEs de saldos/devoluciones
├── ApiCQRS.Repository               # Operaciones de escritura (Add, Update, Delete) sobre SQL Server
├── SeparacionCuentas-Frontend       # Código fuente completo en Angular 19 de SplitIA
├── ApiCQRS.slnx                     # Solución .NET 10
├── Dockerfile                       # Imagen Docker para ApiCQRS
├── docker-compose.yml               # Contenedor SQL Server 2019 (puerto 1433)
├── iniciar-docker-sql.bat           # Script Windows para iniciar SQL Server en Docker y verificar /dbtest
├── SplitIA_SeparacionCuentas_DDL.sql # Script DDL SQL Server listo para descargar/ejecutar
└── INSTALACION.md                   # Guía mínima paso a paso para instalar, inicializar y montar SplitIA
```

> **Inicio rápido y DDL descargable:** Consulta [INSTALACION.md](INSTALACION.md) para el montaje paso a paso y descarga [SplitIA_SeparacionCuentas_DDL.sql](SplitIA_SeparacionCuentas_DDL.sql) si deseas ejecutar el esquema completo directamente en SQL Server.

---

## Funcionalidades principales de SplitIA

### Portal de Usuario (`/usuario/*` y `/bienvenida`)
- **Bienvenida (`/bienvenida`):** Presentación de **SplitIA**, inicio de sesión y registro de nuevas cuentas de usuario directamente contra SQL Server.
- **Panel General (`/usuario/panel`):** Resumen financiero personal con KPIs en vivo (cuentas activas, saldo por cobrar, pagos pendientes y avance de recaudo), detalle de ítems de consumo e interacción rápida con cuotas.
- **Mis Cuentas (`/usuario/cuentas`):** Creación y administración de cuentas propias/donde participa el usuario, adición o retiro de participantes con recálculo automático y cálculo por partes iguales o consumo detallado.
- **Mis Pagos (`/usuario/pagos`):** Gestión de divisiones pendientes y pagadas (`Nequi`, `Bancolombia`, `Daviplata`, `PSE`, `Tarjeta`, etc.) con generación de comprobante.
- **Saldos y Devoluciones (`/usuario/saldos`):** Balance detallado por participante (`RECIBE`, `PAGA`, `SALDADO`) y estado de distribución (`COMPLETA`, `PENDIENTE`, `EXCEDIDA`).
- **Mi Perfil (`/usuario/perfil`):** Vista y edición del perfil autenticado (`PUT /api/Usuario/{id}`), cierre de sesión, cambio de perfil con validación real de correo y contraseña, y cambio entre modo claro y oscuro.

### Consola Administrativa (`/admin/*`)
- **Resumen Ejecutivo (`/admin/resumen`):** Métricas globales del sistema, cuentas recientes y actividad consolidada.
- **Gestión de Usuarios (`/admin/usuarios`):** CRUD completo de usuarios y filtro por cuenta *(el usuario `ADMIN` queda aislado del directorio regular para no mezclarse como participante de gastos)*.
- **Gestión de Cuentas (`/admin/cuentas`):** Administración integral de cuentas e inspector de devoluciones.
- **Gestión de Divisiones (`/admin/divisiones`):** Control de todas las cuotas, referencias de pago y estados.
- **Sistema y Diagnóstico (`/admin/sistema`):** Verificación en vivo de `/dbtest` y catálogo de endpoints de la API.

---

## Base de datos (`SeparacionCuentas`)

El script [ApiCQRS/DDLs/script.sql](ApiCQRS/DDLs/script.sql) y la rutina de arranque en [ApiCQRS/Program.cs](ApiCQRS/Program.cs) garantizan la existencia de:

- **Tablas principales y complementarias:**
  - `dbo.Usuario` (`id_usuario`, `nombre`, `correo`, `password_hash`, `telefono`, `rol`, `activo`, `fecha_registro`)
  - `dbo.Cuenta` (`id_cuenta`, `id_usuario_pagador`, `descripcion`, `monto_total`, `fecha`, `categoria`, `estado`, `notas`)
  - `dbo.Division` (`id_division`, `id_cuenta`, `id_usuario`, `monto`, `estado`, `tipo_pago`, `referencia_pago`, `fecha_pago`, `notas`)
  - `dbo.ItemConsumo`, `dbo.MetodoPagoUsuario`, `dbo.NotificacionUsuario`, `dbo.AuditoriaEvento`
- **Vistas analíticas:**
  - `dbo.vw_ResumenCuentas`: consolidado de cuentas, monto total, dividido, recaudado, pendiente, estado de distribución y porcentaje de recaudo.
  - `dbo.vw_SaldosPorUsuario`: cuentas creadas, volumen pagado, saldo por recibir y deuda pendiente por usuario estándar.
- **Procedimientos almacenados y Trigger:**
  - `dbo.sp_RecalcularDivisionesEquitativas`: recalcula equitativamente las divisiones de una cuenta manejando ajuste de redondeo en la última cuota y registrando evento en auditoría.
  - `dbo.sp_RegistrarPagoDivision`: marca la división como `PAGADO`, guarda método/referencia y marca como leída la notificación asociada.
  - `dbo.tr_Division_Auditoria`: trigger `AFTER INSERT, UPDATE` sobre `dbo.Division` que registra cada asignación o pago en `dbo.AuditoriaEvento`.

---

## Endpoints principales de la API

| Módulo | Endpoints |
| :--- | :--- |
| **Autenticación** (`/api/Auth`) | `POST /api/Auth/login`, `POST /api/Auth/register` |
| **Usuarios** (`/api/Usuario`) | `GET /api/Usuario`, `GET /api/Usuario/{id}`, `GET /api/Usuario/cuenta/{idCuenta}/participantes`, `POST /api/Usuario`, `PUT /api/Usuario/{id}`, `DELETE /api/Usuario/{id}` |
| **Cuentas** (`/api/Cuenta`) | `GET /api/Cuenta`, `GET /api/Cuenta/{id}`, `GET /api/Cuenta/usuario/{idUsuario}`, `GET /api/Cuenta/{idCuenta}/devoluciones`, `POST /api/Cuenta`, `PUT /api/Cuenta/{id}`, `DELETE /api/Cuenta/{id}` |
| **Divisiones** (`/api/Division`) | `GET /api/Division`, `GET /api/Division/{id}`, `GET /api/Division/cuenta/{idCuenta}`, `GET /api/Division/usuario/{idUsuario}`, `POST /api/Division`, `PUT /api/Division/{id}`, `DELETE /api/Division/{id}` |
| **Sistema** (`/api/Sistema`) | `GET /api/Sistema/resumen-cuentas`, `GET /api/Sistema/saldos-usuarios`, `GET /api/Sistema/items`, `POST /api/Sistema/items`, `GET /api/Sistema/metodos-pago/{idUsuario}`, `POST /api/Sistema/metodos-pago`, `GET /api/Sistema/notificaciones/{idUsuario}`, `GET /api/Sistema/auditoria`, `POST /api/Sistema/cuentas/{idCuenta}/recalcular` |
| **Diagnóstico y Docs** | `GET /dbtest`, `GET /swagger` *(en entorno `Development`)* |

---

## Cómo ejecutar el proyecto

### 1. Levantar SQL Server (opcional con Docker)
Si no tienes SQL Server local corriendo en `localhost,1433`, puedes levantarlo con Docker Compose desde la raíz del repositorio:

```bash
docker compose up -d
```

También puedes usar el script [iniciar-docker-sql.bat](iniciar-docker-sql.bat) en Windows.

### 2. Ejecutar la aplicación completa (.NET 10 + Frontend SplitIA)
El proyecto `ApiCQRS` sirve tanto los endpoints REST como el frontend Angular compilado en `ApiCQRS/wwwroot`:

```bash
dotnet run --project ApiCQRS --launch-profile http
```

- **Aplicación web SplitIA:** `http://localhost:5266`
- **Swagger / OpenAPI:** `http://localhost:5266/swagger`
- **Prueba de conexión SQL:** `http://localhost:5266/dbtest`

### 3. Modo desarrollo del Frontend Angular (`ng serve`)
Si deseas editar el frontend con recarga en vivo en `http://localhost:4200` (conectado por `proxy.conf.json` a `http://localhost:5266`):

```bash
cd SeparacionCuentas-Frontend
npm install
npm start
```

Para generar un nuevo bundle de producción y copiarlo en `ApiCQRS/wwwroot`:

```bash
npm run build -- --configuration production
```

*(Luego copia el contenido de `dist/separacion-cuentas-frontend/browser/` dentro de `ApiCQRS/wwwroot/`.)*

---

## Credenciales de prueba incluidas

- **Administrador (`ADMIN`):** `admin@splitia.app` · contraseña `admin123` *(acepta también el alias `admin` en el inicio de sesión)*
- **Usuarios demo (`USUARIO`):** por ejemplo `thomas@correo.com`, `carolina.mejia@splitia.app`, `andres.restrepo@splitia.app` · contraseña `123456`
