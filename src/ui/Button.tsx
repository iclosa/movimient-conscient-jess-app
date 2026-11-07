import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Radii, Space, fonts } from '@/theme/tokens';
import { Txt } from './Text';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: 'filled' | 'outlined' | 'text';
  disabled?: boolean;
  loading?: boolean;
  /** Color principal (relleno u borde/texto). */
  color?: string;
  /** Color del texto sobre un botón relleno. */
  onColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  accessibilityHint?: string;
}

export function Button({
  label, onPress, variant = 'filled', disabled, loading, color, onColor, icon, style, compact, accessibilityHint,
}: Props) {
  const c = useTheme();
  const main = color ?? c.violeta;
  const inactive = disabled || loading;
  const fg = variant === 'filled' ? onColor ?? (color ? c.surface100 : c.onVioleta) : main;
  const base: ViewStyle = {
    minHeight: variant === 'text' ? 48 : compact ? 44 : 52,
    paddingHorizontal: variant === 'text' ? Space.s3 : Space.s5,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Space.s2,
    ...(variant === 'filled' ? { backgroundColor: main } : null),
    ...(variant === 'outlined' ? { borderWidth: 1.5, borderColor: main } : null),
    opacity: inactive ? 0.55 : 1,
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [base, pressed && !inactive ? { opacity: 0.8 } : null, style]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
          <Txt style={{ fontFamily: fonts.sansBold, fontSize: variant === 'text' ? 15 : 16 }} color={fg}>
            {label}
          </Txt>
        </>
      )}
    </Pressable>
  );
}

export const Spacer = ({ h = Space.s3 }: { h?: number }) => <View style={{ height: h }} />;
export const hairline = StyleSheet.hairlineWidth;
