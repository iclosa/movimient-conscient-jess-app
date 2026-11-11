import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActivities, useSessions, useSettings } from '@/api/hooks';
import { ClassSession, isPaymentPending } from '@/api/models';
import { useStrings, useTheme } from '@/theme';
import { activityTone, fonts, Radii, Space, withAlpha } from '@/theme/tokens';
<<<<<<< HEAD
import { AppCard, Chip, EmptyState, ErrorBox, IconName, Loading, Pill, Txt } from '@/ui';
import { SessionSheet } from './SessionSheet';

const dayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
=======
import { AppCard, Chip, EmptyState, Segmented, ErrorBox, IconName, Loading, Pill, Txt, useTabBarSpace } from '@/ui';
import { MonthCalendar, dayOf, monthEnd, monthStart } from './MonthCalendar';
import { SessionSheet } from './SessionSheet';

>>>>>>> 421b520 (Initial commit)
const sameDay = (a: Date, b: Date) => dayOf(a).getTime() === dayOf(b).getTime();

export function ReservarScreen() {
  const s = useStrings();
  const c = useTheme();
  const qc = useQueryClient();
<<<<<<< HEAD
=======
  const tabSpace = useTabBarSpace();
>>>>>>> 421b520 (Initial commit)
  const settings = useSettings();
  const openDays = Math.min(31, Math.max(1, settings.data?.bookingOpenDays ?? 14));
  const today = dayOf(new Date());
  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + openDays - 1);
<<<<<<< HEAD
  const sessions = useSessions(today, to);
=======
  const [mode, setMode] = useState<'list' | 'calendar'>('list');
  const [month, setMonth] = useState(monthStart(today));
  const listSessions = useSessions(today, to);
  const monthSessions = useSessions(month.getTime() === monthStart(today).getTime() ? today : month, monthEnd(month));
  const sessions = mode === 'calendar' ? monthSessions : listSessions;
>>>>>>> 421b520 (Initial commit)
  const activities = useActivities();
  const [selected, setSelected] = useState(today);
  const [activityId, setActivityId] = useState<number | null>(null);
  const [open, setOpen] = useState<ClassSession | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const days = useMemo(
    () => Array.from({ length: openDays }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openDays, today.getTime()],
  );
  const filtered = (sessions.data ?? []).filter((x) => activityId == null || x.activity?.id === activityId);
<<<<<<< HEAD
=======
  const calendarSessions = (monthSessions.data ?? []).filter((x) => activityId == null || x.activity?.id === activityId);
>>>>>>> 421b520 (Initial commit)
  const daysWithClasses = new Set(filtered.filter((x) => x.state !== 'cancelled').map((x) => dayOf(x.startsAt).getTime()));
  const selectedSessions = filtered
    .filter((x) => sameDay(x.startsAt, selected))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([qc.invalidateQueries({ queryKey: ['sessions'] }), qc.invalidateQueries({ queryKey: ['settings'] })]);
    setRefreshing(false);
  };

<<<<<<< HEAD
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.surface100 }}>
      <Txt variant="titleMedium" accessibilityRole="header" style={{ paddingHorizontal: Space.s4, paddingVertical: Space.s3 }}>
        {s('tab_reservar')}
      </Txt>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Space.s4, paddingVertical: Space.s2, gap: Space.s2 }}>
          {days.map((d) => (
            <DayChip
              key={d.getTime()}
              day={d}
              selected={sameDay(d, selected)}
              hasClasses={daysWithClasses.has(d.getTime())}
              onPress={() => setSelected(d)}
            />
          ))}
        </ScrollView>
=======
  const header = (
      <View>
        {mode === 'list' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Space.s4, paddingVertical: Space.s2, gap: Space.s2 }}>
            {days.map((d) => (
              <DayChip
                key={d.getTime()}
                day={d}
                selected={sameDay(d, selected)}
                hasClasses={daysWithClasses.has(d.getTime())}
                onPress={() => setSelected(d)}
              />
            ))}
          </ScrollView>
        ) : null}
