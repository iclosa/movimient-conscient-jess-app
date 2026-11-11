import { useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { usePromotions } from '@/api/hooks';
import { useStrings } from '@/theme';
import { Space } from '@/theme/tokens';
import { EmptyState, ErrorBox, Loading, SubScreen } from '@/ui';
import { PromotionCard } from '../resum/ResumScreen';

export function PromotionsScreen() {
  const s = useStrings();
  const qc = useQueryClient();
  const list = usePromotions();
  const [refreshing, setRefreshing] = useState(false);
  return (
    <SubScreen
      title={s('promotions')}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await qc.invalidateQueries({ queryKey: ['promotions'] });
        setRefreshing(false);
      }}
    >
      {list.isPending ? (
        <Loading />
      ) : list.isError ? (
        <ErrorBox error={list.error} onRetry={() => void list.refetch()} />
      ) : list.data.length === 0 ? (
        <EmptyState icon="pricetag-outline" title={s('promotions_empty')} />
      ) : (
        <View style={{ gap: Space.s3 }}>
          {list.data.map((p) => (
            <PromotionCard key={p.id} promotion={p} />
          ))}
        </View>
      )}
    </SubScreen>
  );
}
