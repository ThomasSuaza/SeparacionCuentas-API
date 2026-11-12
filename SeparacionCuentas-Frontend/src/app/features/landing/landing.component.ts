import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SeparacionCuentasService } from '../../core/services/separacion-cuentas.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="display: grid; gap: 24px; padding-top: 10px;">
      <!-- Hero Principal -->
      <section class="panel" style="padding: clamp(22px, 4vw, 34px); position: relative; overflow: hidden;">
        <div style="max-width: 740px; position: relative; z-index: 1;">
          <div class="eyebrow">SPLIY.IA · CUENTAS COMPARTIDAS</div>
          <h1 class="page-title" style="font-size: clamp(26px, 3.4vw, 40px); margin-bottom: 12px;">
            Divide cuentas grupales sin discusiones ni cálculos manuales.
          </h1>
          <p class="intro" style="font-size: 14px; max-width: 620px; margin-bottom: 22px;">
            Inicia sesión o regístrate en <b>spliy.IA</b> para añadir nuevas cuentas, dividir gastos entre amigos y llevar el control en tiempo real de quién ha pagado.
          </p>

          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            @if (!auth.isLoggedIn()) {
              <button class="btn-primary" type="button" (click)="auth.openAuthModal('login')">
                Iniciar sesión
              </button>
              <button class="btn-outline" type="button" (click)="auth.openAuthModal('register')">
                + Registrarse
              </button>
            } @else {
              <button class="btn-primary" type="button" (click)="irACrearCuenta()">
                + Añadir cuenta compartida
              </button>
              <button class="btn-outline" type="button" (click)="auth.openAuthModal('switch')">
                🔄 Cambiar perfil
              </button>
              <button class="btn-danger" type="button" (click)="auth.logout()">
                Cerrar sesión
              </button>
            }
          </div>
        </div>
      </section>

      <!-- Acceso Rápido por Usuario & Registro -->
      <div class="content-grid">
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>Cuentas de usuario registradas</h2>
              <p class="sub">Selecciona tu perfil para entrar directamente a tus cuentas y pagos.</p>
            </div>
            <span class="pill">{{ api.usuarios().length }} usuarios</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">
            @for (u of api.usuarios(); track u.idUsuario) {
              <div
                style="border: 1px solid var(--border); background: var(--surface-alt); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: all 0.15s ease;"
                [style.border-color]="auth.currentUser().idUsuario === u.idUsuario ? 'var(--accent)' : 'var(--border)'"
                (click)="loginAsUser(u.idUsuario)"
              >
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div class="person-bubble">{{ api.getIniciales(u.nombre) }}</div>
                  <div style="min-width: 0;">
                    <strong style="display: block; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ u.nombre }}</strong>
                    <small style="color: var(--muted); font-size: 11px;">{{ u.correo }}</small>
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px solid var(--border); font-size: 11px;">
                  <span style="color: var(--muted);">{{ u.telefono || 'Sin teléfono' }}</span>
                  @if (auth.currentUser().idUsuario === u.idUsuario) {
                    <span class="badge-status badge-success">Activa</span>
                  } @else {
                    <span style="color: var(--accent); font-weight: 700;">Iniciar sesión →</span>
                  }
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Formulario directo de Login / Register -->
        <section class="panel">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: var(--surface-alt); padding: 4px; border-radius: 11px; border: 1px solid var(--border); margin-bottom: 16px;">
            <button
              type="button"
              style="border: 0; padding: 8px 10px; border-radius: 8px; font-size: 12px; font-weight: 800;"
              [style.background]="tab() === 'register' ? 'var(--accent)' : 'transparent'"
              [style.color]="tab() === 'register' ? 'var(--on-accent)' : 'var(--muted)'"
              (click)="tab.set('register')"
            >
              Registrarse
            </button>
            <button
              type="button"
              style="border: 0; padding: 8px 10px; border-radius: 8px; font-size: 12px; font-weight: 800;"
              [style.background]="tab() === 'login' ? 'var(--accent)' : 'transparent'"
              [style.color]="tab() === 'login' ? 'var(--on-accent)' : 'var(--muted)'"
              (click)="tab.set('login')"
            >
              Iniciar sesión
            </button>
          </div>

          @if (tab() === 'register') {
            <form (ngSubmit)="registrarUsuario()" style="display: grid; gap: 13px;">
              <div class="form-group">
                <label>Nombre completo</label>
                <input class="form-control" type="text" [(ngModel)]="nuevoNombre" name="nombre" placeholder="Ej. Laura Camila Ríos" required />
              </div>
              <div class="form-group">
                <label>Correo electrónico</label>
                <input class="form-control" type="email" [(ngModel)]="nuevoCorreo" name="correo" placeholder="laura.rios@correo.com" required />
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Teléfono / Celular</label>
                  <input class="form-control" type="text" [(ngModel)]="nuevoTelefono" name="telefono" placeholder="310 000 0000" />
                </div>
                <div class="form-group">
                  <label>Contraseña</label>
                  <input class="form-control" type="password" [(ngModel)]="nuevoPassword" name="password" placeholder="••••••••" required />
                </div>
              </div>
              <button class="btn-primary" type="submit" style="margin-top: 6px; width: 100%;">
                Crear cuenta e ingresar
              </button>
            </form>
          } @else {
            <form (ngSubmit)="iniciarSesionCorreo()" style="display: grid; gap: 13px;">
              <div class="form-group">
                <label>Correo electrónico o nombre de usuario</label>
                <input class="form-control" type="text" [(ngModel)]="correoLogin" name="correoLogin" placeholder="Ej. thomas@correo.com o Thomas" required />
              </div>
              <div class="form-group">
                <label>Contraseña</label>
                <input class="form-control" type="password" [(ngModel)]="passwordLogin" name="passwordLogin" placeholder="••••••••" required />
              </div>
              <button class="btn-primary" type="submit" style="margin-top: 6px; width: 100%;">
                Iniciar sesión e ir a mi perfil
              </button>
            </form>
          }
        </section>
      </div>
    </div>
  `
})
export class LandingComponent {
  readonly api = inject(SeparacionCuentasService);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  readonly tab = signal<'register' | 'login'>('register');

  nuevoNombre = '';
  nuevoCorreo = '';
  nuevoTelefono = '';
  nuevoPassword = '';

  correoLogin = '';
  passwordLogin = '';

  irACrearCuenta(): void {
    this.auth.setRole('user', true);
    this.router.navigate(['/usuario/cuentas']);
  }

  loginAsUser(idUsuario: number): void {
    this.auth.selectUser(idUsuario);
    this.auth.setRole('user', true);
    this.router.navigate(['/usuario/perfil']);
  }

  iniciarSesionCorreo(): void {
    if (!this.correoLogin.trim()) return;
    this.auth.loginWithCredentials(this.correoLogin, this.passwordLogin).subscribe(() => {
      this.correoLogin = '';
      this.passwordLogin = '';
      this.auth.setRole('user', true);
      this.router.navigate(['/usuario/perfil']);
    });
  }

  registrarUsuario(): void {
    if (!this.nuevoNombre.trim() || !this.nuevoCorreo.trim()) return;
    this.api
      .createUsuario({
        nombre: this.nuevoNombre.trim(),
        correo: this.nuevoCorreo.trim(),
        telefono: this.nuevoTelefono.trim() || null,
        passwordHash: this.nuevoPassword ? `HASH_${btoa(this.nuevoPassword)}` : 'HASH_DEFAULT_2026'
      })
      .subscribe(created => {
        this.nuevoNombre = '';
        this.nuevoCorreo = '';
        this.nuevoTelefono = '';
        this.nuevoPassword = '';
        this.auth.selectUser(created.idUsuario);
        this.auth.setRole('user', true);
        this.router.navigate(['/usuario/cuentas']);
      });
  }
}
