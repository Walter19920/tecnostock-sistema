import { Routes } from '@angular/router';

import { AlmacenLayoutComponent } from './components/layout/almacen-layout.component';
import { AdminLayoutComponent } from './components/layout/admin-layout.component';
import { CategoriasComponent } from './components/categorias/categorias.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { MovimientosComponent } from './components/movimientos/movimientos.component';
import { ProductosComponent } from './components/productos/productos.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { rolGuard, sesionGuard } from './guards/rol.guard';
import { ROL_ADMIN, ROL_ALMACENERO } from './interfaces/auth.interface';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, title: 'TecnoStock — Iniciar sesión' },

  // Vista Administrador: menú general (dashboard, productos, categorías, movimientos, usuarios)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [sesionGuard, rolGuard(ROL_ADMIN)],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent, title: 'TecnoStock — Dashboard' },
      { path: 'productos', component: ProductosComponent, title: 'TecnoStock — Productos' },
      { path: 'categorias', component: CategoriasComponent, title: 'TecnoStock — Categorías' },
      { path: 'movimientos', component: MovimientosComponent, title: 'TecnoStock — Movimientos' },
      { path: 'usuarios', component: UsuariosComponent, title: 'TecnoStock — Usuarios' },
    ],
  },

  // Vista Almacenero: enfocada en stock, entradas y salidas
  {
    path: 'almacen',
    component: AlmacenLayoutComponent,
    canActivate: [sesionGuard, rolGuard(ROL_ALMACENERO)],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent, title: 'TecnoStock — Stock' },
      { path: 'productos', component: ProductosComponent, title: 'TecnoStock — Productos' },
      {
        path: 'movimientos',
        component: MovimientosComponent,
        title: 'TecnoStock — Entradas y salidas',
      },
    ],
  },

  // Alias de entrada: el login redirige a /dashboard y se resuelve al panel
  // del rol activo (los guards de /admin y /almacen siguen protegiendo el acceso).
  { path: 'dashboard', pathMatch: 'full', redirectTo: 'admin/dashboard' },
  { path: 'usuarios', pathMatch: 'full', redirectTo: 'admin/usuarios' },

  { path: '**', redirectTo: 'login' },
];
