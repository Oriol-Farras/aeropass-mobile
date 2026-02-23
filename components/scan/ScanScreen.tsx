import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import {
    ActivityIndicator,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

import { styles } from '@/components/scan/ScanScreen.styles';
import { useCardDetection } from '@/components/scan/useCardDetection';

export default function ScanScreen() {
    const router = useRouter();
    const { hasPermission, requestPermission } = useCameraPermission();
    const cameraRef = useRef<Camera>(null);

    // Obtener la cámara trasera (wide/standard)
    const device = useCameraDevice('back');

    const { state, capturedUri, takePicture, reset } = useCardDetection({
        cameraRef,
    });

    // ── Pantalla de solicitud de permisos ──
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

    // ── Pantalla si no hay dispositivo detectado (Ej. Emuladores o cargando instantes) ──
    if (device == null) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={permStyles.center}>
                    <ActivityIndicator size="large" color="#ffffff" />
                </View>
            </SafeAreaView>
        );
    }

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

                {/* El toggle manual de flash ahora es opcional.
                    Por simplificar la migration V4, lo ocultamos 
                    ya que "takePhoto" en silencio prefiere flash off */}
                <View style={[styles.iconButton, { opacity: 0 }]} />
            </View>

            {/* ── HERO TEXT ── */}
            <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>Scan Document</Text>
                <Text style={styles.heroSubtitle}>
                    Align the back of your ID card. Ensure the{'\n'}PDF417 or QR code is visible.
                </Text>
            </View>

            {/* ── VIEWFINDER con react-native-vision-camera ── */}
            <View style={styles.viewfinderWrapper}>
                <View style={styles.viewfinder}>

                    {/* Cámara real silenciosa a 60fps */}
                    {capturedUri ? (
                        <Image source={{ uri: capturedUri }} style={StyleSheet.absoluteFillObject} />
                    ) : (
                        <Camera
                            ref={cameraRef}
                            style={StyleSheet.absoluteFillObject}
                            device={device}
                            isActive={state !== 'captured'}
                            photo={true} // Necesario para takePhoto
                        />
                    )}

                    {/* Marco de encuadre encima de la cámara */}
                    <View style={[styles.corner, styles.cornerTL, state === 'detected' && { borderColor: '#22c55e' }]} />
                    <View style={[styles.corner, styles.cornerTR, state === 'detected' && { borderColor: '#22c55e' }]} />
                    <View style={[styles.corner, styles.cornerBL, state === 'detected' && { borderColor: '#22c55e' }]} />
                    <View style={[styles.corner, styles.cornerBR, state === 'detected' && { borderColor: '#22c55e' }]} />
                </View>

                {/* Status pill */}
                <View style={styles.statusPill}>
                    <View style={[styles.statusDot, { backgroundColor: state === 'detected' ? '#22c55e' : (state === 'captured' ? '#3b82f6' : '#eab308') }]} />
                    <Text style={styles.statusText}>
                        {state === 'detected' ? 'Ready to capture' : (state === 'captured' ? 'Photo captured!' : 'Looking for document...')}
                    </Text>
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

                    {/* Capture. Se ilumina en verde cuando la tarjeta es enmarcada */}
                    <TouchableOpacity
                        style={[styles.captureButton, state === 'detected' && { borderColor: '#22c55e' }]}
                        activeOpacity={0.85}
                        onPress={async () => {
                            if (state === 'captured') {
                                reset();
                            } else {
                                await takePicture();
                            }
                        }}
                    >
                        {state === 'captured' ? (
                            <MaterialIcons name="refresh" size={32} color="#000000" />
                        ) : (
                            <View style={[styles.captureInner, state === 'detected' && { backgroundColor: '#22c55e' }]} />
                        )}
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
