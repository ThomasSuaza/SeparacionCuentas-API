# SplitIA · Gestión Inteligente de Cuentas Compartidas

Aplicación full-stack (**Angular** + **ASP.NET Core .NET 10** + **SQL Server**) para gestionar la separación de cuentas entre diferentes usuarios, calcular devoluciones en tiempo real y administrar pagos, consumos y auditoría.

El sistema permite registrar usuarios con autenticación real en SQL Server, crear cuentas pagadas por un participante, detallar ítems de consumo, dividir el valor de cada cuenta entre participantes (y recalcular equitativamente al agregar o quitar integrantes), gestionar métodos de pago y consultar vistas/reportes desde un portal de usuario y una consola administrativa.

---

## Tecnologías utilizadas

- **Backend:** .NET 10, ASP.NET Core Web API, Dapper, Dapper.Contrib, Microsoft.Data.SqlClient, Swagger / OpenAPI
- **Frontend:** Angular (compilado y servido desde `ApiCQRS/wwwroot`, código fuente en `SeparacionCuentas-Frontend`)
- **Base de datos:** SQL Server (`SeparacionCuentas`) / Docker
- **Control de versiones:** Git y GitHub

---

## Arquitectura del proyecto

La solución está organizada en diferentes capas para separar las responsabilidades de la aplicación:

```text
SeparacionCuentas-API
│
├── ApiCQRS
│   ├── Controllers          # Usuario, Cuenta, Division, Auth, Sistema
│   ├── DDLs/script.sql      # Esquema completo, vistas, SPs, trigger y seed
│   ├── wwwroot              # Bundle compilado de Angular (SplitIA)
│   ├── Program.cs
│   └── appsettings.json
│
├── ApiCQRS.Models           # Entidades y DTOs (incl. ItemConsumo, MetodoPagoUsuario, NotificacionUsuario, AuditoriaEvento)
├── ApiCQRS.Query            # Consultas Dapper y CTEs de saldos/devoluciones
├── ApiCQRS.Repository       # Operaciones de escritura en SQL Server
├── SeparacionCuentas-Frontend  # Código fuente Angular de SplitIA
└── ApiCQRS.slnx
```

---

## Base de datos (`SeparacionCuentas`)

El script [ApiCQRS/DDLs/script.sql](ApiCQRS/DDLs/script.sql) y la inicialización automática en [ApiCQRS/Program.cs](ApiCQRS/Program.cs) provisionan:

- **Tablas:** `dbo.Usuario`, `dbo.Cuenta`, `dbo.Division`, `dbo.ItemConsumo`, `dbo.MetodoPagoUsuario`, `dbo.NotificacionUsuario`, `dbo.AuditoriaEvento`
- **Vistas:** `dbo.vw_ResumenCuentas`, `dbo.vw_SaldosPorUsuario`
- **Procedimientos almacenados:** `dbo.sp_RecalcularDivisionesEquitativas`, `dbo.sp_RegistrarPagoDivision`
- **Trigger:** `dbo.tr_Division_Auditoria`

---

## Ejecución local rápida

```bash
dotnet run --project ApiCQRS --launch-profile http
```

- **Aplicación web SplitIA:** `http://localhost:5266`
- **Swagger / OpenAPI:** `http://localhost:5266/swagger`
- **Verificación SQL Server:** `http://localhost:5266/dbtest`

### Cuentas de prueba por defecto
- **Administrador (`ADMIN`):** `admin@splitia.app` · contraseña `admin123`
- **Usuarios demo (`USUARIO`):** por ejemplo `thomas@correo.com` · contraseña `123456`
