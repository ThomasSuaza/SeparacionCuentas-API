import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeparacionCuentasService } from '../../core/services/separacion-cuentas.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="heading-row">
      <div>
        <div class="eyebrow">MI PERFIL</div>
        <h1 class="page-title">Configuración de Cuenta</h1>
        <p class="intro">
          Actualiza tu información de contacto y datos personales.
        </p>
      </div>
    </div>

    <div style="max-width: 620px;">
      <section class="panel">
        <div class="panel-head">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="avatar-circle" style="width: 44px; height: 44px; font-size: 15px;">
              {{ auth.iniciales() }}
            </div>
            <div>
              <h2>{{ auth.currentUser().nombre }}</h2>
              <p class="sub">{{ auth.currentUser().correo }}</p>
            </div>
          </div>
        </div>

        <form (ngSubmit)="guardarPerfil()" style="display: grid; gap: 14px;">
          <div class="form-group">
            <label>Nombre completo</label>
            <input class="form-control" type="text" [(ngModel)]="nombre" name="nombre" required />
          </div>

          <div class="form-group">
            <label>Correo electrónico</label>
            <input class="form-control" type="email" [(ngModel)]="correo" name="correo" required />
          </div>

          <div class="form-group">
            <label>Teléfono móvil / Nequi / DaviPlata</label>
            <input class="form-control" type="text" [(ngModel)]="telefono" name="telefono" />
          </div>

          <div class="form-group">
            <label>Nueva contraseña</label>
            <input class="form-control" type="password" [(ngModel)]="password" name="password" placeholder="Dejar en blanco para mantener la actual" />
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
            <button class="btn-primary" type="submit">Guardar cambios</button>
          </div>
        </form>
      </section>
    </div>
  `
})
export class UserPerfilComponent {
  readonly api = inject(SeparacionCuentasService);
  readonly auth = inject(AuthService);

  nombre = '';
  correo = '';
  telefono = '';
  password = '';

  constructor() {
    effect(() => {
      const u = this.auth.currentUser();
      this.nombre = u.nombre;
      this.correo = u.correo;
      this.telefono = u.telefono || '';
    });
  }

  guardarPerfil(): void {
    const u = this.auth.currentUser();
    this.api
      .updateUsuario(u.idUsuario, {
        idUsuario: u.idUsuario,
        nombre: this.nombre.trim(),
        correo: this.correo.trim(),
        telefono: this.telefono.trim() || null,
        passwordHash: this.password ? `HASH_${btoa(this.password)}` : 'HASH_UPDATED_2026'
      })
      .subscribe();
  }
}
