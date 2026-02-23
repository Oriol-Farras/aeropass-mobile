import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';

import { styles } from '@/components/scan/ScanScreen.styles';

export default function ScanScreen() {
    const router = useRouter();
    const [flashOn, setFlashOn] = useState(false);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#141414" />

            {/* ── TOP BAR ── */}
            <View style={styles.topBar}>
                {/* Cerrar */}
                <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                    <MaterialIcons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>

                {/* Título */}
                <View style={styles.titlePill}>
                    <Text style={styles.titlePillText}>AEROPASS ID CHECK</Text>
                </View>

                {/* Flash */}
                <TouchableOpacity style={styles.iconButton} onPress={() => setFlashOn(v => !v)}>
                    <MaterialIcons
                        name={flashOn ? 'flash-on' : 'flash-off'}
                        size={20}
                        color="#ffffff"
                    />
                </TouchableOpacity>
            </View>

            {/* ── HERO TEXT ── */}
            <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>Scan Document</Text>
                <Text style={styles.heroSubtitle}>
                    Align the back of your ID card. Ensure the{'\n'}MRZ code (the {'<<<'} lines) is visible.
                </Text>
            </View>

            {/* ── VIEWFINDER ── */}
            <View style={styles.viewfinderWrapper}>
                <View style={styles.viewfinder}>
                    {/* Placeholder cámara */}
                    <MaterialIcons
                        name="contact-page"
                        size={64}
                        color="rgba(255,255,255,0.3)"
                        style={styles.placeholderIcon}
                    />

                    {/* Esquinas del marco */}
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                </View>

                {/* Status pill */}
                <View style={styles.statusPill}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Looking for document...</Text>
                </View>
            </View>

            {/* ── BOTTOM BAR ── */}
            <View style={styles.bottomBar}>
                <View style={styles.bottomActions}>
                    {/* Gallery */}
                    <TouchableOpacity style={styles.bottomActionBtn}>
                        <View style={styles.bottomActionIcon}>
                            <MaterialIcons name="photo" size={24} color="#ffffff" />
                        </View>
                        <Text style={styles.bottomActionLabel}>GALLERY</Text>
                    </TouchableOpacity>

                    {/* Capture */}
                    <TouchableOpacity style={styles.captureButton} activeOpacity={0.85}>
                        <View style={styles.captureInner} />
                    </TouchableOpacity>

                    {/* Manual */}
                    <TouchableOpacity style={styles.bottomActionBtn}>
                        <View style={styles.bottomActionIcon}>
                            <MaterialIcons name="keyboard" size={24} color="#ffffff" />
                        </View>
                        <Text style={styles.bottomActionLabel}>MANUAL</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.poweredBy}>Powered by AeroPass Secure OCR</Text>
            </View>
        </SafeAreaView>
    );
}
