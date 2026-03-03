import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface DNIData {
    number: string;
    name: string | null;
    surname1: string | null;
    surname2: string | null;
    dob: string | null;
    photo: string | null;
}

interface Props {
    dni: DNIData;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DNIResultScreen({ dni, onConfirm, onCancel }: Props) {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* ── Header ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
                <TouchableOpacity onPress={onCancel} style={{ padding: 4 }}>
                    <MaterialIcons name="close" size={26} color="#111" />
                </TouchableOpacity>
                <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#111' }}>
                    Identity Card Verification
                </Text>
                <View style={{ width: 34 }} />
            </View>

            {/* ── Scrollable content ── */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── ID Card ── */}
                <View style={{
                    backgroundColor: '#fff',
                    borderRadius: 20,
                    padding: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.10,
                    shadowRadius: 14,
                    elevation: 5,
                    borderWidth: 1,
                    borderColor: '#f0f0f0',
                    marginBottom: 20,
                }}>
                    {/* Badge row — verde claro */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                            <MaterialIcons name="verified" size={14} color="#16a34a" />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#16a34a', letterSpacing: 0.8 }}>VERIFIED ID</Text>
                        </View>
                        <MaterialIcons name="fingerprint" size={24} color="#d1d5db" />
                    </View>

                    {/* Photo + fields */}
                    <View style={{ flexDirection: 'row', gap: 18 }}>
                        {/* DNI passport photo — portrait */}
                        <View style={{ width: 110, height: 145, borderRadius: 10, overflow: 'hidden', backgroundColor: '#e5e7eb' }}>
                            {dni.photo ? (
                                <Image
                                    source={{ uri: dni.photo }}
                                    style={{ width: '100%', height: '100%', filter: [{ saturate: 0 }] } as any}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                    <MaterialIcons name="person" size={48} color="#9ca3af" />
                                </View>
                            )}
                        </View>

                        {/* Campos extraídos */}
                        <View style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
                            <View>
                                <Text style={{ fontSize: 10, fontWeight: '600', color: '#9ca3af', letterSpacing: 1.2, marginBottom: 2 }}>APELLIDOS</Text>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111' }}>
                                    {[dni.surname1, dni.surname2].filter(Boolean).join(' ') || '—'}
                                </Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 10, fontWeight: '600', color: '#9ca3af', letterSpacing: 1.2, marginBottom: 2 }}>NOMBRE</Text>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111' }}>{dni.name || '—'}</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 10, fontWeight: '600', color: '#9ca3af', letterSpacing: 1.2, marginBottom: 2 }}>FECHA DE NACIMIENTO</Text>
                                <Text style={{ fontSize: 15, fontWeight: '500', color: '#111' }}>{dni.dob || '—'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* DNI number */}
                    <View style={{ marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 1, marginBottom: 4 }}>NÚMERO DE DOCUMENTO</Text>
                        <Text style={{ fontSize: 26, fontWeight: '900', color: '#111', letterSpacing: 3 }}>
                            {dni.number}
                        </Text>
                    </View>
                </View>

                {/* ── Biometric banner ── */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#f9fafb', borderRadius: 16, padding: 16 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialIcons name="check" size={24} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 2 }}>Identity Confirmed</Text>
                        <Text style={{ fontSize: 13, color: '#6b7280', lineHeight: 18 }}>Your identity has been successfully verified by AeroPass.</Text>
                    </View>
                </View>
            </ScrollView>

            {/* ── Botones + footer fijos al fondo ── */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16, gap: 12 }}>
                <TouchableOpacity
                    style={{ backgroundColor: '#111', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onPress={onConfirm}
                >
                    <MaterialIcons name="check" size={18} color="#ffffff" />
                    <Text style={{ fontSize: 16, color: '#ffffff', fontWeight: '700' }}>Confirmar y continuar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center' }} onPress={onCancel}>
                    <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '500' }}>Cancelar y volver a escanear</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <MaterialIcons name="lock" size={12} color="#d1d5db" />
                    <Text style={{ fontSize: 11, color: '#d1d5db', letterSpacing: 0.5 }}>ENCRYPTED & ON-DEVICE</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
