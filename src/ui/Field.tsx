import { ReactNode, useState } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '@/theme';
import { Radii, Space, fonts } from '@/theme/tokens';
import { Txt } from './Text';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string | null;
  helper?: string;
  right?: ReactNode;
  multiline?: boolean;
}

/** Campo de texto con etiqueta, ayuda y error (estilo de la guía: borde 16, foco violeta). */
export function Field({ label, error, helper, right, multiline, ...input }: Props) {
  const c = useTheme();
  const [focus, setFocus] = useState(false);
  const border = error ? c.error : focus ? c.violeta : c.line;
  return (
    <View>
      <Txt variant="label" muted style={{ marginBottom: 6 }}>{label}</Txt>
      <View
        style={{
          flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center', backgroundColor: c.surface200,
          borderRadius: Radii.md, borderWidth: focus || error ? 2 : 1, borderColor: border, paddingHorizontal: Space.s4,
        }}
      >
        <TextInput
          {...input}
          multiline={multiline}
          accessibilityLabel={label}
          placeholderTextColor={c.inkMuted}
          onFocus={(e) => { setFocus(true); input.onFocus?.(e); }}
          onBlur={(e) => { setFocus(false); input.onBlur?.(e); }}
          style={{
            flex: 1, color: c.ink, fontFamily: fonts.sans, fontSize: 16,
            minHeight: multiline ? 88 : 52, paddingVertical: Space.s3, textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
        {right}
      </View>
      {error ? <Txt variant="small" color={c.error} style={{ marginTop: 4 }}>{error}</Txt> : helper ? <Txt variant="small" style={{ marginTop: 4 }}>{helper}</Txt> : null}
    </View>
  );
}
