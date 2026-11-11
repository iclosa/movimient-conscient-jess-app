import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { fonts, withAlpha } from '@/theme/tokens';
import { Txt } from './Text';

const BAR_HEIGHT = 68;
const SIDE = 16;

/** Espacio que ocupa la barra flotante, para que el contenido no quede tapado al final del scroll. */
export function useTabBarSpace(): number {
  const { bottom } = useSafeAreaInsets();
  return BAR_HEIGHT + Math.max(bottom, 12) + 16;
}

/** Subconjunto de las props que React Navigation pasa a una barra de pestañas personalizada. */
interface BottomTabBarProps {
  state: { index: number; routes: { key: string; name: string; params?: object }[] };
  descriptors: Record<string, { options: { title?: string } }>;
  emitter: { emit: (e: any) => any };
  navigateToTab: (routeKey: string) => void;
}

type Icon = keyof typeof Ionicons.glyphMap;
export type TabIcons = Record<string, { off: Icon; on: Icon }>;

/**
 * Barra inferior «liquid glass»: cápsula flotante translúcida. En iOS 26 usa el vidrio nativo del
 * sistema; en el resto, desenfoque + brillo y borde finos. El contenido se ve a través al hacer scroll.
 */
export function GlassTabBar({ state, descriptors, emitter, navigateToTab, icons }: BottomTabBarProps & { icons: TabIcons }) {
  const c = useTheme();
  const { bottom } = useSafeAreaInsets();
  const native = Platform.OS === 'ios' && isLiquidGlassAvailable();
  const radius = BAR_HEIGHT / 2;

  const items = (
    <View style={styles.row}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const label = typeof options.title === 'string' ? options.title : route.name;
        const ic = icons[route.name];
        const color = focused ? c.violeta : c.inkMuted;
        const press = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event?.defaultPrevented) {
            void Haptics.selectionAsync().catch(() => {});
            navigateToTab(route.key);
          }
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={press}
            onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
            style={styles.item}
          >
            <View
              style={[
                styles.pill,
                focused && {
                  backgroundColor: withAlpha(c.violeta, c.isDark ? 0.26 : 0.14),
                  borderColor: withAlpha(c.isDark ? '#FFFFFF' : c.violeta, c.isDark ? 0.22 : 0.18),
                  borderWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <Ionicons name={ic ? (focused ? ic.on : ic.off) : 'ellipse-outline'} size={24} color={color} />
              <Txt numberOfLines={1} color={color} style={{ fontFamily: focused ? fonts.sansBold : fonts.sansSemi, fontSize: 11, lineHeight: 14, includeFontPadding: false }}>
                {label}
              </Txt>
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  const shell = {
    position: 'absolute' as const,
    left: SIDE,
    right: SIDE,
    bottom: Math.max(bottom, 12),
    height: BAR_HEIGHT,
    borderRadius: radius,
  };

  if (native) {
    return (
      <GlassView glassEffectStyle="regular" colorScheme={c.isDark ? 'dark' : 'light'} style={[shell, styles.glassNative]}>
        {items}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        shell,
        styles.shadow,
        { shadowColor: c.isDark ? '#000000' : '#2A1740' },
      ]}
    >
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 55}
          tint={c.isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        {/* Velo de color y brillo superior: da el aspecto de vidrio */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(c.surface100, c.isDark ? 0.35 : 0.45) }]} />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: withAlpha('#FFFFFF', c.isDark ? 0.28 : 0.9) }} />
      </View>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor: withAlpha(c.isDark ? '#FFFFFF' : '#FFFFFF', c.isDark ? 0.18 : 0.75) }]}
      />
      {items}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  item: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' },
  pill: { minWidth: 62, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 26, borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent' },
  shadow: { shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  glassNative: { overflow: 'hidden' },
});
