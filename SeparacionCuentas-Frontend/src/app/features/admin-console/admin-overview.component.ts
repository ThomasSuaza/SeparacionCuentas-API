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
        <div class="eyebrow">ADMINISTRACIÓN</div>
        <h1 class="page-title">Panel de Control General</h1>
        <p class="intro">
          Resumen ejecutivo de usuarios, cuentas compartidas, pagos recaudados y saldos pendientes.
        </p>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="btn-outline" type="button" (click)="api.refreshAllData()">
          🔄 Actualizar datos
        </button>
        <a routerLink="/admin/sistema" class="btn-primary">
          Estado del servidor
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
          Total Recaudado
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>
        </div>
        <strong style="color: var(--success);">&#36;{{ api.totalPagadoDivisiones() | number:'1.0-0' }}</strong>
        <small>COP · {{ porcentajeRecaudo() }}% del total dividido</small>
      </div>

      <div class="stat-card">
        <div class="tiny">
          Pendiente por Cobrar
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
        </div>
        <strong style="color: var(--warning);">&#36;{{ api.totalPendienteDivisiones() | number:'1.0-0' }}</strong>
        <small>COP · Cuotas pendientes</small>
      </div>

      <div class="stat-card">
        <div class="tiny">
          Usuarios & Divisiones
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/></svg>
        </div>
        <strong>{{ api.usuarios().length }} / {{ api.divisiones().length }}</strong>
        <small>Usuarios registrados / Divisiones</small>
      </div>
    </div>

    <div class="content-grid">
      <!-- Estado de Distribución por Cuenta -->
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Estado de cuentas registradas</h2>
            <p class="sub">Seguimiento del balance y distribución de cada cuenta.</p>
          </div>
          <a routerLink="/admin/cuentas" class="pill">Ver todas →</a>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Cuenta</th>
                <th>Pagador</th>
                <th>Monto Total</th>
                <th>Total Dividido</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (item of auditoriaCuentas(); track item.cuenta.idCuenta) {
                <tr>
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

      <!-- Distribución por Método de Pago y Actividad Reciente -->
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Métodos de pago utilizados</h2>
            <p class="sub">Participación por medio de pago en cuotas completadas.</p>
          </div>
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
            <h2>Actividad reciente</h2>
            <p class="sub">Últimos movimientos registrados en la plataforma.</p>
          </div>
        </div>

        <div style="display: grid; gap: 8px; max-height: 220px; overflow-y: auto;">
          @for (log of api.auditLogs().slice(0, 6); track log.id) {
            <div style="padding: 9px 12px; border-radius: 10px; background: var(--surface-alt); border: 1px solid var(--border); font-size: 11.5px; display: flex; justify-content: space-between; gap: 8px;">
              <div>
                <span class="badge-status badge-info" style="margin-right: 6px;">{{ log.modulo }}</span>
                <span>{{ log.descripcion }}</span>
              </div>
            </div>
          } @empty {
            <div style="font-size: 12px; color: var(--muted);">
              No hay actividad reciente registrada en esta sesión.
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
