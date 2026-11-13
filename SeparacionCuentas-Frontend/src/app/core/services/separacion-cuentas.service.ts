import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, tap, map, forkJoin, switchMap } from 'rxjs';
import {
  Usuario,
  UsuarioResponse,
  Cuenta,
  Division,
  ResumenDevolucionCuentaResponse,
  SaldoUsuarioResponse,
  DbTestResponse,
  ConsumoItem,
  AuditLogEntry,
  EstadoDistribucion,
  LoginResponse,
  MetodoPagoUsuario,
  NotificacionUsuario
} from '../models/api.models';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class SeparacionCuentasService {
  private readonly STORAGE_KEYS = {
    API_URL: 'splitia_api_url',
    USUARIOS: 'splitia_db_usuarios',
    CUENTAS: 'splitia_db_cuentas',
    DIVISIONES: 'splitia_db_divisiones',
    CONSUMOS: 'splitia_db_consumos',
    AUDIT: 'splitia_db_audit',
    METODOS: 'splitia_db_metodos',
    NOTIFS: 'splitia_db_notifs'
  };

  readonly apiUrl = signal<string>(this.loadSavedApiUrl());
  readonly isApiConnected = signal<boolean>(false);
  readonly lastDbCheck = signal<DbTestResponse | null>(null);
  readonly isLoading = signal<boolean>(false);

  // Estado reactivo global sincronizado con .NET API / Local Fallback
  readonly usuarios = signal<UsuarioResponse[]>([]);
  readonly cuentas = signal<Cuenta[]>([]);
  readonly divisiones = signal<Division[]>([]);
  readonly consumos = signal<ConsumoItem[]>([]);
  readonly auditLogs = signal<AuditLogEntry[]>([]);
  readonly metodosPago = signal<MetodoPagoUsuario[]>([]);
  readonly notificaciones = signal<NotificacionUsuario[]>([]);

  // KPIs calculados globalmente
  readonly volumenTotalCuentas = computed(() =>
    this.cuentas().reduce((acc, c) => acc + Number(c.montoTotal || 0), 0)
  );

  readonly totalPagadoDivisiones = computed(() =>
    this.divisiones()
      .filter(d => d.estado === 'PAGADO')
      .reduce((acc, d) => acc + Number(d.monto || 0), 0)
  );

  readonly totalPendienteDivisiones = computed(() =>
    this.divisiones()
      .filter(d => d.estado === 'PENDIENTE')
      .reduce((acc, d) => acc + Number(d.monto || 0), 0)
  );

  constructor(
    private http: HttpClient,
    private toast: ToastService
  ) {
    this.ensureSeedDataInLocal();
    this.refreshAllData();
  }

  private loadSavedApiUrl(): string {
    try {
      return localStorage.getItem(this.STORAGE_KEYS.API_URL) || environment.apiUrl;
    } catch {
      return environment.apiUrl;
    }
  }

  setApiUrl(newUrl: string): void {
    const clean = newUrl.trim().replace(/\/+$/, '');
    this.apiUrl.set(clean);
    try {
      localStorage.setItem(this.STORAGE_KEYS.API_URL, clean);
    } catch {
      // Ignore
    }
    this.refreshAllData();
  }

  private addAudit(
    modulo: AuditLogEntry['modulo'],
    metodo: AuditLogEntry['metodo'],
    endpoint: string,
    descripcion: string,
    origen: AuditLogEntry['origen']
  ): void {
    const entry: AuditLogEntry = {
      id: 'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      fecha: new Date().toISOString(),
      modulo,
      metodo,
      endpoint,
      descripcion,
      origen
    };
    const updated = [entry, ...this.auditLogs()].slice(0, 60);
    this.auditLogs.set(updated);
    this.saveLocal(this.STORAGE_KEYS.AUDIT, updated);
  }

  // ==========================================================================
  // CARGA Y SINCRONIZACIÓN INICIAL CON EL BACKEND .NET
  // ==========================================================================
  refreshAllData(): void {
    this.isLoading.set(true);
    this.checkDbConnection().subscribe(() => {
      forkJoin({
        usuarios: this.getUsuarios(),
        cuentas: this.getCuentas(),
        divisiones: this.getDivisiones(),
        items: this.loadItemsConsumo()
      }).subscribe({
        next: () => {
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
    });
  }

  loginBackend(correo: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl()}/api/Auth/login`, {
      correo,
      password
    });
  }

  registerBackend(payload: Omit<Usuario, 'idUsuario'>): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.apiUrl()}/api/Auth/register`, {
      idUsuario: 0,
      ...payload
    }).pipe(
      tap(userResp => {
        const updated = [...this.usuarios(), userResp];
        this.usuarios.set(updated);
        this.saveLocal(this.STORAGE_KEYS.USUARIOS, updated);
        this.addAudit('Usuario', 'POST', '/api/Auth/register', `Usuario registrado: ${userResp.nombre}`, 'API .NET');
        this.toast.show(`Usuario "${userResp.nombre}" registrado en SplitIA.`, 'success');
      })
    );
  }

  loadItemsConsumo(): Observable<ConsumoItem[]> {
    return this.http.get<Array<{ idItem: number; idCuenta: number; concepto: string; detalle?: string; valor: number; icono?: string }>>(`${this.apiUrl()}/api/Sistema/items`).pipe(
      map(rows =>
        rows.map(r => ({
          id: `SQL-${r.idItem}`,
          idCuenta: r.idCuenta,
          concepto: r.concepto,
          detalle: r.detalle || '',
          valor: Number(r.valor),
          icono: r.icono || '🧾'
        }))
      ),
      tap(items => {
        if (items.length > 0) {
          this.consumos.set(items);
          this.saveLocal(this.STORAGE_KEYS.CONSUMOS, items);
        }
      }),
      catchError(() => of(this.consumos()))
    );
  }

  loadMetodosPagoUsuario(idUsuario: number): Observable<MetodoPagoUsuario[]> {
    return this.http.get<MetodoPagoUsuario[]>(`${this.apiUrl()}/api/Sistema/metodos-pago/${idUsuario}`).pipe(
      tap(list => {
        this.metodosPago.set(list);
        this.saveLocal(this.STORAGE_KEYS.METODOS, list);
      }),
      catchError(() => {
        const fallback = this.loadLocal<MetodoPagoUsuario[]>(this.STORAGE_KEYS.METODOS, []);
        return of(fallback);
      })
    );
  }

  addMetodoPagoUsuario(metodo: Omit<MetodoPagoUsuario, 'idMetodo'>): Observable<MetodoPagoUsuario> {
    return this.http.post<MetodoPagoUsuario>(`${this.apiUrl()}/api/Sistema/metodos-pago`, {
      idMetodo: 0,
      ...metodo
    }).pipe(
      tap(created => {
        const current = metodo.esPrincipal
          ? this.metodosPago().map(m => ({ ...m, esPrincipal: false }))
          : [...this.metodosPago()];
        const updated = [...current, created];
        this.metodosPago.set(updated);
        this.saveLocal(this.STORAGE_KEYS.METODOS, updated);
        this.toast.show(`Medio de cobro ${created.entidad} guardado.`, 'success');
      }),
      catchError(() => {
        const created: MetodoPagoUsuario = {
          idMetodo: Date.now(),
          ...metodo
        };
        const updated = [...this.metodosPago(), created];
        this.metodosPago.set(updated);
        this.saveLocal(this.STORAGE_KEYS.METODOS, updated);
        this.toast.show(`Medio de cobro ${created.entidad} guardado localmente.`, 'success');
        return of(created);
      })
    );
  }

  loadNotificacionesUsuario(idUsuario: number): Observable<NotificacionUsuario[]> {
    return this.http.get<NotificacionUsuario[]>(`${this.apiUrl()}/api/Sistema/notificaciones/${idUsuario}`).pipe(
      tap(list => {
        this.notificaciones.set(list);
        this.saveLocal(this.STORAGE_KEYS.NOTIFS, list);
      }),
      catchError(() => of(this.notificaciones()))
    );
  }

  // ==========================================================================
  // DIAGNÓSTICO: GET /dbtest
  // ==========================================================================
  checkDbConnection(): Observable<DbTestResponse> {
    const url = `${this.apiUrl()}/dbtest`;
    return this.http.get<DbTestResponse>(url).pipe(
      tap(res => {
        this.isApiConnected.set(Boolean(res && res.conectado));
        this.lastDbCheck.set(res);
        this.addAudit('Sistema', 'GET', '/dbtest', `Conectado a SQL Server (${res.baseDatos})`, 'API .NET');
      }),
      catchError(() => {
        this.isApiConnected.set(false);
        const fallback: DbTestResponse = {
          conectado: false,
          baseDatos: 'SeparacionCuentas (Persistencia Local Activa)',
          tablas: { usuario: true, cuenta: true, division: true }
        };
        this.lastDbCheck.set(fallback);
        return of(fallback);
      })
    );
  }

  // ==========================================================================
  // MÓDULO USUARIO: /api/Usuario
  // ==========================================================================
  getUsuarios(): Observable<UsuarioResponse[]> {
    const url = `${this.apiUrl()}/api/Usuario`;
    return this.http.get<UsuarioResponse[]>(url).pipe(
      tap(list => {
        this.isApiConnected.set(true);
        this.usuarios.set(list);
        this.saveLocal(this.STORAGE_KEYS.USUARIOS, list);
      }),
      catchError(() => {
        const local = this.loadLocal<UsuarioResponse[]>(this.STORAGE_KEYS.USUARIOS, []);
        this.usuarios.set(local);
        return of(local);
      })
    );
  }

  getUsuarioById(id: number): Observable<UsuarioResponse | undefined> {
    const url = `${this.apiUrl()}/api/Usuario/${id}`;
    return this.http.get<UsuarioResponse>(url).pipe(
      catchError(() => {
        const found = this.usuarios().find(u => u.idUsuario === id);
        return of(found);
      })
    );
  }

  getParticipantesCuenta(idCuenta: number): Observable<UsuarioResponse[]> {
    const url = `${this.apiUrl()}/api/Usuario/cuenta/${idCuenta}/participantes`;
    return this.http.get<UsuarioResponse[]>(url).pipe(
      catchError(() => {
        const userIds = new Set(
          this.divisiones()
            .filter(d => d.idCuenta === idCuenta)
            .map(d => d.idUsuario)
        );
        const participantes = this.usuarios().filter(u => userIds.has(u.idUsuario));
        return of(participantes);
      })
    );
  }

  createUsuario(payload: Omit<Usuario, 'idUsuario'>): Observable<UsuarioResponse> {
    const url = `${this.apiUrl()}/api/Usuario`;
    const body: Usuario = { idUsuario: 0, ...payload };

    return this.http.post<Usuario>(url, body).pipe(
      map(created => ({
        idUsuario: created.idUsuario,
        nombre: created.nombre,
        correo: created.correo,
        telefono: created.telefono
      })),
      tap(userResp => {
        const updated = [...this.usuarios(), userResp];
        this.usuarios.set(updated);
        this.saveLocal(this.STORAGE_KEYS.USUARIOS, updated);
        this.addAudit('Usuario', 'POST', '/api/Usuario', `Usuario creado: ${userResp.nombre}`, 'API .NET');
        this.toast.show(`Usuario "${userResp.nombre}" registrado en API .NET.`, 'success');
      }),
      catchError(() => {
        const current = this.usuarios();
        const nextId = current.length > 0 ? Math.max(...current.map(u => u.idUsuario)) + 1 : 1;
        const created: UsuarioResponse = {
          idUsuario: nextId,
          nombre: payload.nombre,
          correo: payload.correo,
          telefono: payload.telefono || null
        };
        const updated = [...current, created];
        this.usuarios.set(updated);
        this.saveLocal(this.STORAGE_KEYS.USUARIOS, updated);
        this.addAudit('Usuario', 'POST', '/api/Usuario', `Usuario creado: ${created.nombre}`, 'Local Sync');
        this.toast.show(`Usuario "${created.nombre}" registrado correctamente.`, 'success');
        return of(created);
      })
    );
  }

  updateUsuario(id: number, payload: Usuario): Observable<UsuarioResponse> {
    const url = `${this.apiUrl()}/api/Usuario/${id}`;
    return this.http.put<Usuario>(url, payload).pipe(
      map(updated => ({
        idUsuario: updated.idUsuario,
        nombre: updated.nombre,
        correo: updated.correo,
        telefono: updated.telefono
      })),
      tap(userResp => {
        const list = this.usuarios().map(u => (u.idUsuario === id ? userResp : u));
        this.usuarios.set(list);
        this.saveLocal(this.STORAGE_KEYS.USUARIOS, list);
        this.addAudit('Usuario', 'PUT', `/api/Usuario/${id}`, `Usuario actualizado: ${userResp.nombre}`, 'API .NET');
        this.toast.show(`Datos de "${userResp.nombre}" actualizados.`, 'success');
      }),
      catchError(() => {
        const userResp: UsuarioResponse = {
          idUsuario: id,
          nombre: payload.nombre,
          correo: payload.correo,
          telefono: payload.telefono
        };
        const list = this.usuarios().map(u => (u.idUsuario === id ? userResp : u));
        this.usuarios.set(list);
        this.saveLocal(this.STORAGE_KEYS.USUARIOS, list);
        this.addAudit('Usuario', 'PUT', `/api/Usuario/${id}`, `Usuario actualizado: ${userResp.nombre}`, 'Local Sync');
        this.toast.show(`Datos de "${userResp.nombre}" actualizados.`, 'success');
        return of(userResp);
      })
    );
  }

  deleteUsuario(id: number): Observable<void> {
    const url = `${this.apiUrl()}/api/Usuario/${id}`;
    return this.http.delete<void>(url).pipe(
      tap(() => {
        this.removeUsuarioLocally(id, 'API .NET');
      }),
      catchError(() => {
        this.removeUsuarioLocally(id, 'Local Sync');
        return of(void 0);
      })
    );
  }

  private removeUsuarioLocally(id: number, origen: AuditLogEntry['origen']): void {
    const target = this.usuarios().find(u => u.idUsuario === id);
    const list = this.usuarios().filter(u => u.idUsuario !== id);
    this.usuarios.set(list);
    this.saveLocal(this.STORAGE_KEYS.USUARIOS, list);
    this.addAudit('Usuario', 'DELETE', `/api/Usuario/${id}`, `Usuario eliminado: ${target?.nombre || id}`, origen);
    this.toast.show(`Usuario eliminado correctamente.`, 'info');
  }

  // ==========================================================================
  // MÓDULO CUENTA: /api/Cuenta
  // ==========================================================================
  getCuentas(): Observable<Cuenta[]> {
    const url = `${this.apiUrl()}/api/Cuenta`;
    return this.http.get<Cuenta[]>(url).pipe(
      tap(list => {
        this.cuentas.set(list);
        this.saveLocal(this.STORAGE_KEYS.CUENTAS, list);
      }),
      catchError(() => {
        const local = this.loadLocal<Cuenta[]>(this.STORAGE_KEYS.CUENTAS, []);
        this.cuentas.set(local);
        return of(local);
      })
    );
  }

  getCuentaById(id: number): Observable<Cuenta | undefined> {
    const url = `${this.apiUrl()}/api/Cuenta/${id}`;
    return this.http.get<Cuenta>(url).pipe(
      catchError(() => of(this.cuentas().find(c => c.idCuenta === id)))
    );
  }

  getCuentasPorUsuarioPagador(idUsuario: number): Observable<Cuenta[]> {
    const url = `${this.apiUrl()}/api/Cuenta/usuario/${idUsuario}`;
    return this.http.get<Cuenta[]>(url).pipe(
      catchError(() => {
        const filtered = this.cuentas().filter(c => c.idUsuarioPagador === idUsuario);
        return of(filtered);
      })
    );
  }

  /**
   * GET /api/Cuenta/{idCuenta}/devoluciones
   * Replica exactamente la consulta CTE de CuentaQueries.GetDevoluciones y CuentaController.GetDevoluciones
   */
  getDevolucionesCuenta(idCuenta: number): Observable<ResumenDevolucionCuentaResponse> {
    const url = `${this.apiUrl()}/api/Cuenta/${idCuenta}/devoluciones`;
    return this.http.get<ResumenDevolucionCuentaResponse>(url).pipe(
      catchError(() => of(this.calcularDevolucionesLocal(idCuenta)))
    );
  }

  /**
   * Cálculo síncrono inmediato para vistas en tiempo real (idéntico al backend C# + Dapper SQL)
   */
  calcularDevolucionesLocal(idCuenta: number): ResumenDevolucionCuentaResponse {
    const cuenta = this.cuentas().find(c => c.idCuenta === idCuenta);
    if (!cuenta) {
      return {
        idCuenta,
        montoTotalCuenta: 0,
        totalDivisiones: 0,
        diferencia: 0,
        estadoDistribucion: 'PENDIENTE',
        saldos: []
      };
    }

    const divsCuenta = this.divisiones().filter(d => d.idCuenta === idCuenta);
    const usuariosMap = new Map(this.usuarios().map(u => [u.idUsuario, u]));

    // PendientePagador: suma de divisiones donde d.id_usuario <> c.id_usuario_pagador AND d.estado = 'PENDIENTE'
    const saldoPendientePagador = divsCuenta
      .filter(d => d.idUsuario !== cuenta.idUsuarioPagador && d.estado === 'PENDIENTE')
      .reduce((acc, d) => acc + Number(d.monto), 0);

    const divPagador = divsCuenta.find(d => d.idUsuario === cuenta.idUsuarioPagador);
    const pagadorUser = usuariosMap.get(cuenta.idUsuarioPagador);

    const saldos: SaldoUsuarioResponse[] = [];

    // 1. Fila del Pagador (UNION ALL parte 1 en CuentaQueries.cs)
    saldos.push({
      idUsuario: cuenta.idUsuarioPagador,
      nombre: pagadorUser ? pagadorUser.nombre : `Usuario #${cuenta.idUsuarioPagador}`,
      esPagador: true,
      montoAsignado: divPagador ? Number(divPagador.monto) : 0,
      montoAdelantado: Number(cuenta.montoTotal),
      saldo: saldoPendientePagador,
      tipoMovimiento: saldoPendientePagador > 0 ? 'RECIBE' : 'SALDADO'
    });

    // 2. Filas de los demás participantes (UNION ALL parte 2 en CuentaQueries.cs)
    for (const d of divsCuenta) {
      if (d.idUsuario === cuenta.idUsuarioPagador) continue;
      const usr = usuariosMap.get(d.idUsuario);
      const isPagado = d.estado === 'PAGADO';
      saldos.push({
        idUsuario: d.idUsuario,
        nombre: usr ? usr.nombre : `Usuario #${d.idUsuario}`,
        esPagador: false,
        montoAsignado: Number(d.monto),
        montoAdelantado: 0,
        saldo: isPagado ? 0 : Number(d.monto),
        tipoMovimiento: isPagado ? 'SALDADO' : 'PAGA'
      });
    }

    const totalDivisiones = saldos.reduce((acc, s) => acc + Number(s.montoAsignado), 0);
    const montoTotal = Number(cuenta.montoTotal);
    const diferencia = Math.abs(montoTotal - totalDivisiones);

    let estadoDistribucion: EstadoDistribucion = 'COMPLETA';
    if (Math.abs(totalDivisiones - montoTotal) < 0.01) {
      estadoDistribucion = 'COMPLETA';
    } else if (totalDivisiones < montoTotal) {
      estadoDistribucion = 'PENDIENTE';
    } else {
      estadoDistribucion = 'EXCEDIDA';
    }

    return {
      idCuenta: cuenta.idCuenta,
      montoTotalCuenta: montoTotal,
      totalDivisiones,
      diferencia,
      estadoDistribucion,
      saldos
    };
  }

  createCuenta(payload: Omit<Cuenta, 'idCuenta'>): Observable<Cuenta> {
    const url = `${this.apiUrl()}/api/Cuenta`;
    const body: Cuenta = { idCuenta: 0, ...payload };

    return this.http.post<Cuenta>(url, body).pipe(
      tap(created => {
        const updated = [created, ...this.cuentas()];
        this.cuentas.set(updated);
        this.saveLocal(this.STORAGE_KEYS.CUENTAS, updated);
        this.addAudit('Cuenta', 'POST', '/api/Cuenta', `Cuenta creada: ${created.descripcion}`, 'API .NET');
        this.toast.show(`Cuenta "${created.descripcion}" creada con éxito.`, 'success');
      }),
      catchError(() => {
        const current = this.cuentas();
        const nextId = current.length > 0 ? Math.max(...current.map(c => c.idCuenta)) + 1 : 1;
        const created: Cuenta = {
          idCuenta: nextId,
          ...payload
        };
        const updated = [created, ...current];
        this.cuentas.set(updated);
        this.saveLocal(this.STORAGE_KEYS.CUENTAS, updated);
        this.addAudit('Cuenta', 'POST', '/api/Cuenta', `Cuenta creada: ${created.descripcion}`, 'Local Sync');
        this.toast.show(`Cuenta "${created.descripcion}" registrada correctamente.`, 'success');
        return of(created);
      })
    );
  }

  updateCuenta(id: number, payload: Cuenta): Observable<Cuenta> {
    const url = `${this.apiUrl()}/api/Cuenta/${id}`;
    return this.http.put<Cuenta>(url, payload).pipe(
      tap(updated => {
        const list = this.cuentas().map(c => (c.idCuenta === id ? updated : c));
        this.cuentas.set(list);
        this.saveLocal(this.STORAGE_KEYS.CUENTAS, list);
        this.addAudit('Cuenta', 'PUT', `/api/Cuenta/${id}`, `Cuenta actualizada: ${updated.descripcion}`, 'API .NET');
        this.toast.show(`Cuenta "${updated.descripcion}" actualizada.`, 'success');
      }),
      catchError(() => {
        const list = this.cuentas().map(c => (c.idCuenta === id ? payload : c));
        this.cuentas.set(list);
        this.saveLocal(this.STORAGE_KEYS.CUENTAS, list);
        this.addAudit('Cuenta', 'PUT', `/api/Cuenta/${id}`, `Cuenta actualizada: ${payload.descripcion}`, 'Local Sync');
        this.toast.show(`Cuenta "${payload.descripcion}" actualizada.`, 'success');
        return of(payload);
      })
    );
  }

  deleteCuenta(id: number): Observable<void> {
    const url = `${this.apiUrl()}/api/Cuenta/${id}`;
    return this.http.delete<void>(url).pipe(
      tap(() => this.removeCuentaLocally(id, 'API .NET')),
      catchError(() => {
        this.removeCuentaLocally(id, 'Local Sync');
        return of(void 0);
      })
    );
  }

  private removeCuentaLocally(id: number, origen: AuditLogEntry['origen']): void {
    const target = this.cuentas().find(c => c.idCuenta === id);
    const updatedCuentas = this.cuentas().filter(c => c.idCuenta !== id);
    // ON DELETE CASCADE en dbo.Division
    const updatedDivisiones = this.divisiones().filter(d => d.idCuenta !== id);
    this.cuentas.set(updatedCuentas);
    this.divisiones.set(updatedDivisiones);
    this.saveLocal(this.STORAGE_KEYS.CUENTAS, updatedCuentas);
    this.saveLocal(this.STORAGE_KEYS.DIVISIONES, updatedDivisiones);
    this.addAudit('Cuenta', 'DELETE', `/api/Cuenta/${id}`, `Cuenta eliminada (cascade): ${target?.descripcion || id}`, origen);
    this.toast.show(`Cuenta y sus divisiones asociadas eliminadas.`, 'info');
  }

  // ==========================================================================
  // MÓDULO DIVISIÓN: /api/Division
  // ==========================================================================
  getDivisiones(): Observable<Division[]> {
    const url = `${this.apiUrl()}/api/Division`;
    return this.http.get<Division[]>(url).pipe(
      tap(list => {
        this.divisiones.set(list);
        this.saveLocal(this.STORAGE_KEYS.DIVISIONES, list);
      }),
      catchError(() => {
        const local = this.loadLocal<Division[]>(this.STORAGE_KEYS.DIVISIONES, []);
        this.divisiones.set(local);
        return of(local);
      })
    );
  }

  getDivisionesPorCuenta(idCuenta: number): Observable<Division[]> {
    const url = `${this.apiUrl()}/api/Division/cuenta/${idCuenta}`;
    return this.http.get<Division[]>(url).pipe(
      catchError(() => of(this.divisiones().filter(d => d.idCuenta === idCuenta)))
    );
  }

  getDivisionesPorUsuario(idUsuario: number): Observable<Division[]> {
    const url = `${this.apiUrl()}/api/Division/usuario/${idUsuario}`;
    return this.http.get<Division[]>(url).pipe(
      catchError(() => of(this.divisiones().filter(d => d.idUsuario === idUsuario)))
    );
  }

  createDivision(payload: Omit<Division, 'idDivision'>): Observable<Division> {
    const url = `${this.apiUrl()}/api/Division`;
    const body: Division = { idDivision: 0, ...payload };

    return this.http.post<Division>(url, body).pipe(
      tap(created => {
        const updated = [...this.divisiones(), created];
        this.divisiones.set(updated);
        this.saveLocal(this.STORAGE_KEYS.DIVISIONES, updated);
        this.addAudit('Division', 'POST', '/api/Division', `División creada en Cuenta #${created.idCuenta}`, 'API .NET');
      }),
      catchError(() => {
        const current = this.divisiones();
        const nextId = current.length > 0 ? Math.max(...current.map(d => d.idDivision)) + 1 : 1;
        const created: Division = {
          idDivision: nextId,
          ...payload
        };
        const updated = [...current, created];
        this.divisiones.set(updated);
        this.saveLocal(this.STORAGE_KEYS.DIVISIONES, updated);
        this.addAudit('Division', 'POST', '/api/Division', `División creada en Cuenta #${created.idCuenta}`, 'Local Sync');
        return of(created);
      })
    );
  }

  updateDivision(id: number, payload: Division, silent = false): Observable<Division> {
    const url = `${this.apiUrl()}/api/Division/${id}`;
    return this.http.put<Division>(url, payload).pipe(
      tap(updated => {
        const list = this.divisiones().map(d => (d.idDivision === id ? updated : d));
        this.divisiones.set(list);
        this.saveLocal(this.STORAGE_KEYS.DIVISIONES, list);
        this.addAudit('Division', 'PUT', `/api/Division/${id}`, `División #${id} -> ${updated.estado} ($${updated.monto})`, 'API .NET');
        if (!silent) {
          this.toast.show(`División #${id} actualizada (${updated.estado}).`, 'success');
        }
      }),
      catchError(() => {
        const list = this.divisiones().map(d => (d.idDivision === id ? payload : d));
        this.divisiones.set(list);
        this.saveLocal(this.STORAGE_KEYS.DIVISIONES, list);
        this.addAudit('Division', 'PUT', `/api/Division/${id}`, `División #${id} -> ${payload.estado} ($${payload.monto})`, 'Local Sync');
        if (!silent) {
          this.toast.show(`Pago/división #${id} actualizado (${payload.estado}).`, 'success');
        }
        return of(payload);
      })
    );
  }

  deleteDivision(id: number): Observable<void> {
    const url = `${this.apiUrl()}/api/Division/${id}`;
    return this.http.delete<void>(url).pipe(
      tap(() => this.removeDivisionLocally(id, 'API .NET')),
      catchError(() => {
        this.removeDivisionLocally(id, 'Local Sync');
        return of(void 0);
      })
    );
  }

  private removeDivisionLocally(id: number, origen: AuditLogEntry['origen']): void {
    const updated = this.divisiones().filter(d => d.idDivision !== id);
    this.divisiones.set(updated);
    this.saveLocal(this.STORAGE_KEYS.DIVISIONES, updated);
    this.addAudit('Division', 'DELETE', `/api/Division/${id}`, `División #${id} eliminada`, origen);
  }

  /**
   * Recalcula automáticamente en partes iguales todas las divisiones de una cuenta existente
   * y actualiza cada cuota en SQL Server (PUT /api/Division/{id}).
   */
  recalcularPartesIgualesCuenta(idCuenta: number): Observable<void> {
    const cuenta = this.cuentas().find(c => c.idCuenta === idCuenta);
    const divs = this.divisiones().filter(d => d.idCuenta === idCuenta);
    if (!cuenta || divs.length === 0) {
      return of(void 0);
    }

    const montoTotal = Number(cuenta.montoTotal);
    const n = divs.length;
    const cuotaBase = Math.floor(montoTotal / n);
    const residuo = montoTotal - cuotaBase * n;

    const peticiones = divs.map((d, index) => {
      const nuevoMonto = index === 0 ? cuotaBase + residuo : cuotaBase;
      return this.updateDivision(
        d.idDivision,
        {
          ...d,
          monto: nuevoMonto
        },
        true
      );
    });

    return forkJoin(peticiones).pipe(
      tap(() => {
        this.toast.show(
          `Cuotas recalculadas entre ${n} participantes ($${cuotaBase.toLocaleString('es-CO')} COP c/u).`,
          'success'
        );
      }),
      map(() => void 0)
    );
  }

  /**
   * Agrega un participante a una cuenta existente y recalcula automáticamente las cuotas de todos.
   */
  agregarParticipanteACuenta(
    idCuenta: number,
    idUsuario: number,
    recalcularIguales = true,
    montoPersonalizado?: number
  ): Observable<void> {
    const cuenta = this.cuentas().find(c => c.idCuenta === idCuenta);
    if (!cuenta) return of(void 0);

    const yaExiste = this.divisiones().some(
      d => d.idCuenta === idCuenta && d.idUsuario === Number(idUsuario)
    );
    if (yaExiste) {
      this.toast.show('Este usuario ya participa en esta cuenta.', 'warning');
      return of(void 0);
    }

    const divsActuales = this.divisiones().filter(d => d.idCuenta === idCuenta);
    const nuevoTotalPersonas = divsActuales.length + 1;
    const montoInicial = recalcularIguales
      ? Math.floor(Number(cuenta.montoTotal) / nuevoTotalPersonas)
      : Number(montoPersonalizado || Math.floor(Number(cuenta.montoTotal) / nuevoTotalPersonas));

    const esPagador = Number(idUsuario) === cuenta.idUsuarioPagador;

    return this.createDivision({
      idCuenta,
      idUsuario: Number(idUsuario),
      monto: montoInicial,
      estado: esPagador ? 'PAGADO' : 'PENDIENTE',
      tipoPago: esPagador ? 'Nequi' : null,
      referenciaPago: esPagador ? 'PAGADOR-ORIGEN' : null,
      fechaPago: esPagador ? new Date().toISOString() : null
    }).pipe(
      switchMap(() => {
        if (recalcularIguales) {
          return this.recalcularPartesIgualesCuenta(idCuenta);
        }
        this.toast.show(
          `Participante agregado con cuota de $${montoInicial.toLocaleString('es-CO')} COP.`,
          'success'
        );
        return of(void 0);
      })
    );
  }

  /**
   * Quita a un participante de una cuenta existente y recalcula automáticamente las cuotas restantes.
   */
  quitarParticipanteDeCuenta(
    idCuenta: number,
    idDivision: number,
    recalcularIguales = true
  ): Observable<void> {
    const divTarget = this.divisiones().find(d => d.idDivision === idDivision);
    const nombreQuitado = divTarget ? this.getNombreUsuario(divTarget.idUsuario) : 'Participante';

    return this.deleteDivision(idDivision).pipe(
      switchMap(() => {
        const restantes = this.divisiones().filter(d => d.idCuenta === idCuenta);
        if (recalcularIguales && restantes.length > 0) {
          return this.recalcularPartesIgualesCuenta(idCuenta);
        }
        this.toast.show(`${nombreQuitado} fue retirado de la cuenta.`, 'info');
        return of(void 0);
      })
    );
  }

  // ==========================================================================
  // ÍTEMS DE CONSUMO POR CUENTA (SINCRONIZADO CON SQL SERVER dbo.ItemConsumo)
  // ==========================================================================
  getConsumosPorCuenta(idCuenta: number): ConsumoItem[] {
    return this.consumos().filter(c => c.idCuenta === idCuenta);
  }

  addConsumoItem(item: Omit<ConsumoItem, 'id'>): void {
    this.http
      .post<{ idItem: number; idCuenta: number; concepto: string; detalle?: string; valor: number; icono?: string }>(
        `${this.apiUrl()}/api/Sistema/items`,
        {
          idItem: 0,
          idCuenta: item.idCuenta,
          concepto: item.concepto,
          detalle: item.detalle,
          valor: item.valor,
          icono: item.icono
        }
      )
      .pipe(
        catchError(() =>
          of({
            idItem: Date.now(),
            idCuenta: item.idCuenta,
            concepto: item.concepto,
            detalle: item.detalle,
            valor: item.valor,
            icono: item.icono
          })
        )
      )
      .subscribe(res => {
        const nuevo: ConsumoItem = {
          id: `SQL-${res.idItem}`,
          idCuenta: res.idCuenta,
          concepto: res.concepto,
          detalle: res.detalle || '',
          valor: Number(res.valor),
          icono: res.icono || '🧾'
        };
        const updated = [...this.consumos(), nuevo];
        this.consumos.set(updated);
        this.saveLocal(this.STORAGE_KEYS.CONSUMOS, updated);
      });
  }

  // ==========================================================================
  // HELPERS DE UTILIDAD Y DATOS SEMILLA REALISTAS (COP)
  // ==========================================================================
  getNombreUsuario(idUsuario: number): string {
    return this.usuarios().find(u => u.idUsuario === idUsuario)?.nombre || `Usuario #${idUsuario}`;
  }

  getIniciales(nombre: string): string {
    if (!nombre) return 'US';
    const parts = nombre.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  resetDemoData(): void {
    localStorage.removeItem(this.STORAGE_KEYS.USUARIOS);
    localStorage.removeItem(this.STORAGE_KEYS.CUENTAS);
    localStorage.removeItem(this.STORAGE_KEYS.DIVISIONES);
    localStorage.removeItem(this.STORAGE_KEYS.CONSUMOS);
    this.ensureSeedDataInLocal();
    this.refreshAllData();
    this.toast.show('Datos de demostración restaurados al estado original.', 'info');
  }

  private ensureSeedDataInLocal(): void {
    const existingUsers = this.loadLocal<UsuarioResponse[]>(this.STORAGE_KEYS.USUARIOS, []);
    if (existingUsers.length > 0) {
      this.usuarios.set(existingUsers);
      this.cuentas.set(this.loadLocal<Cuenta[]>(this.STORAGE_KEYS.CUENTAS, []));
      this.divisiones.set(this.loadLocal<Division[]>(this.STORAGE_KEYS.DIVISIONES, []));
      this.consumos.set(this.loadLocal<ConsumoItem[]>(this.STORAGE_KEYS.CONSUMOS, []));
      this.auditLogs.set(this.loadLocal<AuditLogEntry[]>(this.STORAGE_KEYS.AUDIT, []));
      return;
    }

    const seedUsuarios: UsuarioResponse[] = [
      { idUsuario: 1, nombre: 'Thomas Suaza', correo: 'thomas@correo.com', telefono: '+57 300 111 2233', rol: 'USUARIO' },
      { idUsuario: 2, nombre: 'Carolina Mejía', correo: 'carolina.mejia@splitia.app', telefono: '+57 311 540 2219', rol: 'USUARIO' },
      { idUsuario: 3, nombre: 'Andrés Restrepo', correo: 'andres.restrepo@splitia.app', telefono: '+57 315 892 3304', rol: 'USUARIO' },
      { idUsuario: 4, nombre: 'Valentina Gómez', correo: 'valentina.gomez@splitia.app', telefono: '+57 320 671 9940', rol: 'USUARIO' },
      { idUsuario: 5, nombre: 'Miguel Ángel Taborda', correo: 'miguel.taborda@splitia.app', telefono: '+57 301 778 4512', rol: 'USUARIO' },
      { idUsuario: 6, nombre: 'Jorge Galindo', correo: 'jorge.galindo@splitia.app', telefono: '+57 318 334 1120', rol: 'USUARIO' }
    ];

    const seedCuentas: Cuenta[] = [
      {
        idCuenta: 1,
        idUsuarioPagador: 1,
        descripcion: 'Cena con amigos - Trattoria Napolitana',
        montoTotal: 240000,
        fecha: '2026-10-27T20:15:00',
        categoria: 'Restaurante',
        estado: 'ACTIVA'
      },
      {
        idCuenta: 2,
        idUsuarioPagador: 5,
        descripcion: 'Asado de fin de semana en Rionegro',
        montoTotal: 420000,
        fecha: '2026-11-02T14:30:00',
        categoria: 'Viajes y Eventos',
        estado: 'ACTIVA'
      },
      {
        idCuenta: 3,
        idUsuarioPagador: 1,
        descripcion: 'Suscripción Cloud & Dominio SplitIA',
        montoTotal: 180000,
        fecha: '2026-11-06T09:00:00',
        categoria: 'Tecnología',
        estado: 'ACTIVA'
      },
      {
        idCuenta: 4,
        idUsuarioPagador: 2,
        descripcion: 'Brunch de Cumpleaños en El Poblado',
        montoTotal: 315000,
        fecha: '2026-11-09T11:20:00',
        categoria: 'Restaurante',
        estado: 'ACTIVA'
      }
    ];

    const seedDivisiones: Division[] = [
      // Cuenta #1 ($240.000 entre 4 personas = $60.000 c/u - Datos semilla SplitIA)
      {
        idDivision: 1,
        idCuenta: 1,
        idUsuario: 1,
        monto: 60000,
        estado: 'PAGADO',
        tipoPago: 'Nequi',
        referenciaPago: 'PAGADOR-ORIGEN',
        fechaPago: '2026-10-27T20:16:00'
      },
      {
        idDivision: 2,
        idCuenta: 1,
        idUsuario: 2,
        monto: 60000,
        estado: 'PAGADO',
        tipoPago: 'Bancolombia',
        referenciaPago: 'QR-889412',
        fechaPago: '2026-10-28T10:05:00'
      },
      {
        idDivision: 3,
        idCuenta: 1,
        idUsuario: 3,
        monto: 60000,
        estado: 'PENDIENTE',
        tipoPago: null,
        referenciaPago: null,
        fechaPago: null
      },
      {
        idDivision: 4,
        idCuenta: 1,
        idUsuario: 4,
        monto: 60000,
        estado: 'PENDIENTE',
        tipoPago: null,
        referenciaPago: null,
        fechaPago: null
      },

      // Cuenta #2 ($420.000 entre 6 personas = $70.000 c/u)
      {
        idDivision: 5,
        idCuenta: 2,
        idUsuario: 5,
        monto: 70000,
        estado: 'PAGADO',
        tipoPago: 'Bancolombia',
        referenciaPago: 'PAGADOR-ORIGEN',
        fechaPago: '2026-11-02T14:35:00'
      },
      {
        idDivision: 6,
        idCuenta: 2,
        idUsuario: 1,
        monto: 70000,
        estado: 'PAGADO',
        tipoPago: 'Nequi',
        referenciaPago: 'NEQ-552019',
        fechaPago: '2026-11-03T08:40:00'
      },
      {
        idDivision: 7,
        idCuenta: 2,
        idUsuario: 6,
        monto: 70000,
        estado: 'PAGADO',
        tipoPago: 'DaviPlata',
        referenciaPago: 'DAV-771230',
        fechaPago: '2026-11-03T12:10:00'
      },
      {
        idDivision: 8,
        idCuenta: 2,
        idUsuario: 2,
        monto: 70000,
        estado: 'PENDIENTE',
        tipoPago: null,
        referenciaPago: null,
        fechaPago: null
      },
      {
        idDivision: 9,
        idCuenta: 2,
        idUsuario: 3,
        monto: 70000,
        estado: 'PENDIENTE',
        tipoPago: null,
        referenciaPago: null,
        fechaPago: null
      },
      {
        idDivision: 10,
        idCuenta: 2,
        idUsuario: 4,
        monto: 70000,
        estado: 'PAGADO',
        tipoPago: 'PSE',
        referenciaPago: 'PSE-900311',
        fechaPago: '2026-11-04T17:22:00'
      },

      // Cuenta #3 ($180.000 entre los 3 integrantes del equipo: Thomas, Miguel, Jorge = $60.000 c/u)
      {
        idDivision: 11,
        idCuenta: 3,
        idUsuario: 1,
        monto: 60000,
        estado: 'PAGADO',
        tipoPago: 'Tarjeta',
        referenciaPago: 'PAGADOR-ORIGEN',
        fechaPago: '2026-11-06T09:00:00'
      },
      {
        idDivision: 12,
        idCuenta: 3,
        idUsuario: 5,
        monto: 60000,
        estado: 'PAGADO',
        tipoPago: 'Nequi',
        referenciaPago: 'NEQ-319044',
        fechaPago: '2026-11-06T15:30:00'
      },
      {
        idDivision: 13,
        idCuenta: 3,
        idUsuario: 6,
        monto: 60000,
        estado: 'PENDIENTE',
        tipoPago: null,
        referenciaPago: null,
        fechaPago: null
      },

      // Cuenta #4 ($315.000 con distribución parcial/pendiente de asignar para demostrar auditoría)
      {
        idDivision: 14,
        idCuenta: 4,
        idUsuario: 2,
        monto: 105000,
        estado: 'PAGADO',
        tipoPago: 'Bancolombia',
        referenciaPago: 'PAGADOR-ORIGEN',
        fechaPago: '2026-11-09T11:20:00'
      },
      {
        idDivision: 15,
        idCuenta: 4,
        idUsuario: 1,
        monto: 105000,
        estado: 'PENDIENTE',
        tipoPago: null,
        referenciaPago: null,
        fechaPago: null
      },
      {
        idDivision: 16,
        idCuenta: 4,
        idUsuario: 4,
        monto: 105000,
        estado: 'PAGADO',
        tipoPago: 'Nequi',
        referenciaPago: 'NEQ-882910',
        fechaPago: '2026-11-09T19:00:00'
      }
    ];

    const seedConsumos: ConsumoItem[] = [
      { id: 'C-1', idCuenta: 1, concepto: 'Pizza Artesanal', detalle: '2 unidades familiares', valor: 96000, icono: 'P' },
      { id: 'C-2', idCuenta: 1, concepto: 'Bebidas y Cócteles', detalle: '4 unidades', valor: 64000, icono: 'B' },
      { id: 'C-3', idCuenta: 1, concepto: 'Entradas', detalle: 'Para compartir en mesa', valor: 48000, icono: 'E' },
      { id: 'C-4', idCuenta: 1, concepto: 'Servicio y Propina', detalle: 'Cargo voluntario 15%', valor: 32000, icono: 'S' },
      { id: 'C-5', idCuenta: 2, concepto: 'Cortes Premium Angus', detalle: '3.5 kg para parrilla', valor: 245000, icono: 'C' },
      { id: 'C-6', idCuenta: 2, concepto: 'Guarniciones y Carbón', detalle: 'Arepas, chorizos, guacamole', valor: 105000, icono: 'G' },
      { id: 'C-7', idCuenta: 2, concepto: 'Bebidas y Hielo', detalle: 'Cervezas y gaseosas', valor: 70000, icono: 'B' },
      { id: 'C-8', idCuenta: 3, concepto: 'Azure SQL + App Service', detalle: 'Plan mensual .NET 10', valor: 135000, icono: 'A' },
      { id: 'C-9', idCuenta: 3, concepto: 'Dominio splitia.app', detalle: 'Renovación anual prorrateada', valor: 45000, icono: 'D' },
      { id: 'C-10', idCuenta: 4, concepto: 'Platos Fuertes Brunch', detalle: '3 Huevos Benedictinos + Waffle', valor: 195000, icono: 'B' },
      { id: 'C-11', idCuenta: 4, concepto: 'Mimosas & Café Especial', detalle: 'Jarra de mimosa + 3 cafés', valor: 120000, icono: 'M' }
    ];

    this.usuarios.set(seedUsuarios);
    this.cuentas.set(seedCuentas);
    this.divisiones.set(seedDivisiones);
    this.consumos.set(seedConsumos);

    this.saveLocal(this.STORAGE_KEYS.USUARIOS, seedUsuarios);
    this.saveLocal(this.STORAGE_KEYS.CUENTAS, seedCuentas);
    this.saveLocal(this.STORAGE_KEYS.DIVISIONES, seedDivisiones);
    this.saveLocal(this.STORAGE_KEYS.CONSUMOS, seedConsumos);
  }

  private saveLocal<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Ignore
    }
  }

  private loadLocal<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }
}
