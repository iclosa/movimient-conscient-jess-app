import { useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useVideo } from '@/api/hooks';
import { Video } from '@/api/models';
import { useSession } from '@/session';
import { useStrings, useTheme } from '@/theme';
import { activityTone, legibleOnSoft, Radii, Space } from '@/theme/tokens';
import { AppCard, Button, ErrorBox, Header, Loading, Pill, Txt, errorText, useFeedback } from '@/ui';
import { embedSource, embedUri, hostOf, isAllowedEmbedHost } from './embed';
import { categoryLabel } from './VideosScreen';

export function VideoDetailScreen({ id }: { id: number }) {
  const s = useStrings();
  const c = useTheme();
  const router = useRouter();
  const video = useVideo(id);
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.surface100 }}>
      <Header title={s('tab_videos')} onBack={() => (router.canGoBack() ? router.back() : router.replace('/videos'))} />
      {video.isPending ? <Loading /> : video.isError ? <ErrorBox error={video.error} onRetry={() => void video.refetch()} /> : <Detail video={video.data} />}
    </SafeAreaView>
  );
}

function Detail({ video: v }: { video: Video }) {
  const s = useStrings();
  const c = useTheme();
  const { repo } = useSession();
  const { toast } = useFeedback();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const tone = activityTone(c, v.activity?.color ?? c.violeta);
  const playback = v.playback;
  const embed = !v.locked && playback ? embedSource(playback) : null;

  const purchase = async () => {
    setBusy(true);
    try {
      const checkout = await repo.purchaseVideo(v.id);
      if (checkout) await Linking.openURL(checkout);
      else toast(s('video_purchase_requested'));
      void qc.invalidateQueries({ queryKey: ['video', v.id] });
      void qc.invalidateQueries({ queryKey: ['videos'] });
    } catch (e) {
      toast(errorText(e, s));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView>
      <View style={{ aspectRatio: 16 / 9, borderBottomLeftRadius: Radii.lg, borderBottomRightRadius: Radii.lg, overflow: 'hidden', backgroundColor: tone.base }}>
        {embed ? (
          <WebView
            source={embed}
            originWhitelist={['https://*', 'http://*', 'about:*']}
            setSupportMultipleWindows={false}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction
            javaScriptEnabled
            onShouldStartLoadWithRequest={(req) => req.url.startsWith('about:') || isAllowedEmbedHost(hostOf(req.url), 'uri' in embed ? hostOf(embed.uri) : 'www.youtube.com')}
            style={{ flex: 1, backgroundColor: tone.base }}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={v.locked ? 'lock-closed-outline' : 'play-circle-outline'} size={64} color={tone.onBase} />
          </View>
        )}
      </View>
      <View style={{ padding: Space.s4, paddingBottom: Space.s6 }}>
        <Txt variant="title">{v.title}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.s2, marginTop: Space.s2 }}>
          {v.activity ? <Pill label={v.activity.name} background={tone.soft} foreground={legibleOnSoft(c, tone.base)} /> : null}
          {v.category ? <Pill label={categoryLabel(s, v.category)} /> : null}
          {v.level ? <Pill label={v.level} /> : null}
          {v.durationMinutes != null ? <Pill label={s.duration(v.durationMinutes)} icon="time-outline" /> : null}
        </View>
        {v.description ? <Txt variant="bodyLarge" style={{ marginTop: Space.s4 }}>{v.description}</Txt> : null}
        <View style={{ marginTop: Space.s5 }}>
          {v.locked ? (
            <AppCard>
              <Txt variant="titleMedium">{s('video_paid_title')}</Txt>
              <Txt variant="body" style={{ marginTop: Space.s1 }}>{s('video_paid_body', { price: v.priceLabel })}</Txt>
              <Button label={s('video_unlock', { price: v.priceLabel })} onPress={purchase} loading={busy} style={{ marginTop: Space.s4 }} />
            </AppCard>
          ) : !playback || !embedUri(playback) ? (
            <AppCard><Txt variant="body">{s('video_unavailable')}</Txt></AppCard>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}
