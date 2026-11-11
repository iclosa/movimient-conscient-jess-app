import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClassSession } from '@/api/models';
import { useStrings, useTheme } from '@/theme';
import { activityTone, fonts, Radii, Space } from '@/theme/tokens';
import { Txt } from '@/ui';

export const dayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const monthEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

const MAX_MONTHS_AHEAD = 6;

/** Calendario mensual: puntos de color por actividad, anillo en los días con reserva y selección de un día. */
export function MonthCalendar({
  month, onMonthChange, sessions, selected, onSelect,
}: {
  month: Date;
  onMonthChange: (m: Date) => void;
  sessions: ClassSession[];
  selected: Date;
  onSelect: (d: Date) => void;
}) {
  const s = useStrings();
  const c = useTheme();
  const today = dayOf(new Date());

  const byDay = new Map<number, ClassSession[]>();
  for (const x of sessions) {
    if (x.state === 'cancelled') continue;
    const k = dayOf(x.startsAt).getTime();
    byDay.set(k, [...(byDay.get(k) ?? []), x]);
  }

  // Semana que empieza en lunes.
  const first = monthStart(month);
  const lead = (first.getDay() + 6) % 7;
  const total = monthEnd(month).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: total }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const canPrev = first.getTime() > monthStart(today).getTime();
  const canNext = first.getTime() < new Date(today.getFullYear(), today.getMonth() + MAX_MONTHS_AHEAD, 1).getTime();
  const shift = (n: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const monday = new Date(2024, 0, 1);

  return (
    <View style={{ marginHorizontal: Space.s4, padding: Space.s3, borderRadius: Radii.lg, backgroundColor: c.surface200, borderWidth: 1, borderColor: c.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Space.s2 }}>
        <NavButton icon="chevron-back" label={s('month_prev')} disabled={!canPrev} onPress={() => shift(-1)} />
        <Txt variant="titleSmall" center accessibilityRole="header" style={{ flex: 1 }}>{s.monthYear(month)}</Txt>
        <NavButton icon="chevron-forward" label={s('month_next')} disabled={!canNext} onPress={() => shift(1)} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {Array.from({ length: 7 }, (_, i) => (
          <Txt key={i} variant="caption" center style={{ flex: 1 }}>
            {s.weekdayShort(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i))}
          </Txt>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: 'row', marginTop: 4 }}>
          {week.map((d, di) => (
            <View key={di} style={{ flex: 1, alignItems: 'center' }}>
              {d ? (
                <DayCell
                  day={d}
                  sessions={byDay.get(d.getTime()) ?? []}
                  isToday={d.getTime() === today.getTime()}
                  isPast={d.getTime() < today.getTime()}
                  selected={d.getTime() === dayOf(selected).getTime()}
                  onPress={() => onSelect(d)}
                />
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function NavButton({ icon, label, disabled, onPress }: { icon: 'chevron-back' | 'chevron-forward'; label: string; disabled: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.3 : 1 }}
    >
      <Ionicons name={icon} size={24} color={c.violeta} />
    </Pressable>
  );
}

function DayCell({
  day, sessions, isToday, isPast, selected, onPress,
}: { day: Date; sessions: ClassSession[]; isToday: boolean; isPast: boolean; selected: boolean; onPress: () => void }) {
  const s = useStrings();
  const c = useTheme();
  const booked = sessions.some((x) => x.myBookings.length > 0);
  // Hasta 3 colores distintos de actividad.
  const colors = [...new Set(sessions.map((x) => activityTone(c, x.activity?.color ?? c.violeta).base))].slice(0, 3);
  const fg = selected ? c.onVioleta : isPast ? c.inkMuted : c.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${s.dateLong(day)}${sessions.length ? `, ${sessions.length}` : ''}`}
      style={{ width: 44, height: 52, alignItems: 'center', justifyContent: 'center', opacity: isPast && !selected ? 0.6 : 1 }}
    >
      <View
        style={{
          width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
          backgroundColor: selected ? c.violeta : 'transparent',
          borderWidth: 2, borderColor: booked ? c.ok : isToday && !selected ? c.violeta : 'transparent',
        }}
      >
        <Txt color={fg} style={{ fontFamily: isToday || selected ? fonts.sansBold : fonts.sans, fontSize: 15, lineHeight: 20, includeFontPadding: false }}>
          {s.dayNumber(day)}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 3, height: 6, marginTop: 2 }}>
        {colors.map((col, i) => (
          <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: col }} />
        ))}
      </View>
    </Pressable>
  );
}
