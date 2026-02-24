import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera } from 'react-native-vision-camera';

export type DetectionState = 'searching' | 'detected' | 'captured';

interface UseCardDetectionOptions {
    cameraRef: React.RefObject<Camera | null>;
}

interface UseCardDetectionResult {
    state: DetectionState;
    capturedUri: string | null;
    takePicture: () => Promise<void>;
    reset: () => void;
}

export function useCardDetection({ cameraRef }: UseCardDetectionOptions): UseCardDetectionResult {
    const [state, setState] = useState<DetectionState>('searching');
    const [capturedUri, setCapturedUri] = useState<string | null>(null);

    const isAnalyzing = useRef(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const consecutiveHits = useRef(0);

    /**
     * Heurística en JS para detectar tarjeta en silencio sin plugins extra:
     * Toma foto silenciosa de ínfima resolución, analiza contraste/patrón.
     */
    const analyzeFrame = useCallback(async (): Promise<boolean> => {
        if (!cameraRef.current) return false;

        try {
            const photo = await cameraRef.current.takePhoto({
                flash: 'off',
                enableShutterSound: false,
            });

            if (!photo?.path) return false;
            const uri = `file://${photo.path}`;

            const thumb = await manipulateAsync(
                uri,
                [{ resize: { width: 100 } }],
                { compress: 0.1, format: SaveFormat.JPEG, base64: true }
            );

            if (!thumb.base64) return false;

            const mid = Math.floor(thumb.base64.length / 2);
            const sample = thumb.base64.slice(mid, mid + 500);

            let sum = 0; let sumSq = 0;
            for (let i = 0; i < sample.length; i++) {
                const v = sample.charCodeAt(i);
                sum += v; sumSq += v * v;
            }
            const mean = sum / sample.length;
            const variance = sumSq / sample.length - mean * mean;

            return variance >= 460;

        } catch (e) {
            console.warn('[CardDetection] Error detectando frame:', e);
            return false;
        }
    }, [cameraRef]);

    useEffect(() => {
        if ((state as string) === 'captured') return;

        intervalRef.current = setInterval(async () => {
            if (isAnalyzing.current || (state as string) === 'captured') return;
            isAnalyzing.current = true;

            const detectedEdges = await analyzeFrame();

            if (detectedEdges) {
                consecutiveHits.current += 1;
                if (consecutiveHits.current >= 1) {
                    setState('detected');
                }
            } else {
                consecutiveHits.current = 0;
                setState(prev => prev === 'detected' ? 'searching' : prev);
            }

            isAnalyzing.current = false;
        }, 250);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [state, analyzeFrame]);

    const takePicture = useCallback(async () => {
        if (!cameraRef.current || state !== 'detected') return;
        try {
            const photo = await cameraRef.current.takePhoto({
                flash: 'off',
                enableShutterSound: false,
            });
            if (photo?.path) {
                setCapturedUri(`file://${photo.path}`);
                setState('captured');
            }
        } catch (e) {
            console.warn('[CardDetection] Error taking final picture:', e);
        }
    }, [cameraRef, state]);

    const reset = useCallback(() => {
        setState('searching');
        setCapturedUri(null);
        consecutiveHits.current = 0;
    }, []);

    return { state, capturedUri, takePicture, reset };
}
