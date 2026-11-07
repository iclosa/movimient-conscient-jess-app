import { useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useMyPasses, usePassCatalogue } from '@/api/hooks';
import { Pass, UserPass } from '@/api/models';
import { useSession } from '@/session';
import { useStrings, useTheme } from '@/theme';
import { fonts, Space, withAlpha } from '@/theme/tokens';
import { AppCard, Button, ErrorBox, Loading, Pill, SectionHeader, SubScreen, Txt, errorText, useFeedback } from '@/ui';

export function PassesScreen() {
  const s = useStrings();
  const qc = useQueryClient();
  const mine = useMyPasses();
  const catalogue = usePassCatalogue();
  const [refreshing, setRefreshing] = useState(false);

  return (
    <SubScreen
      title={s('passes_title')}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await Promise.all([qc.invalidateQueries({ queryKey: ['my-passes'] }), qc.invalidateQueries({ queryKey: ['passes'] })]);
        setRefreshing(false);
      }}
    >
      <SectionHeader title={s('my_passes')} />
      {mine.isPending ? (
        <Loading />
      ) : mine.isError ? (
        <ErrorBox error={mine.error} onRetry={() => void mine.refetch()} />
      ) : mine.data.length === 0 ? (
        <AppCard><Txt variant="body">{s('no_pass_body')}</Txt></AppCard>
      ) : (
        <View style={{ gap: Space.s3 }}>{mine.data.map((p) => <MyPassTile key={p.id} pass={p} />)}</View>
      )}
      <SectionHeader title={s('available_passes')} />
      {catalogue.isPending ? (
        <Loading />
      ) : catalogue.isError ? (
        <ErrorBox error={catalogue.error} onRetry={() => void catalogue.refetch()} />
      ) : (
        <View style={{ gap: Space.s3 }}>{catalogue.data.map((p) => <CatalogueTile key={p.id} pass={p} />)}</View>
      )}
    </SubScreen>
  );
}

function MyPassTile({ pass }: { pass: UserPass }) {
  const s = useStrings();
  const c = useTheme();
  return (
    <AppCard>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
            backgroundColor: pass.usable ? withAlpha(c.violeta, 0.16) : c.surface300,
          }}
        >
          <Txt color={pass.usable ? c.violeta : c.inkMuted} style={{ fontFamily: fonts.displayExtra, fontSize: 26, lineHeight: 32, includeFontPadding: false, textAlign: 'center' }}>
            {pass.unlimited ? '∞' : String(pass.classesRemaining ?? 0)}
          </Txt>
        </View>
        <View style={{ flex: 1, marginHorizontal: Space.s4 }}>
          <Txt variant="titleSmall">{pass.name}</Txt>
          <Txt variant="small">{pass.expiresOn ? s('pass_expires', { date: s.dateMedium(pass.expiresOn) }) : s('pass_no_expiry')}</Txt>
          {!pass.unlimited && pass.classesTotal != null ? (
            <Txt variant="small">{s('pass_of_total', { left: pass.classesRemaining ?? 0, total: pass.classesTotal })}</Txt>
          ) : null}
        </View>
        <Pill
          label={pass.usable ? s('pass_active') : s('pass_inactive')}
          background={pass.usable ? withAlpha(c.ok, 0.14) : c.surface300}
          foreground={pass.usable ? c.ok : c.inkMuted}
        />
      </View>
    </AppCard>
  );
}

function CatalogueTile({ pass: p }: { pass: Pass }) {
  const s = useStrings();
  const c = useTheme();
  const { repo } = useSession();
  const { confirm, toast } = useFeedback();
  const [busy, setBusy] = useState(false);

  const buy = async () => {
    const ok = await confirm({
      title: s('pass_buy_title', { name: p.name }),
      body: s('pass_buy_body', { price: p.priceLabel }),
      confirmLabel: s('pass_buy_confirm'),
      cancelLabel: s('cancel'),
    });
    if (!ok) return;
    setBusy(true);
    try {
      const message = await repo.purchasePass(p.id);
      toast(message || s('pass_buy_requested'));
    } catch (e) {
      toast(errorText(e, s));
    } finally {
      setBusy(false);
    }
  };

  const details = [
    p.unlimited ? s('pass_unlimited') : p.classesCount != null ? s('pass_classes', { n: p.classesCount }) : null,
    p.validityDays != null ? s('pass_validity', { n: p.validityDays }) : null,
  ].filter(Boolean).join(' · ');

  return (
    <AppCard color={p.isFeatured ? withAlpha(c.violeta, c.isDark ? 0.18 : 0.08) : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s2 }}>
        <Txt variant="titleSmall" style={{ flex: 1 }}>{p.name}</Txt>
        {p.isFeatured ? <Pill label={s('pass_featured')} background={c.violeta} foreground={c.onVioleta} /> : null}
      </View>
      {details ? <Txt variant="small">{details}</Txt> : null}
      {p.description ? <Txt variant="body" style={{ marginTop: Space.s1 }}>{p.description}</Txt> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Space.s3 }}>
        <Txt color={c.violeta} style={{ fontFamily: fonts.displayExtra, fontSize: 24, flex: 1 }}>{p.priceLabel}</Txt>
        <Button label={s('pass_buy')} compact onPress={buy} loading={busy} />
      </View>
    </AppCard>
  );
}
