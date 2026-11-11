import { Component, inject, signal } from '@angular/core';
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
        <div class="eyebrow">CONSOLA DE ADMINISTRADOR · MÓDULO CUENTAS (/api/Cuenta)</div>
        <h1 class="page-title">Administración de Cuentas y Devoluciones</h1>
        <p class="intro">
          Control total sobre <code>dbo.Cuenta</code>: creación, edición de montos y pagadores, eliminación en cascada e inspección del DTO <code>ResumenDevolucionCuentaResponse</code>.
        </p>
      </div>
      <button class="btn-primary" type="button" (click)="abrirCrearCuenta()">
        + Nueva Cuenta (POST /api/Cuenta)
      </button>
    </div>

    <section class="panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID Cuenta</th>
              <th>Descripción</th>
              <th>Usuario Pagador (FK)</th>
              <th>Monto Total</th>
              <th>Suma Divisiones</th>
              <th>Diferencia</th>
              <th>Estado Distribución</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (c of api.cuentas(); track c.idCuenta) {
              @let dev = api.calcularDevolucionesLocal(c.idCuenta);
              <tr>
                <td><b>#00{{ c.idCuenta }}</b></td>
                <td><strong>{{ c.descripcion }}</strong></td>
                <td>
                  {{ api.getNombreUsuario(c.idUsuarioPagador) }}
                  <small style="color: var(--muted); display: block;">ID #{{ c.idUsuarioPagador }}</small>
                </td>
                <td><strong>&#36;{{ c.montoTotal | number:'1.0-0' }} COP</strong></td>
                <td>&#36;{{ dev.totalDivisiones | number:'1.0-0' }} COP</td>
                <td>&#36;{{ dev.diferencia | number:'1.0-0' }} COP</td>
                <td>
                  <span
                    class="badge-status"
                    [class.badge-success]="dev.estadoDistribucion === 'COMPLETA'"
                    [class.badge-warning]="dev.estadoDistribucion === 'PENDIENTE'"
                    [class.badge-danger]="dev.estadoDistribucion === 'EXCEDIDA'"
                  >
                    {{ dev.estadoDistribucion }}
                  </span>
                </td>
                <td>{{ c.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <button class="btn-outline btn-sm" type="button" (click)="inspeccionarDevolucion(c.idCuenta)">
                      JSON Devoluciones
                    </button>
                    <button class="btn-outline btn-sm" type="button" (click)="abrirEditarCuenta(c)">
                      Editar
                    </button>
                    <button class="btn-danger btn-sm" type="button" (click)="api.deleteCuenta(c.idCuenta).subscribe()">
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
        <div class="modal-card" style="max-width: 500px;" (click)="$event.stopPropagation()">
          <div class="panel-head">
            <div>
              <h2>{{ editandoId() ? 'Editar Cuenta #00' + editandoId() : 'Registrar Cuenta (POST /api/Cuenta)' }}</h2>
              <p class="sub">Entidad <code>ApiCQRS.Models.Cuenta</code></p>
            </div>
            <span class="pill">dbo.Cuenta</span>
          </div>

          <form (ngSubmit)="guardarCuenta()" style="display: grid; gap: 14px;">
            <div class="form-group">
              <label>Descripción (<code>descripcion</code>)</label>
              <input class="form-control" type="text" [(ngModel)]="formDescripcion" name="descripcion" required />
            </div>

            <div class="form-group">
              <label>Usuario Pagador (<code>id_usuario_pagador</code>)</label>
              <select class="form-control" [(ngModel)]="formIdUsuarioPagador" name="idUsuarioPagador">
                @for (u of api.usuarios(); track u.idUsuario) {
                  <option [ngValue]="u.idUsuario">{{ u.nombre }} (ID #{{ u.idUsuario }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Monto Total (<code>monto_total &gt; 0</code>)</label>
              <input class="form-control" type="number" [(ngModel)]="formMontoTotal" name="montoTotal" min="1" required />
            </div>

            <div class="form-group">
              <label>Fecha (<code>fecha</code>)</label>
              <input class="form-control" type="datetime-local" [(ngModel)]="formFecha" name="fecha" required />
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
              <button class="btn-outline" type="button" (click)="mostrarModal.set(false)">Cancelar</button>
              <button class="btn-primary" type="submit">Guardar en API</button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal Inspector JSON de GET /api/Cuenta/{idCuenta}/devoluciones -->
    @if (jsonInspeccionado(); as dto) {
      <div class="modal-backdrop" (click)="jsonInspeccionado.set(null)">
        <div class="modal-card" style="max-width: 680px;" (click)="$event.stopPropagation()">
          <div class="panel-head">
            <div>
              <h2>Respuesta de <code>GET /api/Cuenta/{{ dto.idCuenta }}/devoluciones</code></h2>
              <p class="sub">DTO <code>ResumenDevolucionCuentaResponse</code></p>
            </div>
            <button class="btn-outline btn-sm" type="button" (click)="jsonInspeccionado.set(null)">Cerrar</button>
          </div>
          <pre
            style="background: var(--surface-alt); border: 1px solid var(--border); border-radius: 12px; padding: 16px; font-size: 12px; overflow-x: auto; max-height: 440px;"
          >{{ dto | json }}</pre>
        </div>
      </div>
    }
  `
})
export class AdminCuentasComponent {
  readonly api = inject(SeparacionCuentasService);

  readonly mostrarModal = signal<boolean>(false);
  readonly editandoId = signal<number | null>(null);
  readonly jsonInspeccionado = signal<ResumenDevolucionCuentaResponse | null>(null);

  formDescripcion = '';
  formIdUsuarioPagador = 1;
  formMontoTotal = 150000;
  formFecha = '2026-11-10T19:00';

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
