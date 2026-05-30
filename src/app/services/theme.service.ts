import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type ThemePreference = 'system' | 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'theme-preference';
  private readonly darkQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
  private preference: ThemePreference = 'system';

  constructor() {
    this.darkQuery?.addEventListener('change', () => {
      if (this.preference === 'system') {
        this.applyTheme(this.preference);
      }
    });
  }

  async init(): Promise<ThemePreference> {
    const { value } = await Preferences.get({ key: this.storageKey });
    this.preference = this.normalizePreference(value);
    this.applyTheme(this.preference);
    return this.preference;
  }

  getPreference(): ThemePreference {
    return this.preference;
  }

  async setPreference(preference: ThemePreference): Promise<void> {
    this.preference = preference;
    await Preferences.set({
      key: this.storageKey,
      value: preference
    });
    this.applyTheme(preference);
  }

  private applyTheme(preference: ThemePreference): void {
    const root = document.documentElement;

    root.classList.remove('app-theme-light', 'app-theme-dark');

    if (preference === 'light') {
      root.classList.add('app-theme-light');
      root.style.colorScheme = 'light';
      return;
    }

    if (preference === 'dark') {
      root.classList.add('app-theme-dark');
      root.style.colorScheme = 'dark';
      return;
    }

    root.style.colorScheme = this.darkQuery?.matches ? 'dark' : 'light';
  }

  private normalizePreference(value: string | null): ThemePreference {
    return value === 'light' || value === 'dark' || value === 'system'
      ? value
      : 'system';
  }
}
