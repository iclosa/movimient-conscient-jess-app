import { useLocalSearchParams } from 'expo-router';
import { CustomWellnessScreen } from '@/features/mes/GratitudeScreen';

export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CustomWellnessScreen id={Number(id)} />;
}
