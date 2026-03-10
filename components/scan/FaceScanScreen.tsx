import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Camera } from 'react-native-vision-camera';

import { useFaceDetection, FaceScanState } from '@/components/scan/useFaceDetection';

export default function FaceScanScreen() {
    const router = useRouter();
    const isFocused = useIsFocused();
    const {
        hasPermission,
        requestPermission,
        cameraRef,
        device,
        state,
        capturedUri,
        statusMessage,
        reset,
    } = useFaceDetection();

    // Border color based on state
    const getBorderColor = (s: FaceScanState) => {
        switch (s) {
            case 'searching': return '#ffffff40';
            case 'detected': return '#22c55e';
            case 'blink_prompt': return '#3b82f6';
            case 'verified': return '#22c55e';
            case 'captured': return '#22c55e';
            default: return '#ffffff40';
        }
    };

    const getStatusDotColor = (s: FaceScanState) => {
        switch (s) {
            case 'searching': return '#eab308';
            case 'detected': return '#22c55e';
            case 'blink_prompt': return '#3b82f6';
            case 'verified': return '#22c55e';
            case 'captured': return '#22c55e';
            default: return '#eab308';
        }
    };

    if (!hasPermission) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#141414" />
                <View style={styles.permCenter}>
                    <MaterialIcons name="camera-alt" size={56} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.permTitle}>Acceso a la cámara requerido</Text>
                    <Text style={styles.permSubtitle}>
                        AeroPass necesita acceso a la cámara frontal para verificar tu identidad.
                    </Text>
                    <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                        <Text style={styles.permBtnText}>Permitir cámara</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.permCancel}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (device == null) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#141414" />
                <View style={styles.permCenter}>
                    <Text style={styles.permTitle}>No se encontró cámara frontal</Text>
                </View>
            </SafeAreaView>
        );
    }

    const CIRCLE_SIZE = 280;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#141414" />

            {/* Header */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                    <MaterialIcons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>

                <View style={styles.titlePill}>
                    <Text style={styles.titlePillText}>AEROPASS VERIFICACIÓN</Text>
                </View>

                <View style={[styles.iconButton, { opacity: 0 }]} />
            </View>

            {/* Instructions */}
            <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>Verificación facial</Text>
                <Text style={styles.heroSubtitle}>
                    Centra tu rostro en el círculo y{'\n'}parpadea cuando se te indique.
                </Text>
            </View>

            {/* Camera Circle */}
            <View style={styles.cameraArea}>
                <View style={[
                    styles.circleFrame,
                    {
                        width: CIRCLE_SIZE,
                        height: CIRCLE_SIZE,
                        borderRadius: CIRCLE_SIZE / 2,
                        borderColor: getBorderColor(state),
                    },
                ]}>
                    {state === 'captured' && capturedUri ? (
                        <Image
                            source={{ uri: capturedUri }}
                            style={[StyleSheet.absoluteFillObject, { borderRadius: CIRCLE_SIZE / 2 }]}
                            resizeMode="cover"
                        />
                    ) : (
                        <Camera
                            ref={cameraRef}
                            style={[StyleSheet.absoluteFillObject, { borderRadius: CIRCLE_SIZE / 2 }]}
                            device={device}
                            isActive={isFocused && state !== 'captured'}
                            photo={true}
                        />
                    )}
                </View>

                {/* Status pill */}
                <View style={styles.statusPill}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusDotColor(state) }]} />
                    <Text style={styles.statusText}>{statusMessage}</Text>
                </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomBar}>
                {state === 'captured' ? (
                    <View style={styles.capturedActions}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={reset}>
                            <MaterialIcons name="refresh" size={20} color="#ffffff" />
                            <Text style={styles.secondaryButtonText}>Repetir</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => {
                                // Navigate forward or finish flow
                                router.dismissAll();
                                router.replace('/(tabs)');
                            }}
                        >
                            <MaterialIcons name="check" size={20} color="#ffffff" />
                            <Text style={styles.primaryButtonText}>Continuar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.hintContainer}>
                        {state === 'blink_prompt' && (
                            <View style={styles.blinkHint}>
                                <MaterialIcons name="visibility" size={24} color="#3b82f6" />
                                <Text style={styles.blinkHintText}>Parpadea ahora</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                    <MaterialIcons name="lock" size={12} color="#ffffff30" />
                    <Text style={{ fontSize: 11, color: '#ffffff30', letterSpacing: 0.5 }}>ENCRYPTED & ON-DEVICE</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#141414',
    },
    // Permission screen
    permCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: 16,
    },
    permTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
    },
    permSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        lineHeight: 22,
    },
    permBtn: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 32,
        marginTop: 8,
    },
    permBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },
    permCancel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 8,
    },
    // Top bar
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    titlePill: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    titlePillText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 1.5,
    },
    // Hero
    heroSection: {
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 24,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#ffffff',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        lineHeight: 22,
    },
    // Camera area
    cameraArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleFrame: {
        overflow: 'hidden',
        borderWidth: 4,
    },
    // Status pill
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginTop: 24,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    // Bottom bar
    bottomBar: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        paddingTop: 16,
    },
    capturedActions: {
        flexDirection: 'row',
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        paddingVertical: 16,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#22c55e',
        borderRadius: 16,
        paddingVertical: 16,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    hintContainer: {
        minHeight: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    blinkHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderRadius: 16,
        paddingHorizontal: 24,
        paddingVertical: 14,
    },
    blinkHintText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#3b82f6',
    },
});
