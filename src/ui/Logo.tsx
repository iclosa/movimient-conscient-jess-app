import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { fonts, Space } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { Txt } from './Text';

/**
 * Logo provisional de Moviment Conscient (círculo crema, puntos turquesa y arcos).
 * TODO: sustituir por el archivo oficial cuando Jess lo facilite.
 */
export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Moviment Conscient" style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Circle cx={24} cy={24} r={23} fill="#FBF3DF" />
        {[10, 15.5, 21, 26.5].map((y) => (
          <Circle key={y} cx={24} cy={y} r={1.7} fill="#2BB5AE" />
        ))}
        <Path d="M 9 28 A 15 15 0 0 0 39 28" fill="none" stroke="#6B4BA8" strokeWidth={3} strokeLinecap="round" />
        <Path d="M 14 33 A 10 10 0 0 0 34 33" fill="none" stroke="#2BB5AE" strokeWidth={3} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

/** Logo + nombre + firma "by Jess". */
export function LogoLockup({ size = 44, center = false }: { size?: number; center?: boolean }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <LogoMark size={size} />
      <View style={{ marginLeft: Space.s3, alignItems: center ? 'center' : 'flex-start' }}>
        <Txt style={{ fontFamily: fonts.display, fontSize: size * 0.4, lineHeight: size * 0.46 }}>Moviment Conscient</Txt>
        <Txt color={c.turquesa} style={{ fontFamily: fonts.script, fontSize: size * 0.48, lineHeight: size * 0.52 }}>
          by Jess
        </Txt>
      </View>
    </View>
  );
}
