import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';
import { useSun } from '@/api/hooks';
import { SunDay, SunInfo, WellnessItem } from '@/api/models';
import { Strings } from '@/i18n';
import { useStrings, useTheme } from '@/theme';
import { fonts, Space } from '@/theme/tokens';
import { AppCard, ErrorBox, IconName, Loading, SectionHeader, Txt } from '@/ui';
import { WellnessScaffold } from './wellnessCommon';

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function SunriseScreen() {
  const s = useStrings();
  const qc = useQueryClient();
  const sun = useSun();
  const [now, setNow] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <WellnessScaffold
      type="sunrise"
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await qc.invalidateQueries({ queryKey: ['sun'] });
        setRefreshing(false);
      }}
    >
      {(item) =>
        sun.isPending ? <Loading /> : sun.isError ? <ErrorBox error={sun.error} onRetry={() => void sun.refetch()} /> : (
          <Content item={item} info={sun.data} now={now} s={s} />
        )
      }
    </WellnessScaffold>
  );
}

/** Cuenta atrás hasta la salida del sol (en horas y minutos). */
export function countdown(s: Strings, target: Date, now: Date): string {
  const diffMin = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 60000));
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return h > 0 ? s('sun_in_hm', { h, m }) : s('sun_in_m', { m });
}

export function Content({ item, info, now, s }: { item: WellnessItem; info: SunInfo; now: Date; s: Strings }) {
  const c = useTheme();
  const today = info.days.find((d) => sameDay(d.date, now)) ?? info.days[0];
  const next = info.days.find((d) => d.sunrise && d.sunrise.getTime() > now.getTime());

  if (!today) return <Txt variant="bodyLarge">{s('sun_no_data')}</Txt>;

  return (
    <View>
      {item.description ? <Txt variant="bodyLarge">{item.description}</Txt> : null}
      <View style={{ height: Space.s4 }} />
      <AppCard color={c.isDark ? c.surface200 : '#FBF3DF'}>
        <Txt variant="label" muted>{s('sun_next_sunrise')}</Txt>
        {!next ? (
          <Txt variant="bodyLarge" style={{ marginTop: Space.s1 }}>{s('sun_no_data')}</Txt>
        ) : (
          <View style={{ marginTop: Space.s1 }}>
            <Txt style={{ fontFamily: fonts.displayExtra, fontSize: 56, lineHeight: 60 }}>{s.time(next.sunrise!)}</Txt>
            <Txt variant="titleSmall" style={{ marginTop: Space.s1 }}>{`${s.relativeDay(next.sunrise!, now)} · ${countdown(s, next.sunrise!, now)}`}</Txt>
          </View>
        )}
        <View style={{ marginTop: Space.s4 }}>
          <SunArc day={today} now={now} line={c.line} sun={c.warning} trail={c.turquesa} />
        </View>
      </AppCard>

      <SectionHeader title={s('sun_today')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.s3 }}>
        <Fact icon="partly-sunny-outline" label={s('sun_first_light')} time={today.firstLight} s={s} />
        <Fact icon="sunny-outline" label={s('sun_sunrise')} time={today.sunrise} s={s} />
        <Fact icon="sunny" label={s('sun_noon')} time={today.solarNoon} s={s} />
        <Fact icon="moon-outline" label={s('sun_sunset')} time={today.sunset} s={s} />
        <Fact icon="cloudy-night-outline" label={s('sun_last_light')} time={today.lastLight} s={s} />
        <View style={{ width: '47.8%', flexGrow: 1 }}>
          <AppCard style={{ minHeight: 72, justifyContent: 'center' }}>
            <Txt variant="caption">{s('sun_daylight')}</Txt>
            <Txt variant="titleMedium">{today.daylightMinutes == null ? '—' : s.duration(today.daylightMinutes)}</Txt>
          </AppCard>
        </View>
      </View>

      <SectionHeader title={s('sun_week')} />
      <AppCard padding={0}>
        {info.days.map((d, i) => (
          <View
            key={d.date.getTime()}
            style={{
              flexDirection: 'row', paddingHorizontal: Space.s4, paddingVertical: Space.s3,
              borderTopWidth: i > 0 ? 1 : 0, borderTopColor: c.line,
            }}
          >
            <Txt variant="body" style={{ flex: 3 }}>{s.relativeDay(d.date, now)}</Txt>
            <Txt variant="titleSmall" style={{ flex: 2 }}>{d.sunrise ? `↑ ${s.time(d.sunrise)}` : '—'}</Txt>
            <Txt variant="titleSmall" style={{ flex: 2 }}>{d.sunset ? `↓ ${s.time(d.sunset)}` : '—'}</Txt>
          </View>
        ))}
      </AppCard>
      {info.location ? <Txt variant="small" style={{ marginTop: Space.s3 }}>{s('sun_location', { place: info.location })}</Txt> : null}
    </View>
  );
}

function Fact({ icon, label, time, s }: { icon: IconName; label: string; time: Date | null; s: Strings }) {
  const c = useTheme();
  return (
    <View style={{ width: '47.8%', flexGrow: 1 }}>
      <AppCard style={{ minHeight: 72, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s3 }}>
          <Ionicons name={icon} size={24} color={c.violeta} />
          <View style={{ flex: 1 }}>
            <Txt variant="caption">{label}</Txt>
            <Txt variant="titleMedium">{time ? s.time(time) : '—'}</Txt>
          </View>
        </View>
      </AppCard>
    </View>
  );
}

/** Arco del recorrido del sol entre la salida y la puesta de hoy. */
function SunArc({ day, now, line, sun, trail }: { day: SunDay; now: Date; line: string; sun: string; trail: string }) {
  const W = 300, H = 120;
  const base = { x: W / 2, y: H - 8 };
  const radius = Math.min(W / 2 - 12, H - 20);
  const point = (angle: number) => ({ x: base.x + radius * Math.cos(angle), y: base.y + radius * Math.sin(angle) });
  const arc = (from: number, to: number) => {
    const a = point(from), b = point(to);
    return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${to - from > Math.PI ? 1 : 0} 1 ${b.x} ${b.y}`;
  };

  const rise = day.sunrise, set = day.sunset;
  let progress: number | null = null;
  if (rise && set) {
    const span = set.getTime() - rise.getTime();
    if (span > 0 && now > rise && now < set) progress = (now.getTime() - rise.getTime()) / span;
  }
  const sunPos = progress == null ? null : point(Math.PI + Math.PI * progress);

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Line x1={base.x - radius - 8} y1={base.y} x2={base.x + radius + 8} y2={base.y} stroke={line} strokeWidth={2} />
      <Path d={arc(Math.PI, 2 * Math.PI - 0.0001)} stroke={line} strokeWidth={3} strokeLinecap="round" fill="none" />
      {progress != null ? <Path d={arc(Math.PI, Math.PI + Math.PI * progress)} stroke={trail} strokeWidth={4} strokeLinecap="round" fill="none" /> : null}
      {sunPos ? <Circle cx={sunPos.x} cy={sunPos.y} r={11} fill={sun} /> : null}
    </Svg>
  );
}
