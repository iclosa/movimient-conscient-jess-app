import { useLocalSearchParams } from 'expo-router';
import { PracticeRoute } from '@/features/mes/MindfulnessScreen';

export default function Route() {
  const { index } = useLocalSearchParams<{ index: string }>();
  return <PracticeRoute index={Number(index)} />;
}
