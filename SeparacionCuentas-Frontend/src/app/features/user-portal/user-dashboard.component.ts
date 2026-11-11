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
    <!-- Barra de Paletas: Blanco Hielo + Índigo (Claro) y Azul Noche + Dorado (Oscuro) -->
    <section class="palette-bar" aria-label="Elegir paleta visual">
      <div>
        <strong style="font-size: 13px; font-weight: 800;">Personaliza la apariencia de SplitBill AI (slit.ia)</strong>
        <div style="font-size: 11.5px; color: var(--muted); margin-top: 2px;">
          Alterna en tiempo real entre <b>Blanco Hielo + Índigo</b> (Modo Claro) y <b>Azul Noche + Dorado</b> (Modo Oscuro).
        </div>
      </div>

      <div class="palette-choices-dual">
        <button
          class="palette-choice"
          type="button"
          [class.selected]="theme.currentTheme() === 'indigo'"
          (click)="theme.setTheme('indigo')"
        >
          <span class="palette-swatch" style="background: linear-gradient(135deg, #F3F6FB 50%, #4F46E5 50%)"></span>
          <span>
            <strong style="display: block; font-size: 11.5px;">Blanco hielo + índigo</strong>
            <small style="color: var(--muted); font-size: 10px;">Modo Claro Principal</small>
          </span>
        </button>

        <button
          class="palette-choice"
          type="button"
          [class.selected]="theme.currentTheme() === 'gold'"
          (click)="theme.setTheme('gold')"
        >
          <span class="palette-swatch" style="background: linear-gradient(135deg, #111828 50%, #F0C674 50%)"></span>
          <span>
            <strong style="display: block; font-size: 11.5px;">Azul noche + dorado</strong>
            <small style="color: var(--muted); font-size: 10px;">Modo Oscuro Ejecutivo</small>
          </span>
        </button>

        <button class="btn-outline btn-sm" type="button" (click)="theme.copyCurrentPaletteCss()">
          Copiar CSS
        </button>
      </div>
    </section>

    <!-- Cabecera del Panel de Usuario -->
    <div class="heading-row">
      <div>
        <div class="eyebrow">APARTADO DE USUARIO · {{ auth.currentUser().nombre }}</div>
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
    <div style="display: flex; align-items: center; gap: 10px; overflow-x: auto; padding-bottom: 14px;">
      <span style="font-size: 11.5px; font-weight: 800; color: var(--muted); white-space: nowrap;">CUENTA EN VISTA:</span>
      @for (c of api.cuentas(); track c.idCuenta) {
        <button
          type="button"
          class="btn-outline btn-sm"
          [style.border-color]="selectedCuentaId() === c.idCuenta ? 'var(--accent)' : 'var(--border)'"
          [style.background]="selectedCuentaId() === c.idCuenta ? 'var(--accent-soft)' : 'var(--surface)'"
          (click)="selectedCuentaId.set(c.idCuenta)"
        >
          #00{{ c.idCuenta }} · {{ c.descripcion }} (&#36;{{ c.montoTotal | number:'1.0-0' }})
        </button>
      }
    </div>

    <!-- Vista Principal de Cuenta Seleccionada (Idéntica al diseño SLIT.IA y conectada a los modelos .NET) -->
    @if (cuentaActiva(); as cuenta) {
      <div class="content-grid">
        <!-- Panel Izquierdo: Detalle de la cuenta y consumos -->
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>{{ cuenta.descripcion }}</h2>
              <p class="sub">
                Cuenta #00{{ cuenta.idCuenta }} · {{ cuenta.fecha | date:'dd MMM yyyy, h:mm a' }}
                · Pagador inicial: <b>{{ api.getNombreUsuario(cuenta.idUsuarioPagador) }}</b>
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
            <span>Detalle de consumos registrados</span>
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
              Esta cuenta fue creada por valor global (&#36;{{ cuenta.montoTotal | number:'1.0-0' }} COP). Puedes agregar ítems de consumo abajo.
            </div>
          }

          <!-- Formulario rápido para agregar ítem de consumo visual -->
          <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); display: flex; gap: 8px; flex-wrap: wrap;">
            <input
              class="form-control"
              style="flex: 2; min-width: 140px; padding: 8px 11px; font-size: 12px;"
              type="text"
              [(ngModel)]="nuevoConcepto"
              placeholder="Agregar consumo (ej. Postres)"
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
              style="width: 110px; padding: 8px 11px; font-size: 12px;"
              type="number"
              [(ngModel)]="nuevoValorItem"
              placeholder="Valor COP"
            />
            <button class="btn-outline btn-sm" type="button" (click)="agregarItemConsumo(cuenta.idCuenta)">
              + Ítem
            </button>
          </div>
        </section>

        <!-- Panel Derecho: División de la cuenta y Registro de Pagos -->
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>División de la cuenta</h2>
              <p class="sub">
                Participantes y estado en <code>dbo.Division</code> · Pagador recibe:
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
                      Organizador / Pagador inicial
                    } @else if (div.tipoPago) {
                      Pagó vía {{ div.tipoPago }} ({{ div.referenciaPago || 'Sin ref' }})
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
                  <button class="btn-outline btn-sm" type="button" (click)="revertirAPendiente(div)" title="Cambiar a PENDIENTE">
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

          <div style="display: flex; align-items: flex-start; gap: 10px; background: var(--accent-soft); border: 1px solid var(--border); border-radius: 12px; padding: 12px; margin-top: 18px;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" style="flex-shrink: 0; margin-top: 1px;">
              <circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>
            </svg>
            <p style="font-size: 11px; line-height: 1.5; color: var(--muted); margin: 0;">
              <b style="color: var(--text);">Cuenta clara, todos tranquilos.</b>
              El endpoint <code>GET /api/Cuenta/{{ cuenta.idCuenta }}/devoluciones</code> calcula automáticamente cuánto recibe el pagador a medida que se registran pagos.
            </p>
          </div>

          <div style="margin-top: 18px; display: flex; gap: 10px;">
            <a routerLink="/usuario/saldos" class="btn-outline" style="flex: 1;">
              Ver Saldos y Devoluciones
            </a>
            <a routerLink="/usuario/cuentas" class="btn-primary" style="flex: 1.4;">
              Gestionar / Dividir Cuentas
            </a>
          </div>
        </section>
      </div>
    }

    <!-- Modal para Registrar Pago (PUT /api/Division/{id}) -->
    @if (divisionEnPago(); as divModal) {
      <div class="modal-backdrop" (click)="divisionEnPago.set(null)">
        <div class="modal-card" style="max-width: 480px;" (click)="$event.stopPropagation()">
          <div class="panel-head">
            <div>
              <h2>Registrar pago de cuota</h2>
              <p class="sub">
                Participante: <b>{{ api.getNombreUsuario(divModal.idUsuario) }}</b> · Cuenta #00{{ divModal.idCuenta }}
              </p>
            </div>
            <span class="pill">RF08 / RF09</span>
          </div>

          <div class="account-banner" style="margin: 12px 0 18px; padding: 16px;">
            <div class="overline">Valor a pagar</div>
            <div class="amount" style="font-size: 26px;">&#36;{{ divModal.monto | number:'1.0-0' }} COP</div>
            <div class="caption">Se actualizará a estado PAGADO en dbo.Division</div>
          </div>

          <form (ngSubmit)="confirmarPagoDivision()" style="display: grid; gap: 14px;">
            <div class="form-group">
              <label>Método de pago utilizado (<code>tipo_pago</code>)</label>
              <select class="form-control" [(ngModel)]="metodoPagoSeleccionado" name="metodoPago">
                <option value="Nequi">Nequi</option>
                <option value="Bancolombia">Transferencia Bancolombia / A la Mano</option>
                <option value="DaviPlata">DaviPlata</option>
                <option value="PSE">PSE / Transfiya</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta Crédito / Débito</option>
              </select>
            </div>

            <div class="form-group">
              <label>Referencia o comprobante de pago (<code>referencia_pago</code>)</label>
              <input
                class="form-control"
                type="text"
                [(ngModel)]="referenciaPagoInput"
                name="referenciaPago"
                placeholder="Ej. NEQ-849201 o Comprobante #1234"
                required
              />
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px;">
              <button class="btn-outline" type="button" (click)="divisionEnPago.set(null)">Cancelar</button>
              <button class="btn-primary" type="submit">Confirmar Pago (PUT /api/Division)</button>
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
