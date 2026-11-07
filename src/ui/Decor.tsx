import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';
import { withAlpha } from '@/theme/tokens';

/** Círculos suaves de fondo, el motivo de formas de la guía. */
export function SoftShapes({ children }: { children: ReactNode }) {
  const c = useTheme();
  const a = withAlpha(c.turquesa, c.isDark ? 0.16 : 0.12);
  const b = withAlpha(c.violeta, c.isDark ? 0.18 : 0.1);
  const dot = (size: number, color: string, pos: object) => (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, pos]}
    />
  );
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {dot(220, a, { top: -70, right: -60 })}
      {dot(180, b, { top: 120, left: -90 })}
      {dot(200, b, { bottom: -80, right: -40 })}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
