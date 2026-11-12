import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { UserDashboardComponent } from './features/user-portal/user-dashboard.component';
import { UserCuentasComponent } from './features/user-portal/user-cuentas.component';
import { UserPagosComponent } from './features/user-portal/user-pagos.component';
import { UserSaldosComponent } from './features/user-portal/user-saldos.component';
import { UserPerfilComponent } from './features/user-portal/user-perfil.component';
import { AdminOverviewComponent } from './features/admin-console/admin-overview.component';
import { AdminUsuariosComponent } from './features/admin-console/admin-usuarios.component';
import { AdminCuentasComponent } from './features/admin-console/admin-cuentas.component';
import { AdminDivisionesComponent } from './features/admin-console/admin-divisiones.component';
import { AdminSistemaComponent } from './features/admin-console/admin-sistema.component';

export const routes: Routes = [
  { path: '', redirectTo: 'usuario/panel', pathMatch: 'full' },
  { path: 'bienvenida', component: LandingComponent, title: 'Bienvenida | spliy.IA' },

  // Portal de Usuario
  { path: 'usuario/panel', component: UserDashboardComponent, title: 'Panel General | spliy.IA' },
  { path: 'usuario/cuentas', component: UserCuentasComponent, title: 'Mis Cuentas | spliy.IA' },
  { path: 'usuario/pagos', component: UserPagosComponent, title: 'Mis Pagos | spliy.IA' },
  { path: 'usuario/saldos', component: UserSaldosComponent, title: 'Saldos y Devoluciones | spliy.IA' },
  { path: 'usuario/perfil', component: UserPerfilComponent, title: 'Mi Perfil | spliy.IA' },

  // Consola de Administrador
  { path: 'admin/resumen', component: AdminOverviewComponent, title: 'Administración | spliy.IA' },
  { path: 'admin/usuarios', component: AdminUsuariosComponent, title: 'Usuarios | spliy.IA' },
  { path: 'admin/cuentas', component: AdminCuentasComponent, title: 'Cuentas | spliy.IA' },
  { path: 'admin/divisiones', component: AdminDivisionesComponent, title: 'Divisiones | spliy.IA' },
  { path: 'admin/sistema', component: AdminSistemaComponent, title: 'Sistema | spliy.IA' },

  { path: '**', redirectTo: 'usuario/panel' }
];
