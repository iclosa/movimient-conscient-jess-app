import { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Header, pagePadding } from './Common';

/** Pantalla secundaria: barra de título con "atrás" y contenido con scroll. */
export function SubScreen({
  title, children, onRefresh, refreshing, right, scroll = true, fallback = '/perfil',
}: {
  title: string;
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  right?: ReactNode;
  scroll?: boolean;
  fallback?: string;
}) {
  const c = useTheme();
  const router = useRouter();
  const back = () => (router.canGoBack() ? router.back() : router.replace(fallback as any));
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.surface100 }}>
      <Header title={title} onBack={back} right={right} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={pagePadding}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.violeta} /> : undefined}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}
