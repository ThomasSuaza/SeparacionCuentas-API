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
        <div class="eyebrow">CONSOLA DE ADMINISTRADOR · DIAGNÓSTICO DE INFRAESTRUCTURA (.NET 10 + SQL SERVER)</div>
        <h1 class="page-title">Estado de Conexión API y Base de Datos (<code>/dbtest</code>)</h1>
        <p class="intro">
          Configura la URL del servidor ASP.NET Core, verifica la existencia de las tablas <code>dbo.Usuario</code>, <code>dbo.Cuenta</code> y <code>dbo.Division</code>, y explora el catálogo de los 20 endpoints REST.
        </p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn-outline" type="button" (click)="api.resetDemoData()">
          Restaurar Semilla Demo
        </button>
        <button class="btn-primary" type="button" (click)="probarConexion()">
          ⚡ Ejecutar GET /dbtest
        </button>
      </div>
    </div>

    <div class="content-grid" style="margin-bottom: 22px;">
      <!-- Configuración de URL de la API .NET -->
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Conexión a SeparacionCuentas-API</h2>
            <p class="sub">Puerto por defecto en <code>launchSettings.json</code>: <code>http://localhost:5266</code></p>
          </div>
          <span
            class="badge-status"
            [class.badge-success]="api.isApiConnected()"
            [class.badge-warning]="!api.isApiConnected()"
          >
            {{ api.isApiConnected() ? 'CONECTADO A .NET 10' : 'PERSISTENCIA LOCAL ACTIVA' }}
          </span>
        </div>

        <form (ngSubmit)="guardarUrl()" style="display: grid; gap: 12px;">
          <div class="form-group">
            <label>URL Base del Backend ASP.NET Core</label>
            <div style="display: flex; gap: 8px;">
              <input class="form-control" style="flex: 1;" type="text" [(ngModel)]="urlInput" name="apiUrl" />
              <button class="btn-primary" type="submit">Conectar</button>
            </div>
          </div>
        </form>

        @if (api.lastDbCheck(); as db) {
          <div style="margin-top: 18px; padding: 15px; border-radius: 13px; background: var(--surface-alt); border: 1px solid var(--border);">
            <div style="font-size: 11px; font-weight: 800; color: var(--muted); margin-bottom: 10px;">
              RESPUESTA DEL ENDPOINT GET /dbtest:
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12.5px;">
              <div>
                <span style="color: var(--muted);">Base de Datos:</span><br />
                <strong>{{ db.baseDatos }}</strong>
              </div>
              <div>
                <span style="color: var(--muted);">Estado SQL Server:</span><br />
                <strong>{{ db.conectado ? 'Conectado (Online)' : 'Modo Local (Offline Fallback)' }}</strong>
              </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap;">
              <span class="badge-status" [class.badge-success]="db.tablas.usuario">
                dbo.Usuario: {{ db.tablas.usuario ? 'OK' : 'NO' }}
              </span>
              <span class="badge-status" [class.badge-success]="db.tablas.cuenta">
                dbo.Cuenta: {{ db.tablas.cuenta ? 'OK' : 'NO' }}
              </span>
              <span class="badge-status" [class.badge-success]="db.tablas.division">
                dbo.Division: {{ db.tablas.division ? 'OK' : 'NO' }}
              </span>
            </div>
          </div>
        }
      </section>

      <!-- Catálogo de los 20 Endpoints de SeparacionCuentas-API -->
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Especificación de los 20 Endpoints REST</h2>
            <p class="sub">Integrados en <code>SeparacionCuentasService</code></p>
          </div>
          <span class="pill">OpenAPI / Swagger</span>
        </div>

        <div style="max-height: 295px; overflow-y: auto; display: grid; gap: 7px;">
          @for (ep of endpointsCatalog; track ep.ruta + ep.metodo) {
            <div style="padding: 9px 12px; border-radius: 10px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 11.5px;">
              <div>
                <span
                  class="badge-status"
                  [class.badge-info]="ep.metodo === 'GET'"
                  [class.badge-success]="ep.metodo === 'POST'"
                  [class.badge-warning]="ep.metodo === 'PUT'"
                  [class.badge-danger]="ep.metodo === 'DELETE'"
                  style="margin-right: 8px;"
                >
                  {{ ep.metodo }}
                </span>
                <code>{{ ep.ruta }}</code>
              </div>
              <span style="color: var(--muted); font-size: 11px;">{{ ep.proposito }}</span>
            </div>
          }
        </div>
      </section>
    </div>
  `
})
export class AdminSistemaComponent {
  readonly api = inject(SeparacionCuentasService);
  private readonly toast = inject(ToastService);

  urlInput = this.api.apiUrl();

  readonly endpointsCatalog = [
    { modulo: 'Usuario', metodo: 'GET', ruta: '/api/Usuario', proposito: 'Consultar todos los usuarios' },
    { modulo: 'Usuario', metodo: 'GET', ruta: '/api/Usuario/{id}', proposito: 'Consultar usuario por ID' },
    { modulo: 'Usuario', metodo: 'GET', ruta: '/api/Usuario/cuenta/{idCuenta}/participantes', proposito: 'Participantes de una cuenta' },
    { modulo: 'Usuario', metodo: 'POST', ruta: '/api/Usuario', proposito: 'Crear un usuario' },
    { modulo: 'Usuario', metodo: 'PUT', ruta: '/api/Usuario/{id}', proposito: 'Actualizar un usuario' },
    { modulo: 'Usuario', metodo: 'DELETE', ruta: '/api/Usuario/{id}', proposito: 'Eliminar un usuario' },
    { modulo: 'Cuenta', metodo: 'GET', ruta: '/api/Cuenta', proposito: 'Consultar todas las cuentas' },
    { modulo: 'Cuenta', metodo: 'GET', ruta: '/api/Cuenta/{id}', proposito: 'Consultar cuenta por ID' },
    { modulo: 'Cuenta', metodo: 'GET', ruta: '/api/Cuenta/usuario/{idUsuario}', proposito: 'Cuentas por usuario pagador' },
    { modulo: 'Cuenta', metodo: 'GET', ruta: '/api/Cuenta/{idCuenta}/devoluciones', proposito: 'Saldos, devoluciones y distribución' },
    { modulo: 'Cuenta', metodo: 'POST', ruta: '/api/Cuenta', proposito: 'Crear una cuenta' },
    { modulo: 'Cuenta', metodo: 'PUT', ruta: '/api/Cuenta/{id}', proposito: 'Actualizar una cuenta' },
    { modulo: 'Cuenta', metodo: 'DELETE', ruta: '/api/Cuenta/{id}', proposito: 'Eliminar una cuenta' },
    { modulo: 'Division', metodo: 'GET', ruta: '/api/Division', proposito: 'Consultar todas las divisiones' },
    { modulo: 'Division', metodo: 'GET', ruta: '/api/Division/{id}', proposito: 'Consultar división por ID' },
    { modulo: 'Division', metodo: 'GET', ruta: '/api/Division/cuenta/{idCuenta}', proposito: 'Divisiones de una cuenta' },
    { modulo: 'Division', metodo: 'GET', ruta: '/api/Division/usuario/{idUsuario}', proposito: 'Divisiones de un usuario' },
    { modulo: 'Division', metodo: 'POST', ruta: '/api/Division', proposito: 'Crear una división' },
    { modulo: 'Division', metodo: 'PUT', ruta: '/api/Division/{id}', proposito: 'Actualizar una división / pago' },
    { modulo: 'Division', metodo: 'DELETE', ruta: '/api/Division/{id}', proposito: 'Eliminar una división' },
    { modulo: 'Diagnóstico', metodo: 'GET', ruta: '/dbtest', proposito: 'Comprobar conexión y tablas SQL' }
  ];

  guardarUrl(): void {
    this.api.setApiUrl(this.urlInput);
    this.toast.show(`URL de API configurada en ${this.api.apiUrl()}`, 'info');
  }

  probarConexion(): void {
    this.api.checkDbConnection().subscribe(res => {
      if (res.conectado) {
        this.toast.show(`Conectado exitosamente a SQL Server (${res.baseDatos}).`, 'success');
      } else {
        this.toast.show('API .NET no detectada en ejecución; operando con persistencia local sincronizable.', 'info');
      }
    });
  }
}
