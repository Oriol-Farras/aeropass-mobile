import { useLocalSearchParams } from 'expo-router';

import DashboardScreen from '@/components/dashboard/DashboardScreen';

export default function HomeTabScreen() {
  const { usuarioId } = useLocalSearchParams<{ usuarioId?: string }>();

  return <DashboardScreen usuarioId={typeof usuarioId === 'string' ? usuarioId : undefined} />;
}
