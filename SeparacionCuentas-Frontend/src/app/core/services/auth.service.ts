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

  readonly activeUserId = signal<number>(this.loadSavedUserId());
  readonly activeRole = signal<WorkspaceRole>(this.loadSavedRole());
  readonly isLoggedIn = signal<boolean>(this.loadSavedLoggedState());
  readonly authModalMode = signal<'login' | 'register' | null>(null);

  readonly currentUser = computed<UsuarioResponse>(() => {
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

  readonly iniciales = computed(() => this.api.getIniciales(this.currentUser().nombre));

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

  openAuthModal(mode: 'login' | 'register'): void {
    this.authModalMode.set(mode);
  }

  closeAuthModal(): void {
    this.authModalMode.set(null);
  }

  selectUser(idUsuario: number, silent = false): void {
    this.activeUserId.set(idUsuario);
    this.isLoggedIn.set(true);
    try {
      localStorage.setItem(this.USER_KEY, String(idUsuario));
      localStorage.setItem(this.LOGGED_KEY, 'true');
    } catch {
      // Ignore
    }
    if (!silent) {
      const user = this.api.usuarios().find(u => u.idUsuario === idUsuario);
      if (user) {
        this.toast.show(`Sesión iniciada como ${user.nombre}.`, 'success');
      }
    }
  }

  /**
   * Inicia sesión buscando por correo, nombre o teléfono.
   * Si el usuario ingresa un correo nuevo que aún no existe en la base de datos,
   * crea automáticamente su cuenta en SQL Server y lo autentica.
   */
  loginWithCredentials(identificador: string, password?: string): Observable<UsuarioResponse> {
    const clean = identificador.trim();
    const normalized = clean.toLowerCase();
    const list = this.api.usuarios();

    // 1. Coincidencia exacta por correo o nombre o teléfono
    let found = list.find(
      u =>
        u.correo.toLowerCase() === normalized ||
        u.nombre.toLowerCase() === normalized ||
        (u.telefono || '').toLowerCase() === normalized
    );

    // 2. Coincidencia parcial por nombre o prefijo de correo
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

    // 3. Si no existe en la BD, lo registramos automáticamente en SQL Server para que el login siempre sea funcional
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
    try {
      localStorage.setItem(this.LOGGED_KEY, 'false');
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
