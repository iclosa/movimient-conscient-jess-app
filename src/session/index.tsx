import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ApiClient, ApiError } from '@/api/client';
import { UserProfile } from '@/api/models';
import { Repository } from '@/api/repository';
import { SUPPORTED_LOCALES } from '@/i18n';
import { usePrefs } from '@/theme';

export type SessionStatus = 'restoring' | 'signedOut' | 'signedIn' | 'offline';

const TOKEN_KEY = 'auth_token';

async function readToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(TOKEN_KEY); } catch { return null; }
}
async function saveToken(t: string) {
  try { await SecureStore.setItemAsync(TOKEN_KEY, t); } catch { /* la sesión dura mientras la app esté abierta */ }
}
async function clearToken() {
  try { await SecureStore.deleteItemAsync(TOKEN_KEY); } catch { /* nada */ }
}

interface SessionValue {
  status: SessionStatus;
  user: UserProfile | null;
  repo: Repository;
  restore: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  register: (p: { name: string; email: string; password: string; phone?: string; marketingConsent: boolean }) => Promise<void>;
  signOut: () => Promise<void>;
  /** Tras desactivar la cuenta: el token ya no vale. */
  forgetLocally: () => Promise<void>;
  setUser: (u: UserProfile) => void;
  refreshUser: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { locale, setLocale } = usePrefs();
  const [status, setStatus] = useState<SessionStatus>('restoring');
  const [user, setUserState] = useState<UserProfile | null>(null);
  const token = useRef<string | null>(null);
  const statusRef = useRef<SessionStatus>('restoring');
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const update = useCallback((s: SessionStatus, u: UserProfile | null = null) => {
    statusRef.current = s;
    setStatus(s);
    setUserState(u);
  }, []);

  const repo = useMemo(
    () =>
      new Repository(
        new ApiClient({
          readToken: () => token.current,
          onUnauthorized: () => {
            if (statusRef.current === 'signedIn') {
              token.current = null;
              void clearToken();
              update('signedOut');
            }
          },
        }),
      ),
    [update],
  );

  const adoptLocale = useCallback(
    (u: UserProfile) => {
      if ((SUPPORTED_LOCALES as string[]).includes(u.locale) && localeRef.current !== u.locale) setLocale(u.locale as any);
    },
    [setLocale],
  );

  const restore = useCallback(async () => {
    update('restoring');
    const saved = await readToken();
    if (!saved) return update('signedOut');
    token.current = saved;
    try {
      const me = await repo.me();
      adoptLocale(me);
      update('signedIn', me);
    } catch (e) {
      if (e instanceof ApiError && e.isUnauthorized) {
        token.current = null;
        await clearToken();
        update('signedOut');
      } else {
        update('offline');
      }
    }
  }, [repo, update, adoptLocale]);

  useEffect(() => { void restore(); }, [restore]);

  const start = useCallback(
    async (t: string, u: UserProfile) => {
      token.current = t;
      await saveToken(t);
      adoptLocale(u);
      update('signedIn', u);
    },
    [update, adoptLocale],
  );

  const value = useMemo<SessionValue>(
    () => ({
      status, user, repo, restore,
      signIn: async (email, password) => {
        const r = await repo.login(email, password);
        await start(r.token, r.user);
      },
      register: async (p) => {
        const r = await repo.register({ ...p, locale: localeRef.current });
        await start(r.token, r.user);
      },
      signOut: async () => {
        try { await repo.logout(); } catch { /* el token se descarta igualmente en este dispositivo */ }
        token.current = null;
        await clearToken();
        update('signedOut');
      },
      forgetLocally: async () => {
        token.current = null;
        await clearToken();
        update('signedOut');
      },
      setUser: (u) => update('signedIn', u),
      refreshUser: async () => update('signedIn', await repo.me()),
    }),
    [status, user, repo, restore, start, update],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const v = useContext(SessionContext);
  if (!v) throw new Error('SessionProvider ausente');
  return v;
}
