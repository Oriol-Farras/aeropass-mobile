import { useLocalSearchParams } from 'expo-router';
import FaceScanScreen from '@/components/scan/FaceScanScreen';
import { DNIData } from '@/components/scan/DNIResultScreen';

export default function FaceScan() {
    const params = useLocalSearchParams();

    let dni: DNIData | null = null;
    try {
        if (params.dni) {
            dni = JSON.parse(params.dni as string);
            console.log("Parsed DNI params in face-scan:", dni ? Object.keys(dni) : null);
            console.log("Photo available:", Boolean(dni?.photo));
        } else {
            console.log("NO params.dni AVAILABLE in face-scan!");
        }
    } catch (e) {
        console.error("Failed to parse DNI params in face scan");
    }

    return <FaceScanScreen dniPhoto={dni?.photo || null} />;
}
