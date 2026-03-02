import { getInfoAsync } from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Alert, Animated } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';

import { useCardDetection } from '@/components/scan/useCardDetection';

export function useScanScreen() {
    const router = useRouter();
    const { hasPermission, requestPermission } = useCameraPermission();
    const cameraRef = useRef<Camera>(null);
    const [isProcessingOcr, setIsProcessingOcr] = React.useState(false);
    const [compressedUri, setCompressedUri] = React.useState<string | null>(null);
    const [compressedKB, setCompressedKB] = React.useState<number>(-1);

    // OCR Results
    const [detectedDNI, setDetectedDNI] = React.useState<{
        number: string;
        name: string | null;
        surname1: string | null;
        surname2: string | null;
        dob: string | null;
        photo: string | null;
    } | null>(null);

    const isOcrActive = React.useRef(false);

    const progressAnim = useRef(new Animated.Value(0)).current;
    const [loadingText, setLoadingText] = React.useState('Preparing image...');

    React.useEffect(() => {
        if (isProcessingOcr) {
            progressAnim.setValue(0);
            setLoadingText('Compressing and optimizing...');

            Animated.timing(progressAnim, {
                toValue: 90,
                duration: 12000,
                useNativeDriver: false,
            }).start();

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
            progressAnim.setValue(0);
        }
    }, [isProcessingOcr, progressAnim]);

    const device = useCameraDevice('back');

    const { state, capturedUri, takePicture, reset } = useCardDetection({
        cameraRef,
    });

    const BACKEND_URL = 'https://oriolfarras-aeropass-ocr-backend.hf.space';

    React.useEffect(() => {
        const pingServer = async () => {
            if (isOcrActive.current) return;
            try {
                await fetch(`${BACKEND_URL}/`, {
                    method: 'GET',
                    headers: { accept: 'application/json' },
                });
            } catch (e) {
            }
        };

        pingServer();
        const keepAlive = setInterval(pingServer, 25_000);
        return () => clearInterval(keepAlive);
    }, []);

    React.useEffect(() => {
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
                try {
                    const compressed = await manipulateAsync(
                        capturedUri,
                        [
                            { rotate: 0 },
                            { resize: { width: 1080 } }
                        ],
                        { compress: 0.7, format: SaveFormat.JPEG, base64: false }
                    );
                    setCompressedUri(compressed.uri);

                    const fileInfo = await getInfoAsync(compressed.uri);
                    const sizeKB = fileInfo.exists ? Math.round((fileInfo as any).size / 1024) : -1;
                    setCompressedKB(sizeKB);

                    // ── Local OCR via Google ML Kit (on-device, no backend) ──
                    const recognized = await TextRecognition.recognize(compressed.uri);

                    // Split full text into lines for field parsing
                    const lines = recognized.text
                        .split('\n')
                        .map((l: string) => l.trim())
                        .filter((l: string) => l.length > 0);

                    const upper = lines.map((l: string) => l.toUpperCase());

                    const LABEL_WORDS = [
                        'APELLIDO', 'COGNOM', 'NOMBRE', 'NOM', 'SEXO', 'SEXE',
                        'NACIONAL', 'FECHA', 'NACIMIENTO', 'NAIXEMENT', 'REINO',
                        'ESPAÑA', 'IDENTIDAD', 'DOCUMENTO', 'NUMERO', 'VALIDEZ',
                        'SOPORTE', 'EMISION', 'NATIONAL', 'DOCUMENT',
                    ];
                    const isLabel = (s: string) =>
                        LABEL_WORDS.some(kw => s.includes(kw)) || s.includes('/') || s.length < 2;

                    const nextValues = (labelKw: string, count = 1): string[] => {
                        const idx = upper.findIndex((l: string) => l.includes(labelKw));
                        if (idx < 0) return [];
                        const results: string[] = [];
                        for (let j = idx + 1; j < upper.length && results.length < count; j++) {
                            if (isLabel(upper[j])) {
                                if (results.length > 0) break;
                                continue;
                            }
                            results.push(lines[j].trim());
                        }
                        return results;
                    };

                    const toTitleCase = (s: string) =>
                        s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

                    // DNI number: strip non-alphanumeric, search for 8 digits + letter
                    const fullCompact = upper.join('').replace(/[^A-Z0-9]/g, '');
                    const dniMatch = fullCompact.match(/(\d{8}[A-Z])/);
                    const dniNumber = dniMatch ? dniMatch[1] : '—';

                    // DOB: find line nearest to NACIMIENTO / NAIXEMENT label
                    // (avoids picking up the EMISION date which appears first)
                    const dobIdx = upper.findIndex(l => l.includes('NACIM') || l.includes('NAIX'));
                    const DATE_REGEX = /(\d{2})[\s\/\-](\d{2})[\s\/\-](\d{4})/;
                    let dob = '—';
                    if (dobIdx >= 0) {
                        // Check the label line itself and the next 3 lines for a date
                        for (let k = dobIdx; k <= Math.min(dobIdx + 3, lines.length - 1); k++) {
                            const m = lines[k].match(DATE_REGEX);
                            if (m) { dob = `${m[1]}/${m[2]}/${m[3]}`; break; }
                        }
                    }
                    // Fallback: last date found in the text (safer than first, avoids EMISION)
                    if (dob === '—') {
                        const allDates = [...lines.join(' ').matchAll(/(\d{2})[\s\/\-](\d{2})[\s\/\-](\d{4})/g)];
                        if (allDates.length > 0) {
                            const last = allDates[allDates.length - 1];
                            dob = `${last[1]}/${last[2]}/${last[3]}`;
                        }
                    }

                    // Name & surnames from bilingual labels
                    const surnameLines = nextValues('APELLIDO', 2);
                    const nameLines = nextValues('NOMBRE', 1);

                    setDetectedDNI({
                        number: dniNumber,
                        name: nameLines[0] ? toTitleCase(nameLines[0]) : '—',
                        surname1: surnameLines[0] ? toTitleCase(surnameLines[0]) : '—',
                        surname2: surnameLines[1] ? toTitleCase(surnameLines[1]) : null,
                        dob,
                        photo: null,  // foto: requiere backend
                    });
                } catch (error: any) {
                    if (error?.name === 'AbortError') {
                        Alert.alert('Tiempo agotado', 'El servidor tardó demasiado. Inténtalo de nuevo.');
                    } else {
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

    const onAcceptDni = () => {
        // En el futuro, aquí enrutaremos a la pantalla final. Por ahora, limpiamos y reseteamos.
        setDetectedDNI(null);
        reset();
        // router.push('/home'); // Por ejemplo
    };

    return {
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
    };
}
