import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

import DNIResultScreen, { DNIData } from '@/components/scan/DNIResultScreen';

export default function DniResultRoute() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Parse the DNI object passed via route params
    let dni: DNIData | null = null;
    try {
        dni = JSON.parse(params.dni as string);
    } catch (e) {
        console.error("Failed to parse DNI params");
    }

    if (!dni) {
        return null; // Fallback if data is missing
    }

    return (
        <DNIResultScreen
            dni={dni}
            onConfirm={(editedDni) => {
                // Here we clean up and go to home, mimicking onAcceptDni from useScanScreen
                // By default the router can go back to the top or home
                router.dismissAll();
                router.replace('/(tabs)');
            }}
            onCancel={() => {
                // Go back to the scan screen
                router.back();
            }}
        />
    );
}
