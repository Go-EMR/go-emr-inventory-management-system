import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  
  private readonly THEME_KEY = 'theme';
  
  // Signal for reactive theme state
  readonly theme = signal<Theme>(this.getInitialTheme());
  
  // Computed property for dark mode check
  readonly isDarkMode = () => this.theme() === 'dark';
  
  constructor() {
    // Effect to persist theme changes and update DOM
    effect(() => {
      const currentTheme = this.theme();
      if (isPlatformBrowser(this.platformId)) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem(this.THEME_KEY, currentTheme);
      }
    });
  }
  
  private getInitialTheme(): Theme {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
      if (savedTheme) {
        return savedTheme;
      }
      
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return 'light';
  }
  
  toggleTheme(): void {
    this.theme.update(current => current === 'light' ? 'dark' : 'light');
  }
  
  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }
}
