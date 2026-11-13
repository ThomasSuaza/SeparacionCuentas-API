-- ============================================================================
-- SplitIA · DDL Completo e Idempotente (SQL Server 2019+)
-- Base de datos: SeparacionCuentas
-- Instrucciones: No selecciones texto parcial; presiona F5 (Ejecutar) completo.
-- Al terminar, haz clic derecho en "Bases de datos" -> "Actualizar" en SSMS.
-- Si quieres probar creando otra BD, reemplaza "SeparacionCuentas" con Ctrl+H.
-- ============================================================================

USE [master];
GO

IF DB_ID(N'SeparacionCuentas') IS NULL
BEGIN
    CREATE DATABASE [SeparacionCuentas];
    PRINT 'Base de datos [SeparacionCuentas] creada correctamente.';
END
GO

USE [SeparacionCuentas];
GO

-- ============================================================================
-- 1. TABLAS PRINCIPALES
-- ============================================================================
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
    ) ON [PRIMARY];
END
GO

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
        CONSTRAINT [CK_Cuenta_MontoTotal] CHECK ([monto_total] > 0),
        CONSTRAINT [CK_Cuenta_Estado] CHECK ([estado] IN ('ACTIVA', 'CERRADA', 'ANULADA'))
    ) ON [PRIMARY];
END
GO

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
        CONSTRAINT [CK_Division_Estado] CHECK ([estado] IN ('PAGADO', 'PENDIENTE')),
        CONSTRAINT [CK_Division_Monto] CHECK ([monto] > 0)
    ) ON [PRIMARY];
END
GO

