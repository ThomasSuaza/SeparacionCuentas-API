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
  { path: 'bienvenida', component: LandingComponent, title: 'Bienvenida | SplitBill AI' },

  // Apartado de Usuario (User Portal)
  { path: 'usuario/panel', component: UserDashboardComponent, title: 'Panel General | SplitBill AI' },
  { path: 'usuario/cuentas', component: UserCuentasComponent, title: 'Mis Cuentas | SplitBill AI' },
  { path: 'usuario/pagos', component: UserPagosComponent, title: 'Mis Pagos | SplitBill AI' },
  { path: 'usuario/saldos', component: UserSaldosComponent, title: 'Saldos y Devoluciones | SplitBill AI' },
  { path: 'usuario/perfil', component: UserPerfilComponent, title: 'Mi Perfil | SplitBill AI' },

  // Consola de Administrador (Admin Console)
  { path: 'admin/resumen', component: AdminOverviewComponent, title: 'Consola Admin | SplitBill AI' },
  { path: 'admin/usuarios', component: AdminUsuariosComponent, title: 'Admin Usuarios | SplitBill AI' },
  { path: 'admin/cuentas', component: AdminCuentasComponent, title: 'Admin Cuentas | SplitBill AI' },
  { path: 'admin/divisiones', component: AdminDivisionesComponent, title: 'Admin Divisiones | SplitBill AI' },
  { path: 'admin/sistema', component: AdminSistemaComponent, title: 'Diagnóstico API .NET | SplitBill AI' },

  { path: '**', redirectTo: 'usuario/panel' }
];
