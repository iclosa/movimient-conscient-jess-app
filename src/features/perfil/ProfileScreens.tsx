import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Switch } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAnnouncementReads, useAnnouncements, useSettings } from '@/api/hooks';
import { Child, toApiDate } from '@/api/models';
import { useSession } from '@/session';
import { useStrings, useTheme } from '@/theme';
import { Space, withAlpha } from '@/theme/tokens';
import {
  AppCard, Button, DateField, EmptyState, ErrorBox, Field, IconName, Loading, Sheet, SubScreen, Txt, errorText, useFeedback,
} from '@/ui';
import { fieldError, FormErrorBanner, formMessage } from '../auth/authWidgets';

export function EditProfileScreen() {
  const s = useStrings();
  const c = useTheme();
  const router = useRouter();
  const { user, repo, setUser } = useSession();
  const { toast } = useFeedback();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [birth, setBirth] = useState<Date | null>(user?.birthDate ?? null);
  const [marketing, setMarketing] = useState(user?.marketingConsent ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [touched, setTouched] = useState(false);

  const nameErr = touched && name.trim() === '' ? s('validation_required') : undefined;
  const emailErr = touched && !email.includes('@') ? s('validation_email') : undefined;

  const save = async () => {
    setTouched(true);
    if (name.trim() === '' || !email.includes('@')) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await repo.updateMe({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() === '' ? null : phone.trim(),
        birth_date: birth ? toApiDate(birth) : null,
        marketing_consent: marketing,
      });
      setUser(updated);
      toast(s('profile_saved'));
      router.back();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SubScreen title={s('personal_data')}>
      <View style={{ gap: Space.s4 }}>
        {error ? <FormErrorBanner message={formMessage(error, s)} /> : null}
        <Field label={s('full_name')} value={name} onChangeText={setName} autoCapitalize="words" error={nameErr ?? fieldError(error, 'name')} />
        <Field label={s('email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={emailErr ?? fieldError(error, 'email')} />
        <Field label={s('phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={fieldError(error, 'phone')} />
        <DateField
          label={s('birth_date')}
          value={birth}
          onChange={setBirth}
          initialDate={new Date(new Date().getFullYear() - 30, 0, 1)}
          minimumDate={new Date(1900, 0, 1)}
          maximumDate={new Date(Date.now() - 86400000)}
          error={fieldError(error, 'birth_date')}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s3 }}>
          <Txt variant="body" style={{ flex: 1 }}>{s('marketing_consent')}</Txt>
          <Switch
            value={marketing}
            onValueChange={setMarketing}
            accessibilityLabel={s('marketing_consent')}
            trackColor={{ false: c.surface300, true: c.violeta }}
            thumbColor={marketing ? c.onVioleta : c.inkMuted}
          />
        </View>
        <Button label={s('save')} onPress={save} loading={busy} />
      </View>
    </SubScreen>
  );
}

export function ChildrenScreen() {
  const s = useStrings();
  const c = useTheme();
  const { user, repo, refreshUser } = useSession();
  const { toast, confirm } = useFeedback();
  const [editing, setEditing] = useState<{ child: Child | null } | null>(null);
  const children = user?.children ?? [];

  const remove = async (ch: Child) => {
    const ok = await confirm({
      title: s('child_delete_title', { name: ch.name }),
      confirmLabel: s('delete'),
      cancelLabel: s('cancel'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await repo.deleteChild(ch.id);
      await refreshUser();
    } catch (e) {
      toast(errorText(e, s));
    }
  };

  return (
    <SubScreen title={s('children_title')}>
      {children.length === 0 ? (
        <EmptyState icon="people-outline" title={s('children_empty')} body={s('children_empty_body')} />
      ) : (
        <View style={{ gap: Space.s3 }}>
          <Txt variant="body">{s('children_intro')}</Txt>
          {children.map((ch) => (
            <AppCard key={ch.id} onPress={() => setEditing({ child: ch })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s3 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: withAlpha(c.turquesa, 0.16), alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="happy-outline" size={22} color={c.turquesa} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="titleSmall">{ch.name}</Txt>
                  {ch.birthDate ? <Txt variant="small">{s.dateMedium(ch.birthDate)}</Txt> : null}
                </View>
                <Pressable
                  onPress={() => void remove(ch)}
                  accessibilityRole="button"
                  accessibilityLabel={s('delete')}
                  style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="trash-outline" size={22} color={c.error} />
                </Pressable>
              </View>
            </AppCard>
          ))}
        </View>
      )}
      <Button icon="add" label={s('add_child')} onPress={() => setEditing({ child: null })} style={{ marginTop: Space.s5 }} />
      <ChildSheet
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={async (name, birth) => {
          try {
            if (editing?.child) await repo.updateChild(editing.child.id, name, birth);
            else await repo.addChild(name, birth);
            await refreshUser();
            setEditing(null);
          } catch (e) {
            toast(errorText(e, s));
          }
        }}
      />
    </SubScreen>
  );
}

function ChildSheet({
  editing, onClose, onSave,
}: { editing: { child: Child | null } | null; onClose: () => void; onSave: (name: string, birth: Date | null) => Promise<void> }) {
  const s = useStrings();
  const [name, setName] = useState('');
  const [birth, setBirth] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState<unknown>(null);

  // Reinicia los campos al abrir la hoja para otro niño.
  if (editing && key !== editing) {
    setKey(editing);
    setName(editing.child?.name ?? '');
    setBirth(editing.child?.birthDate ?? null);
  } else if (!editing && key !== null) {
    setKey(null);
  }

  const now = new Date();
  return (
    <Sheet visible={!!editing} onClose={onClose}>
      <Txt variant="titleMedium" style={{ marginBottom: Space.s4 }}>{s(editing?.child ? 'edit_child' : 'add_child')}</Txt>
      <View style={{ gap: Space.s4 }}>
        <Field label={s('child_name')} value={name} onChangeText={setName} autoCapitalize="words" />
        <DateField
          label={s('birth_date')}
          value={birth}
          onChange={setBirth}
          initialDate={new Date(now.getFullYear() - 6, 0, 1)}
          minimumDate={new Date(now.getFullYear() - 25, 0, 1)}
          maximumDate={new Date(Date.now() - 86400000)}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: Space.s2 }}>
          <Button variant="text" label={s('cancel')} onPress={onClose} />
          <Button
            label={s('save')}
            loading={busy}
            disabled={name.trim() === ''}
            onPress={async () => {
              setBusy(true);
              await onSave(name.trim(), birth);
              setBusy(false);
            }}
          />
        </View>
      </View>
    </Sheet>
  );
}

export function AnnouncementsScreen() {
  const s = useStrings();
  const qc = useQueryClient();
  const c = useTheme();
  const list = useAnnouncements();
  const { markRead, markAllRead } = useAnnouncementReads();
  const unread = (list.data ?? []).filter((a) => !a.read).length;
  const [refreshing, setRefreshing] = useState(false);
  return (
    <SubScreen
      title={s('announcements_title')}
      right={unread > 0 ? <Button variant="text" compact label={s('announcements_mark_all')} onPress={markAllRead} /> : undefined}
      fallback="/resum"
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await qc.invalidateQueries({ queryKey: ['announcements'] });
        setRefreshing(false);
      }}
    >
      {list.isPending ? (
        <Loading />
      ) : list.isError ? (
        <ErrorBox error={list.error} onRetry={() => void list.refetch()} />
      ) : list.data.length === 0 ? (
        <EmptyState icon="notifications-outline" title={s('announcements_empty')} />
      ) : (
        <View style={{ gap: Space.s3 }}>
          {list.data.map((a) => (
            <AppCard
              key={a.id}
              onPress={a.read ? undefined : () => markRead(a.id)}
              accessibilityLabel={a.read ? undefined : `${a.title}. ${s('announcements_mark_read')}`}
              style={a.read ? { opacity: 0.75 } : { borderWidth: 1.5, borderColor: withAlpha(c.violeta, 0.45) }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s2 }}>
                {!a.read ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c.violeta }} /> : null}
                {a.sentAt ? <Txt variant="caption">{s.dateMedium(a.sentAt)}</Txt> : null}
              </View>
              <Txt variant="titleMedium">{a.title}</Txt>
              {a.body ? <Txt variant="body" style={{ marginTop: Space.s1 }}>{a.body}</Txt> : null}
              {!a.read ? (
                <Txt variant="caption" style={{ marginTop: Space.s2, color: c.violeta }}>{s('announcements_mark_read')}</Txt>
              ) : null}
            </AppCard>
          ))}
        </View>
      )}
    </SubScreen>
  );
}

