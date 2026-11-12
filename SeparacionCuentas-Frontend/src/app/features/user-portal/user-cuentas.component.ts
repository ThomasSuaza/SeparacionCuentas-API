import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeparacionCuentasService } from '../../core/services/separacion-cuentas.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Cuenta, Division } from '../../core/models/api.models';

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
          Crea nuevas cuentas o agrega y quita participantes en cuentas existentes con recálculo automático de cuotas.
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
        @let divsCuenta = obtenerDivisionesDeCuenta(c.idCuenta);
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
              <div class="amount" style="font-size: 26px;">
                &#36;{{ c.montoTotal | number:'1.0-0' }}
                <span style="font-size: 11px; color: var(--muted);">COP</span>
              </div>
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

            <!-- Lista interactiva de participantes con botón para quitar y recalcular -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 11px; color: var(--muted); font-weight: 700;">
                PARTICIPANTES ({{ divsCuenta.length }}):
              </span>
              <button
                type="button"
                style="border: 0; background: transparent; color: var(--accent); font-size: 11px; font-weight: 800; padding: 0;"
                (click)="api.recalcularPartesIgualesCuenta(c.idCuenta).subscribe()"
                title="Recalcular todas las cuotas en partes iguales"
              >
                ⚖️ Recalcular iguales
              </button>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
              @for (d of divsCuenta; track d.idDivision) {
                <span
                  style="font-size: 11px; padding: 4px 9px; border-radius: 99px; border: 1px solid var(--border); background: var(--surface-alt); display: inline-flex; align-items: center; gap: 5px;"
                >
                  <b>{{ api.getNombreUsuario(d.idUsuario) }}</b>: &#36;{{ d.monto | number:'1.0-0' }}
                  @if (d.estado === 'PAGADO') {
                    <span style="color: var(--success);">✓</span>
                  } @else {
                    <span style="color: var(--warning);">●</span>
                  }
                  @if (divsCuenta.length > 1) {
                    <button
                      type="button"
                      style="border: 0; background: transparent; color: var(--danger); font-weight: 800; font-size: 11px; padding: 0 2px; line-height: 1;"
                      title="Quitar de la cuenta y recalcular cuotas"
                      (click)="quitarParticipanteYRecalcular(c.idCuenta, d.idDivision)"
                    >
                      ✕
                    </button>
                  }
                </span>
              }
            </div>
          </div>

          <div style="display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border); flex-wrap: wrap;">
            <button class="btn-primary btn-sm" style="flex: 1;" type="button" (click)="abrirModalGestionParticipantes(c)">
              + Agregar / Quitar usuario
            </button>
            <button class="btn-outline btn-sm" type="button" (click)="api.recalcularPartesIgualesCuenta(c.idCuenta).subscribe()">
              ⚖️ Recalcular
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

          <!-- Crear usuario nuevo rápidamente dentro del asistente -->
          <div style="padding: 11px 13px; border-radius: 12px; background: var(--surface-alt); border: 1px solid var(--border); margin-bottom: 14px;">
            <div style="font-size: 11px; font-weight: 800; color: var(--muted); margin-bottom: 8px;">
              + ¿FALTA UN AMIGO? AGRÉGALO RÁPIDO A LA LISTA:
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <input
                class="form-control"
                style="flex: 1; min-width: 140px; padding: 7px 10px; font-size: 12px;"
                type="text"
                [(ngModel)]="rapidoNombre"
                placeholder="Nombre (ej. Sofía)"
              />
              <input
                class="form-control"
                style="flex: 1; min-width: 150px; padding: 7px 10px; font-size: 12px;"
                type="email"
                [(ngModel)]="rapidoCorreo"
                placeholder="Correo (ej. sofia@correo.com)"
              />
              <button class="btn-outline btn-sm" type="button" (click)="crearUsuarioRapidoEnBorrador()">
                + Crear e incluir
              </button>
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
          <div class="table-wrap" style="margin-bottom: 16px; max-height: 240px; overflow-y: auto;">
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

    <!-- Modal: Gestionar Participantes de Cuenta Existente (Agregar Existente / Crear Nuevo / Quitar y Recalcular) -->
    @if (cuentaParaNuevoParticipante(); as cuentaDest) {
      @let divsActuales = obtenerDivisionesDeCuenta(cuentaDest.idCuenta);
      <div class="modal-backdrop" (click)="cuentaParaNuevoParticipante.set(null)">
        <div class="modal-card" style="max-width: 560px;" (click)="$event.stopPropagation()">
          <div class="panel-head">
            <div>
              <h2>Participantes de la cuenta</h2>
              <p class="sub">
                <b>{{ cuentaDest.descripcion }}</b> · Total: &#36;{{ cuentaDest.montoTotal | number:'1.0-0' }} COP
              </p>
            </div>
            <button class="btn-outline btn-sm" type="button" (click)="cuentaParaNuevoParticipante.set(null)">
              Cerrar
            </button>
          </div>

          <!-- Lista actual de participantes con botón para quitar y recalcular -->
          <div style="margin-bottom: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 11px; font-weight: 800; color: var(--muted); text-transform: uppercase;">
                Participantes actuales ({{ divsActuales.length }}):
              </span>
              <button
                type="button"
                class="btn-outline btn-sm"
                style="padding: 4px 9px; font-size: 11px;"
                (click)="api.recalcularPartesIgualesCuenta(cuentaDest.idCuenta).subscribe()"
              >
                ⚖️ Recalcular partes iguales
              </button>
            </div>

            <div style="display: grid; gap: 7px; max-height: 185px; overflow-y: auto;">
              @for (d of divsActuales; track d.idDivision) {
                <div style="padding: 9px 12px; border-radius: 11px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                  <div style="display: flex; align-items: center; gap: 9px;">
                    <div class="person-bubble" style="width: 28px; height: 28px; font-size: 10.5px;">
                      {{ api.getIniciales(api.getNombreUsuario(d.idUsuario)) }}
                    </div>
                    <div>
                      <strong style="font-size: 12.5px;">{{ api.getNombreUsuario(d.idUsuario) }}</strong>
                      @if (d.idUsuario === cuentaDest.idUsuarioPagador) {
                        <span class="badge-status badge-info" style="margin-left: 6px;">Pagador</span>
                      }
                    </div>
                  </div>

                  <div style="display: flex; align-items: center; gap: 10px;">
                    <strong style="font-size: 12.5px;">&#36;{{ d.monto | number:'1.0-0' }} COP</strong>
                    @if (divsActuales.length > 1) {
                      <button
                        type="button"
                        class="btn-danger btn-sm"
                        style="padding: 4px 8px; font-size: 11px;"
                        (click)="quitarParticipanteYRecalcular(cuentaDest.idCuenta, d.idDivision)"
                      >
                        ✕ Quitar
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <div style="border-top: 1px solid var(--border); padding-top: 16px;">
            <div style="font-size: 11.5px; font-weight: 800; color: var(--muted); text-transform: uppercase; margin-bottom: 10px;">
              Agregar participante a esta cuenta:
            </div>

            <!-- Selector entre Usuario Existente o Crear Usuario Nuevo -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: var(--surface-alt); padding: 4px; border-radius: 10px; border: 1px solid var(--border); margin-bottom: 14px;">
              <button
                type="button"
                style="border: 0; padding: 7px 10px; border-radius: 8px; font-size: 12px; font-weight: 800;"
                [style.background]="modoAgregarUsuario() === 'existente' ? 'var(--accent)' : 'transparent'"
                [style.color]="modoAgregarUsuario() === 'existente' ? 'var(--on-accent)' : 'var(--muted)'"
                (click)="modoAgregarUsuario.set('existente')"
              >
                👤 Usuario registrado
              </button>
              <button
                type="button"
                style="border: 0; padding: 7px 10px; border-radius: 8px; font-size: 12px; font-weight: 800;"
                [style.background]="modoAgregarUsuario() === 'nuevo' ? 'var(--accent)' : 'transparent'"
                [style.color]="modoAgregarUsuario() === 'nuevo' ? 'var(--on-accent)' : 'var(--muted)'"
                (click)="modoAgregarUsuario.set('nuevo')"
              >
                ➕ Crear usuario nuevo
              </button>
            </div>

            <form (ngSubmit)="guardarNuevoParticipanteCuenta()" style="display: grid; gap: 12px;">
              @if (modoAgregarUsuario() === 'existente') {
                <div class="form-group">
                  <label>Seleccionar usuario</label>
                  <select class="form-control" [(ngModel)]="nuevoPartUsuarioId" name="idUsuario">
                    @for (u of usuariosDisponiblesParaCuenta(cuentaDest.idCuenta); track u.idUsuario) {
                      <option [ngValue]="u.idUsuario">{{ u.nombre }} ({{ u.correo }})</option>
                    }
                  </select>
                </div>
              } @else {
                <div class="form-grid">
                  <div class="form-group">
                    <label>Nombre completo del nuevo usuario</label>
                    <input
                      class="form-control"
                      type="text"
                      [(ngModel)]="nuevoUsuarioNombre"
                      name="nuevoUsuarioNombre"
                      placeholder="Ej. Sebastián Mora"
                      required
                    />
                  </div>
                  <div class="form-group">
                    <label>Correo electrónico</label>
                    <input
                      class="form-control"
                      type="email"
                      [(ngModel)]="nuevoUsuarioCorreo"
                      name="nuevoUsuarioCorreo"
                      placeholder="sebastian@correo.com"
                      required
                    />
                  </div>
                </div>
                <div class="form-group">
                  <label>Teléfono / Nequi (opcional)</label>
                  <input
                    class="form-control"
                    type="text"
                    [(ngModel)]="nuevoUsuarioTelefono"
                    name="nuevoUsuarioTelefono"
                    placeholder="300 000 0000"
                  />
                </div>
              }

              <!-- Opción de Recálculo Automático -->
              <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 700; cursor: pointer; padding: 10px 12px; border-radius: 10px; background: var(--surface-alt); border: 1px solid var(--border);">
                <input
                  type="checkbox"
                  [(ngModel)]="recalcularAutomatico"
                  name="recalcularAutomatico"
                />
                <span>
                  ⚖️ Recalcular automáticamente las cuotas de todos en partes iguales
                  <small style="display: block; font-weight: 500; color: var(--muted); margin-top: 2px;">
                    Nueva cuota estimada entre {{ divsActuales.length + 1 }} personas:
                    <b>&#36;{{ Math.floor(cuentaDest.montoTotal / (divsActuales.length + 1)) | number:'1.0-0' }} COP c/u</b>
                  </small>
                </span>
              </label>

              @if (!recalcularAutomatico) {
                <div class="form-group">
                  <label>Monto personalizado para este participante (COP)</label>
                  <input class="form-control" type="number" [(ngModel)]="nuevoPartMonto" name="monto" min="1" required />
                </div>
              }

              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px;">
                <button class="btn-outline" type="button" (click)="cuentaParaNuevoParticipante.set(null)">Cancelar</button>
                <button class="btn-primary" type="submit">
                  {{ modoAgregarUsuario() === 'nuevo' ? 'Crear usuario, agregar y recalcular' : 'Agregar a la cuenta y recalcular' }}
                </button>
              </div>
            </form>
          </div>
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

  rapidoNombre = '';
  rapidoCorreo = '';

  readonly cuentaParaNuevoParticipante = signal<Cuenta | null>(null);
  readonly modoAgregarUsuario = signal<'existente' | 'nuevo'>('existente');
  nuevoPartUsuarioId = 1;
  nuevoPartMonto = 50000;
  recalcularAutomatico = true;

  nuevoUsuarioNombre = '';
  nuevoUsuarioCorreo = '';
  nuevoUsuarioTelefono = '';

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

  obtenerDivisionesDeCuenta(idCuenta: number): Division[] {
    return this.api.divisiones().filter(d => d.idCuenta === idCuenta);
  }

  usuariosDisponiblesParaCuenta(idCuenta: number) {
    const enCuenta = new Set(
      this.api
        .divisiones()
        .filter(d => d.idCuenta === idCuenta)
        .map(d => d.idUsuario)
    );
    const disponibles = this.api.usuarios().filter(u => !enCuenta.has(u.idUsuario));
    return disponibles.length > 0 ? disponibles : this.api.usuarios();
  }

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

  crearUsuarioRapidoEnBorrador(): void {
    if (!this.rapidoNombre.trim()) {
      this.toast.show('Escribe el nombre del nuevo participante.', 'warning');
      return;
    }
    const nombre = this.rapidoNombre.trim();
    const correo =
      this.rapidoCorreo.trim() || `${nombre.toLowerCase().replace(/\s+/g, '.')}@spliy.ia`;

    this.api
      .createUsuario({
        nombre,
        correo,
        telefono: '300 000 0000',
        passwordHash: 'HASH_RAPIDO_2026'
      })
      .subscribe(creado => {
        this.rapidoNombre = '';
        this.rapidoCorreo = '';
        const actual = [...this.borradoresParticipantes()];
        actual.push({
          idUsuario: creado.idUsuario,
          nombre: creado.nombre,
          seleccionado: true,
          porcentaje: 0,
          monto: 0,
          esPagador: false
        });
        this.borradoresParticipantes.set(actual);
        this.recalcularDistribucion();
      });
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

  abrirModalGestionParticipantes(cuenta: Cuenta): void {
    this.cuentaParaNuevoParticipante.set(cuenta);
    const disp = this.usuariosDisponiblesParaCuenta(cuenta.idCuenta);
    this.nuevoPartUsuarioId = disp[0]?.idUsuario || this.api.usuarios()[0]?.idUsuario || 1;
    const nActual = this.obtenerDivisionesDeCuenta(cuenta.idCuenta).length;
    this.nuevoPartMonto = Math.floor(cuenta.montoTotal / (nActual + 1));
    this.recalcularAutomatico = true;
    this.modoAgregarUsuario.set('existente');
    this.nuevoUsuarioNombre = '';
    this.nuevoUsuarioCorreo = '';
    this.nuevoUsuarioTelefono = '';
  }

  quitarParticipanteYRecalcular(idCuenta: number, idDivision: number): void {
    this.api.quitarParticipanteDeCuenta(idCuenta, idDivision, true).subscribe();
  }

  guardarNuevoParticipanteCuenta(): void {
    const cuenta = this.cuentaParaNuevoParticipante();
    if (!cuenta) return;

    if (this.modoAgregarUsuario() === 'nuevo') {
      if (!this.nuevoUsuarioNombre.trim()) {
        this.toast.show('Ingresa el nombre del nuevo usuario.', 'warning');
        return;
      }
      const nombre = this.nuevoUsuarioNombre.trim();
      const correo =
        this.nuevoUsuarioCorreo.trim() ||
        `${nombre.toLowerCase().replace(/\s+/g, '.')}@spliy.ia`;

      this.api
        .createUsuario({
          nombre,
          correo,
          telefono: this.nuevoUsuarioTelefono.trim() || null,
          passwordHash: 'HASH_NUEVO_PARTICIPANTE_2026'
        })
        .subscribe(usuarioCreado => {
          this.api
            .agregarParticipanteACuenta(
              cuenta.idCuenta,
              usuarioCreado.idUsuario,
              this.recalcularAutomatico,
              this.nuevoPartMonto
            )
            .subscribe(() => {
              this.nuevoUsuarioNombre = '';
              this.nuevoUsuarioCorreo = '';
              this.nuevoUsuarioTelefono = '';
              const disp = this.usuariosDisponiblesParaCuenta(cuenta.idCuenta);
              this.nuevoPartUsuarioId = disp[0]?.idUsuario || usuarioCreado.idUsuario;
            });
        });
      return;
    }

    this.api
      .agregarParticipanteACuenta(
        cuenta.idCuenta,
        Number(this.nuevoPartUsuarioId),
        this.recalcularAutomatico,
        this.nuevoPartMonto
      )
      .subscribe(() => {
        const disp = this.usuariosDisponiblesParaCuenta(cuenta.idCuenta);
        if (disp.length > 0) {
          this.nuevoPartUsuarioId = disp[0].idUsuario;
        }
      });
  }

  eliminarCuenta(idCuenta: number): void {
    this.api.deleteCuenta(idCuenta).subscribe();
  }
}
