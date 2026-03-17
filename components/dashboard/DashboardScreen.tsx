import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { obtenerUltimoPase, toggleBiometriaActivada, PaseConUsuario } from '@/lib/supabase';

export default function DashboardScreen({ usuarioId }: { usuarioId: string }) {
    const [pase, setPase] = useState<PaseConUsuario | null>(null);
    const [loading, setLoading] = useState(true);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        if (usuarioId) {
            loadPaseData();
        }
    }, [usuarioId]);

    const loadPaseData = async () => {
        setLoading(true);
        const data = await obtenerUltimoPase(usuarioId);
        if (data) {
            setPase(data);
            setBiometricEnabled(data.biometria_activada || false);
        }
        setLoading(false);
    };

    const handleToggle = async (value: boolean) => {
        if (!pase) return;
        setBiometricEnabled(value);
        setToggling(true);
        const success = await toggleBiometriaActivada(pase.id_pase, value);
        if (!success) {
            // Revert state on failure
            setBiometricEnabled(!value);
        } else {
            setPase({ ...pase, biometria_activada: value });
        }
        setToggling(false);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
            </SafeAreaView>
        );
    }

    const vuelo = pase?.referencia_vuelo || 'UA5729';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <MaterialIcons name="flight" size={20} color="#ffffff" />
                    </View>
                    <Text style={styles.appName}>AeroPass</Text>
                </View>
                <TouchableOpacity style={styles.notificationButton}>
                    <MaterialIcons name="notifications" size={24} color="#111" />
                </TouchableOpacity>
            </View>

            {/* Boarding Pass Card */}
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <View style={styles.badge}>
                        <View style={styles.badgeDot} />
                        <Text style={styles.badgeText}>En hora</Text>
                    </View>
                    <MaterialIcons name="qr-code-2" size={24} color="#ffffff" />
                </View>

                <View style={styles.destinations}>
                    <View style={styles.destBox}>
                        <Text style={styles.destCode}>MAD</Text>
                        <Text style={styles.destName}>Madrid</Text>
                    </View>

                    <View style={styles.flightIconContainer}>
                        <View style={styles.flightLine} />
                        <MaterialIcons name="flight" size={24} color="#9ca3af" style={{ transform: [{ rotate: '90deg' }] }} />
                        <View style={styles.flightLine} />
                    </View>

                    <View style={[styles.destBox, { alignItems: 'flex-end' }]}>
                        <Text style={styles.destCode}>JFK</Text>
                        <Text style={styles.destName}>Nueva York</Text>
                    </View>
                </View>

                <Text style={styles.flightDuration}>7h 25m</Text>

                <View style={styles.cardDivider} />

                <View style={styles.detailsRow}>
                    <View style={styles.detailBox}>
                        <Text style={styles.detailLabel}>VUELO</Text>
                        <Text style={styles.detailValue}>{vuelo}</Text>
                    </View>
                    <View style={styles.detailBox}>
                        <Text style={styles.detailLabel}>PUERTA</Text>
                        <Text style={styles.detailValue}>B14</Text>
                    </View>
                    <View style={styles.detailBox}>
                        <Text style={styles.detailLabel}>ASIENTO</Text>
                        <Text style={styles.detailValue}>12B</Text>
                    </View>
                    <View style={styles.detailBox}>
                        <Text style={styles.detailLabel}>EMBARQUE</Text>
                        <Text style={styles.detailValue}>14:30</Text>
                    </View>
                </View>
            </View>

            {/* Próximos pasos */}
            <Text style={styles.sectionTitle}>Próximos pasos</Text>

            <View style={styles.stepsContainer}>
                <View style={styles.stepRow}>
                    <View style={[styles.stepIconBox, { backgroundColor: '#dcfce7' }]}>
                        <MaterialIcons name="check-circle" size={24} color="#16a34a" />
                    </View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Check-in completado</Text>
                        <Text style={styles.stepSubtitle}>Documentos verificados</Text>
                    </View>
                </View>

                <View style={styles.stepDivider} />

                <View style={styles.stepRow}>
                    <View style={[styles.stepIconBox, { backgroundColor: '#dbeafe' }]}>
                        <MaterialIcons name="face" size={24} color="#3b82f6" />
                    </View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Embarque biométrico activo</Text>
                        <Text style={styles.stepSubtitle}>Dirígete a las puertas automáticas</Text>
                    </View>
                    <View style={styles.liveBadge}>
                        <Text style={styles.liveText}>ACTIVO</Text>
                    </View>
                </View>
            </View>

            {/* Gate Access Toggle */}
            <View style={styles.toggleContainer}>
                <View style={styles.toggleIconBox}>
                    <MaterialIcons name="lock-open" size={24} color="#4b5563" />
                </View>
                <View style={styles.toggleContent}>
                    <Text style={styles.toggleTitle}>Acceso a puerta</Text>
                    <Text style={styles.toggleSubtitle}>Habilitar entrada biométrica</Text>
                </View>
                <Switch
                    value={biometricEnabled}
                    onValueChange={handleToggle}
                    trackColor={{ false: '#d1d5db', true: '#111' }}
                    thumbColor="#ffffff"
                    disabled={toggling}
                    style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                />
            </View>

            <View style={{ flex: 1 }} />

            {/* Bottom Tab Bar */}
            <View style={styles.tabBar}>
                <View style={styles.tabItem}>
                    <MaterialIcons name="home" size={28} color="#111" />
                    <Text style={[styles.tabText, { color: '#111' }]}>Inicio</Text>
                </View>
                <View style={styles.tabItem}>
                    <MaterialIcons name="account-balance-wallet" size={28} color="#9ca3af" />
                    <Text style={styles.tabText}>Cartera</Text>
                </View>
                <View style={styles.tabItem}>
                    <MaterialIcons name="person" size={28} color="#9ca3af" />
                    <Text style={styles.tabText}>Perfil</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#111',
        alignItems: 'center',
        justifyContent: 'center',
    },
    appName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111',
        letterSpacing: -0.5,
    },
    notificationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    card: {
        backgroundColor: '#050505',
        marginHorizontal: 20,
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#22c55e',
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    destinations: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    destBox: {
        flex: 1,
    },
    destCode: {
        color: '#ffffff',
        fontSize: 40,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 4,
    },
    destName: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '500',
    },
    flightIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1.5,
        justifyContent: 'center',
        gap: 8,
    },
    flightLine: {
        height: 1,
        flex: 1,
        backgroundColor: '#333',
    },
    flightDuration: {
        color: '#9ca3af',
        fontSize: 12,
        textAlign: 'center',
        marginTop: -10,
        marginBottom: 20,
        fontWeight: '500',
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#222',
        marginBottom: 20,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailBox: {
        alignItems: 'flex-start',
    },
    detailLabel: {
        color: '#6b7280',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 6,
    },
    detailValue: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111',
        marginHorizontal: 24,
        marginTop: 32,
        marginBottom: 16,
    },
    stepsContainer: {
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
        marginBottom: 2,
    },
    stepSubtitle: {
        fontSize: 13,
        color: '#6b7280',
    },
    stepDivider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginLeft: 60,
        marginVertical: 16,
    },
    liveBadge: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    liveText: {
        color: '#3b82f6',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 16,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    toggleIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    toggleContent: {
        flex: 1,
    },
    toggleTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
        marginBottom: 2,
    },
    toggleSubtitle: {
        fontSize: 13,
        color: '#6b7280',
    },
    tabBar: {
        flexDirection: 'row',
        paddingTop: 16,
        paddingBottom: 32,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    tabText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9ca3af',
    },
});