>>>>>>> 421b520 (Initial commit)
        {(activities.data?.length ?? 0) >= 2 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Space.s4, paddingVertical: Space.s2, gap: Space.s2 }}>
            <Chip label={s('all_activities')} selected={activityId == null} onPress={() => setActivityId(null)} />
            {activities.data!.map((a) => (
              <Chip
                key={a.id}
                label={a.name}
                dot={a.color}
                selected={activityId === a.id}
                onPress={() => setActivityId(activityId === a.id ? null : a.id)}
              />
            ))}
          </ScrollView>
        ) : null}
<<<<<<< HEAD
=======
        {mode === 'calendar' ? (
          <View style={{ paddingTop: Space.s2 }}>
            <MonthCalendar
              month={month}
              onMonthChange={(m) => {
                setMonth(m);
                setSelected(m.getTime() === monthStart(today).getTime() ? today : m);
              }}
              sessions={calendarSessions}
              selected={selected}
              onSelect={setSelected}
            />
          </View>
        ) : null}
>>>>>>> 421b520 (Initial commit)
        <Txt variant="titleSmall" style={{ paddingHorizontal: Space.s4, paddingTop: Space.s3, paddingBottom: Space.s1 }}>
          {s.dateLong(selected)}
        </Txt>
      </View>
<<<<<<< HEAD

      {sessions.isPending ? (
        <Loading />
      ) : sessions.isError ? (
        <ErrorBox error={sessions.error} onRetry={() => void sessions.refetch()} />
      ) : (
        <FlatList
          data={selectedSessions}
          keyExtractor={(x) => String(x.id)}
          contentContainerStyle={{ paddingHorizontal: Space.s4, paddingTop: Space.s2, paddingBottom: Space.s6, gap: Space.s3, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.violeta} />}
          ListEmptyComponent={
            <View style={{ marginTop: Space.s5 }}>
              <EmptyState icon="body-outline" title={s('no_classes_day')} body={s('no_classes_day_body')} />
            </View>
=======
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.surface100 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s4, paddingVertical: Space.s3 }}>
        <Txt variant="titleMedium" accessibilityRole="header" style={{ flex: 1 }}>{s('tab_reservar')}</Txt>
        <View style={{ width: 200 }}>
          <Segmented
            value={mode}
            onChange={(m) => {
              setMode(m);
              if (m === 'calendar') setMonth(monthStart(selected));
            }}
            options={[{ value: 'list', label: s('view_list') }, { value: 'calendar', label: s('view_calendar') }]}
          />
        </View>
      </View>
      {mode === 'list' ? header : null}
      {mode === 'list' && sessions.isPending ? (
        <Loading />
      ) : mode === 'list' && sessions.isError ? (
        <ErrorBox error={sessions.error} onRetry={() => void sessions.refetch()} />
      ) : (
        <FlatList
          data={sessions.isPending || sessions.isError ? [] : selectedSessions}
          ListHeaderComponent={mode === 'calendar' ? <View style={{ marginHorizontal: -Space.s4 }}>{header}</View> : undefined}
          keyExtractor={(x) => String(x.id)}
          contentContainerStyle={{ paddingHorizontal: Space.s4, paddingTop: Space.s2, paddingBottom: Space.s6 + tabSpace, gap: Space.s3, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.violeta} />}
          ListEmptyComponent={
            sessions.isPending ? (
              <Loading />
            ) : sessions.isError ? (
              <ErrorBox error={sessions.error} onRetry={() => void sessions.refetch()} />
            ) : (
              <View style={{ marginTop: Space.s5 }}>
                <EmptyState icon="body-outline" title={s('no_classes_day')} body={s('no_classes_day_body')} />
              </View>
            )
>>>>>>> 421b520 (Initial commit)
          }
          renderItem={({ item }) => <SessionTile session={item} onPress={() => setOpen(item)} />}
        />
      )}
      <SessionSheet session={open} onClose={() => setOpen(null)} />
    </SafeAreaView>
  );
}

