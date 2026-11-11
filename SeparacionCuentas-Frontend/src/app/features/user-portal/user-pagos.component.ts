import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeparacionCuentasService } from '../../core/services/separacion-cuentas.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Division, MetodoPago } from '../../core/models/api.models';

@Component({
  selector: 'app-user-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="heading-row">
      <div>
        <div class="eyebrow">MIS DIVISIONES Y COMPROBANTES (GET /api/Division/usuario/{{ auth.currentUser().idUsuario }})</div>
        <h1 class="page-title">Mis Pagos y Movimientos</h1>
        <p class="intro">
          Consulta todas tus cuotas asignadas como participante, registra el pago con método y referencia, o copia recordatorios de cobro.
        </p>
      </div>
    </div>

    <div class="stat-grid cols-3">
      <div class="stat-card">
        <div class="tiny">Cuotas Pendientes por Pagar</div>
        <strong style="color: var(--warning);">&#36;{{ totalPendiente() | number:'1.0-0' }} COP</strong>
        <small>{{ divisionesPendientes().length }} divisiones en estado PENDIENTE</small>
      </div>

      <div class="stat-card">
        <div class="tiny">Total Pagado por {{ auth.currentUser().nombre }}</div>
        <strong style="color: var(--success);">&#36;{{ totalPagado() | number:'1.0-0' }} COP</strong>
        <small>{{ divisionesPagadas().length }} divisiones en estado PAGADO</small>
      </div>

      <div class="stat-card">
        <div class="tiny">Total Participaciones</div>
        <strong>{{ misDivisiones().length }}</strong>
        <small>Registradas en <code>dbo.Division</code></small>
      </div>
    </div>

    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Detalle de mis divisiones por cuenta</h2>
          <p class="sub">Conectado a <code>GET /api/Division/usuario/{{ auth.currentUser().idUsuario }}</code> y <code>PUT /api/Division/{{ '{' }}id{{ '}' }}</code>.</p>
        </div>
        <span class="pill">{{ misDivisiones().length }} registros</span>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID División</th>
              <th>Cuenta Asociada</th>
              <th>Pagador de la Cuenta</th>
              <th>Monto Asignado</th>
              <th>Estado</th>
              <th>Método / Referencia</th>
              <th>Fecha de Pago</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            @for (d of misDivisiones(); track d.idDivision) {
              @let cuenta = obtenerCuenta(d.idCuenta);
              <tr>
                <td><b>#{{ d.idDivision }}</b></td>
                <td>
                  <strong>{{ cuenta?.descripcion || ('Cuenta #' + d.idCuenta) }}</strong>
                  <div style="font-size: 11px; color: var(--muted);">Total cuenta: &#36;{{ (cuenta?.montoTotal || 0) | number:'1.0-0' }} COP</div>
                </td>
                <td>
                  {{ cuenta ? api.getNombreUsuario(cuenta.idUsuarioPagador) : '—' }}
                </td>
                <td>
                  <strong style="font-size: 13.5px;">&#36;{{ d.monto | number:'1.0-0' }} COP</strong>
                </td>
                <td>
                  <span
                    class="badge-status"
                    [class.badge-success]="d.estado === 'PAGADO'"
                    [class.badge-warning]="d.estado === 'PENDIENTE'"
                  >
                    {{ d.estado }}
                  </span>
                </td>
                <td>
                  @if (d.tipoPago) {
                    <strong>{{ d.tipoPago }}</strong>
                    <div style="font-size: 11px; color: var(--muted);">{{ d.referenciaPago }}</div>
                  } @else {
                    <span style="color: var(--muted);">Sin registrar</span>
                  }
                </td>
                <td>
                  {{ d.fechaPago ? (d.fechaPago | date:'dd MMM yyyy, h:mm a') : '—' }}
                </td>
                <td>
                  @if (d.estado === 'PENDIENTE') {
                    <button class="btn-primary btn-sm" type="button" (click)="abrirPago(d)">
                      Registrar pago
                    </button>
                  } @else {
                    <button class="btn-outline btn-sm" type="button" (click)="copiarComprobante(d)">
                      Copiar recibo
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" style="text-align: center; padding: 26px; color: var(--muted);">
                  No tienes divisiones registradas actualmente para este usuario.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    @if (divisionActiva(); as div) {
      <div class="modal-backdrop" (click)="divisionActiva.set(null)">
        <div class="modal-card" style="max-width: 460px;" (click)="$event.stopPropagation()">
          <div class="panel-head">
            <div>
              <h2>Registrar Pago de División #{{ div.idDivision }}</h2>
              <p class="sub">Monto: <b>&#36;{{ div.monto | number:'1.0-0' }} COP</b></p>
            </div>
            <span class="pill">PUT /api/Division/{{ div.idDivision }}</span>
          </div>

          <form (ngSubmit)="guardarPago()" style="display: grid; gap: 14px;">
            <div class="form-group">
              <label>Método de pago (<code>tipo_pago</code>)</label>
              <select class="form-control" [(ngModel)]="metodoPago" name="metodo">
                <option value="Nequi">Nequi</option>
                <option value="Bancolombia">Bancolombia</option>
                <option value="DaviPlata">DaviPlata</option>
                <option value="PSE">PSE</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
              </select>
            </div>
            <div class="form-group">
              <label>Referencia del comprobante (<code>referencia_pago</code>)</label>
              <input class="form-control" type="text" [(ngModel)]="referenciaPago" name="ref" required />
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button class="btn-outline" type="button" (click)="divisionActiva.set(null)">Cancelar</button>
              <button class="btn-primary" type="submit">Marcar como PAGADO</button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class UserPagosComponent {
  readonly api = inject(SeparacionCuentasService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly divisionActiva = signal<Division | null>(null);
  metodoPago: MetodoPago = 'Nequi';
  referenciaPago = '';

  readonly misDivisiones = computed(() => {
    const uid = this.auth.currentUser().idUsuario;
    return this.api.divisiones().filter(d => d.idUsuario === uid);
  });

  readonly divisionesPendientes = computed(() =>
    this.misDivisiones().filter(d => d.estado === 'PENDIENTE')
  );

  readonly divisionesPagadas = computed(() =>
    this.misDivisiones().filter(d => d.estado === 'PAGADO')
  );

  readonly totalPendiente = computed(() =>
    this.divisionesPendientes().reduce((acc, d) => acc + Number(d.monto), 0)
  );

  readonly totalPagado = computed(() =>
    this.divisionesPagadas().reduce((acc, d) => acc + Number(d.monto), 0)
  );

  obtenerCuenta(idCuenta: number) {
    return this.api.cuentas().find(c => c.idCuenta === idCuenta);
  }

  abrirPago(d: Division): void {
    this.divisionActiva.set(d);
    this.metodoPago = 'Nequi';
    this.referenciaPago = `NEQ-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  guardarPago(): void {
    const d = this.divisionActiva();
    if (!d) return;
    this.api
      .updateDivision(d.idDivision, {
        ...d,
        estado: 'PAGADO',
        tipoPago: this.metodoPago,
        referenciaPago: this.referenciaPago.trim() || 'COMPROBANTE-OK',
        fechaPago: new Date().toISOString()
      })
      .subscribe(() => this.divisionActiva.set(null));
  }

  copiarComprobante(d: Division): void {
    const c = this.obtenerCuenta(d.idCuenta);
    const texto = `✅ Comprobante SplitBill AI (slit.ia)\nCuenta: ${c?.descripcion || d.idCuenta}\nParticipante: ${this.auth.currentUser().nombre}\nValor Pagado: $${d.monto.toLocaleString('es-CO')} COP\nMétodo: ${d.tipoPago || 'Digital'} (${d.referenciaPago || 'N/A'})`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto);
    }
    this.toast.show('Resumen de comprobante copiado al portapapeles.', 'success');
  }
}
