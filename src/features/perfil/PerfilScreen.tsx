import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useUnreadAnnouncements, useBookings, useMyPasses, usePromotions, useStreak } from '@/api/hooks';
import { useSession } from '@/session';
import { usePrefs, useStrings, useTheme } from '@/theme';
import { fonts, Space } from '@/theme/tokens';
import { AppCard, Button, Field, IconName, Screen, SectionHeader, Segmented, Sheet, Txt, errorText, useFeedback } from '@/ui';
import { fieldError, FormErrorBanner, formMessage, hasFieldErrors } from '../auth/authWidgets';

export const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function PerfilScreen() {
  const s = useStrings();
  const c = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const { user, repo, setUser, refreshUser, signOut } = useSession();
  const { locale, setLocale, themeMode, setThemeMode } = usePrefs();
  const streak = useStreak();
  const upcomingBookings = useBookings('upcoming').data?.length ?? 0;
  const activePasses = useMyPasses().data?.filter((p) => p.usable).length ?? 0;
  const notices = useUnreadAnnouncements();
  const promos = usePromotions().data?.length ?? 0;
  const { confirm } = useFeedback();
  const [refreshing, setRefreshing] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  if (!user) return null;

  const changeLocale = async (code: 'ca' | 'es') => {
    setLocale(code);
    try {
      setUser(await repo.updateMe({ locale: code }));
    } catch {
      // El idioma ya está cambiado en el dispositivo; se sincronizará la próxima vez.
    }
  };

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await qc.invalidateQueries({ queryKey: ['streak'] });
        try { await refreshUser(); } catch { /* se mantiene el perfil actual */ }
        setRefreshing(false);
      }}
    >
      <View style={{ height: Space.s2 }} />
      <AppCard onPress={() => router.push('/dades')}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: c.violeta, alignItems: 'center', justifyContent: 'center' }}>
            <Txt color={c.onVioleta} style={{ fontFamily: fonts.displayExtra, fontSize: 22 }}>{initials(user.name)}</Txt>
          </View>
          <View style={{ flex: 1, marginHorizontal: Space.s4 }}>
            <Txt variant="titleMedium">{user.name}</Txt>
            <Txt variant="small">{user.email}</Txt>
          </View>
          <Ionicons name="create-outline" size={22} color={c.inkMuted} />
        </View>
      </AppCard>

      {streak.data ? (
        <View style={{ flexDirection: 'row', gap: Space.s3, marginTop: Space.s3 }}>
          <Stat value={String(streak.data.totalClasses)} label={s('stat_classes')} />
          <Stat value={String(streak.data.weeks)} label={s('stat_weeks')} flame={streak.data.weeks > 0} />
          <Stat value={String(streak.data.classesThisWeek)} label={s('stat_this_week')} />
        </View>
      ) : null}

      <View style={{ marginTop: Space.s4, gap: Space.s2 }}>
        <MenuTile icon="calendar-outline" label={s('my_bookings')} badge={upcomingBookings} onPress={() => router.push('/reserves')} />
        <MenuTile icon="ticket-outline" label={s('passes_title')} badge={activePasses} onPress={() => router.push('/bons')} />
        <MenuTile icon="pricetag-outline" label={s('promotions')} badge={promos} onPress={() => router.push('/promocions')} />
        <MenuTile icon="people-outline" label={s('children_title')} onPress={() => router.push('/fills')} />
        <MenuTile icon="person-outline" label={s('personal_data')} onPress={() => router.push('/dades')} />
        <MenuTile icon="notifications-outline" label={s('announcements_title')} badge={notices} onPress={() => router.push('/avisos')} />
        <MenuTile icon="information-circle-outline" label={s('about_center')} onPress={() => router.push('/centre')} />
      </View>

      <SectionHeader title={s('preferences')} />
      <AppCard>
        <Txt variant="titleSmall" style={{ marginBottom: Space.s2 }}>{s('language')}</Txt>
        <Segmented
          value={locale}
          onChange={changeLocale}
          options={[{ value: 'ca', label: 'Català' }, { value: 'es', label: 'Castellano' }]}
        />
        <Txt variant="titleSmall" style={{ marginTop: Space.s4, marginBottom: Space.s2 }}>{s('appearance')}</Txt>
        <Segmented
          value={themeMode}
          onChange={setThemeMode}
          options={[
            { value: 'light', label: s('theme_light') },
            { value: 'system', label: s('theme_system') },
            { value: 'dark', label: s('theme_dark') },
          ]}
        />
      </AppCard>

      <SectionHeader title={s('account')} />
      <View style={{ gap: Space.s2 }}>
        <MenuTile icon="lock-closed-outline" label={s('change_password')} onPress={() => setPwOpen(true)} />
        <MenuTile
          icon="log-out-outline"
          label={s('logout')}
          onPress={async () => {
            const ok = await confirm({ title: s('logout_confirm'), confirmLabel: s('logout'), cancelLabel: s('cancel') });
            if (ok) await signOut();
          }}
        />
        <MenuTile icon="trash-outline" label={s('delete_account')} danger onPress={() => setDelOpen(true)} />
      </View>

      <PasswordSheet visible={pwOpen} onClose={() => setPwOpen(false)} />
      <DeleteAccountSheet visible={delOpen} onClose={() => setDelOpen(false)} />
    </Screen>
  );
}