function DayChip({ day, selected, hasClasses, onPress }: { day: Date; selected: boolean; hasClasses: boolean; onPress: () => void }) {
  const s = useStrings();
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={s.dateLong(day)}
      style={{
        width: 58, height: 76, borderRadius: Radii.lg, alignItems: 'center', justifyContent: 'center',
        backgroundColor: selected ? c.violeta : c.surface200, borderWidth: 1, borderColor: selected ? c.violeta : c.line,
      }}
    >
      <Txt variant="label" color={selected ? c.onVioleta : c.inkMuted}>{s.weekdayShort(day)}</Txt>
      <Txt color={selected ? c.onVioleta : c.ink} style={{ fontFamily: fonts.displayExtra, fontSize: 22, lineHeight: 27 }}>{s.dayNumber(day)}</Txt>
      <View
        style={{
          width: 6, height: 6, borderRadius: 3, marginTop: 2,
          backgroundColor: hasClasses ? (selected ? c.onVioleta : c.turquesa) : 'transparent',
        }}
      />
    </Pressable>
  );
}

function SessionTile({ session, onPress }: { session: ClassSession; onPress: () => void }) {
  const s = useStrings();
  const c = useTheme();
  const tone = activityTone(c, session.activity?.color ?? c.violeta, session.activity?.colorText);
  const dim = session.isPast || session.state === 'cancelled';

  let label: string, bg: string, fg: string, icon: IconName | undefined;
  if (session.state === 'cancelled') [label, bg, fg, icon] = [s('state_cancelled'), c.surface300, c.inkMuted, 'ban-outline'];
  else if (session.isPast) [label, bg, fg, icon] = [s('state_past'), c.surface300, c.inkMuted, 'time-outline'];
  else if (session.state === 'booked' && session.myBookings.some(isPaymentPending)) [label, bg, fg, icon] = [s('state_payment_pending'), withAlpha(c.warning, 0.18), c.isDark ? c.warning : c.ink, 'time-outline'];
  else if (session.state === 'booked') [label, bg, fg, icon] = [s('state_booked'), c.ok, c.isDark ? '#08262B' : '#FFFFFF', 'checkmark'];
  else if (session.state === 'waitlist') [label, bg, fg, icon] = [s('state_waitlist'), withAlpha(c.warning, 0.18), c.warning, 'hourglass-outline'];
  else if (session.state === 'full') [label, bg, fg, icon] = [s('state_full'), withAlpha(c.error, 0.12), c.error, undefined];
  else [label, bg, fg, icon] = [s('spots_left_short', { n: session.spotsLeft }), withAlpha(c.turquesa, 0.14), c.turquesa, undefined];

  const meta = [session.instructor?.name, session.room].filter(Boolean).join(' · ');
  return (
    <View style={{ opacity: dim ? 0.7 : 1 }}>
      <AppCard
        padding={0}
        onPress={onPress}
        accessibilityLabel={`${session.title}, ${s.timeRange(session.startsAt, session.endsAt)}, ${label}`}
      >
        <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
          <View style={{ width: 8, backgroundColor: tone.base, borderTopLeftRadius: Radii.lg, borderBottomLeftRadius: Radii.lg }} />
          <View style={{ width: 52 + Space.s3 * 2, paddingVertical: Space.s3, alignItems: 'center', justifyContent: 'center' }}>
            <Txt style={{ fontFamily: fonts.displayExtra, fontSize: 18 }}>{s.time(session.startsAt)}</Txt>
            <Txt variant="small">{s.time(session.endsAt)}</Txt>
          </View>
          <View style={{ flex: 1, paddingVertical: Space.s3, justifyContent: 'center' }}>
            <Txt variant="titleSmall" numberOfLines={2}>{session.title}</Txt>
            {meta ? <Txt variant="small" numberOfLines={1} style={{ marginTop: 2 }}>{meta}</Txt> : null}
          </View>
          <View style={{ padding: Space.s3, justifyContent: 'center' }}>
            <Pill label={label} background={bg} foreground={fg} icon={icon} />
          </View>
        </View>
      </AppCard>
    </View>
  );
}
