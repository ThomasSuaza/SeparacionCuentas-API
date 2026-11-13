import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { SeparacionCuentasService } from './core/services/separacion-cuentas.service';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <div class="app-theme" [attr.data-theme]="theme.currentTheme()">
      <div class="shell">
        @if (mobileMenuOpen()) {
          <div class="sidebar-backdrop" (click)="mobileMenuOpen.set(false)"></div>
        }

        <!-- SIDEBAR DE NAVEGACIÓN -->
        <aside class="app-sidebar" [class.open]="mobileMenuOpen()">
          <div class="brand">
            <a routerLink="/bienvenida" style="display: flex; align-items: center; gap: 11px;" (click)="closeMobileMenu()">
              <div class="mark">S</div>
              <div class="brand-name">
                Split<span style="color: var(--accent)">IA</span>
                <small>CUENTAS COMPARTIDAS</small>
              </div>
            </a>
            <button type="button" class="sidebar-close-btn" (click)="closeMobileMenu()" aria-label="Cerrar menú">
              ✕
            </button>
          </div>

          @if (auth.activeRole() === 'admin') {
            <!-- MENÚ EXCLUSIVO DE ADMINISTRACIÓN (Solo visible en rutas /admin) -->
            <div>
              <div class="nav-label">ADMINISTRACIÓN</div>
              <div class="nav-group">
                <a
                  routerLink="/admin/resumen"
                  routerLinkActive="active"
                  class="nav-item"
                  (click)="navigateRole('admin')"
                >
                  <span class="nav-item-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
                    </svg>
                    Panel de control
                  </span>
                </a>

                <a
                  routerLink="/admin/usuarios"
                  routerLinkActive="active"
                  class="nav-item"
                  (click)="navigateRole('admin')"
                >
                  <span class="nav-item-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/>
                      <path d="M17 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5"/>
                    </svg>
                    Usuarios
                  </span>
                  <span class="nav-badge">{{ api.usuarios().length }}</span>
                </a>

                <a
                  routerLink="/admin/cuentas"
                  routerLinkActive="active"
                  class="nav-item"
                  (click)="navigateRole('admin')"
                >
                  <span class="nav-item-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/>
                    </svg>
                    Cuentas y facturas
                  </span>
                  <span class="nav-badge">{{ api.cuentas().length }}</span>
                </a>

                <a
                  routerLink="/admin/divisiones"
                  routerLinkActive="active"
                  class="nav-item"
                  (click)="navigateRole('admin')"
                >
                  <span class="nav-item-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>
                    </svg>
                    Transacciones
                  </span>
                  <span class="nav-badge">{{ api.divisiones().length }}</span>
                </a>

                <a
                  routerLink="/admin/sistema"
                  routerLinkActive="active"
                  class="nav-item"
                  (click)="navigateRole('admin')"
                >
                  <span class="nav-item-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                    </svg>
                    Auditoría
                  </span>
                </a>

                <a
                  routerLink="/usuario/perfil"
                  routerLinkActive="active"
                  class="nav-item"
                  (click)="closeMobileMenu()"
                >
                  <span class="nav-item-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                    </svg>
                    Mi perfil Admin
                  </span>
                </a>
              </div>

              <div class="separator"></div>
              <button
                type="button"
                class="btn-outline btn-sm"
                style="width: 100%;"
                (click)="abrirModalAuth('switch')"
              >
                🔄 Cambiar de perfil
              </button>
            </div>
          } @else {
            <!-- MENÚ DE LA VISTA DE USUARIO (Sin apartado administrativo) -->
            <div>
              <div class="nav-label">MENÚ PRINCIPAL</div>
              <div class="nav-group">
                <a
                  routerLink="/usuario/panel"
                  routerLinkActive="active"
                  class="nav-item"
                  (click)="navigateRole('user')"
                >
                  <span class="nav-item-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                    Panel general
                  </span>
                </a>

                <a
                  routerLink="/usuario/cuentas"
                  routerLinkActive="active"
                  class="nav-item"
                  (click)="navigateRole('user')"
                >
                  <span class="nav-item-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18"/>
                    </svg>
                    Mis cuentas
                  </span>
                  <span class="nav-badge">{{ auth.misCuentasUsuario().length }}</span>
                </a>

                <a
                  routerLink="/usuario/pagos"
                  routerLinkActive="active"
                  class="nav-item"
                  (click)="navigateRole('user')"
                >
                  <span class="nav-item-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    Mis pagos
                  </span>
                </a>

                <a
                  routerLink="/usuario/saldos"
                  routerLinkActive="active"
                  class="nav-item"
                  (click)="navigateRole('user')"
                >
                  <span class="nav-item-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M5 8h14M5 12h14M5 16h9"/><path d="M4 3h16v18H4z"/>
                    </svg>
                    Saldos y devoluciones
                  </span>
                </a>

                <a
                  routerLink="/usuario/perfil"
                  routerLinkActive="active"
                  class="nav-item"
                  (click)="navigateRole('user')"
                >
                  <span class="nav-item-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                    </svg>
                    Mi perfil
                  </span>
                </a>
              </div>
            </div>
          }
        </aside>

        <!-- CONTENIDO PRINCIPAL -->
        <main class="app-main">
          <!-- TOPBAR GLOBAL -->
          <header class="topbar">
            <div class="topbar-left">
              <button
                type="button"
                class="mobile-menu-btn"
                (click)="mobileMenuOpen.set(true)"
                aria-label="Abrir menú de navegación"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M3 6h18M3 12h18M3 18h18"/>
                </svg>
              </button>

              <div class="crumb">
                <span>SplitIA</span>
                <span style="opacity: 0.45">/</span>
                <b>{{ auth.activeRole() === 'admin' ? 'Consola de Administrador' : 'Portal de Usuario' }}</b>
              </div>
            </div>

            <div class="top-right">
              <!-- Un solo botón limpio para cambiar entre Modo Claro y Modo Oscuro -->
              <button
                type="button"
                class="theme-single-btn"
                (click)="theme.toggleTheme()"
                [attr.aria-label]="theme.isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
              >
                @if (theme.isDark()) {
                  <span>☀️</span>
                  <span>Modo claro</span>
                } @else {
                  <span>🌙</span>
                  <span>Modo oscuro</span>
                }
              </button>

              @if (!auth.isLoggedIn()) {
                <!-- Cuando NO ha iniciado sesión: Mostrar Iniciar sesión y Registrarse -->
                <button
                  type="button"
                  class="btn-outline btn-sm"
                  (click)="abrirModalAuth('login')"
                >
                  Iniciar sesión
                </button>

                <button
                  type="button"
                  class="btn-primary btn-sm"
                  (click)="abrirModalAuth('register')"
                >
                  + Registrarse
                </button>
              } @else {
                <!-- Cuando YA inició sesión: Mostrar Cambiar perfil, Cerrar sesión y Badge de Perfil -->
                <button
                  type="button"
                  class="btn-outline btn-sm"
                  (click)="abrirModalAuth('switch')"
                >
                  🔄 Cambiar perfil
                </button>

                <button
                  type="button"
                  class="btn-danger btn-sm"
                  (click)="cerrarSesion()"
                >
                  Cerrar sesión
                </button>

                <a
                  routerLink="/usuario/perfil"
                  class="profile-Menu"
                  style="cursor: pointer;"
                  title="Ver mi perfil activo"
                >
                  <div class="avatar-circle">{{ auth.iniciales() }}</div>
                  <div style="line-height: 1.2;">
                    <strong style="font-size: 12px; display: block;">{{ auth.currentUser().nombre }}</strong>
                    <small style="font-size: 10px; color: var(--accent); font-weight: 700;">
                      {{ auth.isAdminSession() ? '🛡️ Perfil Admin →' : 'Ver mi perfil →' }}
                    </small>
                  </div>
                </a>
              }
            </div>
          </header>

          <!-- VISTAS DINÁMICAS DE ANGULAR ROUTER -->
          <div class="main-body">
            <router-outlet></router-outlet>
          </div>

          <!-- PIE DE PÁGINA LIMPIO -->
          <footer class="app-footer">
            <span>© 2026 SplitIA</span>
            <span>Gestión inteligente de cuentas compartidas</span>
          </footer>
        </main>
      </div>

      <!-- MODAL GLOBAL DE LOGIN / CAMBIO DE PERFIL / REGISTER -->
      @if (auth.authModalMode(); as mode) {
        <div class="modal-backdrop" (click)="auth.closeAuthModal()">
          <div class="modal-card" style="max-width: 500px;" (click)="$event.stopPropagation()">
            <!-- Pestañas Selección de Perfil / Nuevo Usuario -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: var(--surface-alt); padding: 5px; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 18px;">
              <button
                type="button"
                style="border: 0; padding: 9px 12px; border-radius: 9px; font-size: 12.5px; font-weight: 800; transition: all 0.15s ease;"
                [style.background]="mode !== 'register' ? 'var(--accent)' : 'transparent'"
                [style.color]="mode !== 'register' ? 'var(--on-accent)' : 'var(--muted)'"
                (click)="auth.openAuthModal('switch')"
              >
                {{ auth.isLoggedIn() ? '🔄 Cambiar de perfil' : 'Iniciar sesión (Login)' }}
              </button>
              <button
                type="button"
                style="border: 0; padding: 9px 12px; border-radius: 9px; font-size: 12.5px; font-weight: 800; transition: all 0.15s ease;"
                [style.background]="mode === 'register' ? 'var(--accent)' : 'transparent'"
                [style.color]="mode === 'register' ? 'var(--on-accent)' : 'var(--muted)'"
                (click)="auth.openAuthModal('register')"
              >
                + Nuevo perfil (Register)
              </button>
            </div>

            @if (mode !== 'register') {
              <div class="panel-head" style="margin-bottom: 12px;">
                <div>
                  <h2>{{ auth.isLoggedIn() ? 'Autenticación para cambiar de cuenta' : 'Iniciar sesión en SplitIA' }}</h2>
                  <p class="sub">
                    Por seguridad y privacidad, ingresa el <b>correo electrónico</b> y la <b>contraseña</b> de la cuenta a la que deseas acceder.
                  </p>
                </div>
              </div>

              <form (ngSubmit)="submitLogin()" style="display: grid; gap: 13px; margin-bottom: 18px;">
                <div class="form-group">
                  <label>Correo electrónico</label>
                  <input
                    class="form-control"
                    type="email"
                    [(ngModel)]="loginCorreo"
                    name="loginCorreo"
                    placeholder="Ej. thomas@correo.com o admin@splitia.app"
                    required
                  />
                </div>
                <div class="form-group">
                  <label>Contraseña</label>
                  <input
                    class="form-control"
                    type="password"
                    [(ngModel)]="loginPassword"
                    name="loginPassword"
                    placeholder="Ingresa tu contraseña"
                    required
                  />
                </div>
                <button class="btn-primary" type="submit" style="width: 100%; margin-top: 4px;">
                  Autenticar e iniciar sesión
                </button>
              </form>

              <!-- Directorio de correos registrados (solo rellena el campo correo; exige contraseña) -->
              <div style="border-top: 1px solid var(--border); padding-top: 13px;">
                <div style="font-size: 10.5px; font-weight: 800; color: var(--muted); margin-bottom: 8px; text-transform: uppercase;">
                  Correos registrados (haz clic para autocompletar correo; clave demo usuarios: 123456):
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 130px; overflow-y: auto;">
                  <button
                    type="button"
                    class="btn-outline btn-sm"
                    style="font-size: 11px; padding: 4px 10px;"
                    [style.border-color]="loginCorreo === 'admin@splitia.app' ? 'var(--accent)' : 'var(--border)'"
                    (click)="loginCorreo = 'admin@splitia.app'; loginPassword = 'admin123'"
                  >
                    🛡️ admin&#64;splitia.app (Clave: admin123)
                  </button>
                  @for (u of api.usuarios(); track u.idUsuario) {
                    <button
                      type="button"
                      class="btn-outline btn-sm"
                      style="font-size: 11px; padding: 4px 10px;"
                      [style.border-color]="loginCorreo === u.correo ? 'var(--accent)' : 'var(--border)'"
                      (click)="rellenarCorreo(u.correo)"
                    >
                      👤 {{ u.correo }}
                    </button>
                  }
                </div>
              </div>
            } @else {
              <div class="panel-head" style="margin-bottom: 12px;">
                <div>
                  <h2>Crear cuenta en SplitIA</h2>
                  <p class="sub">Registra un nuevo usuario para añadir cuentas y participar en divisiones.</p>
                </div>
              </div>

              <form (ngSubmit)="submitRegister()" style="display: grid; gap: 13px;">
                <div class="form-group">
                  <label>Nombre completo</label>
                  <input
                    class="form-control"
                    type="text"
                    [(ngModel)]="regNombre"
                    name="regNombre"
                    placeholder="Ej. Camilo Restrepo"
                    required
                  />
                </div>

                <div class="form-group">
                  <label>Correo electrónico</label>
                  <input
                    class="form-control"
                    type="email"
                    [(ngModel)]="regCorreo"
                    name="regCorreo"
                    placeholder="camilo@correo.com"
                    required
                  />
                </div>

                <div class="form-grid">
                  <div class="form-group">
                    <label>Teléfono / Celular</label>
                    <input
                      class="form-control"
                      type="text"
                      [(ngModel)]="regTelefono"
                      name="regTelefono"
                      placeholder="300 000 0000"
                    />
                  </div>

                  <div class="form-group">
                    <label>Contraseña</label>
                    <input
                      class="form-control"
                      type="password"
                      [(ngModel)]="regPassword"
                      name="regPassword"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
                  <button class="btn-outline" type="button" (click)="auth.closeAuthModal()">Cancelar</button>
                  <button class="btn-primary" type="submit">
                    Crear cuenta e ingresar
                  </button>
                </div>
              </form>
            }
          </div>
        </div>
      }

      <!-- SISTEMA GLOBAL DE NOTIFICACIONES TOAST -->
      <div class="toast-container" role="status" aria-live="polite">
        @for (t of toastService.toasts(); track t.id) {
          <div class="toast-item">
            <span>{{ t.text }}</span>
            <button
              type="button"
              style="border: 0; background: transparent; color: var(--muted); font-weight: 800;"
              (click)="toastService.dismiss(t.id)"
            >
              ✕
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class AppComponent {
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly api = inject(SeparacionCuentasService);
  readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly mobileMenuOpen = signal<boolean>(false);

  loginCorreo = '';
  loginPassword = '';

  regNombre = '';
  regCorreo = '';
  regTelefono = '';
  regPassword = '';

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  navigateRole(role: 'user' | 'admin'): void {
    this.auth.setRole(role, true);
    this.closeMobileMenu();
  }

  switchWorkspaceRole(role: 'user' | 'admin'): void {
    this.auth.setRole(role);
    this.closeMobileMenu();
    if (role === 'admin') {
      this.router.navigate(['/admin/resumen']);
    } else {
      this.router.navigate(['/usuario/panel']);
    }
  }

  abrirModalAuth(mode: 'login' | 'register' | 'switch'): void {
    this.loginCorreo = '';
    this.loginPassword = '';
    this.auth.openAuthModal(mode);
  }

  rellenarCorreo(correo: string): void {
    this.loginCorreo = correo;
  }

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/usuario/perfil']);
  }

  submitLogin(): void {
    if (!this.loginCorreo.trim() || !this.loginPassword.trim()) return;
    this.auth.loginWithCredentials(this.loginCorreo, this.loginPassword).subscribe(user => {
      if (!user) return;
      this.loginCorreo = '';
      this.loginPassword = '';
      this.auth.closeAuthModal();
      if (this.auth.isAdminSession() || user.rol === 'ADMIN') {
        this.router.navigate(['/admin/resumen']);
      } else {
        this.router.navigate(['/usuario/panel']);
      }
    });
  }

  submitRegister(): void {
    if (!this.regNombre.trim() || !this.regCorreo.trim() || !this.regPassword.trim()) return;
    const correoLimpio = this.regCorreo.trim();
    const passLimpia = this.regPassword.trim();
    this.api
      .registerBackend({
        nombre: this.regNombre.trim(),
        correo: correoLimpio,
        telefono: this.regTelefono.trim() || null,
        passwordHash: passLimpia
      })
      .subscribe({
        next: created => {
          this.auth.saveUserPassword(correoLimpio, passLimpia);
          this.regNombre = '';
          this.regCorreo = '';
          this.regTelefono = '';
          this.regPassword = '';
          this.auth.selectUser(created.idUsuario);
          this.auth.closeAuthModal();
          this.router.navigate(['/usuario/panel']);
        },
        error: () => {
          // Si no hay conexión HTTP activa, crea con fallback local
          this.api
            .createUsuario({
              nombre: this.regNombre.trim(),
              correo: correoLimpio,
              telefono: this.regTelefono.trim() || null,
              passwordHash: `HASH_${btoa(passLimpia)}`
            })
            .subscribe(created => {
              this.auth.saveUserPassword(correoLimpio, passLimpia);
              this.regNombre = '';
              this.regCorreo = '';
              this.regTelefono = '';
              this.regPassword = '';
              this.auth.selectUser(created.idUsuario);
              this.auth.closeAuthModal();
              this.router.navigate(['/usuario/panel']);
            });
        }
      });
  }
}
