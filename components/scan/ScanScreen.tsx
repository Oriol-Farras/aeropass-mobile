import { MaterialIcons } from '@expo/vector-icons';
import { CameraType, CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { styles } from '@/components/scan/ScanScreen.styles';

export default function ScanScreen() {
    const router = useRouter();
    const [flashOn, setFlashOn] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);

    // ── Pantalla de carga de permisos ──
    if (!permission) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#141414" />
                <View style={permStyles.center}>
                    <ActivityIndicator size="large" color="#ffffff" />
                </View>
            </SafeAreaView>
        );
    }

    // ── Pantalla de solicitud de permisos ──
    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#141414" />
                <View style={permStyles.center}>
                    <MaterialIcons name="camera-alt" size={56} color="rgba(255,255,255,0.4)" />
                    <Text style={permStyles.title}>Camera Access Required</Text>
                    <Text style={permStyles.subtitle}>
                        AeroPass needs camera access to scan your ID document.
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

    // ── Pantalla principal con cámara ──
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#141414" />

            {/* ── TOP BAR ── */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                    <MaterialIcons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>

                <View style={styles.titlePill}>
                    <Text style={styles.titlePillText}>AEROPASS ID CHECK</Text>
                </View>

                <TouchableOpacity style={styles.iconButton} onPress={() => setFlashOn(v => !v)}>
                    <MaterialIcons
                        name={flashOn ? 'flash-on' : 'flash-off'}
                        size={20}
                        color="#ffffff"
                    />
                </TouchableOpacity>
            </View>

            {/* ── HERO TEXT ── */}
            <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>Scan Document</Text>
                <Text style={styles.heroSubtitle}>
                    Align the back of your ID card. Ensure the{'\n'}MRZ code (the {'<<<'} lines) is visible.
                </Text>
            </View>

            {/* ── VIEWFINDER con cámara real ── */}
            <View style={styles.viewfinderWrapper}>
                <View style={styles.viewfinder}>

                    {/* Cámara real */}
                    <CameraView
                        ref={cameraRef}
                        style={StyleSheet.absoluteFillObject}
                        facing={'back' as CameraType}
                        flash={flashOn ? 'on' as FlashMode : 'off' as FlashMode}
                    // En el futuro: onCameraReady, onBarcodeScanned, etc.
                    />

                    {/* Marco de encuadre encima de la cámara */}
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                </View>

                {/* Status pill */}
                <View style={styles.statusPill}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Looking for document...</Text>
                </View>
            </View>

            {/* ── BOTTOM BAR ── */}
            <View style={styles.bottomBar}>
                <View style={styles.bottomActions}>
                    {/* Gallery */}
                    <TouchableOpacity style={styles.bottomActionBtn}>
                        <View style={styles.bottomActionIcon}>
                            <MaterialIcons name="photo" size={24} color="#ffffff" />
                        </View>
                        <Text style={styles.bottomActionLabel}>GALLERY</Text>
                    </TouchableOpacity>

                    {/* Capture */}
                    <TouchableOpacity
                        style={styles.captureButton}
                        activeOpacity={0.85}
                        onPress={async () => {
                            // TODO: capturar foto y procesar MRZ
                            if (cameraRef.current) {
                                const photo = await cameraRef.current.takePictureAsync();
                                console.log('Photo captured:', photo?.uri);
                            }
                        }}
                    >
                        <View style={styles.captureInner} />
                    </TouchableOpacity>

                    {/* Manual */}
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

// Estilos solo para las pantallas de permisos
const permStyles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        gap: 16,
    },
    title: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 8,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    btn: {
        marginTop: 8,
        backgroundColor: '#ffffff',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 14,
        width: '100%',
        alignItems: 'center',
    },
    btnText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        marginTop: 4,
    },
});
