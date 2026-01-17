import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/calendario', pathMatch: 'full' },
  { 
    path: 'calendario', 
    loadComponent: () => import('./pages/calendario/calendario.component')
      .then(m => m.CalendarioComponent)
  },
  /* {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [AuthGuard] // Si tienes un guard de autenticación
  }, */
];