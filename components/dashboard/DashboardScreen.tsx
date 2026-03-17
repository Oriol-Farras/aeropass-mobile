import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import { supabase } from '@/lib/supabase';
import { getLastUserId, saveLastUserId } from '@/lib/userSession';

interface DashboardScreenProps {
  usuarioId?: string;
}

interface PaseRow {
  id_pase: string;
  usuario_id: string;
  referencia_vuelo: string | null;
  usado: boolean;
  biometria_activada: boolean | null;
  fecha_creacion: string;
}

const FALLBACK_FLIGHT = {
  fromCode: 'MAD',
  fromCity: 'Madrid',
  toCode: 'JFK',
  toCity: 'Nueva York',
  flightNumber: 'UA5729',
  gate: 'B14',
  seat: '12B',
  departureTime: '14:30',
};

export default function DashboardScreen({ usuarioId }: DashboardScreenProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pase, setPase] = useState<PaseRow | null>(null);
  const [gateAccessEnabled, setGateAccessEnabled] = useState(true);

  const loadLatestPass = useCallback(async () => {
    setLoading(true);

    let currentUserId = usuarioId;
    if (!currentUserId) {
      const { data: authData } = await supabase.auth.getUser();
      currentUserId = authData.user?.id;
    }
    if (!currentUserId) {
      currentUserId = (await getLastUserId()) ?? undefined;
    }
    if (currentUserId) {
      await saveLastUserId(currentUserId);
    }

    if (!currentUserId) {
      setPase(null);
      setGateAccessEnabled(true);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('pases')
      .select('id_pase, usuario_id, referencia_vuelo, usado, biometria_activada, fecha_creacion')
      .eq('usuario_id', currentUserId)
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[Dashboard] Error loading latest pass:', error.message);
      setPase(null);
      setGateAccessEnabled(true);
      setLoading(false);
      return;
    }

    const latestPass = (data as PaseRow | null) ?? null;
    setPase(latestPass);
    setGateAccessEnabled(latestPass ? !latestPass.usado : true);
    setLoading(false);
  }, [usuarioId]);

  useEffect(() => {
    void loadLatestPass();
  }, [loadLatestPass]);

  const handleGateToggle = useCallback(
    async (enabled: boolean) => {
      const previous = gateAccessEnabled;
      setGateAccessEnabled(enabled);

      if (!pase?.id_pase) {
        return;
      }

      setSaving(true);
      const { error } = await supabase
        .from('pases')
        .update({
          usado: !enabled,
          biometria_activada: enabled,
        })
        .eq('id_pase', pase.id_pase);

      if (error) {
        setGateAccessEnabled(previous);
        Alert.alert('Error de sincronización', 'No se pudo actualizar el acceso a puerta. Inténtalo de nuevo.');
      } else {
        setPase((current) =>
          current
            ? {
                ...current,
                usado: !enabled,
                biometria_activada: enabled,
              }
            : current,
        );
      }
      setSaving(false);
    },
    [gateAccessEnabled, pase],
  );

  const flightNumber = useMemo(() => {
    const rawFlight = pase?.referencia_vuelo?.trim();
    return rawFlight && rawFlight.length > 0 ? rawFlight : FALLBACK_FLIGHT.flightNumber;
  }, [pase?.referencia_vuelo]);

  const biometricLive = pase ? Boolean(pase.biometria_activada) : gateAccessEnabled;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F3F5F8]">
        <ActivityIndicator size="large" color="#111111" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F3F5F8]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-5 mt-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-black">
              <MaterialIcons name="flight" size={20} color="#FFFFFF" />
            </View>
            <Text className="ml-3 text-[22px] font-extrabold text-[#101828]">AeroPass</Text>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
            <MaterialIcons name="notifications-none" size={21} color="#111827" />
          </View>
        </View>

        <View className="rounded-[24px] bg-[#070707] p-6">
          <View className="mb-6 flex-row items-center justify-between">
            <View className="flex-row items-center rounded-full bg-[#18201C] px-3 py-1.5">
              <View className="mr-2 h-2 w-2 rounded-full bg-[#22C55E]" />
              <Text className="text-xs font-semibold tracking-wide text-[#86EFAC]">En hora</Text>
            </View>
            <MaterialCommunityIcons
              name="airplane"
              size={20}
              color="#A1A1AA"
              style={{ transform: [{ rotate: '90deg' }] }}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[41px] font-black tracking-wide text-white">{FALLBACK_FLIGHT.fromCode}</Text>
              <Text className="text-sm text-[#9CA3AF]">{FALLBACK_FLIGHT.fromCity}</Text>
            </View>

            <View className="mx-4 flex-1 flex-row items-center">
              <View className="h-[1px] flex-1 bg-[#27272A]" />
              <MaterialCommunityIcons
                name="airplane-takeoff"
                size={20}
                color="#A1A1AA"
                style={{ marginHorizontal: 6, transform: [{ rotate: '90deg' }] }}
              />
              <View className="h-[1px] flex-1 bg-[#27272A]" />
            </View>

            <View className="items-end">
              <Text className="text-[41px] font-black tracking-wide text-white">{FALLBACK_FLIGHT.toCode}</Text>
              <Text className="text-sm text-[#9CA3AF]">{FALLBACK_FLIGHT.toCity}</Text>
            </View>
          </View>

          <View className="my-5 h-[1px] bg-[#202327]" />

          <View className="flex-row justify-between">
            <View>
              <Text className="text-[10px] font-semibold uppercase tracking-[1.1px] text-[#71717A]">Vuelo</Text>
              <Text className="mt-1 text-[16px] font-bold text-white">{flightNumber}</Text>
            </View>
            <View>
              <Text className="text-[10px] font-semibold uppercase tracking-[1.1px] text-[#71717A]">Puerta</Text>
              <Text className="mt-1 text-[16px] font-bold text-white">{FALLBACK_FLIGHT.gate}</Text>
            </View>
            <View>
              <Text className="text-[10px] font-semibold uppercase tracking-[1.1px] text-[#71717A]">Asiento</Text>
              <Text className="mt-1 text-[16px] font-bold text-white">{FALLBACK_FLIGHT.seat}</Text>
            </View>
            <View>
              <Text className="text-[10px] font-semibold uppercase tracking-[1.1px] text-[#71717A]">Hora</Text>
              <Text className="mt-1 text-[16px] font-bold text-white">{FALLBACK_FLIGHT.departureTime}</Text>
            </View>
          </View>
        </View>

        <Text className="mt-8 text-[20px] font-extrabold text-[#111827]">Próximos pasos</Text>

        <View className="mt-4 rounded-[20px] bg-white p-5">
          <View className="flex-row items-center">
            <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-[#DCFCE7]">
              <MaterialIcons name="check-circle" size={24} color="#16A34A" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-[#111827]">Check-in completado</Text>
              <Text className="text-[13px] text-[#6B7280]">Listo para embarcar</Text>
            </View>
            <Text className="rounded-md bg-[#DCFCE7] px-2 py-1 text-[10px] font-bold uppercase tracking-[1px] text-[#15803D]">
              Hecho
            </Text>
          </View>

          <View className="my-4 ml-[58px] h-[1px] bg-[#F1F5F9]" />

          <View className="flex-row items-center">
            <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-[#DBEAFE]">
              <MaterialIcons name="face" size={22} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-[#111827]">Embarque biométrico activo</Text>
              <Text className="text-[13px] text-[#6B7280]">Dirígete a la puerta automática</Text>
            </View>
            <Text className="rounded-md bg-[#DBEAFE] px-2 py-1 text-[10px] font-bold uppercase tracking-[1px] text-[#2563EB]">
              {biometricLive ? 'Activo' : 'Pausado'}
            </Text>
          </View>
        </View>

        <View className="mt-4 rounded-[20px] bg-white p-5">
          <View className="flex-row items-center">
            <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-[#EFF6FF]">
              <MaterialIcons name="lock-open" size={22} color="#1D4ED8" />
            </View>
            <View className="flex-1 pr-3">
              <Text className="text-[15px] font-semibold text-[#111827]">Acceso a puerta</Text>
              <Text className="text-[13px] text-[#6B7280]">Sincroniza el estado del pase en Supabase</Text>
            </View>
            <Switch
              value={gateAccessEnabled}
              onValueChange={handleGateToggle}
              disabled={saving || !pase?.id_pase}
              trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D5DB"
            />
          </View>
          {!pase?.id_pase && (
            <Text className="mt-3 text-xs text-[#9CA3AF]">
              No se encontró un pase para el usuario actual. Mostrando datos de vuelo por defecto.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
