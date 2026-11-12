import { Component, inject, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SeparacionCuentasService } from '../../core/services/separacion-cuentas.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (!auth.isLoggedIn()) {
      <!-- Vista cuando el usuario cerró sesión -->
      <div style="max-width: 520px; margin: 28px auto;">
        <section class="panel" style="padding: 28px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div class="avatar-circle" style="width: 56px; height: 56px; font-size: 20px; margin: 0 auto 12px;">
              S
            </div>
            <h1 class="page-title" style="font-size: 22px;">Inicia sesión en spliy.IA</h1>
            <p class="sub" style="margin-top: 6px;">
              Accede a tu perfil personal para ver tus cuentas compartidas, pagos realizados y saldos a favor.
            </p>
          </div>

          <form (ngSubmit)="iniciarSesionDirecto()" style="display: grid; gap: 14px; margin-bottom: 20px;">
            <div class="form-group">
              <label>Correo electrónico o nombre de usuario</label>
              <input
                class="form-control"
                type="text"
                [(ngModel)]="loginInput"
                name="loginInput"
                placeholder="Ej. thomas@correo.com o Thomas"
                required
              />
            </div>

            <div class="form-group">
              <label>Contraseña</label>
              <input
                class="form-control"
                type="password"
                [(ngModel)]="loginPass"
                name="loginPass"
                placeholder="••••••••"
                required
              />
            </div>

            <button class="btn-primary" type="submit" style="width: 100%;">
              Iniciar sesión en mi cuenta
            </button>
          </form>

          <div style="border-top: 1px solid var(--border); padding-top: 16px;">
            <div style="font-size: 11px; font-weight: 800; color: var(--muted); text-transform: uppercase; margin-bottom: 10px;">
              Cuentas disponibles para ingreso rápido:
            </div>
            <div style="display: grid; gap: 8px;">
              @for (u of api.usuarios(); track u.idUsuario) {
                <div
                  style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 11px; border: 1px solid var(--border); background: var(--surface-alt); cursor: pointer;"
                  (click)="auth.selectUser(u.idUsuario)"
                >
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="person-bubble">{{ api.getIniciales(u.nombre) }}</div>
                    <div>
                      <strong style="font-size: 13px; display: block;">{{ u.nombre }}</strong>
                      <small style="font-size: 11px; color: var(--muted);">{{ u.correo }}</small>
                    </div>
                  </div>
                  <span style="font-size: 12px; font-weight: 700; color: var(--accent);">Entrar →</span>
                </div>
              }
            </div>

            <div style="text-align: center; margin-top: 16px;">
              <button class="btn-outline" type="button" style="width: 100%;" (click)="auth.openAuthModal('register')">
                + Crear una cuenta nueva (Registrarse)
              </button>
            </div>
          </div>
        </section>
      </div>
    } @else {
      <!-- CABECERA DE PERFIL REAL -->
      <section class="panel" style="margin-bottom: 22px; padding: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
            <div
              class="avatar-circle"
              style="width: 68px; height: 68px; font-size: 24px; border-radius: 20px; box-shadow: var(--shadow);"
            >
              {{ auth.iniciales() }}
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <h1 style="font-size: 23px; font-weight: 800; letter-spacing: -0.02em; margin: 0;">
                  {{ auth.currentUser().nombre }}
                </h1>
                <span class="badge-status badge-success">✓ Cuenta verificada</span>
                <span class="pill" style="font-size: 10.5px; padding: 3px 9px;">
                  ID #{{ auth.currentUser().idUsuario }}
                </span>
              </div>
              <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 6px; font-size: 13px; color: var(--muted);">
                <span>📧 {{ auth.currentUser().correo }}</span>
                <span>📱 {{ auth.currentUser().telefono || 'Sin teléfono registrado' }}</span>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <a routerLink="/usuario/cuentas" class="btn-primary">
              + Añadir cuenta
            </a>
            <button class="btn-outline" type="button" (click)="auth.openAuthModal('login')">
              🔄 Cambiar cuenta
            </button>
            <button class="btn-danger" type="button" (click)="auth.logout()">
              Cerrar sesión
            </button>
          </div>
        </div>

        <!-- Pestañas de navegación del Perfil -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 22px; padding-top: 16px; border-top: 1px solid var(--border);">
          <button
            type="button"
            class="btn-outline btn-sm"
            [style.background]="tabActiva() === 'resumen' ? 'var(--accent)' : ''"
            [style.color]="tabActiva() === 'resumen' ? 'var(--on-accent)' : ''"
            [style.border-color]="tabActiva() === 'resumen' ? 'var(--accent)' : ''"
            (click)="tabActiva.set('resumen')"
          >
            📊 Resumen de mi cuenta
          </button>
          <button
            type="button"
            class="btn-outline btn-sm"
            [style.background]="tabActiva() === 'editar' ? 'var(--accent)' : ''"
            [style.color]="tabActiva() === 'editar' ? 'var(--on-accent)' : ''"
            [style.border-color]="tabActiva() === 'editar' ? 'var(--accent)' : ''"
            (click)="tabActiva.set('editar')"
          >
            ✏️ Editar datos personales
          </button>
          <button
            type="button"
            class="btn-outline btn-sm"
            [style.background]="tabActiva() === 'metodos' ? 'var(--accent)' : ''"
            [style.color]="tabActiva() === 'metodos' ? 'var(--on-accent)' : ''"
            [style.border-color]="tabActiva() === 'metodos' ? 'var(--accent)' : ''"
            (click)="tabActiva.set('metodos')"
          >
            💳 Medios de pago y cobro
          </button>
        </div>
      </section>

      <!-- KPIs FINANCIEROS DE MI PERFIL -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="tiny">Cuentas Organizadas por Mí</div>
          <strong>{{ misCuentasOrganizadas().length }}</strong>
          <small>Total pagado: &#36;{{ totalAdelantadoPorMi() | number:'1.0-0' }} COP</small>
        </div>

        <div class="stat-card">
          <div class="tiny">Saldo a Favor (Me deben)</div>
          <strong style="color: var(--success);">&#36;{{ totalPorRecibir() | number:'1.0-0' }}</strong>
          <small>COP pendientes por cobrar en mis cuentas</small>
        </div>

        <div class="stat-card">
          <div class="tiny">Mis Pagos Realizados</div>
          <strong>&#36;{{ totalPagadoEnCuotas() | number:'1.0-0' }}</strong>
          <small>{{ misCuotasPagadas().length }} cuotas pagadas</small>
        </div>

        <div class="stat-card">
          <div class="tiny">Saldo Pendiente por Pagar</div>
          <strong [style.color]="totalDeboPagar() === 0 ? 'var(--success)' : 'var(--warning)'">
            &#36;{{ totalDeboPagar() | number:'1.0-0' }}
          </strong>
          <small>{{ totalDeboPagar() === 0 ? 'Estás 100% al día' : misCuotasPendientes().length + ' cuotas por pagar' }}</small>
        </div>
      </div>

      <!-- CONTENIDO SEGÚN PESTAÑA ACTIVA -->
      @if (tabActiva() === 'resumen') {
        <div class="content-grid">
          <!-- Mis Cuentas Recientes -->
          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>Mis cuentas compartidas</h2>
                <p class="sub">Cuentas donde eres organizador o participante activo.</p>
              </div>
              <a routerLink="/usuario/cuentas" class="pill">Ver todas →</a>
            </div>

            <div style="display: grid; gap: 11px;">
              @for (c of misCuentasRelacionadas(); track c.idCuenta) {
                @let esMia = c.idUsuarioPagador === auth.currentUser().idUsuario;
                @let dev = api.calcularDevolucionesLocal(c.idCuenta);
                <div style="padding: 14px; border-radius: 13px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                      <strong style="font-size: 13.5px;">{{ c.descripcion }}</strong>
                      <span
                        class="badge-status"
                        [class.badge-info]="esMia"
                        [class.badge-success]="!esMia"
                      >
                        {{ esMia ? 'Organizador' : 'Participante' }}
                      </span>
                    </div>
                    <div style="font-size: 11.5px; color: var(--muted); margin-top: 4px;">
                      Pagada por {{ api.getNombreUsuario(c.idUsuarioPagador) }} · {{ c.fecha | date:'dd MMM yyyy, HH:mm' }}
                    </div>
                  </div>

                  <div style="text-align: right;">
                    <strong style="font-size: 14px; display: block;">&#36;{{ c.montoTotal | number:'1.0-0' }} COP</strong>
                    <span
                      class="badge-status"
                      style="margin-top: 3px;"
                      [class.badge-success]="dev.estadoDistribucion === 'COMPLETA'"
                      [class.badge-warning]="dev.estadoDistribucion !== 'COMPLETA'"
                    >
                      {{ dev.estadoDistribucion }}
                    </span>
                  </div>
                </div>
              } @empty {
                <div style="padding: 20px; text-align: center; color: var(--muted); font-size: 13px;">
                  Aún no tienes cuentas asociadas. ¡Crea tu primera cuenta compartida!
                </div>
              }
            </div>
          </section>

          <!-- Historial de Mis Pagos y Cuotas -->
          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>Mi actividad y pagos recientes</h2>
                <p class="sub">Tus cuotas pagadas y cobros asignados.</p>
              </div>
              <a routerLink="/usuario/pagos" class="pill">Ir a pagos →</a>
            </div>

            <div style="display: grid; gap: 10px;">
              @for (d of misDivisiones(); track d.idDivision) {
                <div style="padding: 12px 14px; border-radius: 12px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                  <div>
                    <strong style="font-size: 13px; display: block;">{{ obtenerNombreCuenta(d.idCuenta) }}</strong>
                    <small style="font-size: 11px; color: var(--muted);">
                      @if (d.estado === 'PAGADO') {
                        Pagado vía {{ d.tipoPago || 'Transferencia' }} {{ d.referenciaPago ? '(' + d.referenciaPago + ')' : '' }}
                      } @else {
                        Cuota pendiente de pago
                      }
                    </small>
                  </div>
                  <div style="text-align: right;">
                    <strong style="font-size: 13.5px; display: block;">&#36;{{ d.monto | number:'1.0-0' }}</strong>
                    <span
                      class="badge-status"
                      [class.badge-success]="d.estado === 'PAGADO'"
                      [class.badge-warning]="d.estado === 'PENDIENTE'"
                    >
                      {{ d.estado }}
                    </span>
                  </div>
                </div>
              } @empty {
                <div style="padding: 20px; text-align: center; color: var(--muted); font-size: 13px;">
                  No tienes cuotas registradas todavía.
                </div>
              }
            </div>
          </section>
        </div>
      }

      @if (tabActiva() === 'editar') {
        <div class="content-grid">
          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>Información personal y seguridad</h2>
                <p class="sub">Los cambios se guardan directamente en tu cuenta de spliy.IA.</p>
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
                <input class="form-control" type="text" [(ngModel)]="telefono" name="telefono" placeholder="300 000 0000" />
              </div>

              <div class="form-group">
                <label>Nueva contraseña</label>
                <input
                  class="form-control"
                  type="password"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="Dejar en blanco para mantener la contraseña actual"
                />
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
                <button class="btn-outline" type="button" (click)="tabActiva.set('resumen')">
                  Cancelar
                </button>
                <button class="btn-primary" type="submit">
                  Guardar cambios en mi perfil
                </button>
              </div>
            </form>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>Cambiar de sesión</h2>
                <p class="sub">Selecciona otra cuenta o registra un usuario nuevo.</p>
              </div>
              <button class="btn-outline btn-sm" type="button" (click)="auth.openAuthModal('register')">
                + Nuevo usuario
              </button>
            </div>

            <div style="display: grid; gap: 9px;">
              @for (u of api.usuarios(); track u.idUsuario) {
                <div
                  style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface-alt); cursor: pointer;"
                  [style.border-color]="auth.currentUser().idUsuario === u.idUsuario ? 'var(--accent)' : 'var(--border)'"
                  (click)="auth.selectUser(u.idUsuario)"
                >
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="person-bubble">{{ api.getIniciales(u.nombre) }}</div>
                    <div>
                      <strong style="font-size: 13px; display: block;">{{ u.nombre }}</strong>
                      <small style="font-size: 11px; color: var(--muted);">{{ u.correo }}</small>
                    </div>
                  </div>
                  @if (auth.currentUser().idUsuario === u.idUsuario) {
                    <span class="badge-status badge-success">Sesión actual</span>
                  } @else {
                    <span style="font-size: 12px; font-weight: 700; color: var(--accent);">Iniciar sesión →</span>
                  }
                </div>
              }
            </div>
          </section>
        </div>
      }

      @if (tabActiva() === 'metodos') {
        <div class="content-grid">
          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>Mis medios de cobro y recepción</h2>
                <p class="sub">Cuentas habilitadas para recibir devoluciones cuando pagas una factura.</p>
              </div>
            </div>

            <div style="display: grid; gap: 12px;">
              <div style="padding: 15px; border-radius: 13px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>📱 Nequi / DaviPlata Rápido</strong>
                  <div style="font-size: 12px; color: var(--muted); margin-top: 3px;">
                    Número vinculado: {{ auth.currentUser().telefono || '300 111 2233' }}
                  </div>
                </div>
                <span class="badge-status badge-success">Principal</span>
              </div>

              <div style="padding: 15px; border-radius: 13px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>🏦 Transferencia Bancaria / PSE</strong>
                  <div style="font-size: 12px; color: var(--muted); margin-top: 3px;">
                    Titular: {{ auth.currentUser().nombre }} · {{ auth.currentUser().correo }}
                  </div>
                </div>
                <span class="badge-status badge-info">Verificado</span>
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>Preferencias de cuenta</h2>
                <p class="sub">Estado de notificaciones y liquidación automática.</p>
              </div>
            </div>

            <div style="display: grid; gap: 10px;">
              <div style="padding: 13px; border-radius: 12px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <span>Cálculo automático de devoluciones</span>
                <span class="badge-status badge-success">Activo</span>
              </div>
              <div style="padding: 13px; border-radius: 12px; background: var(--surface-alt); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <span>Sincronización con base de datos en tiempo real</span>
                <span class="badge-status badge-success">Activo</span>
              </div>
            </div>
          </section>
        </div>
      }
    }
  `
})
export class UserPerfilComponent {
  readonly api = inject(SeparacionCuentasService);
  readonly auth = inject(AuthService);

  readonly tabActiva = signal<'resumen' | 'editar' | 'metodos'>('resumen');

  nombre = '';
  correo = '';
  telefono = '';
  password = '';

  loginInput = '';
  loginPass = '';

  readonly misCuentasOrganizadas = computed(() => {
    const uid = this.auth.currentUser().idUsuario;
    return this.api.cuentas().filter(c => c.idUsuarioPagador === uid);
  });

  readonly misDivisiones = computed(() => {
    const uid = this.auth.currentUser().idUsuario;
    return this.api.divisiones().filter(d => d.idUsuario === uid);
  });

  readonly misCuentasRelacionadas = computed(() => {
    const uid = this.auth.currentUser().idUsuario;
    const idsEnDivisiones = new Set(this.misDivisiones().map(d => d.idCuenta));
    return this.api
      .cuentas()
      .filter(c => c.idUsuarioPagador === uid || idsEnDivisiones.has(c.idCuenta));
  });

  readonly totalAdelantadoPorMi = computed(() =>
    this.misCuentasOrganizadas().reduce((acc, c) => acc + Number(c.montoTotal), 0)
  );

  readonly totalPorRecibir = computed(() =>
    this.misCuentasOrganizadas().reduce((acc, c) => {
      const dev = this.api.calcularDevolucionesLocal(c.idCuenta);
      const filaPagador = dev.saldos.find(s => s.esPagador);
      return acc + (filaPagador ? Number(filaPagador.saldo) : 0);
    }, 0)
  );

  readonly misCuotasPagadas = computed(() =>
    this.misDivisiones().filter(d => d.estado === 'PAGADO')
  );

  readonly misCuotasPendientes = computed(() =>
    this.misDivisiones().filter(d => d.estado === 'PENDIENTE')
  );

  readonly totalPagadoEnCuotas = computed(() =>
    this.misCuotasPagadas().reduce((acc, d) => acc + Number(d.monto), 0)
  );

  readonly totalDeboPagar = computed(() =>
    this.misCuotasPendientes().reduce((acc, d) => acc + Number(d.monto), 0)
  );

  constructor() {
    effect(() => {
      const u = this.auth.currentUser();
      this.nombre = u.nombre;
      this.correo = u.correo;
      this.telefono = u.telefono || '';
    });
  }

  obtenerNombreCuenta(idCuenta: number): string {
    return this.api.cuentas().find(c => c.idCuenta === idCuenta)?.descripcion || `Cuenta #${idCuenta}`;
  }

  iniciarSesionDirecto(): void {
    if (!this.loginInput.trim()) return;
    this.auth.loginWithCredentials(this.loginInput, this.loginPass).subscribe(() => {
      this.loginInput = '';
      this.loginPass = '';
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
      .subscribe(() => {
        this.password = '';
        this.tabActiva.set('resumen');
      });
  }
}
