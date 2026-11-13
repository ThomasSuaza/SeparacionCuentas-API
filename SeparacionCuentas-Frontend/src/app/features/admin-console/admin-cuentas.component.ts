import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeparacionCuentasService } from '../../core/services/separacion-cuentas.service';
import { Cuenta, ResumenDevolucionCuentaResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-cuentas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="heading-row">
      <div>
        <div class="eyebrow">CUENTAS Y FACTURACIÓN · SPLITIA</div>
        <h1 class="page-title">Gestión de Cuentas Compartidas</h1>
        <p class="intro">
          Controla todas las cuentas registradas, su progreso de recaudo, pagadores y estado de distribución.
        </p>
      </div>
      <button class="btn-primary" type="button" (click)="abrirCrearCuenta()">
        + Nueva cuenta
      </button>
    </div>

    <!-- KPIs de Cuentas -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="tiny">Total Cuentas</div>
        <strong>{{ api.cuentas().length }}</strong>
        <small>Facturas activas en el sistema</small>
      </div>
      <div class="stat-card">
        <div class="tiny">Volumen Facturado</div>
        <strong>&#36;{{ api.volumenTotalCuentas() | number:'1.0-0' }}</strong>
        <small>COP acumulados en cuentas</small>
      </div>
      <div class="stat-card">
        <div class="tiny">Distribución Completa</div>
        <strong style="color: var(--success);">{{ cuentasCompletasCount() }}</strong>
        <small>Cuentas 100% cuadradas</small>
      </div>
      <div class="stat-card">
        <div class="tiny">Con Saldo por Distribuir</div>
        <strong style="color: var(--warning);">{{ api.cuentas().length - cuentasCompletasCount() }}</strong>
        <small>Pendientes de asignación</small>
      </div>
    </div>

    <!-- Barra de búsqueda y filtro de estado -->
    <div class="panel" style="margin-bottom: 20px; padding: 16px;">
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
        <input
          class="form-control"
          style="flex: 1; min-width: 220px;"
          type="text"
          [(ngModel)]="busqueda"
          placeholder="Buscar cuenta por descripción o nombre del organizador..."
        />

        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-size: 11.5px; font-weight: 750; color: var(--muted);">Estado:</span>
          <select class="form-control" style="width: auto;" [(ngModel)]="filtroEstado">
            <option value="TODAS">Todas las cuentas</option>
            <option value="COMPLETA">Distribución completa</option>
            <option value="PENDIENTE">Pendiente por distribuir</option>
            <option value="EXCEDIDA">Excedida</option>
          </select>
        </div>
      </div>
    </div>

    <section class="panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Cuenta / Fecha</th>
              <th>Organizador (Pagador)</th>
              <th>Monto Total</th>
              <th>Recaudado vs Dividido</th>
              <th>Estado Distribución</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (item of cuentasEnriquecidas(); track item.cuenta.idCuenta) {
              <tr>
                <td>
                  <strong>{{ item.cuenta.descripcion }}</strong>
                  <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">
                    Cuenta #{{ item.cuenta.idCuenta }} · {{ item.cuenta.fecha | date:'dd/MM/yyyy HH:mm' }}
                  </div>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="person-bubble" style="width: 28px; height: 28px; font-size: 10.5px;">
                      {{ api.getIniciales(item.nombrePagador) }}
                    </div>
                    <span>{{ item.nombrePagador }}</span>
                  </div>
                </td>
                <td>
                  <strong>&#36;{{ item.cuenta.montoTotal | number:'1.0-0' }} COP</strong>
                  <div style="font-size: 11px; color: var(--muted);">
                    {{ item.participantesCount }} participantes
                  </div>
                </td>
                <td style="min-width: 170px;">
                  <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 4px;">
                    <span style="color: var(--success);">Cobrado: &#36;{{ item.montoPagado | number:'1.0-0' }}</span>
                    <span style="color: var(--muted);">{{ item.porcentajeCobrado }}%</span>
                  </div>
                  <div class="progress-track" style="height: 7px;">
                    <i class="progress-fill" [style.width.%]="item.porcentajeCobrado"></i>
                  </div>
                </td>
                <td>
                  <span
                    class="badge-status"
                    [class.badge-success]="item.dev.estadoDistribucion === 'COMPLETA'"
                    [class.badge-warning]="item.dev.estadoDistribucion === 'PENDIENTE'"
                    [class.badge-danger]="item.dev.estadoDistribucion === 'EXCEDIDA'"
                  >
                    {{ item.dev.estadoDistribucion }}
                  </span>
                </td>
                <td>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <button class="btn-outline btn-sm" type="button" (click)="inspeccionarDevolucion(item.cuenta.idCuenta)">
                      Ver saldos
                    </button>
                    <button class="btn-outline btn-sm" type="button" (click)="abrirEditarCuenta(item.cuenta)">
                      Editar
                    </button>
                    <button class="btn-danger btn-sm" type="button" (click)="api.deleteCuenta(item.cuenta.idCuenta).subscribe()">
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

    <!-- Modal Crear / Editar Cuenta -->
    @if (mostrarModal()) {
      <div class="modal-backdrop" (click)="mostrarModal.set(false)">
        <div class="modal-card" style="max-width: 480px;" (click)="$event.stopPropagation()">
          <div class="panel-head">
            <div>
              <h2>{{ editandoId() ? 'Editar cuenta' : 'Registrar nueva cuenta' }}</h2>
              <p class="sub">Completa la información de la cuenta compartida.</p>
            </div>
          </div>

          <form (ngSubmit)="guardarCuenta()" style="display: grid; gap: 14px;">
            <div class="form-group">
              <label>Descripción de la cuenta</label>
              <input class="form-control" type="text" [(ngModel)]="formDescripcion" name="descripcion" placeholder="Ej. Cena de equipo en El Poblado" required />
            </div>

            <div class="form-group">
              <label>Pagado inicialmente por (Organizador)</label>
              <select class="form-control" [(ngModel)]="formIdUsuarioPagador" name="idUsuarioPagador">
                @for (u of api.usuarios(); track u.idUsuario) {
                  <option [ngValue]="u.idUsuario">{{ u.nombre }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Monto Total (COP)</label>
              <input class="form-control" type="number" [(ngModel)]="formMontoTotal" name="montoTotal" min="1" required />
            </div>

            <div class="form-group">
              <label>Fecha y hora</label>
              <input class="form-control" type="datetime-local" [(ngModel)]="formFecha" name="fecha" required />
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
              <button class="btn-outline" type="button" (click)="mostrarModal.set(false)">Cancelar</button>
              <button class="btn-primary" type="submit">Guardar cuenta</button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal Resumen de Saldos de la Cuenta -->
    @if (jsonInspeccionado(); as dto) {
      <div class="modal-backdrop" (click)="jsonInspeccionado.set(null)">
        <div class="modal-card" style="max-width: 640px;" (click)="$event.stopPropagation()">
          <div class="panel-head">
            <div>
              <h2>Liquidación y saldos de la cuenta #{{ dto.idCuenta }}</h2>
              <p class="sub">Estado: <b>{{ dto.estadoDistribucion }}</b> · Total facturado: &#36;{{ dto.montoTotalCuenta | number:'1.0-0' }} COP</p>
            </div>
            <button class="btn-outline btn-sm" type="button" (click)="jsonInspeccionado.set(null)">Cerrar</button>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Participante</th>
                  <th>Cuota Asignada</th>
                  <th>Adelantado</th>
                  <th>Saldo Neto</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (s of dto.saldos; track s.idUsuario) {
                  <tr>
                    <td>
                      <strong>{{ s.nombre }}</strong>
                      @if (s.esPagador) {
                        <span class="pill" style="margin-left: 6px; padding: 2px 7px; font-size: 9.5px;">Organizador</span>
                      }
                    </td>
                    <td>&#36;{{ s.montoAsignado | number:'1.0-0' }}</td>
                    <td>&#36;{{ s.montoAdelantado | number:'1.0-0' }}</td>
                    <td><strong>&#36;{{ s.saldo | number:'1.0-0' }}</strong></td>
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
        </div>
      </div>
    }
  `
})
export class AdminCuentasComponent {
  readonly api = inject(SeparacionCuentasService);

  busqueda = '';
  filtroEstado = 'TODAS';

  readonly mostrarModal = signal<boolean>(false);
  readonly editandoId = signal<number | null>(null);
  readonly jsonInspeccionado = signal<ResumenDevolucionCuentaResponse | null>(null);

  formDescripcion = '';
  formIdUsuarioPagador = 1;
  formMontoTotal = 150000;
  formFecha = '2026-11-10T19:00';

  readonly cuentasCompletasCount = computed(
    () =>
      this.api
        .cuentas()
        .filter(c => this.api.calcularDevolucionesLocal(c.idCuenta).estadoDistribucion === 'COMPLETA').length
  );

  readonly cuentasEnriquecidas = computed(() => {
    const q = this.busqueda.trim().toLowerCase();
    return [...this.api.cuentas()]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .map(cuenta => {
        const dev = this.api.calcularDevolucionesLocal(cuenta.idCuenta);
        const divs = this.api.divisiones().filter(d => d.idCuenta === cuenta.idCuenta);
        const montoPagado = divs
          .filter(d => d.estado === 'PAGADO')
          .reduce((acc, d) => acc + Number(d.monto), 0);
        const totalRef = Number(cuenta.montoTotal) || 1;
        const porcentajeCobrado = Math.min(100, Math.round((montoPagado / totalRef) * 100));
        const nombrePagador = this.api.getNombreUsuario(cuenta.idUsuarioPagador);

        return {
          cuenta,
          dev,
          nombrePagador,
          participantesCount: Math.max(divs.length, dev.saldos.length),
          montoPagado,
          porcentajeCobrado
        };
      })
      .filter(item => {
        if (this.filtroEstado !== 'TODAS' && item.dev.estadoDistribucion !== this.filtroEstado) {
          return false;
        }
        if (!q) return true;
        return (
          item.cuenta.descripcion.toLowerCase().includes(q) ||
          item.nombrePagador.toLowerCase().includes(q)
        );
      });
  });

  abrirCrearCuenta(): void {
    this.editandoId.set(null);
    this.formDescripcion = '';
    this.formIdUsuarioPagador = this.api.usuarios()[0]?.idUsuario || 1;
    this.formMontoTotal = 200000;
    this.formFecha = new Date().toISOString().slice(0, 16);
    this.mostrarModal.set(true);
  }

  abrirEditarCuenta(c: Cuenta): void {
    this.editandoId.set(c.idCuenta);
    this.formDescripcion = c.descripcion;
    this.formIdUsuarioPagador = c.idUsuarioPagador;
    this.formMontoTotal = c.montoTotal;
    this.formFecha = c.fecha.slice(0, 16);
    this.mostrarModal.set(true);
  }

  guardarCuenta(): void {
    if (!this.formDescripcion.trim() || this.formMontoTotal <= 0) return;
    const id = this.editandoId();
    if (id) {
      this.api
        .updateCuenta(id, {
          idCuenta: id,
          idUsuarioPagador: Number(this.formIdUsuarioPagador),
          descripcion: this.formDescripcion.trim(),
          montoTotal: Number(this.formMontoTotal),
          fecha: new Date(this.formFecha).toISOString()
        })
        .subscribe(() => this.mostrarModal.set(false));
    } else {
      this.api
        .createCuenta({
          idUsuarioPagador: Number(this.formIdUsuarioPagador),
          descripcion: this.formDescripcion.trim(),
          montoTotal: Number(this.formMontoTotal),
          fecha: new Date(this.formFecha).toISOString()
        })
        .subscribe(() => this.mostrarModal.set(false));
    }
  }

  inspeccionarDevolucion(idCuenta: number): void {
    this.api.getDevolucionesCuenta(idCuenta).subscribe(res => {
      this.jsonInspeccionado.set(res);
    });
  }
}
