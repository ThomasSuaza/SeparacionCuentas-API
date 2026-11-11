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

                        CASE
                            WHEN OBJECT_ID('dbo.Usuario', 'U') IS NOT NULL
                            THEN 1
                            ELSE 0
                        END AS Usuario,

                        CASE
                            WHEN OBJECT_ID('dbo.Cuenta', 'U') IS NOT NULL
                            THEN 1
                            ELSE 0
                        END AS Cuenta,

                        CASE
                            WHEN OBJECT_ID('dbo.Division', 'U') IS NOT NULL
                            THEN 1
                            ELSE 0
                        END AS Division;
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
                        usuario =
                            Convert.ToBoolean(
                                reader["Usuario"]
                            ),

                        cuenta =
                            Convert.ToBoolean(
                                reader["Cuenta"]
                            ),

                        division =
                            Convert.ToBoolean(
                                reader["Division"]
                            )
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

            const string schemaAndSeedSql = @"
                IF OBJECT_ID('dbo.Usuario', 'U') IS NULL
                BEGIN
                    CREATE TABLE [dbo].[Usuario](
                        [id_usuario] [int] IDENTITY(1,1) NOT NULL,
                        [nombre] [varchar](100) NOT NULL,
                        [correo] [varchar](150) NOT NULL,
                        [password_hash] [varchar](255) NOT NULL,
                        [telefono] [varchar](20) NULL,
                        CONSTRAINT [PK_Usuario] PRIMARY KEY CLUSTERED ([id_usuario] ASC),
                        CONSTRAINT [UQ_Usuario_Correo] UNIQUE NONCLUSTERED ([correo] ASC)
                    );
                END

                IF OBJECT_ID('dbo.Cuenta', 'U') IS NULL
                BEGIN
                    CREATE TABLE [dbo].[Cuenta](
                        [id_cuenta] [int] IDENTITY(1,1) NOT NULL,
                        [id_usuario_pagador] [int] NOT NULL,
                        [descripcion] [varchar](200) NOT NULL,
                        [monto_total] [decimal](12, 2) NOT NULL,
                        [fecha] [datetime2](7) NOT NULL CONSTRAINT [DF_Cuenta_Fecha] DEFAULT (getdate()),
                        CONSTRAINT [PK_Cuenta] PRIMARY KEY CLUSTERED ([id_cuenta] ASC),
                        CONSTRAINT [FK_Cuenta_UsuarioPagador] FOREIGN KEY([id_usuario_pagador]) REFERENCES [dbo].[Usuario] ([id_usuario]),
                        CONSTRAINT [CK_Cuenta_MontoTotal] CHECK (([monto_total]>(0)))
                    );
                END

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
                        CONSTRAINT [PK_Division] PRIMARY KEY CLUSTERED ([id_division] ASC),
                        CONSTRAINT [UQ_Division_Cuenta_Usuario] UNIQUE NONCLUSTERED ([id_cuenta] ASC, [id_usuario] ASC),
                        CONSTRAINT [FK_Division_Cuenta] FOREIGN KEY([id_cuenta]) REFERENCES [dbo].[Cuenta] ([id_cuenta]) ON DELETE CASCADE,
                        CONSTRAINT [FK_Division_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuario] ([id_usuario]),
                        CONSTRAINT [CK_Division_Estado] CHECK (([estado]='PAGADO' OR [estado]='PENDIENTE')),
                        CONSTRAINT [CK_Division_Monto] CHECK (([monto]>(0)))
                    );
                END

                IF NOT EXISTS (SELECT 1 FROM dbo.Usuario)
                BEGIN
                    INSERT INTO dbo.Usuario (nombre, correo, password_hash, telefono) VALUES
                    ('Thomas Suaza', 'thomas.suaza@splitbill.ai', 'HASH_BCRYPT_2026', '+57 300 412 8901'),
                    ('Carolina Mejía', 'carolina.mejia@splitbill.ai', 'HASH_BCRYPT_2026', '+57 311 540 2219'),
                    ('Andrés Restrepo', 'andres.restrepo@splitbill.ai', 'HASH_BCRYPT_2026', '+57 315 892 3304'),
                    ('Valentina Gómez', 'valentina.gomez@splitbill.ai', 'HASH_BCRYPT_2026', '+57 320 671 9940'),
                    ('Miguel Ángel Taborda', 'miguel.taborda@splitbill.ai', 'HASH_BCRYPT_2026', '+57 301 778 4512'),
                    ('Jorge Galindo', 'jorge.galindo@splitbill.ai', 'HASH_BCRYPT_2026', '+57 318 334 1120');

                    INSERT INTO dbo.Cuenta (id_usuario_pagador, descripcion, monto_total, fecha) VALUES
                    (1, 'Cena con amigos · Trattoria Napolitana', 240000.00, '2026-10-27T20:15:00'),
                    (5, 'Asado de fin de semana en Rionegro', 420000.00, '2026-11-02T14:30:00'),
                    (1, 'Suscripción Cloud & Dominio Proyecto SplitBill', 180000.00, '2026-11-06T09:00:00'),
                    (2, 'Brunch de Cumpleaños en El Poblado', 315000.00, '2026-11-09T11:20:00');

                    INSERT INTO dbo.Division (id_cuenta, id_usuario, monto, estado, tipo_pago, referencia_pago, fecha_pago) VALUES
                    (1, 1, 60000.00, 'PAGADO', 'Nequi', 'PAGADOR-ORIGEN', '2026-10-27T20:16:00'),
                    (1, 2, 60000.00, 'PAGADO', 'Bancolombia', 'QR-889412', '2026-10-28T10:05:00'),
                    (1, 3, 60000.00, 'PENDIENTE', NULL, NULL, NULL),
                    (1, 4, 60000.00, 'PENDIENTE', NULL, NULL, NULL),
                    (2, 5, 70000.00, 'PAGADO', 'Bancolombia', 'PAGADOR-ORIGEN', '2026-11-02T14:35:00'),
                    (2, 1, 70000.00, 'PAGADO', 'Nequi', 'NEQ-552019', '2026-11-03T08:40:00'),
                    (2, 6, 70000.00, 'PAGADO', 'DaviPlata', 'DAV-771230', '2026-11-03T12:10:00'),
                    (2, 2, 70000.00, 'PENDIENTE', NULL, NULL, NULL),
                    (2, 3, 70000.00, 'PENDIENTE', NULL, NULL, NULL),
                    (2, 4, 70000.00, 'PAGADO', 'PSE', 'PSE-900311', '2026-11-04T17:22:00'),
                    (3, 1, 60000.00, 'PAGADO', 'Tarjeta', 'PAGADOR-ORIGEN', '2026-11-06T09:00:00'),
                    (3, 5, 60000.00, 'PAGADO', 'Nequi', 'NEQ-319044', '2026-11-06T15:30:00'),
                    (3, 6, 60000.00, 'PENDIENTE', NULL, NULL, NULL),
                    (4, 2, 105000.00, 'PAGADO', 'Bancolombia', 'PAGADOR-ORIGEN', '2026-11-09T11:20:00'),
                    (4, 1, 105000.00, 'PENDIENTE', NULL, NULL, NULL),
                    (4, 4, 105000.00, 'PAGADO', 'Nequi', 'NEQ-882910', '2026-11-09T19:00:00');
                END
            ";

            await using var schemaCmd = new SqlCommand(schemaAndSeedSql, conn);
            await schemaCmd.ExecuteNonQueryAsync();
        }
    }
}