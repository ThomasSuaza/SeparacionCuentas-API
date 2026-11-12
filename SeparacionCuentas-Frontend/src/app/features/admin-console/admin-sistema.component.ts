import { Component, inject } from '@angular/core';
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
        <div class="eyebrow">SISTEMA</div>
        <h1 class="page-title">Estado de Conexión y Base de Datos</h1>
        <p class="intro">
          Verifica la conexión con el servidor y el estado de las tablas principales.
        </p>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="btn-outline" type="button" (click)="api.refreshAllData()">
          🔄 Sincronizar datos
        </button>
        <button class="btn-primary" type="button" (click)="probarConexion()">
          ⚡ Probar conexión
        </button>
      </div>
    </div>

    <div class="content-grid" style="margin-bottom: 22px;">
      <!-- Configuración de URL de la API -->
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Conexión al Servidor</h2>
            <p class="sub">Configuración del servicio de datos</p>
          </div>
          <span
            class="badge-status"
            [class.badge-success]="api.isApiConnected()"
            [class.badge-warning]="!api.isApiConnected()"
          >
            {{ api.isApiConnected() ? 'EN LÍNEA' : 'MODO LOCAL' }}
          </span>
        </div>

        <form (ngSubmit)="guardarUrl()" style="display: grid; gap: 12px;">
          <div class="form-group">
            <label>Dirección del servidor</label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <input class="form-control" style="flex: 1; min-width: 200px;" type="text" [(ngModel)]="urlInput" name="apiUrl" />
              <button class="btn-primary" type="submit">Conectar</button>
            </div>
          </div>
        </form>

        @if (api.lastDbCheck(); as db) {
          <div style="margin-top: 18px; padding: 15px; border-radius: 13px; background: var(--surface-alt); border: 1px solid var(--border);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; font-size: 12.5px;">
              <div>
                <span style="color: var(--muted);">Base de datos:</span><br />
                <strong>{{ db.baseDatos }}</strong>
              </div>
              <div>
                <span style="color: var(--muted);">Estado:</span><br />
                <strong>{{ db.conectado ? 'Conectado' : 'Modo local' }}</strong>
              </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap;">
              <span class="badge-status" [class.badge-success]="db.tablas.usuario">
                Usuarios: {{ db.tablas.usuario ? 'Activo' : 'Inactivo' }}
              </span>
              <span class="badge-status" [class.badge-success]="db.tablas.cuenta">
                Cuentas: {{ db.tablas.cuenta ? 'Activo' : 'Inactivo' }}
              </span>
              <span class="badge-status" [class.badge-success]="db.tablas.division">
                Divisiones: {{ db.tablas.division ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>
        }
      </section>

      <!-- Resumen de módulos activos -->
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Servicios activos</h2>
            <p class="sub">Módulos operativos de la plataforma</p>
          </div>
        </div>

        <div style="display: grid; gap: 10px;">
          <div style="padding: 12px 14px; border-radius: 12px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>Módulo de Usuarios</strong>
              <div style="font-size: 11.5px; color: var(--muted);">Registro, edición y participantes por cuenta</div>
            </div>
            <span class="badge-status badge-success">{{ api.usuarios().length }} registros</span>
          </div>

          <div style="padding: 12px 14px; border-radius: 12px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>Módulo de Cuentas y Saldos</strong>
              <div style="font-size: 11.5px; color: var(--muted);">Facturas compartidas y cálculo automático de devoluciones</div>
            </div>
            <span class="badge-status badge-success">{{ api.cuentas().length }} registros</span>
          </div>

          <div style="padding: 12px 14px; border-radius: 12px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>Módulo de Divisiones y Pagos</strong>
              <div style="font-size: 11.5px; color: var(--muted);">Cuotas individuales, estados de pago y comprobantes</div>
            </div>
            <span class="badge-status badge-success">{{ api.divisiones().length }} registros</span>
          </div>
        </div>
      </section>
    </div>
  `
})
export class AdminSistemaComponent {
  readonly api = inject(SeparacionCuentasService);
  private readonly toast = inject(ToastService);

  urlInput = this.api.apiUrl();

  guardarUrl(): void {
    this.api.setApiUrl(this.urlInput);
    this.toast.show(`Servidor configurado en ${this.api.apiUrl()}`, 'info');
  }

  probarConexion(): void {
    this.api.checkDbConnection().subscribe(res => {
      if (res.conectado) {
        this.toast.show(`Conectado exitosamente a la base de datos (${res.baseDatos}).`, 'success');
      } else {
        this.toast.show('Operando en modo local.', 'info');
      }
    });
  }
}
