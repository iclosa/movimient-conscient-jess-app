import { useLocalSearchParams } from 'expo-router';
import { VideoDetailScreen } from '@/features/videos/VideoDetailScreen';

export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <VideoDetailScreen id={Number(id)} />;
}