function Stat({ value, label, flame }: { value: string; label: string; flame?: boolean }) {
  const c = useTheme();
  const hot = c.isDark ? '#FFA45C' : '#E8590C';
  return (
    <AppCard style={{ flex: 1, alignItems: 'center' }} padding={Space.s3}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {flame ? <Ionicons name="flame" size={22} color={hot} /> : null}
        <Txt color={flame ? hot : c.violeta} style={{ fontFamily: fonts.displayExtra, fontSize: 28, lineHeight: 31 }}>{value}</Txt>
      </View>
      <Txt variant="caption" center style={{ marginTop: 2 }}>{label}</Txt>
    </AppCard>
  );
}

export function MenuTile({ icon, label, onPress, danger, badge }: { icon: IconName; label: string; onPress: () => void; danger?: boolean; badge?: number }) {
  const c = useTheme();
  return (
    <AppCard onPress={onPress} padding={0} accessibilityLabel={label}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.s4, paddingVertical: Space.s3, minHeight: 56, gap: Space.s3 }}>
        <Ionicons name={icon} size={24} color={danger ? c.error : c.violeta} />
        <Txt variant="titleSmall" color={danger ? c.error : c.ink} style={{ flex: 1 }}>{label}</Txt>
        {badge != null && badge > 0 ? (
          <View
            accessibilityLabel={String(badge)}
            style={{ minWidth: 26, height: 26, paddingHorizontal: 8, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: c.violeta }}
          >
            <Txt color={c.onVioleta} style={{ fontFamily: fonts.sansBold, fontSize: 13, lineHeight: 17, includeFontPadding: false }}>{badge > 99 ? '99+' : String(badge)}</Txt>
          </View>
        ) : null}
        {!danger ? <Ionicons name="chevron-forward" size={22} color={c.inkMuted} /> : null}
      </View>
    </AppCard>
  );
}

function PasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const s = useStrings();
  const { repo } = useSession();
  const { toast } = useFeedback();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await repo.updatePassword(current, next, confirmation);
      setCurrent(''); setNext(''); setConfirmation('');
      onClose();
      toast(s('password_updated'));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt variant="titleMedium" style={{ marginBottom: Space.s4 }}>{s('change_password')}</Txt>
      <View style={{ gap: Space.s3 }}>
        {error && !hasFieldErrors(error) ? <FormErrorBanner message={formMessage(error, s)} /> : null}
        <Field label={s('current_password')} value={current} onChangeText={setCurrent} secureTextEntry autoCapitalize="none" error={fieldError(error, 'current_password')} />
        <Field label={s('new_password')} value={next} onChangeText={setNext} secureTextEntry autoCapitalize="none" helper={s('password_hint')} error={fieldError(error, 'password')} />
        <Field label={s('confirm_password')} value={confirmation} onChangeText={setConfirmation} secureTextEntry autoCapitalize="none" />
        <Button label={s('save')} onPress={save} loading={busy} />
      </View>
    </Sheet>
  );
}

function DeleteAccountSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const s = useStrings();
  const c = useTheme();
  const { repo, forgetLocally } = useSession();
  const { toast } = useFeedback();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await repo.deleteAccount(password);
      setPassword('');
      onClose();
      await forgetLocally();
    } catch (e) {
      toast(errorText(e, s));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt variant="titleMedium">{s('delete_account_title')}</Txt>
      <Txt variant="body" style={{ marginVertical: Space.s3 }}>{s('delete_account_body')}</Txt>
      <Field label={s('password')} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: Space.s4, gap: Space.s2 }}>
        <Button variant="text" label={s('cancel')} onPress={onClose} />
        <Button label={s('delete_account_confirm')} color={c.error} onColor={c.isDark ? '#17141C' : '#FFFFFF'} onPress={remove} loading={busy} disabled={password === ''} />
      </View>
    </Sheet>
  );
}
