import { ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleProp, View, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UseQueryResult } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '@/api/client';
import { useStrings, useTheme } from '@/theme';
import { Radii, Space, cardShadow, withAlpha } from '@/theme/tokens';
import { Button } from './Button';
<<<<<<< HEAD
=======
import { useTabBarSpace } from './GlassTabBar';
>>>>>>> 421b520 (Initial commit)
import { Txt } from './Text';
import { errorText } from './Feedback';

export type IconName = keyof typeof Ionicons.glyphMap;

/** Márgenes laterales estándar de las pantallas. */
export const pagePadding = { paddingHorizontal: Space.s4, paddingTop: Space.s2, paddingBottom: Space.s6 };

/** Pantalla con scroll, fondo de la guía y (opcional) tirar para recargar. */
export function Screen({
  children, onRefresh, refreshing, edges = ['top'], contentStyle, scroll = true,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
}) {
  const c = useTheme();
<<<<<<< HEAD
=======
  const tabSpace = useTabBarSpace();
>>>>>>> 421b520 (Initial commit)
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: c.surface100 }}>
      {scroll ? (
        <ScrollView
<<<<<<< HEAD
          contentContainerStyle={[pagePadding, contentStyle]}
=======
          contentContainerStyle={[pagePadding, { paddingBottom: Space.s6 + tabSpace }, contentStyle]}
>>>>>>> 421b520 (Initial commit)
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.violeta} /> : undefined}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function AppCard({
  children, onPress, color, padding = Space.s4, style, accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  color?: string;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const c = useTheme();
  const box: ViewStyle = { backgroundColor: color ?? c.surface200, borderRadius: Radii.lg, padding, ...cardShadow(c) };
  if (!onPress) return <View accessibilityLabel={accessibilityLabel} style={[box, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [box, pressed ? { opacity: 0.85 } : null, style]}
    >
      {children}
    </Pressable>
  );
}

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Space.s5, marginBottom: Space.s2 }}>
      <Txt variant="titleMedium" accessibilityRole="header" style={{ flex: 1 }}>{title}</Txt>
      {actionLabel ? <Button variant="text" label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

export function Pill({
  label, background, foreground, icon,
}: { label: string; background?: string; foreground?: string; icon?: IconName }) {
  const c = useTheme();
  const fg = foreground ?? c.ink;
  return (
    <View
      style={{
        alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: Space.s3, paddingVertical: 6, borderRadius: Radii.pill, backgroundColor: background ?? c.surface300,
      }}
    >
      {icon ? <Ionicons name={icon} size={14} color={fg} /> : null}
      <Txt variant="label" color={fg} numberOfLines={1} style={{ flexShrink: 1 }}>{label}</Txt>
    </View>
  );
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const s = useStrings();
  const c = useTheme();
  const network = error instanceof ApiError && error.isNetwork;
  return (
    <View style={{ alignItems: 'center', padding: Space.s5 }} accessibilityLiveRegion="polite">
      <Ionicons name={network ? 'cloud-offline-outline' : 'alert-circle-outline'} size={40} color={c.inkMuted} />
      <Txt variant="bodyLarge" center style={{ marginTop: Space.s3 }}>{errorText(error, s)}</Txt>
      {onRetry ? <Button variant="outlined" label={s('retry')} onPress={onRetry} style={{ marginTop: Space.s4 }} /> : null}
    </View>
  );
}

export function Loading() {
  const c = useTheme();
  return (
    <View style={{ padding: Space.s6, alignItems: 'center' }} accessibilityRole="progressbar">
      <ActivityIndicator color={c.violeta} size="large" />
    </View>
  );
}

/** Carga / error / datos de una consulta. */
export function QueryBody<T>({ query, children }: { query: UseQueryResult<T>; children: (data: T) => ReactNode }) {
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorBox error={query.error} onRetry={() => void query.refetch()} />;
  return <>{children(query.data)}</>;
}

export function EmptyState({
  icon, title, body, actionLabel, onAction,
}: { icon: IconName; title: string; body?: string; actionLabel?: string; onAction?: () => void }) {
  const c = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: Space.s5 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.surface300, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={30} color={c.violeta} />
      </View>
      <Txt variant="titleSmall" center style={{ marginTop: Space.s3 }}>{title}</Txt>
      {body ? <Txt variant="small" center style={{ marginTop: Space.s1 }}>{body}</Txt> : null}
      {actionLabel ? <Button label={actionLabel} onPress={onAction} style={{ marginTop: Space.s4 }} /> : null}
    </View>
  );
}

export function RatingStars({ value, onChange, size = 36 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row' }} accessibilityRole="adjustable" accessibilityLabel={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable
          key={i}
          disabled={!onChange}
          onPress={() => onChange?.(i)}
          accessibilityRole="button"
          accessibilityLabel={`${i}/5`}
          accessibilityState={{ selected: i <= value }}
          style={{ width: size + 8, height: size + 8, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name={i <= value ? 'star' : 'star-outline'} size={size} color={i <= value ? c.warning : c.inkMuted} />
        </Pressable>
      ))}
    </View>
  );
}

export const softBg = (color: string, alpha = 0.14) => withAlpha(color, alpha);

/** Tira horizontal con scroll (tarjetas de bonos, promociones…). */
export function HScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Space.s3, paddingVertical: Space.s1, paddingHorizontal: 2 }}>
      {children}
    </ScrollView>
  );
}

/** Pantalla secundaria con barra de título. */
export function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s2, minHeight: 56 }}>
      {onBack ? (
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="←" hitSlop={8} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={26} color={c.ink} />
        </Pressable>
      ) : <View style={{ width: Space.s2 }} />}
      <Txt variant="titleMedium" accessibilityRole="header" numberOfLines={1} style={{ flex: 1 }}>{title}</Txt>
      {right}
    </View>
  );
}
