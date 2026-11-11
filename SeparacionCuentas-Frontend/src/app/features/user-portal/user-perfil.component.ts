import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeparacionCuentasService } from '../../core/services/separacion-cuentas.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-user-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="heading-row">
      <div>
        <div class="eyebrow">PREFERENCIAS Y PERFIL DE USUARIO</div>
        <h1 class="page-title">Configuración de Mi Cuenta</h1>
        <p class="intro">
          Actualiza tus datos personales en <code>PUT /api/Usuario/{{ auth.currentUser().idUsuario }}</code> y personaliza el tema visual.
        </p>
      </div>
    </div>

    <div class="content-grid">
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Datos personales del usuario activo</h2>
            <p class="sub">ID de Usuario en SQL Server: <b>#{{ auth.currentUser().idUsuario }}</b></p>
          </div>
          <span class="pill">PUT /api/Usuario/{{ auth.currentUser().idUsuario }}</span>
        </div>

        <form (ngSubmit)="guardarPerfil()" style="display: grid; gap: 14px;">
          <div class="form-group">
            <label>Nombre completo (<code>nombre</code>)</label>
            <input class="form-control" type="text" [(ngModel)]="nombre" name="nombre" required />
          </div>

          <div class="form-group">
            <label>Correo electrónico (<code>correo</code>)</label>
            <input class="form-control" type="email" [(ngModel)]="correo" name="correo" required />
          </div>

          <div class="form-group">
            <label>Teléfono móvil / Nequi / DaviPlata (<code>telefono</code>)</label>
            <input class="form-control" type="text" [(ngModel)]="telefono" name="telefono" />
          </div>

          <div class="form-group">
            <label>Nueva Contraseña (se almacena como <code>password_hash</code>)</label>
            <input class="form-control" type="password" [(ngModel)]="password" name="password" placeholder="Dejar igual o escribir nueva" />
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
            <button class="btn-primary" type="submit">Guardar Cambios en API</button>
          </div>
        </form>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Paleta de Colores (Modo Claro / Modo Oscuro)</h2>
            <p class="sub">Configura tu paleta preferida para SplitBill AI.</p>
          </div>
          <span class="pill">UI Theme</span>
        </div>

        <div style="display: grid; gap: 12px;">
          <div
            style="padding: 16px; border-radius: 14px; border: 1.5px solid var(--border); cursor: pointer; display: flex; align-items: center; justify-content: space-between;"
            [style.border-color]="theme.currentTheme() === 'indigo' ? 'var(--accent)' : 'var(--border)'"
            (click)="theme.setTheme('indigo')"
          >
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="palette-swatch" style="width: 38px; height: 38px; background: linear-gradient(135deg, #F3F6FB 50%, #4F46E5 50%);"></span>
              <div>
                <strong style="display: block; font-size: 13.5px;">Blanco Hielo + Índigo (Modo Claro)</strong>
                <small style="color: var(--muted);">Fondo #F3F6FB · Superficie #FFFFFF · Acento #4F46E5 · Sidebar #18253B</small>
              </div>
            </div>
            @if (theme.currentTheme() === 'indigo') {
              <span class="badge-status badge-success">Activo</span>
            }
          </div>

          <div
            style="padding: 16px; border-radius: 14px; border: 1.5px solid var(--border); cursor: pointer; display: flex; align-items: center; justify-content: space-between;"
            [style.border-color]="theme.currentTheme() === 'gold' ? 'var(--accent)' : 'var(--border)'"
            (click)="theme.setTheme('gold')"
          >
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="palette-swatch" style="width: 38px; height: 38px; background: linear-gradient(135deg, #111828 50%, #F0C674 50%);"></span>
              <div>
                <strong style="display: block; font-size: 13.5px;">Azul Noche + Dorado (Modo Oscuro)</strong>
                <small style="color: var(--muted);">Fondo #111828 · Superficie #1C293A · Acento #F0C674 · Sidebar #101623</small>
              </div>
            </div>
            @if (theme.currentTheme() === 'gold') {
              <span class="badge-status badge-success">Activo</span>
            }
          </div>
        </div>
      </section>
    </div>
  `
})
export class UserPerfilComponent {
  readonly api = inject(SeparacionCuentasService);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

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
