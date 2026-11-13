# Guía rápida de instalación, inicialización y montaje — SplitIA

Guía mínima para instalar, inicializar SQL Server y dejar funcionando **SplitIA** en entorno local o mediante Docker.

---

## 1. Requisitos previos

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- **SQL Server 2019+** local o **Docker Desktop** *(opcional para levantar SQL Server en contenedor)*
- **Opcional (solo si deseas editar/recompilar Angular):** Node.js 20+ y `npm`

---

## 2. Obtener el código

```bash
git clone https://github.com/ThomasSuaza/SeparacionCuentas-API.git
cd SeparacionCuentas-API
```

*(O descomprime el paquete del proyecto y abre una terminal en la raíz `SeparacionCuentas-API`.)*

---

## 3. Instalar e inicializar la base de datos (`SeparacionCuentas`)

Elige una de estas dos opciones:

### Opción A — SQL Server con Docker (recomendado)
Desde la raíz del proyecto:

```bash
docker compose up -d
```

Esto inicia SQL Server 2019 en `localhost,1433` con las credenciales configuradas en `docker-compose.yml` y `ApiCQRS/appsettings.json`.

### Opción B — SQL Server ya instalado (SSMS / Azure Data Studio / `sqlcmd`)
1. Descarga o abre el archivo DDL ubicado en la raíz del repositorio: **`SplitIA_SeparacionCuentas_DDL.sql`**.
2. Ejecútalo sobre tu instancia de SQL Server. Crea de forma segura la base de datos `SeparacionCuentas`, las `7` tablas, índices, vistas, procedimientos almacenados, trigger y usuarios iniciales.
3. Si tu instancia usa otro servidor, usuario o contraseña, ajusta `ConnectionStrings.sql` en `ApiCQRS/appsettings.json`.

---

## 4. Inicializar y montar la aplicación (.NET 10 + Frontend SplitIA)

El proyecto `ApiCQRS` ya incluye compilado el frontend de Angular dentro de `ApiCQRS/wwwroot`, por lo que un solo comando levanta toda la plataforma:

```bash
dotnet restore ApiCQRS.slnx
dotnet build ApiCQRS.slnx
dotnet run --project ApiCQRS --launch-profile http
```

Al iniciar:
1. Verifica la inicialización de base de datos abriendo: `http://localhost:5266/dbtest` *(debe responder `"conectado": true`)*.
2. Abre la aplicación **SplitIA**: `http://localhost:5266`
3. Explora la documentación API (**Swagger**): `http://localhost:5266/swagger`

---

## 5. Montaje con Docker (alternativa de despliegue)

- **API + Frontend estático (`Dockerfile` raíz):**
  ```bash
  docker build -t splitia-app .
  docker run -d -p 5266:5266 --name splitia-app splitia-app
  ```
- **Solo Frontend Angular + Nginx (`SeparacionCuentas-Frontend/Dockerfile`):**
  ```bash
  docker build -t splitia-frontend ./SeparacionCuentas-Frontend
  docker run -d -p 80:80 --name splitia-frontend splitia-frontend
  ```

---

## 6. Opcional: Desarrollo activo en Angular (`ng serve`)

Si realizas cambios en `SeparacionCuentas-Frontend/src`:

```bash
cd SeparacionCuentas-Frontend
npm install
npm start
```

- Vista de desarrollo con recarga en vivo: `http://localhost:4200` *(conectada por `proxy.conf.json` a `http://localhost:5266`)*.
- Para actualizar el bundle servido por `.NET`: ejecuta `npm run build -- --configuration production` y copia el contenido de `dist/separacion-cuentas-frontend/browser/` en `../ApiCQRS/wwwroot/`.

---

## 7. Credenciales iniciales

| Perfil | Correo / Usuario | Contraseña |
| :--- | :--- | :--- |
| **Administrador (`ADMIN`)** | `admin@splitia.app` *(o alias `admin`)* | `admin123` |
| **Usuarios demo (`USUARIO`)** | `thomas@correo.com` *(y demás usuarios semilla)* | `123456` |
