import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeparacionCuentasService } from '../../core/services/separacion-cuentas.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Cuenta } from '../../core/models/api.models';

interface ParticipanteDraft {
  idUsuario: number;
  nombre: string;
  seleccionado: boolean;
  porcentaje: number;
  monto: number;
  esPagador: boolean;
}

@Component({
  selector: 'app-user-cuentas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="heading-row">
      <div>
        <div class="eyebrow">MIS CUENTAS</div>
        <h1 class="page-title">Cuentas y División de Gastos</h1>
        <p class="intro">
          Crea nuevas cuentas, selecciona quién pagó la factura y distribuye el valor en partes iguales o por consumo individual.
        </p>
      </div>
      <button class="btn-primary" type="button" (click)="abrirCreadorCuenta()">
        + Nueva cuenta
      </button>
    </div>

    <!-- Filtros de cuentas -->
    <div style="display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap;">
      <button
        type="button"
        class="btn-outline btn-sm"
        [style.border-color]="filtro() === 'todas' ? 'var(--accent)' : 'var(--border)'"
        (click)="filtro.set('todas')"
      >
        Todas ({{ api.cuentas().length }})
      </button>
      <button
        type="button"
        class="btn-outline btn-sm"
        [style.border-color]="filtro() === 'pagadas_por_mi' ? 'var(--accent)' : 'var(--border)'"
        (click)="filtro.set('pagadas_por_mi')"
      >
        Pagadas por mí
      </button>
      <button
        type="button"
        class="btn-outline btn-sm"
        [style.border-color]="filtro() === 'participo' ? 'var(--accent)' : 'var(--border)'"
        (click)="filtro.set('participo')"
      >
        Donde participo
      </button>
    </div>

    <!-- Listado de Cuentas en Tarjetas Interactivas -->
    <div class="cards-grid">
      @for (c of cuentasFiltradas(); track c.idCuenta) {
        @let dev = api.calcularDevolucionesLocal(c.idCuenta);
        <section class="panel" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="panel-head">
              <div>
                <span style="font-size: 10.5px; font-weight: 800; color: var(--muted);">{{ c.fecha | date:'dd MMM yyyy' }}</span>
                <h2 style="margin-top: 3px;">{{ c.descripcion }}</h2>
              </div>
              <span
                class="badge-status"
                [class.badge-success]="dev.estadoDistribucion === 'COMPLETA'"
                [class.badge-warning]="dev.estadoDistribucion === 'PENDIENTE'"
                [class.badge-danger]="dev.estadoDistribucion === 'EXCEDIDA'"
              >
                {{ dev.estadoDistribucion }}
              </span>
            </div>

            <div class="account-banner" style="margin: 12px 0 16px; padding: 16px;">
              <div class="overline">Monto Total</div>
              <div class="amount" style="font-size: 26px;">&#36;{{ c.montoTotal | number:'1.0-0' }} <span style="font-size: 11px; color: var(--muted);">COP</span></div>
              <div class="caption">
                Pagado por: <b>{{ api.getNombreUsuario(c.idUsuarioPagador) }}</b>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11.5px; margin-bottom: 14px;">
              <div style="padding: 10px; border-radius: 10px; background: var(--surface-alt); border: 1px solid var(--border);">
                <span style="color: var(--muted); display: block; font-size: 10px;">TOTAL DIVIDIDO</span>
                <strong>&#36;{{ dev.totalDivisiones | number:'1.0-0' }} COP</strong>
              </div>
              <div style="padding: 10px; border-radius: 10px; background: var(--surface-alt); border: 1px solid var(--border);">
                <span style="color: var(--muted); display: block; font-size: 10px;">POR COBRAR</span>
                <strong style="color: var(--accent);">
                  &#36;{{ obtenerPendienteCobrar(dev) | number:'1.0-0' }} COP
                </strong>
              </div>
            </div>

            <!-- Lista compacta de participantes -->
            <div style="font-size: 11px; color: var(--muted); margin-bottom: 8px; font-weight: 700;">
              PARTICIPANTES ({{ dev.saldos.length }}):
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
              @for (s of dev.saldos; track s.idUsuario) {
                <span
                  style="font-size: 11px; padding: 4px 9px; border-radius: 99px; border: 1px solid var(--border); background: var(--surface-alt);"
                >
                  <b>{{ s.nombre }}</b>: &#36;{{ s.montoAsignado | number:'1.0-0' }}
                  @if (s.tipoMovimiento === 'SALDADO') {
                    <span style="color: var(--success);">✓</span>
                  } @else if (s.tipoMovimiento === 'RECIBE') {
                    <span style="color: var(--accent);">(Pagador)</span>
                  } @else {
                    <span style="color: var(--warning);">●</span>
                  }
                </span>
              }
            </div>
          </div>

          <div style="display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border);">
            <button class="btn-outline btn-sm" style="flex: 1;" type="button" (click)="abrirModalAgregarParticipante(c)">
              + Participante
            </button>
            <button class="btn-danger btn-sm" type="button" (click)="eliminarCuenta(c.idCuenta)">
              Eliminar
            </button>
          </div>
        </section>
      }
    </div>

    <!-- Modal: Asistente Completo de Creación de Cuenta + División -->
    @if (mostrarModalNuevaCuenta()) {
      <div class="modal-backdrop" (click)="mostrarModalNuevaCuenta.set(false)">
        <div class="modal-card" style="max-width: 680px;" (click)="$event.stopPropagation()">
          <div class="panel-head">
            <div>
              <h2>Nueva Cuenta Compartida</h2>
              <p class="sub">Registra la cuenta y asigna la cuota de cada participante.</p>
            </div>
          </div>

          <div class="form-grid" style="margin-bottom: 16px;">
            <div class="form-group full">
              <label>Descripción de la cuenta</label>
              <input
                class="form-control"
                type="text"
                [(ngModel)]="formDescripcion"
                placeholder="Ej. Cena con amigos / Viaje de fin de semana"
              />
            </div>

            <div class="form-group">
              <label>Monto Total (COP)</label>
              <input
                class="form-control"
                type="number"
                [(ngModel)]="formMontoTotal"
                (ngModelChange)="recalcularDistribucion()"
                min="1000"
                step="1000"
              />
            </div>

            <div class="form-group">
              <label>Pagado inicialmente por</label>
              <select class="form-control" [(ngModel)]="formIdPagador">
                @for (u of api.usuarios(); track u.idUsuario) {
                  <option [ngValue]="u.idUsuario">{{ u.nombre }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Selector de modo de reparto -->
          <div style="margin-bottom: 14px;">
            <label style="font-size: 11.5px; font-weight: 750; display: block; margin-bottom: 6px;">
              Método de división:
            </label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button
                type="button"
                class="btn-outline btn-sm"
                [style.border-color]="modoReparto() === 'iguales' ? 'var(--accent)' : 'var(--border)'"
                (click)="cambiarModoReparto('iguales')"
              >
                ⚖️ Partes iguales
              </button>
              <button
                type="button"
                class="btn-outline btn-sm"
                [style.border-color]="modoReparto() === 'personalizado' ? 'var(--accent)' : 'var(--border)'"
                (click)="cambiarModoReparto('personalizado')"
              >
                🧾 Monto personalizado
              </button>
            </div>
          </div>

          <!-- Tabla de participantes a incluir en la división -->
          <div class="table-wrap" style="margin-bottom: 16px;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Incluir</th>
                  <th>Participante</th>
                  <th>Cuota (COP)</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (p of borradoresParticipantes(); track p.idUsuario) {
                  <tr>
                    <td>
                      <input
                        type="checkbox"
                        [(ngModel)]="p.seleccionado"
                        (ngModelChange)="recalcularDistribucion()"
                      />
                    </td>
                    <td>
                      <strong>{{ p.nombre }}</strong>
                      @if (p.idUsuario === formIdPagador) {
                        <span class="badge-status badge-info" style="margin-left: 6px;">Pagador</span>
                      }
                    </td>
                    <td>
                      <input
                        class="form-control"
                        style="width: 140px; padding: 6px 10px; font-size: 12px;"
                        type="number"
                        [(ngModel)]="p.monto"
                        [disabled]="!p.seleccionado || modoReparto() === 'iguales'"
                      />
                    </td>
                    <td>
                      @if (p.idUsuario === formIdPagador) {
                        <span class="badge-status badge-success">PAGADO</span>
                      } @else {
                        <span class="badge-status badge-warning">PENDIENTE</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Indicador en vivo de cuadre de distribución -->
          <div
            style="padding: 12px 15px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface-alt); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 18px;"
          >
            <div>
              <span style="font-size: 11px; color: var(--muted);">TOTAL DISTRIBUIDO:</span>
              <strong style="font-size: 15px; margin-left: 8px;">&#36;{{ sumaBorrador() | number:'1.0-0' }} / &#36;{{ formMontoTotal | number:'1.0-0' }} COP</strong>
            </div>
            <div>
              @if (Math.abs(sumaBorrador() - formMontoTotal) < 1) {
                <span class="badge-status badge-success">COMPLETA</span>
              } @else if (sumaBorrador() < formMontoTotal) {
                <span class="badge-status badge-warning">
                  FALTAN: &#36;{{ (formMontoTotal - sumaBorrador()) | number:'1.0-0' }} COP
                </span>
              } @else {
                <span class="badge-status badge-danger">
                  EXCEDIDA POR: &#36;{{ (sumaBorrador() - formMontoTotal) | number:'1.0-0' }} COP
                </span>
              }
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button class="btn-outline" type="button" (click)="mostrarModalNuevaCuenta.set(false)">Cancelar</button>
            <button class="btn-primary" type="button" (click)="guardarCuentaYDivisiones()">
              Guardar cuenta
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal: Agregar Participante a Cuenta Existente -->
    @if (cuentaParaNuevoParticipante(); as cuentaDest) {
      <div class="modal-backdrop" (click)="cuentaParaNuevoParticipante.set(null)">
        <div class="modal-card" style="max-width: 440px;" (click)="$event.stopPropagation()">
          <div class="panel-head">
            <div>
              <h2>Agregar participante</h2>
              <p class="sub">{{ cuentaDest.descripcion }}</p>
            </div>
          </div>

          <form (ngSubmit)="guardarNuevoParticipanteCuenta()" style="display: grid; gap: 14px;">
            <div class="form-group">
              <label>Participante</label>
              <select class="form-control" [(ngModel)]="nuevoPartUsuarioId" name="idUsuario">
                @for (u of api.usuarios(); track u.idUsuario) {
                  <option [ngValue]="u.idUsuario">{{ u.nombre }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Monto asignado (COP)</label>
              <input class="form-control" type="number" [(ngModel)]="nuevoPartMonto" name="monto" min="1" required />
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
              <button class="btn-outline" type="button" (click)="cuentaParaNuevoParticipante.set(null)">Cancelar</button>
              <button class="btn-primary" type="submit">Agregar</button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class UserCuentasComponent {
  readonly api = inject(SeparacionCuentasService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected readonly Math = Math;

  readonly filtro = signal<'todas' | 'pagadas_por_mi' | 'participo'>('todas');
  readonly mostrarModalNuevaCuenta = signal<boolean>(false);
  readonly modoReparto = signal<'iguales' | 'personalizado'>('iguales');
  readonly borradoresParticipantes = signal<ParticipanteDraft[]>([]);

  formDescripcion = '';
  formMontoTotal = 200000;
  formIdPagador = 1;

  readonly cuentaParaNuevoParticipante = signal<Cuenta | null>(null);
  nuevoPartUsuarioId = 1;
  nuevoPartMonto = 50000;

  readonly cuentasFiltradas = computed(() => {
    const uid = this.auth.currentUser().idUsuario;
    const todas = this.api.cuentas();
    if (this.filtro() === 'pagadas_por_mi') {
      return todas.filter(c => c.idUsuarioPagador === uid);
    }
    if (this.filtro() === 'participo') {
      const misCuentasDiv = new Set(
        this.api.divisiones().filter(d => d.idUsuario === uid).map(d => d.idCuenta)
      );
      return todas.filter(c => c.idUsuarioPagador === uid || misCuentasDiv.has(c.idCuenta));
    }
    return todas;
  });

  obtenerPendienteCobrar(dev: ReturnType<SeparacionCuentasService['calcularDevolucionesLocal']>): number {
    const pagador = dev.saldos.find(s => s.esPagador);
    return pagador ? pagador.saldo : 0;
  }

  abrirCreadorCuenta(): void {
    this.formDescripcion = '';
    this.formMontoTotal = 240000;
    this.formIdPagador = this.auth.currentUser().idUsuario;
    this.modoReparto.set('iguales');

    const drafts: ParticipanteDraft[] = this.api.usuarios().map((u, idx) => ({
      idUsuario: u.idUsuario,
      nombre: u.nombre,
      seleccionado: idx < 4,
      porcentaje: 25,
      monto: 60000,
      esPagador: u.idUsuario === this.formIdPagador
    }));
    this.borradoresParticipantes.set(drafts);
    this.recalcularDistribucion();
    this.mostrarModalNuevaCuenta.set(true);
  }

  cambiarModoReparto(modo: 'iguales' | 'personalizado'): void {
    this.modoReparto.set(modo);
    if (modo === 'iguales') {
      this.recalcularDistribucion();
    }
  }

  recalcularDistribucion(): void {
    const lista = [...this.borradoresParticipantes()];
    const activos = lista.filter(p => p.seleccionado);
    if (this.modoReparto() === 'iguales' && activos.length > 0) {
      const cuotaBase = Math.floor(this.formMontoTotal / activos.length);
      const residuo = this.formMontoTotal - cuotaBase * activos.length;
      activos.forEach((p, index) => {
        p.monto = index === 0 ? cuotaBase + residuo : cuotaBase;
      });
      lista.filter(p => !p.seleccionado).forEach(p => (p.monto = 0));
      this.borradoresParticipantes.set(lista);
    }
  }

  sumaBorrador(): number {
    return this.borradoresParticipantes()
      .filter(p => p.seleccionado)
      .reduce((acc, p) => acc + Number(p.monto || 0), 0);
  }

  guardarCuentaYDivisiones(): void {
    if (!this.formDescripcion.trim() || this.formMontoTotal <= 0) {
      this.toast.show('Ingresa una descripción y un monto total mayor a 0.', 'warning');
      return;
    }

    const seleccionados = this.borradoresParticipantes().filter(p => p.seleccionado && p.monto > 0);
    if (seleccionados.length === 0) {
      this.toast.show('Selecciona al menos un participante con monto mayor a 0.', 'warning');
      return;
    }

    this.api
      .createCuenta({
        idUsuarioPagador: Number(this.formIdPagador),
        descripcion: this.formDescripcion.trim(),
        montoTotal: Number(this.formMontoTotal),
        fecha: new Date().toISOString()
      })
      .subscribe(cuentaCreada => {
        for (const p of seleccionados) {
          const esPagador = p.idUsuario === Number(this.formIdPagador);
          this.api
            .createDivision({
              idCuenta: cuentaCreada.idCuenta,
              idUsuario: p.idUsuario,
              monto: Number(p.monto),
              estado: esPagador ? 'PAGADO' : 'PENDIENTE',
              tipoPago: esPagador ? 'Nequi' : null,
              referenciaPago: esPagador ? 'PAGADOR-ORIGEN' : null,
              fechaPago: esPagador ? new Date().toISOString() : null
            })
            .subscribe();
        }
        this.mostrarModalNuevaCuenta.set(false);
      });
  }

  abrirModalAgregarParticipante(cuenta: Cuenta): void {
    this.cuentaParaNuevoParticipante.set(cuenta);
    this.nuevoPartUsuarioId = this.api.usuarios()[0]?.idUsuario || 1;
    this.nuevoPartMonto = Math.round(cuenta.montoTotal / 4);
  }

  guardarNuevoParticipanteCuenta(): void {
    const cuenta = this.cuentaParaNuevoParticipante();
    if (!cuenta || this.nuevoPartMonto <= 0) return;

    const yaExiste = this.api
      .divisiones()
      .some(d => d.idCuenta === cuenta.idCuenta && d.idUsuario === Number(this.nuevoPartUsuarioId));

    if (yaExiste) {
      this.toast.show('Este usuario ya participa en esta cuenta.', 'warning');
      return;
    }

    const esPagador = Number(this.nuevoPartUsuarioId) === cuenta.idUsuarioPagador;
    this.api
      .createDivision({
        idCuenta: cuenta.idCuenta,
        idUsuario: Number(this.nuevoPartUsuarioId),
        monto: Number(this.nuevoPartMonto),
        estado: esPagador ? 'PAGADO' : 'PENDIENTE',
        tipoPago: esPagador ? 'Efectivo' : null,
        referenciaPago: esPagador ? 'PAGADOR-ORIGEN' : null,
        fechaPago: esPagador ? new Date().toISOString() : null
      })
      .subscribe(() => {
        this.cuentaParaNuevoParticipante.set(null);
      });
  }

  eliminarCuenta(idCuenta: number): void {
    this.api.deleteCuenta(idCuenta).subscribe();
  }
}
