import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SeparacionCuentasService } from '../../core/services/separacion-cuentas.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { Division, MetodoPago } from '../../core/models/api.models';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Cabecera del Panel de Usuario -->
    <div class="heading-row">
      <div>
        <div class="eyebrow">HOLA, {{ auth.currentUser().nombre }}</div>
        <h1 class="page-title">Divide cuentas sin enredos.</h1>
        <p class="intro">
          Crea una cuenta, agrega participantes y lleva el control en vivo de quién ha pagado y cuánto te deben.
        </p>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <a routerLink="/usuario/cuentas" class="btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Nueva cuenta
        </a>
        <a routerLink="/usuario/pagos" class="btn-outline">
          Mis pagos ({{ misDivisionesPendientes().length }})
        </a>
      </div>
    </div>

    <!-- Tarjetas de Estadísticas del Usuario -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="tiny">
          Cuentas donde participo
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="6" width="18" height="15" rx="2"/><path d="M7 3v6M17 3v6"/>
          </svg>
        </div>
        <strong>{{ misCuentasRelacionadas().length | number:'2.0-0' }}</strong>
        <small>{{ cuentasPagadasPorMi().length }} pagadas inicialmente por ti</small>
      </div>

      <div class="stat-card">
        <div class="tiny">
          Pendiente por cobrar (Te deben)
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="9"/><path d="M12 6v12m3-9c-2-2-6-1-6 1s6 1 6 4-4 3-6 1"/>
          </svg>
        </div>
        <strong>&#36;{{ totalPorCobrarUsuario() | number:'1.0-0' }}</strong>
        <small>COP · En cuentas donde eres pagador</small>
      </div>

      <div class="stat-card">
        <div class="tiny">
          Tus pagos pendientes (Debes)
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <strong>&#36;{{ totalPorPagarUsuario() | number:'1.0-0' }}</strong>
        <small>COP · {{ misDivisionesPendientes().length }} cuotas por pagar</small>
      </div>

      <div class="stat-card">
        <div class="tiny">
          Pagos completados (Cuenta activa)
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>
          </svg>
        </div>
        <strong>{{ progresoCuentaActiva().porcentaje }}%</strong>
        <small>
          <em>{{ progresoCuentaActiva().pagados }} de {{ progresoCuentaActiva().total }}</em> participantes al día
        </small>
      </div>
    </div>

    <!-- Selector rápido de cuenta activa -->
    @if (api.cuentas().length > 0) {
      <div style="display: flex; align-items: center; gap: 8px; overflow-x: auto; padding-bottom: 14px;">
        <span style="font-size: 11px; font-weight: 800; color: var(--muted); white-space: nowrap;">CUENTA ACTIVA:</span>
        @for (c of api.cuentas(); track c.idCuenta) {
          <button
            type="button"
            class="btn-outline btn-sm"
            [style.border-color]="cuentaActiva()?.idCuenta === c.idCuenta ? 'var(--accent)' : 'var(--border)'"
            [style.background]="cuentaActiva()?.idCuenta === c.idCuenta ? 'var(--accent-soft)' : 'var(--surface)'"
            (click)="selectedCuentaId.set(c.idCuenta)"
          >
            {{ c.descripcion }} (&#36;{{ c.montoTotal | number:'1.0-0' }})
          </button>
        }
      </div>
    }

    <!-- Vista Principal de Cuenta Seleccionada -->
    @if (cuentaActiva(); as cuenta) {
      <div class="content-grid">
        <!-- Panel Izquierdo: Detalle de la cuenta y consumos -->
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>{{ cuenta.descripcion }}</h2>
              <p class="sub">
                {{ cuenta.fecha | date:'dd MMM yyyy, h:mm a' }}
                · Pagado por: <b>{{ api.getNombreUsuario(cuenta.idUsuarioPagador) }}</b>
              </p>
            </div>
            <span class="pill">
              ● {{ devolucionActiva().estadoDistribucion }}
            </span>
          </div>

          <div class="account-banner">
            <div class="overline">Total de la cuenta</div>
            <div class="amount">
              &#36;{{ cuenta.montoTotal | number:'1.0-0' }}
              <span style="font-size: 12px; font-weight: 700; color: var(--muted); letter-spacing: 0;">COP</span>
            </div>
            <div class="caption">
              Distribuido entre {{ divisionesCuentaActiva().length }} personas ·
              Total asignado: &#36;{{ devolucionActiva().totalDivisiones | number:'1.0-0' }} COP
              @if (devolucionActiva().diferencia > 0) {
                <span style="color: var(--warning); font-weight: 700;">
                  (Diferencia: &#36;{{ devolucionActiva().diferencia | number:'1.0-0' }})
                </span>
              }
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; font-weight: 750; margin: 10px 0 12px;">
            <span>Detalle de consumos</span>
            <span style="color: var(--muted);">{{ consumosCuentaActiva().length }} conceptos</span>
          </div>

          @for (item of consumosCuentaActiva(); track item.id) {
            <div class="charge-row">
              <div class="item-box">
                <div class="item-icon">{{ item.icono }}</div>
                <div>
                  <span style="font-size: 12.5px; font-weight: 720; display: block;">{{ item.concepto }}</span>
                  <span style="font-size: 10.5px; color: var(--muted); display: block; margin-top: 2px;">{{ item.detalle }}</span>
                </div>
              </div>
              <div style="font-size: 12.5px; font-weight: 780;">&#36;{{ item.valor | number:'1.0-0' }}</div>
            </div>
          } @empty {
            <div style="padding: 16px; border: 1px dashed var(--border); border-radius: 12px; text-align: center; color: var(--muted); font-size: 12px;">
              Cuenta registrada por valor total (&#36;{{ cuenta.montoTotal | number:'1.0-0' }} COP). Puedes detallar consumos abajo si lo deseas.
            </div>
          }

          <!-- Formulario rápido para agregar ítem de consumo visual -->
          <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); display: flex; gap: 8px; flex-wrap: wrap;">
            <input
              class="form-control"
              style="flex: 2; min-width: 140px; padding: 8px 11px; font-size: 12px;"
              type="text"
              [(ngModel)]="nuevoConcepto"
              placeholder="Concepto (ej. Postres)"
            />
            <input
              class="form-control"
              style="flex: 1.5; min-width: 120px; padding: 8px 11px; font-size: 12px;"
              type="text"
              [(ngModel)]="nuevoDetalle"
              placeholder="Detalle (ej. 2 porciones)"
            />
            <input
              class="form-control"
              style="width: 115px; padding: 8px 11px; font-size: 12px;"
              type="number"
              [(ngModel)]="nuevoValorItem"
              placeholder="Valor COP"
            />
            <button class="btn-outline btn-sm" type="button" (click)="agregarItemConsumo(cuenta.idCuenta)">
              + Agregar
            </button>
          </div>
        </section>

        <!-- Panel Derecho: División de la cuenta y Registro de Pagos -->
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>División de la cuenta</h2>
              <p class="sub">
                Pendiente por recibir el pagador:
                <b>&#36;{{ saldoPagadorCuentaActiva() | number:'1.0-0' }} COP</b>
              </p>
            </div>
            <span class="pill">{{ divisionesCuentaActiva().length }} personas</span>
          </div>

          <div style="height: 1px; background: var(--border); margin: 14px 0;"></div>

          @for (div of divisionesCuentaActiva(); track div.idDivision) {
            <div class="person-row">
              <div class="person-who">
                <div class="person-bubble">{{ api.getIniciales(api.getNombreUsuario(div.idUsuario)) }}</div>
                <div>
                  <strong style="display: block; font-size: 12.5px; margin-bottom: 3px;">
                    {{ api.getNombreUsuario(div.idUsuario) }}
                    @if (div.idUsuario === auth.currentUser().idUsuario) {
                      <span style="color: var(--accent); font-size: 11px;">(Tú)</span>
                    }
                  </strong>
                  <small style="display: block; font-size: 10.5px; color: var(--muted);">
                    @if (div.idUsuario === cuenta.idUsuarioPagador) {
                      Pagador inicial
                    } @else if (div.tipoPago) {
                      Pagó vía {{ div.tipoPago }} ({{ div.referenciaPago || 'Confirmado' }})
                    } @else {
                      Participante · Cuota asignada
                    }
                  </small>
                </div>
              </div>

              <div style="text-align: right; display: flex; align-items: center; gap: 10px;">
                <div>
                  <div style="font-size: 13px; font-weight: 800;">&#36;{{ div.monto | number:'1.0-0' }}</div>
                  @if (div.estado === 'PAGADO') {
                    <span style="display: block; font-size: 10.5px; font-weight: 780; color: var(--success); margin-top: 3px;">
                      ✓ Pagado
                    </span>
                  } @else {
                    <span style="display: block; font-size: 10.5px; font-weight: 750; color: var(--warning); margin-top: 3px;">
                      ● Pendiente
                    </span>
                  }
                </div>

                @if (div.estado === 'PENDIENTE') {
                  <button class="btn-primary btn-sm" type="button" (click)="abrirModalPago(div)">
                    Pagar
                  </button>
                } @else {
                  <button class="btn-outline btn-sm" type="button" (click)="revertirAPendiente(div)" title="Marcar como pendiente">
                    ↺
                  </button>
                }
              </div>
            </div>
          }

          <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 770; margin: 20px 0 9px;">
            <span>Progreso de pagos</span>
            <span style="color: var(--muted);">
              {{ progresoCuentaActiva().pagados }} de {{ progresoCuentaActiva().total }} completados
            </span>
          </div>
          <div class="progress-track">
            <i class="progress-fill" [style.width.%]="progresoCuentaActiva().porcentaje"></i>
          </div>

          <div style="margin-top: 18px; display: flex; gap: 10px; flex-wrap: wrap;">
            <a routerLink="/usuario/saldos" class="btn-outline" style="flex: 1;">
              Ver saldos detallados
            </a>
            <a routerLink="/usuario/cuentas" class="btn-primary" style="flex: 1;">
              Gestionar cuentas
            </a>
          </div>
        </section>
      </div>
    }

    <!-- Modal para Registrar Pago -->
    @if (divisionEnPago(); as divModal) {
      <div class="modal-backdrop" (click)="divisionEnPago.set(null)">
        <div class="modal-card" style="max-width: 460px;" (click)="$event.stopPropagation()">
          <div class="panel-head">
            <div>
              <h2>Registrar pago de cuota</h2>
              <p class="sub">
                Participante: <b>{{ api.getNombreUsuario(divModal.idUsuario) }}</b>
              </p>
            </div>
          </div>

          <div class="account-banner" style="margin: 12px 0 18px; padding: 16px;">
            <div class="overline">Valor a pagar</div>
            <div class="amount" style="font-size: 26px;">&#36;{{ divModal.monto | number:'1.0-0' }} COP</div>
          </div>

          <form (ngSubmit)="confirmarPagoDivision()" style="display: grid; gap: 14px;">
            <div class="form-group">
              <label>Método de pago</label>
              <select class="form-control" [(ngModel)]="metodoPagoSeleccionado" name="metodoPago">
                <option value="Nequi">Nequi</option>
                <option value="Bancolombia">Transferencia Bancolombia</option>
                <option value="DaviPlata">DaviPlata</option>
                <option value="PSE">PSE / Transfiya</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
              </select>
            </div>

            <div class="form-group">
              <label>Referencia o comprobante</label>
              <input
                class="form-control"
                type="text"
                [(ngModel)]="referenciaPagoInput"
                name="referenciaPago"
                placeholder="Ej. NEQ-849201"
                required
              />
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px;">
              <button class="btn-outline" type="button" (click)="divisionEnPago.set(null)">Cancelar</button>
              <button class="btn-primary" type="submit">Confirmar pago</button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class UserDashboardComponent {
  readonly api = inject(SeparacionCuentasService);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  readonly selectedCuentaId = signal<number>(1);
  readonly divisionEnPago = signal<Division | null>(null);
  metodoPagoSeleccionado: MetodoPago = 'Nequi';
  referenciaPagoInput = '';

  nuevoConcepto = '';
  nuevoDetalle = '';
  nuevoValorItem: number | null = null;

  readonly cuentaActiva = computed(() => {
    const list = this.api.cuentas();
    return list.find(c => c.idCuenta === this.selectedCuentaId()) || list[0] || null;
  });

  readonly divisionesCuentaActiva = computed(() => {
    const c = this.cuentaActiva();
    if (!c) return [];
    return this.api.divisiones().filter(d => d.idCuenta === c.idCuenta);
  });

  readonly consumosCuentaActiva = computed(() => {
    const c = this.cuentaActiva();
    if (!c) return [];
    return this.api.getConsumosPorCuenta(c.idCuenta);
  });

  readonly devolucionActiva = computed(() => {
    const c = this.cuentaActiva();
    if (!c) {
      return {
        idCuenta: 0,
        montoTotalCuenta: 0,
        totalDivisiones: 0,
        diferencia: 0,
        estadoDistribucion: 'PENDIENTE' as const,
        saldos: []
      };
    }
    return this.api.calcularDevolucionesLocal(c.idCuenta);
  });

  readonly saldoPagadorCuentaActiva = computed(() => {
    const pagadorRow = this.devolucionActiva().saldos.find(s => s.esPagador);
    return pagadorRow ? pagadorRow.saldo : 0;
  });

  readonly progresoCuentaActiva = computed(() => {
    const divs = this.divisionesCuentaActiva();
    const total = divs.length;
    if (total === 0) return { pagados: 0, total: 0, porcentaje: 0 };
    const pagados = divs.filter(d => d.estado === 'PAGADO').length;
    return {
      pagados,
      total,
      porcentaje: Math.round((pagados / total) * 100)
    };
  });

  readonly cuentasPagadasPorMi = computed(() => {
    const uid = this.auth.currentUser().idUsuario;
    return this.api.cuentas().filter(c => c.idUsuarioPagador === uid);
  });

  readonly misCuentasRelacionadas = computed(() => {
    const uid = this.auth.currentUser().idUsuario;
    const idsFromDivs = new Set(
      this.api.divisiones().filter(d => d.idUsuario === uid).map(d => d.idCuenta)
    );
    return this.api.cuentas().filter(
      c => c.idUsuarioPagador === uid || idsFromDivs.has(c.idCuenta)
    );
  });

  readonly misDivisionesPendientes = computed(() => {
    const uid = this.auth.currentUser().idUsuario;
    return this.api.divisiones().filter(
      d => d.idUsuario === uid && d.estado === 'PENDIENTE'
    );
  });

  readonly totalPorCobrarUsuario = computed(() => {
    const uid = this.auth.currentUser().idUsuario;
    const misCuentasPagador = this.api.cuentas().filter(c => c.idUsuarioPagador === uid);
    let suma = 0;
    for (const c of misCuentasPagador) {
      const dev = this.api.calcularDevolucionesLocal(c.idCuenta);
      const pagadorSaldo = dev.saldos.find(s => s.esPagador);
      if (pagadorSaldo && pagadorSaldo.tipoMovimiento === 'RECIBE') {
        suma += pagadorSaldo.saldo;
      }
    }
    return suma;
  });

  readonly totalPorPagarUsuario = computed(() =>
    this.misDivisionesPendientes().reduce((acc, d) => acc + Number(d.monto), 0)
  );

  agregarItemConsumo(idCuenta: number): void {
    if (!this.nuevoConcepto.trim() || !this.nuevoValorItem || this.nuevoValorItem <= 0) return;
    this.api.addConsumoItem({
      idCuenta,
      concepto: this.nuevoConcepto.trim(),
      detalle: this.nuevoDetalle.trim() || 'Consumo registrado',
      valor: Number(this.nuevoValorItem),
      icono: this.nuevoConcepto.trim()[0].toUpperCase()
    });
    this.nuevoConcepto = '';
    this.nuevoDetalle = '';
    this.nuevoValorItem = null;
  }

  abrirModalPago(div: Division): void {
    this.divisionEnPago.set(div);
    this.metodoPagoSeleccionado = 'Nequi';
    this.referenciaPagoInput = `NEQ-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  confirmarPagoDivision(): void {
    const div = this.divisionEnPago();
    if (!div) return;
    const payload: Division = {
      ...div,
      estado: 'PAGADO',
      tipoPago: this.metodoPagoSeleccionado,
      referenciaPago: this.referenciaPagoInput.trim() || 'PAGO-CONFIRMADO',
      fechaPago: new Date().toISOString()
    };
    this.api.updateDivision(div.idDivision, payload).subscribe(() => {
      this.divisionEnPago.set(null);
    });
  }

  revertirAPendiente(div: Division): void {
    const payload: Division = {
      ...div,
      estado: 'PENDIENTE',
      tipoPago: null,
      referenciaPago: null,
      fechaPago: null
    };
    this.api.updateDivision(div.idDivision, payload).subscribe();
  }
}
