import { MaterialIcons } from '@expo/vector-icons';
import { cacheDirectory, EncodingType, getInfoAsync, writeAsStringAsync } from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
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
    const [isProcessingOcr, setIsProcessingOcr] = React.useState(false);
    const [compressedUri, setCompressedUri] = React.useState<string | null>(null);
    const [compressedKB, setCompressedKB] = React.useState<number>(-1);
    const isOcrActive = React.useRef(false); // guard: warmup never overlaps real OCR

    // Animated Loading UI State
    const progressAnim = useRef(new Animated.Value(0)).current;
    const [loadingText, setLoadingText] = React.useState('Preparing image...');

    // ── Fake Loading Progress Effect ──────────────────────────────────────────
    React.useEffect(() => {
        if (isProcessingOcr) {
            progressAnim.setValue(0);
            setLoadingText('Compressing and optimizing...');

            // Animate up to 90% over 12 seconds
            Animated.timing(progressAnim, {
                toValue: 90,
                duration: 12000,
                useNativeDriver: false,
            }).start();

            // Simulate steps to keep the user engaged
            const t1 = setTimeout(() => setLoadingText('Uploading encrypted ID...'), 2000);
            const t2 = setTimeout(() => setLoadingText('Analyzing text with EasyOCR...'), 5000);
            const t3 = setTimeout(() => setLoadingText('Validating security features...'), 9000);

            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
                progressAnim.stopAnimation();
            };
        } else {
            // Reset when done
            progressAnim.setValue(0);
        }
    }, [isProcessingOcr, progressAnim]);

    // Obtener la cámara trasera (wide/standard)
    const device = useCameraDevice('back');

    const { state, capturedUri, takePicture, reset } = useCardDetection({
        cameraRef,
    });

    // ── Pre-warm the HF Space on screen mount ────────────
    // Since we added a `lifespan` event in the FastAPI backend, the server natively
    // warms up the EasyOCR pipeline on startup. We only need to send a lightweight
    // GET request to wake the Hugging Face Space from sleep.
    // The keep-alive fires every 25s but ONLY if no real OCR is running.
    const BACKEND_URL = 'https://oriolfarras-aeropass-ocr-backend.hf.space';

    React.useEffect(() => {
        const pingServer = async () => {
            if (isOcrActive.current) return; // don't compete with a live scan
            try {
                // Just a lightweight GET ping to wake up the server.
                await fetch(`${BACKEND_URL}/`, {
                    method: 'GET',
                    headers: { accept: 'application/json' },
                });
            } catch (e) {
                // Ignore errors
            }
        };

        pingServer();
        const keepAlive = setInterval(pingServer, 25_000);
        return () => clearInterval(keepAlive);
    }, []);


    React.useEffect(() => {
        // Clear compressed UI state if user resets scan
        if (state === 'searching' || state === 'detected') {
            setCompressedUri(null);
            setCompressedKB(-1);
        }
    }, [state]);

    React.useEffect(() => {
        if (state === 'captured' && capturedUri) {
            const processOcr = async () => {
                setIsProcessingOcr(true);
                isOcrActive.current = true;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30_000);

                // ── Timing ───────────────────────────────────────────────────────────
                const t0 = Date.now();
                let tCompressed = 0, tRequestSent = 0, tResponseReceived = 0, tJsonParsed = 0;
                let sizeKB = -1; // hoisted so catch block can read it too
                const ms = (a: number, b: number) => `${((b - a) / 1000).toFixed(2)}s`;
                const printTable = (status: string, sizeKB = -1) => {
                    const sizeLabel = sizeKB >= 0 ? `${sizeKB} KB` : '? KB';
                    console.log('\n╔═══════════════════════════════════════════════╗');
                    console.log('║           📊 OCR TIMING BREAKDOWN             ║');
                    console.log('╠═══════════════════════════════════════╤═══════╣');
                    console.log(`║  📸 Photo captured (t=0)              │  0.00s ║`);
                    console.log(`║  🗜  Compression (${sizeLabel.padEnd(7)})          │ ${ms(t0, tCompressed).padStart(6)} ║`);
                    console.log(`║  📤 Request sent                      │ ${ms(t0, tRequestSent).padStart(6)} ║`);
                    console.log(`║  📥 Response received                 │ ${ms(t0, tResponseReceived).padStart(6)} ║`);
                    console.log(`║  🔍 JSON parsed (total)               │ ${ms(t0, tJsonParsed).padStart(6)} ║`);
                    console.log('╠═══════════════════════════════════════╪═══════╣');
                    console.log(`║  📡 Net transfer (sent→received)      │ ${ms(tRequestSent, tResponseReceived).padStart(6)} ║`);
                    console.log('╠═══════════════════════════════════════╪═══════╣');
                    console.log(`║  ✅ Status: ${status.padEnd(28)}║`);
                    console.log('╚═══════════════════════════════════════╧═══════╝\n');
                };

                try {
                    // 1080px es el "punto dulce" para el OCR, manteniendo el tamaño
                    // a ~100-200KB pero sin que EasyOCR pierda legibilidad de la letra
                    // pequeña del DNI. Un compress de 0.7 evita "ruido JPEG".
                    const compressed = await manipulateAsync(
                        capturedUri,
                        [
                            { rotate: 0 },
                            { resize: { width: 1080 } }
                        ],
                        { compress: 0.7, format: SaveFormat.JPEG, base64: false }
                    );
                    tCompressed = Date.now();
                    setCompressedUri(compressed.uri); // show compressed image in UI

                    // ── Measure actual file size for diagnostics ──────────────────────
                    const fileInfo = await getInfoAsync(compressed.uri);
                    sizeKB = fileInfo.exists ? Math.round((fileInfo as any).size / 1024) : -1;
                    setCompressedKB(sizeKB);

                    const formData = new FormData();
                    formData.append('file', {
                        uri: compressed.uri,
                        name: 'DNI.jpg',
                        type: 'image/jpeg',
                    } as any);

                    // NOTA: NO ponemos 'Content-Type' a mano; React Native lo pone
                    // correctamente con el boundary de multipart, lo que evita
                    // errores de parsing en el servidor.
                    tRequestSent = Date.now();
                    const response = await fetch(
                        `${BACKEND_URL}/process-dni`,
                        {
                            method: 'POST',
                            headers: { accept: 'application/json' },
                            body: formData,
                            signal: controller.signal,
                        }
                    );
                    tResponseReceived = Date.now();

                    const data = await response.json();
                    tJsonParsed = Date.now();

                    printTable(data.is_dni ? `DNI detectado: ${data.dni_number}` : 'No es un DNI válido', sizeKB);
                    console.log('\n[OCR JSON Response]:', JSON.stringify(data, null, 2), '\n');

                    if (data.is_dni) {
                        Alert.alert('DNI Detectado', `Nº DNI: ${data.dni_number}`);
                    } else {
                        Alert.alert('Error', data.message || 'No parece ser un DNI válido');
                        reset();
                    }
                } catch (error: any) {
                    tResponseReceived = tResponseReceived || Date.now();
                    tJsonParsed = tJsonParsed || Date.now();
                    printTable(error?.name === 'AbortError' ? 'TIMEOUT (30s)' : `Error: ${error?.message}`, sizeKB);

                    if (error?.name === 'AbortError') {
                        Alert.alert('Tiempo agotado', 'El servidor tardó demasiado. Inténtalo de nuevo.');
                    } else {
                        console.error('[OCR] Error calling backend:', error);
                        Alert.alert('Error de conexión', 'No se ha podido conectar con el servidor OCR.');
                    }
                    reset();
                } finally {
                    clearTimeout(timeoutId);
                    isOcrActive.current = false;
                    setIsProcessingOcr(false);
                }
            };

            processOcr();
        }
    }, [state, capturedUri]);

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
                        <>
                            {/* Mostrar imagen comprimida cuando esté lista, si no la original */}
                            <Image
                                source={{ uri: compressedUri ?? capturedUri }}
                                style={StyleSheet.absoluteFillObject}
                            />
                            {/* Badge con tamaño del archivo comprimido (ahora es un botón debug) */}
                            {compressedUri && compressedKB > 0 && (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={async () => {
                                        try {
                                            const { readAsStringAsync, EncodingType } = require('expo-file-system');
                                            const b64 = await readAsStringAsync(compressedUri, { encoding: EncodingType.Base64 });
                                            console.log('\n--- CÓPIATE ESTO Y PÉGALO EN UNA WEB B64 A IMAGEN ---');
                                            console.log(`data:image/jpeg;base64,${b64}`);
                                            console.log('-----------------------------------------------------\n');
                                            Alert.alert('Imagen exportada', 'La imagen original Base64 se ha impreso en la consola de tu ordenador.');
                                        } catch (e) {
                                            console.warn('Error extracting base64', e);
                                        }
                                    }}
                                    style={{
                                        position: 'absolute', top: 10, right: 10,
                                        backgroundColor: 'rgba(0,0,0,0.65)',
                                        borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
                                        flexDirection: 'row', alignItems: 'center', gap: 4,
                                        zIndex: 100 // ensure it's clickable above the image
                                    }}
                                >
                                    <MaterialIcons name="compress" size={12} color="#22c55e" />
                                    <Text style={{ color: '#22c55e', fontSize: 11, fontWeight: '700' }}>
                                        {compressedKB} KB
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {isProcessingOcr && (
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', borderRadius: 20, padding: 40 }]}>
                                    <View style={{ width: '100%', alignItems: 'center' }}>
                                        <ActivityIndicator size="large" color="#ffffff" style={{ marginBottom: 20 }} />

                                        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 20, textAlign: 'center' }}>
                                            {loadingText}
                                        </Text>

                                        {/* Progress Bar Container */}
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
