import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { useWellness } from '@/api/hooks';
import { MindfulnessPractice, practicesFromConfig } from '@/api/models';
import { useStrings, useTheme } from '@/theme';
import { fonts, Radii, Space } from '@/theme/tokens';
import { AppCard, Button, EmptyState, ErrorBox, Loading, SectionHeader, SubScreen, Txt } from '@/ui';
import { Bell } from './bell';
import { clock, WellnessScaffold } from './wellnessCommon';

export function MindfulnessScreen() {
  const s = useStrings();
  const c = useTheme();
  const router = useRouter();
  return (
    <WellnessScaffold type="mindfulness">
      {(item) => {
        const practices = practicesFromConfig(item.config);
        return (
          <View>
            {item.description ? <Txt variant="bodyLarge">{item.description}</Txt> : null}
            {item.content ? <Txt variant="body" style={{ marginTop: Space.s3 }}>{item.content}</Txt> : null}
            {item.mediaUrl ? (
              <Button variant="outlined" icon="headset-outline" label={s('mindfulness_listen')} style={{ marginTop: Space.s4 }} onPress={() => void Linking.openURL(item.mediaUrl!).catch(() => {})} />
            ) : null}
            <SectionHeader title={s('mindfulness_practices')} />
            {practices.length === 0 ? (
              <AppCard><Txt variant="body">{s('mindfulness_none')}</Txt></AppCard>
            ) : (
              <View style={{ gap: Space.s3 }}>
                {practices.map((p, i) => (
                  <AppCard key={`${p.title}-${i}`} onPress={() => router.push({ pathname: '/mes/practica/[index]', params: { index: String(i) } })}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Txt variant="titleSmall">{p.title}</Txt>
                        {p.durationMinutes != null ? <Txt variant="small">{s.duration(p.durationMinutes)}</Txt> : null}
                      </View>
                      <Ionicons name="play-circle-outline" size={32} color={c.violeta} />
                    </View>
                  </AppCard>
                ))}
              </View>
            )}
          </View>
        );
      }}
    </WellnessScaffold>
  );
}

/** Ruta /mes/practica/[index]: busca la práctica en el contenido de mindfulness. */
export function PracticeRoute({ index }: { index: number }) {
  const s = useStrings();
  const items = useWellness();
  const practice = practicesFromConfig(items.data?.find((i) => i.type === 'mindfulness')?.config ?? {})[index];
  return (
    <SubScreen title={practice?.title ?? ''} fallback="/mes/mindfulness" scroll={false}>
      {items.isPending ? <Loading /> : items.isError ? <ErrorBox error={items.error} onRetry={() => void items.refetch()} /> : !practice ? (
        <EmptyState icon="flower-outline" title={s('wellness_unavailable')} />
      ) : (
        <PracticePlayer practice={practice} />
      )}
    </SubScreen>
  );
}

/** Práctica guiada: pasa de paso en paso repartiendo la duración entre ellos. */
function PracticePlayer({ practice: p }: { practice: MindfulnessPractice }) {
  const s = useStrings();
  const c = useTheme();
  const bell = useRef(new Bell()).current;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const steps = p.steps.length;

  const total = (p.durationMinutes ?? steps) * 60;
  const stepSeconds = Math.max(1, Math.ceil(total / Math.max(1, steps)));
  const step = finished ? steps - 1 : Math.min(steps - 1, Math.max(0, Math.floor(elapsed / stepSeconds)));
  const remaining = Math.max(0, total - elapsed);

  useEffect(() => () => bell.dispose(), [bell]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (running && elapsed >= total) {
      setRunning(false);
      setFinished(true);
      void bell.ring();
    }
  }, [elapsed, running, total, bell]);

  if (steps === 0) return <EmptyState icon="flower-outline" title={s('mindfulness_none')} />;

  const start = () => {
    if (finished) setElapsed(0);
    if (elapsed === 0 || finished) void bell.ring();
    setFinished(false);
    setRunning(true);
  };
  const goTo = (n: number) => setElapsed(Math.min(steps - 1, Math.max(0, n)) * stepSeconds);

  return (
    <View style={{ flex: 1, padding: Space.s5 }}>
      {running ? <KeepAwake /> : null}
      <Txt variant="label" muted>{s('practice_step', { n: step + 1, total: steps })}</Txt>
      <View style={{ height: 6, borderRadius: Radii.pill, backgroundColor: c.surface300, marginTop: Space.s2, overflow: 'hidden' }}>
        <View style={{ height: 6, width: `${total === 0 ? 0 : Math.min(100, (elapsed / total) * 100)}%`, backgroundColor: c.turquesa }} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Txt center accessibilityLiveRegion="polite" style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 34 }}>
          {finished ? s('practice_done') : p.steps[step]}
        </Txt>
      </View>
      <Txt variant="titleMedium" center>{clock(remaining)}</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space.s4, marginTop: Space.s4 }}>
        <RoundIcon icon="play-skip-back" label={s('previous')} disabled={step <= 0} onPress={() => goTo(step - 1)} />
        <Button
          icon={running ? 'pause' : 'play'}
          label={s(running ? 'pause' : finished ? 'restart' : elapsed > 0 ? 'resume' : 'start')}
          onPress={running ? () => setRunning(false) : start}
        />
        <RoundIcon icon="play-skip-forward" label={s('next')} disabled={step >= steps - 1} onPress={() => goTo(step + 1)} />
      </View>
    </View>
  );
}

function KeepAwake() {
  useKeepAwake();
  return null;
}

function RoundIcon({ icon, label, onPress, disabled }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: c.violeta, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}
    >
      <Ionicons name={icon} size={22} color={c.violeta} />
    </Pressable>
  );
}

export { KeepAwake };
