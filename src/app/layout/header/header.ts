// src/app/layout/header/header.ts
import { CommonModule } from '@angular/common';
import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { 
  LucideAngularModule, 
  Search, 
  ShoppingBag, 
  Menu,
  Sun,
  Moon,
  Download,
  User
} from 'lucide-angular';
import { ThemeService } from '@app/core/services/theme';
import { CalendarioService } from '@app/core/services/calendario.service'; // 👈 nuevo

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  private themeService = inject(ThemeService);
  private calendarioService = inject(CalendarioService); // 👈 inyectado

  // Signals del servicio
  usuarios = this.calendarioService.usuarios;
  usuarioActual = this.calendarioService.usuarioActual;
  data = this.calendarioService.data;

  // Theme signals
  isDarkMode = this.themeService.isDarkMode;
  
  // Iconos
  readonly Search = Search;
  readonly ShoppingBag = ShoppingBag;
  readonly Menu = Menu;
  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly Download = Download; // 👈
  readonly User = User;         // 👈

  // Icono dinámico para tema
  themeIcon = computed(() => this.isDarkMode() ? this.Sun : this.Moon);

  // Clases existentes
  logoClasses = computed(() => ({
    'text-primary': this.isDarkMode(),
    'text-gray-900': !this.isDarkMode()
  }));
  
  navClasses = computed(() => 
    this.isDarkMode() ? 'text-light' : 'text-gray-900'
  );
  
  iconColor = computed(() => 
    this.isDarkMode() ? 'text-white-400' : 'text-gray-800'
  );
  
  themeIconColor = computed(() => 
    this.isDarkMode() ? 'text-yellow-400' : 'text-gray-800'
  );

  // ✅ NUEVO: Señal para dropdown de usuarios
  mostrarSelectorUsuario = signal(false);

  // Formatea nombre de usuario: MARTIN_ANTONIO → Martin Antonio
  formatearNombreUsuario(nombre: string): string {
    return nombre
      .split('_')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
      .join(' ');
  }

  // Acciones
  toggleDarkMode() {
    this.themeService.toggleTheme();
  }

  exportarCalendario(): void {
    const datos = this.data();
    if (!datos) return;

    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendario-${this.usuarioActual() || 'usuario'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  seleccionarUsuario(usuario: string): void {
    this.calendarioService.cambiarUsuario(usuario);
    this.mostrarSelectorUsuario.set(false);
  }

  toggleSelectorUsuario(): void {
    this.mostrarSelectorUsuario.update(v => !v);
  }
}