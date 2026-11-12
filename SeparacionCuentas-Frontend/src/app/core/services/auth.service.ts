import { Injectable, signal, computed } from '@angular/core';
import { UsuarioResponse, WorkspaceRole } from '../models/api.models';
import { SeparacionCuentasService } from './separacion-cuentas.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_KEY = 'slit_ia_active_user_id';
  private readonly ROLE_KEY = 'slit_ia_active_role';

  readonly activeUserId = signal<number>(this.loadSavedUserId());
  readonly activeRole = signal<WorkspaceRole>(this.loadSavedRole());
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

  openAuthModal(mode: 'login' | 'register'): void {
    this.authModalMode.set(mode);
  }

  closeAuthModal(): void {
    this.authModalMode.set(null);
  }

  selectUser(idUsuario: number, silent = false): void {
    this.activeUserId.set(idUsuario);
    try {
      localStorage.setItem(this.USER_KEY, String(idUsuario));
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

  loginByEmail(correo: string): boolean {
    const normalized = correo.trim().toLowerCase();
    const user = this.api.usuarios().find(u => u.correo.toLowerCase() === normalized);
    if (!user) {
      this.toast.show('No se encontró ningún usuario con ese correo. Puedes registrarte.', 'warning');
      return false;
    }
    this.selectUser(user.idUsuario);
    return true;
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
