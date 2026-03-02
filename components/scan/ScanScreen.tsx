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
        const fullName = [detectedDNI.surname1, detectedDNI.surname2].filter(Boolean).join(' ');
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
                <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

                {/* Header */}
                <View style={[styles.topBar, { paddingTop: 16, backgroundColor: '#f8f9fa' }]}>
                    <TouchableOpacity onPress={() => setDetectedDNI(null)} style={{ padding: 8 }}>
                        <MaterialIcons name="arrow-back" size={26} color="#000000" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#111', letterSpacing: 1.2 }}>
                        AEROPASS ID CHECK
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Status pill */}
                <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#dcfce7', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}>
                        <MaterialIcons name="check-circle" size={15} color="#16a34a" />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#16a34a', letterSpacing: 0.5 }}>IDENTIDAD VERIFICADA</Text>
                    </View>
                </View>

                {/* DNI Card */}
                <View style={{
                    marginHorizontal: 20,
                    backgroundColor: '#ffffff',
                    borderRadius: 20,
                    padding: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 16,
                    elevation: 4,
                }}>
                    {/* Card header stripe */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fbbf24' }} />
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
                        <Text style={{ marginLeft: 8, fontSize: 11, fontWeight: '700', color: '#9ca3af', letterSpacing: 1 }}>DOCUMENTO NACIONAL DE IDENTIDAD</Text>
                    </View>

                    {/* Main content row: photo + fields */}
                    <View style={{ flexDirection: 'row', gap: 16 }}>

                        {/* Face photo */}
                        <View style={{
                            width: 100,
                            height: 130,
                            borderRadius: 10,
                            overflow: 'hidden',
                            backgroundColor: '#f3f4f6',
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                        }}>
                            {detectedDNI.photo ? (
                                <Image
                                    source={{ uri: detectedDNI.photo }}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                    <MaterialIcons name="person" size={48} color="#d1d5db" />
                                </View>
                            )}
                        </View>

                        {/* Text fields */}
                        <View style={{ flex: 1, justifyContent: 'space-between' }}>
                            <Field label="APELLIDOS" value={fullName || '—'} />
                            <Field label="NOMBRE" value={detectedDNI.name || '—'} />
                            <Field label="FECHA DE NACIMIENTO" value={detectedDNI.dob || '—'} />
                        </View>
                    </View>

                    {/* DNI number banner */}
                    <View style={{ marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 1, marginBottom: 4 }}>NÚMERO DE DOCUMENTO</Text>
                        <Text style={{ fontSize: 28, fontWeight: '900', color: '#111', letterSpacing: 3 }}>
                            {detectedDNI.number}
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity
                        style={{ backgroundColor: '#111', paddingVertical: 16, borderRadius: 16, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                        onPress={onAcceptDni}
                    >
                        <MaterialIcons name="check" size={18} color="#ffffff" />
                        <Text style={{ fontSize: 16, color: '#ffffff', fontWeight: '700' }}>Confirmar y continuar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setDetectedDNI(null)}>
                        <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '500' }}>Cancelar y volver a escanear</Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
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
