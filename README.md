# Separación de Cuentas API

API REST desarrollada en ASP.NET Core para gestionar la separación de cuentas entre diferentes usuarios.

El sistema permite registrar usuarios, crear cuentas pagadas por un usuario y dividir el valor de cada cuenta entre diferentes participantes, manteniendo información sobre el estado y método de pago de cada división.

---

## Tecnologías utilizadas

- .NET 10
- ASP.NET Core Web API
- SQL Server 2019
- Docker
- Dapper
- Dapper.Contrib
- Microsoft.Data.SqlClient
- Swagger / OpenAPI
- Git y GitHub

---

## Arquitectura del proyecto

La solución está organizada en diferentes capas para separar las responsabilidades de la aplicación.

```text
SeparacionCuentas-API
│
├── ApiCQRS
│   ├── Controllers
│   ├── DDLs
│   ├── Program.cs
│   └── appsettings.json
│
├── ApiCQRS.Models
│   ├── Usuario.cs
│   ├── Cuenta.cs
│   └── Division.cs
│
├── ApiCQRS.Query
│   ├── Interfaces
│   └── Implements
│
├── ApiCQRS.Repository
│   ├── Interfaces
│   └── Implements
│
└── ApiCQRS.slnx
