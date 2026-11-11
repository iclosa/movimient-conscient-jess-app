import { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useWellness } from '@/api/hooks';
import { WellnessItem } from '@/api/models';
import { useStrings, useTheme } from '@/theme';
import { Space, withAlpha } from '@/theme/tokens';
import { AppCard, EmptyState, ErrorBox, Loading, Screen, Txt } from '@/ui';
import { wellnessIcon, wellnessRoute } from './wellnessCommon';

export function MesScreen() {
  const s = useStrings();
  const qc = useQueryClient();
  const items = useWellness();
  const [refreshing, setRefreshing] = useState(false);
  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await qc.invalidateQueries({ queryKey: ['wellness'] });
        setRefreshing(false);
      }}
    >
      <View style={{ height: Space.s2 }} />
      {items.isPending ? (
        <Loading />
      ) : items.isError ? (
        <ErrorBox error={items.error} onRetry={() => void items.refetch()} />
      ) : items.data.length === 0 ? (
        <EmptyState icon="flower-outline" title={s('wellness_empty')} />
      ) : (
        <View>
          <Txt variant="bodyLarge" style={{ marginBottom: Space.s4 }}>{s('mes_intro')}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.s3 }}>
            {items.data.map((item) => (
              <ToolTile key={item.id} item={item} />
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}

function ToolTile({ item }: { item: WellnessItem }) {
  const c = useTheme();
  const router = useRouter();
  return (
    <View style={{ width: '47.8%', flexGrow: 1 }}>
      <AppCard onPress={() => router.push(wellnessRoute(item) as any)} accessibilityLabel={item.title} style={{ minHeight: 170 }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(c.violeta, c.isDark ? 0.22 : 0.12) }}>
          <Ionicons name={wellnessIcon(item.icon, item.type)} size={24} color={c.violeta} />
        </View>
        <Txt variant="titleSmall" numberOfLines={2} style={{ marginTop: Space.s3 }}>{item.title}</Txt>
        {item.description ? <Txt variant="small" numberOfLines={4} style={{ marginTop: Space.s1 }}>{item.description}</Txt> : null}
      </AppCard>
    </View>
  );
}
