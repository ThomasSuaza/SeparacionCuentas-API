using ApiCQRS.Query.Implements;
using ApiCQRS.Query.Interfaces;
using ApiCQRS.Repository.Implements;
using ApiCQRS.Repository.Interfaces;
using Microsoft.Data.SqlClient;
using System;
using System.Data;
using System.IO;

namespace ApiCQRS
{
    public class Program
    {
        public static void Main(string[] args)
        {
            // =====================================================
            // CREAR LA APLICACION
            // =====================================================
            var builder = WebApplication.CreateBuilder(args);


            // =====================================================
            // CONTROLLERS & CORS (PARA FRONTEND ANGULAR)
            // =====================================================
            builder.Services.AddControllers();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AngularFrontend", policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });


            // =====================================================
            // SWAGGER / OPENAPI
            // =====================================================
            builder.Services.AddEndpointsApiExplorer();

            builder.Services.AddSwaggerGen(opt =>
            {
                string path = Path.Combine(
                    AppContext.BaseDirectory,
                    "api.xml"
                );

                if (File.Exists(path))
                {
                    opt.IncludeXmlComments(path);
                }
            });


            // =====================================================
            // QUERIES
            // =====================================================

            // Usuario
            builder.Services.AddTransient<
                IUsuarioQueries,
                UsuarioQueries
            >();

            // Cuenta
            builder.Services.AddTransient<
                ICuentaQueries,
                CuentaQueries
            >();

            // Division
            builder.Services.AddTransient<
                IDivisionQueries,
                DivisionQueries
            >();


            // =====================================================
            // REPOSITORIES
            // =====================================================

            // Usuario
            builder.Services.AddTransient<
                IUsuarioRepository,
                UsuarioRepository
            >();

            // Cuenta
            builder.Services.AddTransient<
                IUcuentaRepository,
                CuentaRepository
                >();
                // Division
            builder.Services.AddTransient<
                IUdivisionRepositoriory,
                DivisionRepositoriory
            >();


            // =====================================================
            // CONEXION A SQL SERVER
            // =====================================================
            builder.Services.AddScoped<IDbConnection>(sp =>
            {
                string connectionString =
                    builder.Configuration
                           .GetConnectionString("sql")!;

                return new SqlConnection(connectionString);
            });


            // =====================================================
            // CONSTRUIR APLICACION
            // =====================================================
            var app = builder.Build();


            // =====================================================
            // SWAGGER
            // =====================================================
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();

                app.UseSwaggerUI();
            }


            // =====================================================
            // HTTPS
            // =====================================================
            app.UseHttpsRedirection();


            // =====================================================
            // CORS, ARCHIVOS ESTATICOS (FRONTEND) & AUTORIZACION
            // =====================================================
            app.UseCors("AngularFrontend");

            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.UseAuthorization();


            // =====================================================
            // MAPEAR CONTROLLERS
            // =====================================================
            app.MapControllers();


