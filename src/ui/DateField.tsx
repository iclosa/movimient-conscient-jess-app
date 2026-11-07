import { useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { toApiDate, parseDate } from '@/api/models';
import { usePrefs, useStrings, useTheme } from '@/theme';
import { Radii, Space, fonts } from '@/theme/tokens';
import { Button } from './Button';
import { Sheet } from './Sheet';
import { Txt } from './Text';

interface Props {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  initialDate?: Date;
  error?: string | null;
}

/** Selector de fecha: diálogo nativo en Android, hoja con rueda en iOS y texto AAAA-MM-DD en web. */
export function DateField({ label, value, onChange, minimumDate, maximumDate, initialDate, error }: Props) {
  const c = useTheme();
  const s = useStrings();
  const { locale } = usePrefs();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? initialDate ?? new Date());
  const [webText, setWebText] = useState(value ? toApiDate(value) : '');

  const border = error ? c.error : c.line;

  if (Platform.OS === 'web') {
    return (
      <View>
        <Txt variant="label" muted style={{ marginBottom: 6 }}>{label}</Txt>
        <TextInput
          value={webText}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={c.inkMuted}
          accessibilityLabel={label}
          onChangeText={(t) => {
            setWebText(t);
            if (/^\d{4}-\d{2}-\d{2}$/.test(t)) onChange(parseDate(t));
          }}
          style={{ minHeight: 52, borderWidth: 1, borderColor: border, borderRadius: Radii.md, paddingHorizontal: Space.s4, color: c.ink, backgroundColor: c.surface200, fontFamily: fonts.sans, fontSize: 16 }}
        />
        {error ? <Txt variant="small" color={c.error} style={{ marginTop: 4 }}>{error}</Txt> : null}
      </View>
    );
  }

  const show = () => {
    setDraft(value ?? initialDate ?? new Date());
    setOpen(true);
  };

  return (
    <View>
      <Txt variant="label" muted style={{ marginBottom: 6 }}>{label}</Txt>
      <Pressable
        onPress={show}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? s.dateMedium(value) : s('not_set')}`}
        style={{
          minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.s4,
          borderRadius: Radii.md, borderWidth: 1, borderColor: border, backgroundColor: c.surface200,
        }}
      >
        <Txt variant="bodyLarge" color={value ? c.ink : c.inkMuted}>{value ? s.dateMedium(value) : s('not_set')}</Txt>
        <Ionicons name="calendar-outline" size={22} color={c.inkMuted} />
      </Pressable>
      {error ? <Txt variant="small" color={c.error} style={{ marginTop: 4 }}>{error}</Txt> : null}

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draft}
          mode="date"
          locale={locale}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(e, d) => {
            setOpen(false);
            if (e.type === 'set' && d) onChange(d);
          }}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Sheet visible={open} onClose={() => setOpen(false)}>
          <DateTimePicker
            value={draft}
            mode="date"
            display="spinner"
            locale={locale}
            themeVariant={c.isDark ? 'dark' : 'light'}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={(_, d) => d && setDraft(d)}
          />
          <Button label={s('save')} onPress={() => { onChange(draft); setOpen(false); }} />
        </Sheet>
      ) : null}
    </View>
  );
}
