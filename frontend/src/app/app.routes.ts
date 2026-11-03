import { Routes } from '@angular/router';

import { CategoriasComponent } from './components/categorias/categorias.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { MovimientosComponent } from './components/movimientos/movimientos.component';
import { ProductosComponent } from './components/productos/productos.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, title: 'TecnoStock — Iniciar sesión' },
  { path: 'dashboard', component: DashboardComponent, title: 'TecnoStock — Dashboard' },
  { path: 'productos', component: ProductosComponent, title: 'TecnoStock — Productos' },
  { path: 'categorias', component: CategoriasComponent, title: 'TecnoStock — Categorías' },
  { path: 'movimientos', component: MovimientosComponent, title: 'TecnoStock — Movimientos' },
  { path: '**', redirectTo: 'login' },
];
