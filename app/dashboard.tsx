import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import DashboardScreen from '@/components/dashboard/DashboardScreen';

export default function DashboardRoute() {
    const params = useLocalSearchParams();
    const { usuarioId } = params;

    return <DashboardScreen usuarioId={usuarioId as string} />;
}
