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
        <div class="eyebrow">ADMINISTRACIÓN</div>
        <h1 class="page-title">Gestión de Usuarios</h1>
        <p class="intro">
          Crea, edita o elimina usuarios y consulta en qué cuentas participan.
        </p>
      </div>
      <button class="btn-primary" type="button" (click)="abrirNuevoUsuario()">
        + Nuevo usuario
      </button>
    </div>

    <!-- Barra de búsqueda y filtro por cuenta -->
    <div class="panel" style="margin-bottom: 20px; padding: 16px;">
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
        <input
          class="form-control"
          style="flex: 1; min-width: 220px;"
          type="text"
          [(ngModel)]="busqueda"
          placeholder="Buscar por nombre, correo o teléfono..."
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
              <th>Nombre</th>
              <th>Correo electrónico</th>
              <th>Teléfono</th>
              <th>Cuentas pagadas</th>
              <th>Participaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (u of usuariosFiltrados(); track u.idUsuario) {
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: 9px;">
                    <div class="person-bubble">{{ api.getIniciales(u.nombre) }}</div>
                    <strong>{{ u.nombre }}</strong>
                  </div>
                </td>
                <td>{{ u.correo }}</td>
                <td>{{ u.telefono || 'No registrado' }}</td>
                <td>
                  <span class="badge-status badge-info">
                    {{ contarCuentasPagadas(u.idUsuario) }} cuentas
                  </span>
                </td>
                <td>
                  <span class="pill">{{ contarDivisiones(u.idUsuario) }} cuotas</span>
                </td>
                <td>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <button class="btn-outline btn-sm" type="button" (click)="auth.selectUser(u.idUsuario)">
                      Activar perfil
                    </button>
                    <button class="btn-outline btn-sm" type="button" (click)="abrirEditarUsuario(u)">
                      Editar
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
              <h2>{{ editandoId() ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
              <p class="sub">Completa los datos del participante.</p>
            </div>
          </div>

          <form (ngSubmit)="guardarUsuario()" style="display: grid; gap: 14px;">
            <div class="form-group">
              <label>Nombre completo</label>
              <input class="form-control" type="text" [(ngModel)]="formNombre" name="nombre" required />
            </div>

            <div class="form-group">
              <label>Correo electrónico</label>
              <input class="form-control" type="email" [(ngModel)]="formCorreo" name="correo" required />
            </div>

            <div class="form-group">
              <label>Teléfono</label>
              <input class="form-control" type="text" [(ngModel)]="formTelefono" name="telefono" placeholder="+57 300 000 0000" />
            </div>

            <div class="form-group">
              <label>Contraseña</label>
              <input class="form-control" type="password" [(ngModel)]="formPasswordHash" name="passwordHash" required />
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
  formPasswordHash = 'HASH_BCRYPT_2026';

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

  contarCuentasPagadas(idUsuario: number): number {
    return this.api.cuentas().filter(c => c.idUsuarioPagador === idUsuario).length;
  }

  contarDivisiones(idUsuario: number): number {
    return this.api.divisiones().filter(d => d.idUsuario === idUsuario).length;
  }

  abrirNuevoUsuario(): void {
    this.editandoId.set(null);
    this.formNombre = '';
    this.formCorreo = '';
    this.formTelefono = '';
    this.formPasswordHash = 'HASH_SHA256_SPLITBILL';
    this.mostrarModal.set(true);
  }

  abrirEditarUsuario(u: UsuarioResponse): void {
    this.editandoId.set(u.idUsuario);
    this.formNombre = u.nombre;
    this.formCorreo = u.correo;
    this.formTelefono = u.telefono || '';
    this.formPasswordHash = 'HASH_SHA256_SPLITBILL';
    this.mostrarModal.set(true);
  }

  guardarUsuario(): void {
    if (!this.formNombre.trim() || !this.formCorreo.trim()) return;
    const id = this.editandoId();
    if (id) {
      this.api
        .updateUsuario(id, {
          idUsuario: id,
          nombre: this.formNombre.trim(),
          correo: this.formCorreo.trim(),
          telefono: this.formTelefono.trim() || null,
          passwordHash: this.formPasswordHash.trim() || 'HASH_DEFAULT'
        })
        .subscribe(() => this.mostrarModal.set(false));
    } else {
      this.api
        .createUsuario({
          nombre: this.formNombre.trim(),
          correo: this.formCorreo.trim(),
          telefono: this.formTelefono.trim() || null,
          passwordHash: this.formPasswordHash.trim() || 'HASH_DEFAULT'
        })
        .subscribe(() => this.mostrarModal.set(false));
    }
  }

  eliminarUsuario(id: number): void {
    this.api.deleteUsuario(id).subscribe();
  }
}
