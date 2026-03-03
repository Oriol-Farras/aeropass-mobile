import { useCallback, useEffect, useRef, useState } from 'react';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { Camera } from 'react-native-vision-camera';

export type DetectionState = 'searching' | 'too_far' | 'detected' | 'captured';

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

    const analyzeFrame = useCallback(async (): Promise<'none' | 'too_far' | 'detected'> => {
        if (!cameraRef.current) return 'none';

        try {
            const photo = await cameraRef.current.takePhoto({
                flash: 'off',
                enableShutterSound: false,
            });

            if (!photo?.path) return 'none';
            const uri = `file://${photo.path}`;

            const recognized = await TextRecognition.recognize(uri);

            const DNI_KEYWORDS = ['ESPAÑA', 'IDENTIDAD', 'APELLIDO', 'NOMBRE', 'DNI', 'NACIONAL'];
            const text = recognized.text.toUpperCase();
            const hasKeyword = DNI_KEYWORDS.some(kw => text.includes(kw));

            if (!hasKeyword) return 'none';

            let maxBlockWidth = 0;
            for (const block of recognized.blocks) {
                if (block.frame && block.frame.width > maxBlockWidth) {
                    maxBlockWidth = block.frame.width;
                }
            }

            const textToImageRatio = maxBlockWidth / photo.width;

            if (textToImageRatio > 0.28) {
                return 'detected';
            } else {
                return 'too_far';
            }
        } catch (e) {
            console.warn('[CardDetection] Error detectando frame:', e);
            return 'none';
        }
    }, [cameraRef]);

    useEffect(() => {
        if ((state as string) === 'captured') return;

        intervalRef.current = setInterval(async () => {
            if (isAnalyzing.current || (state as string) === 'captured') return;
            isAnalyzing.current = true;

            const detectionResult = await analyzeFrame();

            if (detectionResult === 'detected') {
                consecutiveHits.current += 1;
                if (consecutiveHits.current >= 1) {
                    setState('detected');
                }
            } else if (detectionResult === 'too_far') {
                consecutiveHits.current = 0;
                setState('too_far');
            } else {
                consecutiveHits.current = 0;
                setState(prev => (prev === 'detected' || prev === 'too_far') ? 'searching' : prev);
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
