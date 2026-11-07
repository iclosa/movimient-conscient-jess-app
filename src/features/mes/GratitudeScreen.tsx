import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useGratitude } from '@/api/hooks';
import { GratitudeEntry } from '@/api/models';
import { useSession } from '@/session';
import { useStrings, useTheme } from '@/theme';
import { Space } from '@/theme/tokens';
import { AppCard, Button, EmptyState, ErrorBox, Field, Loading, Pill, Sheet, Txt, errorText, useFeedback } from '@/ui';
import { WellnessScaffold } from './wellnessCommon';

export function GratitudeScreen() {
  const s = useStrings();
  const c = useTheme();
  const qc = useQueryClient();
  const { repo } = useSession();
  const { toast, confirm } = useFeedback();
  const entries = useGratitude();
  const [editing, setEditing] = useState<{ entry: GratitudeEntry | null } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const reload = () => qc.invalidateQueries({ queryKey: ['gratitude'] });

  const remove = async (e: GratitudeEntry) => {
    const ok = await confirm({ title: s('gratitude_delete_title'), confirmLabel: s('delete'), cancelLabel: s('cancel'), destructive: true });
    if (!ok) return;
    try {
      await repo.deleteGratitude(e.id);
      void reload();
    } catch (err) {
      toast(errorText(err, s));
    }
  };

  return (
    <WellnessScaffold
      type="gratitude"
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await reload();
        setRefreshing(false);
      }}
    >
      {(item) => (
        <View>
          {item.description ? <Txt variant="bodyLarge" style={{ marginBottom: Space.s3 }}>{item.description}</Txt> : null}
          <Button icon="add" label={s('gratitude_add')} onPress={() => setEditing({ entry: null })} style={{ marginBottom: Space.s4 }} />
          {entries.isPending ? (
            <Loading />
          ) : entries.isError ? (
            <ErrorBox error={entries.error} onRetry={() => void entries.refetch()} />
          ) : entries.data.length === 0 ? (
            <EmptyState icon="heart-outline" title={s('gratitude_empty')} body={s('gratitude_empty_body')} />
          ) : (
            <View style={{ gap: Space.s3 }}>
              {entries.data.map((e) => (
                <AppCard key={e.id} onPress={() => setEditing({ entry: e })}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Txt variant="caption">{s.dateLong(e.entryDate)}</Txt>
                      <Txt variant="bodyLarge" style={{ marginTop: Space.s1 }}>{e.body}</Txt>
                    </View>
                    <Pressable
                      onPress={() => void remove(e)}
                      accessibilityRole="button"
                      accessibilityLabel={s('delete')}
                      style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="trash-outline" size={22} color={c.inkMuted} />
                    </Pressable>
                  </View>
                </AppCard>
              ))}
            </View>
          )}
          <EntrySheet
            editing={editing}
            onClose={() => setEditing(null)}
            onSave={async (body) => {
              try {
                if (editing?.entry) await repo.updateGratitude(editing.entry.id, body);
                else await repo.addGratitude(body);
                void reload();
                setEditing(null);
              } catch (err) {
                toast(errorText(err, s));
              }
            }}
          />
        </View>
      )}
    </WellnessScaffold>
  );
}

function EntrySheet({
  editing, onClose, onSave,
}: { editing: { entry: GratitudeEntry | null } | null; onClose: () => void; onSave: (body: string) => Promise<void> }) {
  const s = useStrings();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState<unknown>(null);

  if (editing && key !== editing) {
    setKey(editing);
    setBody(editing.entry?.body ?? '');
  } else if (!editing && key !== null) {
    setKey(null);
  }

  return (
    <Sheet visible={!!editing} onClose={onClose}>
      <Txt variant="titleMedium" style={{ marginBottom: Space.s3 }}>{s(editing?.entry ? 'gratitude_edit' : 'gratitude_new')}</Txt>
      <Field label={s('gratitude_prompt')} value={body} onChangeText={setBody} multiline maxLength={2000} autoFocus autoCapitalize="sentences" />
      <Button
        label={s('save')}
        loading={busy}
        disabled={body.trim() === ''}
        style={{ marginTop: Space.s3 }}
        onPress={async () => {
          setBusy(true);
          await onSave(body.trim());
          setBusy(false);
        }}
      />
    </Sheet>
  );
}

/** Propuestas sin pantalla propia ("Altres propostes"): título, texto y enlace. */
export function CustomWellnessScreen({ id }: { id: number }) {
  const s = useStrings();
  return (
    <WellnessScaffold type="custom" itemId={id}>
      {(item) => (
        <View>
          {item.description ? <Txt variant="bodyLarge">{item.description}</Txt> : null}
          {item.durationMinutes != null ? (
            <View style={{ marginTop: Space.s2 }}><Pill label={s.duration(item.durationMinutes)} icon="time-outline" /></View>
          ) : null}
          {item.content ? <Txt variant="body" style={{ marginTop: Space.s4 }}>{item.content}</Txt> : null}
          {item.mediaUrl ? (
            <Button icon="play-circle-outline" label={s('open_resource')} style={{ marginTop: Space.s5 }} onPress={() => void Linking.openURL(item.mediaUrl!).catch(() => {})} />
          ) : null}
        </View>
      )}
    </WellnessScaffold>
  );
}
