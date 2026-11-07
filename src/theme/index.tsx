import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStrings, Locale, SUPPORTED_LOCALES, Strings } from '@/i18n';
import { darkPalette, lightPalette, Palette } from './tokens';

export type ThemeMode = 'light' | 'dark' | 'system';

interface Prefs {
  locale: Locale;
  setLocale: (l: Locale) => void;
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  palette: Palette;
  s: Strings;
  ready: boolean;
}

const PrefsContext = createContext<Prefs | null>(null);

async function read(key: string): Promise<string | null> {
  try { return await AsyncStorage.getItem(key); } catch { return null; }
}
async function write(key: string, value: string) {
  try { await AsyncStorage.setItem(key, value); } catch { /* sin almacenamiento: la preferencia dura la sesión */ }
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ca');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);
  const system = useColorScheme();

  useEffect(() => {
    (async () => {
      const l = await read('locale');
      const t = await read('theme');
      if (l && (SUPPORTED_LOCALES as string[]).includes(l)) setLocaleState(l as Locale);
      if (t === 'dark' || t === 'system' || t === 'light') setThemeModeState(t);
      setReady(true);
    })();
  }, []);

  const value = useMemo<Prefs>(() => {
    const dark = themeMode === 'dark' || (themeMode === 'system' && system === 'dark');
    return {
      locale,
      setLocale: (l) => { setLocaleState(l); void write('locale', l); },
      themeMode,
      setThemeMode: (m) => { setThemeModeState(m); void write('theme', m); },
      palette: dark ? darkPalette : lightPalette,
      s: createStrings(locale),
      ready,
    };
  }, [locale, themeMode, system, ready]);

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): Prefs {
  const v = useContext(PrefsContext);
  if (!v) throw new Error('PrefsProvider ausente');
  return v;
}
export const useTheme = () => usePrefs().palette;
export const useStrings = () => usePrefs().s;
