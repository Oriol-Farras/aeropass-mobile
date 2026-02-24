import { getInfoAsync } from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Alert, Animated } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

import { useCardDetection } from '@/components/scan/useCardDetection';

export function useScanScreen() {
    const router = useRouter();
    const { hasPermission, requestPermission } = useCameraPermission();
    const cameraRef = useRef<Camera>(null);
    const [isProcessingOcr, setIsProcessingOcr] = React.useState(false);
    const [compressedUri, setCompressedUri] = React.useState<string | null>(null);
    const [compressedKB, setCompressedKB] = React.useState<number>(-1);
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

                    const formData = new FormData();
                    formData.append('file', {
                        uri: compressed.uri,
                        name: 'DNI.jpg',
                        type: 'image/jpeg',
                    } as any);

                    const response = await fetch(
                        `${BACKEND_URL}/process-dni`,
                        {
                            method: 'POST',
                            headers: { accept: 'application/json' },
                            body: formData,
                            signal: controller.signal,
                        }
                    );

                    const data = await response.json();

                    if (data.is_dni) {
                        Alert.alert('DNI Detectado', `Nº DNI: ${data.dni_number}`);
                    } else {
                        Alert.alert('Error', data.message || 'No parece ser un DNI válido');
                        reset();
                    }
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
    };
}
