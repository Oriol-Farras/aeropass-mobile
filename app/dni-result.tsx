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
                router.push({
                    pathname: '/face-instructions',
                    params: { dni: JSON.stringify(editedDni) }
                });
            }}
            onCancel={() => {
                // Go back to the scan screen
                router.back();
            }}
        />
    );
}
