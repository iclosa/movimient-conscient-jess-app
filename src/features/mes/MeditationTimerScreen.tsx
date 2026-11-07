import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStrings, useTheme } from '@/theme';
import { fonts, Space } from '@/theme/tokens';
import { Button, Chip, EmptyState, Txt } from '@/ui';
import { Bell } from './bell';
import { KeepAwake } from './MindfulnessScreen';
import { BigRing, clock, WellnessScaffold } from './wellnessCommon';

export function MeditationTimerScreen() {
  const s = useStrings();
  return (
    <WellnessScaffold type="meditation_timer" scroll={false}>
      {(item) => {
        const raw = Array.isArray(item.config.options) ? item.config.options : [];
        const options = raw.filter((e: unknown): e is number => typeof e === 'number').map((e) => Math.trunc(e)).filter((e) => e > 0);
        const fallback = typeof item.config.default_minutes === 'number' ? Math.trunc(item.config.default_minutes) : null;
        if (options.length === 0 && fallback == null) {
          return <EmptyState icon="notifications-outline" title={s('timer_not_configured')} />;
        }
        const choices = options.length === 0 ? [fallback!] : options;
        const initial = fallback != null && choices.includes(fallback) ? fallback : choices[0];
        return <Body description={item.description} options={choices} initial={initial} bellOn={item.config.bell !== false} />;
      }}
    </WellnessScaffold>
  );
}

function Body({ description, options, initial, bellOn }: { description: string | null; options: number[]; initial: number; bellOn: boolean }) {
  const s = useStrings();
  const c = useTheme();
  const bell = useRef(new Bell()).current;
  const [minutes, setMinutes] = useState(initial);
  const total = minutes * 60;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const endsAt = useRef(0);

  useEffect(() => () => bell.dispose(), [bell]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      const left = Math.floor((endsAt.current - Date.now()) / 1000) + 1;
      if (left <= 0) {
        setRunning(false);
        setFinished(true);
        setRemaining(0);
        if (bellOn) void bell.ring();
      } else {
        setRemaining(left);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [running, bell, bellOn]);

  const idle = !running && remaining === total && !finished;

  const start = () => {
    const fresh = remaining === total || finished;
    const from = finished ? total : remaining;
    if (finished) setRemaining(total);
    endsAt.current = Date.now() + from * 1000;
    setFinished(false);
    setRunning(true);
    if (bellOn && fresh) void bell.ring();
  };

  const reset = () => {
    setRunning(false);
    setFinished(false);
    setRemaining(total);
  };

  return (
    <View style={{ flex: 1, padding: Space.s5 }}>
      {running ? <KeepAwake /> : null}
      {description ? <Txt variant="bodyLarge" center>{description}</Txt> : null}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <BigRing progress={total === 0 ? 0 : 1 - remaining / total}>
          <View style={{ alignItems: 'center' }} accessible accessibilityLabel={finished ? s('timer_done') : clock(remaining)}>
            <Txt style={{ fontFamily: fonts.displayExtra, fontSize: finished ? 32 : 54, lineHeight: finished ? 38 : 60 }}>
              {finished ? s('timer_done') : clock(remaining)}
            </Txt>
            {bellOn ? <Ionicons name="notifications-outline" size={20} color={c.inkMuted} /> : null}
          </View>
        </BigRing>
      </View>
      {idle ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Space.s2, marginBottom: Space.s4 }}>
          {options.map((m) => (
            <Chip key={m} label={s('minutes_short', { n: m })} selected={minutes === m} onPress={() => { setMinutes(m); setRemaining(m * 60); }} />
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: Space.s3 }}>
        {!idle ? <Button variant="outlined" label={s('reset')} onPress={reset} style={{ flex: 1 }} /> : null}
        <Button
          label={s(running ? 'pause' : finished ? 'restart' : idle ? 'start' : 'resume')}
          onPress={running ? () => setRunning(false) : start}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
