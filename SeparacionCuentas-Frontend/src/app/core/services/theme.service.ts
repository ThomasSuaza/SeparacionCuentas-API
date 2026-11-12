import { Injectable, signal, computed } from '@angular/core';
import { ThemePalette } from '../models/api.models';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'slit_ia_theme_palette';

  readonly currentTheme = signal<ThemePalette>(this.loadInitialTheme());

  readonly isDark = computed(() => this.currentTheme() === 'gold');

  readonly paletteLabel = computed(() =>
    this.currentTheme() === 'indigo' ? 'Modo Claro' : 'Modo Oscuro'
  );

  constructor(private toast: ToastService) {
    this.applyThemeToDom(this.currentTheme());
  }

  private loadInitialTheme(): ThemePalette {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved === 'indigo' || saved === 'gold') {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'indigo';
  }

  setTheme(palette: ThemePalette, notify = false): void {
    this.currentTheme.set(palette);
    try {
      localStorage.setItem(this.STORAGE_KEY, palette);
    } catch {
      // Ignore storage error
    }
    this.applyThemeToDom(palette);

    if (notify) {
      const label = palette === 'indigo' ? 'Modo claro activado.' : 'Modo oscuro activado.';
      this.toast.show(label, 'info');
    }
  }

  toggleTheme(): void {
    const next: ThemePalette = this.currentTheme() === 'indigo' ? 'gold' : 'indigo';
    this.setTheme(next, false);
  }

  private applyThemeToDom(palette: ThemePalette): void {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', palette);
    document.documentElement.style.colorScheme = palette === 'indigo' ? 'light' : 'dark';
  }
}
