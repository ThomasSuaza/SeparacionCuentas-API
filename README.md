
USE [master]
GO
/****** Objeto: Database [SeparacionCuentas] Fecha de script: 3/10/2026 11:06:38 ******/
CREATE DATABASE [SeparacionCuentas]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'SeparacionCuentas', FILENAME = N'/var/opt/mssql/data/SeparacionCuentas.mdf' , SIZE = 8192KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'SeparacionCuentas_log', FILENAME = N'/var/opt/mssql/data/SeparacionCuentas_log.ldf' , SIZE = 8192KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT
GO
ALTER DATABASE [SeparacionCuentas] SET COMPATIBILITY_LEVEL = 150
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [SeparacionCuentas].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [SeparacionCuentas] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET ARITHABORT OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [SeparacionCuentas] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [SeparacionCuentas] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET  ENABLE_BROKER 
GO
ALTER DATABASE [SeparacionCuentas] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [SeparacionCuentas] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET RECOVERY FULL 
GO
ALTER DATABASE [SeparacionCuentas] SET  MULTI_USER 
GO
ALTER DATABASE [SeparacionCuentas] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [SeparacionCuentas] SET DB_CHAINING OFF 
GO
ALTER DATABASE [SeparacionCuentas] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [SeparacionCuentas] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [SeparacionCuentas] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [SeparacionCuentas] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
EXEC sys.sp_db_vardecimal_storage_format N'SeparacionCuentas', N'ON'
GO
ALTER DATABASE [SeparacionCuentas] SET QUERY_STORE = OFF
GO
USE [SeparacionCuentas]
GO
/****** Objeto: Table [dbo].[Cuenta] Fecha de script: 3/10/2026 11:06:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Cuenta](
	[id_cuenta] [int] IDENTITY(1,1) NOT NULL,
	[id_usuario_pagador] [int] NOT NULL,
	[descripcion] [varchar](200) NOT NULL,
	[monto_total] [decimal](12, 2) NOT NULL,
	[fecha] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Cuenta] PRIMARY KEY CLUSTERED 
(
	[id_cuenta] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Objeto: Table [dbo].[Division] Fecha de script: 3/10/2026 11:06:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Division](
	[id_division] [int] IDENTITY(1,1) NOT NULL,
	[id_cuenta] [int] NOT NULL,
	[id_usuario] [int] NOT NULL,
	[monto] [decimal](12, 2) NOT NULL,
	[estado] [varchar](20) NOT NULL,
	[tipo_pago] [varchar](30) NULL,
	[referencia_pago] [varchar](100) NULL,
	[fecha_pago] [datetime2](7) NULL,
 CONSTRAINT [PK_Division] PRIMARY KEY CLUSTERED 
(
	[id_division] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Division_Cuenta_Usuario] UNIQUE NONCLUSTERED 
(
	[id_cuenta] ASC,
	[id_usuario] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Objeto: Table [dbo].[Usuario] Fecha de script: 3/10/2026 11:06:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Usuario](
	[id_usuario] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [varchar](100) NOT NULL,
	[correo] [varchar](150) NOT NULL,
	[password_hash] [varchar](255) NOT NULL,
	[telefono] [varchar](20) NULL,
 CONSTRAINT [PK_Usuario] PRIMARY KEY CLUSTERED 
(
	[id_usuario] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Usuario_Correo] UNIQUE NONCLUSTERED 
(
	[correo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Cuenta] ADD  CONSTRAINT [DF_Cuenta_Fecha]  DEFAULT (getdate()) FOR [fecha]
GO
ALTER TABLE [dbo].[Division] ADD  CONSTRAINT [DF_Division_Estado]  DEFAULT ('PENDIENTE') FOR [estado]
GO
ALTER TABLE [dbo].[Cuenta]  WITH CHECK ADD  CONSTRAINT [FK_Cuenta_UsuarioPagador] FOREIGN KEY([id_usuario_pagador])
REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[Cuenta] CHECK CONSTRAINT [FK_Cuenta_UsuarioPagador]
GO
ALTER TABLE [dbo].[Division]  WITH CHECK ADD  CONSTRAINT [FK_Division_Cuenta] FOREIGN KEY([id_cuenta])
REFERENCES [dbo].[Cuenta] ([id_cuenta])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Division] CHECK CONSTRAINT [FK_Division_Cuenta]
GO
ALTER TABLE [dbo].[Division]  WITH CHECK ADD  CONSTRAINT [FK_Division_Usuario] FOREIGN KEY([id_usuario])
REFERENCES [dbo].[Usuario] ([id_usuario])
GO
ALTER TABLE [dbo].[Division] CHECK CONSTRAINT [FK_Division_Usuario]
GO
ALTER TABLE [dbo].[Cuenta]  WITH CHECK ADD  CONSTRAINT [CK_Cuenta_MontoTotal] CHECK  (([monto_total]>(0)))
GO
ALTER TABLE [dbo].[Cuenta] CHECK CONSTRAINT [CK_Cuenta_MontoTotal]
GO
ALTER TABLE [dbo].[Division]  WITH CHECK ADD  CONSTRAINT [CK_Division_Estado] CHECK  (([estado]='PAGADO' OR [estado]='PENDIENTE'))
GO
ALTER TABLE [dbo].[Division] CHECK CONSTRAINT [CK_Division_Estado]
GO
ALTER TABLE [dbo].[Division]  WITH CHECK ADD  CONSTRAINT [CK_Division_Monto] CHECK  (([monto]>(0)))
GO
ALTER TABLE [dbo].[Division] CHECK CONSTRAINT [CK_Division_Monto]
GO
USE [master]
GO
ALTER DATABASE [SeparacionCuentas] SET  READ_WRITE 
GO
