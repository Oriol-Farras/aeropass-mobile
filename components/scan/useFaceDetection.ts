import { useCallback, useEffect, useRef, useState } from 'react';
import FaceDetection from '@react-native-ml-kit/face-detection';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

export type FaceScanState = 'searching' | 'detected' | 'blink_prompt' | 'look_camera' | 'verified' | 'captured' | 'comparing' | 'match' | 'no_match';

interface UseFaceDetectionProps {
    dniPhoto?: string | null;
}

export function useFaceDetection({ dniPhoto }: UseFaceDetectionProps = {}) {
    const { hasPermission, requestPermission } = useCameraPermission();
    const cameraRef = useRef<Camera>(null);
    const device = useCameraDevice('front');

    const [state, setState] = useState<FaceScanState>('searching');
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState('Buscando rostro...');

    const isAnalyzing = useRef(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const dniPhotoRef = useRef(dniPhoto);
    useEffect(() => {
        dniPhotoRef.current = dniPhoto;
    }, [dniPhoto]);

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
                        let finalUri = uri;
                        try {
                            const finalPhoto = await cameraRef.current?.takePhoto({
                                flash: 'off',
                                enableShutterSound: false,
                            });
                            if (finalPhoto?.path) {
                                finalUri = `file://${finalPhoto.path}`;
                            }
                        } catch {
                            // Fallback to analysis photo if takePhoto fails
                        }

                        setCapturedUri(finalUri);

                        if (!dniPhotoRef.current) {
                            console.log("[Face++] Saltando API: No hay dniPhoto disponible.");
                            setState('captured');
                            setStatusMessage('¡Foto capturada!');
                            return;
                        }

                        // Face++ Comparison
                        console.log('\n[Face++] Empezando verificación facial con la API Compare...');
                        setState('comparing');
                        setStatusMessage('Comparando con tu DNI...');

                        try {
                            const apiKey = process.env.EXPO_PUBLIC_FACEPLUSPLUS_API_KEY;
                            const apiSecret = process.env.EXPO_PUBLIC_FACEPLUSPLUS_API_SECRET;

                            if (!apiKey || !apiSecret) {
                                throw new Error('API Keys no configuradas en el .env');
                            }

                            const formData = new FormData();
                            formData.append('api_key', apiKey);
                            formData.append('api_secret', apiSecret);

                            // Appending files for React Native FormData
                            formData.append('image_file1', {
                                uri: finalUri,
                                name: 'face.jpg',
                                type: 'image/jpeg',
                            } as any);

                            formData.append('image_file2', {
                                uri: dniPhotoRef.current,
                                name: 'dni.jpg',
                                type: 'image/jpeg',
                            } as any);

                            console.log('[Face++] Enviando petición POST a https://api-us.faceplusplus.com/facepp/v3/compare...');
                            const response = await fetch('https://api-us.faceplusplus.com/facepp/v3/compare', {
                                method: 'POST',
                                body: formData,
                            });

                            const result = await response.json();

                            if (result.error_message) {
                                throw new Error(`API Error: ${result.error_message}`);
                            }

                            const confidence = result.confidence || 0;
                            const threshold = result.thresholds?.['1e-4'] || 70; // Recommended threshold

                            console.log(`[Face++] Respuesta Recibida - Confianza: ${confidence} / Umbral 1e-4: ${threshold}`);

                            if (confidence >= threshold) {
                                console.log('[Face++] ✅ ¡Identidad verificada! Match exitoso.');
                                setState('match');
                                setStatusMessage('¡Identidad verificada!');
                            } else {
                                setState('no_match');
                                setStatusMessage('No coincide con el DNI');
                            }
                        } catch (error) {
                            console.warn('[Face++] Error en la comparación:', error);
                            // On error, let the user see the photo but mark as no Match to be safe,
                            // or leave as captured to let manual continue? Let's say no match for safety
                            setState('no_match');
                            setStatusMessage('Error al verificar identidad');
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
        if (['captured', 'verified', 'comparing', 'match', 'no_match'].includes(state)) return;

        intervalRef.current = setInterval(async () => {
            if (isAnalyzing.current || ['captured', 'verified', 'comparing', 'match', 'no_match'].includes(state as string)) return;
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
