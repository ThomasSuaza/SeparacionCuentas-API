import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeparacionCuentasService } from '../../core/services/separacion-cuentas.service';
import { Division, EstadoDivision } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-divisiones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="heading-row">
      <div>
        <div class="eyebrow">TRANSACCIONES Y RECAUDO · SPLIY.IA</div>
        <h1 class="page-title">Centro de Transacciones y Pagos</h1>
        <p class="intro">
          Monitorea todas las transacciones procesadas, comprobantes de transferencia y cobros pendientes por participante.
        </p>
      </div>
      <button class="btn-primary" type="button" (click)="abrirCrearDivision()">
        + Registrar transacción / cuota
      </button>
    </div>

    <!-- KPIs de Transacciones -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="tiny">Total Movimientos</div>
        <strong>{{ api.divisiones().length }}</strong>
        <small>Cuotas y transacciones registradas</small>
      </div>
      <div class="stat-card">
        <div class="tiny">Pagos Confirmados</div>
        <strong style="color: var(--success);">&#36;{{ api.totalPagadoDivisiones() | number:'1.0-0' }}</strong>
        <small>{{ pagadasCount() }} transacciones liquidadas</small>
      </div>
      <div class="stat-card">
        <div class="tiny">Cobros Pendientes</div>
        <strong style="color: var(--warning);">&#36;{{ api.totalPendienteDivisiones() | number:'1.0-0' }}</strong>
        <small>{{ api.divisiones().length - pagadasCount() }} cuotas por cobrar</small>
      </div>
      <div class="stat-card">
        <div class="tiny">Efectividad de Recaudo</div>
        <strong>{{ tasaEfectividad() }}%</strong>
        <small>Porcentaje de cartera recuperada</small>
      </div>
    </div>

    <!-- Barra de filtros administrativos -->
    <div class="panel" style="margin-bottom: 20px; padding: 16px;">
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        <input
          class="form-control"
          style="flex: 1.3; min-width: 200px;"
          type="text"
          [(ngModel)]="busqueda"
          placeholder="Buscar por referencia (NEQ, QR), participante o cuenta..."
        />

        <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 170px;">
          <label style="font-size: 11.5px; font-weight: 750; color: var(--muted);">Cuenta:</label>
          <select class="form-control" [(ngModel)]="filtroCuenta">
            <option [ngValue]="0">Todas las cuentas</option>
            @for (c of api.cuentas(); track c.idCuenta) {
              <option [ngValue]="c.idCuenta">{{ c.descripcion }}</option>
            }
          </select>
        </div>

        <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 170px;">
          <label style="font-size: 11.5px; font-weight: 750; color: var(--muted);">Usuario:</label>
          <select class="form-control" [(ngModel)]="filtroUsuario">
            <option [ngValue]="0">Todos los usuarios</option>
            @for (u of api.usuarios(); track u.idUsuario) {
              <option [ngValue]="u.idUsuario">{{ u.nombre }}</option>
            }
          </select>
        </div>

        <div style="display: flex; align-items: center; gap: 6px; min-width: 150px;">
          <label style="font-size: 11.5px; font-weight: 750; color: var(--muted);">Estado:</label>
          <select class="form-control" [(ngModel)]="filtroEstado">
            <option value="TODOS">Todos</option>
            <option value="PAGADO">Pagados</option>
            <option value="PENDIENTE">Pendientes</option>
          </select>
        </div>
      </div>
    </div>

    <section class="panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Participante</th>
              <th>Cuenta Asociada</th>
              <th>Monto (COP)</th>
              <th>Estado</th>
              <th>Método / Comprobante</th>
              <th>Fecha Transacción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (d of divisionesFiltradas(); track d.idDivision) {
              @let nombreUser = api.getNombreUsuario(d.idUsuario);
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: 9px;">
                    <div class="person-bubble" style="width: 30px; height: 30px; font-size: 11px;">
                      {{ api.getIniciales(nombreUser) }}
                    </div>
                    <div>
                      <strong style="display: block;">{{ nombreUser }}</strong>
                      <small style="font-size: 10.5px; color: var(--muted);">TX #{{ d.idDivision }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <strong>{{ obtenerNombreCuenta(d.idCuenta) }}</strong>
                  <div style="font-size: 10.5px; color: var(--muted);">Cuenta #{{ d.idCuenta }}</div>
                </td>
                <td><strong>&#36;{{ d.monto | number:'1.0-0' }} COP</strong></td>
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
                  @if (d.estado === 'PAGADO') {
                    <strong>{{ d.tipoPago || 'Transferencia' }}</strong>
                    <div style="font-size: 11px; color: var(--muted);">Ref: {{ d.referenciaPago || 'Confirmado' }}</div>
                  } @else {
                    <span style="color: var(--muted); font-size: 12px;">Pendiente de pago</span>
                  }
                </td>
                <td>{{ d.fechaPago ? (d.fechaPago | date:'dd/MM/yyyy HH:mm') : 'En espera' }}</td>
                <td>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <button class="btn-outline btn-sm" type="button" (click)="alternarEstadoRapido(d)">
                      {{ d.estado === 'PENDIENTE' ? '✓ Confirmar pago' : '↺ Revertir' }}
                    </button>
                    <button class="btn-outline btn-sm" type="button" (click)="abrirEditarDivision(d)">
                      Editar
                    </button>
                    <button class="btn-danger btn-sm" type="button" (click)="api.deleteDivision(d.idDivision).subscribe()">
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    @if (mostrarModal()) {
      <div class="modal-backdrop" (click)="mostrarModal.set(false)">
        <div class="modal-card" style="max-width: 500px;" (click)="$event.stopPropagation()">
          <div class="panel-head">
            <div>
              <h2>{{ editandoId() ? 'Editar transacción' : 'Registrar transacción o cuota' }}</h2>
              <p class="sub">Asigna o actualiza el pago de un participante en una cuenta.</p>
            </div>
          </div>

          <form (ngSubmit)="guardarDivision()" style="display: grid; gap: 13px;">
            <div class="form-grid">
              <div class="form-group">
                <label>Cuenta</label>
                <select class="form-control" [(ngModel)]="formIdCuenta" name="idCuenta">
                  @for (c of api.cuentas(); track c.idCuenta) {
                    <option [ngValue]="c.idCuenta">{{ c.descripcion }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Participante</label>
                <select class="form-control" [(ngModel)]="formIdUsuario" name="idUsuario">
                  @for (u of api.usuarios(); track u.idUsuario) {
                    <option [ngValue]="u.idUsuario">{{ u.nombre }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Monto (COP)</label>
                <input class="form-control" type="number" [(ngModel)]="formMonto" name="monto" min="1" required />
              </div>

              <div class="form-group">
                <label>Estado</label>
                <select class="form-control" [(ngModel)]="formEstado" name="estado">
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="PAGADO">PAGADO</option>
                </select>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Método de pago</label>
                <input class="form-control" type="text" [(ngModel)]="formTipoPago" name="tipoPago" placeholder="Nequi / Bancolombia / Efectivo" />
              </div>

              <div class="form-group">
                <label>Referencia / Comprobante</label>
                <input class="form-control" type="text" [(ngModel)]="formReferenciaPago" name="referenciaPago" placeholder="NEQ-123456" />
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
              <button class="btn-outline" type="button" (click)="mostrarModal.set(false)">Cancelar</button>
              <button class="btn-primary" type="submit">Guardar transacción</button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class AdminDivisionesComponent {
  readonly api = inject(SeparacionCuentasService);

  busqueda = '';
  filtroCuenta = 0;
  filtroUsuario = 0;
  filtroEstado = 'TODOS';

  readonly mostrarModal = signal<boolean>(false);
  readonly editandoId = signal<number | null>(null);

  formIdCuenta = 1;
  formIdUsuario = 1;
  formMonto = 60000;
  formEstado: EstadoDivision = 'PENDIENTE';
  formTipoPago = '';
  formReferenciaPago = '';

  readonly pagadasCount = computed(
    () => this.api.divisiones().filter(d => d.estado === 'PAGADO').length
  );

  readonly tasaEfectividad = computed(() => {
    const total = this.api.divisiones().length;
    if (total === 0) return 0;
    return Math.round((this.pagadasCount() / total) * 100);
  });

  readonly divisionesFiltradas = computed(() => {
    const q = this.busqueda.trim().toLowerCase();
    return [...this.api.divisiones()]
      .sort((a, b) => b.idDivision - a.idDivision)
      .filter(d => {
        if (Number(this.filtroCuenta) > 0 && d.idCuenta !== Number(this.filtroCuenta)) return false;
        if (Number(this.filtroUsuario) > 0 && d.idUsuario !== Number(this.filtroUsuario)) return false;
        if (this.filtroEstado !== 'TODOS' && d.estado !== this.filtroEstado) return false;
        if (!q) return true;

        const nombreUser = this.api.getNombreUsuario(d.idUsuario).toLowerCase();
        const nombreCuenta = this.obtenerNombreCuenta(d.idCuenta).toLowerCase();
        const ref = (d.referenciaPago || '').toLowerCase();
        const metodo = (d.tipoPago || '').toLowerCase();
        return (
          nombreUser.includes(q) ||
          nombreCuenta.includes(q) ||
          ref.includes(q) ||
          metodo.includes(q)
        );
      });
  });

  obtenerNombreCuenta(idCuenta: number): string {
    return this.api.cuentas().find(c => c.idCuenta === idCuenta)?.descripcion || `Cuenta #${idCuenta}`;
  }

  alternarEstadoRapido(d: Division): void {
    const nuevoEstado: EstadoDivision = d.estado === 'PENDIENTE' ? 'PAGADO' : 'PENDIENTE';
    this.api
      .updateDivision(d.idDivision, {
        ...d,
        estado: nuevoEstado,
        tipoPago: nuevoEstado === 'PAGADO' ? d.tipoPago || 'Nequi' : null,
        referenciaPago: nuevoEstado === 'PAGADO' ? d.referenciaPago || `NEQ-${Date.now().toString().slice(-6)}` : null,
        fechaPago: nuevoEstado === 'PAGADO' ? new Date().toISOString() : null
      })
      .subscribe();
  }

  abrirCrearDivision(): void {
    this.editandoId.set(null);
    this.formIdCuenta = this.api.cuentas()[0]?.idCuenta || 1;
    this.formIdUsuario = this.api.usuarios()[0]?.idUsuario || 1;
    this.formMonto = 60000;
    this.formEstado = 'PENDIENTE';
    this.formTipoPago = '';
    this.formReferenciaPago = '';
    this.mostrarModal.set(true);
  }

  abrirEditarDivision(d: Division): void {
    this.editandoId.set(d.idDivision);
    this.formIdCuenta = d.idCuenta;
    this.formIdUsuario = d.idUsuario;
    this.formMonto = d.monto;
    this.formEstado = d.estado;
    this.formTipoPago = d.tipoPago || '';
    this.formReferenciaPago = d.referenciaPago || '';
    this.mostrarModal.set(true);
  }

  guardarDivision(): void {
    const id = this.editandoId();
    const isPaid = this.formEstado === 'PAGADO';
    const payload = {
      idCuenta: Number(this.formIdCuenta),
      idUsuario: Number(this.formIdUsuario),
      monto: Number(this.formMonto),
      estado: this.formEstado,
      tipoPago: isPaid ? this.formTipoPago.trim() || 'Transferencia' : null,
      referenciaPago: isPaid ? this.formReferenciaPago.trim() || 'REF-CONFIRMADA' : null,
      fechaPago: isPaid ? new Date().toISOString() : null
    };

    if (id) {
      this.api
        .updateDivision(id, { idDivision: id, ...payload })
        .subscribe(() => this.mostrarModal.set(false));
    } else {
      this.api
        .createDivision(payload)
        .subscribe(() => this.mostrarModal.set(false));
    }
  }
}
