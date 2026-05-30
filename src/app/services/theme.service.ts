import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';

export type ThemePreference = 'system' | 'light' | 'dark';

interface NativeThemePlugin {
  setSystemBarColors(options: {
    statusBarColor: string;
    navigationBarColor: string;
    dark: boolean;
  }): Promise<void>;
}

const NativeTheme = registerPlugin<NativeThemePlugin>('NativeTheme');

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
    const isDark = preference === 'dark' || (preference === 'system' && !!this.darkQuery?.matches);

    root.classList.remove('app-theme-light', 'app-theme-dark');

    if (preference === 'light') {
      root.classList.add('app-theme-light');
      root.style.colorScheme = 'light';
      void this.applySystemBars(isDark);
      return;
    }

    if (preference === 'dark') {
      root.classList.add('app-theme-dark');
      root.style.colorScheme = 'dark';
      void this.applySystemBars(isDark);
      return;
    }

    root.style.colorScheme = this.darkQuery?.matches ? 'dark' : 'light';
    void this.applySystemBars(isDark);
  }

  private async applySystemBars(isDark: boolean): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const statusBarStyle = isDark ? Style.Dark : Style.Light;
    const systemBarsStyle = isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light;
    const statusBarColor = isDark ? '#151a28' : '#ffffff';
    const navigationBarColor = isDark ? '#111522' : '#ffffff';

    const tasks = [
      this.settle(StatusBar.setStyle({ style: statusBarStyle })),
      this.settle(StatusBar.setBackgroundColor({ color: statusBarColor })),
      this.settle(SystemBars.setStyle({ style: systemBarsStyle })),
      this.settle(NativeTheme.setSystemBarColors({
        statusBarColor,
        navigationBarColor,
        dark: isDark
      }))
    ];
    const results = await Promise.all(tasks);

    const failed = results.filter(result => !result.ok);

    if (failed.length === results.length) {
      console.warn('No se pudieron actualizar las barras del sistema:', failed);
    }
  }

  private async settle(promise: Promise<void>): Promise<{ ok: boolean; error?: unknown }> {
    try {
      await promise;
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  private normalizePreference(value: string | null): ThemePreference {
    return value === 'light' || value === 'dark' || value === 'system'
      ? value
      : 'system';
  }
}
