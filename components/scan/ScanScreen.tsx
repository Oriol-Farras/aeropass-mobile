import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'react-native-vision-camera';

import { styles, permStyles } from '@/components/scan/ScanScreen.styles';
import { useScanScreen } from '@/components/scan/useScanScreen';

export default function ScanScreen() {
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
        detectedDNI,
        setDetectedDNI,
        onAcceptDni,
    } = useScanScreen();

    if (!hasPermission) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#141414" />
                <View style={permStyles.center}>
                    <MaterialIcons name="camera-alt" size={56} color="rgba(255,255,255,0.4)" />
                    <Text style={permStyles.title}>Camera Access Required</Text>
                    <Text style={permStyles.subtitle}>
                        AeroPass needs camera access to scan your ID document at 60 FPS in real-time.
                    </Text>
                    <TouchableOpacity style={permStyles.btn} onPress={requestPermission}>
                        <Text style={permStyles.btnText}>Allow Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={permStyles.cancelText}>Cancel</Text>
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

    // ── PANTALLA DE RESULTADO (DNI DETECTADO) ──
    if (detectedDNI) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#ffffff', justifyContent: 'space-between' }]}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

                {/* Header (Back button styled as in the reference image) */}
                <View style={[styles.topBar, { paddingTop: 24 }]}>
                    <TouchableOpacity onPress={() => setDetectedDNI(null)} style={{ padding: 8 }}>
                        <MaterialIcons name="arrow-back" size={28} color="#000000" />
                    </TouchableOpacity>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 16, color: '#888', fontWeight: 'bold' }}>?</Text>
                    </View>
                </View>

                {/* Hero / ID Verification graphic */}
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>

                    {/* The faux card visual */}
                    <View style={{
                        width: '100%',
                        aspectRatio: 1,
                        backgroundColor: '#f8f9fa',
                        borderRadius: 40,
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        overflow: 'hidden',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 48,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.05,
                        shadowRadius: 20,
                    }}>
                        {/* Faux border brackets like the reference */}
                        <View style={{ position: 'absolute', top: 20, left: 20, width: 20, height: 20, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#000', borderRadius: 4 }} />
                        <View style={{ position: 'absolute', top: 20, right: 20, width: 20, height: 20, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#000', borderRadius: 4 }} />
                        <View style={{ position: 'absolute', bottom: 20, left: 20, width: 20, height: 20, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#000', borderRadius: 4 }} />
                        <View style={{ position: 'absolute', bottom: 20, right: 20, width: 20, height: 20, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#000', borderRadius: 4 }} />

                        <MaterialIcons name="fact-check" size={80} color="#22c55e" />
                    </View>

                    {/* Typography */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#000' }} />
                        <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1.5, color: '#555' }}>
                            VERIFIED
                        </Text>
                    </View>

                    <Text style={{ fontSize: 26, fontWeight: '800', color: '#000000', marginBottom: 12, textAlign: 'center' }}>
                        ID Document Extracted
                    </Text>

                    <Text style={{ fontSize: 42, fontWeight: '900', color: '#000000', textAlign: 'center', letterSpacing: 2 }}>
                        {detectedDNI.number}
                    </Text>

                    <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 16, paddingHorizontal: 20, lineHeight: 22 }}>
                        Please ensure the extracted DNI number matches the physical document exactly.
                    </Text>
                </View>

                {/* Footer Buttons */}
                <View style={{ paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' }}>
                    <TouchableOpacity
                        style={{ paddingVertical: 16, width: '100%', alignItems: 'center', marginBottom: 12 }}
                        onPress={() => setDetectedDNI(null)} // basically rescan
                    >
                        <Text style={{ fontSize: 16, color: '#000', fontWeight: '500' }}>Cancel Scan</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            backgroundColor: '#f4f4f5',
                            paddingHorizontal: 24,
                            paddingVertical: 14,
                            borderRadius: 24
                        }}
                        onPress={onAcceptDni}
                    >
                        <MaterialIcons name="lock" size={14} color="#71717a" />
                        <Text style={{ fontSize: 12, color: '#71717a', fontWeight: '600', letterSpacing: 0.5 }}>
                            CONFIRM & CONTINUE
                        </Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#141414" />

            <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                    <MaterialIcons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>

                <View style={styles.titlePill}>
                    <Text style={styles.titlePillText}>AEROPASS ID CHECK</Text>
                </View>

                <View style={[styles.iconButton, { opacity: 0 }]} />
            </View>

            <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>Scan Document</Text>
                <Text style={styles.heroSubtitle}>
                    Align the back of your ID card. Ensure the{'\n'}PDF417 or QR code is visible.
                </Text>
            </View>

            <View style={styles.viewfinderWrapper}>
                <View style={styles.viewfinder}>

                    {capturedUri ? (
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
                                            Neural processing takes a moment
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </>
                    ) : (
                        <Camera
                            ref={cameraRef}
                            style={StyleSheet.absoluteFillObject}
                            device={device}
                            isActive={state !== 'captured'}
                            photo={true}
                        />
                    )}

                    <View style={[styles.corner, styles.cornerTL, state === 'detected' && { borderColor: '#22c55e' }]} />
                    <View style={[styles.corner, styles.cornerTR, state === 'detected' && { borderColor: '#22c55e' }]} />
                    <View style={[styles.corner, styles.cornerBL, state === 'detected' && { borderColor: '#22c55e' }]} />
                    <View style={[styles.corner, styles.cornerBR, state === 'detected' && { borderColor: '#22c55e' }]} />
                </View>

                <View style={styles.statusPill}>
                    <View style={[styles.statusDot, { backgroundColor: state === 'detected' ? '#22c55e' : (state === 'captured' ? '#3b82f6' : '#eab308') }]} />
                    <Text style={styles.statusText}>
                        {state === 'detected' ? 'Ready to capture' : (state === 'captured' ? 'Photo captured!' : 'Looking for document...')}
                    </Text>
                </View>
            </View>

            <View style={styles.bottomBar}>
                <View style={styles.bottomActions}>
                    <TouchableOpacity style={styles.bottomActionBtn}>
                        <View style={styles.bottomActionIcon}>
                            <MaterialIcons name="photo" size={24} color="#ffffff" />
                        </View>
                        <Text style={styles.bottomActionLabel}>GALLERY</Text>
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

                <Text style={styles.poweredBy}>Powered by AeroPass Secure OCR</Text>
            </View>
        </SafeAreaView>
    );
}