export function AboutScreen() {
  const s = useStrings();
  const c = useTheme();
  const settings = useSettings();

  const tile = (icon: IconName, label: string, value: string, url: string) => (
    <AppCard key={label} onPress={() => void Linking.openURL(url).catch(() => {})} padding={0}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s4, paddingVertical: Space.s3, gap: Space.s3 }}>
        <Ionicons name={icon} size={24} color={c.violeta} />
        <View style={{ flex: 1 }}>
          <Txt variant="caption">{label}</Txt>
          <Txt variant="bodyLarge">{value}</Txt>
        </View>
      </View>
    </AppCard>
  );

  return (
    <SubScreen title={s('about_center')}>
      {settings.isPending ? (
        <Loading />
      ) : settings.isError ? (
        <ErrorBox error={settings.error} onRetry={() => void settings.refetch()} />
      ) : (
        (() => {
          const cfg = settings.data;
          const insta = cfg.instagram?.replace('@', '');
          return (
            <View>
              <Txt variant="title">{cfg.name ?? ''}</Txt>
              <View style={{ gap: Space.s2, marginTop: Space.s4 }}>
                {cfg.address ? tile('location-outline', s('address'), cfg.address, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cfg.address)}`) : null}
                {cfg.phone ? tile('call-outline', s('phone'), cfg.phone, `tel:${cfg.phone}`) : null}
                {cfg.email ? tile('mail-outline', s('email'), cfg.email, `mailto:${cfg.email}`) : null}
                {insta ? tile('logo-instagram', 'Instagram', `@${insta}`, `https://www.instagram.com/${insta}`) : null}
                {cfg.website ? tile('globe-outline', s('website'), cfg.website, cfg.website) : null}
                {cfg.termsUrl ? tile('document-text-outline', s('terms'), cfg.termsUrl, cfg.termsUrl) : null}
              </View>
              <Txt variant="titleMedium" style={{ marginTop: Space.s5 }}>{s('booking_rules_title')}</Txt>
              <Txt variant="body" style={{ marginTop: Space.s1 }}>
                {s('booking_rules_body', { hours: cfg.cancellationHours, days: cfg.bookingOpenDays })}
              </Txt>
            </View>
          );
        })()
      )}
    </SubScreen>
  );
}
