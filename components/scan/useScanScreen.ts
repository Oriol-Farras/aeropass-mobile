import { getInfoAsync } from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Alert, Animated } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import FaceDetection from '@react-native-ml-kit/face-detection';
import ImageEditor from '@react-native-community/image-editor';

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

                    // ── Parallel: text OCR + face detection at the same time ──
                    const [recognized, faces] = await Promise.all([
                        TextRecognition.recognize(compressed.uri),
                        FaceDetection.detect(compressed.uri, {
                            performanceMode: 'fast',
                            landmarkMode: 'none',
                            classificationMode: 'none',
                        }),
                    ]);

                    // Split full text into lines for field parsing
                    const lines = recognized.text
                        .split('\n')
                        .map((l: string) => l.trim())
                        .filter((l: string) => l.length > 0);

                    const upper = lines.map((l: string) => l.toUpperCase());

                    // ── Validación: ¿es un DNI? ──────────────────────────────
                    const DNI_KEYWORDS = ['ESPAÑA', 'IDENTIDAD', 'APELLIDO', 'NOMBRE', 'DNI'];
                    const hasKeyword = DNI_KEYWORDS.some(kw => upper.some(l => l.includes(kw)));
                    const hasDniNumber = /\d{8}[A-Z]/.test(upper.join('').replace(/[^A-Z0-9]/g, ''));

                    if (!hasKeyword && !hasDniNumber) {
                        Alert.alert('Documento no reconocido', 'No parece ser un DNI válido. Asegúrate de enfocar el anverso del documento.');
                        reset();
                        return;
                    }

                    // ── Face crop ────────────────────────────────────────────
                    // Take the largest face detected, add 15% padding, crop.
                    let photoUri: string | null = null;
                    if (faces.length > 0) {
                        // Face framework returns: { frame: { width, height, top, left }, ... }
                        const largest = faces.reduce((a, b) =>
                            (a.frame.width * a.frame.height) >=
                                (b.frame.width * b.frame.height) ? a : b
                        );

                        const fw = largest.frame.width;
                        const fh = largest.frame.height;
                        const fx = largest.frame.left;
                        const fy = largest.frame.top;

                        // Face center
                        const cx = fx + fw / 2;
                        const cy = fy + fh / 2;

                        // DNI passport photo ratio: slightly portrait (~4:5)
                        const cropW = Math.round(fw * 1.4);
                        const cropH = Math.round(cropW * 1.15);

                        // Center the crop box: face center at ~58% from top (more space above for head)
                        const cropX = Math.max(0, Math.round(cx - cropW / 2));
                        const cropY = Math.max(0, Math.round(cy - cropH * 0.50));

                        const cropData = {
                            offset: { x: cropX, y: cropY },
                            size: { width: cropW, height: cropH },
                        };

                        try {
                            const result = await ImageEditor.cropImage(compressed.uri, cropData);
                            photoUri = typeof result === 'string' ? result : (result as any).uri;
                        } catch {
                            photoUri = null;
                        }
                    }

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

                    // Name & surnames — try APELLIDO, fallback to COGNOM
                    let surnameLines = nextValues('APELLIDO', 2);
                    if (surnameLines.length === 0) surnameLines = nextValues('COGNOM', 2);

                    // If both surnames came on a single line (e.g. "García López"), split them
                    if (surnameLines.length === 1) {
                        const parts = surnameLines[0].trim().split(/\s+/);
                        if (parts.length >= 2) surnameLines = [parts[0], parts.slice(1).join(' ')];
                    }

                    const nameLines = nextValues('NOMBRE', 1);
                    // Fallback NOM (Catalan label)
                    const resolvedName = nameLines[0] ?? nextValues('NOM', 1)[0] ?? null;

                    setDetectedDNI({
                        number: dniNumber,
                        name: resolvedName ? toTitleCase(resolvedName) : '—',
                        surname1: surnameLines[0] ? toTitleCase(surnameLines[0]) : '—',
                        surname2: surnameLines[1] ? toTitleCase(surnameLines[1]) : null,
                        dob,
                        photo: photoUri,
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
