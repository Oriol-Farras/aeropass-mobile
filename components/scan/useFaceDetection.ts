import { useCallback, useEffect, useRef, useState } from 'react';
import FaceDetection from '@react-native-ml-kit/face-detection';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

export type FaceScanState = 'searching' | 'detected' | 'blink_prompt' | 'look_camera' | 'verified' | 'captured';

export function useFaceDetection() {
    const { hasPermission, requestPermission } = useCameraPermission();
    const cameraRef = useRef<Camera>(null);
    const device = useCameraDevice('front');

    const [state, setState] = useState<FaceScanState>('searching');
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState('Buscando rostro...');

    const isAnalyzing = useRef(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Blink tracking: need eyes-closed → eyes-open transition
    const eyesWereClosed = useRef(false);
    const isBlinkValidated = useRef(false);
    // How many consecutive frames the face has been well-centered
    const stableFrames = useRef(0);
    const STABLE_THRESHOLD = 3; // frames needed before prompting blink

    const analyzeFrame = useCallback(async () => {
        if (!cameraRef.current) return;

        try {
            const photo = await cameraRef.current.takePhoto({
                flash: 'off',
                enableShutterSound: false,
            });

            if (!photo?.path) return;
            const uri = `file://${photo.path}`;

            const faces = await FaceDetection.detect(uri, {
                performanceMode: 'fast',
                landmarkMode: 'none',
                classificationMode: 'all', // enables eye-open probability
                contourMode: 'none',
                minFaceSize: 0.15,
            });

            if (faces.length === 0) {
                stableFrames.current = 0;
                eyesWereClosed.current = false;
                isBlinkValidated.current = false;
                setState('searching');
                setStatusMessage('Buscando rostro...');
                return;
            }

            // Take the largest face
            const face = faces.reduce((a, b) =>
                (a.frame.width * a.frame.height) >= (b.frame.width * b.frame.height) ? a : b
            );

            // Check framing — face should occupy 25-65% of frame width
            const faceRatio = face.frame.width / photo.width;
            const faceCenterX = (face.frame.left + face.frame.width / 2) / photo.width;
            const faceCenterY = (face.frame.top + face.frame.height / 2) / photo.height;

            const isCentered =
                faceCenterX > 0.25 && faceCenterX < 0.75 &&
                faceCenterY > 0.20 && faceCenterY < 0.80;

            const isWellFramed = faceRatio > 0.20 && faceRatio < 0.70 && isCentered;

            if (!isWellFramed) {
                stableFrames.current = 0;
                eyesWereClosed.current = false;
                isBlinkValidated.current = false;

                if (faceRatio < 0.20) {
                    setState('searching');
                    setStatusMessage('Acércate más a la cámara');
                } else if (faceRatio > 0.70) {
                    setState('searching');
                    setStatusMessage('Aléjate un poco');
                } else {
                    setState('searching');
                    setStatusMessage('Centra tu rostro en el círculo');
                }
                return;
            }

            // Face is well-framed, increment stable counter
            stableFrames.current += 1;

            if (stableFrames.current < STABLE_THRESHOLD) {
                setState('detected');
                setStatusMessage('Rostro detectado');
                return;
            }

            // Stable enough → prompt for blink
            setState('blink_prompt');
            setStatusMessage('Parpadea para verificar');

            // Check blink: leftEyeOpenProbability and rightEyeOpenProbability
            const leftEye = face.leftEyeOpenProbability ?? 1;
            const rightEye = face.rightEyeOpenProbability ?? 1;

            const eyesClosed = leftEye < 0.3 && rightEye < 0.3;
            const eyesOpen = leftEye > 0.6 && rightEye > 0.6;

            if (eyesClosed && !isBlinkValidated.current) {
                eyesWereClosed.current = true;
            }

            if (!isBlinkValidated.current) {
                if (eyesWereClosed.current && eyesOpen) {
                    // Blink confirmed! Wait for them to look at the camera
                    isBlinkValidated.current = true;
                    eyesWereClosed.current = false;
                    setState('look_camera');
                    setStatusMessage('Mira fijamente a la cámara');
                    return;
                }
            } else {
                setState('look_camera');
                setStatusMessage('Mira fijamente a la cámara');

                // Check if user is looking at the camera
                const yaw = face.rotationY ?? 0;
                const pitch = face.rotationX ?? 0;

                // Allow a small margin of error for looking straight
                const isLookingStraight = Math.abs(yaw) < 12 && Math.abs(pitch) < 12;

                if (isLookingStraight && eyesOpen) {
                    // Verification complete!
                    setState('verified');
                    setStatusMessage('¡Verificación completada!');

                    // We need to stop further calls until captured
                    isBlinkValidated.current = false;

                    // Small delay so the user sees "verified" before capture
                    setTimeout(async () => {
                        try {
                            const finalPhoto = await cameraRef.current?.takePhoto({
                                flash: 'off',
                                enableShutterSound: false,
                            });
                            if (finalPhoto?.path) {
                                setCapturedUri(`file://${finalPhoto.path}`);
                                setState('captured');
                                setStatusMessage('¡Foto capturada!');
                            }
                        } catch {
                            // Fallback: use the analysis photo
                            setCapturedUri(uri);
                            setState('captured');
                            setStatusMessage('¡Foto capturada!');
                        }
                    }, 400);
                }
            }
        } catch (e: any) {
            const errMsg = e?.message || String(e);
            // Ignore transient camera errors
            if (
                errMsg.includes('Failed to submit capture request') ||
                errMsg.includes('Camera is not running') ||
                errMsg.includes('invalid-output-configuration') ||
                errMsg.includes('Camera is closed')
            ) {
                return;
            }
            console.warn('[FaceDetection] Error:', errMsg);
        }
    }, []);

    useEffect(() => {
        if (state === 'captured' || state === 'verified') return;

        intervalRef.current = setInterval(async () => {
            if (isAnalyzing.current || (state as string) === 'captured' || (state as string) === 'verified') return;
            isAnalyzing.current = true;
            await analyzeFrame();
            isAnalyzing.current = false;
        }, 400);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [state, analyzeFrame]);

    const reset = useCallback(() => {
        setState('searching');
        setCapturedUri(null);
        setStatusMessage('Buscando rostro...');
        stableFrames.current = 0;
        eyesWereClosed.current = false;
        isBlinkValidated.current = false;
    }, []);

    return {
        hasPermission,
        requestPermission,
        cameraRef,
        device,
        state,
        capturedUri,
        statusMessage,
        reset,
    };
}
