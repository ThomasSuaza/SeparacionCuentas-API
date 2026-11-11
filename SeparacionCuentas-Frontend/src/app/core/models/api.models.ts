// ============================================================================
// MODELOS Y DTOs EXACTOS DE SeparacionCuentas-API (.NET 10 + Dapper + SQL Server)
// ============================================================================

export type EstadoDivision = 'PENDIENTE' | 'PAGADO';
export type EstadoDistribucion = 'COMPLETA' | 'PENDIENTE' | 'EXCEDIDA';
export type TipoMovimiento = 'RECIBE' | 'PAGA' | 'SALDADO';
export type MetodoPago = 'Nequi' | 'Bancolombia' | 'DaviPlata' | 'PSE' | 'Efectivo' | 'Tarjeta';
export type ThemePalette = 'indigo' | 'gold';
export type WorkspaceRole = 'user' | 'admin';

/**
 * Entidad dbo.Usuario (ApiCQRS.Models.Usuario)
 */
export interface Usuario {
  idUsuario: number;
  nombre: string;
  correo: string;
  passwordHash: string;
  telefono?: string | null;
}

/**
 * DTO de salida de Usuario (ApiCQRS.Models.DTOs.UsuarioResponse)
 */
export interface UsuarioResponse {
  idUsuario: number;
  nombre: string;
  correo: string;
  telefono?: string | null;
}

/**
 * Entidad dbo.Cuenta (ApiCQRS.Models.Cuenta)
 */
export interface Cuenta {
  idCuenta: number;
  idUsuarioPagador: number;
  descripcion: string;
  montoTotal: number;
  fecha: string;
}

/**
 * Entidad dbo.Division (ApiCQRS.Models.Division)
 */
export interface Division {
  idDivision: number;
  idCuenta: number;
  idUsuario: number;
  monto: number;
  estado: EstadoDivision;
  tipoPago?: string | null;
  referenciaPago?: string | null;
  fechaPago?: string | null;
}

/**
 * DTO de saldo individual (ApiCQRS.Models.DTOs.SaldoUsuarioResponse)
 */
export interface SaldoUsuarioResponse {
  idUsuario: number;
  nombre: string;
  esPagador: boolean;
  montoAsignado: number;
  montoAdelantado: number;
  saldo: number;
  tipoMovimiento: TipoMovimiento;
}

/**
 * DTO de resumen de devoluciones y cuadre de cuenta
 * Retornado por GET /api/Cuenta/{idCuenta}/devoluciones
 */
export interface ResumenDevolucionCuentaResponse {
  idCuenta: number;
  montoTotalCuenta: number;
  totalDivisiones: number;
  diferencia: number;
  estadoDistribucion: EstadoDistribucion;
  saldos: SaldoUsuarioResponse[];
}

/**
 * Respuesta del endpoint de diagnóstico GET /dbtest
 */
export interface DbTestResponse {
  conectado: boolean;
  baseDatos: string;
  tablas: {
    usuario: boolean;
    cuenta: boolean;
    division: boolean;
  };
}

/**
 * Ítem de consumo auxiliar en el frontend para desglose visual de facturas (RF14)
 */
export interface ConsumoItem {
  id: string;
  idCuenta: number;
  concepto: string;
  detalle: string;
  valor: number;
  icono: string;
}

/**
 * Registro de auditoría para la Consola de Administrador
 */
export interface AuditLogEntry {
  id: string;
  fecha: string;
  modulo: 'Usuario' | 'Cuenta' | 'Division' | 'Sistema';
  metodo: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  descripcion: string;
  origen: 'API .NET' | 'Local Sync';
}
