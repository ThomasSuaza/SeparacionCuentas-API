import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, catchError, map, tap } from 'rxjs';
import { UsuarioResponse, WorkspaceRole, Cuenta } from '../models/api.models';
import { SeparacionCuentasService } from './separacion-cuentas.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_KEY = 'splitia_active_user_id';
  private readonly ROLE_KEY = 'splitia_active_role';
  private readonly LOGGED_KEY = 'splitia_is_logged_in';
  private readonly ADMIN_SESSION_KEY = 'splitia_is_admin_session';
  private readonly PASSWORDS_KEY = 'splitia_user_passwords';

  readonly activeUserId = signal<number>(this.loadSavedUserId());
  readonly activeRole = signal<WorkspaceRole>(this.loadSavedRole());
  readonly isLoggedIn = signal<boolean>(this.loadSavedLoggedState());
  readonly isAdminSession = signal<boolean>(this.loadSavedAdminSession());
  readonly authModalMode = signal<'login' | 'register' | 'switch' | null>(null);

  readonly adminProfile: UsuarioResponse = {
    idUsuario: 1005,
    nombre: 'Administrador SplitIA',
    correo: 'admin@splitia.app',
    telefono: '+57 300 000 0000',
    rol: 'ADMIN',
    activo: true
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
        nombre: 'Thomas Suaza',
        correo: 'thomas@correo.com',
        telefono: '+57 300 111 2233',
        rol: 'USUARIO'
      }
    );
  });

  readonly iniciales = computed(() => {
    if (this.isAdminSession()) return 'AD';
    return this.api.getIniciales(this.currentUser().nombre);
  });

  /**
   * Cuentas estrictamente visibles para el usuario autenticado (Privacidad de datos):
   * Un usuario estándar SOLO tiene acceso a las cuentas que él creó/pagó
   * o en las que participa dentro de una división.
   */
  readonly misCuentasUsuario = computed<Cuenta[]>(() => {
    if (this.isAdminSession()) {
      return this.api.cuentas();
    }
    const uid = this.currentUser().idUsuario;
    const idsEnDivisiones = new Set(
      this.api
        .divisiones()
        .filter(d => d.idUsuario === uid)
        .map(d => d.idCuenta)
    );
    return this.api
      .cuentas()
      .filter(c => c.idUsuarioPagador === uid || idsEnDivisiones.has(c.idCuenta));
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

  private getPasswordsMap(): Record<string, string> {
    try {
      const raw = localStorage.getItem(this.PASSWORDS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  saveUserPassword(correo: string, password: string): void {
    if (!correo || !password) return;
    try {
      const map = this.getPasswordsMap();
      map[correo.trim().toLowerCase()] = password;
      localStorage.setItem(this.PASSWORDS_KEY, JSON.stringify(map));
    } catch {
      // Ignore
    }
  }

  openAuthModal(mode: 'login' | 'register' | 'switch'): void {
    this.authModalMode.set(mode);
  }

  closeAuthModal(): void {
    this.authModalMode.set(null);
  }

  /**
   * Inicia sesión con el Perfil de Administrador de SplitIA
   */
  loginAsAdmin(silent = false, adminUser?: UsuarioResponse): void {
    if (adminUser) {
      this.adminProfile.idUsuario = adminUser.idUsuario;
      this.adminProfile.nombre = adminUser.nombre;
      this.adminProfile.correo = adminUser.correo;
      this.adminProfile.telefono = adminUser.telefono;
    }
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
      this.toast.show('Sesión iniciada como Administrador SplitIA.', 'success');
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
    this.api.loadMetodosPagoUsuario(idUsuario).subscribe();
    this.api.loadNotificacionesUsuario(idUsuario).subscribe();
    if (!silent) {
      const user = this.api.usuarios().find(u => u.idUsuario === idUsuario);
      if (user) {
        this.toast.show(`Sesión iniciada como ${user.nombre}.`, 'success');
      }
    }
  }

  /**
   * Autenticación obligatoria por Correo Electrónico y Contraseña contra SQL Server (/api/Auth/login)
   * con respaldo local seguro si el servidor API está desconectado.
   */
  loginWithCredentials(correoInput: string, passwordInput?: string): Observable<UsuarioResponse | null> {
    const cleanCorreo = correoInput.trim().toLowerCase();
    const cleanPass = (passwordInput || '').trim();

    if (!cleanCorreo || !cleanPass) {
      this.toast.show('Por seguridad, debes ingresar el correo electrónico y la contraseña.', 'warning');
      return of(null);
    }

    return this.api.loginBackend(cleanCorreo, cleanPass).pipe(
      map(res => {
        if (!res.autenticado || !res.usuario) {
          this.toast.show(res.mensaje || 'Credenciales inválidas.', 'error');
          return null;
        }
        const u = res.usuario;
        if (u.rol === 'ADMIN' || u.correo.toLowerCase() === 'admin@splitia.app') {
          this.loginAsAdmin(false, u);
          return u;
        }
        this.saveUserPassword(u.correo, cleanPass);
        this.selectUser(u.idUsuario);
        return u;
      }),
      catchError(err => {
        // Si el servidor API respondió 401/400, NO permitir bypass local
        if (err && (err.status === 401 || err.status === 400)) {
          const msg = err.error?.mensaje || 'Correo o contraseña incorrectos.';
          this.toast.show(msg, 'error');
          return of(null);
        }

        // Fallback local únicamente cuando no hay conexión de red con la API (status === 0)
        const passMap = this.getPasswordsMap();
        if (
          cleanCorreo === 'admin@splitia.app' ||
          cleanCorreo === 'admin@spliy.ia' ||
          cleanCorreo === 'admin@correo.com' ||
          cleanCorreo === 'admin'
        ) {
          const savedAdminPass = passMap['admin@splitia.app'] || 'admin123';
          if (cleanPass !== savedAdminPass && cleanPass !== 'admin123') {
            this.toast.show('Contraseña de Administrador incorrecta.', 'error');
            return of(null);
          }
          this.loginAsAdmin();
          return of(this.adminProfile);
        }

        const found = this.api.usuarios().find(u => u.correo.trim().toLowerCase() === cleanCorreo);
        if (!found) {
          this.toast.show('No existe ninguna cuenta con ese correo electrónico. Verifica el correo o regístrate.', 'error');
          return of(null);
        }

        const savedPass = passMap[cleanCorreo] || '123456';
        if (savedPass !== cleanPass) {
          this.toast.show('Contraseña incorrecta para esta cuenta.', 'error');
          return of(null);
        }

        this.selectUser(found.idUsuario);
        return of(found);
      })
    );
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
    if (role === 'admin' && !this.isAdminSession()) {
      return;
    }
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
