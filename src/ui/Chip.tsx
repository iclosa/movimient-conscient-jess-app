import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme';
import { Radii, Space } from '@/theme/tokens';
import { Txt } from './Text';

/** Chip seleccionable (equivale a ChoiceChip/FilterChip). */
export function Chip({ label, selected, onPress, dot }: { label: string; selected: boolean; onPress: () => void; dot?: string }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        minHeight: 40, paddingHorizontal: Space.s4, borderRadius: Radii.pill, flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: selected ? c.violeta : c.surface200, borderWidth: 1, borderColor: selected ? c.violeta : c.line,
      }}
    >
      {dot ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: dot }} /> : null}
      <Txt variant="label" color={selected ? c.onVioleta : c.ink} style={{ fontSize: 14 }}>{label}</Txt>
    </Pressable>
  );
}

/** Selector segmentado (CA | ES, tema, etc.). */
export function Segmented<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', borderRadius: Radii.pill, borderWidth: 1, borderColor: c.line, overflow: 'hidden' }} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={{ flex: 1, minHeight: 40, paddingHorizontal: Space.s3, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.violeta : 'transparent' }}
          >
            <Txt variant="label" color={on ? c.onVioleta : c.ink}>{o.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
