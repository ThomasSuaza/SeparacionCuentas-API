using ApiCQRS.Middleware;
using ApiCQRS.Query.Implements;
using ApiCQRS.Query.Interfaces;
using ApiCQRS.Repository.Implements;
using ApiCQRS.Repository.Interfaces;
using ApiCQRS.Services.Implements;
using ApiCQRS.Services.Interfaces;
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
            // CONTROLLERS
            // =====================================================
            builder.Services.AddControllers();


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

            // Balance
            builder.Services.AddTransient<
                IBalanceQueries,
                BalanceQueries
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
            // SERVICES (logica de negocio)
            // =====================================================
            builder.Services.AddTransient<
                ICuentaService,
                CuentaService
            >();

            builder.Services.AddTransient<
                IDivisionService,
                DivisionService
            >();

            builder.Services.AddTransient<
                IBalanceService,
                BalanceService
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
            // MANEJO DE ERRORES DE NEGOCIO (400 / 404)
            // =====================================================
            app.UseMiddleware<ManejoErroresMiddleware>();


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
            // AUTORIZACION
            // =====================================================
            app.UseAuthorization();


            // =====================================================
            // MAPEAR CONTROLLERS
            // =====================================================
            app.MapControllers();


            // =====================================================
            // ENDPOINT DE PRUEBA DE CONEXION SQL
            // =====================================================
            app.MapGet("/dbtest", async (IConfiguration configuration) =>
            {
                string connectionString =
                    configuration.GetConnectionString("sql")!;

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
            // EJECUTAR API
            // =====================================================
            app.Run();
        }
    }
}