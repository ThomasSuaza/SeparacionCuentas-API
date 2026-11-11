import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeparacionCuentasService } from '../../core/services/separacion-cuentas.service';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="heading-row">
      <div>
        <div class="eyebrow">CONSOLA DE ADMINISTRADOR · SPLITBILL AI (.NET 10 + SQL SERVER)</div>
        <h1 class="page-title">Centro de Control y Auditoría Financiera</h1>
        <p class="intro">
          Supervisión integral de todos los usuarios, cuentas, divisiones, estados de distribución y diagnóstico en vivo de la base de datos <code>SeparacionCuentas</code>.
        </p>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="btn-outline" type="button" (click)="api.refreshAllData()">
          🔄 Sincronizar con API .NET
        </button>
        <a routerLink="/admin/sistema" class="btn-primary">
          Diagnóstico /dbtest
        </a>
      </div>
    </div>

    <!-- KPIs Globales de la Plataforma -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="tiny">
          Volumen Total en Cuentas
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <strong>&#36;{{ api.volumenTotalCuentas() | number:'1.0-0' }}</strong>
        <small>COP · En {{ api.cuentas().length }} cuentas registradas</small>
      </div>

      <div class="stat-card">
        <div class="tiny">
          Recaudado en Divisiones (PAGADO)
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>
        </div>
        <strong style="color: var(--success);">&#36;{{ api.totalPagadoDivisiones() | number:'1.0-0' }}</strong>
        <small>COP · {{ porcentajeRecaudo() }}% del total dividido</small>
      </div>

      <div class="stat-card">
        <div class="tiny">
          Cartera en Tránsito (PENDIENTE)
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
        </div>
        <strong style="color: var(--warning);">&#36;{{ api.totalPendienteDivisiones() | number:'1.0-0' }}</strong>
        <small>COP · Cuotas pendientes de pago</small>
      </div>

      <div class="stat-card">
        <div class="tiny">
          Base de Usuarios & Divisiones
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/></svg>
        </div>
        <strong>{{ api.usuarios().length }} / {{ api.divisiones().length }}</strong>
        <small>Usuarios activos / Divisiones totales</small>
      </div>
    </div>

    <div class="content-grid">
      <!-- Auditoría de Estado de Distribución por Cuenta -->
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Auditoría de Distribución de Cuentas (<code>GET /api/Cuenta/{{ '{' }}id{{ '}' }}/devoluciones</code>)</h2>
            <p class="sub">Detecta cuentas con distribución <code>COMPLETA</code>, <code>PENDIENTE</code> o <code>EXCEDIDA</code>.</p>
          </div>
          <a routerLink="/admin/cuentas" class="pill">Gestionar Cuentas →</a>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Descripción</th>
                <th>Pagador</th>
                <th>Monto Total</th>
                <th>Total Dividido</th>
                <th>Estado Distribución</th>
              </tr>
            </thead>
            <tbody>
              @for (item of auditoriaCuentas(); track item.cuenta.idCuenta) {
                <tr>
                  <td><b>#00{{ item.cuenta.idCuenta }}</b></td>
                  <td><strong>{{ item.cuenta.descripcion }}</strong></td>
                  <td>{{ api.getNombreUsuario(item.cuenta.idUsuarioPagador) }}</td>
                  <td>&#36;{{ item.cuenta.montoTotal | number:'1.0-0' }}</td>
                  <td>&#36;{{ item.devolucion.totalDivisiones | number:'1.0-0' }}</td>
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

      <!-- Distribución por Método de Pago y Bitácora de Operaciones -->
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Uso de Métodos de Pago (<code>tipo_pago</code>)</h2>
            <p class="sub">Participación por canal en divisiones pagadas.</p>
          </div>
          <span class="pill">Analítica</span>
        </div>

        <div style="display: grid; gap: 12px; margin-bottom: 22px;">
          @for (m of estadisticasMetodosPago(); track m.metodo) {
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 5px;">
                <span>{{ m.metodo }} ({{ m.cantidad }} pagos)</span>
                <span>&#36;{{ m.monto | number:'1.0-0' }} COP ({{ m.porcentaje }}%)</span>
              </div>
              <div class="progress-track">
                <i class="progress-fill" [style.width.%]="m.porcentaje"></i>
              </div>
            </div>
          }
        </div>

        <div class="panel-head" style="margin-top: 18px;">
          <div>
            <h2>Bitácora reciente de transacciones API</h2>
            <p class="sub">Últimas llamadas registradas por la consola.</p>
          </div>
        </div>

        <div style="display: grid; gap: 8px; max-height: 220px; overflow-y: auto;">
          @for (log of api.auditLogs().slice(0, 6); track log.id) {
            <div style="padding: 9px 12px; border-radius: 10px; background: var(--surface-alt); border: 1px solid var(--border); font-size: 11.5px; display: flex; justify-content: space-between; gap: 8px;">
              <div>
                <span class="badge-status badge-info" style="margin-right: 6px;">{{ log.metodo }}</span>
                <b>{{ log.endpoint }}</b> · {{ log.descripcion }}
              </div>
              <small style="color: var(--muted); white-space: nowrap;">{{ log.origen }}</small>
            </div>
          } @empty {
            <div style="font-size: 12px; color: var(--muted);">
              Realiza cualquier acción (crear, editar, pagar o diagnosticar) para ver el registro en vivo.
            </div>
          }
        </div>
      </section>
    </div>
  `
})
export class AdminOverviewComponent {
  readonly api = inject(SeparacionCuentasService);

  readonly porcentajeRecaudo = computed(() => {
    const pagado = this.api.totalPagadoDivisiones();
    const total = pagado + this.api.totalPendienteDivisiones();
    if (total === 0) return 0;
    return Math.round((pagado / total) * 100);
  });

  readonly auditoriaCuentas = computed(() =>
    this.api.cuentas().map(cuenta => ({
      cuenta,
      devolucion: this.api.calcularDevolucionesLocal(cuenta.idCuenta)
    }))
  );

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

    return Array.from(grupos.entries()).map(([metodo, val]) => ({
      metodo,
      cantidad: val.cantidad,
      monto: val.monto,
      porcentaje: Math.round((val.monto / totalMonto) * 100)
    }));
  });
}
