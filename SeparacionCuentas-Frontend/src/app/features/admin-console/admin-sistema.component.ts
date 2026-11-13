import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeparacionCuentasService } from '../../core/services/separacion-cuentas.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin-sistema',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="heading-row">
      <div>
        <div class="eyebrow">AUDITORÍA Y OPERACIONES · SPLITIA</div>
        <h1 class="page-title">Auditoría Financiera y Estado Operativo</h1>
        <p class="intro">
          Bitácora de transacciones recientes, conciliación de cuentas y estado de los servicios de datos.
        </p>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="btn-outline" type="button" (click)="api.refreshAllData()">
          🔄 Sincronizar en vivo
        </button>
        <button class="btn-primary" type="button" (click)="probarConexion()">
          ✓ Verificar servicios
        </button>
      </div>
    </div>

    <!-- Indicadores de Conciliación y Salud -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="tiny">Estado de Plataforma</div>
        <strong style="color: var(--success);">
          {{ api.isApiConnected() ? 'Operativo 100%' : 'Modo Local' }}
        </strong>
        <small>Base de datos {{ api.lastDbCheck()?.baseDatos || 'SeparacionCuentas' }}</small>
      </div>

      <div class="stat-card">
        <div class="tiny">Total Movimientos Auditados</div>
        <strong>{{ bitacoraMovimientos().length }}</strong>
        <small>Cuentas, pagos y cobros registrados</small>
      </div>

      <div class="stat-card">
        <div class="tiny">Volumen Conciliado</div>
        <strong>&#36;{{ api.volumenTotalCuentas() | number:'1.0-0' }}</strong>
        <small>COP en {{ api.cuentas().length }} cuentas activas</small>
      </div>

      <div class="stat-card">
        <div class="tiny">Tasa de Liquidación</div>
        <strong style="color: var(--accent);">{{ porcentajeLiquidacion() }}%</strong>
        <small>Cartera pagada sobre el total dividido</small>
      </div>
    </div>

    <div class="content-grid">
      <!-- Bitácora Completa de Movimientos y Transacciones Recientes -->
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Bitácora de movimientos y transacciones</h2>
            <p class="sub">Registro cronológico de cuentas creadas, pagos recibidos y cobros pendientes.</p>
          </div>
          <select class="form-control" style="width: auto;" [(ngModel)]="filtroTipo">
            <option value="TODOS">Todos los movimientos</option>
            <option value="PAGO">Pagos recibidos</option>
            <option value="CUENTA">Cuentas creadas</option>
            <option value="PENDIENTE">Cobros pendientes</option>
          </select>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Descripción del Movimiento</th>
                <th>Usuario</th>
                <th>Canal / Referencia</th>
                <th>Monto (COP)</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              @for (mov of movimientosFiltrados(); track mov.id) {
                <tr>
                  <td>
                    <span
                      class="badge-status"
                      [class.badge-success]="mov.tipo === 'PAGO'"
                      [class.badge-info]="mov.tipo === 'CUENTA'"
                      [class.badge-warning]="mov.tipo === 'PENDIENTE'"
                    >
                      {{ mov.etiqueta }}
                    </span>
                  </td>
                  <td>
                    <strong>{{ mov.concepto }}</strong>
                    <div style="font-size: 11px; color: var(--muted);">{{ mov.detalle }}</div>
                  </td>
                  <td>{{ mov.usuario }}</td>
                  <td>{{ mov.canal }}</td>
                  <td>
                    <strong [style.color]="mov.tipo === 'PAGO' ? 'var(--success)' : mov.tipo === 'PENDIENTE' ? 'var(--warning)' : 'var(--text)'">
                      &#36;{{ mov.monto | number:'1.0-0' }}
                    </strong>
                  </td>
                  <td>{{ mov.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- Estado de Servicios y Base de Datos -->
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Servicios e infraestructura</h2>
            <p class="sub">Estado en tiempo real de los módulos de SplitIA.</p>
          </div>
          <span
            class="badge-status"
            [class.badge-success]="api.isApiConnected()"
            [class.badge-warning]="!api.isApiConnected()"
          >
            {{ api.isApiConnected() ? 'EN LÍNEA' : 'LOCAL' }}
          </span>
        </div>

        <div style="display: grid; gap: 12px;">
          <div style="padding: 13px 15px; border-radius: 13px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>Motor de Base de Datos SQL Server</strong>
              <div style="font-size: 11.5px; color: var(--muted);">
                Catálogo activo: {{ api.lastDbCheck()?.baseDatos || 'SeparacionCuentas' }}
              </div>
            </div>
            <span class="badge-status badge-success">Conectado</span>
          </div>

          <div style="padding: 13px 15px; border-radius: 13px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>Directorio de Usuarios y Accesos</strong>
              <div style="font-size: 11.5px; color: var(--muted);">Autenticación, registro y perfiles activos</div>
            </div>
            <span class="badge-status badge-success">{{ api.usuarios().length }} usuarios</span>
          </div>

          <div style="padding: 13px 15px; border-radius: 13px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>Motor de Cuentas y Liquidación</strong>
              <div style="font-size: 11.5px; color: var(--muted);">Cálculo automático de saldos y devoluciones</div>
            </div>
            <span class="badge-status badge-success">{{ api.cuentas().length }} cuentas</span>
          </div>

          <div style="padding: 13px 15px; border-radius: 13px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>Pasarela de Divisiones y Recaudo</strong>
              <div style="font-size: 11.5px; color: var(--muted);">Control de cuotas, medios de pago y referencias</div>
            </div>
            <span class="badge-status badge-success">{{ api.divisiones().length }} transacciones</span>
          </div>
        </div>
      </section>
    </div>
  `
})
export class AdminSistemaComponent {
  readonly api = inject(SeparacionCuentasService);
  private readonly toast = inject(ToastService);

  filtroTipo = 'TODOS';

  readonly porcentajeLiquidacion = computed(() => {
    const pagado = this.api.totalPagadoDivisiones();
    const total = pagado + this.api.totalPendienteDivisiones();
    if (total === 0) return 0;
    return Math.round((pagado / total) * 100);
  });

  readonly bitacoraMovimientos = computed(() => {
    const lista: Array<{
      id: string;
      tipo: 'PAGO' | 'CUENTA' | 'PENDIENTE';
      etiqueta: string;
      concepto: string;
      detalle: string;
      usuario: string;
      canal: string;
      monto: number;
      fecha: string;
    }> = [];

    const cuentasMap = new Map(this.api.cuentas().map(c => [c.idCuenta, c]));

    for (const c of this.api.cuentas()) {
      const pagador = this.api.getNombreUsuario(c.idUsuarioPagador);
      lista.push({
        id: `AUD-CTA-${c.idCuenta}`,
        tipo: 'CUENTA',
        etiqueta: 'NUEVA CUENTA',
        concepto: c.descripcion,
        detalle: `Cuenta #${c.idCuenta} registrada`,
        usuario: pagador,
        canal: 'Facturación directa',
        monto: Number(c.montoTotal),
        fecha: c.fecha
      });
    }

    for (const d of this.api.divisiones()) {
      const usuario = this.api.getNombreUsuario(d.idUsuario);
      const cuenta = cuentasMap.get(d.idCuenta);
      const nombreCuenta = cuenta ? cuenta.descripcion : `Cuenta #${d.idCuenta}`;
      const fecha = d.fechaPago || cuenta?.fecha || new Date().toISOString();

      if (d.estado === 'PAGADO') {
        lista.push({
          id: `AUD-DIV-OK-${d.idDivision}`,
          tipo: 'PAGO',
          etiqueta: 'PAGO RECIBIDO',
          concepto: `Pago de cuota · ${nombreCuenta}`,
          detalle: `Transacción #${d.idDivision} confirmada`,
          usuario,
          canal: `${d.tipoPago || 'Transferencia'}${d.referenciaPago ? ' · ' + d.referenciaPago : ''}`,
          monto: Number(d.monto),
          fecha
        });
      } else {
        lista.push({
          id: `AUD-DIV-PEN-${d.idDivision}`,
          tipo: 'PENDIENTE',
          etiqueta: 'POR COBRAR',
          concepto: `Cuota asignada · ${nombreCuenta}`,
          detalle: `División #${d.idDivision} pendiente de pago`,
          usuario,
          canal: 'Pendiente de transferencia',
          monto: Number(d.monto),
          fecha
        });
      }
    }

    return lista.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  });

  readonly movimientosFiltrados = computed(() => {
    if (this.filtroTipo === 'TODOS') return this.bitacoraMovimientos();
    return this.bitacoraMovimientos().filter(m => m.tipo === this.filtroTipo);
  });

  probarConexion(): void {
    this.api.checkDbConnection().subscribe(res => {
      if (res.conectado) {
        this.toast.show(`Todos los servicios y la base de datos (${res.baseDatos}) están operativos.`, 'success');
      } else {
        this.toast.show('Operando en modo local.', 'info');
      }
    });
  }
}
