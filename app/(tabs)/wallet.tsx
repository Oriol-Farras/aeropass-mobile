import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useGlobalSearchParams } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { getLastUserId, saveLastUserId } from '@/lib/userSession';

interface WalletPass {
  id_pase: string;
  referencia_vuelo: string | null;
  usado: boolean;
  biometria_activada: boolean | null;
  fecha_creacion: string;
}

const FALLBACK_FLIGHT = {
  fromCode: 'MAD',
  toCode: 'JFK',
  fromCity: 'Madrid',
  toCity: 'Nueva York',
  flightNumber: 'UA5729',
  gate: 'B14',
  seat: '12B',
  departureTime: '14:30',
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida';
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function WalletScreen() {
  const params = useGlobalSearchParams<{ usuarioId?: string }>();

  const [loading, setLoading] = useState(true);
  const [passes, setPasses] = useState<WalletPass[]>([]);

  const resolveUserId = useCallback(async () => {
    let userId = typeof params.usuarioId === 'string' ? params.usuarioId : undefined;

    if (!userId) {
      const { data: authData } = await supabase.auth.getUser();
      userId = authData.user?.id;
    }

    if (!userId) {
      userId = (await getLastUserId()) ?? undefined;
    }

    if (userId) {
      await saveLastUserId(userId);
    }

    return userId;
  }, [params.usuarioId]);

  const loadWallet = useCallback(async () => {
    setLoading(true);

    const userId = await resolveUserId();
    if (!userId) {
      setPasses([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('pases')
      .select('id_pase, referencia_vuelo, usado, biometria_activada, fecha_creacion')
      .eq('usuario_id', userId)
      .order('fecha_creacion', { ascending: false })
      .limit(12);

    if (error) {
      console.warn('[Wallet] Error loading passes:', error.message);
      setPasses([]);
      setLoading(false);
      return;
    }

    setPasses((data as WalletPass[]) ?? []);
    setLoading(false);
  }, [resolveUserId]);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const activePass = passes[0] ?? null;
  const history = passes.slice(1);

  const activeFlightNumber = useMemo(() => {
    const raw = activePass?.referencia_vuelo?.trim();
    return raw && raw.length > 0 ? raw : FALLBACK_FLIGHT.flightNumber;
  }, [activePass?.referencia_vuelo]);

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
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-5 mt-2 flex-row items-center justify-between">
          <View>
            <Text className="text-[26px] font-black text-[#0F172A]">Cartera</Text>
            <Text className="text-sm text-[#64748B]">Tus pases de embarque e historial de acceso</Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-full bg-white">
            <MaterialIcons name="credit-card" size={22} color="#0F172A" />
          </View>
        </View>

        <View className="rounded-[24px] bg-[#070707] p-6">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-[10px] font-semibold uppercase tracking-[1.3px] text-[#71717A]">Pase activo</Text>
            <View className={`rounded-full px-3 py-1 ${activePass && !activePass.usado ? 'bg-[#18201C]' : 'bg-[#27272A]'}`}>
              <Text className={`text-[11px] font-semibold ${activePass && !activePass.usado ? 'text-[#86EFAC]' : 'text-[#D1D5DB]'}`}>
                {activePass && !activePass.usado ? 'Listo' : 'Sin pase activo'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[41px] font-black tracking-wide text-white">{FALLBACK_FLIGHT.fromCode}</Text>
              <Text className="text-sm text-[#9CA3AF]">{FALLBACK_FLIGHT.fromCity}</Text>
            </View>

            <View className="mx-3 flex-1 flex-row items-center">
              <View className="h-[1px] flex-1 bg-[#27272A]" />
              <MaterialCommunityIcons
                name="airplane"
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
              <Text className="mt-1 text-[16px] font-bold text-white">{activeFlightNumber}</Text>
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

        <View className="mt-6 rounded-[20px] bg-white p-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[18px] font-bold text-[#111827]">Historial de pases</Text>
            <Text className="text-xs font-semibold uppercase tracking-[1px] text-[#6B7280]">{passes.length} total</Text>
          </View>

          {passes.length === 0 ? (
            <View className="items-center rounded-2xl border border-dashed border-[#D1D5DB] px-4 py-8">
              <MaterialIcons name="airplane-ticket" size={34} color="#9CA3AF" />
              <Text className="mt-3 text-sm font-semibold text-[#374151]">Todavía no hay pases</Text>
              <Text className="mt-1 text-center text-xs text-[#6B7280]">
                Tu primer pase de embarque aparecerá aquí tras completar la verificación de identidad.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {(history.length > 0 ? history : passes).map((pass) => {
                const live = Boolean(pass.biometria_activada) && !pass.usado;
                return (
                  <View key={pass.id_pase} className="rounded-2xl bg-[#F8FAFC] px-4 py-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[15px] font-semibold text-[#0F172A]">
                        {pass.referencia_vuelo || FALLBACK_FLIGHT.flightNumber}
                      </Text>
                      <Text className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[1px] ${live ? 'bg-[#DBEAFE] text-[#2563EB]' : 'bg-[#E5E7EB] text-[#4B5563]'}`}>
                        {live ? 'Activo' : pass.usado ? 'Usado' : 'Guardado'}
                      </Text>
                    </View>
                    <Text className="mt-1 text-xs text-[#6B7280]">{formatDate(pass.fecha_creacion)}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
