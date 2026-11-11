import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeparacionCuentasService } from '../../core/services/separacion-cuentas.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-user-saldos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="heading-row">
      <div>
        <div class="eyebrow">MOTOR DE DEVOLUCIONES Y CUADRE (RF10 · RF11 · RF12)</div>
        <h1 class="page-title">Saldos, Devoluciones y Estado de Distribución</h1>
        <p class="intro">
          Visualización directa del DTO <code>ResumenDevolucionCuentaResponse</code> generado por
          <code>GET /api/Cuenta/{{ '{' }}idCuenta{{ '}' }}/devoluciones</code>.
        </p>
      </div>
      <button class="btn-outline" type="button" (click)="copiarResumenCobro()">
        📲 Copiar Resumen para WhatsApp
      </button>
    </div>

    <!-- Selector de cuenta a auditar -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;">
      @for (c of api.cuentas(); track c.idCuenta) {
        <button
          type="button"
          class="btn-outline btn-sm"
          [style.border-color]="cuentaId() === c.idCuenta ? 'var(--accent)' : 'var(--border)'"
          [style.background]="cuentaId() === c.idCuenta ? 'var(--accent-soft)' : 'var(--surface)'"
          (click)="cuentaId.set(c.idCuenta)"
        >
          Cuenta #00{{ c.idCuenta }} · {{ c.descripcion }}
        </button>
      }
    </div>

    @if (resumen(); as res) {
      <div class="stat-grid">
        <div class="stat-card">
          <div class="tiny">Monto Total Cuenta</div>
          <strong>&#36;{{ res.montoTotalCuenta | number:'1.0-0' }}</strong>
          <small>COP · Factura original</small>
        </div>

        <div class="stat-card">
          <div class="tiny">Suma Total Divisiones</div>
          <strong>&#36;{{ res.totalDivisiones | number:'1.0-0' }}</strong>
          <small>COP · Asignado en <code>dbo.Division</code></small>
        </div>

        <div class="stat-card">
          <div class="tiny">Diferencia de Cuadre</div>
          <strong>&#36;{{ res.diferencia | number:'1.0-0' }}</strong>
          <small><code>Math.Abs(MontoTotal - TotalDivisiones)</code></small>
        </div>

        <div class="stat-card">
          <div class="tiny">Estado de Distribución</div>
          <strong
            [style.color]="
              res.estadoDistribucion === 'COMPLETA'
                ? 'var(--success)'
                : res.estadoDistribucion === 'PENDIENTE'
                ? 'var(--warning)'
                : 'var(--danger)'
            "
          >
            {{ res.estadoDistribucion }}
          </strong>
          <small>Validación automática del controlador .NET</small>
        </div>
      </div>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Tabla de Saldos y Devoluciones por Participante (<code>SaldoUsuarioResponse</code>)</h2>
            <p class="sub">
              El usuario pagador refleja cuánto adelantó y cuánto le falta por recibir (<code>RECIBE</code> / <code>SALDADO</code>).
              Los demás participantes muestran cuánto les falta pagar (<code>PAGA</code> / <code>SALDADO</code>).
            </p>
          </div>
          <span class="pill">GET /api/Cuenta/{{ res.idCuenta }}/devoluciones</span>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID Usuario</th>
                <th>Participante</th>
                <th>Rol en Cuenta</th>
                <th>Monto Asignado (Su cuota)</th>
                <th>Monto Adelantado</th>
                <th>Saldo Pendiente</th>
                <th>Tipo Movimiento</th>
              </tr>
            </thead>
            <tbody>
              @for (s of res.saldos; track s.idUsuario) {
                <tr>
                  <td><b>#{{ s.idUsuario }}</b></td>
                  <td><strong>{{ s.nombre }}</strong></td>
                  <td>
                    @if (s.esPagador) {
                      <span class="badge-status badge-info">Pagador Inicial</span>
                    } @else {
                      <span style="color: var(--muted); font-size: 11.5px;">Participante</span>
                    }
                  </td>
                  <td>&#36;{{ s.montoAsignado | number:'1.0-0' }} COP</td>
                  <td>
                    @if (s.montoAdelantado > 0) {
                      <strong>&#36;{{ s.montoAdelantado | number:'1.0-0' }} COP</strong>
                    } @else {
                      <span style="color: var(--muted);">$0</span>
                    }
                  </td>
                  <td>
                    <strong style="font-size: 13.5px;">&#36;{{ s.saldo | number:'1.0-0' }} COP</strong>
                  </td>
                  <td>
                    <span
                      class="badge-status"
                      [class.badge-info]="s.tipoMovimiento === 'RECIBE'"
                      [class.badge-warning]="s.tipoMovimiento === 'PAGA'"
                      [class.badge-success]="s.tipoMovimiento === 'SALDADO'"
                    >
                      {{ s.tipoMovimiento }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }
  `
})
export class UserSaldosComponent {
  readonly api = inject(SeparacionCuentasService);
  private readonly toast = inject(ToastService);

  readonly cuentaId = signal<number>(1);

  readonly resumen = computed(() => this.api.calcularDevolucionesLocal(this.cuentaId()));

  copiarResumenCobro(): void {
    const res = this.resumen();
    const cuenta = this.api.cuentas().find(c => c.idCuenta === res.idCuenta);
    const lineas = res.saldos.map(
      s => `• ${s.nombre}: ${s.tipoMovimiento} $${s.saldo.toLocaleString('es-CO')} COP (Cuota: $${s.montoAsignado.toLocaleString('es-CO')})`
    );
    const msg =
      `📊 *Resumen SplitBill AI (slit.ia)*\n` +
      `Cuenta: *${cuenta?.descripcion || '#' + res.idCuenta}*\n` +
      `Total: $${res.montoTotalCuenta.toLocaleString('es-CO')} COP (${res.estadoDistribucion})\n\n` +
      lineas.join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg);
    }
    this.toast.show('Resumen de saldos copiado para enviar por WhatsApp.', 'success');
  }
}
