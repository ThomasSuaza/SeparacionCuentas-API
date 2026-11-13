import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeparacionCuentasService } from '../../core/services/separacion-cuentas.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-user-saldos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="heading-row">
      <div>
        <div class="eyebrow">SALDOS Y DEVOLUCIONES</div>
        <h1 class="page-title">Balance por Cuenta</h1>
        <p class="intro">
          Consulta cuánto adelantó el pagador, cuánto ha abonado cada participante y el estado de la distribución.
        </p>
      </div>
      <button class="btn-outline" type="button" (click)="copiarResumenCobro()">
        📲 Copiar resumen para WhatsApp
      </button>
    </div>

    <!-- Selector de mis cuentas (Aislamiento estricto por usuario) -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;">
      @for (c of auth.misCuentasUsuario(); track c.idCuenta) {
        <button
          type="button"
          class="btn-outline btn-sm"
          [style.border-color]="cuentaActivaId() === c.idCuenta ? 'var(--accent)' : 'var(--border)'"
          [style.background]="cuentaActivaId() === c.idCuenta ? 'var(--accent-soft)' : 'var(--surface)'"
          (click)="cuentaId.set(c.idCuenta)"
        >
          {{ c.descripcion }}
        </button>
      }
    </div>

    @if (auth.misCuentasUsuario().length > 0 && resumen(); as res) {
      <div class="stat-grid">
        <div class="stat-card">
          <div class="tiny">Monto Total Cuenta</div>
          <strong>&#36;{{ res.montoTotalCuenta | number:'1.0-0' }}</strong>
          <small>COP · Valor total</small>
        </div>

        <div class="stat-card">
          <div class="tiny">Total Distribuido</div>
          <strong>&#36;{{ res.totalDivisiones | number:'1.0-0' }}</strong>
          <small>COP · Suma de cuotas</small>
        </div>

        <div class="stat-card">
          <div class="tiny">Diferencia</div>
          <strong>&#36;{{ res.diferencia | number:'1.0-0' }}</strong>
          <small>COP · Por cuadrar</small>
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
          <small>Estado actual de la cuenta</small>
        </div>
      </div>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Saldos por participante</h2>
            <p class="sub">
              Detalle de quién recibe dinero, quién tiene pago pendiente y quién ya está al día.
            </p>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Participante</th>
                <th>Rol</th>
                <th>Cuota asignada</th>
                <th>Monto adelantado</th>
                <th>Saldo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (s of res.saldos; track s.idUsuario) {
                <tr>
                  <td><strong>{{ s.nombre }}</strong></td>
                  <td>
                    @if (s.esPagador) {
                      <span class="badge-status badge-info">Pagador</span>
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
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly cuentaId = signal<number>(0);

  readonly cuentaActivaId = computed(() => {
    const manual = this.cuentaId();
    const list = this.auth.misCuentasUsuario();
    if (manual && list.some(c => c.idCuenta === manual)) return manual;
    return list[0]?.idCuenta || 0;
  });

  readonly resumen = computed(() => this.api.calcularDevolucionesLocal(this.cuentaActivaId()));

  copiarResumenCobro(): void {
    const res = this.resumen();
    const cuenta = this.api.cuentas().find(c => c.idCuenta === res.idCuenta);
    const lineas = res.saldos.map(
      s => `• ${s.nombre}: ${s.tipoMovimiento} $${s.saldo.toLocaleString('es-CO')} COP (Cuota: $${s.montoAsignado.toLocaleString('es-CO')})`
    );
    const msg =
      `📊 *Resumen SplitIA*\n` +
      `Cuenta: *${cuenta?.descripcion || '#' + res.idCuenta}*\n` +
      `Total: $${res.montoTotalCuenta.toLocaleString('es-CO')} COP (${res.estadoDistribucion})\n\n` +
      lineas.join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg);
    }
    this.toast.show('Resumen copiado para compartir.', 'success');
  }
}
