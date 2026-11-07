import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { fonts } from '@/theme/tokens';
import { useTheme } from '@/theme';

export type Variant =
  | 'display' | 'headline' | 'title' | 'titleMedium' | 'titleSmall' | 'body' | 'bodyLarge' | 'small' | 'label' | 'caption';

const variants: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.displayExtra, fontSize: 34, lineHeight: 38, letterSpacing: -0.2 },
  headline: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.2 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 29, letterSpacing: -0.2 },
  titleMedium: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, letterSpacing: -0.2 },
  titleSmall: { fontFamily: fonts.display, fontSize: 17, lineHeight: 21, letterSpacing: -0.2 },
  bodyLarge: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.sansSemi, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.sansSemi, fontSize: 12, lineHeight: 16 },
};

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  muted?: boolean;
  bold?: boolean;
  center?: boolean;
}

/** Texto con la tipografía de la guía (Bricolage Grotesque titulares, Figtree texto). */
export function Txt({ variant = 'body', color, muted, bold, center, style, ...rest }: Props) {
  const c = useTheme();
  const base = variants[variant];
  const isMuted = muted ?? (variant === 'small' || variant === 'caption');
  return (
    <RNText
      {...rest}
      style={[
        base,
        { color: color ?? (isMuted ? c.inkMuted : c.ink) },
        bold ? { fontFamily: fonts.sansBold } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
    />
  );
}
