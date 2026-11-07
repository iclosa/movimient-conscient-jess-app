import { useEffect } from 'react';
import { View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { Caveat_500Medium } from '@expo-google-fonts/caveat';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from '@/session';
import { PrefsProvider, usePrefs } from '@/theme';
import { FeedbackProvider } from '@/ui';

void SplashScreen.preventAutoHideAsync().catch(() => {});

// Sin reintentos automáticos: los errores de la API se muestran con "Torna-ho a provar".
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 15_000, refetchOnWindowFocus: false } },
});

const PUBLIC = ['login', 'registre'];

/** Lleva a cada pantalla según el estado de la sesión (equivale al redirect del router). */
function SessionGate() {
  const { status } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const { palette: c } = usePrefs();

  useEffect(() => {
    if (status === 'signedOut') queryClient.clear();
  }, [status]);

  useEffect(() => {
    const first = String(segments[0] ?? '');
    const inAuth = first === '(auth)';
    const atSplash = first === '' || first === 'index';
    if (status === 'restoring' || status === 'offline') {
      if (!atSplash) router.replace('/');
    } else if (status === 'signedOut') {
      if (!inAuth) router.replace('/login');
    } else if (status === 'signedIn') {
      if (inAuth || atSplash) router.replace('/resum');
    }
  }, [status, segments, router]);

  return (
    <View style={{ flex: 1, backgroundColor: c.surface100 }}>
      <StatusBar style={c.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.surface100 } }} />
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold,
    Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Caveat_500Medium,
  });

  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PrefsProvider>
          <SessionProvider>
            <FeedbackProvider>
              <SessionGate />
            </FeedbackProvider>
          </SessionProvider>
        </PrefsProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
