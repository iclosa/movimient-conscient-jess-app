import { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useVideos } from '@/api/hooks';
import { Video } from '@/api/models';
import { Strings } from '@/i18n';
import { useStrings, useTheme } from '@/theme';
import { activityTone, legibleOnSoft, Radii, Space, withAlpha } from '@/theme/tokens';
import { AppCard, Chip, EmptyState, ErrorBox, Loading, Pill, Screen, Segmented, Txt } from '@/ui';

/** Categorías que usa el backend; se traducen si hay clave y, si no, se muestran tal cual. */
export function categoryLabel(s: Strings, category: string): string {
  return ['classe', 'rutina', 'respiracio', 'meditacio'].includes(category) ? s(`video_cat_${category}`) : category;
}

type PriceFilter = 'all' | 'free' | 'paid';

export function VideosScreen() {
  const s = useStrings();
  const qc = useQueryClient();
  const videos = useVideos();
  const [category, setCategory] = useState<string | null>(null);
  const [price, setPrice] = useState<PriceFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const all = videos.data ?? [];
  const categories = [...new Set(all.map((v) => v.category).filter((x): x is string => !!x))].sort();
  const list = all.filter((v) => {
    if (category && v.category !== category) return false;
    return price === 'all' ? true : price === 'free' ? !v.isPaid : v.isPaid;
  });

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await qc.invalidateQueries({ queryKey: ['videos'] });
        setRefreshing(false);
      }}
    >
      <View style={{ height: Space.s2 }} />
      {videos.isPending ? (
        <Loading />
      ) : videos.isError ? (
        <ErrorBox error={videos.error} onRetry={() => void videos.refetch()} />
      ) : (
        <View>
          <Segmented<PriceFilter>
            value={price}
            onChange={setPrice}
            options={[
              { value: 'all', label: s('videos_all') },
              { value: 'free', label: s('videos_free') },
              { value: 'paid', label: s('videos_paid') },
            ]}
          />
          {categories.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Space.s2, paddingVertical: Space.s3 }}>
              {[null, ...categories].map((cat) => (
                <Chip
                  key={cat ?? 'all'}
                  label={cat == null ? s('all_activities') : categoryLabel(s, cat)}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={{ height: Space.s3 }} />
          )}
          {all.length === 0 ? (
            <EmptyState icon="play-circle-outline" title={s('videos_empty')} body={s('videos_empty_body')} />
          ) : list.length === 0 ? (
            <EmptyState icon="funnel-outline" title={s('videos_no_match')} />
          ) : (
            <View style={{ gap: Space.s3 }}>
              {list.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

function VideoCard({ video }: { video: Video }) {
  const s = useStrings();
  const c = useTheme();
  const router = useRouter();
  const tone = activityTone(c, video.activity?.color ?? c.violeta);
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = !!video.thumbnailUrl && !imgFailed;
  return (
    <AppCard
      padding={0}
      onPress={() => router.push({ pathname: '/video/[id]', params: { id: String(video.id) } })}
      accessibilityLabel={`${video.title}, ${video.locked ? s('video_locked') : video.priceLabel}`}
    >
      <View style={{ aspectRatio: 2, borderTopLeftRadius: Radii.lg, borderTopRightRadius: Radii.lg, overflow: 'hidden', backgroundColor: tone.base }}>
        {showImg ? (
          <Image source={{ uri: video.thumbnailUrl! }} resizeMode="cover" style={{ width: '100%', height: '100%' }} onError={() => setImgFailed(true)} />
        ) : null}
        <View style={{ ...absFill, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={video.locked ? 'lock-closed-outline' : 'play'} size={26} color="#FFFFFF" />
          </View>
        </View>
        {video.durationMinutes != null ? (
          <View style={{ position: 'absolute', right: Space.s2, bottom: Space.s2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.pill, backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <Txt variant="caption" color="#FFFFFF">{s.duration(video.durationMinutes)}</Txt>
          </View>
        ) : null}
      </View>
      <View style={{ padding: Space.s4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s2 }}>
          <Txt variant="titleMedium" style={{ flex: 1 }}>{video.title}</Txt>
          <Pill
            label={video.isPaid ? (video.locked ? video.priceLabel : s('video_unlocked')) : s('video_free')}
            background={withAlpha(video.isPaid ? c.violeta : c.turquesa, 0.14)}
            foreground={video.isPaid ? c.violeta : c.turquesa}
          />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.s2, marginTop: Space.s2 }}>
          {video.activity ? <Pill label={video.activity.name} background={tone.soft} foreground={legibleOnSoft(c, tone.base)} /> : null}
          {video.category ? <Pill label={categoryLabel(s, video.category)} /> : null}
          {video.level ? <Pill label={video.level} /> : null}
        </View>
      </View>
    </AppCard>
  );
}

const absFill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };
