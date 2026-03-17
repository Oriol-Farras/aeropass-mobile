import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function DashboardRoute() {
  const params = useLocalSearchParams<{ usuarioId?: string }>();
  const userId = typeof params.usuarioId === 'string' ? params.usuarioId : undefined;

  return (
    <Redirect
      href={{
        pathname: '/(tabs)',
        params: userId ? { usuarioId: userId } : {},
      }}
    />
  );
}
