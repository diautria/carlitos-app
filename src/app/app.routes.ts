import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/inicio',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage),
  },
  {
    path: 'detalle/:id',
    loadComponent: () => import('./pages/detalle-bebe/detalle-bebe.page').then(m => m.DetalleBebePage),
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'familia-inicial',
    loadComponent: () => import('./pages/familia-inicial/familia-inicial.page').then( m => m.FamiliaInicialPage)
  },
  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio.page').then( m => m.InicioPage)
  },
  {
    path: 'familia',
    loadComponent: () => import('./pages/familia/familia.page').then( m => m.FamiliaPage)
  },
  {
    path: 'estadisticas',
    loadComponent: () => import('./pages/estadisticas/estadisticas.component')
      .then(m => m.EstadisticasComponent)
  }
];
