import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';

import { FingerprintIllustration } from '@/components/landing/FingerprintIllustration';
import { styles } from '@/components/landing/LandingScreen.styles';

export default function LandingScreen() {
    const router = useRouter();
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Zona superior: logo + textos */}
            <View style={styles.top}>
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <MaterialIcons name="flight" size={24} color="#000000" />
                    </View>
                </View>

                <View style={styles.heroText}>
                    <Text style={styles.title}>Travel{'\n'}Secure</Text>
                    <Text style={styles.subtitle}>Biometric Boarding System</Text>
                </View>
            </View>

            {/* Zona central: huella */}
            <View style={styles.middle}>
                <FingerprintIllustration />
            </View>

            {/* Zona inferior: botón + disclaimer */}
            <View style={styles.bottom}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push('/scan')}
                    style={styles.primaryButton}
                >
                    <Text style={styles.buttonText}>Start Identity Verification</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
                </TouchableOpacity>

                <Text style={styles.disclaimer}>Powered by AeroPass SecureID™</Text>
            </View>
        </SafeAreaView>
    );
}
