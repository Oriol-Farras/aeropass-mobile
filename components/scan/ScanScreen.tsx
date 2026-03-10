import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Camera } from 'react-native-vision-camera';

import { styles, permStyles } from '@/components/scan/ScanScreen.styles';
import { useScanScreen } from '@/components/scan/useScanScreen';

export default function ScanScreen() {
    const isFocused = useIsFocused();
    const {
        router,
        hasPermission,
        requestPermission,
        cameraRef,
        isProcessingOcr,
        compressedUri,
        compressedKB,
        progressAnim,
        loadingText,
        device,
        state,
        capturedUri,
        takePicture,
        reset,
        onAcceptDni,
    } = useScanScreen();

    if (!hasPermission) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#141414" />
                <View style={permStyles.center}>
                    <MaterialIcons name="camera-alt" size={56} color="rgba(255,255,255,0.4)" />
                    <Text style={permStyles.title}>Acceso a la cámara requerido</Text>
                    <Text style={permStyles.subtitle}>
                        AeroPass necesita acceso a la cámara para escanear tu documento a 60 FPS en tiempo real.
                    </Text>
                    <TouchableOpacity style={permStyles.btn} onPress={requestPermission}>
                        <Text style={permStyles.btnText}>Permitir cámara</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={permStyles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (device == null) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={permStyles.center}>
                    <ActivityIndicator size="large" color="#ffffff" />
                </View>
            </SafeAreaView>
        );
    }

    // Screen rendering has been delegated to `/dni-result` via router.push



    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#141414" />

            <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                    <MaterialIcons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>

                <View style={styles.titlePill}>
                    <Text style={styles.titlePillText}>AEROPASS VERIFICACIÓN</Text>
                </View>

                <View style={[styles.iconButton, { opacity: 0 }]} />
            </View>

            <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>Escanear documento</Text>
                <Text style={styles.heroSubtitle}>
                    Enfoca el reverso de tu DNI. Asegúrate de que{'\n'}el código PDF417 o QR sea visible.
                </Text>
            </View>

            <View style={styles.viewfinderWrapper}>
                <View style={styles.viewfinder}>

                    <Camera
                        ref={cameraRef}
                        style={StyleSheet.absoluteFillObject}
                        device={device}
                        isActive={isFocused && state !== 'captured'}
                        photo={true}
                    />

                    {capturedUri && (
                        <>
                            <Image
                                source={{ uri: compressedUri ?? capturedUri }}
                                style={StyleSheet.absoluteFillObject}
                            />
                            {compressedUri && compressedKB > 0 && (
                                <View style={{
                                    position: 'absolute', top: 10, right: 10,
                                    backgroundColor: 'rgba(0,0,0,0.65)',
                                    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
                                    flexDirection: 'row', alignItems: 'center', gap: 4,
                                }}>
                                    <MaterialIcons name="compress" size={12} color="#22c55e" />
                                    <Text style={{ color: '#22c55e', fontSize: 11, fontWeight: '700' }}>
                                        {compressedKB} KB
                                    </Text>
                                </View>
                            )}
                            {isProcessingOcr && (
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', borderRadius: 20, padding: 40 }]}>
                                    <View style={{ width: '100%', alignItems: 'center' }}>
                                        <ActivityIndicator size="large" color="#ffffff" style={{ marginBottom: 20 }} />

                                        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 20, textAlign: 'center' }}>
                                            {loadingText}
                                        </Text>

                                        <View style={{ width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
                                            <Animated.View style={{
                                                height: '100%',
                                                backgroundColor: '#22c55e',
                                                width: progressAnim.interpolate({
                                                    inputRange: [0, 100],
                                                    outputRange: ['0%', '100%']
                                                })
                                            }} />
                                        </View>

                                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 10, textAlign: 'center' }}>
                                            El procesamiento puede tardar un momento
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </>
                    )}

                    <View style={[styles.corner, styles.cornerTL, state === 'detected' && { borderColor: '#22c55e' }, state === 'too_far' && { borderColor: '#f97316' }]} />
                    <View style={[styles.corner, styles.cornerTR, state === 'detected' && { borderColor: '#22c55e' }, state === 'too_far' && { borderColor: '#f97316' }]} />
                    <View style={[styles.corner, styles.cornerBL, state === 'detected' && { borderColor: '#22c55e' }, state === 'too_far' && { borderColor: '#f97316' }]} />
                    <View style={[styles.corner, styles.cornerBR, state === 'detected' && { borderColor: '#22c55e' }, state === 'too_far' && { borderColor: '#f97316' }]} />
                </View>

                {state === 'too_far' && (
                    <Text style={{
                        position: 'absolute',
                        bottom: 24, // movido hacia arriba (dentro del área de enfoque)
                        color: '#f97316',
                        fontWeight: '600',
                        fontSize: 16,
                        textAlign: 'center',
                        width: '100%',
                        textShadowColor: 'rgba(0, 0, 0, 0.75)',
                        textShadowOffset: { width: -1, height: 1 },
                        textShadowRadius: 10
                    }}>Acércate más al documento</Text>
                )}

                <View style={styles.statusPill}>
                    <View style={[styles.statusDot, { backgroundColor: state === 'detected' ? '#22c55e' : (state === 'captured' ? '#3b82f6' : (state === 'too_far' ? '#f97316' : '#eab308')) }]} />
                    <Text style={styles.statusText}>
                        {state === 'detected' ? 'Listo para capturar' : (state === 'captured' ? '¡Foto capturada!' : (state === 'too_far' ? 'Acércate más' : 'Buscando documento...'))}
                    </Text>
                </View>
            </View>

            <View style={styles.bottomBar}>
                <View style={styles.bottomActions}>
                    <TouchableOpacity style={styles.bottomActionBtn}>
                        <View style={styles.bottomActionIcon}>
                            <MaterialIcons name="photo" size={24} color="#ffffff" />
                        </View>
                        <Text style={styles.bottomActionLabel}>GALERÍA</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.captureButton, state === 'detected' && { borderColor: '#22c55e' }]}
                        activeOpacity={0.85}
                        disabled={isProcessingOcr}
                        onPress={async () => {
                            if (isProcessingOcr) return;
                            if (state === 'captured') {
                                reset();
                            } else {
                                await takePicture();
                            }
                        }}
                    >
                        {state === 'captured' ? (
                            <MaterialIcons name="refresh" size={32} color={isProcessingOcr ? "#888888" : "#000000"} />
                        ) : (
                            <View style={[styles.captureInner, state === 'detected' && { backgroundColor: '#22c55e' }]} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.bottomActionBtn}>
                        <View style={styles.bottomActionIcon}>
                            <MaterialIcons name="keyboard" size={24} color="#ffffff" />
                        </View>
                        <Text style={styles.bottomActionLabel}>MANUAL</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.poweredBy}>Desarrollado con AeroPass Secure OCR</Text>
            </View>
        </SafeAreaView>
    );
}

// Small helper: a label + value pair for the DNI card
function Field({ label, value }: { label: string; value: string }) {
    return (
        <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#9ca3af', letterSpacing: 0.8 }}>{label}</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111', marginTop: 2 }} numberOfLines={1}>{value}</Text>
        </View>
    );
}
