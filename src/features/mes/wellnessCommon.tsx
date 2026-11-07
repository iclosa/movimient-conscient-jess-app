import { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useWellness } from '@/api/hooks';
import { WellnessItem } from '@/api/models';
import { useStrings, useTheme } from '@/theme';
import { Space } from '@/theme/tokens';
import { EmptyState, ErrorBox, IconName, Loading, SubScreen } from '@/ui';

export function wellnessIcon(icon: string | null, type: string): IconName {
  const byName: Record<string, IconName> = {
    sparkles: 'sparkles-outline', sun: 'sunny-outline', wind: 'leaf-outline', bell: 'notifications-outline', heart: 'heart-outline',
  };
  if (icon && byName[icon]) return byName[icon];
  switch (type) {
    case 'mindfulness': return 'sparkles-outline';
    case 'sunrise': return 'sunny-outline';
    case 'breathing': return 'leaf-outline';
    case 'meditation_timer': return 'notifications-outline';
    case 'gratitude': return 'heart-outline';
    default: return 'flower-outline';
  }
}

/** Ruta de la pantalla propia de cada tipo de herramienta. */
export function wellnessRoute(item: WellnessItem): string {
  switch (item.type) {
    case 'mindfulness': return '/mes/mindfulness';
    case 'sunrise': return '/mes/sortida-del-sol';
    case 'breathing': return '/mes/respiracio';
    case 'meditation_timer': return '/mes/meditacio';
    case 'gratitude': return '/mes/gratitud';
    default: return `/mes/proposta/${item.id}`;
  }
}

/** Estructura común: barra con el título de la herramienta y carga del elemento. */
export function WellnessScaffold({
  type, itemId, children, fallbackTitleKey, scroll = true, onRefresh, refreshing,
}: {
  type: string;
  itemId?: number;
  children: (item: WellnessItem) => ReactNode;
  fallbackTitleKey?: string;
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const s = useStrings();
  const items = useWellness();
  const item = items.data?.find((i) => (itemId != null ? i.id === itemId : i.type === type));
  return (
    <SubScreen
      fallback="/mes"
      title={item?.title ?? (fallbackTitleKey ? s(fallbackTitleKey) : '')}
      scroll={scroll}
      onRefresh={onRefresh}
      refreshing={refreshing}
    >
      {items.isPending ? (
        <Loading />
      ) : items.isError ? (
        <ErrorBox error={items.error} onRetry={() => void items.refetch()} />
      ) : !item ? (
        <EmptyState icon="flower-outline" title={s('wellness_unavailable')} />
      ) : (
        children(item)
      )}
    </SubScreen>
  );
}

export function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** Anillo de progreso grande con contenido en el centro. */
export function BigRing({ progress, children, size = 240 }: { progress: number; children: ReactNode; size?: number }) {
  const c = useTheme();
  const stroke = 10;
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.surface300} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke={c.turquesa} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - p)} rotation={-90} origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children}
    </View>
  );
}

export const gap = Space.s3;
