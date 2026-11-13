# SplitIA — Frontend Angular (`SeparacionCuentas-Frontend`)

Aplicación web desarrollada en **Angular 19 (Standalone Components + Signals + Router)** integrada con **SeparacionCuentas-API** (**ASP.NET Core .NET 10 + Dapper + SQL Server**, [`ThomasSuaza/SeparacionCuentas-API`](https://github.com/ThomasSuaza/SeparacionCuentas-API.git)).

---

## Paletas de color incluidas

El sistema implementa cambio instantáneo entre tema claro y oscuro con persistencia en `localStorage`:

1. **Modo Claro — Blanco Hielo + Índigo (`data-theme="indigo"`)**
   - `--bg: #F3F6FB` | `--surface: #FFFFFF` | `--surface-alt: #F7F8FE`
   - `--sidebar: #18253B` | `--accent: #4F46E5` | `--accent-bright: #4338CA`
2. **Modo Oscuro — Azul Noche + Dorado (`data-theme="gold"`)**
   - `--bg: #111828` | `--surface: #1C293A` | `--surface-alt: #243349`
   - `--sidebar: #101623` | `--accent: #F0C674` | `--accent-bright: #F9DFA3`

---

## Arquitectura del proyecto Angular

```text
SeparacionCuentas-Frontend/
├── angular.json
├── Dockerfile                                 # Imagen Angular + Nginx
├── package.json
├── proxy.conf.json                            # Proxy hacia http://localhost:5266 (/api y /dbtest)
├── tsconfig.json
└── src/
    ├── index.html
    ├── main.ts
    ├── styles.css                             # Sistema de diseño global (claro y oscuro)
    ├── environments/
    │   ├── environment.ts
    │   └── environment.prod.ts
    └── app/
        ├── app.component.ts                   # Shell global, Sidebar, Topbar, Selector de Tema, Login/Cambio de Perfil
        ├── app.config.ts                      # Configuración de Router y HttpClient
        ├── app.routes.ts                      # Rutas de Bienvenida, Portal de Usuario y Consola Admin
        ├── core/
        │   ├── models/
        │   │   └── api.models.ts              # Interfaces Usuario, Cuenta, Division, LoginResponse, MetodosPago, etc.
        │   └── services/
        │       ├── separacion-cuentas.service.ts  # Cliente HTTP hacia Auth, Usuario, Cuenta, Division y Sistema
        │       ├── auth.service.ts                # Sesión activa, validación contra /api/Auth/login y aislamiento por rol
        │       ├── theme.service.ts               # Motor de paletas claro/oscuro
        │       └── toast.service.ts               # Notificaciones en tiempo real
        └── features/
            ├── landing/
            │   └── landing.component.ts           # Presentación SplitIA, acceso e inicio/registro rápido
            ├── user-portal/                       # PORTAL DE USUARIO
            │   ├── user-dashboard.component.ts    # Panel general interactivo, consumos y cuotas
            │   ├── user-cuentas.component.ts      # Mis cuentas + agregar/quitar participantes + recálculo
            │   ├── user-pagos.component.ts        # Mis divisiones, pasarela y comprobantes
            │   ├── user-saldos.component.ts       # Saldos, devoluciones y cuadre (RECIBE / PAGA / SALDADO)
            │   └── user-perfil.component.ts       # Login real, registro, cambio de perfil y edición de cuenta
            └── admin-console/                     # CONSOLA DE ADMINISTRADOR
                ├── admin-overview.component.ts    # Dashboard ejecutivo, KPIs, actividad reciente y auditoría
                ├── admin-usuarios.component.ts    # CRUD completo de Usuarios + filtro por cuenta
                ├── admin-cuentas.component.ts     # CRUD completo de Cuentas + Inspector JSON de devoluciones
                ├── admin-divisiones.component.ts  # CRUD completo de Divisiones + cambio rápido de estado
                └── admin-sistema.component.ts     # Diagnóstico /dbtest y endpoints del sistema
```

---

## Cómo ejecutar

### Opción 1: Modo desarrollo Angular (`ng serve`)
```bash
cd SeparacionCuentas-Frontend
npm install
npm start
```
Se abre en `http://localhost:4200` conectado mediante `proxy.conf.json` a `http://localhost:5266`.

### Opción 2: Servido directamente por `.NET 10` (`dotnet run`)
El backend `ApiCQRS` incluye **CORS** y archivos estáticos en `ApiCQRS/wwwroot`:

```bash
dotnet run --project ../ApiCQRS --launch-profile http
```

Abre `http://localhost:5266` para usar **SplitIA** y `http://localhost:5266/swagger` para explorar Swagger.
