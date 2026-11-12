import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { UsuarioResponse, WorkspaceRole } from '../models/api.models';
import { SeparacionCuentasService } from './separacion-cuentas.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_KEY = 'slit_ia_active_user_id';
  private readonly ROLE_KEY = 'slit_ia_active_role';
  private readonly LOGGED_KEY = 'slit_ia_is_logged_in';
  private readonly ADMIN_SESSION_KEY = 'slit_ia_is_admin_session';

  readonly activeUserId = signal<number>(this.loadSavedUserId());
  readonly activeRole = signal<WorkspaceRole>(this.loadSavedRole());
  readonly isLoggedIn = signal<boolean>(this.loadSavedLoggedState());
  readonly isAdminSession = signal<boolean>(this.loadSavedAdminSession());
  readonly authModalMode = signal<'login' | 'register' | 'switch' | null>(null);

  readonly adminProfile: UsuarioResponse = {
    idUsuario: 999,
    nombre: 'Administrador spliy.IA',
    correo: 'admin@spliy.ia',
    telefono: '+57 300 000 0000'
  };

  readonly currentUser = computed<UsuarioResponse>(() => {
    if (this.isAdminSession()) {
      return this.adminProfile;
    }
    const list = this.api.usuarios();
    const found = list.find(u => u.idUsuario === this.activeUserId());
    if (found) return found;
    return (
      list[0] || {
        idUsuario: 1,
        nombre: 'Thomas',
        correo: 'thomas@correo.com',
        telefono: '3001112233'
      }
    );
  });

  readonly iniciales = computed(() => {
    if (this.isAdminSession()) return 'AD';
    return this.api.getIniciales(this.currentUser().nombre);
  });

  constructor(
    private api: SeparacionCuentasService,
    private toast: ToastService
  ) {}

  private loadSavedUserId(): number {
    try {
      const val = Number(localStorage.getItem(this.USER_KEY));
      return val > 0 ? val : 1;
    } catch {
      return 1;
    }
  }

  private loadSavedRole(): WorkspaceRole {
    try {
      const val = localStorage.getItem(this.ROLE_KEY);
      return val === 'admin' ? 'admin' : 'user';
    } catch {
      return 'user';
    }
  }

  private loadSavedLoggedState(): boolean {
    try {
      const val = localStorage.getItem(this.LOGGED_KEY);
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  }

  private loadSavedAdminSession(): boolean {
    try {
      return localStorage.getItem(this.ADMIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  }

  openAuthModal(mode: 'login' | 'register' | 'switch'): void {
    this.authModalMode.set(mode);
  }

  closeAuthModal(): void {
    this.authModalMode.set(null);
  }

  /**
   * Inicia sesión con el Perfil de Administrador de spliy.IA
   */
  loginAsAdmin(silent = false): void {
    this.isAdminSession.set(true);
    this.activeRole.set('admin');
    this.isLoggedIn.set(true);
    try {
      localStorage.setItem(this.ADMIN_SESSION_KEY, 'true');
      localStorage.setItem(this.ROLE_KEY, 'admin');
      localStorage.setItem(this.LOGGED_KEY, 'true');
    } catch {
      // Ignore
    }
    if (!silent) {
      this.toast.show('Sesión iniciada como Administrador spliy.IA.', 'success');
    }
  }

  /**
   * Selecciona e inicia sesión con un perfil de usuario estándar
   */
  selectUser(idUsuario: number, silent = false): void {
    this.isAdminSession.set(false);
    this.activeUserId.set(idUsuario);
    this.activeRole.set('user');
    this.isLoggedIn.set(true);
    try {
      localStorage.setItem(this.ADMIN_SESSION_KEY, 'false');
      localStorage.setItem(this.USER_KEY, String(idUsuario));
      localStorage.setItem(this.ROLE_KEY, 'user');
      localStorage.setItem(this.LOGGED_KEY, 'true');
    } catch {
      // Ignore
    }
    if (!silent) {
      const user = this.api.usuarios().find(u => u.idUsuario === idUsuario);
      if (user) {
        this.toast.show(`Perfil activo: ${user.nombre}.`, 'success');
      }
    }
  }

  /**
   * Inicia sesión buscando por correo, nombre o credenciales de Administrador.
   */
  loginWithCredentials(identificador: string, password?: string): Observable<UsuarioResponse> {
    const clean = identificador.trim();
    const normalized = clean.toLowerCase();

    // 1. Verificar si es el Perfil Administrador
    if (
      normalized === 'admin' ||
      normalized === 'administrador' ||
      normalized === 'admin@spliy.ia' ||
      normalized === 'admin@correo.com'
    ) {
      this.loginAsAdmin();
      return of(this.adminProfile);
    }

    const list = this.api.usuarios();

    // 2. Coincidencia exacta por correo, nombre o teléfono
    let found = list.find(
      u =>
        u.correo.toLowerCase() === normalized ||
        u.nombre.toLowerCase() === normalized ||
        (u.telefono || '').toLowerCase() === normalized
    );

    // 3. Coincidencia parcial por nombre o prefijo de correo
    if (!found) {
      found = list.find(
        u =>
          u.correo.toLowerCase().includes(normalized) ||
          u.nombre.toLowerCase().includes(normalized)
      );
    }

    if (found) {
      this.selectUser(found.idUsuario);
      return of(found);
    }

    // 4. Si no existe en la BD, lo registramos automáticamente en SQL Server
    const isEmail = clean.includes('@');
    const nombreNuevo = isEmail
      ? clean
          .split('@')[0]
          .replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())
      : clean;
    const correoNuevo = isEmail
      ? clean
      : `${clean.toLowerCase().replace(/\s+/g, '.')}@spliy.ia`;

    return this.api
      .createUsuario({
        nombre: nombreNuevo,
        correo: correoNuevo,
        telefono: '300 000 0000',
        passwordHash: password ? `HASH_${btoa(password)}` : 'HASH_LOGIN_2026'
      })
      .pipe(
        map(created => {
          this.selectUser(created.idUsuario, true);
          this.toast.show(`Bienvenido a spliy.IA, ${created.nombre}.`, 'success');
          return created;
        })
      );
  }

  loginByEmail(correo: string): boolean {
    const normalized = correo.trim().toLowerCase();
    if (
      normalized === 'admin' ||
      normalized === 'administrador' ||
      normalized === 'admin@spliy.ia'
    ) {
      this.loginAsAdmin();
      return true;
    }
    const user = this.api
      .usuarios()
      .find(
        u =>
          u.correo.toLowerCase() === normalized ||
          u.nombre.toLowerCase().includes(normalized)
      );
    if (!user) {
      return false;
    }
    this.selectUser(user.idUsuario);
    return true;
  }

  logout(): void {
    this.isLoggedIn.set(false);
    this.isAdminSession.set(false);
    this.activeRole.set('user');
    try {
      localStorage.setItem(this.LOGGED_KEY, 'false');
      localStorage.setItem(this.ADMIN_SESSION_KEY, 'false');
      localStorage.setItem(this.ROLE_KEY, 'user');
    } catch {
      // Ignore
    }
    this.toast.show('Has cerrado sesión correctamente.', 'info');
  }

  setRole(role: WorkspaceRole, silent = false): void {
    this.activeRole.set(role);
    try {
      localStorage.setItem(this.ROLE_KEY, role);
    } catch {
      // Ignore
    }
    if (!silent) {
      const label = role === 'admin' ? 'Consola de Administrador' : 'Portal de Usuario';
      this.toast.show(`Vista activa: ${label}`, 'info');
    }
  }
}