-- ============================================================================
-- 2. TABLAS COMPLEMENTARIAS DEL ECOSISTEMA SplitIA
-- ============================================================================
IF OBJECT_ID('dbo.ItemConsumo', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[ItemConsumo](
        [id_item] [int] IDENTITY(1,1) NOT NULL,
        [id_cuenta] [int] NOT NULL,
        [concepto] [varchar](150) NOT NULL,
        [detalle] [varchar](250) NULL,
        [valor] [decimal](12, 2) NOT NULL,
        [icono] [varchar](20) NOT NULL CONSTRAINT [DF_ItemConsumo_Icono] DEFAULT ('🧾'),
        CONSTRAINT [PK_ItemConsumo] PRIMARY KEY CLUSTERED ([id_item] ASC),
        CONSTRAINT [FK_ItemConsumo_Cuenta] FOREIGN KEY([id_cuenta]) REFERENCES [dbo].[Cuenta] ([id_cuenta]) ON DELETE CASCADE,
        CONSTRAINT [CK_ItemConsumo_Valor] CHECK ([valor] > 0)
    ) ON [PRIMARY];
END
GO

IF OBJECT_ID('dbo.MetodoPagoUsuario', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[MetodoPagoUsuario](
        [id_metodo] [int] IDENTITY(1,1) NOT NULL,
        [id_usuario] [int] NOT NULL,
        [entidad] [varchar](50) NOT NULL,
        [numero_cuenta] [varchar](100) NOT NULL,
        [titular] [varchar](120) NOT NULL,
        [es_principal] [bit] NOT NULL CONSTRAINT [DF_MetodoPago_Principal] DEFAULT (0),
        [fecha_creacion] [datetime2](7) NOT NULL CONSTRAINT [DF_MetodoPago_Fecha] DEFAULT (getdate()),
        CONSTRAINT [PK_MetodoPagoUsuario] PRIMARY KEY CLUSTERED ([id_metodo] ASC),
        CONSTRAINT [FK_MetodoPago_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuario] ([id_usuario]) ON DELETE CASCADE
    ) ON [PRIMARY];
END
GO

IF OBJECT_ID('dbo.NotificacionUsuario', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[NotificacionUsuario](
        [id_notificacion] [int] IDENTITY(1,1) NOT NULL,
        [id_usuario] [int] NOT NULL,
        [id_cuenta] [int] NULL,
        [titulo] [varchar](140) NOT NULL,
        [mensaje] [varchar](350) NOT NULL,
        [leida] [bit] NOT NULL CONSTRAINT [DF_Notificacion_Leida] DEFAULT (0),
        [fecha_creacion] [datetime2](7) NOT NULL CONSTRAINT [DF_Notificacion_Fecha] DEFAULT (getdate()),
        CONSTRAINT [PK_NotificacionUsuario] PRIMARY KEY CLUSTERED ([id_notificacion] ASC),
        CONSTRAINT [FK_Notificacion_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuario] ([id_usuario]) ON DELETE CASCADE,
        CONSTRAINT [FK_Notificacion_Cuenta] FOREIGN KEY([id_cuenta]) REFERENCES [dbo].[Cuenta] ([id_cuenta]) ON DELETE SET NULL
    ) ON [PRIMARY];
END
GO

IF OBJECT_ID('dbo.AuditoriaEvento', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AuditoriaEvento](
        [id_evento] [int] IDENTITY(1,1) NOT NULL,
        [id_usuario_actor] [int] NULL,
        [modulo] [varchar](40) NOT NULL,
        [metodo] [varchar](10) NOT NULL,
        [endpoint] [varchar](150) NOT NULL,
        [descripcion] [varchar](500) NOT NULL,
        [fecha] [datetime2](7) NOT NULL CONSTRAINT [DF_Auditoria_Fecha] DEFAULT (getdate()),
        CONSTRAINT [PK_AuditoriaEvento] PRIMARY KEY CLUSTERED ([id_evento] ASC),
        CONSTRAINT [FK_Auditoria_Usuario] FOREIGN KEY([id_usuario_actor]) REFERENCES [dbo].[Usuario] ([id_usuario]) ON DELETE SET NULL
    ) ON [PRIMARY];
END
GO

-- ============================================================================
-- 3. INDICES DE RENDIMIENTO
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Cuenta_IdUsuarioPagador' AND object_id = OBJECT_ID('dbo.Cuenta'))
    CREATE NONCLUSTERED INDEX [IX_Cuenta_IdUsuarioPagador] ON [dbo].[Cuenta] ([id_usuario_pagador] ASC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Division_IdCuenta' AND object_id = OBJECT_ID('dbo.Division'))
    CREATE NONCLUSTERED INDEX [IX_Division_IdCuenta] ON [dbo].[Division] ([id_cuenta] ASC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Division_IdUsuario' AND object_id = OBJECT_ID('dbo.Division'))
    CREATE NONCLUSTERED INDEX [IX_Division_IdUsuario] ON [dbo].[Division] ([id_usuario] ASC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Division_Cuenta_Estado' AND object_id = OBJECT_ID('dbo.Division'))
    CREATE NONCLUSTERED INDEX [IX_Division_Cuenta_Estado] ON [dbo].[Division] ([id_cuenta], [estado]) INCLUDE ([monto], [id_usuario]);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ItemConsumo_IdCuenta' AND object_id = OBJECT_ID('dbo.ItemConsumo'))
    CREATE NONCLUSTERED INDEX [IX_ItemConsumo_IdCuenta] ON [dbo].[ItemConsumo] ([id_cuenta] ASC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MetodoPago_Usuario' AND object_id = OBJECT_ID('dbo.MetodoPagoUsuario'))
    CREATE NONCLUSTERED INDEX [IX_MetodoPago_Usuario] ON [dbo].[MetodoPagoUsuario] ([id_usuario] ASC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notificacion_Usuario' AND object_id = OBJECT_ID('dbo.NotificacionUsuario'))
    CREATE NONCLUSTERED INDEX [IX_Notificacion_Usuario] ON [dbo].[NotificacionUsuario] ([id_usuario], [leida]);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Auditoria_Fecha' AND object_id = OBJECT_ID('dbo.AuditoriaEvento'))
    CREATE NONCLUSTERED INDEX [IX_Auditoria_Fecha] ON [dbo].[AuditoriaEvento] ([fecha] DESC);
GO

-- ============================================================================
-- 4. VISTAS ANALITICAS
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_ResumenCuentas AS
SELECT
    c.id_cuenta,
    c.descripcion,
    c.categoria,
    c.estado AS estado_cuenta,
    c.monto_total,
    c.fecha,
    c.notas,
    c.id_usuario_pagador,
    u.nombre AS nombre_pagador,
    u.correo AS correo_pagador,
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
    CAST(
        CASE WHEN c.monto_total > 0
             THEN ROUND(COALESCE(SUM(CASE WHEN d.estado = 'PAGADO' THEN d.monto ELSE 0 END), 0) * 100.0 / c.monto_total, 2)
             ELSE 0
        END AS DECIMAL(5,2)
    ) AS porcentaje_recaudo
FROM dbo.Cuenta c
INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario_pagador
LEFT JOIN dbo.Division d ON d.id_cuenta = c.id_cuenta
GROUP BY
    c.id_cuenta, c.descripcion, c.categoria, c.estado, c.monto_total,
    c.fecha, c.notas, c.id_usuario_pagador, u.nombre, u.correo;
GO

CREATE OR ALTER VIEW dbo.vw_SaldosPorUsuario AS
SELECT
    u.id_usuario,
    u.nombre,
    u.correo,
    u.telefono,
    u.rol,
    u.activo,
    (SELECT COUNT(*) FROM dbo.Cuenta c WHERE c.id_usuario_pagador = u.id_usuario) AS cuentas_creadas,
    (SELECT COALESCE(SUM(c.monto_total), 0) FROM dbo.Cuenta c WHERE c.id_usuario_pagador = u.id_usuario) AS volumen_pagado_como_creador,
    (SELECT COALESCE(SUM(d2.monto), 0)
     FROM dbo.Division d2
     INNER JOIN dbo.Cuenta c2 ON c2.id_cuenta = d2.id_cuenta
     WHERE c2.id_usuario_pagador = u.id_usuario
       AND d2.id_usuario <> u.id_usuario
       AND d2.estado = 'PENDIENTE') AS saldo_por_recibir,
    (SELECT COALESCE(SUM(d3.monto), 0) FROM dbo.Division d3 WHERE d3.id_usuario = u.id_usuario AND d3.estado = 'PAGADO') AS total_cuotas_pagadas,
    (SELECT COALESCE(SUM(d4.monto), 0) FROM dbo.Division d4 WHERE d4.id_usuario = u.id_usuario AND d4.estado = 'PENDIENTE') AS deuda_pendiente
FROM dbo.Usuario u
WHERE u.rol = 'USUARIO';
GO

-- ============================================================================
-- 5. PROCEDIMIENTOS ALMACENADOS Y TRIGGER DE AUDITORIA
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_RecalcularDivisionesEquitativas
    @IdCuenta INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @MontoTotal DECIMAL(12,2), @Count INT;
    SELECT @MontoTotal = monto_total FROM dbo.Cuenta WHERE id_cuenta = @IdCuenta;
    SELECT @Count = COUNT(*) FROM dbo.Division WHERE id_cuenta = @IdCuenta;
    IF @MontoTotal IS NULL OR @Count = 0 RETURN;

    DECLARE @CuotaBase DECIMAL(12,2) = FLOOR((@MontoTotal / @Count) * 100) / 100.0;
    DECLARE @Resto DECIMAL(12,2) = @MontoTotal - (@CuotaBase * @Count);
    DECLARE @UltimoId INT = (SELECT MAX(id_division) FROM dbo.Division WHERE id_cuenta = @IdCuenta);

    UPDATE dbo.Division
    SET monto = CASE WHEN id_division = @UltimoId THEN @CuotaBase + @Resto ELSE @CuotaBase END
    WHERE id_cuenta = @IdCuenta;

    INSERT INTO dbo.AuditoriaEvento (modulo, metodo, endpoint, descripcion)
    VALUES ('Division', 'PUT', CONCAT('/api/Cuenta/', @IdCuenta, '/recalcular'),
            CONCAT('Recálculo equitativo de ', @Count, ' divisiones en Cuenta #', @IdCuenta));
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_RegistrarPagoDivision
    @IdDivision INT,
    @TipoPago VARCHAR(30),
    @ReferenciaPago VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Division
    SET estado = 'PAGADO',
        tipo_pago = COALESCE(NULLIF(LTRIM(RTRIM(@TipoPago)), ''), 'Digital'),
        referencia_pago = COALESCE(NULLIF(LTRIM(RTRIM(@ReferenciaPago)), ''), CONCAT('REF-', @IdDivision)),
        fecha_pago = GETDATE()
    WHERE id_division = @IdDivision;

    UPDATE n
    SET n.leida = 1
    FROM dbo.NotificacionUsuario n
    INNER JOIN dbo.Division d ON d.id_cuenta = n.id_cuenta AND d.id_usuario = n.id_usuario
    WHERE d.id_division = @IdDivision;
END;
GO

CREATE OR ALTER TRIGGER dbo.tr_Division_Auditoria
ON dbo.Division
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.AuditoriaEvento (id_usuario_actor, modulo, metodo, endpoint, descripcion)
    SELECT
        i.id_usuario,
        'Division',
        CASE WHEN EXISTS (SELECT 1 FROM deleted d WHERE d.id_division = i.id_division) THEN 'PUT' ELSE 'POST' END,
        CONCAT('/api/Division/', i.id_division),
        CASE
            WHEN i.estado = 'PAGADO' THEN CONCAT('Pago registrado en División #', i.id_division, ' (Cuenta #', i.id_cuenta, ') por $', FORMAT(i.monto, 'N0'), ' vía ', COALESCE(i.tipo_pago, 'Digital'))
            ELSE CONCAT('División #', i.id_division, ' asignada en Cuenta #', i.id_cuenta, ' por $', FORMAT(i.monto, 'N0'), ' (PENDIENTE)')
        END
    FROM inserted i
    LEFT JOIN deleted d ON d.id_division = i.id_division
    WHERE d.id_division IS NULL OR ISNULL(d.estado, '') <> i.estado OR ISNULL(d.monto, 0) <> i.monto;
END;
GO

-- ============================================================================
-- 6. DATOS SEMILLA INICIALES (ADMIN Y USUARIOS DEMO)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE correo = 'admin@splitia.app')
BEGIN
    DECLARE @HashAdmin VARCHAR(255) = LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', 'admin123'), 2));
    INSERT INTO dbo.Usuario (nombre, correo, password_hash, telefono, rol, activo)
    VALUES ('Administrador SplitIA', 'admin@splitia.app', @HashAdmin, '+57 300 000 0000', 'ADMIN', 1);
END
GO

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
GO

-- ============================================================================
-- 7. VERIFICACION DE RESULTADO EN SSMS
-- ============================================================================
SELECT DB_NAME() AS BaseDatosActiva;
SELECT name AS Tabla FROM sys.tables ORDER BY name;
SELECT name AS Vista FROM sys.views ORDER BY name;
SELECT name AS Procedimiento FROM sys.procedures ORDER BY name;
SELECT id_usuario, nombre, correo, rol, activo FROM dbo.Usuario ORDER BY id_usuario;
GO
