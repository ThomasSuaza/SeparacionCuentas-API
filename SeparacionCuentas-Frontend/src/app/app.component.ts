import { Component, inject } from '@angular/core';
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
        <!-- SIDEBAR DE NAVEGACIÓN (APARTADO DE USUARIO + CONSOLA DE ADMINISTRADOR) -->
        <aside class="app-sidebar">
          <a routerLink="/bienvenida" class="brand">
            <div class="mark">S</div>
            <div class="brand-name">
              slit<span style="color: var(--accent)">.</span>ia
              <small>SPLITBILL AI · .NET 10</small>
            </div>
          </a>

          <!-- Conmutador de Rol: Apartado de Usuario vs Consola de Administrador -->
          <div class="role-switcher" aria-label="Cambiar entre Usuario y Administrador">
            <button
              type="button"
              class="role-tab"
              [class.active]="auth.activeRole() === 'user'"
              (click)="switchWorkspaceRole('user')"
            >
              👤 Usuario
            </button>
            <button
              type="button"
              class="role-tab"
              [class.active]="auth.activeRole() === 'admin'"
              (click)="switchWorkspaceRole('admin')"
            >
              🛡️ Admin
            </button>
          </div>

          <!-- MENÚ APARTADO DE USUARIO -->
          <div>
            <div class="nav-label">APARTADO DE USUARIO</div>
            <div class="nav-group">
              <a
                routerLink="/usuario/panel"
                routerLinkActive="active"
                class="nav-item"
                (click)="auth.setRole('user', true)"
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
                (click)="auth.setRole('user', true)"
              >
                <span class="nav-item-left">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18"/>
                  </svg>
                  Mis cuentas
                </span>
                <span class="nav-badge">{{ api.cuentas().length }}</span>
              </a>

              <a
                routerLink="/usuario/pagos"
                routerLinkActive="active"
                class="nav-item"
                (click)="auth.setRole('user', true)"
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
                (click)="auth.setRole('user', true)"
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
                (click)="auth.setRole('user', true)"
              >
                <span class="nav-item-left">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                  </svg>
                  Mi perfil y tema
                </span>
              </a>
            </div>
          </div>

          <div class="separator"></div>

          <!-- MENÚ CONSOLA DE ADMINISTRADOR -->
          <div>
            <div class="nav-label">CONSOLA DE ADMINISTRADOR</div>
            <div class="nav-group">
              <a
                routerLink="/admin/resumen"
                routerLinkActive="active"
                class="nav-item"
                (click)="auth.setRole('admin', true)"
              >
                <span class="nav-item-left">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
                  </svg>
                  Dashboard Admin
                </span>
              </a>

              <a
                routerLink="/admin/usuarios"
                routerLinkActive="active"
                class="nav-item"
                (click)="auth.setRole('admin', true)"
              >
                <span class="nav-item-left">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/>
                    <path d="M17 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5"/>
                  </svg>
                  CRUD Usuarios
                </span>
                <span class="nav-badge">{{ api.usuarios().length }}</span>
              </a>

              <a
                routerLink="/admin/cuentas"
                routerLinkActive="active"
                class="nav-item"
                (click)="auth.setRole('admin', true)"
              >
                <span class="nav-item-left">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/>
                  </svg>
                  CRUD Cuentas
                </span>
                <span class="nav-badge">{{ api.cuentas().length }}</span>
              </a>

              <a
                routerLink="/admin/divisiones"
                routerLinkActive="active"
                class="nav-item"
                (click)="auth.setRole('admin', true)"
              >
                <span class="nav-item-left">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>
                  </svg>
                  CRUD Divisiones
                </span>
                <span class="nav-badge">{{ api.divisiones().length }}</span>
              </a>

              <a
                routerLink="/admin/sistema"
                routerLinkActive="active"
                class="nav-item"
                (click)="auth.setRole('admin', true)"
              >
                <span class="nav-item-left">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                  API .NET &amp; /dbtest
                </span>
              </a>
            </div>
          </div>

          <div class="workspace-box">
            <p>Proyecto Conectado</p>
            <div class="workspace-inner">
              <div class="ws-avatar">SI</div>
              <div>
                <strong>SeparacionCuentas-API</strong>
                <small>{{ api.isApiConnected() ? 'ASP.NET Core + SQL Server' : 'Híbrido Local + .NET API' }}</small>
              </div>
            </div>
          </div>
        </aside>

        <!-- CONTENIDO PRINCIPAL -->
        <main class="app-main">
          <!-- TOPBAR GLOBAL -->
          <header class="topbar">
            <div class="crumb">
              <span>SplitBill AI</span>
              <span style="opacity: 0.45">/</span>
              <b>{{ auth.activeRole() === 'admin' ? 'Consola de Administrador' : 'Apartado de Usuario' }}</b>
            </div>

            <div class="top-right">
              <!-- Estado de conexión con el backend .NET -->
              <a routerLink="/admin/sistema" class="api-status-pill" title="Configurar o probar conexión con SeparacionCuentas-API">
                <span class="status-dot" [class.demo]="!api.isApiConnected()"></span>
                <span>{{ api.isApiConnected() ? 'API .NET Conectada' : 'API .NET + Sync Local' }}</span>
              </a>

              <!-- Conmutador de Paletas: Blanco Hielo + Índigo vs Azul Noche + Dorado -->
              <div class="theme-toggle-bar" role="group" aria-label="Selector de modo claro y oscuro">
                <button
                  type="button"
                  class="theme-btn"
                  [class.active]="theme.currentTheme() === 'indigo'"
                  (click)="theme.setTheme('indigo')"
                  title="Modo Claro: Blanco hielo + índigo"
                >
                  <span class="theme-swatch-mini" style="background: linear-gradient(135deg, #F3F6FB 50%, #4F46E5 50%)"></span>
                  ☀️ Blanco + Índigo
                </button>
                <button
                  type="button"
                  class="theme-btn"
                  [class.active]="theme.currentTheme() === 'gold'"
                  (click)="theme.setTheme('gold')"
                  title="Modo Oscuro: Azul noche + dorado"
                >
                  <span class="theme-swatch-mini" style="background: linear-gradient(135deg, #111828 50%, #F0C674 50%)"></span>
                  🌙 Azul Noche + Dorado
                </button>
              </div>

              <!-- Selector Rápido de Usuario Activo -->
              <div class="profile-Menu">
                <div class="avatar-circle">{{ auth.iniciales() }}</div>
                <div>
                  <select
                    class="user-select-dropdown"
                    [ngModel]="auth.currentUser().idUsuario"
                    (ngModelChange)="auth.selectUser($event)"
                    aria-label="Cambiar usuario activo"
                  >
                    @for (u of api.usuarios(); track u.idUsuario) {
                      <option [ngValue]="u.idUsuario">{{ u.nombre }}</option>
                    }
                  </select>
                  <small style="display: block; font-size: 10px; color: var(--muted); margin-top: 2px;">
                    {{ auth.activeRole() === 'admin' ? 'Rol: Administrador' : 'Rol: Participante / Pagador' }}
                  </small>
                </div>
              </div>
            </div>
          </header>

          <!-- VISTAS DINÁMICAS DE ANGULAR ROUTER -->
          <router-outlet></router-outlet>

          <!-- PIE DE PÁGINA -->
          <footer style="margin-top: 32px; padding-top: 18px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; color: var(--muted); font-size: 11px;">
            <span>
              <b>SplitBill AI (slit.ia)</b> · Frontend Angular para <code>ThomasSuaza/SeparacionCuentas-API</code>
            </span>
            <span>
              Paleta activa: <b style="color: var(--accent)">{{ theme.paletteLabel() }}</b> ·
              Integrantes: Miguel Ángel Taborda, Jorge Galindo, Thomas Suaza
            </span>
          </footer>
        </main>
      </div>

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

  switchWorkspaceRole(role: 'user' | 'admin'): void {
    this.auth.setRole(role);
    if (role === 'admin') {
      this.router.navigate(['/admin/resumen']);
    } else {
      this.router.navigate(['/usuario/panel']);
    }
  }
}
