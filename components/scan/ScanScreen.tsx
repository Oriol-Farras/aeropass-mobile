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
        const fullName = `${detectedDNI.name ?? ''} ${detectedDNI.surname1 ?? ''} ${detectedDNI.surname2 ?? ''}`.trim();
        const mrzLine = `P<ESP${(detectedDNI.surname1 ?? '').toUpperCase()}<<${(detectedDNI.name ?? '').toUpperCase()}${'<'.repeat(20)}`.substring(0, 36);

        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

                {/* ── Header ── */}
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
                    <TouchableOpacity onPress={() => setDetectedDNI(null)} style={{ padding: 4 }}>
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
                            {/* DNI passport photo — portrait, bigger */}
                            <View style={{ width: 110, height: 145, borderRadius: 10, overflow: 'hidden', backgroundColor: '#e5e7eb' }}>
                                {detectedDNI.photo ? (
                                    <Image
                                        source={{ uri: detectedDNI.photo }}
                                        style={{ width: '100%', height: '100%', filter: [{ saturate: 0 }] } as any}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                        <MaterialIcons name="person" size={48} color="#9ca3af" />
                                    </View>
                                )}
                            </View>

                            {/* Campos: solo los extraídos */}
                            <View style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
                                <View>
                                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#9ca3af', letterSpacing: 1.2, marginBottom: 2 }}>APELLIDOS</Text>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#111' }}>
                                        {[detectedDNI.surname1, detectedDNI.surname2].filter(Boolean).join(' ') || '—'}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#9ca3af', letterSpacing: 1.2, marginBottom: 2 }}>NOMBRE</Text>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#111' }}>{detectedDNI.name || '—'}</Text>
                                </View>
                                <View>
                                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#9ca3af', letterSpacing: 1.2, marginBottom: 2 }}>FECHA DE NACIMIENTO</Text>
                                    <Text style={{ fontSize: 15, fontWeight: '500', color: '#111' }}>{detectedDNI.dob || '—'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* DNI number */}
                        <View style={{ marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 1, marginBottom: 4 }}>NÚMERO DE DOCUMENTO</Text>
                            <Text style={{ fontSize: 26, fontWeight: '900', color: '#111', letterSpacing: 3 }}>
                                {detectedDNI.number}
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
                        onPress={onAcceptDni}
                    >
                        <MaterialIcons name="check" size={18} color="#ffffff" />
                        <Text style={{ fontSize: 16, color: '#ffffff', fontWeight: '700' }}>Confirmar y continuar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => setDetectedDNI(null)}>
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

// Small helper: a label + value pair for the DNI card
function Field({ label, value }: { label: string; value: string }) {
    return (
        <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#9ca3af', letterSpacing: 0.8 }}>{label}</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111', marginTop: 2 }} numberOfLines={1}>{value}</Text>
        </View>
    );
}