            // =====================================================
            // ENDPOINT DE PRUEBA E INICIALIZACION DE CONEXION SQL
            // =====================================================
            app.MapGet("/dbtest", async (IConfiguration configuration) =>
            {
                string connectionString =
                    configuration.GetConnectionString("sql")!;

                await EnsureDatabaseAndSeedAsync(connectionString);

                await using var connection =
                    new SqlConnection(connectionString);

                await connection.OpenAsync();


                const string sql = @"
                    SELECT
                        DB_NAME() AS BaseDatos,
                        CASE WHEN OBJECT_ID('dbo.Usuario', 'U') IS NOT NULL THEN 1 ELSE 0 END AS Usuario,
                        CASE WHEN OBJECT_ID('dbo.Cuenta', 'U') IS NOT NULL THEN 1 ELSE 0 END AS Cuenta,
                        CASE WHEN OBJECT_ID('dbo.Division', 'U') IS NOT NULL THEN 1 ELSE 0 END AS Division,
                        CASE WHEN OBJECT_ID('dbo.ItemConsumo', 'U') IS NOT NULL THEN 1 ELSE 0 END AS ItemConsumo,
                        CASE WHEN OBJECT_ID('dbo.MetodoPagoUsuario', 'U') IS NOT NULL THEN 1 ELSE 0 END AS MetodoPagoUsuario,
                        CASE WHEN OBJECT_ID('dbo.NotificacionUsuario', 'U') IS NOT NULL THEN 1 ELSE 0 END AS NotificacionUsuario,
                        CASE WHEN OBJECT_ID('dbo.AuditoriaEvento', 'U') IS NOT NULL THEN 1 ELSE 0 END AS AuditoriaEvento,
                        CASE WHEN OBJECT_ID('dbo.vw_ResumenCuentas', 'V') IS NOT NULL THEN 1 ELSE 0 END AS VistaResumenCuentas;
                ";


                await using var command =
                    new SqlCommand(sql, connection);

                await using var reader =
                    await command.ExecuteReaderAsync();

                await reader.ReadAsync();


                return Results.Ok(new
                {
                    conectado = true,

                    baseDatos =
                        reader["BaseDatos"].ToString(),

                    tablas = new
                    {
                        usuario = Convert.ToBoolean(reader["Usuario"]),
                        cuenta = Convert.ToBoolean(reader["Cuenta"]),
                        division = Convert.ToBoolean(reader["Division"]),
                        itemConsumo = Convert.ToBoolean(reader["ItemConsumo"]),
                        metodoPagoUsuario = Convert.ToBoolean(reader["MetodoPagoUsuario"]),
                        notificacionUsuario = Convert.ToBoolean(reader["NotificacionUsuario"]),
                        auditoriaEvento = Convert.ToBoolean(reader["AuditoriaEvento"]),
                        vistaResumenCuentas = Convert.ToBoolean(reader["VistaResumenCuentas"])
                    }
                });
            });


            // =====================================================
            // EJECUTAR API (CON AUTO-INICIALIZACION SQL SERVER)
            // =====================================================
            _ = Task.Run(async () =>
            {
                try
                {
                    string cs = app.Configuration.GetConnectionString("sql")!;
                    await EnsureDatabaseAndSeedAsync(cs);
                }
                catch
                {
                    // Se reintentará automáticamente al invocar /dbtest
                }
            });

            app.Run();
        }

