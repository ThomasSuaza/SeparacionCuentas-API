import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeparacionCuentasService } from '../../core/services/separacion-cuentas.service';

export interface ActividadRecienteItem {
  id: string;
  tipo: 'PAGO' | 'CUENTA' | 'PENDIENTE';
  titulo: string;
  subtitulo: string;
  usuario: string;
  iniciales: string;
  monto: number;
  metodo?: string;
  referencia?: string;
  fecha: string;
  estadoBadge: string;
  badgeClass: 'badge-success' | 'badge-info' | 'badge-warning';
}

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="heading-row">
      <div>
        <div class="eyebrow">CONSOLA EJECUTIVA · SPLITIA</div>
        <h1 class="page-title">Panel de Administración</h1>
        <p class="intro">
          Monitoreo en tiempo real de cuentas compartidas, transacciones procesadas, recaudo y actividad reciente.
        </p>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="btn-outline" type="button" (click)="api.refreshAllData()">
          🔄 Actualizar en vivo
        </button>
        <a routerLink="/admin/cuentas" class="btn-outline">
          + Nueva cuenta
        </a>
        <a routerLink="/admin/divisiones" class="btn-primary">
          Ver transacciones →
        </a>
      </div>
    </div>

    <!-- KPIs Financieros Reales -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="tiny">
          Volumen Total Facturado
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <strong>&#36;{{ api.volumenTotalCuentas() | number:'1.0-0' }}</strong>
        <small>COP · Promedio &#36;{{ ticketPromedioCuenta() | number:'1.0-0' }} en {{ api.cuentas().length }} cuentas</small>
      </div>

      <div class="stat-card">
        <div class="tiny">
          Total Recaudado en Pagos
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>
        </div>
        <strong style="color: var(--success);">&#36;{{ api.totalPagadoDivisiones() | number:'1.0-0' }}</strong>
        <small>{{ pagosCompletadosCount() }} transacciones pagadas ({{ porcentajeRecaudo() }}% efectividad)</small>
      </div>

      <div class="stat-card">
        <div class="tiny">
          Cartera Pendiente por Cobrar
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
        </div>
        <strong style="color: var(--warning);">&#36;{{ api.totalPendienteDivisiones() | number:'1.0-0' }}</strong>
        <small>{{ pagosPendientesCount() }} cuotas pendientes de liquidación</small>
      </div>

      <div class="stat-card">
        <div class="tiny">
          Comunidad Activa
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/></svg>
        </div>
        <strong>{{ api.usuarios().length }} usuarios</strong>
        <small>{{ cuentasLiquidadasCount() }} de {{ api.cuentas().length }} cuentas con distribución completa</small>
      </div>
    </div>

    <div class="content-grid">
      <!-- COLUMNA IZQUIERDA: Cuentas Recientes y Progreso de Recaudo -->
      <div style="display: grid; gap: 22px; align-content: start;">
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>Cuentas recientes y progreso de cobro</h2>
              <p class="sub">Estado financiero y nivel de recaudo de las cuentas activas.</p>
            </div>
            <a routerLink="/admin/cuentas" class="pill">Gestionar cuentas →</a>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Cuenta / Fecha</th>
                  <th>Organizador</th>
                  <th>Monto Total</th>
                  <th>Progreso de Recaudo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (item of auditoriaCuentas(); track item.cuenta.idCuenta) {
                  <tr>
                    <td>
                      <strong>{{ item.cuenta.descripcion }}</strong>
                      <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">
                        #{{ item.cuenta.idCuenta }} · {{ item.cuenta.fecha | date:'dd MMM yyyy, HH:mm' }}
                      </div>
                    </td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="person-bubble" style="width: 28px; height: 28px; font-size: 10.5px;">
                          {{ api.getIniciales(api.getNombreUsuario(item.cuenta.idUsuarioPagador)) }}
                        </div>
                        <span>{{ api.getNombreUsuario(item.cuenta.idUsuarioPagador) }}</span>
                      </div>
                    </td>
                    <td>
                      <strong>&#36;{{ item.cuenta.montoTotal | number:'1.0-0' }}</strong>
                      <div style="font-size: 10.5px; color: var(--muted);">
                        {{ item.participantesCount }} participantes
                      </div>
                    </td>
                    <td style="min-width: 155px;">
                      <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 4px;">
                        <span style="color: var(--success);">&#36;{{ item.montoPagado | number:'1.0-0' }}</span>
                        <span style="color: var(--muted);">{{ item.porcentajeCobrado }}%</span>
                      </div>
                      <div class="progress-track" style="height: 7px;">
                        <i class="progress-fill" [style.width.%]="item.porcentajeCobrado"></i>
                      </div>
                    </td>
                    <td>
                      <span
                        class="badge-status"
                        [class.badge-success]="item.devolucion.estadoDistribucion === 'COMPLETA'"
                        [class.badge-warning]="item.devolucion.estadoDistribucion === 'PENDIENTE'"
                        [class.badge-danger]="item.devolucion.estadoDistribucion === 'EXCEDIDA'"
                      >
                        {{ item.devolucion.estadoDistribucion }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <!-- Ranking de Usuarios y Participación -->
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>Actividad financiera por usuario</h2>
              <p class="sub">Volumen pagado como organizador y cumplimiento de cuotas.</p>
            </div>
            <a routerLink="/admin/usuarios" class="pill">Directorio de usuarios →</a>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
            @for (u of resumenUsuarios().slice(0, 6); track u.idUsuario) {
              <div style="padding: 13px 14px; border-radius: 13px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                  <div class="person-bubble">{{ api.getIniciales(u.nombre) }}</div>
                  <div style="min-width: 0;">
                    <strong style="font-size: 13px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ u.nombre }}</strong>
                    <small style="font-size: 11px; color: var(--muted);">{{ u.cuentasCreadas }} cuentas · {{ u.cuotasTotales }} cuotas</small>
                  </div>
                </div>
                <div style="text-align: right; flex-shrink: 0;">
                  <strong style="font-size: 12.5px; display: block;">&#36;{{ u.volumenPagado | number:'1.0-0' }}</strong>
                  <span
                    class="badge-status"
                    style="font-size: 9.5px; padding: 2px 7px;"
                    [class.badge-success]="u.pendientePorPagar === 0"
                    [class.badge-warning]="u.pendientePorPagar > 0"
                  >
                    {{ u.pendientePorPagar === 0 ? 'Al día' : 'Debe $' + (u.pendientePorPagar | number:'1.0-0') }}
                  </span>
                </div>
              </div>
            }
          </div>
        </section>
      </div>

      <!-- COLUMNA DERECHA: Actividad Reciente (Cuentas y Transacciones Reales) + Métodos de Pago -->
      <div style="display: grid; gap: 22px; align-content: start;">
        <section class="panel">
          <div class="panel-head" style="margin-bottom: 12px;">
            <div>
              <h2>Actividad y transacciones recientes</h2>
              <p class="sub">Últimas cuentas creadas, pagos recibidos y cobros en curso.</p>
            </div>
            <a routerLink="/admin/divisiones" class="pill">Ver todo</a>
          </div>

          <!-- Filtros de Actividad Reciente -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;">
            <button
              type="button"
              class="btn-outline btn-sm"
              [style.background]="filtroActividad() === 'TODOS' ? 'var(--accent-soft)' : ''"
              [style.border-color]="filtroActividad() === 'TODOS' ? 'var(--accent)' : ''"
              [style.color]="filtroActividad() === 'TODOS' ? 'var(--accent)' : ''"
              (click)="filtroActividad.set('TODOS')"
            >
              Todos ({{ actividadesRecientes().length }})
            </button>
            <button
              type="button"
              class="btn-outline btn-sm"
              [style.background]="filtroActividad() === 'PAGO' ? 'var(--accent-soft)' : ''"
              [style.border-color]="filtroActividad() === 'PAGO' ? 'var(--accent)' : ''"
              [style.color]="filtroActividad() === 'PAGO' ? 'var(--accent)' : ''"
              (click)="filtroActividad.set('PAGO')"
            >
              💳 Pagos
            </button>
            <button
              type="button"
              class="btn-outline btn-sm"
              [style.background]="filtroActividad() === 'CUENTA' ? 'var(--accent-soft)' : ''"
              [style.border-color]="filtroActividad() === 'CUENTA' ? 'var(--accent)' : ''"
              [style.color]="filtroActividad() === 'CUENTA' ? 'var(--accent)' : ''"
              (click)="filtroActividad.set('CUENTA')"
            >
              🧾 Cuentas
            </button>
            <button
              type="button"
              class="btn-outline btn-sm"
              [style.background]="filtroActividad() === 'PENDIENTE' ? 'var(--accent-soft)' : ''"
              [style.border-color]="filtroActividad() === 'PENDIENTE' ? 'var(--accent)' : ''"
              [style.color]="filtroActividad() === 'PENDIENTE' ? 'var(--accent)' : ''"
              (click)="filtroActividad.set('PENDIENTE')"
            >
              ⏳ Pendientes
            </button>
          </div>

          <!-- Feed de Transacciones y Cuentas Recientes -->
          <div style="display: grid; gap: 10px; max-height: 410px; overflow-y: auto; padding-right: 2px;">
            @for (act of actividadesFiltradas().slice(0, 10); track act.id) {
              <div style="padding: 12px 14px; border-radius: 13px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 11px; min-width: 0;">
                  <div
                    class="person-bubble"
                    [style.background]="act.tipo === 'PAGO' ? 'var(--success-soft)' : act.tipo === 'CUENTA' ? 'var(--accent-soft)' : 'var(--warning-soft)'"
                    [style.color]="act.tipo === 'PAGO' ? 'var(--success)' : act.tipo === 'CUENTA' ? 'var(--accent)' : 'var(--warning)'"
                  >
                    {{ act.iniciales }}
                  </div>
                  <div style="min-width: 0;">
                    <strong style="font-size: 12.5px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      {{ act.titulo }}
                    </strong>
                    <div style="font-size: 11px; color: var(--muted); margin-top: 2px; display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                      <span>{{ act.subtitulo }}</span>
                      @if (act.metodo) {
                        <span>· <b>{{ act.metodo }}</b></span>
                      }
                      @if (act.referencia) {
                        <span>({{ act.referencia }})</span>
                      }
                    </div>
                  </div>
                </div>

                <div style="text-align: right; flex-shrink: 0;">
                  <strong
                    style="font-size: 13px; display: block;"
                    [style.color]="act.tipo === 'PAGO' ? 'var(--success)' : act.tipo === 'PENDIENTE' ? 'var(--warning)' : 'var(--text)'"
                  >
                    {{ act.tipo === 'PAGO' ? '+' : '' }}&#36;{{ act.monto | number:'1.0-0' }}
                  </strong>
                  <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; margin-top: 3px;">
                    <span class="badge-status" [ngClass]="act.badgeClass" style="font-size: 9.5px; padding: 2px 7px;">
                      {{ act.estadoBadge }}
                    </span>
                    <small style="font-size: 10px; color: var(--muted);">{{ act.fecha | date:'dd/MM HH:mm' }}</small>
                  </div>
                </div>
              </div>
            } @empty {
              <div style="padding: 20px; text-align: center; font-size: 12.5px; color: var(--muted);">
                No hay movimientos en esta categoría.
              </div>
            }
          </div>
        </section>

        <!-- Métodos de Pago Preferidos -->
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>Volumen por método de pago</h2>
              <p class="sub">Distribución de transacciones confirmadas por canal.</p>
            </div>
          </div>

          <div style="display: grid; gap: 13px;">
            @for (m of estadisticasMetodosPago(); track m.metodo) {
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 5px;">
                  <span>{{ m.metodo }} <small style="color: var(--muted); font-weight: 600;">({{ m.cantidad }} {{ m.cantidad === 1 ? 'transacción' : 'transacciones' }})</small></span>
                  <span>&#36;{{ m.monto | number:'1.0-0' }} COP ({{ m.porcentaje }}%)</span>
                </div>
                <div class="progress-track">
                  <i class="progress-fill" [style.width.%]="m.porcentaje"></i>
                </div>
              </div>
            } @empty {
              <div style="font-size: 12px; color: var(--muted);">
                Aún no se han registrado pagos confirmados.
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `
})
export class AdminOverviewComponent {
  readonly api = inject(SeparacionCuentasService);

  readonly filtroActividad = signal<'TODOS' | 'PAGO' | 'CUENTA' | 'PENDIENTE'>('TODOS');

  readonly porcentajeRecaudo = computed(() => {
    const pagado = this.api.totalPagadoDivisiones();
    const total = pagado + this.api.totalPendienteDivisiones();
    if (total === 0) return 0;
    return Math.round((pagado / total) * 100);
  });

  readonly ticketPromedioCuenta = computed(() => {
    const totalCuentas = this.api.cuentas().length;
    if (totalCuentas === 0) return 0;
    return Math.round(this.api.volumenTotalCuentas() / totalCuentas);
  });

  readonly pagosCompletadosCount = computed(
    () => this.api.divisiones().filter(d => d.estado === 'PAGADO').length
  );

  readonly pagosPendientesCount = computed(
    () => this.api.divisiones().filter(d => d.estado === 'PENDIENTE').length
  );

  readonly cuentasLiquidadasCount = computed(
    () =>
      this.api
        .cuentas()
        .filter(c => this.api.calcularDevolucionesLocal(c.idCuenta).estadoDistribucion === 'COMPLETA').length
  );

  readonly auditoriaCuentas = computed(() =>
    [...this.api.cuentas()]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .map(cuenta => {
        const devolucion = this.api.calcularDevolucionesLocal(cuenta.idCuenta);
        const divs = this.api.divisiones().filter(d => d.idCuenta === cuenta.idCuenta);
        const montoPagado = divs
          .filter(d => d.estado === 'PAGADO')
          .reduce((acc, d) => acc + Number(d.monto), 0);
        const totalRef = Number(cuenta.montoTotal) || 1;
        const porcentajeCobrado = Math.min(100, Math.round((montoPagado / totalRef) * 100));

        return {
          cuenta,
          devolucion,
          participantesCount: Math.max(divs.length, devolucion.saldos.length),
          montoPagado,
          porcentajeCobrado
        };
      })
  );

  readonly resumenUsuarios = computed(() => {
    const cuentas = this.api.cuentas();
    const divisiones = this.api.divisiones();

    return this.api
      .usuarios()
      .map(u => {
        const misCuentas = cuentas.filter(c => c.idUsuarioPagador === u.idUsuario);
        const misDivisiones = divisiones.filter(d => d.idUsuario === u.idUsuario);
        const volumenPagado = misCuentas.reduce((acc, c) => acc + Number(c.montoTotal), 0);
        const pendientePorPagar = misDivisiones
          .filter(d => d.estado === 'PENDIENTE')
          .reduce((acc, d) => acc + Number(d.monto), 0);

        return {
          ...u,
          cuentasCreadas: misCuentas.length,
          cuotasTotales: misDivisiones.length,
          volumenPagado,
          pendientePorPagar
        };
      })
      .sort((a, b) => b.volumenPagado - a.volumenPagado || b.cuotasTotales - a.cuotasTotales);
  });

  readonly actividadesRecientes = computed<ActividadRecienteItem[]>(() => {
    const items: ActividadRecienteItem[] = [];
    const cuentasMap = new Map(this.api.cuentas().map(c => [c.idCuenta, c]));

    // 1. Transacciones y cuotas de divisiones (Pagos confirmados y cobros pendientes)
    for (const d of this.api.divisiones()) {
      const nombreUsuario = this.api.getNombreUsuario(d.idUsuario);
      const cuenta = cuentasMap.get(d.idCuenta);
      const nombreCuenta = cuenta ? cuenta.descripcion : `Cuenta #${d.idCuenta}`;
      const fechaRef = d.fechaPago || cuenta?.fecha || new Date().toISOString();

      if (d.estado === 'PAGADO') {
        items.push({
          id: `DIV-PAG-${d.idDivision}`,
          tipo: 'PAGO',
          titulo: `${nombreUsuario} pagó su cuota`,
          subtitulo: nombreCuenta,
          usuario: nombreUsuario,
          iniciales: this.api.getIniciales(nombreUsuario),
          monto: Number(d.monto),
          metodo: d.tipoPago || 'Transferencia',
          referencia: d.referenciaPago || undefined,
          fecha: fechaRef,
          estadoBadge: 'PAGADO',
          badgeClass: 'badge-success'
        });
      } else {
        items.push({
          id: `DIV-PEN-${d.idDivision}`,
          tipo: 'PENDIENTE',
          titulo: `Cobro pendiente · ${nombreUsuario}`,
          subtitulo: nombreCuenta,
          usuario: nombreUsuario,
          iniciales: this.api.getIniciales(nombreUsuario),
          monto: Number(d.monto),
          fecha: fechaRef,
          estadoBadge: 'PENDIENTE',
          badgeClass: 'badge-warning'
        });
      }
    }

    // 2. Cuentas creadas recientemente
    for (const c of this.api.cuentas()) {
      const nombrePagador = this.api.getNombreUsuario(c.idUsuarioPagador);
      items.push({
        id: `CTA-${c.idCuenta}`,
        tipo: 'CUENTA',
        titulo: `Nueva cuenta: ${c.descripcion}`,
        subtitulo: `Pagada por ${nombrePagador}`,
        usuario: nombrePagador,
        iniciales: this.api.getIniciales(nombrePagador),
        monto: Number(c.montoTotal),
        fecha: c.fecha,
        estadoBadge: 'CUENTA',
        badgeClass: 'badge-info'
      });
    }

    return items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  });

  readonly actividadesFiltradas = computed(() => {
    const filtro = this.filtroActividad();
    if (filtro === 'TODOS') return this.actividadesRecientes();
    return this.actividadesRecientes().filter(a => a.tipo === filtro);
  });

  readonly estadisticasMetodosPago = computed(() => {
    const pagadas = this.api.divisiones().filter(d => d.estado === 'PAGADO');
    const totalMonto = pagadas.reduce((acc, d) => acc + Number(d.monto), 0) || 1;
    const grupos = new Map<string, { cantidad: number; monto: number }>();

    for (const d of pagadas) {
      const key = d.tipoPago || 'Efectivo / Otro';
      const actual = grupos.get(key) || { cantidad: 0, monto: 0 };
      actual.cantidad += 1;
      actual.monto += Number(d.monto);
      grupos.set(key, actual);
    }

    return Array.from(grupos.entries())
      .map(([metodo, val]) => ({
        metodo,
        cantidad: val.cantidad,
        monto: val.monto,
        porcentaje: Math.round((val.monto / totalMonto) * 100)
      }))
      .sort((a, b) => b.monto - a.monto);
  });
}
