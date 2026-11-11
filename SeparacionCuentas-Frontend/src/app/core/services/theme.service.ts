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
    this.currentTheme() === 'indigo'
      ? 'Modo Claro · Blanco Hielo + Índigo'
      : 'Modo Oscuro · Azul Noche + Dorado'
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

  setTheme(palette: ThemePalette, notify = true): void {
    this.currentTheme.set(palette);
    try {
      localStorage.setItem(this.STORAGE_KEY, palette);
    } catch {
      // Ignore storage error
    }
    this.applyThemeToDom(palette);

    if (notify) {
      const label =
        palette === 'indigo'
          ? 'Paleta Blanco Hielo + Índigo (Modo Claro) activada.'
          : 'Paleta Azul Noche + Dorado (Modo Oscuro) activada.';
      this.toast.show(label, 'info');
    }
  }

  toggleTheme(): void {
    const next: ThemePalette = this.currentTheme() === 'indigo' ? 'gold' : 'indigo';
    this.setTheme(next, true);
  }

  private applyThemeToDom(palette: ThemePalette): void {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', palette);
    document.documentElement.style.colorScheme = palette === 'indigo' ? 'light' : 'dark';
  }

  copyCurrentPaletteCss(): void {
    if (typeof document === 'undefined') return;
    const varNames = [
      '--bg',
      '--surface',
      '--surface-alt',
      '--sidebar',
      '--border',
      '--text',
      '--muted',
      '--accent',
      '--accent-bright',
      '--on-accent',
      '--success'
    ];
    const computedStyle = getComputedStyle(document.documentElement);
    const cssBlock =
      `/* SplitBill AI (slit.ia) - Paleta ${this.currentTheme()} */\n:root {\n` +
      varNames.map(name => `  ${name}: ${computedStyle.getPropertyValue(name).trim()};`).join('\n') +
      `\n}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cssBlock).then(() => {
        this.toast.show('Variables CSS de la paleta copiadas al portapapeles.', 'success');
      });
    } else {
      this.toast.show('Variables CSS listas en styles.css.', 'info');
    }
  }
}