        private static async Task EnsureDatabaseAndSeedAsync(string connectionString)
        {
            var masterBuilder = new SqlConnectionStringBuilder(connectionString)
            {
                InitialCatalog = "master"
            };

            await using (var masterConn = new SqlConnection(masterBuilder.ConnectionString))
            {
                await masterConn.OpenAsync();
                const string createDbSql = @"
                    IF DB_ID(N'SeparacionCuentas') IS NULL
                    BEGIN
                        CREATE DATABASE [SeparacionCuentas];
                    END";
                await using var cmd = new SqlCommand(createDbSql, masterConn);
                await cmd.ExecuteNonQueryAsync();
            }

            await using var conn = new SqlConnection(connectionString);
            await conn.OpenAsync();

            string[] migrationBatches = new[]
            {
                @"
                IF OBJECT_ID('dbo.Usuario', 'U') IS NULL
                BEGIN
                    CREATE TABLE [dbo].[Usuario](
                        [id_usuario] [int] IDENTITY(1,1) NOT NULL,
                        [nombre] [varchar](100) NOT NULL,
                        [correo] [varchar](150) NOT NULL,
                        [password_hash] [varchar](255) NOT NULL,
                        [telefono] [varchar](20) NULL,
                        [rol] [varchar](20) NOT NULL CONSTRAINT [DF_Usuario_Rol] DEFAULT ('USUARIO'),
                        [activo] [bit] NOT NULL CONSTRAINT [DF_Usuario_Activo] DEFAULT (1),
                        [fecha_registro] [datetime2](7) NOT NULL CONSTRAINT [DF_Usuario_FechaRegistro] DEFAULT (getdate()),
                        CONSTRAINT [PK_Usuario] PRIMARY KEY CLUSTERED ([id_usuario] ASC),
                        CONSTRAINT [UQ_Usuario_Correo] UNIQUE NONCLUSTERED ([correo] ASC),
                        CONSTRAINT [CK_Usuario_Rol] CHECK ([rol] IN ('ADMIN', 'USUARIO'))
                    );
                END
                IF COL_LENGTH('dbo.Usuario', 'rol') IS NULL
                    ALTER TABLE dbo.Usuario ADD rol VARCHAR(20) NOT NULL CONSTRAINT DF_Usuario_Rol DEFAULT ('USUARIO');
                IF COL_LENGTH('dbo.Usuario', 'activo') IS NULL
                    ALTER TABLE dbo.Usuario ADD activo BIT NOT NULL CONSTRAINT DF_Usuario_Activo DEFAULT (1);
                IF COL_LENGTH('dbo.Usuario', 'fecha_registro') IS NULL
                    ALTER TABLE dbo.Usuario ADD fecha_registro DATETIME2(7) NOT NULL CONSTRAINT DF_Usuario_FechaRegistro DEFAULT (GETDATE());
                ",
                @"
                IF OBJECT_ID('dbo.Cuenta', 'U') IS NULL
                BEGIN
                    CREATE TABLE [dbo].[Cuenta](
                        [id_cuenta] [int] IDENTITY(1,1) NOT NULL,
                        [id_usuario_pagador] [int] NOT NULL,
                        [descripcion] [varchar](200) NOT NULL,
                        [monto_total] [decimal](12, 2) NOT NULL,
                        [fecha] [datetime2](7) NOT NULL CONSTRAINT [DF_Cuenta_Fecha] DEFAULT (getdate()),
                        [categoria] [varchar](50) NOT NULL CONSTRAINT [DF_Cuenta_Categoria] DEFAULT ('General'),
                        [estado] [varchar](20) NOT NULL CONSTRAINT [DF_Cuenta_Estado] DEFAULT ('ACTIVA'),
                        [notas] [varchar](500) NULL,
                        CONSTRAINT [PK_Cuenta] PRIMARY KEY CLUSTERED ([id_cuenta] ASC),
                        CONSTRAINT [FK_Cuenta_UsuarioPagador] FOREIGN KEY([id_usuario_pagador]) REFERENCES [dbo].[Usuario] ([id_usuario]),
                        CONSTRAINT [CK_Cuenta_MontoTotal] CHECK (([monto_total]>(0))),
                        CONSTRAINT [CK_Cuenta_Estado] CHECK ([estado] IN ('ACTIVA', 'CERRADA', 'ANULADA'))
                    );
                END
                IF COL_LENGTH('dbo.Cuenta', 'categoria') IS NULL
                    ALTER TABLE dbo.Cuenta ADD categoria VARCHAR(50) NOT NULL CONSTRAINT DF_Cuenta_Categoria DEFAULT ('General');
                IF COL_LENGTH('dbo.Cuenta', 'estado') IS NULL
                    ALTER TABLE dbo.Cuenta ADD estado VARCHAR(20) NOT NULL CONSTRAINT DF_Cuenta_Estado DEFAULT ('ACTIVA');
                IF COL_LENGTH('dbo.Cuenta', 'notas') IS NULL
                    ALTER TABLE dbo.Cuenta ADD notas VARCHAR(500) NULL;
                ",
                @"
                IF OBJECT_ID('dbo.Division', 'U') IS NULL
                BEGIN
                    CREATE TABLE [dbo].[Division](
                        [id_division] [int] IDENTITY(1,1) NOT NULL,
                        [id_cuenta] [int] NOT NULL,
                        [id_usuario] [int] NOT NULL,
                        [monto] [decimal](12, 2) NOT NULL,
                        [estado] [varchar](20) NOT NULL CONSTRAINT [DF_Division_Estado] DEFAULT ('PENDIENTE'),
                        [tipo_pago] [varchar](30) NULL,
                        [referencia_pago] [varchar](100) NULL,
                        [fecha_pago] [datetime2](7) NULL,
                        [notas] [varchar](200) NULL,
                        CONSTRAINT [PK_Division] PRIMARY KEY CLUSTERED ([id_division] ASC),
                        CONSTRAINT [UQ_Division_Cuenta_Usuario] UNIQUE NONCLUSTERED ([id_cuenta] ASC, [id_usuario] ASC),
                        CONSTRAINT [FK_Division_Cuenta] FOREIGN KEY([id_cuenta]) REFERENCES [dbo].[Cuenta] ([id_cuenta]) ON DELETE CASCADE,
                        CONSTRAINT [FK_Division_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuario] ([id_usuario]),
                        CONSTRAINT [CK_Division_Estado] CHECK (([estado]='PAGADO' OR [estado]='PENDIENTE')),
                        CONSTRAINT [CK_Division_Monto] CHECK (([monto]>(0)))
                    );
                END
                IF COL_LENGTH('dbo.Division', 'notas') IS NULL
                    ALTER TABLE dbo.Division ADD notas VARCHAR(200) NULL;
                ",
                @"
                IF OBJECT_ID('dbo.ItemConsumo', 'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.ItemConsumo (
                        id_item INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ItemConsumo PRIMARY KEY CLUSTERED,
                        id_cuenta INT NOT NULL CONSTRAINT FK_ItemConsumo_Cuenta FOREIGN KEY REFERENCES dbo.Cuenta(id_cuenta) ON DELETE CASCADE,
                        concepto VARCHAR(150) NOT NULL,
                        detalle VARCHAR(250) NULL,
                        valor DECIMAL(12, 2) NOT NULL CONSTRAINT CK_ItemConsumo_Valor CHECK (valor > 0),
                        icono VARCHAR(20) NOT NULL CONSTRAINT DF_ItemConsumo_Icono DEFAULT ('🧾')
                    );
                END
                IF OBJECT_ID('dbo.MetodoPagoUsuario', 'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.MetodoPagoUsuario (
                        id_metodo INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_MetodoPagoUsuario PRIMARY KEY CLUSTERED,
                        id_usuario INT NOT NULL CONSTRAINT FK_MetodoPago_Usuario FOREIGN KEY REFERENCES dbo.Usuario(id_usuario) ON DELETE CASCADE,
                        entidad VARCHAR(50) NOT NULL,
                        numero_cuenta VARCHAR(100) NOT NULL,
                        titular VARCHAR(120) NOT NULL,
                        es_principal BIT NOT NULL CONSTRAINT DF_MetodoPago_Principal DEFAULT (0),
                        fecha_creacion DATETIME2(7) NOT NULL CONSTRAINT DF_MetodoPago_Fecha DEFAULT (GETDATE())
                    );
                END
                IF OBJECT_ID('dbo.NotificacionUsuario', 'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.NotificacionUsuario (
                        id_notificacion INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_NotificacionUsuario PRIMARY KEY CLUSTERED,
                        id_usuario INT NOT NULL CONSTRAINT FK_Notificacion_Usuario FOREIGN KEY REFERENCES dbo.Usuario(id_usuario) ON DELETE CASCADE,
                        id_cuenta INT NULL CONSTRAINT FK_Notificacion_Cuenta FOREIGN KEY REFERENCES dbo.Cuenta(id_cuenta) ON DELETE SET NULL,
                        titulo VARCHAR(140) NOT NULL,
                        mensaje VARCHAR(350) NOT NULL,
                        leida BIT NOT NULL CONSTRAINT DF_Notificacion_Leida DEFAULT (0),
                        fecha_creacion DATETIME2(7) NOT NULL CONSTRAINT DF_Notificacion_Fecha DEFAULT (GETDATE())
                    );
                END
                IF OBJECT_ID('dbo.AuditoriaEvento', 'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.AuditoriaEvento (
                        id_evento INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AuditoriaEvento PRIMARY KEY CLUSTERED,
                        id_usuario_actor INT NULL CONSTRAINT FK_Auditoria_Usuario FOREIGN KEY REFERENCES dbo.Usuario(id_usuario) ON DELETE SET NULL,
                        modulo VARCHAR(40) NOT NULL,
                        metodo VARCHAR(10) NOT NULL,
                        endpoint VARCHAR(150) NOT NULL,
                        descripcion VARCHAR(500) NOT NULL,
                        fecha DATETIME2(7) NOT NULL CONSTRAINT DF_Auditoria_Fecha DEFAULT (GETDATE())
                    );
                END
                ",
                @"
                CREATE OR ALTER VIEW dbo.vw_ResumenCuentas AS
                SELECT
                    c.id_cuenta, c.descripcion, c.categoria, c.estado AS estado_cuenta, c.monto_total, c.fecha, c.notas,
                    c.id_usuario_pagador, u.nombre AS nombre_pagador, u.correo AS correo_pagador,
                    COUNT(d.id_division) AS total_participantes,
                    COALESCE(SUM(d.monto), 0) AS total_dividido,
                    ABS(c.monto_total - COALESCE(SUM(d.monto), 0)) AS diferencia_asignacion,
                    COALESCE(SUM(CASE WHEN d.estado = 'PAGADO' THEN d.monto ELSE 0 END), 0) AS monto_recaudado,
                    COALESCE(SUM(CASE WHEN d.estado = 'PENDIENTE' THEN d.monto ELSE 0 END), 0) AS monto_pendiente,
                    CASE
                        WHEN COALESCE(SUM(d.monto), 0) = c.monto_total THEN 'COMPLETA'
                        WHEN COALESCE(SUM(d.monto), 0) < c.monto_total THEN 'PENDIENTE'
                        ELSE 'EXCEDIDA'
                    END AS estado_distribucion,
                    CAST(CASE WHEN c.monto_total > 0 THEN ROUND(COALESCE(SUM(CASE WHEN d.estado = 'PAGADO' THEN d.monto ELSE 0 END), 0) * 100.0 / c.monto_total, 2) ELSE 0 END AS DECIMAL(5,2)) AS porcentaje_recaudo
                FROM dbo.Cuenta c
                INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario_pagador
                LEFT JOIN dbo.Division d ON d.id_cuenta = c.id_cuenta
                GROUP BY c.id_cuenta, c.descripcion, c.categoria, c.estado, c.monto_total, c.fecha, c.notas, c.id_usuario_pagador, u.nombre, u.correo;
                ",
                @"
                CREATE OR ALTER VIEW dbo.vw_SaldosPorUsuario AS
                SELECT
                    u.id_usuario, u.nombre, u.correo, u.telefono, u.rol, u.activo,
                    (SELECT COUNT(*) FROM dbo.Cuenta c WHERE c.id_usuario_pagador = u.id_usuario) AS cuentas_creadas,
                    (SELECT COALESCE(SUM(c.monto_total), 0) FROM dbo.Cuenta c WHERE c.id_usuario_pagador = u.id_usuario) AS volumen_pagado_como_creador,
                    (SELECT COALESCE(SUM(d2.monto), 0) FROM dbo.Division d2 INNER JOIN dbo.Cuenta c2 ON c2.id_cuenta = d2.id_cuenta WHERE c2.id_usuario_pagador = u.id_usuario AND d2.id_usuario <> u.id_usuario AND d2.estado = 'PENDIENTE') AS saldo_por_recibir,
                    (SELECT COALESCE(SUM(d3.monto), 0) FROM dbo.Division d3 WHERE d3.id_usuario = u.id_usuario AND d3.estado = 'PAGADO') AS total_cuotas_pagadas,
                    (SELECT COALESCE(SUM(d4.monto), 0) FROM dbo.Division d4 WHERE d4.id_usuario = u.id_usuario AND d4.estado = 'PENDIENTE') AS deuda_pendiente
                FROM dbo.Usuario u
                WHERE u.rol = 'USUARIO';
                ",
                @"
                CREATE OR ALTER PROCEDURE dbo.sp_RecalcularDivisionesEquitativas @IdCuenta INT AS
                BEGIN
                    SET NOCOUNT ON;
                    DECLARE @MontoTotal DECIMAL(12,2), @Count INT;
                    SELECT @MontoTotal = monto_total FROM dbo.Cuenta WHERE id_cuenta = @IdCuenta;
                    SELECT @Count = COUNT(*) FROM dbo.Division WHERE id_cuenta = @IdCuenta;
                    IF @MontoTotal IS NULL OR @Count = 0 RETURN;
                    DECLARE @CuotaBase DECIMAL(12,2) = FLOOR((@MontoTotal / @Count) * 100) / 100.0;
                    DECLARE @Resto DECIMAL(12,2) = @MontoTotal - (@CuotaBase * @Count);
                    DECLARE @UltimoId INT = (SELECT MAX(id_division) FROM dbo.Division WHERE id_cuenta = @IdCuenta);
                    UPDATE dbo.Division SET monto = CASE WHEN id_division = @UltimoId THEN @CuotaBase + @Resto ELSE @CuotaBase END WHERE id_cuenta = @IdCuenta;
                END;
                ",
                @"
                CREATE OR ALTER PROCEDURE dbo.sp_RegistrarPagoDivision @IdDivision INT, @TipoPago VARCHAR(30), @ReferenciaPago VARCHAR(100) = NULL AS
                BEGIN
                    SET NOCOUNT ON;
                    UPDATE dbo.Division SET estado = 'PAGADO', tipo_pago = COALESCE(NULLIF(LTRIM(RTRIM(@TipoPago)), ''), 'Digital'), referencia_pago = COALESCE(NULLIF(LTRIM(RTRIM(@ReferenciaPago)), ''), CONCAT('REF-', @IdDivision)), fecha_pago = GETDATE() WHERE id_division = @IdDivision;
                END;
                ",
                @"
                CREATE OR ALTER TRIGGER dbo.tr_Division_Auditoria ON dbo.Division AFTER INSERT, UPDATE AS
                BEGIN
                    SET NOCOUNT ON;
                    INSERT INTO dbo.AuditoriaEvento (id_usuario_actor, modulo, metodo, endpoint, descripcion)
                    SELECT i.id_usuario, 'Division', CASE WHEN EXISTS (SELECT 1 FROM deleted d WHERE d.id_division = i.id_division) THEN 'PUT' ELSE 'POST' END, CONCAT('/api/Division/', i.id_division),
                           CASE WHEN i.estado = 'PAGADO' THEN CONCAT('Pago registrado en División #', i.id_division, ' (Cuenta #', i.id_cuenta, ') por $', FORMAT(i.monto, 'N0')) ELSE CONCAT('División #', i.id_division, ' asignada en Cuenta #', i.id_cuenta, ' por $', FORMAT(i.monto, 'N0')) END
                    FROM inserted i LEFT JOIN deleted d ON d.id_division = i.id_division
                    WHERE d.id_division IS NULL OR ISNULL(d.estado, '') <> i.estado OR ISNULL(d.monto, 0) <> i.monto;
                END;
                ",
                @"
                IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE correo = 'admin@splitia.app')
                BEGIN
                    DECLARE @HashAdmin VARCHAR(255) = LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', 'admin123'), 2));
                    INSERT INTO dbo.Usuario (nombre, correo, password_hash, telefono, rol, activo)
                    VALUES ('Administrador SplitIA', 'admin@splitia.app', @HashAdmin, '+57 300 000 0000', 'ADMIN', 1);
                END
                IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE rol = 'USUARIO')
                BEGIN
                    DECLARE @HashDefault VARCHAR(255) = LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', '123456'), 2));
                    INSERT INTO dbo.Usuario (nombre, correo, password_hash, telefono, rol, activo) VALUES
                    ('Thomas Suaza', 'thomas@correo.com', @HashDefault, '+57 300 111 2233', 'USUARIO', 1),
                    ('Carolina Mejía', 'carolina.mejia@splitia.app', @HashDefault, '+57 311 540 2219', 'USUARIO', 1),
                    ('Andrés Restrepo', 'andres.restrepo@splitia.app', @HashDefault, '+57 315 892 3304', 'USUARIO', 1),
                    ('Valentina Gómez', 'valentina.gomez@splitia.app', @HashDefault, '+57 320 671 9940', 'USUARIO', 1),
                    ('Miguel Ángel Taborda', 'miguel.taborda@splitia.app', @HashDefault, '+57 301 778 4512', 'USUARIO', 1),
                    ('Jorge Galindo', 'jorge.galindo@splitia.app', @HashDefault, '+57 318 334 1120', 'USUARIO', 1);
                END
                "
            };

            foreach (string batch in migrationBatches)
            {
                await using var schemaCmd = new SqlCommand(batch, conn);
                await schemaCmd.ExecuteNonQueryAsync();
            }
        }
    }
}