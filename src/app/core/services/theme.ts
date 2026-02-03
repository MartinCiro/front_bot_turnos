import { Injectable, signal, computed, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSignal = signal<Theme>('light');
  private platformId = inject(PLATFORM_ID);

  // Signal para seguir cambios en la preferencia del sistema
  private systemPreference = signal<'light' | 'dark'>('light');

  // Computed signals
  currentTheme = this.themeSignal.asReadonly();
  isDarkMode = computed(() => this.themeSignal() === 'dark');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeTheme();

      effect(() => {
        const theme = this.themeSignal();
        this.applyTheme(theme);

        theme !== this.systemPreference() ? localStorage.setItem('theme', theme) : localStorage.removeItem('theme');
      });
    }
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem('theme') as Theme | null;

    if (savedTheme === 'light' || savedTheme === 'dark') {
      // Si el usuario ya eligió un tema, úsalo
      this.themeSignal.set(savedTheme);
    } else {
      // Por defecto: modo oscuro, ignorando la preferencia del sistema
      this.themeSignal.set('dark');
      this.systemPreference.set('dark'); // opcional, para coherencia interna
    }
  }

  private detectSystemPreference() {
    if (!isPlatformBrowser(this.platformId)) return;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemTheme: Theme = prefersDark ? 'dark' : 'light';

    this.systemPreference.set(systemTheme);
    this.themeSignal.set(systemTheme);
  }

  private listenToSystemPreference() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Escuchar cambios en la preferencia del sistema
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme: Theme = e.matches ? 'dark' : 'light';
      this.systemPreference.set(newSystemTheme);

      // Solo cambiar si el usuario no ha guardado una preferencia manual
      if (!localStorage.getItem('theme')) {
        this.themeSignal.set(newSystemTheme);
      }
    };

    // Agregar listener (modern API)
    if (darkModeMediaQuery.addEventListener) {
      darkModeMediaQuery.addEventListener('change', handleChange);
    }
    // Fallback para navegadores antiguos
    else if (darkModeMediaQuery.addListener) {
      darkModeMediaQuery.addListener(handleChange);
    }
  }

  toggleTheme() {
    if (!isPlatformBrowser(this.platformId)) return;

    const newTheme: Theme = this.themeSignal() === 'light' ? 'dark' : 'light';
    this.themeSignal.set(newTheme);
  }

  setTheme(theme: Theme) {
    if (!isPlatformBrowser(this.platformId)) return;
    this.themeSignal.set(theme);
  }

  resetToSystemPreference() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Eliminar preferencia guardada y usar la del sistema
    localStorage.removeItem('theme');
    this.themeSignal.set(this.systemPreference());
  }

  private applyTheme(theme: Theme) {
    if (!isPlatformBrowser(this.platformId)) return;

    const htmlElement = document.documentElement;

    if (theme === 'dark') {
      htmlElement.classList.add('dark');
      htmlElement.classList.remove('light');
      htmlElement.setAttribute('data-theme', 'dark');
    } else {
      htmlElement.classList.add('light');
      htmlElement.classList.remove('dark');
      htmlElement.setAttribute('data-theme', 'light');
    }
  }
}