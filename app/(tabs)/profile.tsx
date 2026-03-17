import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useGlobalSearchParams, useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { clearLastUserId, getLastUserId, saveLastUserId } from '@/lib/userSession';

interface UsuarioRow {
  id: string;
  dni: string;
  nombre_completo: string;
  estado_verificado: boolean;
  created_at: string;
}

interface PaseStatRow {
  id_pase: string;
  referencia_vuelo: string | null;
  usado: boolean;
  biometria_activada: boolean | null;
  fecha_creacion: string;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Desconocida';
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function maskDni(dni: string): string {
  if (!dni) return 'No disponible';
  if (dni.length <= 4) return dni;
  return `${'*'.repeat(Math.max(0, dni.length - 4))}${dni.slice(-4)}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams<{ usuarioId?: string }>();

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [user, setUser] = useState<UsuarioRow | null>(null);
  const [passes, setPasses] = useState<PaseStatRow[]>([]);

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

  const loadProfile = useCallback(async () => {
    setLoading(true);

    const userId = await resolveUserId();
    if (!userId) {
      setUser(null);
      setPasses([]);
      setLoading(false);
      return;
    }

    const [userResult, passesResult] = await Promise.all([
      supabase
        .from('usuarios')
        .select('id, dni, nombre_completo, estado_verificado, created_at')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('pases')
        .select('id_pase, referencia_vuelo, usado, biometria_activada, fecha_creacion')
        .eq('usuario_id', userId)
        .order('fecha_creacion', { ascending: false }),
    ]);

    if (userResult.error) {
      console.warn('[Profile] Error loading user:', userResult.error.message);
      setUser(null);
    } else {
      setUser((userResult.data as UsuarioRow | null) ?? null);
    }

    if (passesResult.error) {
      console.warn('[Profile] Error loading passes:', passesResult.error.message);
      setPasses([]);
    } else {
      setPasses((passesResult.data as PaseStatRow[]) ?? []);
    }

    setLoading(false);
  }, [resolveUserId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const stats = useMemo(() => {
    const totalPasses = passes.length;
    const activePasses = passes.filter((pass) => !pass.usado).length;
    const biometricLive = passes.some((pass) => Boolean(pass.biometria_activada) && !pass.usado);
    const latestFlight = passes[0]?.referencia_vuelo || 'UA5729';

    return {
      totalPasses,
      activePasses,
      biometricLive,
      latestFlight,
    };
  }, [passes]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    await clearLastUserId();

    if (error) {
      Alert.alert('Aviso', 'No se pudo cerrar la sesión remota, pero se limpió la sesión local.');
    }

    setLoggingOut(false);
    router.replace('/landing');
  }, [router]);

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
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-5 mt-2 flex-row items-center justify-between">
          <View>
            <Text className="text-[26px] font-black text-[#0F172A]">Perfil</Text>
            <Text className="text-sm text-[#64748B]">Identidad y ajustes biométricos de viaje</Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-full bg-white">
            <MaterialIcons name="manage-accounts" size={23} color="#0F172A" />
          </View>
        </View>

        <View className="rounded-[24px] bg-[#070707] p-6">
          <View className="flex-row items-center">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-[#1F2937]">
              <MaterialIcons name="person" size={30} color="#E5E7EB" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-[20px] font-extrabold text-white">{user?.nombre_completo || 'Viajero verificado'}</Text>
              <Text className="mt-1 text-xs text-[#A1A1AA]">Miembro desde {formatDate(user?.created_at || new Date().toISOString())}</Text>
            </View>
            <Text className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[1px] ${user?.estado_verificado ? 'bg-[#18201C] text-[#86EFAC]' : 'bg-[#27272A] text-[#D1D5DB]'}`}>
              {user?.estado_verificado ? 'Verificado' : 'Pendiente'}
            </Text>
          </View>

          <View className="mt-6 h-[1px] bg-[#202327]" />

          <View className="mt-5 flex-row justify-between">
            <View>
              <Text className="text-[10px] font-semibold uppercase tracking-[1.1px] text-[#71717A]">Documento</Text>
              <Text className="mt-1 text-[16px] font-bold text-white">{maskDni(user?.dni || '')}</Text>
            </View>
            <View>
              <Text className="text-[10px] font-semibold uppercase tracking-[1.1px] text-[#71717A]">Último vuelo</Text>
              <Text className="mt-1 text-[16px] font-bold text-white">{stats.latestFlight}</Text>
            </View>
          </View>
        </View>

        <View className="mt-6 rounded-[20px] bg-white p-5">
          <Text className="text-[18px] font-bold text-[#111827]">Estadísticas de viaje</Text>

          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-[#F8FAFC] px-4 py-4">
              <Text className="text-[11px] font-semibold uppercase tracking-[1px] text-[#6B7280]">Pases totales</Text>
              <Text className="mt-2 text-[28px] font-black text-[#0F172A]">{stats.totalPasses}</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-[#F8FAFC] px-4 py-4">
              <Text className="text-[11px] font-semibold uppercase tracking-[1px] text-[#6B7280]">Activos</Text>
              <Text className="mt-2 text-[28px] font-black text-[#0F172A]">{stats.activePasses}</Text>
            </View>
          </View>
        </View>

        <View className="mt-4 rounded-[20px] bg-white p-5">
          <Text className="text-[18px] font-bold text-[#111827]">Seguridad</Text>

          <View className="mt-4 flex-row items-center rounded-2xl bg-[#F8FAFC] px-4 py-4">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#DBEAFE]">
              <MaterialIcons name="fingerprint" size={22} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-[#111827]">Embarque biométrico</Text>
              <Text className="text-[13px] text-[#6B7280]">Estado de verificación de identidad en puerta</Text>
            </View>
            <Text className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[1px] ${stats.biometricLive ? 'bg-[#DBEAFE] text-[#2563EB]' : 'bg-[#E5E7EB] text-[#4B5563]'}`}>
              {stats.biometricLive ? 'Activo' : 'Apagado'}
            </Text>
          </View>

          {!user && (
            <Text className="mt-4 text-xs text-[#9CA3AF]">
              Los datos del perfil aún no están disponibles. Completa una verificación para rellenar esta pantalla.
            </Text>
          )}
        </View>
      </ScrollView>

      <View className="border-t border-[#E2E8F0] bg-[#F3F5F8] px-5 pb-3 pt-3">
        <TouchableOpacity
          className={`flex-row items-center justify-center rounded-[20px] px-5 py-4 ${loggingOut ? 'bg-[#334155]' : 'bg-[#0F172A]'}`}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.85}
        >
          <MaterialIcons name="logout" size={20} color="#FFFFFF" />
          <Text className="ml-2 text-[15px] font-semibold text-white">
            {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
