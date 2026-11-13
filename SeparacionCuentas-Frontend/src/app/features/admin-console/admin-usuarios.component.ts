import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeparacionCuentasService } from '../../core/services/separacion-cuentas.service';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="heading-row">
      <div>
        <div class="eyebrow">DIRECTORIO DE CLIENTES · SPLITIA</div>
        <h1 class="page-title">Gestión de Usuarios</h1>
        <p class="intro">
          Administra los usuarios registrados, su historial de cuentas creadas y el estado de su cartera.
        </p>
      </div>
      <button class="btn-primary" type="button" (click)="abrirNuevoUsuario()">
        + Registrar usuario
      </button>
    </div>

    <!-- KPIs de Usuarios -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="tiny">Usuarios Registrados</div>
        <strong>{{ api.usuarios().length }}</strong>
        <small>Perfiles activos en la plataforma</small>
      </div>
      <div class="stat-card">
        <div class="tiny">Organizadores de Cuentas</div>
        <strong>{{ organizadoresCount() }}</strong>
        <small>Usuarios que han pagado cuentas</small>
      </div>
      <div class="stat-card">
        <div class="tiny">Usuarios al Día</div>
        <strong style="color: var(--success);">{{ usuariosAlDiaCount() }}</strong>
        <small>Sin cuotas pendientes de pago</small>
      </div>
      <div class="stat-card">
        <div class="tiny">Con Saldo Pendiente</div>
        <strong style="color: var(--warning);">{{ api.usuarios().length - usuariosAlDiaCount() }}</strong>
        <small>Con cobros activos por liquidar</small>
      </div>
    </div>

    <!-- Barra de búsqueda y filtro por cuenta -->
    <div class="panel" style="margin-bottom: 20px; padding: 16px;">
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
        <input
          class="form-control"
          style="flex: 1; min-width: 220px;"
          type="text"
          [(ngModel)]="busqueda"
          placeholder="Buscar usuario por nombre, correo o teléfono..."
        />

        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-size: 11.5px; font-weight: 750; color: var(--muted);">
            Filtrar por cuenta:
          </span>
          <select class="form-control" style="width: auto;" [(ngModel)]="filtroIdCuenta">
            <option [ngValue]="0">Todos los usuarios ({{ api.usuarios().length }})</option>
            @for (c of api.cuentas(); track c.idCuenta) {
              <option [ngValue]="c.idCuenta">{{ c.descripcion }}</option>
            }
          </select>
        </div>
      </div>
    </div>

    <!-- Tabla de Usuarios -->
    <section class="panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Contacto</th>
              <th>Cuentas Organizadas</th>
              <th>Cuotas Pagadas</th>
              <th>Estado de Cartera</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (u of usuariosFiltrados(); track u.idUsuario) {
              @let stats = obtenerEstadisticasUsuario(u.idUsuario);
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="person-bubble">{{ api.getIniciales(u.nombre) }}</div>
                    <div>
                      <strong style="display: block;">{{ u.nombre }}</strong>
                      <small style="font-size: 11px; color: var(--muted);">ID #{{ u.idUsuario }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="font-weight: 600;">{{ u.correo }}</div>
                  <small style="font-size: 11px; color: var(--muted);">{{ u.telefono || 'Sin teléfono' }}</small>
                </td>
                <td>
                  <strong>{{ stats.cuentasPagadas }} cuentas</strong>
                  <div style="font-size: 11px; color: var(--muted);">
                    &#36;{{ stats.volumenOrganizado | number:'1.0-0' }} COP
                  </div>
                </td>
                <td>
                  <span class="pill">{{ stats.cuotasPagadas }} / {{ stats.cuotasTotales }} pagadas</span>
                </td>
                <td>
                  @if (stats.saldoPendiente === 0) {
                    <span class="badge-status badge-success">Al día</span>
                  } @else {
                    <span class="badge-status badge-warning">
                      Pendiente &#36;{{ stats.saldoPendiente | number:'1.0-0' }}
                    </span>
                  }
                </td>
                <td>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                    <span
                      class="pill"
                      style="font-size: 10px; padding: 3px 8px; color: var(--muted);"
                      title="Por cumplimiento legal y privacidad, el administrador no puede entrar a la sesión privada del usuario sin sus credenciales."
                    >
                      🔒 Perfil privado
                    </span>
                    <button class="btn-outline btn-sm" type="button" (click)="abrirEditarUsuario(u)">
                      Editar datos
                    </button>
                    <button class="btn-danger btn-sm" type="button" (click)="eliminarUsuario(u.idUsuario)">
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

    <!-- Modal Crear / Editar Usuario -->
    @if (mostrarModal()) {
      <div class="modal-backdrop" (click)="mostrarModal.set(false)">
        <div class="modal-card" style="max-width: 480px;" (click)="$event.stopPropagation()">
          <div class="panel-head">
            <div>
              <h2>{{ editandoId() ? 'Editar usuario' : 'Registrar nuevo usuario' }}</h2>
              <p class="sub">Ingresa la información de la cuenta de usuario en SplitIA.</p>
            </div>
          </div>

          <form (ngSubmit)="guardarUsuario()" style="display: grid; gap: 14px;">
            <div class="form-group">
              <label>Nombre completo</label>
              <input class="form-control" type="text" [(ngModel)]="formNombre" name="nombre" placeholder="Ej. Laura Martínez" required />
            </div>

            <div class="form-group">
              <label>Correo electrónico</label>
              <input class="form-control" type="email" [(ngModel)]="formCorreo" name="correo" placeholder="laura@correo.com" required />
            </div>

            <div class="form-group">
              <label>Teléfono</label>
              <input class="form-control" type="text" [(ngModel)]="formTelefono" name="telefono" placeholder="300 000 0000" />
            </div>

            <div class="form-group">
              <label>Contraseña de acceso</label>
              <input class="form-control" type="password" [(ngModel)]="formPasswordHash" name="passwordHash" [placeholder]="editandoId() ? 'Dejar vacío para conservar actual' : '••••••••'" [required]="!editandoId()" />
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
              <button class="btn-outline" type="button" (click)="mostrarModal.set(false)">Cancelar</button>
              <button class="btn-primary" type="submit">
                {{ editandoId() ? 'Guardar cambios' : 'Crear usuario' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class AdminUsuariosComponent {
  readonly api = inject(SeparacionCuentasService);
  readonly auth = inject(AuthService);

  busqueda = '';
  filtroIdCuenta = 0;

  readonly mostrarModal = signal<boolean>(false);
  readonly editandoId = signal<number | null>(null);

  formNombre = '';
  formCorreo = '';
  formTelefono = '';
  formPasswordHash = '';

  readonly organizadoresCount = computed(() => {
    const ids = new Set(this.api.cuentas().map(c => c.idUsuarioPagador));
    return ids.size;
  });

  readonly usuariosAlDiaCount = computed(() => {
    const conDeuda = new Set(
      this.api
        .divisiones()
        .filter(d => d.estado === 'PENDIENTE')
        .map(d => d.idUsuario)
    );
    return this.api.usuarios().filter(u => !conDeuda.has(u.idUsuario)).length;
  });

  readonly usuariosFiltrados = computed(() => {
    let lista = this.api.usuarios();
    const idCuenta = Number(this.filtroIdCuenta);
    if (idCuenta > 0) {
      const idsParticipantes = new Set(
        this.api
          .divisiones()
          .filter(d => d.idCuenta === idCuenta)
          .map(d => d.idUsuario)
      );
      lista = lista.filter(u => idsParticipantes.has(u.idUsuario));
    }

    const q = this.busqueda.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter(
      u =>
        u.nombre.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q) ||
        (u.telefono || '').toLowerCase().includes(q)
    );
  });

  obtenerEstadisticasUsuario(idUsuario: number) {
    const cuentasPagadas = this.api.cuentas().filter(c => c.idUsuarioPagador === idUsuario);
    const volumenOrganizado = cuentasPagadas.reduce((acc, c) => acc + Number(c.montoTotal), 0);
    const misDivs = this.api.divisiones().filter(d => d.idUsuario === idUsuario);
    const cuotasPagadas = misDivs.filter(d => d.estado === 'PAGADO').length;
    const saldoPendiente = misDivs
      .filter(d => d.estado === 'PENDIENTE')
      .reduce((acc, d) => acc + Number(d.monto), 0);

    return {
      cuentasPagadas: cuentasPagadas.length,
      volumenOrganizado,
      cuotasTotales: misDivs.length,
      cuotasPagadas,
      saldoPendiente
    };
  }

  abrirNuevoUsuario(): void {
    this.editandoId.set(null);
    this.formNombre = '';
    this.formCorreo = '';
    this.formTelefono = '';
    this.formPasswordHash = '123456';
    this.mostrarModal.set(true);
  }

  abrirEditarUsuario(u: UsuarioResponse): void {
    this.editandoId.set(u.idUsuario);
    this.formNombre = u.nombre;
    this.formCorreo = u.correo;
    this.formTelefono = u.telefono || '';
    this.formPasswordHash = '';
    this.mostrarModal.set(true);
  }

  guardarUsuario(): void {
    if (!this.formNombre.trim() || !this.formCorreo.trim()) return;
    const id = this.editandoId();
    const payload = {
      nombre: this.formNombre.trim(),
      correo: this.formCorreo.trim(),
      telefono: this.formTelefono.trim() || null,
      passwordHash: this.formPasswordHash.trim() || (id ? 'HASH_UPDATED_2026' : '123456')
    };

    if (id) {
      this.api
        .updateUsuario(id, { idUsuario: id, ...payload })
        .subscribe(() => this.mostrarModal.set(false));
    } else {
      this.api.registerBackend(payload).subscribe({
        next: () => this.mostrarModal.set(false),
        error: () => {
          this.api.createUsuario(payload).subscribe(() => this.mostrarModal.set(false));
        }
      });
    }
  }

  eliminarUsuario(id: number): void {
    this.api.deleteUsuario(id).subscribe();
  }
}
