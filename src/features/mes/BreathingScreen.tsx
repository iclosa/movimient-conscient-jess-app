import { useEffect, useRef, useState } from 'react';
import { Easing, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useStrings, useTheme } from '@/theme';
import { fonts, Space, withAlpha } from '@/theme/tokens';
import { Button, EmptyState, Txt } from '@/ui';
import { WellnessScaffold } from './wellnessCommon';

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'done';

const easeInOut = Easing.inOut(Easing.quad);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : null);

export function BreathingScreen() {
  const s = useStrings();
  return (
    <WellnessScaffold type="breathing" scroll={false}>
      {(item) => {
        const inhale = num(item.config.inhale);
        const hold = num(item.config.hold) ?? 0;
        const exhale = num(item.config.exhale);
        const rounds = num(item.config.rounds);
        if (!inhale || !exhale || !rounds || inhale <= 0 || exhale <= 0 || rounds <= 0) {
          return <EmptyState icon="leaf-outline" title={s('breathing_not_configured')} />;
        }
        return <Body description={item.description} inhale={inhale} hold={hold} exhale={exhale} rounds={rounds} />;
      }}
    </WellnessScaffold>
  );
}

const SIZE = 280;
const MIN = 0.55;

/** Fase y escala del círculo para un instante `t` (segundos) dentro del ciclo. */
export function breathingState(t: number, inhale: number, hold: number, exhale: number): { phase: Phase; scale: number; left: number } {
  const cycle = inhale + hold + exhale;
  if (t < inhale) return { phase: 'inhale', scale: MIN + (1 - MIN) * easeInOut(t / inhale), left: Math.ceil(inhale - t) };
  if (t < inhale + hold) return { phase: 'hold', scale: 1, left: Math.ceil(inhale + hold - t) };
  const e = Math.min(1, (t - inhale - hold) / exhale);
  return { phase: 'exhale', scale: 1 - (1 - MIN) * easeInOut(e), left: Math.ceil(cycle - t) };
}

function Body({ description, inhale, hold, exhale, rounds }: { description: string | null; inhale: number; hold: number; exhale: number; rounds: number }) {
  const s = useStrings();
  const c = useTheme();
  const cycle = inhale + hold + exhale;
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(1);
  const [t, setT] = useState(0);
  const startedAt = useRef(0);
  const lastPhase = useRef<Phase>('idle');

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      const r = Math.floor(elapsed / cycle) + 1;
      if (r > rounds) {
        setRunning(false);
        setDone(true);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        return;
      }
      setRound(r);
      setT(elapsed - (r - 1) * cycle);
    }, 50);
    return () => clearInterval(timer);
  }, [running, cycle, rounds]);

  const state = running ? breathingState(t, inhale, hold, exhale) : { phase: (done ? 'done' : 'idle') as Phase, scale: MIN, left: 0 };

  useEffect(() => {
    if (running && state.phase !== lastPhase.current) void Haptics.selectionAsync().catch(() => {});
    lastPhase.current = state.phase;
  }, [state.phase, running]);

  const start = () => {
    startedAt.current = Date.now();
    setRound(1);
    setT(0);
    setDone(false);
    setRunning(true);
  };

  const label = { idle: s('breathing_ready'), inhale: s('breathing_inhale'), hold: s('breathing_hold'), exhale: s('breathing_exhale'), done: s('breathing_done') }[state.phase];

  return (
    <View style={{ flex: 1, padding: Space.s5 }}>
      {description ? <Txt variant="bodyLarge" center>{description}</Txt> : null}
      <View style={{ alignItems: 'center', marginTop: Space.s4, minHeight: 84 }} accessibilityLiveRegion="polite">
        <Txt variant="headline" color={c.ink} center>{label}</Txt>
        {running ? <Txt color={c.violeta} style={{ fontFamily: fonts.displayExtra, fontSize: 40, lineHeight: 46 }}>{String(state.left)}</Txt> : null}
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={label}
          style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{ position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 2, borderColor: c.line }} />
          <View
            style={{
              position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, transform: [{ scale: state.scale }],
              backgroundColor: withAlpha(c.turquesa, 0.8), borderWidth: 14, borderColor: withAlpha(c.violeta, 0.7),
            }}
          />
        </View>
      </View>
      <Txt variant="body" center>
        {running ? s('breathing_round', { n: round, total: rounds }) : s('breathing_pattern', { i: inhale, h: hold, e: exhale, r: rounds })}
      </Txt>
      <View style={{ marginTop: Space.s4 }}>
        {running ? (
          <Button variant="outlined" label={s('stop')} onPress={() => setRunning(false)} />
        ) : (
          <Button label={s(done ? 'restart' : 'start')} onPress={start} />
        )}
      </View>
    </View>
  );
}
